const crypto = require('crypto');

function getJwtSecret() {
    const secret = process.env.DASHBOARD_JWT_SECRET || process.env.TELEGRAM_TOKEN;
    if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('DASHBOARD_JWT_SECRET or TELEGRAM_TOKEN is required in production');
    }
    return secret || 'xbot-dashboard-dev-secret';
}

function createJWT(payload, expiresInSec = 86400 * 7) {
    const secret = getJwtSecret();
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp: now + expiresInSec })).toString('base64url');
    const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${signature}`;
}

function decodeAndVerifyJWT(token, { allowExpiredWithinSec = 0 } = {}) {
    try {
        const secret = getJwtSecret();
        const [header, body, signature] = token.split('.');
        if (!header || !body || !signature) return null;

        const expected = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
        const actualBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expected);
        if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null;

        const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now - allowExpiredWithinSec) return null;
        return payload;
    } catch {
        return null;
    }
}

function verifyJWT(token) {
    return decodeAndVerifyJWT(token);
}

module.exports = {
    createJWT,
    decodeAndVerifyJWT,
    getJwtSecret,
    verifyJWT,
};
