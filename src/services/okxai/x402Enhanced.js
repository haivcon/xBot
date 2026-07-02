/**
 * OKX.AI x402 / payment-required helper.
 *
 * Wraps API calls that may return HTTP 402 and exposes normalized payment
 * requirements so xBot can create payment sessions or ask the user to pay.
 */
const axios = require('axios');
const logger = require('../../core/logger');

const log = logger.child('OKXAI:x402');
const DEFAULT_TIMEOUT = Number(process.env.OKXAI_TIMEOUT_MS || 30000);

function extractPaymentRequirement(errorOrResponse) {
    const response = errorOrResponse?.response || errorOrResponse;
    const headers = response?.headers || {};
    const body = response?.data || {};
    if (response?.status !== 402 && !body.paymentRequired && !headers['www-authenticate']) {
        return null;
    }

    return {
        status: 402,
        scheme: body.scheme || body.x402Version || 'x402',
        x402Version: body.x402Version || body.version,
        accepts: body.accepts || body.paymentOptions || [],
        amount: body.amount || body.price || body.maxAmountRequired,
        currency: body.currency || body.asset,
        network: body.network || body.chain,
        payTo: body.payTo || body.recipient,
        paymentId: body.paymentId || body.id,
        channelId: body.channelId || body.channel_id,
        raw: body,
        authenticate: headers['www-authenticate']
    };
}

async function requestWithPayment(config = {}, paymentProvider = null) {
    try {
        const response = await axios({ timeout: DEFAULT_TIMEOUT, ...config });
        return { ok: true, data: response.data, response };
    } catch (err) {
        const requirement = extractPaymentRequirement(err);
        if (!requirement) throw err;

        log.warn(`Payment required for ${config.method || 'GET'} ${config.url}`);
        if (!paymentProvider) {
            return { ok: false, paymentRequired: true, requirement };
        }

        const payment = await paymentProvider(requirement, config);
        const retryHeaders = {
            ...(config.headers || {}),
            ...(payment?.headers || {})
        };
        if (payment?.signature) retryHeaders['X-PAYMENT'] = payment.signature;
        if (payment?.paymentSignature) retryHeaders['PAYMENT-SIGNATURE'] = payment.paymentSignature;

        const response = await axios({
            timeout: DEFAULT_TIMEOUT,
            ...config,
            headers: retryHeaders
        });
        return { ok: true, paid: true, payment, data: response.data, response };
    }
}

async function createPaymentLink(requirement, options = {}) {
    const baseUrl = (options.baseUrl || process.env.OKXAI_PAYMENT_URL || process.env.OKXAI_API_URL || 'https://okx.ai').replace(/\/$/, '');
    const token = options.token || process.env.OKXAI_API_KEY || process.env.OKX_AI_API_KEY;
    const response = await axios.post(`${baseUrl}/api/payments/links`, {
        requirement,
        metadata: {
            source: 'xBot',
            ...(options.metadata || {})
        }
    }, {
        timeout: DEFAULT_TIMEOUT,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
}

module.exports = {
    extractPaymentRequirement,
    requestWithPayment,
    createPaymentLink
};