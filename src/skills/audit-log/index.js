/**
 * Audit Log Skill — Command History & Operation Logging
 * 
 * Based on onchainos okx-audit-log spec v2.2.6:
 * - Export audit logs
 * - View command history
 * - Find audit log location
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════
// Log Storage
// ═══════════════════════════════════════════════════════

const LOG_DIR = path.join(process.cwd(), 'data', 'audit-logs');
const MAX_LOG_ENTRIES = 1000;

/** @type {Array<{timestamp: string, userId: string, action: string, tool: string, args: object, result: string}>} */
let auditBuffer = [];

function ensureLogDir() {
    if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }
}

function getLogFilePath(userId) {
    ensureLogDir();
    const date = new Date().toISOString().slice(0, 10);
    return path.join(LOG_DIR, `audit_${userId || 'system'}_${date}.jsonl`);
}

/**
 * Record an audit log entry
 */
function recordAuditEntry(entry) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        ...entry
    };

    auditBuffer.push(logEntry);
    if (auditBuffer.length > MAX_LOG_ENTRIES) {
        auditBuffer = auditBuffer.slice(-MAX_LOG_ENTRIES);
    }

    // Async write to file
    try {
        ensureLogDir();
        const filePath = getLogFilePath(entry.userId);
        fs.appendFileSync(filePath, JSON.stringify(logEntry) + '\n');
    } catch (err) {
        // Silent fail for logging — don't block operations
    }
}

// ═══════════════════════════════════════════════════════
// AI Tools
// ═══════════════════════════════════════════════════════

