#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SUPPORTED_LOCK_VERSION = 1;
const SUPPORTED_SCHEMA_VERSION = 1;
const ADAPTER_VERSION = '1.0.0';
const ARTIFACT_MANIFEST = 'onchainos-skills.manifest.json';
const DEFAULT_STORE = path.resolve(process.env.ONCHAINOS_SKILLS_ROOT || path.join(process.cwd(), 'var', 'onchainos-skills'));
const SECRET_PATTERN = /(?:private[_-]?key|mnemonic|seed[_-]?phrase|wallet[_-]?secret|signing[_-]?key)\s*[:=]/i;
const PRIVATE_KEY_BLOCK = /-----BEGIN (?:EC |RSA )?PRIVATE KEY-----/;

function updaterError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
}

function assert(condition, code, message) {
    if (!condition) throw updaterError(code, message);
}

function readJson(filename, code = 'INVALID_JSON') {
    try {
        return JSON.parse(fs.readFileSync(filename, 'utf8'));
    } catch (error) {
        if (error.code === 'ENOENT') throw updaterError(code, `Required JSON file does not exist: ${filename}`);
        throw updaterError(code, `Invalid JSON in ${filename}: ${error.message}`);
    }
}

function validateLock(lock) {
    assert(lock && typeof lock === 'object', 'INVALID_LOCK', 'Lock manifest must be an object');
    assert(lock.lockVersion === SUPPORTED_LOCK_VERSION, 'LOCK_VERSION_INCOMPATIBLE', `Supported lockVersion is ${SUPPORTED_LOCK_VERSION}`);
    assert(typeof lock.repository === 'string' && /^https:\/\//.test(lock.repository), 'INVALID_REPOSITORY', 'Repository must be an HTTPS URL');
    assert(typeof lock.commit === 'string' && /^[0-9a-f]{40}$/i.test(lock.commit), 'INVALID_COMMIT_PIN', 'commit must be a full 40-character Git commit SHA, not a branch or tag');
    assert(lock.artifact && typeof lock.artifact.source === 'string' && lock.artifact.source, 'INVALID_ARTIFACT_SOURCE', 'artifact.source is required');
    assert(/^[0-9a-f]{64}$/i.test(lock.artifact.sha256 || ''), 'INVALID_ARTIFACT_CHECKSUM', 'artifact.sha256 must be a complete SHA-256 checksum');
    assert(lock.compatibility?.schemaVersion === SUPPORTED_SCHEMA_VERSION, 'SCHEMA_INCOMPATIBLE', `Artifact schema must be ${SUPPORTED_SCHEMA_VERSION}`);
    assert(/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(lock.compatibility?.artifactVersion || ''), 'ARTIFACT_VERSION_INVALID', 'compatibility.artifactVersion must be a semantic version');
    const adapterMajor = String(lock.compatibility?.adapterVersion || '').split('.')[0];
    assert(adapterMajor === ADAPTER_VERSION.split('.')[0], 'ADAPTER_VERSION_INCOMPATIBLE', `Adapter major version must be ${ADAPTER_VERSION.split('.')[0]}`);

    const review = lock.licenseReview;
    assert(
        review?.approved === true &&
        review?.redistributionApproved === true &&
        typeof review.license === 'string' && review.license.trim() &&
        typeof review.reviewer === 'string' && review.reviewer.trim() &&
        Number.isFinite(Date.parse(review.reviewedAt)),
        'LICENSE_REVIEW_REQUIRED',
        'Promotion is blocked until licenseReview explicitly approves use and redistribution with license, reviewer, and reviewedAt'
    );
    return lock;
}

function walkFiles(root) {
    const files = [];
    function walk(directory) {
        const entries = fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
        for (const entry of entries) {
            const filename = path.join(directory, entry.name);
            if (entry.isSymbolicLink()) throw updaterError('ARTIFACT_SYMLINK_REJECTED', `Artifact contains a symbolic link: ${filename}`);
            if (entry.isDirectory()) walk(filename);
            else if (entry.isFile()) files.push(filename);
            else throw updaterError('ARTIFACT_FILE_TYPE_REJECTED', `Artifact contains an unsupported file type: ${filename}`);
        }
    }
    walk(root);
    return files;
}

function hashDirectory(root) {
    const hash = crypto.createHash('sha256');
    for (const filename of walkFiles(root)) {
        const relative = path.relative(root, filename).split(path.sep).join('/');
        hash.update(relative);
        hash.update('\0');
        hash.update(fs.readFileSync(filename));
        hash.update('\0');
    }
    return hash.digest('hex');
}

function copyDirectory(source, destination) {
    assert(fs.existsSync(source) && fs.statSync(source).isDirectory(), 'ARTIFACT_SOURCE_MISSING', `Local artifact directory does not exist: ${source}`);
    fs.mkdirSync(destination, { recursive: true, mode: 0o700 });
    for (const filename of walkFiles(source)) {
        const relative = path.relative(source, filename);
        const output = path.join(destination, relative);
        fs.mkdirSync(path.dirname(output), { recursive: true, mode: 0o700 });
        fs.copyFileSync(filename, output, fs.constants.COPYFILE_EXCL);
    }
}

async function download(url, destination) {
    const response = await fetch(url, { redirect: 'error' });
    assert(response.ok, 'ARTIFACT_DOWNLOAD_FAILED', `Artifact download returned HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(destination, bytes, { mode: 0o600, flag: 'wx' });
    return crypto.createHash('sha256').update(bytes).digest('hex');
}

function validateArchiveEntries(listing, verboseListing = '') {
    for (const entry of listing.split(/\r?\n/).filter(Boolean)) {
        const normalized = entry.replace(/\\/g, '/');
        assert(!normalized.startsWith('/') && !normalized.split('/').includes('..'), 'ARTIFACT_ARCHIVE_UNSAFE', `Archive contains an unsafe path: ${entry}`);
    }
    for (const line of verboseListing.split(/\r?\n/).filter(Boolean)) {
        const type = line[0];
        assert(type !== 'l' && type !== 'h', 'ARTIFACT_LINK_REJECTED', 'Archive contains a symbolic or hard link');
    }
}

function safeExtractTar(archive, destination) {
    let listing;
    let verboseListing;
    try {
        listing = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8', windowsHide: true });
        verboseListing = execFileSync('tar', ['-tvzf', archive], { encoding: 'utf8', windowsHide: true });
    } catch (error) {
        throw updaterError('ARTIFACT_ARCHIVE_INVALID', `Unable to inspect artifact archive: ${error.message}`);
    }
    validateArchiveEntries(listing, verboseListing);
    fs.mkdirSync(destination, { recursive: true, mode: 0o700 });
    try {
        execFileSync('tar', ['-xzf', archive, '-C', destination, '--no-same-owner', '--no-same-permissions'], { windowsHide: true });
    } catch (error) {
        throw updaterError('ARTIFACT_ARCHIVE_INVALID', `Unable to extract artifact archive: ${error.message}`);
    }
    walkFiles(destination);
}

function flattenSingleRoot(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    if (entries.length !== 1 || !entries[0].isDirectory()) return directory;
    return path.join(directory, entries[0].name);
}

async function stageArtifact(lock, stagingDirectory) {
    const contentDirectory = path.join(stagingDirectory, 'content');
    const source = lock.artifact.source;
    if (/^https:\/\//i.test(source)) {
        const archive = path.join(stagingDirectory, 'artifact.tar.gz');
        const archiveHash = await download(source, archive);
        assert(archiveHash === lock.artifact.sha256.toLowerCase(), 'ARTIFACT_CHECKSUM_MISMATCH', 'Downloaded artifact SHA-256 does not match lock manifest');
        safeExtractTar(archive, contentDirectory);
        fs.rmSync(archive, { force: true });
        return { directory: flattenSingleRoot(contentDirectory), artifactSha256: archiveHash, checksumType: 'archive' };
    }

    const localSource = path.resolve(source);
    copyDirectory(localSource, contentDirectory);
    const contentHash = hashDirectory(contentDirectory);
    assert(contentHash === lock.artifact.sha256.toLowerCase(), 'ARTIFACT_CHECKSUM_MISMATCH', 'Local artifact SHA-256 does not match lock manifest');
    return { directory: contentDirectory, artifactSha256: contentHash, checksumType: 'directory' };
}

function runStaticChecks(directory) {
    for (const filename of walkFiles(directory)) {
        const stats = fs.statSync(filename);
        assert(stats.size <= 10 * 1024 * 1024, 'ARTIFACT_FILE_TOO_LARGE', `Artifact file exceeds 10 MiB: ${filename}`);
        if (/\.(?:png|jpe?g|gif|webp|ico|zip|gz|pdf)$/i.test(filename)) continue;
        const content = fs.readFileSync(filename, 'utf8');
        if (SECRET_PATTERN.test(content) || PRIVATE_KEY_BLOCK.test(content)) {
            throw updaterError('WALLET_SECRET_DETECTED', `Static scan found a wallet-secret pattern in ${path.relative(directory, filename)}`);
        }
    }
}

function runContractChecks(directory, lock) {
    const filename = path.join(directory, ARTIFACT_MANIFEST);
    const manifest = readJson(filename, 'ARTIFACT_MANIFEST_INVALID');
    assert(manifest.schemaVersion === lock.compatibility.schemaVersion, 'SCHEMA_INCOMPATIBLE', 'Artifact manifest schemaVersion does not match lock');
    assert(manifest.commit === lock.commit, 'ARTIFACT_COMMIT_MISMATCH', 'Artifact manifest commit does not match pinned commit');
    assert(typeof manifest.version === 'string' && /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(manifest.version), 'ARTIFACT_VERSION_INVALID', 'Artifact manifest requires a semantic version');
    assert(manifest.version === lock.compatibility.artifactVersion, 'ARTIFACT_VERSION_MISMATCH', 'Artifact version does not match the version pinned in the lock');
    assert(Array.isArray(manifest.tools), 'ARTIFACT_CONTRACT_INVALID', 'Artifact manifest tools must be an array');
    const names = new Set();
    for (const tool of manifest.tools) {
        assert(tool && /^[a-zA-Z0-9_.-]+$/.test(tool.name || ''), 'ARTIFACT_CONTRACT_INVALID', 'Every artifact tool needs a valid name');
        assert(['read', 'write', 'onchain-write'].includes(tool.access), 'ARTIFACT_CONTRACT_INVALID', `Tool ${tool.name} needs explicit read/write access`);
        assert(!names.has(tool.name), 'ARTIFACT_CONTRACT_INVALID', `Duplicate tool name: ${tool.name}`);
        names.add(tool.name);
    }
    return manifest;
}

function atomicWriteJson(filename, value) {
    const temporary = `${filename}.${process.pid}.${crypto.randomUUID()}.tmp`;
    fs.mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
    fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
    fs.renameSync(temporary, filename);
}

function readPointer(root, name, required = false) {
    const filename = path.join(root, `${name}.json`);
    if (!fs.existsSync(filename)) {
        if (required) throw updaterError('CURRENT_POINTER_MISSING', `${name}.json does not exist`);
        return null;
    }
    return readJson(filename, 'POINTER_INVALID');
}

function validatePointerPath(root, pointer) {
    assert(pointer && typeof pointer.directory === 'string', 'POINTER_INVALID', 'Artifact pointer has no directory');
    const resolvedRoot = path.resolve(root);
    const resolved = path.resolve(root, pointer.directory);
    assert(resolved.startsWith(`${resolvedRoot}${path.sep}`), 'POINTER_INVALID', 'Artifact pointer escapes the artifact root');
    return resolved;
}

async function update(options = {}) {
    const lock = validateLock(options.lock || readJson(path.resolve(options.lockPath || 'config/onchainos-skills.lock.json'), 'LOCK_INVALID'));
    const root = path.resolve(options.root || DEFAULT_STORE);
    const stagingRoot = path.join(root, '.staging');
    const stagingDirectory = path.join(stagingRoot, `${lock.commit}-${crypto.randomUUID()}`);
    fs.mkdirSync(stagingDirectory, { recursive: true, mode: 0o700 });

    try {
        const staged = await stageArtifact(lock, stagingDirectory);
        runStaticChecks(staged.directory);
        const manifest = runContractChecks(staged.directory, lock);
        const contentSha256 = hashDirectory(staged.directory);
        const pointer = {
            lockVersion: lock.lockVersion,
            commit: lock.commit,
            version: manifest.version,
            schemaVersion: manifest.schemaVersion,
            artifactSha256: staged.artifactSha256,
            checksumType: staged.checksumType,
            contentSha256,
            directory: path.join('artifacts', `${lock.commit}-${contentSha256.slice(0, 16)}`).split(path.sep).join('/'),
            promotedAt: new Date().toISOString()
        };

        if (options.canary) {
            const canary = await options.canary({
                directory: staged.directory,
                commit: lock.commit,
                version: manifest.version,
                manifest
            });
            assert(canary === true || canary?.passed === true, 'CANARY_FAILED', canary?.reason || 'Staging canary failed');
        }

        if (options.checkOnly) return { status: 'checked', ...pointer };

        const finalDirectory = validatePointerPath(root, pointer);
        fs.mkdirSync(path.dirname(finalDirectory), { recursive: true, mode: 0o700 });
        if (!fs.existsSync(finalDirectory)) {
            fs.renameSync(staged.directory, finalDirectory);
        } else {
            assert(hashDirectory(finalDirectory) === contentSha256, 'EXISTING_ARTIFACT_MISMATCH', 'Existing versioned artifact has unexpected content');
        }

        const current = readPointer(root, 'current');
        if (current) atomicWriteJson(path.join(root, 'previous.json'), current);
        atomicWriteJson(path.join(root, 'current.json'), pointer);
        return { status: 'promoted', ...pointer };
    } finally {
        fs.rmSync(stagingDirectory, { recursive: true, force: true });
        fs.mkdirSync(stagingRoot, { recursive: true, mode: 0o700 });
    }
}

async function verifyCurrent(options = {}) {
    const root = path.resolve(options.root || DEFAULT_STORE);
    const pointer = readPointer(root, 'current', true);
    const directory = validatePointerPath(root, pointer);
    assert(fs.existsSync(directory) && fs.statSync(directory).isDirectory(), 'CURRENT_ARTIFACT_MISSING', 'Current artifact directory does not exist');
    const actual = hashDirectory(directory);
    assert(actual === pointer.contentSha256, 'CURRENT_CONTENT_MISMATCH', 'Current artifact content SHA-256 does not match pointer');
    const manifest = readJson(path.join(directory, ARTIFACT_MANIFEST), 'ARTIFACT_MANIFEST_INVALID');
    assert(manifest.commit === pointer.commit && manifest.schemaVersion === pointer.schemaVersion && manifest.version === pointer.version, 'CURRENT_MANIFEST_MISMATCH', 'Current artifact manifest does not match pointer');
    return { status: 'verified', ...pointer };
}

async function rollback(options = {}) {
    const root = path.resolve(options.root || DEFAULT_STORE);
    const current = readPointer(root, 'current', true);
    const previous = readPointer(root, 'previous');
    assert(previous, 'PREVIOUS_POINTER_MISSING', 'No previous OnchainOS artifact is available for rollback');
    const previousDirectory = validatePointerPath(root, previous);
    assert(fs.existsSync(previousDirectory), 'PREVIOUS_ARTIFACT_MISSING', 'Previous artifact directory does not exist');
    assert(hashDirectory(previousDirectory) === previous.contentSha256, 'PREVIOUS_CONTENT_MISMATCH', 'Previous artifact checksum does not match pointer');
    atomicWriteJson(path.join(root, 'current.json'), { ...previous, promotedAt: new Date().toISOString(), rollbackFrom: current.commit });
    atomicWriteJson(path.join(root, 'previous.json'), current);
    return { status: 'rolled_back', ...readPointer(root, 'current', true) };
}

function parseArguments(argv) {
    const result = {};
    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];
        if (argument === '--check') result.checkOnly = true;
        else if (argument === '--verify-current') result.verify = true;
        else if (argument === '--rollback') result.rollback = true;
        else if (argument === '--lock') result.lockPath = argv[++index];
        else if (argument === '--root') result.root = argv[++index];
        else throw updaterError('INVALID_ARGUMENT', `Unknown argument: ${argument}`);
    }
    return result;
}

async function main() {
    try {
        const options = parseArguments(process.argv.slice(2));
        let result;
        if (options.verify) result = await verifyCurrent(options);
        else if (options.rollback) result = await rollback(options);
        else result = await update(options);
        process.stdout.write(`${JSON.stringify(result)}\n`);
    } catch (error) {
        process.stderr.write(`${JSON.stringify({ status: 'refused', code: error.code || 'UPDATE_FAILED', message: error.message })}\n`);
        process.exitCode = 1;
    }
}

if (require.main === module) main();

module.exports = {
    ADAPTER_VERSION,
    SUPPORTED_SCHEMA_VERSION,
    hashDirectory,
    validateLock,
    runStaticChecks,
    runContractChecks,
    validateArchiveEntries,
    update,
    verifyCurrent,
    rollback
};
