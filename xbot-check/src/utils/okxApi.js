import CryptoJS from 'crypto-js';

const OKX_BASE_URL = 'https://www.okx.com';

const generateSignature = (timestamp, method, requestPath, body, secretKey) => {
    const prehashString = timestamp + method.toUpperCase() + requestPath + (body ? JSON.stringify(body) : '');
    return CryptoJS.HmacSHA256(prehashString, secretKey).toString(CryptoJS.enc.Base64);
};

/**
 * Fetches native multi-chain balances for a given address
 */
export const fetchWalletBalances = async (address, config) => {
    const { apiKey, secretKey, passphrase } = config;
    if (!apiKey || !secretKey || !passphrase) {
        throw new Error("Missing OKX API configuration");
    }

    const timestamp = new Date().toISOString();
    const requestPath = `/api/v5/mktplace/wallet/balance?address=${address}`;
    const method = 'GET';
    const sign = generateSignature(timestamp, method, requestPath, '', secretKey);

    const headers = {
        'OK-ACCESS-KEY': apiKey,
        'OK-ACCESS-SIGN': sign,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': passphrase,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    try {
        const response = await fetch(`${OKX_BASE_URL}${requestPath}`, {
            method,
            headers
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OKX API Error: ${response.status} - ${errorData.msg || response.statusText}`);
        }

        const json = await response.json();
        
        // Return total value or process it. OKX API returns totalUsdValue
        // Response format usually has data[0].totalUsdValue
        if (json.code === '0' && json.data && json.data.length > 0) {
            const entry = json.data[0];
            // #7: Parse token details if available
            const tokenAssets = (entry.tokenAssets || entry.tokens || []).map(t => ({
                symbol: t.symbol || t.tokenSymbol || '?',
                balance: t.holdingAmount || t.balance || '0',
                usdValue: t.tokenPrice ? (parseFloat(t.holdingAmount || 0) * parseFloat(t.tokenPrice)).toFixed(2) : (t.usdValue || ''),
                logoUrl: t.tokenLogo || t.logoUrl || '',
                tokenAddress: t.tokenContractAddress || t.tokenAddress || '',
            }));
            return { ...entry, tokenAssets };
        } else {
            throw new Error(json.msg || "Failed to fetch balance");
        }
    } catch (e) {
        console.error("Balance fetch error:", e);
        throw e;
    }
};
