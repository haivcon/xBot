const memberLocks = new Map();

async function withWelcomeMemberLock(chatId, userId, operation) {
    const key = `${chatId}:${userId}`;
    const previous = memberLocks.get(key) || Promise.resolve();
    let release;
    const current = new Promise((resolve) => { release = resolve; });
    memberLocks.set(key, current);
    await previous;
    try {
        return await operation();
    } finally {
        release();
        if (memberLocks.get(key) === current) memberLocks.delete(key);
    }
}

module.exports = { withWelcomeMemberLock };
