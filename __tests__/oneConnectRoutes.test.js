'use strict';

const http = require('http');
const express = require('express');
const { createJWT } = require('../src/server/dashboardAuth');
const { createDashboardRoutes } = require('../src/server/dashboardRoutes');

function request(server, { method = 'GET', path, token, body }) {
    const address = server.address();
    const payload = body === undefined ? null : JSON.stringify(body);
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: address.port,
            method,
            path,
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {})
            }
        }, res => {
            let raw = '';
            res.setEncoding('utf8');
            res.on('data', chunk => { raw += chunk; });
            res.on('end', () => resolve({ status: res.statusCode, body: raw ? JSON.parse(raw) : null }));
        });
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

describe('ONE Connect owner routes', () => {
    let server;

    beforeAll(done => {
        const app = express();
        app.use(express.json());
        app.use('/api/dashboard', createDashboardRoutes());
        server = app.listen(0, '127.0.0.1', done);
    });

    afterAll(done => { server.close(done); });

    test('enforces authentication and owner authorization over loopback HTTP', async () => {
        const path = '/api/dashboard/owner/config/one-connect';
        await expect(request(server, { path })).resolves.toMatchObject({ status: 401 });
        await expect(request(server, {
            path,
            token: createJWT({ userId: 'member-a', role: 'user' })
        })).resolves.toMatchObject({ status: 403 });

        const response = await request(server, {
            path,
            token: createJWT({ userId: 'owner-a', role: 'owner' })
        });
        expect(response).toMatchObject({
            status: 200,
            body: { provider: '9router', featureEnabled: false, connected: false, code: 'FEATURE_DISABLED' }
        });
        expect(JSON.stringify(response.body)).not.toMatch(/apiKey|credential|serviceToken/i);
    });

    test('ignores dashboard credential-shaped payloads and fails on the startup feature flag first', async () => {
        const response = await request(server, {
            method: 'POST',
            path: '/api/dashboard/owner/config/one-connect/connect',
            token: createJWT({ userId: 'owner-a', role: 'owner' }),
            body: { apiKey: 'browser-must-not-configure', serviceToken: 'browser-must-not-configure' }
        });

        expect(response).toMatchObject({ status: 409, body: { code: 'FEATURE_DISABLED' } });
        expect(JSON.stringify(response.body)).not.toContain('browser-must-not-configure');
    });
});
