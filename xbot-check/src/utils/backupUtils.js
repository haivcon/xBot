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

export const exportVaultBackup = async (wallets, config, aesKey) => {
    try {
        const backupPayload = {
            version: 1,
            timestamp: new Date().toISOString(),
            wallets,
            config
        };

        const encryptedData = encryptBackup(backupPayload, aesKey);
        const fileName = `xbot_vault_${new Date().getTime()}.xbot`;

        // Write to Cache dir temporarily
        const fileResult = await Filesystem.writeFile({
            path: fileName,
            data: encryptedData,
            directory: Directory.Cache,
            encoding: Encoding.UTF8
        });

        // Share the file natively
        await Share.share({
            title: 'XBOT Vault Backup',
            text: 'Here is your encrypted XBOT Két sắt backup.',
            url: fileResult.uri,
            dialogTitle: 'Save Vault Backup'
        });

        return true;
    } catch (e) {
        console.error("Backup export failed", e);
        return false;
    }
};

export const parseVaultBackupFile = async (base64Data, aesKey) => {
    try {
        // Decode base64 to string
        const binString = atob(base64Data);
        const bytes = new Uint8Array(binString.length);
        for (let i = 0; i < binString.length; i++) {
            bytes[i] = binString.charCodeAt(i);
        }
        const encryptedText = new TextDecoder().decode(bytes);

        const decrypted = decryptBackup(encryptedText, aesKey);
        
        if (!decrypted.wallets || !Array.isArray(decrypted.wallets)) {
            throw new Error("Invalid backup format");
        }
        
        return decrypted;
    } catch (e) {
        console.error("Backup import failed", e);
        throw new Error("Failed to decrypt backup. Are you using the correct device / PIN?");
    }
};
