import CryptoJS from 'crypto-js';

const OKX_BASE_URL = 'https://web3.okx.com';

// Chain indices used by OKX OnchainOS
const DEFAULT_CHAINS = '1,56,196,42161'; // ETH, BSC, XLayer, Arbitrum

const generateSignature = (timestamp, method, requestPath, body, secretKey) => {
    const prehashString = timestamp + method.toUpperCase() + requestPath + (body ? JSON.stringify(body) : '');
    return CryptoJS.HmacSHA256(prehashString, secretKey).toString(CryptoJS.enc.Base64);
};

/**
 * Sleep helper
 */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Make an authenticated OKX API request with retry on rate limit.
 * Retries up to 3 times with exponential backoff on HTTP 429.
 */
const okxFetch = async (requestPath, config, retries = 3) => {
    const { apiKey, secretKey, passphrase } = config;

    for (let attempt = 0; attempt <= retries; attempt++) {
        const timestamp = new Date().toISOString();
        const sign = generateSignature(timestamp, 'GET', requestPath, '', secretKey);

        const response = await fetch(`${OKX_BASE_URL}${requestPath}`, {
            method: 'GET',
            headers: {
                'OK-ACCESS-KEY': apiKey,
                'OK-ACCESS-SIGN': sign,
                'OK-ACCESS-TIMESTAMP': timestamp,
                'OK-ACCESS-PASSPHRASE': passphrase,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        // Rate limited — retry with exponential backoff
        if (response.status === 429 && attempt < retries) {
            const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
            console.warn(`OKX rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
            await sleep(delay);
            continue;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OKX API Error: ${response.status} - ${errorData.msg || response.statusText}`);
        }

        return await response.json();
    }
};

/**
 * Fetch all token balances for a single address across multiple chains.
 * Uses the correct OnchainOS endpoint: /api/v5/wallet/asset/all-token-balances-by-address
 */
export const fetchWalletBalances = async (address, config) => {
    const { apiKey, secretKey, passphrase } = config;
    if (!apiKey || !secretKey || !passphrase) {
        throw new Error("Missing OKX API configuration");
    }

    const requestPath = `/api/v5/wallet/asset/all-token-balances-by-address?address=${address}&chains=${DEFAULT_CHAINS}`;

    try {
        const json = await okxFetch(requestPath, config);

        if (json.code === '0' && json.data && json.data.length > 0) {
            const allTokens = json.data[0].tokenAssets || [];

            // Calculate total USD value from individual tokens
            let totalUsdValue = 0;
            const tokenAssets = allTokens
                .filter(t => !t.isRiskToken) // filter scam airdrops
                .map(t => {
                    const balance = parseFloat(t.balance || '0');
                    const price = parseFloat(t.tokenPrice || '0');
                    const usdValue = balance * price;
                    totalUsdValue += usdValue;

                    return {
                        symbol: t.symbol || '?',
                        balance: t.balance || '0',
                        usdValue: usdValue > 0 ? usdValue.toFixed(2) : '',
                        logoUrl: t.tokenLogo || '',
                        tokenAddress: t.tokenAddress || '',
                        chainIndex: t.chainIndex || '',
                    };
                })
                .filter(t => parseFloat(t.balance) > 0); // only show non-zero

            return { totalUsdValue: totalUsdValue.toFixed(2), tokenAssets };
        } else {
            // No data = empty wallet, not an error
            return { totalUsdValue: '0.00', tokenAssets: [] };
        }
    } catch (e) {
        console.error("Balance fetch error:", e);
        throw e;
    }
};

/**
 * Fetch balances for multiple addresses in batched groups.
 * Reduces N calls to ceil(N/batchSize) calls with proper rate limiting.
 *
 * @param {string[]} addresses - Array of wallet addresses
 * @param {object} config - OKX API config
 * @param {number} batchSize - Addresses per batch (default 10)
 * @param {function} onProgress - Callback (completed, total) for progress UI
 * @returns {Map<string, {totalUsdValue: string, tokenAssets: array}>}
 */
export const fetchBatchBalances = async (addresses, config, batchSize = 10, onProgress = null) => {
    const results = new Map();
    const uniqueAddresses = [...new Set(addresses.map(a => a.toLowerCase()))];

    for (let i = 0; i < uniqueAddresses.length; i++) {
        const addr = uniqueAddresses[i];
        try {
            const data = await fetchWalletBalances(addr, config);
            results.set(addr, data);
        } catch (err) {
            console.error(`Failed to fetch ${addr}:`, err);
            results.set(addr, null);
        }

        if (onProgress) onProgress(i + 1, uniqueAddresses.length);

        // Respect rate limits: 300ms between calls
        if (i < uniqueAddresses.length - 1) {
            await sleep(300);
        }
    }

    return results;
};
