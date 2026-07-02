/**
 * Agent Runtime policy/guardrails.
 *
 * Keeps automatic bridge behavior bounded. Financial or irreversible actions
 * require explicit confirmation unless runtime mode is configured otherwise.
 */
const BRIDGE_MODES = ['manual', 'semi_auto', 'auto'];

function getBridgeMode(mode = process.env.AGENT_RUNTIME_MODE || process.env.AGENT_RUNTIME_BRIDGE_MODE || process.env.OKXAI_BRIDGE_MODE || 'semi_auto') {
    const normalized = String(mode || 'semi_auto').trim().toLowerCase();
    return BRIDGE_MODES.includes(normalized) ? normalized : 'semi_auto';
}

function assertAllowed(action, context = {}) {
    const mode = getBridgeMode(context.mode);
    const confirmed = context.confirmed === true || context.userConfirmed === true;

    const protectedActions = new Set([
        'wallet_send',
        'wallet_transfer',
        'payment_pay',
        'x402_pay',
        'task_create',
        'task_accept',
        'task_evaluate',
        'task_deliver'
    ]);

    if (protectedActions.has(action) && mode !== 'auto' && !confirmed) {
        const err = new Error(`Action ${action} requires explicit user confirmation in ${mode} mode`);
        err.code = 'CONFIRMATION_REQUIRED';
        err.action = action;
        err.mode = mode;
        throw err;
    }

    if (['task_create', 'task_accept'].includes(action) && context.budget && context.maxBudget) {
        const budget = Number(context.budget);
        const maxBudget = Number(context.maxBudget);
        if (Number.isFinite(budget) && Number.isFinite(maxBudget) && budget > maxBudget) {
            const err = new Error(`Task budget ${budget} exceeds maxBudget ${maxBudget}`);
            err.code = 'BUDGET_LIMIT_EXCEEDED';
            throw err;
        }
    }

    return { allowed: true, mode };
}

function runtimeConfig() {
    return {
        mode: getBridgeMode(),
        requireConfirmationFor: [
            'wallet_send',
            'wallet_transfer',
            'payment_pay',
            'x402_pay',
            'task_create',
            'task_accept',
            'task_evaluate',
            'task_deliver'
        ],
        maxAutoBudget: process.env.AGENT_RUNTIME_MAX_AUTO_BUDGET || null
    };
}

module.exports = {
    BRIDGE_MODES,
    getBridgeMode,
    assertAllowed,
    runtimeConfig
};