const { dbRun, dbGet } = require('../../db/core');
const logger = require('../core/logger');

async function initUserOkxKeysTable() {
    try {
        await dbRun(`CREATE TABLE IF NOT EXISTS user_okx_credentials (
            userId TEXT PRIMARY KEY,
            apiKey TEXT,
            secretKey TEXT,
            passphrase TEXT,
            updatedAt INTEGER
        )`);
        logger.info('[UserOkxKeys] DB initialized');
    } catch (e) {
        logger.error(`[UserOkxKeys] DB init error: ${e.message}`);
    }
}

async function getUserOkxCredentials(userId) {
    try {
        return await dbGet('SELECT * FROM user_okx_credentials WHERE userId = ?', [userId]);
    } catch (e) {
        logger.error(`[UserOkxKeys] Get error: ${e.message}`);
        return null;
    }
}

async function saveUserOkxCredentials(userId, apiKey, secretKey, passphrase) {
    try {
        await dbRun(
            `INSERT INTO user_okx_credentials (userId, apiKey, secretKey, passphrase, updatedAt) 
             VALUES (?, ?, ?, ?, ?) 
             ON CONFLICT(userId) DO UPDATE SET 
                apiKey=excluded.apiKey, 
                secretKey=excluded.secretKey, 
                passphrase=excluded.passphrase, 
                updatedAt=excluded.updatedAt`,
            [userId, apiKey, secretKey, passphrase, Date.now()]
        );
        return true;
    } catch (e) {
        logger.error(`[UserOkxKeys] Save error: ${e.message}`);
        return false;
    }
}

async function handleSetOkxKeyCommand(msg, bot, t, lang) {
    const chatId = msg.chat.id;
    const userId = String(msg.from.id);
    
    // Only allow setting keys in private messages for security
    if (msg.chat.type !== 'private') {
        return bot.sendMessage(chatId, t(lang, 'Must use /setokxkey in a private chat for security.'));
    }

    const text = msg.text || '';
    const parts = text.split(' ').filter(Boolean);

    if (parts.length !== 4) {
        const portalUrl = 'https://web3.okx.com/vi/onchainos/dev-portal/';
        return bot.sendMessage(chatId, 
            `<b>🔑 Thiết Lập OKX API Key Cá Nhân</b>\n\n` +
            `Tính năng Auto Trading và Copy Trade yêu cầu bạn cung cấp OKX API Key cá nhân để hoạt động.\n\n` +
            `<b>Cách lấy Key:</b>\n` +
            `Truy cập <a href="${portalUrl}">OKX Web3 OnchainOS Dev Portal</a> để lấy bộ API Key miễn phí.\n\n` +
            `<b>Cách cấu hình:</b>\n` +
            `Gõ lệnh theo đúng cú pháp sau (nhớ có dấu cách):\n` +
            `<code>/setokxkey &lt;API_KEY&gt; &lt;SECRET_KEY&gt; &lt;PASSPHRASE&gt;</code>`,
            { parse_mode: 'HTML', disable_web_page_preview: true }
        );
    }

    const [, apiKey, secretKey, passphrase] = parts;

    const success = await saveUserOkxCredentials(userId, apiKey, secretKey, passphrase);
    if (success) {
        return bot.sendMessage(chatId, `✅ <b>Thành công!</b> OKX API Key của bạn đã được lưu lại an toàn.\nBây giờ bạn có thể sử dụng các tính năng Auto Trading và Copy Trade!`, { parse_mode: 'HTML' });
    } else {
        return bot.sendMessage(chatId, `❌ Có lỗi xảy ra khi lưu API Key. Vui lòng thử lại sau.`, { parse_mode: 'HTML' });
    }
}

module.exports = {
    initUserOkxKeysTable,
    getUserOkxCredentials,
    saveUserOkxCredentials,
    handleSetOkxKeyCommand
};

// Initialize DB on module load
initUserOkxKeysTable();
