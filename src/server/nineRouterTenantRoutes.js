'use strict';

const { Router } = require('express');
const logger = require('../core/logger');
const {
    isAllowedManagementPath,
    normalizeTenantId,
    requestForTenant,
    sanitizeProxyHeaders
} = require('../services/nineRouterTenantClient');

const log = logger.child('NineRouterTenantGateway');
const METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const BODY_LIMIT_BYTES = 256 * 1024;

function safeErrorPayload(error) {
    const status = Number(error?.response?.status) || Number(error?.statusCode) || 502;
    const upstream = error?.response?.data;
    const message = typeof upstream?.error === 'string'
        ? upstream.error
        : typeof upstream?.message === 'string'
            ? upstream.message
            : status === 502
                ? '9Router is temporarily unavailable'
                : '9Router request failed';
    return {
        status: status >= 400 && status < 600 ? status : 502,
        body: { error: message, code: error?.code || 'NINEROUTER_REQUEST_FAILED' }
    };
}

function createNineRouterTenantRoutes() {
    const router = Router();

    router.use((req, res, next) => {
        const contentLength = Number(req.headers['content-length'] || 0);
        if (contentLength > BODY_LIMIT_BYTES) {
            return res.status(413).json({ error: 'Request body is too large' });
        }
        if (!METHODS.has(req.method)) {
            return res.status(405).json({ error: 'Method not allowed' });
        }
        return next();
    });

    router.all('/*', async (req, res) => {
        try {
            const tenantId = normalizeTenantId(req.dashboardUser?.userId);
            const upstreamPath = `/api/${String(req.params[0] || '').replace(/^\/+/, '')}`;
            if (!isAllowedManagementPath(upstreamPath)) {
                return res.status(404).json({ error: '9Router endpoint is not available' });
            }

            const response = await requestForTenant({
                tenantId,
                method: req.method,
                path: upstreamPath,
                query: req.query,
                data: ['GET', 'DELETE'].includes(req.method) ? undefined : req.body,
                signal: req.signal,
                management: true,
                timeoutMs: Number(process.env.NINEROUTER_MANAGEMENT_TIMEOUT_MS || 60_000)
            });

            const headers = sanitizeProxyHeaders(response.headers);
            for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
            res.setHeader('Cache-Control', headers['cache-control'] || 'no-store');
            return res.status(response.status).json(response.data);
        } catch (error) {
            const safe = safeErrorPayload(error);
            log.warn(`Tenant management request failed: ${error?.code || error?.response?.status || 'unknown'}`);
            return res.status(safe.status).json(safe.body);
        }
    });

    return router;
}

module.exports = { createNineRouterTenantRoutes };