const { OKX_API_CREDENTIALS } = require('../config');
const logger = require('../core/logger');
const log = logger.child('OKX_KeyMgr');

class OkxKeyManager {
    constructor(credentials) {
        this.credentials = credentials || [];
        this.currentIndex = 0;
        this.failedKeys = new Map(); // apiKey -> timestamp of failure
        this.COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown for rate limits
    }

    getCredentials() {
        if (this.credentials.length === 0) {
            return null;
        }

        // Try to find a non-failed key starting from currentIndex
        const startIndex = this.currentIndex;
        let loops = 0;

        while (loops < this.credentials.length) {
            const currentCred = this.credentials[this.currentIndex];
            const failedAt = this.failedKeys.get(currentCred.apiKey);

            if (!failedAt || (Date.now() - failedAt > this.COOLDOWN_MS)) {
                // Key is good or cooldown expired
                if (failedAt) {
                    this.failedKeys.delete(currentCred.apiKey);
                    log.info(`API Key ${this.maskKey(currentCred.apiKey)} recovered from cooldown.`);
                }
                return currentCred;
            }

            // Key is still in cooldown, try next
            this.currentIndex = (this.currentIndex + 1) % this.credentials.length;
            loops++;
        }

        // If we reach here, ALL keys are in cooldown.
        // We throw an explicit error to pause OKX requests and notify user.
        throw new Error('ALL_OKX_KEYS_EXHAUSTED');
    }

    rotate(apiKey, reason = 'Rate limit or error') {
        if (this.credentials.length <= 1) {
            log.warn(`Cannot rotate: only ${this.credentials.length} key(s) available.`);
            // Still mark as failed so it triggers the ALL_EXHAUSTED error
            this.failedKeys.set(apiKey, Date.now());
            return;
        }

        // Fix Race Condition: Prevent jumping over keys if multiple requests fail concurrently
        if (this.credentials[this.currentIndex].apiKey !== apiKey) {
            this.failedKeys.set(apiKey, Date.now());
            return;
        }

        log.warn(`Rotating OKX API Key ${this.maskKey(apiKey)} due to: ${reason}`);
        this.failedKeys.set(apiKey, Date.now());
        
        // Advance index
        this.currentIndex = (this.currentIndex + 1) % this.credentials.length;
        
        const nextCred = this.credentials[this.currentIndex];
        log.info(`Switched to OKX API Key ${this.maskKey(nextCred.apiKey)}`);
    }

    maskKey(key) {
        if (!key) return 'unknown';
        if (key.length <= 8) return '***';
        return key.substring(0, 4) + '...' + key.substring(key.length - 4);
    }
}

const okxKeyManager = new OkxKeyManager(OKX_API_CREDENTIALS);
module.exports = okxKeyManager;
