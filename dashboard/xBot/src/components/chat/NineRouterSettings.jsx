import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Activity, BarChart3, Boxes, Check, ChevronDown, CircleAlert,
    Gauge, KeyRound, Loader2, Plus, RefreshCw, Trash2, Unplug
} from 'lucide-react';
import api from '@/api/client';

const SECTIONS = [
    { id: 'providers', icon: KeyRound, key: 'providers' },
    { id: 'combos', icon: Boxes, key: 'combos' },
    { id: 'usage', icon: BarChart3, key: 'usage' },
    { id: 'quota', icon: Gauge, key: 'quota' },
];

const PROVIDERS = [
    'openai', 'anthropic', 'gemini', 'github', 'codex', 'claude',
    'qwen', 'kiro', 'xai', 'deepseek', 'openrouter', 'groq'
];

const api9r = (path, options) => api.request(`/ai/9router${path}`, options);

function EmptyState({ icon: Icon, title, description }) {
    return (
        <div className="glass-card p-5 text-center">
            <Icon size={32} className="mx-auto text-surface-200/30" />
            <p className="mt-3 text-xs font-semibold text-surface-100">{title}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-surface-200/45">{description}</p>
        </div>
    );
}

function ErrorState({ message, retry }) {
    return (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
            <div className="flex items-start gap-2 text-red-300">
                <CircleAlert size={16} className="mt-0.5 shrink-0" />
                <p className="text-[11px] leading-relaxed">{message}</p>
            </div>
            {retry && (
                <button type="button" onClick={retry} className="btn-secondary mt-3 text-[10px]">
                    <RefreshCw size={14} /> Retry
                </button>
            )}
        </div>
    );
}

