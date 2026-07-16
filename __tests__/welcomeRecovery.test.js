const { retryWelcomeViolationEnforcement } = require('../src/features/checkin/runtime');
const { withWelcomeMemberLock } = require('../src/features/welcomeMemberLock');

describe('Reactive welcome recovery enforcement', () => {
    test('retries delete then kick and unban, even when delete fails', async () => {
        const calls = [];
        const db = {
            claimWelcomeViolation: jest.fn().mockResolvedValue({ claimed: true }),
            finishWelcomeEnforcement: jest.fn().mockResolvedValue(true)
        };
        const bot = {
            deleteMessage: jest.fn(async () => {
                calls.push('delete');
                throw new Error('delete denied');
            }),
            banChatMember: jest.fn(async () => { calls.push('ban'); }),
            unbanChatMember: jest.fn(async () => { calls.push('unban'); })
        };
        const retryLog = { warn: jest.fn(), error: jest.fn() };
        const row = {
            chatId: '-1001', userId: '42', generation: 'g1',
            violationUpdateId: 'update-1', violationMessageId: 10
        };

        await expect(retryWelcomeViolationEnforcement({ row, db, bot, retryLog })).resolves.toBe(true);

        expect(calls).toEqual(['delete', 'ban', 'unban']);
        expect(db.finishWelcomeEnforcement).toHaveBeenCalledWith({
            chatId: '-1001', userId: '42', generation: 'g1', error: null
        });
    });

    test('serializes a leave/rejoin transition behind recovered enforcement', async () => {
        let releaseBan;
        const banStarted = new Promise((resolve) => {
            releaseBan = resolve;
        });
        let markBanStarted;
        const observedBan = new Promise((resolve) => {
            markBanStarted = resolve;
        });
        const calls = [];
        const db = {
            claimWelcomeViolation: jest.fn().mockResolvedValue({ claimed: true }),
            finishWelcomeEnforcement: jest.fn().mockResolvedValue(true)
        };
        const bot = {
            deleteMessage: jest.fn(async () => { calls.push('delete'); }),
            banChatMember: jest.fn(async () => {
                calls.push('ban');
                markBanStarted();
                await banStarted;
            }),
            unbanChatMember: jest.fn(async () => { calls.push('unban'); })
        };
        const row = {
            chatId: '-1001', userId: '42', generation: 'g1',
            violationUpdateId: 'update-1', violationMessageId: 10
        };

        const retry = retryWelcomeViolationEnforcement({ row, db, bot });
        await observedBan;
        const transition = withWelcomeMemberLock('-1001', '42', async () => { calls.push('leave-rejoin'); });
        await Promise.resolve();
        expect(calls).toEqual(['delete', 'ban']);

        releaseBan();
        await Promise.all([retry, transition]);
        expect(calls).toEqual(['delete', 'ban', 'unban', 'leave-rejoin']);
    });

    test('does nothing when another process still owns the lease', async () => {
        const db = {
            claimWelcomeViolation: jest.fn().mockResolvedValue({ claimed: false }),
            finishWelcomeEnforcement: jest.fn()
        };
        const bot = { deleteMessage: jest.fn(), banChatMember: jest.fn(), unbanChatMember: jest.fn() };
        const row = {
            chatId: '-1001', userId: '42', generation: 'g1',
            violationUpdateId: 'update-1', violationMessageId: 10
        };

        await expect(retryWelcomeViolationEnforcement({ row, db, bot })).resolves.toBe(false);
        expect(bot.deleteMessage).not.toHaveBeenCalled();
        expect(bot.banChatMember).not.toHaveBeenCalled();
        expect(db.finishWelcomeEnforcement).not.toHaveBeenCalled();
    });
});