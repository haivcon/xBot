import { Preferences } from '@capacitor/preferences';
import CryptoJS from 'crypto-js';

const STORAGE_KEYS = {
    WALLETS: 'xbot_wallets',
    API_KEY: 'xbot_api_key',
    HAS_PIN: 'xbot_has_pin'
};

/**
 * Encrypt data before saving to preferences
 */
const encryptData = (data, pin) => {
    if (!pin) throw new Error("PIN required for encryption");
    return CryptoJS.AES.encrypt(JSON.stringify(data), pin).toString();
};

/**
 * Decrypt data retrieved from preferences
 */
const decryptData = (cipherText, pin) => {
    if (!pin) throw new Error("PIN required for decryption");
    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, pin);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedStr) throw new Error("Invalid PIN");
        return JSON.parse(decryptedStr);
    } catch (e) {
        throw new Error("Invalid PIN or corrupted data");
    }
};

/**
 * Save encrypted wallets
 */
export const saveWallets = async (wallets, pin) => {
    try {
        const encrypted = encryptData(wallets, pin);
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
export const loadWallets = async (pin) => {
    const { value } = await Preferences.get({ key: STORAGE_KEYS.WALLETS });
    if (!value) return []; // No saved wallets
    return decryptData(value, pin);
};

/**
 * Save API Key (Encrypted with PIN for security)
 */
export const saveApiKey = async (apiKey, pin) => {
    try {
        const encrypted = encryptData(apiKey, pin);
        await Preferences.set({ key: STORAGE_KEYS.API_KEY, value: encrypted });
        return true;
    } catch (e) {
        console.error('Failed to save API key', e);
        return false;
    }
};

/**
 * Load API Key
 */
export const loadApiKey = async (pin) => {
    const { value } = await Preferences.get({ key: STORAGE_KEYS.API_KEY });
    if (!value) return '';
    return decryptData(value, pin);
};

/**
 * PIN Management
 */
export const setHasPin = async (hasPin) => {
    await Preferences.set({ key: STORAGE_KEYS.HAS_PIN, value: hasPin ? 'true' : 'false' });
};

export const getHasPin = async () => {
    const { value } = await Preferences.get({ key: STORAGE_KEYS.HAS_PIN });
    return value === 'true';
};

/**
 * Validate PIN by trying to decrypt a test string or just trying to decrypt the API Key / Wallets
 * We'll use a specific TEST key to validate if a PIN is correct during login
 */
export const savePinVerification = async (pin) => {
    const encrypted = encryptData('valid', pin);
    await Preferences.set({ key: 'xbot_pin_verify', value: encrypted });
    await setHasPin(true);
};

export const verifyPin = async (pin) => {
    const { value } = await Preferences.get({ key: 'xbot_pin_verify' });
    if (!value) return false;
    try {
        const decrypted = decryptData(value, pin);
        return decrypted === 'valid';
    } catch (e) {
        return false;
    }
};

/**
 * Panic Button - Wipe all data
 */
export const wipeAllData = async () => {
    await Preferences.clear();
};
