process.env.AI_ROUTER_MAX_MESSAGES = '2';
process.env.AI_ROUTER_MAX_MESSAGE_CHARS = '5';

jest.mock('../src/services/aiRouter/userKeys', () => ({
    resolveUserKey: jest.fn(),
    getUserPreferredProvider: jest.fn(),
    listUserProviderKeys: jest.fn()
}));

const aiRouter = require('../src/services/aiRouter/router');

describe('AI Router normalization', () => {
    test('normalizeMessages keeps latest messages, coerces content, and clamps long content', () => {
        const normalized = aiRouter.normalizeMessages([
            { role: 'system', content: 'ignored due to slice' },
            { role: 'assistant', content: { ok: true } },
            { role: 'invalid', content: '123456789' }
        ]);

        expect(normalized).toEqual([
            { role: 'assistant', content: '{"ok"' },
            { role: 'user', content: '12345' }
        ]);
    });

    test('normalizeOpenAiTools converts MCP-style tools to OpenAI functions', () => {
        const tools = aiRouter.normalizeOpenAiTools([
            {
                name: 'search_agents',
                description: 'Search OKX.AI agents',
                input_schema: {
                    type: 'object',
                    properties: {
                        query: { type: 'string' }
                    }
                }
            }
        ]);

        expect(tools).toEqual([
            {
                type: 'function',
                function: {
                    name: 'search_agents',
                    description: 'Search OKX.AI agents',
                    parameters: {
                        type: 'object',
                        properties: {
                            query: { type: 'string' }
                        }
                    }
                }
            }
        ]);
    });

    test('normalizeGeminiTools returns undefined for empty tools and declarations for tools', () => {
        expect(aiRouter.normalizeGeminiTools([])).toBeUndefined();

        const normalized = aiRouter.normalizeGeminiTools([
            {
                function: {
                    name: 'publish_task',
                    description: 'Publish a task',
                    parameters: { type: 'object', properties: {} }
                }
            }
        ]);

        expect(normalized).toEqual([
            {
                functionDeclarations: [
                    {
                        name: 'publish_task',
                        description: 'Publish a task',
                        parameters: { type: 'object', properties: {} }
                    }
                ]
            }
        ]);
    });

    test('convertMessagesToGeminiContents maps assistant to model role', () => {
        const contents = aiRouter.convertMessagesToGeminiContents([
            { role: 'assistant', content: 'hello' },
            { role: 'user', content: 'world' }
        ]);

        expect(contents).toEqual([
            { role: 'model', parts: [{ text: 'hello' }] },
            { role: 'user', parts: [{ text: 'world' }] }
        ]);
    });

    test('normalizeGeminiToolCalls extracts Gemini function calls as OpenAI-style tool calls', () => {
        const toolCalls = aiRouter.normalizeGeminiToolCalls({
            candidates: [
                {
                    content: {
                        parts: [
                            {
                                functionCall: {
                                    name: 'search_token',
                                    args: { query: 'developer' }
                                }
                            }
                        ]
                    }
                }
            ]
        });

        expect(toolCalls).toEqual([
            {
                id: 'gemini_call_0',
                type: 'function',
                function: {
                    name: 'search_token',
                    arguments: JSON.stringify({ query: 'developer' })
                }
            }
        ]);
    });
});