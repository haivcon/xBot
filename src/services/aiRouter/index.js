/**
 * xBot AI Router public API.
 */
const router = require('./router');
const providers = require('./providers');
const userKeys = require('./userKeys');

module.exports = {
    ...router,
    ...providers,
    ...userKeys
};