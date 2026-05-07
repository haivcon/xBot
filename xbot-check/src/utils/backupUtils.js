import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import CryptoJS from 'crypto-js';

const encryptBackup = (data, key) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
};

const decryptBackup = (cipherText, key) => {
    const bytes = CryptoJS.AES.decrypt(cipherText, key);
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedStr) throw new Error("Invalid Key");
    return JSON.parse(decryptedStr);
};

// Existing: Device-locked backup (uses device AES key)
export const exportVaultBackup = async (wallets, config, aesKey) => {
    try {
        const backupPayload = {
            version: 2,
            portable: false,
            timestamp: new Date().toISOString(),
            wallets,
            config
        };

        const encryptedData = encryptBackup(backupPayload, aesKey);
        const fileName = `xbot_vault_${new Date().getTime()}.xbot`;

        const fileResult = await Filesystem.writeFile({
            path: fileName,
            data: encryptedData,
            directory: Directory.Cache,
            encoding: Encoding.UTF8
        });

        await Share.share({
            title: 'XBOT Vault Backup',
            text: 'Here is your encrypted XBOT vault backup.',
            url: fileResult.uri,
            dialogTitle: 'Save Vault Backup'
        });

        return true;
    } catch (e) {
        console.error("Backup export failed", e);
        return false;
    }
};

// #14: Portable backup (uses user-chosen password)
export const exportPortableBackup = async (wallets, config, userPassword) => {
    try {
        const backupPayload = {
            version: 2,
            portable: true,
            timestamp: new Date().toISOString(),
            wallets,
            config
        };

        const encryptedData = encryptBackup(backupPayload, userPassword);
        const fileName = `xbot_portable_${new Date().getTime()}.xbot`;

        const fileResult = await Filesystem.writeFile({
            path: fileName,
            data: encryptedData,
            directory: Directory.Cache,
            encoding: Encoding.UTF8
        });

        await Share.share({
            title: 'XBOT Portable Backup',
            text: 'Password-protected XBOT vault backup. Can be restored on any device.',
            url: fileResult.uri,
            dialogTitle: 'Save Portable Backup'
        });

        return true;
    } catch (e) {
        console.error("Portable backup export failed", e);
        return false;
    }
};

// Parse backup file — auto-detect format
export const parseVaultBackupFile = async (base64Data, aesKey, userPassword = null) => {
    try {
        const binString = atob(base64Data);
        const bytes = new Uint8Array(binString.length);
        for (let i = 0; i < binString.length; i++) {
            bytes[i] = binString.charCodeAt(i);
        }
        const encryptedText = new TextDecoder().decode(bytes);

        // Try device key first
        let decrypted = null;
        try {
            decrypted = decryptBackup(encryptedText, aesKey);
        } catch {
            // Device key failed — may be portable
        }

        // If device key worked but it's marked portable, or device key failed
        if (!decrypted && userPassword) {
            decrypted = decryptBackup(encryptedText, userPassword);
        }

        if (!decrypted) {
            throw new Error("Could not decrypt. Try providing a password for portable backups.");
        }

        if (!decrypted.wallets || !Array.isArray(decrypted.wallets)) {
            throw new Error("Invalid backup format");
        }

        return decrypted;
    } catch (e) {
        console.error("Backup import failed", e);
        throw new Error(e.message || "Failed to decrypt backup. Are you using the correct device / password?");
    }
};
