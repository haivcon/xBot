/**
 * Unified AI Router for xBot.
 *
 * Provides one server-side interface over 9Router, Gemini, OpenAI and Groq,
 * while supporting either server-owned API keys or user-provided API keys.
 */
const OpenAI = require('openai');
const { GoogleGenAI } = require('@google/genai');
const logger = require('../../core/logger');
const { sanitizeSecrets } = require('../../utils/format');
const {
    PROVIDERS,
    normalizeProvider,
    getProviderMeta,
    getServerProviderConfig,
    listProviderStatus
} = require('./providers');
const {
    resolveUserKey,
    getUserPreferredProvider,
    listUserProviderKeys
} = require('./userKeys');

const log = logger.child('AIRouter');

function getRouterMode() {
    const mode = String(process.env.AI_ROUTER_MODE || 'user_first').trim().toLowerCase();
    return ['user_first', 'server_first', 'user_only', 'server_only'].includes(mode) ? mode : 'user_first';
}

const MAX_AI_ROUTER_MESSAGES = Number(process.env.AI_ROUTER_MAX_MESSAGES || 50);
const MAX_AI_ROUTER_MESSAGE_CHARS = Number(process.env.AI_ROUTER_MAX_MESSAGE_CHARS || 20000);
const AI_ROUTER_TIMEOUT_MS = Number(process.env.AI_ROUTER_TIMEOUT_MS || 60000);

function normalizeMessages(messages = []) {
    if (!Array.isArray(messages)) return [];
    return messages
        .slice(-MAX_AI_ROUTER_MESSAGES)
        .filter((message) => message && message.content !== undefined)
        .map((message) => {
            const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
            return {
                role: ['system', 'user', 'assistant', 'tool'].includes(message.role) ? message.role : 'user',
                content: content.length > MAX_AI_ROUTER_MESSAGE_CHARS
                    ? content.slice(0, MAX_AI_ROUTER_MESSAGE_CHARS)
                    : content
            };
        });
}

function pickServerKey(provider) {
    const config = getServerProviderConfig(provider);
    if (!config) return null;
    if (config.apiKeys && config.apiKeys.length) {
        const apiKey = config.apiKeys[Math.floor(Math.random() * config.apiKeys.length)];
        return { apiKey, source: 'server_key', provider: config.provider };
    }
    if (config.allowNoKey) {
        return { apiKey: 'local', source: 'server_key', provider: config.provider };
    }
    return null;
}

async function resolveCredentials({ userId, provider }) {
    const mode = getRouterMode();
    const normalizedProvider = normalizeProvider(provider);

    if (mode === 'user_only') {
        const userKey = await resolveUserKey(userId, normalizedProvider);
        if (!userKey) throw new Error(`No user API key configured for provider ${normalizedProvider}`);
        return userKey;
    }

    if (mode === 'server_only') {
        const serverKey = pickServerKey(normalizedProvider);
        if (!serverKey) throw new Error(`No server API key configured for provider ${normalizedProvider}`);
        return serverKey;
    }

    if (mode === 'server_first') {
        return pickServerKey(normalizedProvider)
            || await resolveUserKey(userId, normalizedProvider)
            || null;
    }

    return await resolveUserKey(userId, normalizedProvider)
        || pickServerKey(normalizedProvider)
        || null;
}

async function resolveProvider({ userId, provider = 'auto', model = 'auto' } = {}) {
    let selected = normalizeProvider(provider);
    if (!selected || selected === 'auto') {
        selected = await getUserPreferredProvider(userId)
            || normalizeProvider(process.env.DEFAULT_AI_PROVIDER)
            || '9router';
    }

    if (!PROVIDERS[selected]) {
        throw new Error(`Unsupported AI provider: ${provider}`);
    }

    const meta = getProviderMeta(selected);
    const serverConfig = getServerProviderConfig(selected);
    const resolvedModel = model && model !== 'auto'
        ? model
        : process.env.DEFAULT_AI_MODEL || serverConfig?.model || meta.defaultModel;

    return {
        provider: selected,
        model: resolvedModel,
        meta,
        serverConfig
    };
}

function normalizeOpenAiTools(tools = []) {
    if (!Array.isArray(tools)) return [];
    return tools.map((tool) => {
        if (tool.type === 'function') return tool;
        return {
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description || '',
                parameters: tool.parameters || tool.input_schema || {
                    type: 'object',
                    properties: {}
                }
            }
        };
    }).filter((tool) => tool.function?.name);
}

