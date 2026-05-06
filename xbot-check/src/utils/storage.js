import { Preferences } from '@capacitor/preferences';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import CryptoJS from 'crypto-js';

const STORAGE_KEYS = {
    WALLETS: 'xbot_wallets',
    API_KEY: 'xbot_api_key',
    TX_HISTORY: 'xbot_tx_history',
    AES_KEY_FALLBACK: 'xbot_aes_fallback'
};

const BIOMETRIC_SERVER = 'app.xbot.check';
const BIOMETRIC_USER = 'xbot_vault';

/**
 * Generate a random 32-char string for AES
 */
const generateRandomKey = () => {
    return CryptoJS.lib.WordArray.random(32).toString();
};

/**
 * Retrieve the AES Encryption Key
 * Triggers native Biometric/Lock Screen if available.
 * If no lock screen is set on the device, it falls back to standard Preferences.
 */
export const getEncryptionKey = async () => {
    try {
        const available = await NativeBiometric.isAvailable();
        
        if (available.isAvailable) {
            try {
                // Force the native authentication prompt
                await NativeBiometric.verifyIdentity({
                    reason: "Unlock XBOT Vault",
                    title: "Vault Authentication",
                    subtitle: "Log in using your biometric credential",
                    useFallback: true // Allows device PIN if biometrics fail
                });

                // Try to get existing key
                const creds = await NativeBiometric.getCredentials({
                    server: BIOMETRIC_SERVER
                });
                return creds.password;
            } catch (err) {
                // If ItemNotFound or similar, create a new one
                const msg = (err.message || '').toLowerCase();
                const code = (err.code || '').toLowerCase();
                
                if (msg.includes('itemnotfound') || msg.includes('not found') || msg.includes('no credentials') || code === 'itemnotfound') {
                    const newKey = generateRandomKey();
                    await NativeBiometric.setCredentials({
                        username: BIOMETRIC_USER,
                        password: newKey,
                        server: BIOMETRIC_SERVER
                    });
                    return newKey;
                }
                // If user canceled the prompt or auth failed
                throw new Error("Biometric authentication failed or canceled.");
            }
        } else {
            // Device has no lock screen / biometrics. Use standard Preferences.
            const { value } = await Preferences.get({ key: STORAGE_KEYS.AES_KEY_FALLBACK });
            if (value) return value;
            
            const newKey = generateRandomKey();
            await Preferences.set({ key: STORAGE_KEYS.AES_KEY_FALLBACK, value: newKey });
            return newKey;
        }
    } catch (e) {
        console.error("Encryption key retrieval error:", e);
        throw e;
    }
};

/**
 * Encrypt data before saving to preferences
 */
const encryptData = (data, key) => {
    if (!key) throw new Error("Key required for encryption");
    return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
};

/**
 * Decrypt data retrieved from preferences
 */
const decryptData = (cipherText, key) => {
    if (!key) throw new Error("Key required for decryption");
    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, key);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedStr) throw new Error("Invalid Key");
        return JSON.parse(decryptedStr);
    } catch (e) {
        throw new Error("Invalid Key or corrupted data");
    }
};

/**
 * Save encrypted wallets
 */
export const saveWallets = async (wallets, key) => {
    try {
        const encrypted = encryptData(wallets, key);
        await Preferences.set({ key: STORAGE_KEYS.WALLETS, value: encrypted });
        return true;
    } catch (e) {
        console.error('Failed to save wallets', e);
        return false;
    }
};

/**
 * Load encrypted wallets
 */
export const loadWallets = async (key) => {
    const { value } = await Preferences.get({ key: STORAGE_KEYS.WALLETS });
    if (!value) return [];
    return decryptData(value, key);
};

/**
 * Save OKX API Configuration
 */
export const saveApiConfig = async (config, key) => {
    try {
        const encrypted = encryptData(config, key);
        await Preferences.set({ key: STORAGE_KEYS.API_KEY, value: encrypted });
        return true;
    } catch (e) {
        console.error('Failed to save API config', e);
        return false;
    }
};

/**
 * Load OKX API Configuration
 */
export const loadApiConfig = async (key) => {
    const { value } = await Preferences.get({ key: STORAGE_KEYS.API_KEY });
    if (!value) return { apiKey: '', secretKey: '', passphrase: '' };
    return decryptData(value, key);
};

/**
 * Save a transaction record
 */
export const saveTxRecord = async (tx, key) => {
    try {
        const history = await loadTxHistory(key);
        history.unshift(tx); // newest first
        // Keep max 200 records
        const trimmed = history.slice(0, 200);
        const encrypted = encryptData(trimmed, key);
        await Preferences.set({ key: STORAGE_KEYS.TX_HISTORY, value: encrypted });
        return true;
    } catch (e) {
        console.error('Failed to save tx record', e);
        return false;
    }
};

/**
 * Load transaction history
 */
export const loadTxHistory = async (key) => {
    try {
        const { value } = await Preferences.get({ key: STORAGE_KEYS.TX_HISTORY });
        if (!value) return [];
        return decryptData(value, key);
    } catch (e) {
        return [];
    }
};

/**
 * Wipe all data
 */
export const wipeAllData = async () => {
    await Preferences.clear();
    try {
        await NativeBiometric.deleteCredentials({ server: BIOMETRIC_SERVER });
    } catch(e) {
        // Ignore if credential doesn't exist
    }
};