function Providers({ onChanged }) {
    const { t } = useTranslation();
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ provider: 'openai', name: '', apiKey: '' });

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await api9r('/providers');
            setConnections(data.connections || data.providers || (Array.isArray(data) ? data : []));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const add = async event => {
        event.preventDefault();
        if (!form.apiKey.trim()) return;
        setSaving(true);
        setError('');
        try {
            await api9r('/providers', {
                method: 'POST',
                body: JSON.stringify({
                    provider: form.provider,
                    authType: 'api_key',
                    name: form.name.trim() || undefined,
                    apiKey: form.apiKey.trim()
                })
            });
            setForm(current => ({ ...current, name: '', apiKey: '' }));
            await load();
            onChanged?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const remove = async id => {
        setError('');
        try {
            await api9r(`/providers/${encodeURIComponent(id)}`, { method: 'DELETE' });
            await load();
            onChanged?.();
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-brand-400" /></div>;

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-brand-500/20 bg-brand-500/10 p-3 text-[10px] leading-relaxed text-surface-200/70">
                {t('dashboard.chatPage.nineRouterPrivateNotice', 'Each provider account is isolated to your Telegram account. Other users and bot owners cannot use it.')}
            </div>
            {error && <ErrorState message={error} retry={load} />}
            <form onSubmit={add} className="glass-card space-y-3 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-200/45">
                    {t('dashboard.chatPage.addProvider', 'Connect provider')}
                </p>
                <div className="relative">
                    <select
                        value={form.provider}
                        onChange={event => setForm({ ...form, provider: event.target.value })}
                        className="input-field w-full appearance-none pr-8 text-xs"
                    >
                        {PROVIDERS.map(provider => <option key={provider} value={provider}>{provider}</option>)}
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-surface-200/40" />
                </div>
                <input
                    value={form.name}
                    onChange={event => setForm({ ...form, name: event.target.value })}
                    className="input-field w-full text-xs"
                    placeholder={t('dashboard.chatPage.connectionName', 'Connection name (optional)')}
                />
                <input
                    type="password"
                    autoComplete="off"
                    value={form.apiKey}
                    onChange={event => setForm({ ...form, apiKey: event.target.value })}
                    className="input-field w-full text-xs"
                    placeholder={t('dashboard.chatPage.providerCredential', 'API key or provider token')}
                />
                <button type="submit" disabled={saving || !form.apiKey.trim()} className="btn-primary w-full text-xs">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {t('dashboard.chatPage.connect', 'Connect')}
                </button>
            </form>

            {!connections.length ? (
                <EmptyState
                    icon={Unplug}
                    title={t('dashboard.chatPage.noProviders', 'No provider connected')}
                    description={t('dashboard.chatPage.noProvidersDesc', 'Connect an account to make its models available in Chat AI.')}
                />
            ) : (
                <div className="space-y-2">
                    {connections.map(connection => (
                        <div key={connection.id} className="glass-card flex items-center gap-3 p-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
                                <KeyRound size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-surface-100">
                                    {connection.name || connection.displayName || connection.email || connection.provider}
                                </p>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="badge badge-info text-[8px]">{connection.provider}</span>
                                    <span className={connection.isActive === false ? 'badge badge-danger text-[8px]' : 'badge badge-success text-[8px]'}>
                                        {connection.isActive === false ? 'Inactive' : 'Active'}
                                    </span>
                                </div>
                            </div>
                            <button type="button" onClick={() => remove(connection.id)} className="btn-danger p-2" aria-label="Delete provider">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Combos({ connections, onChanged }) {
    const { t } = useTranslation();
    const [combos, setCombos] = useState([]);
    const [name, setName] = useState('');
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await api9r('/combos');
            setCombos(data.combos || (Array.isArray(data) ? data : []));
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const create = async event => {
        event.preventDefault();
        if (!name.trim() || !selected.length) return;
        try {
            await api9r('/combos', {
                method: 'POST',
                body: JSON.stringify({ name: name.trim(), kind: 'llm', models: selected })
            });
            setName('');
            setSelected([]);
            await load();
            onChanged?.();
        } catch (err) { setError(err.message); }
    };

    const remove = async id => {
        try {
            await api9r(`/combos/${encodeURIComponent(id)}`, { method: 'DELETE' });
            await load();
            onChanged?.();
        } catch (err) { setError(err.message); }
    };

    if (loading) return <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-brand-400" /></div>;

    return (
        <div className="space-y-4">
            {error && <ErrorState message={error} retry={load} />}
            <form onSubmit={create} className="glass-card space-y-3 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-200/45">
                    {t('dashboard.chatPage.createCombo', 'Create routing combo')}
                </p>
                <input value={name} onChange={event => setName(event.target.value)} className="input-field w-full text-xs" placeholder={t('dashboard.chatPage.comboName', 'Combo name')} />
                <div className="max-h-36 space-y-1 overflow-auto">
                    {connections.map(connection => (
                        <label key={connection.id} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-white/5">
                            <input
                                type="checkbox"
                                checked={selected.includes(connection.id)}
                                onChange={() => setSelected(current => current.includes(connection.id) ? current.filter(id => id !== connection.id) : [...current, connection.id])}
                                className="accent-brand-500"
                            />
                            <span className="truncate text-[11px] text-surface-200/75">{connection.name || connection.email || connection.provider}</span>
                        </label>
                    ))}
                </div>
                <button type="submit" disabled={!name.trim() || !selected.length} className="btn-primary w-full text-xs"><Plus size={16} />{t('dashboard.chatPage.create', 'Create')}</button>
            </form>
            {!combos.length ? (
                <EmptyState icon={Boxes} title={t('dashboard.chatPage.noCombos', 'No combos')} description={t('dashboard.chatPage.noCombosDesc', 'Combine provider accounts into fallback or load-balanced routes.')} />
            ) : combos.map(combo => (
                <div key={combo.id} className="glass-card flex items-center gap-3 p-3">
                    <Boxes size={20} className="text-brand-400" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-surface-100">{combo.name}</p>
                        <p className="text-[9px] text-surface-200/40">{(combo.models || []).length} routes</p>
                    </div>
                    <button type="button" onClick={() => remove(combo.id)} className="btn-danger p-2"><Trash2 size={16} /></button>
                </div>
            ))}
        </div>
    );
}

function Usage() {
    const { t } = useTranslation();
    const [period, setPeriod] = useState('7d');
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try { setData(await api9r(`/usage/chart?period=${period}`)); }
        catch (err) { setError(err.message); } finally { setLoading(false); }
    }, [period]);

    useEffect(() => { load(); }, [load]);

    const points = data?.data || data?.chart || data?.history || [];
    const totals = data?.totals || data?.summary || {};
    const maxValue = Math.max(1, ...points.map(point => Number(point.requests || point.total || 0)));

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                {['24h', '7d', '30d'].map(value => (
                    <button key={value} type="button" onClick={() => setPeriod(value)} className={period === value ? 'btn-primary text-[10px]' : 'btn-secondary text-[10px]'}>{value}</button>
                ))}
                <button type="button" onClick={load} className="btn-secondary ml-auto p-2"><RefreshCw size={14} /></button>
            </div>
            {loading ? <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-brand-400" /></div>
                : error ? <ErrorState message={error} retry={load} />
                    : (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    ['Requests', totals.requests ?? data?.totalRequests ?? 0],
                                    ['Tokens', totals.totalTokens ?? data?.totalTokens ?? 0],
                                    ['Input', totals.promptTokens ?? data?.promptTokens ?? 0],
                                    ['Output', totals.completionTokens ?? data?.completionTokens ?? 0]
                                ].map(([label, value]) => (
                                    <div key={label} className="stat-card p-3">
                                        <p className="text-[9px] uppercase tracking-wide text-surface-200/40">{label}</p>
                                        <p className="mt-1 text-lg font-bold text-surface-100">{Number(value || 0).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                            {!points.length ? <EmptyState icon={Activity} title={t('dashboard.chatPage.noUsage', 'No usage yet')} description={t('dashboard.chatPage.noUsageDesc', 'Requests made from dashboard and Telegram will appear here.')} />
                                : (
                                    <div className="glass-card p-3">
                                        <div className="flex h-32 items-end gap-1">
                                            {points.slice(-30).map((point, index) => (
                                                <div key={point.date || point.timestamp || index} title={`${point.date || ''}: ${point.requests || point.total || 0}`} className="min-w-0 flex-1 rounded-t bg-brand-500/70" style={{ height: `${Math.max(4, (Number(point.requests || point.total || 0) / maxValue) * 100)}%` }} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                        </>
                    )}
        </div>
    );
}

function Quota({ connections }) {
    const { t } = useTranslation();
    const [quota, setQuota] = useState({});
    const [loading, setLoading] = useState({});
    const [errors, setErrors] = useState({});

    const refresh = useCallback(async connection => {
        setLoading(current => ({ ...current, [connection.id]: true }));
        setErrors(current => ({ ...current, [connection.id]: '' }));
        try {
            const value = await api9r(`/usage/${encodeURIComponent(connection.id)}`);
            setQuota(current => ({ ...current, [connection.id]: value }));
        } catch (err) {
            setErrors(current => ({ ...current, [connection.id]: err.message }));
        } finally {
            setLoading(current => ({ ...current, [connection.id]: false }));
        }
    }, []);

    useEffect(() => {
        connections.forEach(connection => refresh(connection));
    }, [connections, refresh]);

    if (!connections.length) return <EmptyState icon={Gauge} title={t('dashboard.chatPage.noQuota', 'No quota to track')} description={t('dashboard.chatPage.noQuotaDesc', 'Connect a supported provider account first.')} />;

    return (
        <div className="space-y-2">
            {connections.map(connection => {
                const value = quota[connection.id] || {};
                const rows = value.quotas || value.limits || [];
                return (
                    <div key={connection.id} className="glass-card p-3">
                        <div className="flex items-center gap-2">
                            <Gauge size={16} className="text-brand-400" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-surface-100">{connection.name || connection.email || connection.provider}</p>
                                <p className="text-[9px] text-surface-200/40">{connection.provider}</p>
                            </div>
                            <button type="button" onClick={() => refresh(connection)} disabled={loading[connection.id]} className="btn-secondary p-2">
                                <RefreshCw size={14} className={loading[connection.id] ? 'animate-spin' : ''} />
                            </button>
                        </div>
                        {errors[connection.id] && <p className="mt-2 text-[10px] text-red-300">{errors[connection.id]}</p>}
                        {!loading[connection.id] && !errors[connection.id] && (
                            <div className="mt-3 space-y-2">
                                {rows.length ? rows.map((row, index) => {
                                    const remaining = Number(row.remaining ?? row.percentage ?? row.percentRemaining ?? 0);
                                    return (
                                        <div key={row.id || row.name || index}>
                                            <div className="mb-1 flex justify-between text-[9px] text-surface-200/55">
                                                <span>{row.name || row.label || 'Quota'}</span><span>{Number.isFinite(remaining) ? `${remaining}%` : '—'}</span>
                                            </div>
                                            <div className="h-1.5 overflow-hidden rounded-full bg-surface-700">
                                                <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(0, Math.min(100, remaining))}%` }} />
                                            </div>
                                        </div>
                                    );
                                }) : <p className="text-[10px] text-surface-200/40">{value.message || t('dashboard.chatPage.quotaUnavailable', 'This provider does not expose quota details.')}</p>}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function NineRouterSettings({ onModelsChanged }) {
    const { t } = useTranslation();
    const [section, setSection] = useState('providers');
    const [connections, setConnections] = useState([]);

    const loadConnections = useCallback(async () => {
        try {
            const data = await api9r('/providers');
            setConnections(data.connections || data.providers || (Array.isArray(data) ? data : []));
        } catch { setConnections([]); }
    }, []);

    useEffect(() => { loadConnections(); }, [loadConnections]);

    const changed = useCallback(() => {
        loadConnections();
        onModelsChanged?.();
    }, [loadConnections, onModelsChanged]);

    const content = useMemo(() => {
        if (section === 'providers') return <Providers onChanged={changed} />;
        if (section === 'combos') return <Combos connections={connections} onChanged={changed} />;
        if (section === 'usage') return <Usage />;
        return <Quota connections={connections} />;
    }, [changed, connections, section]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-800/60 p-1">
                {SECTIONS.map(item => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setSection(item.id)}
                            className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-medium transition-colors ${
                                section === item.id ? 'bg-brand-500/15 text-brand-400' : 'text-surface-200/50 hover:bg-white/5'
                            }`}
                        >
                            <Icon size={14} />
                            {t(`dashboard.chatPage.nineRouter_${item.key}`, item.key)}
                        </button>
                    );
                })}
            </div>
            {content}
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/10 p-3 text-[9px] text-emerald-200/70">
                <Check size={14} />
                {t('dashboard.chatPage.nineRouterTenantBound', 'Bound to your authenticated Telegram account')}
            </div>
        </div>
    );
}