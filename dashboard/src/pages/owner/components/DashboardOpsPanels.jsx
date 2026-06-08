import { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    Bot,
    Database,
    MessageSquare,
    RefreshCw,
    Send,
    ShieldAlert,
    TrendingUp,
    Users,
    Wallet,
    Zap,
} from 'lucide-react';
import api from '@/api/client';

function Panel({ title, icon: Icon, children, action }) {
    return (
        <section className="glass-card p-3 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
                <Icon size={17} className="text-brand-400" />
                <h2 className="text-sm font-semibold text-surface-100">{title}</h2>
                {action && <div className="ml-auto">{action}</div>}
            </div>
            {children}
        </section>
    );
}

function MiniMetric({ label, value, tone = 'brand' }) {
    const toneClass = {
        brand: 'text-brand-400 bg-brand-500/10',
        emerald: 'text-emerald-400 bg-emerald-500/10',
        amber: 'text-amber-400 bg-amber-500/10',
        rose: 'text-rose-400 bg-rose-500/10',
        cyan: 'text-cyan-400 bg-cyan-500/10',
    }[tone];
    return (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <p className="text-[10px] text-surface-200/45">{label}</p>
            <p className={`mt-1 inline-flex rounded-lg px-2 py-1 text-sm font-bold tabular-nums ${toneClass}`}>{value}</p>
        </div>
    );
}

function OperationsCenter({ health, overview, wsConnected, liveStats }) {
    const healthState = health?.status === 'ok' ? 'Operational' : 'Degraded';
    const eventLoopLag = Number(health?.eventLoopLagMs || 0);
    return (
        <Panel title="Operations Center" icon={Bot}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                <MiniMetric label="Bot status" value={healthState} tone={health?.status === 'ok' ? 'emerald' : 'amber'} />
                <MiniMetric label="WebSocket" value={wsConnected ? 'Live' : 'Offline'} tone={wsConnected ? 'emerald' : 'rose'} />
                <MiniMetric label="Telegram latency" value={overview?.telegramLatencyMs >= 0 ? `${overview.telegramLatencyMs}ms` : 'n/a'} tone={overview?.telegramLatencyMs > 500 ? 'amber' : 'cyan'} />
                <MiniMetric label="Event loop" value={`${eventLoopLag}ms`} tone={eventLoopLag > 50 ? 'rose' : 'emerald'} />
                <MiniMetric label="DB" value={health?.db || 'unknown'} tone={health?.db === 'ok' ? 'emerald' : 'amber'} />
                <MiniMetric label="Queue" value={health?.queue?.mode || 'memory'} tone="brand" />
                <MiniMetric label="Active alerts" value={liveStats?.alertsCount ?? 'n/a'} tone={(liveStats?.alertsCount || 0) > 0 ? 'amber' : 'emerald'} />
                <MiniMetric label="Heap" value={health?.memory?.heapUsed || 'n/a'} tone="cyan" />
            </div>
        </Panel>
    );
}

function ExecutiveSummary({ overview, health, liveStats }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <Panel title="Today" icon={Zap}>
                <div className="grid grid-cols-2 gap-2">
                    <MiniMetric label="New users" value={overview?.newUsersToday || 0} tone="emerald" />
                    <MiniMetric label="Commands" value={overview?.commandsToday || 0} tone="cyan" />
                </div>
            </Panel>
            <Panel title="Risk" icon={ShieldAlert}>
                <div className="grid grid-cols-2 gap-2">
                    <MiniMetric label="Alerts" value={liveStats?.alertsCount ?? 0} tone={(liveStats?.alertsCount || 0) > 0 ? 'amber' : 'emerald'} />
                    <MiniMetric label="Lag" value={`${health?.eventLoopLagMs || 0}ms`} tone={(health?.eventLoopLagMs || 0) > 50 ? 'rose' : 'emerald'} />
                </div>
            </Panel>
            <Panel title="Growth" icon={TrendingUp}>
                <div className="grid grid-cols-2 gap-2">
                    <MiniMetric label="Users" value={overview?.totalUsers || 0} tone="brand" />
                    <MiniMetric label="Groups" value={overview?.totalGroups || 0} tone="cyan" />
                </div>
            </Panel>
            <Panel title="System" icon={Database}>
                <div className="grid grid-cols-2 gap-2">
                    <MiniMetric label="DB" value={health?.db || 'unknown'} tone={health?.db === 'ok' ? 'emerald' : 'amber'} />
                    <MiniMetric label="RSS" value={health?.memory?.rss || 'n/a'} tone="brand" />
                </div>
            </Panel>
        </div>
    );
}

