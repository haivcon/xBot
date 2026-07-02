/**
 * User AI key resolver for xBot AI Router.
 *
 * Uses the existing user_ai_keys table through db/ai.js. Keys are returned only
 * to server-side routing code and are masked for status/API responses.
 */
const db = require('../../../db');
const { normalizeProvider } = require('./providers');

function maskKey(apiKey) {
    const key = String(apiKey || '');
    if (!key) return '';
    if (key.length <= 10) return `${key.slice(0, 2)}***${key.slice(-2)}`;
    return `${key.slice(0, 6)}***${key.slice(-4)}`;
}

async function listUserProviderKeys(userId, provider = null, { includeSecret = false } = {}) {
    if (!userId) return [];
    const normalizedProvider = provider ? normalizeProvider(provider) : null;
    const rows = await db.listUserAiKeys(String(userId), normalizedProvider);
    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        provider: normalizeProvider(row.provider) || row.provider,
        createdAt: row.createdAt,
        apiKey: includeSecret ? row.apiKey : undefined,
        maskedApiKey: maskKey(row.apiKey)
    }));
}

async function addUserProviderKey(userId, provider, apiKey, name = null) {
    const normalizedProvider = normalizeProvider(provider) || 'google';
    return db.addUserAiKey(String(userId), name || normalizedProvider, apiKey, normalizedProvider);
}

async function deleteUserProviderKey(userId, keyId) {
    return db.deleteUserAiKey(String(userId), keyId);
}

async function deleteUserProviderKeys(userId, provider = null) {
    if (!provider) return db.deleteUserAiKeys(String(userId));

    const keys = await listUserProviderKeys(userId, provider, { includeSecret: true });
    let deleted = 0;
    for (const key of keys) {
        const result = await db.deleteUserAiKey(String(userId), key.id);
        if (result.deleted) deleted += 1;
    }
    return { deleted };
}

async function getUserPreferredProvider(userId) {
    const provider = userId ? await db.getUserAiProvider(String(userId)) : null;
    return normalizeProvider(provider);
}

async function setUserPreferredProvider(userId, provider) {
    return db.setUserAiProvider(String(userId), normalizeProvider(provider));
}

async function resolveUserKey(userId, provider) {
    const keys = await listUserProviderKeys(userId, provider, { includeSecret: true });
    if (!keys.length) return null;
    const selected = keys[Math.floor(Math.random() * keys.length)];
    return {
        ...selected,
        source: 'user_key'
    };
}

module.exports = {
    maskKey,
    listUserProviderKeys,
    addUserProviderKey,
    deleteUserProviderKey,
    deleteUserProviderKeys,
    getUserPreferredProvider,
    setUserPreferredProvider,
    resolveUserKey
};