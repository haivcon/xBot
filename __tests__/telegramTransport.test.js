describe('Telegram transport startup', () => {
    beforeEach(() => {
        jest.resetModules();
        process.env.TELEGRAM_TOKEN = '123:test-token';
        delete process.env.PUBLIC_BASE_URL;
        delete process.env.USE_WEBHOOK;
    });

    afterEach(() => {
        delete process.env.TELEGRAM_TOKEN;
    });

    test('configures allowed updates and does not await the polling lifetime', async () => {
        const pollingLifetime = new Promise(() => {});
        const startPolling = jest.fn(() => pollingLifetime);
        let constructorOptions;
        jest.doMock('node-telegram-bot-api', () => jest.fn().mockImplementation((token, options) => {
            constructorOptions = options;
            return {
                processUpdate: jest.fn(),
                startPolling,
                answerCallbackQuery: jest.fn(),
                sendMessage: jest.fn(),
                deleteMessage: jest.fn()
            };
        }));

        const { bot, installUpdateIngress, startTelegramTransport } = require('../src/core/bot');
        const ingressError = new Error('ingress failed');
        installUpdateIngress(async () => { throw ingressError; });

        await expect(startTelegramTransport()).resolves.toBeUndefined();
        await expect(bot.processUpdate({ update_id: 1 })).rejects.toBe(ingressError);

        expect(constructorOptions.polling).toEqual({
            autoStart: false,
            params: {
                allowed_updates: ['message', 'edited_message', 'callback_query', 'chat_member', 'my_chat_member']
            }
        });
        expect(startPolling).toHaveBeenCalledWith();
    });
});