function normalizeGeminiTools(tools = []) {
    if (!Array.isArray(tools) || !tools.length) return undefined;
    const functionDeclarations = tools.map((tool) => {
        const fn = tool.function || tool;
        return {
            name: fn.name,
            description: fn.description || '',
            parameters: fn.parameters || fn.input_schema || {
                type: 'object',
                properties: {}
            }
        };
    }).filter((tool) => tool.name);

    return functionDeclarations.length ? [{ functionDeclarations }] : undefined;
}

function convertMessagesToGeminiContents(messages = []) {
    return normalizeMessages(messages).map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }]
    }));
}

function normalizeGeminiToolCalls(response = {}) {
    const functionCalls = [];
    if (Array.isArray(response.functionCalls)) {
        functionCalls.push(...response.functionCalls);
    }

    const candidates = response.candidates || [];
    for (const candidate of candidates) {
        const parts = candidate?.content?.parts || [];
        for (const part of parts) {
            if (part.functionCall) functionCalls.push(part.functionCall);
        }
    }

    return functionCalls
        .filter((call) => call?.name)
        .map((call, index) => ({
            id: call.id || `gemini_call_${index}`,
            type: 'function',
            function: {
                name: call.name,
                arguments: JSON.stringify(call.args || call.arguments || {})
            }
        }));
}

async function chatWithOpenAiCompatible({ provider, model, messages, tools, temperature, credentials, serverConfig, baseURL }) {
    const resolvedBaseURL = baseURL || serverConfig?.baseURL || undefined;
    const client = new OpenAI({
        apiKey: credentials.apiKey === 'local' ? 'local' : credentials.apiKey,
        baseURL: resolvedBaseURL,
        timeout: AI_ROUTER_TIMEOUT_MS
    });

    const normalizedTools = normalizeOpenAiTools(tools);
    const payload = {
        model,
        messages: normalizeMessages(messages),
        temperature: temperature ?? 0.7
    };

    if (normalizedTools.length) {
        payload.tools = normalizedTools;
        payload.tool_choice = 'auto';
    }

    const response = await client.chat.completions.create(payload);

    const choice = response.choices?.[0] || {};
    const message = choice.message || {};
    return {
        provider,
        model,
        source: credentials.source,
        text: message.content || '',
        message,
        toolCalls: message.tool_calls || [],
        raw: response
    };
}

async function chatWithGemini({ provider, model, messages, tools, temperature, credentials }) {
    const ai = new GoogleGenAI({ apiKey: credentials.apiKey });
    const normalizedTools = normalizeGeminiTools(tools);
    const config = {
        temperature: temperature ?? 0.7
    };

    if (normalizedTools) {
        config.tools = normalizedTools;
    }

    const response = await ai.models.generateContent({
        model,
        contents: convertMessagesToGeminiContents(messages),
        config
    });

    const toolCalls = normalizeGeminiToolCalls(response);

    return {
        provider,
        model,
        source: credentials.source,
        text: response.text || '',
        message: {
            role: 'assistant',
            content: response.text || '',
            tool_calls: toolCalls
        },
        toolCalls,
        raw: response
    };
}

async function chat(options = {}) {
    const { provider, model, meta, serverConfig } = await resolveProvider(options);
    const credentials = await resolveCredentials({ userId: options.userId, provider });

    if (!credentials) {
        throw new Error(`No AI API key configured for provider ${provider}`);
    }

    try {
        if (provider === 'google') {
            return await chatWithGemini({
                provider,
                model,
                messages: options.messages,
                tools: options.tools,
                temperature: options.temperature,
                credentials
            });
        }

        return await chatWithOpenAiCompatible({
            provider,
            model,
            messages: options.messages,
            tools: options.tools,
            temperature: options.temperature,
            credentials,
            serverConfig,
            baseURL: options.baseURL
        });
    } catch (err) {
        log.warn(`AI router request failed (${provider}/${model}/${credentials.source}): ${sanitizeSecrets(err.message)}`);
        throw err;
    }
}

async function getStatus(userId = null) {
    const providers = listProviderStatus();
    const userKeys = {};
    if (userId) {
        for (const provider of Object.keys(PROVIDERS)) {
            userKeys[provider] = await listUserProviderKeys(userId, provider);
        }
    }

    return {
        mode: getRouterMode(),
        defaultProvider: normalizeProvider(process.env.DEFAULT_AI_PROVIDER) || '9router',
        defaultModel: process.env.DEFAULT_AI_MODEL || null,
        providers,
        userKeys
    };
}

module.exports = {
    chat,
    getStatus,
    resolveProvider,
    resolveCredentials,
    normalizeMessages,
    normalizeOpenAiTools,
    normalizeGeminiTools,
    normalizeGeminiToolCalls,
    convertMessagesToGeminiContents,
    getRouterMode
};
