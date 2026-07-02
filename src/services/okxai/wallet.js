/**
 * OKX.AI Agentic Wallet bridge.
 *
 * xBot does not custody keys here. It forwards wallet actions to an
 * endpoint-configurable OKX Agentic Wallet gateway or returns unsigned payloads
 * for user-side signing.
 */
const axios = require('axios');

const DEFAULT_BASE_URL = process.env.OKXAI_WALLET_URL || process.env.OKXAI_API_URL || 'https://okx.ai';
const DEFAULT_TIMEOUT = Number(process.env.OKXAI_TIMEOUT_MS || 30000);

function baseUrl(value = DEFAULT_BASE_URL) {
    return String(value || DEFAULT_BASE_URL).replace(/\/$/, '');
}

function headers(options = {}) {
    const token = options.token || process.env.OKXAI_API_KEY || process.env.OKX_AI_API_KEY;
    return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function walletRequest(method, path, data, options = {}) {
    const response = await axios({
        method,
        url: `${baseUrl(options.baseUrl)}${path}`,
        data,
        headers: { ...headers(options), ...(options.headers || {}) },
        timeout: options.timeout || DEFAULT_TIMEOUT
    });
    return response.data;
}

async function getWalletStatus(userId, options = {}) {
    if (!userId) throw new Error('userId is required');
    return walletRequest('GET', `/api/wallet/users/${encodeURIComponent(userId)}/status`, null, options);
}

async function getBalances(userId, chainId, options = {}) {
    if (!userId) throw new Error('userId is required');
    const qs = chainId ? `?chainId=${encodeURIComponent(chainId)}` : '';
    return walletRequest('GET', `/api/wallet/users/${encodeURIComponent(userId)}/balances${qs}`, null, options);
}

async function buildTransfer(userId, transfer = {}, options = {}) {
    if (!userId) throw new Error('userId is required');
    return walletRequest('POST', `/api/wallet/users/${encodeURIComponent(userId)}/transfers/build`, transfer, options);
}

async function sendTransfer(userId, transfer = {}, options = {}) {
    if (!userId) throw new Error('userId is required');
    return walletRequest('POST', `/api/wallet/users/${encodeURIComponent(userId)}/transfers`, transfer, options);
}

async function buildContractCall(userId, call = {}, options = {}) {
    if (!userId) throw new Error('userId is required');
    return walletRequest('POST', `/api/wallet/users/${encodeURIComponent(userId)}/contract-call/build`, call, options);
}

async function signMessage(userId, message, options = {}) {
    if (!userId) throw new Error('userId is required');
    return walletRequest('POST', `/api/wallet/users/${encodeURIComponent(userId)}/sign-message`, { message, ...options.signOptions }, options);
}

async function getTransactionStatus(orderIdOrHash, options = {}) {
    if (!orderIdOrHash) throw new Error('orderIdOrHash is required');
    return walletRequest('GET', `/api/wallet/transactions/${encodeURIComponent(orderIdOrHash)}`, null, options);
}

module.exports = {
    getWalletStatus,
    getBalances,
    buildTransfer,
    sendTransfer,
    buildContractCall,
    signMessage,
    getTransactionStatus,
    walletRequest
};