const AUDIT_LOG_TOOLS = [{
    functionDeclarations: [
        {
            name: 'view_audit_log',
            description: 'View recent command/operation history for the current user or a specific user. Shows what tools were called, when, and their results. Use when user asks "command history", "操作记录", "audit log", "调用记录".',
            parameters: {
                type: 'object',
                properties: {
                    user_id: { type: 'string', description: 'User ID to look up (optional, defaults to current user)' },
                    limit: { type: 'string', description: 'Number of entries to show (default: 20, max: 100)' },
                    tool_filter: { type: 'string', description: 'Filter by tool/action name (optional)' }
                },
                required: []
            }
        },
        {
            name: 'export_audit_log',
            description: 'Export audit logs to a file. Returns the file path. Use when user asks "export logs", "导出日志", "download audit log".',
            parameters: {
                type: 'object',
                properties: {
                    user_id: { type: 'string', description: 'User ID (optional)' },
                    format: { type: 'string', description: 'Export format: "json" or "csv"', enum: ['json', 'csv'] },
                    date: { type: 'string', description: 'Specific date YYYY-MM-DD (optional, defaults to today)' }
                },
                required: []
            }
        },
        {
            name: 'audit_log_path',
            description: 'Show the file path where audit logs are stored. Use when user asks "log location", "日志路径", "where are logs".',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    ]
}];

// ═══════════════════════════════════════════════════════
// Tool Handlers
// ═══════════════════════════════════════════════════════

const auditLogHandlers = {
    async view_audit_log(args, context) {
        const userId = args.user_id || context?.userId || 'unknown';
        const limit = Math.min(Number(args.limit) || 20, 100);
        const toolFilter = args.tool_filter?.toLowerCase();

        // First try memory buffer
        let entries = auditBuffer.filter(e => {
            if (String(e.userId) !== String(userId)) return false;
            if (toolFilter && !e.tool?.toLowerCase().includes(toolFilter) && !e.action?.toLowerCase().includes(toolFilter)) return false;
            return true;
        });

        // If not enough in memory, try reading from file
        if (entries.length < limit) {
            try {
                const filePath = getLogFilePath(userId);
                if (fs.existsSync(filePath)) {
                    const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(l => l.trim());
                    const fileEntries = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
                    
                    if (toolFilter) {
                        entries = fileEntries.filter(e => 
                            e.tool?.toLowerCase().includes(toolFilter) || e.action?.toLowerCase().includes(toolFilter)
                        );
                    } else {
                        entries = fileEntries;
                    }
                }
            } catch (err) {
                // Fall back to memory buffer
            }
        }

        const recent = entries.slice(-limit).reverse();

        if (recent.length === 0) {
            return `📋 No audit log entries found${toolFilter ? ` matching "${toolFilter}"` : ''} for user ${userId}.`;
        }

        const parts = [`📋 Audit Log — User: ${userId} ${toolFilter ? `| Filter: ${toolFilter}` : ''}\n`];
        parts.push(`📊 Showing ${recent.length} of ${entries.length} entries\n`);

        for (const e of recent) {
            const time = e.timestamp ? new Date(e.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '?';
            const tool = e.tool || e.action || 'unknown';
            const status = e.result === 'success' || e.success ? '✅' : e.result === 'error' || e.error ? '❌' : '⚡';
            parts.push(`${status} ${time} — ${tool}`);
            if (e.details) parts.push(`   ${String(e.details).slice(0, 80)}`);
        }

        return parts.join('\n');
    },

    async export_audit_log(args, context) {
        const userId = args.user_id || context?.userId || 'unknown';
        const format = args.format || 'json';
        const date = args.date || new Date().toISOString().slice(0, 10);

        try {
            ensureLogDir();
            const srcPath = path.join(LOG_DIR, `audit_${userId}_${date}.jsonl`);
            
            if (!fs.existsSync(srcPath)) {
                // Try to write current buffer
                if (auditBuffer.length > 0) {
                    const userEntries = auditBuffer.filter(e => String(e.userId) === String(userId));
                    if (userEntries.length > 0) {
                        for (const entry of userEntries) {
                            fs.appendFileSync(srcPath, JSON.stringify(entry) + '\n');
                        }
                    } else {
                        return `📋 No audit logs found for user ${userId} on ${date}.`;
                    }
                } else {
                    return `📋 No audit logs found for user ${userId} on ${date}.`;
                }
            }

            if (format === 'csv') {
                const lines = fs.readFileSync(srcPath, 'utf8').split('\n').filter(l => l.trim());
                const entries = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
                
                const csvPath = path.join(LOG_DIR, `audit_${userId}_${date}.csv`);
                const header = 'timestamp,userId,tool,action,result,details\n';
                const rows = entries.map(e => 
                    `"${e.timestamp || ''}","${e.userId || ''}","${e.tool || ''}","${e.action || ''}","${e.result || ''}","${(e.details || '').replace(/"/g, '""')}"`
                ).join('\n');
                fs.writeFileSync(csvPath, header + rows);
                
                return `📋 Audit log exported\n📁 Path: ${csvPath}\n📊 Entries: ${entries.length}\n📄 Format: CSV`;
            }

            return `📋 Audit log available\n📁 Path: ${srcPath}\n📄 Format: JSONL (one JSON per line)`;
        } catch (err) {
            return `⚠️ Failed to export audit log: ${err.message}`;
        }
    },

    async audit_log_path() {
        ensureLogDir();
        
        let fileCount = 0;
        let totalSize = 0;
        try {
            const files = fs.readdirSync(LOG_DIR);
            fileCount = files.length;
            for (const f of files) {
                const stat = fs.statSync(path.join(LOG_DIR, f));
                totalSize += stat.size;
            }
        } catch (err) { /* ok */ }

        const parts = [
            `📁 Audit Log Location`,
            `\n📂 Directory: ${LOG_DIR}`,
            `📊 Files: ${fileCount}`,
            `💾 Total Size: ${(totalSize / 1024).toFixed(1)} KB`,
            `\n📄 Format: JSONL (one JSON object per line)`,
            `📝 Naming: audit_{userId}_{date}.jsonl`
        ];
        return parts.join('\n');
    }
};

// ═══════════════════════════════════════════════════════
// System Prompt
// ═══════════════════════════════════════════════════════

const AUDIT_LOG_SYSTEM_PROMPT = `
AUDIT LOG RULES:
1. Use view_audit_log to show recent command/operation history
2. Use export_audit_log to export logs to JSON or CSV
3. Use audit_log_path to show where logs are stored
4. This skill is for viewing operation records ONLY — not for wallet, swap, or token operations
5. Logs are stored per-user per-day in JSONL format

KEYWORD TRIGGERS:
- "audit log" / "日志" / "nhật ký" → view_audit_log
- "command history" / "操作记录" / "lịch sử" → view_audit_log
- "export log" / "导出日志" / "xuất log" → export_audit_log
- "log path" / "日志路径" / "đường dẫn log" → audit_log_path`;

module.exports = {
    name: 'audit-log',
    description: 'Command history & operation audit logging — view, export, and locate audit logs',
    enabled: true,
    tools: AUDIT_LOG_TOOLS,
    handlers: auditLogHandlers,
    systemPrompt: AUDIT_LOG_SYSTEM_PROMPT,

    // Expose for other modules to record entries
    recordAuditEntry
};