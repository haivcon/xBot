const crypto = require('crypto');
const logger = require('../core/logger');
const { withWelcomeMemberLock } = require('./welcomeMemberLock');

const log = logger.child('WelcomeReactive');
const ACTIVE_STATES = new Set(['CREATING', 'PENDING', 'ENFORCING', 'ENFORCEMENT_FAILED', 'ENFORCED']);

function isGroupMessage(message) {
    return Boolean(
        message?.message_id
        && ['group', 'supergroup'].includes(message?.chat?.type)
        && message?.from
        && !message.from.is_bot
    );
}

function isMembershipServiceMessage(message) {
    return Boolean(message?.new_chat_members?.length || message?.left_chat_member);
}

function createWelcomeReactiveController({
    repository,
    bot,
    getSettings,
    onAdmissionsCreated = async () => {},
    createGeneration = () => crypto.randomBytes(16).toString('hex')
}) {
    if (!repository || !bot || typeof getSettings !== 'function') {
        throw new TypeError('welcome reactive controller requires repository, bot, and getSettings');
    }

    async function persistJoins(update, message) {
        if (!message?.new_chat_members?.length || !['group', 'supergroup'].includes(message?.chat?.type)) {
            return [];
        }

        const settingsPromise = getSettings(message.chat.id);
        const created = [];
        const chatId = message.chat.id.toString();
        const operations = message.new_chat_members
            .filter((member) => member && !member.is_bot)
            .map((member) => withWelcomeMemberLock(chatId, member.id.toString(), async () => {
                const settings = await settingsPromise;
                if (!settings.enabled || (settings.mode && settings.mode !== 'reactive')) return;
                const generation = createGeneration();
                const admission = await repository.createWelcomeAdmission({
                    chatId,
                    userId: member.id.toString(),
                    generation,
                    joinUpdateId: update.update_id === undefined ? null : String(update.update_id),
                    member,
                    sourceMessage: message,
                    settings
                });
                if (admission?.generation === generation) created.push(admission);
            }));
        await Promise.all(operations);

        if (created.length) {
            const settings = await settingsPromise;
            await onAdmissionsCreated(created, { update, message, settings });
        }
        return created;
    }

    async function persistLeave(message) {
        const member = message?.left_chat_member;
        if (!member || !['group', 'supergroup'].includes(message?.chat?.type)) return;
        const chatId = message.chat.id.toString();
        const userId = member.id.toString();
        await withWelcomeMemberLock(chatId, userId, () => repository.markWelcomeAdmissionLeft({ chatId, userId }));
    }

    async function persistChatMemberLeave(update) {
        const change = update?.chat_member;
        const member = change?.new_chat_member?.user;
        const status = change?.new_chat_member?.status;
        if (!member || !['left', 'kicked'].includes(status)) return;
        const chatId = change.chat.id.toString();
        const userId = member.id.toString();
        await withWelcomeMemberLock(chatId, userId, () => repository.markWelcomeAdmissionLeft({ chatId, userId }));
    }

    async function enforceViolation(update, message) {
        if (!isGroupMessage(message) || isMembershipServiceMessage(message)) return false;

        const chatId = message.chat.id.toString();
        const userId = message.from.id.toString();
        return withWelcomeMemberLock(chatId, userId, async () => {
            const active = await repository.getActiveWelcomeAdmission(chatId, userId);
            if (!active || !ACTIVE_STATES.has(active.state)) {
                if (update.update_id !== undefined && await repository.isWelcomeUpdateProcessed(String(update.update_id))) {
                    return true;
                }
                return false;
            }

            const claim = await repository.claimWelcomeViolation({
                chatId,
                userId,
                generation: active.generation,
                updateId: update.update_id === undefined ? null : String(update.update_id),
                messageId: message.message_id
            });
            if (!claim?.claimed) {
                // Verification may have won between the initial read and the CAS.
                // Only suppress/delete if the durable row is still blocking.
                const stillBlocked = await repository.getActiveWelcomeAdmission(chatId, userId);
                if (!stillBlocked || !ACTIVE_STATES.has(stillBlocked.state)) {
                    return Boolean(claim?.duplicate);
                }
                try {
                    await bot.deleteMessage(message.chat.id, message.message_id);
                } catch (error) {
                    log.warn(`Could not delete queued violating message ${message.message_id} in ${chatId}: ${error.message}`);
                }
                return true;
            }

        try {
            await bot.deleteMessage(message.chat.id, message.message_id);
        } catch (error) {
            log.warn(`Could not delete violating message ${message.message_id} in ${chatId}: ${error.message}`);
        }

        let enforcementError = null;
        let banned = false;
        try {
            await bot.banChatMember(message.chat.id, message.from.id, { revoke_messages: true });
            banned = true;
        } catch (error) {
            enforcementError = error;
            log.error(`Could not ban pending member ${userId} in ${chatId}: ${error.message}`);
        }

        if (banned) {
            try {
                await bot.unbanChatMember(message.chat.id, message.from.id, { only_if_banned: true });
            } catch (error) {
                enforcementError = enforcementError || error;
                log.error(`Could not unban kicked member ${userId} in ${chatId}: ${error.message}`);
            }
        }

            await repository.finishWelcomeEnforcement({
                chatId,
                userId,
                generation: active.generation,
                error: enforcementError ? enforcementError.message : null
            });
            return true;
        });
    }

    async function processUpdate(update, dispatch) {
        const message = update?.message || update?.edited_message;
        // Invoke all membership operations before the first await so their per-user
        // locks preserve Telegram update arrival order even when polling does not await
        // processUpdate between updates.
        const chatMemberLeave = persistChatMemberLeave(update);
        const joins = update?.message ? persistJoins(update, update.message) : Promise.resolve([]);
        const messageLeave = update?.message ? persistLeave(update.message) : Promise.resolve();
        await Promise.all([chatMemberLeave, joins, messageLeave]);
        if (message && await enforceViolation(update, message)) return true;
        if (typeof dispatch === 'function') await dispatch(update);
        return false;
    }

    async function verifyByToken(token, userId) {
        return repository.verifyWelcomeAdmissionByToken(token, String(userId));
    }

    async function recover(visitor) {
        const rows = await repository.listRecoverableWelcomeAdmissions();
        for (const row of rows) await visitor(row);
        return rows.length;
    }

    return {
        processUpdate,
        verifyByToken,
        recover,
        enforceViolation
    };
}

module.exports = {
    ACTIVE_STATES,
    createWelcomeReactiveController,
    isGroupMessage
};
