'use strict';

function streamError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
}

async function parseOpenAiSse(response, options = {}) {
    if (!response?.body || typeof response.body.getReader !== 'function') {
        throw streamError('UPSTREAM_STREAM_INVALID', 'Upstream did not return a readable stream');
    }

    const onChunk = options.onChunk || (() => {});
    const maxBytes = options.maxBytes || 2 * 1024 * 1024;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let bytes = 0;
    let done = false;

    const processFrame = async (frame) => {
        const data = frame
            .split(/\r?\n/)
            .filter(line => line.startsWith('data:'))
            .map(line => line.slice(5).trimStart())
            .join('\n');
        if (!data) return;
        if (data.trim() === '[DONE]') {
            done = true;
            return;
        }
        let parsed;
        try {
            parsed = JSON.parse(data);
        } catch {
            throw streamError('UPSTREAM_STREAM_INVALID', 'Upstream returned malformed SSE data');
        }
        await onChunk(parsed);
    };

    try {
        while (!done) {
            const part = await reader.read();
            if (part.done) break;
            bytes += part.value.byteLength;
            if (bytes > maxBytes) throw streamError('UPSTREAM_STREAM_TOO_LARGE', 'Upstream stream exceeded its size limit');
            buffer += decoder.decode(part.value, { stream: true });
            const frames = buffer.split(/\r?\n\r?\n/);
            buffer = frames.pop() || '';
            for (const frame of frames) {
                await processFrame(frame);
                if (done) break;
            }
        }
        buffer += decoder.decode();
        if (!done && buffer.trim()) await processFrame(buffer);
        if (!done) throw streamError('UPSTREAM_STREAM_INCOMPLETE', 'Upstream stream closed before completion');
        return { done: true, bytes };
    } finally {
        if (done) await reader.cancel().catch(() => {});
        reader.releaseLock();
    }
}

module.exports = { parseOpenAiSse };
