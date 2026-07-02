/**
 * AI provider metadata and normalization helpers for xBot.
 *
 * This module keeps provider naming consistent across Telegram, dashboard,
 * OKX.AI bridge, and server-side AI routing.
 */
const {
    GEMINI_API_KEYS = [],
    GEMINI_MODEL,
    OPENAI_API_KEYS = [],
    OPENAI_MODEL,
    GROQ_API_KEYS = [],
    GROQ_API_URL,
    NINEROUTER_API_KEY,
    NINEROUTER_MODEL,
    NINEROUTER_CHAT_COMPLETIONS_URL
} = require('../../config/env');

const PROVIDERS = {
    '9router': {
        id: '9router',
        aliases: ['9router', 'ninerouter', 'nine-router', 'router'],
        label: '9Router',
        defaultModel: NINEROUTER_MODEL || 'auto',
        openAiCompatible: true
    },
    google: {
        id: 'google',
        aliases: ['google', 'gemini', 'googleai', 'google-ai'],
        label: 'Google Gemini',
        defaultModel: GEMINI_MODEL || 'gemini-2.5-flash',
        openAiCompatible: false
    },
    openai: {
        id: 'openai',
        aliases: ['openai', 'gpt'],
        label: 'OpenAI',
        defaultModel: OPENAI_MODEL || 'gpt-4o-mini',
        openAiCompatible: true
    },
    groq: {
        id: 'groq',
        aliases: ['groq'],
        label: 'Groq',
        defaultModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        openAiCompatible: true
    }
};

function normalizeProvider(provider) {
    const value = String(provider || '').trim().toLowerCase();
    if (!value) return null;
    for (const meta of Object.values(PROVIDERS)) {
        if (meta.aliases.includes(value)) return meta.id;
    }
    return value;
}

function getProviderMeta(provider) {
    const normalized = normalizeProvider(provider);
    return normalized ? PROVIDERS[normalized] || null : null;
}

function getServerProviderConfig(provider) {
    const normalized = normalizeProvider(provider);
    if (normalized === '9router') {
        return {
            provider: '9router',
            model: NINEROUTER_MODEL,
            apiKeys: NINEROUTER_API_KEY ? [NINEROUTER_API_KEY] : [],
            baseURL: NINEROUTER_CHAT_COMPLETIONS_URL
                ? NINEROUTER_CHAT_COMPLETIONS_URL.replace(/\/chat\/completions$/, '')
                : null,
            allowNoKey: process.env.NINEROUTER_ALLOW_NO_KEY !== 'false'
        };
    }
    if (normalized === 'google') {
        return {
            provider: 'google',
            model: GEMINI_MODEL,
            apiKeys: GEMINI_API_KEYS,
            baseURL: null,
            allowNoKey: false
        };
    }
    if (normalized === 'openai') {
        return {
            provider: 'openai',
            model: OPENAI_MODEL,
            apiKeys: OPENAI_API_KEYS,
            baseURL: process.env.OPENAI_BASE_URL || null,
            allowNoKey: false
        };
    }
    if (normalized === 'groq') {
        return {
            provider: 'groq',
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            apiKeys: GROQ_API_KEYS,
            baseURL: (process.env.GROQ_BASE_URL || GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions').replace(/\/chat\/completions$/, ''),
            allowNoKey: false
        };
    }
    return null;
}

function listProviderStatus() {
    return Object.keys(PROVIDERS).map((provider) => {
        const config = getServerProviderConfig(provider) || {};
        return {
            ...PROVIDERS[provider],
            configured: Boolean((config.apiKeys && config.apiKeys.length) || config.allowNoKey),
            serverKeyCount: config.apiKeys ? config.apiKeys.length : 0,
            baseURL: config.baseURL || null,
            model: config.model || PROVIDERS[provider].defaultModel
        };
    });
}

module.exports = {
    PROVIDERS,
    normalizeProvider,
    getProviderMeta,
    getServerProviderConfig,
    listProviderStatus
};