function CommandCenter({ onRefresh }) {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState('');

    const sendBroadcast = async (mode) => {
        if (!message.trim()) return;
        const target = mode === 'users' ? 'all users' : 'all groups';
        if (!window.confirm(`Send this message to ${target}?`)) return;
        setSending(true);
        setResult('');
        try {
            const res = mode === 'users'
                ? await api.broadcastToUsers(message.trim())
                : await api.broadcastMessage(message.trim());
            setResult(`Sent ${res.sent ?? res.success ?? 0}${res.failed != null ? `, failed ${res.failed}` : ''}`);
            setMessage('');
            onRefresh?.();
        } catch (err) {
            setResult(err.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <Panel title="Command Center" icon={Send}>
            <div className="space-y-3">
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="input-field resize-none text-sm"
                    placeholder="Prepare a broadcast message"
                />
                <div className="flex flex-wrap items-center gap-2">
                    <button disabled={sending || !message.trim()} onClick={() => sendBroadcast('users')} className="btn-primary !py-2 !px-3 text-xs disabled:opacity-40">
                        DM users
                    </button>
                    <button disabled={sending || !message.trim()} onClick={() => sendBroadcast('groups')} className="btn-secondary !py-2 !px-3 text-xs disabled:opacity-40">
                        Groups
                    </button>
                    {result && <span className="text-xs text-surface-200/45">{result}</span>}
                </div>
            </div>
        </Panel>
    );
}

function GroupControlRoom() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const res = await api.getGroups({ limit: 5, sort: 'members' });
            const topGroups = (res.groups || [])
                .slice()
                .sort((a, b) => Number(b.memberCount || 0) - Number(a.memberCount || 0))
                .slice(0, 5);
            setGroups(topGroups);
        } catch (err) {
            setStatus(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchGroups(); }, []);

    const sync = async (chatId) => {
        setStatus('Syncing group...');
        try {
            await api.syncGroupMembers(chatId);
            setStatus('Member sync queued');
            fetchGroups();
        } catch (err) {
            setStatus(err.message);
        }
    };

    return (
        <Panel
            title="Group Control Room"
            icon={MessageSquare}
            action={<button onClick={fetchGroups} className="text-surface-200/35 hover:text-brand-400"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>}
        >
            <div className="space-y-2">
                {groups.length === 0 && <p className="py-4 text-center text-xs text-surface-200/35">No groups loaded</p>}
                {groups.map(group => (
                    <div key={group.chatId} className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/5 px-3 py-2">
                        <Users size={15} className="text-cyan-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-surface-100 truncate">{group.title || group.chatId}</p>
                            <p className="text-[10px] text-surface-200/35">{group.memberCount || 0} members</p>
                        </div>
                        <button onClick={() => sync(group.chatId)} className="btn-secondary !px-2 !py-1 text-[10px]">Sync</button>
                    </div>
                ))}
                {status && <p className="text-xs text-surface-200/40">{status}</p>}
            </div>
        </Panel>
    );
}

function PortfolioRiskPanel({ liveStats }) {
    const portfolio = Number(liveStats?.portfolio || 0);
    return (
        <Panel title="Portfolio Risk" icon={Wallet}>
            <div className="grid grid-cols-2 gap-2">
                <MiniMetric label="Tracked value" value={portfolio ? `$${portfolio.toFixed(2)}` : '$0.00'} tone="brand" />
                <MiniMetric label="Pre-trade checks" value="Required" tone={portfolio > 0 ? 'amber' : 'emerald'} />
                <MiniMetric label="Token scan" value="Use before swap" tone="cyan" />
                <MiniMetric label="PIN actions" value="Protected" tone="emerald" />
            </div>
        </Panel>
    );
}

export default function DashboardOpsPanels({ ownerMode, overview, health, liveStats, wsConnected, onRefresh }) {
    const showOwnerPanels = ownerMode && overview && health;
    const riskCount = useMemo(() => {
        let count = 0;
        if (health?.status && health.status !== 'ok') count++;
        if ((health?.eventLoopLagMs || 0) > 50) count++;
        if ((liveStats?.alertsCount || 0) > 0) count++;
        return count;
    }, [health, liveStats]);

    if (!showOwnerPanels) {
        return <PortfolioRiskPanel liveStats={liveStats} />;
    }

    return (
        <div className="space-y-4">
            <ExecutiveSummary overview={overview} health={health} liveStats={liveStats} />
            <OperationsCenter health={health} overview={overview} wsConnected={wsConnected} liveStats={liveStats} />
            {riskCount > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                    <AlertTriangle size={14} />
                    {riskCount} operational risk signal{riskCount === 1 ? '' : 's'} need review.
                </div>
            )}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <CommandCenter onRefresh={onRefresh} />
                <GroupControlRoom />
                <PortfolioRiskPanel liveStats={liveStats} />
            </div>
        </div>
    );
}
