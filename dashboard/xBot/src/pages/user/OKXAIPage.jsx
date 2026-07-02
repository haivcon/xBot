import { useEffect, useMemo, useState } from 'react';
import { Bot, CheckCircle2, ClipboardCheck, Inbox, KeyRound, MessageSquare, RefreshCw, Search, Send, ShieldCheck, Sparkles, Trash2, Wallet } from 'lucide-react';
import api from '@/api/client';
import useToastStore from '@/stores/toastStore';

function Card({ children, className = '' }) {
    return (
        <div className={`rounded-2xl border border-white/10 bg-surface-900/70 shadow-xl shadow-black/10 ${className}`}>
            {children}
        </div>
    );
}

function Field({ label, children }) {
    return (
        <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-200/45">{label}</span>
            {children}
        </label>
    );
}

const inputClass = 'w-full rounded-xl border border-white/10 bg-surface-800/70 px-3 py-2.5 text-sm text-surface-100 placeholder-surface-200/30 outline-none focus:border-brand-400/60';

export default function OKXAIPage() {
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState(null);
    const [agentForm, setAgentForm] = useState({ name: 'xBot OKX.AI Bridge', role: 'user', endpoint: '', description: 'xBot bridge agent for OKX.AI A2A tasks and AI provider routing.' });
    const [searchQuery, setSearchQuery] = useState('');
    const [agents, setAgents] = useState([]);
    const [taskForm, setTaskForm] = useState({ aspAgentId: '', title: '', prompt: '', budget: '', currency: 'USD' });
    const [toolForm, setToolForm] = useState({ tool: 'okxai_wallet_status', args: '{}' });
    const [toolResult, setToolResult] = useState(null);
    const [routerStatus, setRouterStatus] = useState(null);
    const [keyForm, setKeyForm] = useState({ provider: 'openrouter', name: '', apiKey: '' });
    const [chatForm, setChatForm] = useState({ provider: 'auto', model: '', prompt: 'Bạn là xBot bridge. Trả lời ngắn gọn: OKX.AI có thể dùng API AI của server hoặc user như thế nào?' });
    const [chatResult, setChatResult] = useState(null);
    const [runtimeStatus, setRuntimeStatus] = useState(null);
    const [runtimeInbox, setRuntimeInbox] = useState([]);
    const [runtimeDecisions, setRuntimeDecisions] = useState([]);
    const [runtimeChatForm, setRuntimeChatForm] = useState({
        message: 'Hãy kiểm tra trạng thái OKX.AI bridge và đề xuất bước tiếp theo cho user.',
        provider: 'auto',
        model: '',
    });
    const [runtimeChatResult, setRuntimeChatResult] = useState(null);
    const toast = useToastStore();

    const tasks = status?.tasks || [];
    const agent = status?.agent;
    const flattenedUserKeys = Object.values(routerStatus?.userKeys || {}).flat();
    const runtimeMode = runtimeStatus?.policy?.mode || runtimeStatus?.mode || 'semi_auto';
    const runtimeDefaultProvider = runtimeStatus?.ai?.defaultProvider || runtimeStatus?.defaultProvider || 'auto';
    const providerOptions = [
        { value: 'auto', label: 'Auto route' },
        { value: 'openrouter', label: 'OpenRouter / 9Router compatible' },
        { value: 'gemini', label: 'Gemini / Google' },
        { value: 'openai', label: 'OpenAI compatible' },
        { value: 'groq', label: 'Groq' },
    ];

    const loadStatus = async () => {
        setLoading(true);
        try {
            const [data, aiRouter, agentRuntime, inboxData, decisionData] = await Promise.all([
                api.get('/okxai/status'),
                api.get('/ai-router/status').catch(() => null),
                api.get('/agent-runtime/status').catch(() => null),
                api.get('/agent-runtime/inbox?limit=20').catch(() => ({ items: [] })),
                api.get('/agent-runtime/decisions?limit=20').catch(() => ({ items: [] })),
            ]);
            setStatus(data);
            setRouterStatus(aiRouter);
            setRuntimeStatus(agentRuntime);
            setRuntimeInbox(inboxData?.items || inboxData?.inbox || []);
            setRuntimeDecisions(decisionData?.items || decisionData?.decisions || []);
            if (data?.agent) {
                setAgentForm(prev => ({
                    ...prev,
                    name: data.agent.name || prev.name,
                    role: data.agent.role || prev.role,
                    endpoint: data.agent.endpoint || prev.endpoint,
                    description: data.agent.description || prev.description,
                }));
            }
        } catch (err) {
            toast.error(err.message || 'Failed to load OKX.AI status');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStatus();
    }, []);

    const registerAgent = async (event) => {
        event.preventDefault();
        setBusy(true);
        try {
            const data = await api.post('/okxai/agents/register', agentForm);
            setStatus(prev => ({ ...(prev || {}), agent: data.agent }));
            toast.success('OKX.AI agent saved');
        } catch (err) {
            toast.error(err.message || 'Failed to register agent');
        } finally {
            setBusy(false);
        }
    };

    const searchAgents = async (event) => {
        event.preventDefault();
        setBusy(true);
        try {
            const data = await api.get(`/okxai/agents/search?query=${encodeURIComponent(searchQuery)}&limit=10`);
            setAgents(data.agents || []);
        } catch (err) {
            toast.error(err.message || 'Failed to search agents');
        } finally {
            setBusy(false);
        }
    };

    const publishTask = async (event) => {
        event.preventDefault();
        setBusy(true);
        try {
            const data = await api.post('/okxai/tasks', {
                ...taskForm,
                budget: taskForm.budget ? Number(taskForm.budget) : undefined,
            });
            setStatus(prev => ({ ...(prev || {}), tasks: [data.task, ...(prev?.tasks || [])] }));
            setTaskForm(prev => ({ ...prev, title: '', prompt: '' }));
            toast.success('Task published to OKX.AI bridge');
        } catch (err) {
            toast.error(err.message || 'Failed to publish task');
        } finally {
            setBusy(false);
        }
    };

    const executeTool = async (event) => {
        event.preventDefault();
        setBusy(true);
        try {
            let args = {};
            if (toolForm.args.trim()) args = JSON.parse(toolForm.args);
            const data = await api.post('/okxai/tools/execute', { name: toolForm.tool, arguments: args });
            setToolResult(data.result ?? data);
            toast.success('Tool executed');
        } catch (err) {
            toast.error(err.message || 'Failed to execute tool');
        } finally {
            setBusy(false);
        }
    };

    const saveProviderKey = async (event) => {
        event.preventDefault();
        setBusy(true);
        try {
            await api.post('/ai-router/keys', keyForm);
            setKeyForm(prev => ({ ...prev, name: '', apiKey: '' }));
            const aiRouter = await api.get('/ai-router/status');
            setRouterStatus(aiRouter);
            toast.success('AI provider key saved');
        } catch (err) {
            toast.error(err.message || 'Failed to save provider key');
        } finally {
            setBusy(false);
        }
    };

    const deleteProviderKey = async (keyId) => {
        setBusy(true);
        try {
            await api.delete(`/ai-router/keys/${encodeURIComponent(keyId)}`);
            const aiRouter = await api.get('/ai-router/status');
            setRouterStatus(aiRouter);
            toast.success('AI provider key deleted');
        } catch (err) {
            toast.error(err.message || 'Failed to delete provider key');
        } finally {
            setBusy(false);
        }
    };

    const setPreferredProvider = async (provider) => {
        if (!provider || provider === 'auto') return;
        setBusy(true);
        try {
            await api.put('/ai-router/preference', { provider });
            const aiRouter = await api.get('/ai-router/status');
            setRouterStatus(aiRouter);
            toast.success('Preferred provider updated');
        } catch (err) {
            toast.error(err.message || 'Failed to update preferred provider');
        } finally {
            setBusy(false);
        }
    };

    const testAiBridge = async (event) => {
        event.preventDefault();
        setBusy(true);
        try {
            const data = await api.post('/ai-router/chat', {
                provider: chatForm.provider === 'auto' ? undefined : chatForm.provider,
                model: chatForm.model || undefined,
                messages: [
                    { role: 'system', content: 'You are xBot AI Router bridge for OKX.AI. Be concise and practical.' },
                    { role: 'user', content: chatForm.prompt },
                ],
            });
            setChatResult(data);
            toast.success(`AI bridge responded via ${data.provider || 'provider'}`);
        } catch (err) {
            toast.error(err.message || 'Failed to test AI bridge');
        } finally {
            setBusy(false);
        }
    };

    const testAgentRuntime = async (event) => {
        event.preventDefault();
        setBusy(true);
        try {
            const data = await api.post('/agent-runtime/chat', {
                message: runtimeChatForm.message,
                provider: runtimeChatForm.provider === 'auto' ? undefined : runtimeChatForm.provider,
                model: runtimeChatForm.model || undefined,
            });
            setRuntimeChatResult(data);
            toast.success('Agent Runtime responded');
        } catch (err) {
            toast.error(err.message || 'Failed to test Agent Runtime');
        } finally {
            setBusy(false);
        }
    };

    const updateInboxStatus = async (id, statusValue) => {
        setBusy(true);
        try {
            await api.put(`/agent-runtime/inbox/${encodeURIComponent(id)}/status`, { status: statusValue });
            const [inboxData, decisionData] = await Promise.all([
                api.get('/agent-runtime/inbox?limit=20').catch(() => ({ items: [] })),
                api.get('/agent-runtime/decisions?limit=20').catch(() => ({ items: [] })),
            ]);
            setRuntimeInbox(inboxData?.items || inboxData?.inbox || []);
            setRuntimeDecisions(decisionData?.items || decisionData?.decisions || []);
            toast.success('Runtime inbox updated');
        } catch (err) {
            toast.error(err.message || 'Failed to update runtime inbox');
        } finally {
            setBusy(false);
        }
    };

    const statusPill = useMemo(() => {
        if (loading) return 'Loading';
        if (!agent) return 'No local agent';
        return agent.status || 'local';
    }, [agent, loading]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-400/10 px-3 py-1 text-xs font-semibold text-brand-300">
                        <Sparkles size={14} /> OKX.AI Bridge
                    </div>
                    <h1 className="mt-3 text-2xl font-bold text-surface-50">xBot as OKX.AI bridge</h1>
                    <p className="mt-1 max-w-3xl text-sm text-surface-200/60">
                        Điều phối người dùng OKX.AI qua xBot, kết nối A2A tasks với nguồn AI của server hoặc API key riêng như 9Router, Gemini, OpenAI, Groq.
                    </p>
                </div>
                <button
                    onClick={loadStatus}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-surface-100 hover:bg-white/[0.08] disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-brand-500/15 p-2 text-brand-300"><Bot size={20} /></div>
                        <div>
                            <p className="text-xs text-surface-200/45">Agent status</p>
                            <p className="font-semibold text-surface-50">{statusPill}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-300"><ShieldCheck size={20} /></div>
                        <div>
                            <p className="text-xs text-surface-200/45">Mode</p>
                            <p className="font-semibold text-surface-50">{status?.dryRun ? 'Dry-run / local draft' : 'Live OKX.AI'}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-amber-500/15 p-2 text-amber-300"><Send size={20} /></div>
                        <div>
                            <p className="text-xs text-surface-200/45">Local tasks</p>
                            <p className="font-semibold text-surface-50">{tasks.length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 md:col-span-3">
                    <div className="grid gap-4 md:grid-cols-4">
                        <div>
                            <p className="text-xs text-surface-200/45">Agent Runtime</p>
                            <p className="font-semibold text-surface-50">{runtimeMode}</p>
                        </div>
                        <div>
                            <p className="text-xs text-surface-200/45">Runtime provider</p>
                            <p className="font-semibold text-surface-50">{runtimeDefaultProvider}</p>
                        </div>
                        <div>
                            <p className="text-xs text-surface-200/45">Inbox</p>
                            <p className="font-semibold text-surface-50">{runtimeInbox.length}</p>
                        </div>
                        <div>
                            <p className="text-xs text-surface-200/45">Decisions</p>
                            <p className="font-semibold text-surface-50">{runtimeDecisions.length}</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <Card className="p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <ClipboardCheck size={18} className="text-brand-300" />
                        <h2 className="font-semibold text-surface-50">Agent Runtime control</h2>
                    </div>
                    <form onSubmit={testAgentRuntime} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Provider">
                                <select className={inputClass} value={runtimeChatForm.provider} onChange={e => setRuntimeChatForm({ ...runtimeChatForm, provider: e.target.value })}>
                                    {providerOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                            </Field>
                            <Field label="Model override">
                                <input className={inputClass} value={runtimeChatForm.model} onChange={e => setRuntimeChatForm({ ...runtimeChatForm, model: e.target.value })} placeholder="optional model id" />
                            </Field>
                        </div>
                        <Field label="Runtime message">
                            <textarea className={`${inputClass} min-h-[120px]`} value={runtimeChatForm.message} onChange={e => setRuntimeChatForm({ ...runtimeChatForm, message: e.target.value })} required />
                        </Field>
                        <button disabled={busy} className="w-full rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-400 disabled:opacity-50">
                            Send to Agent Runtime
                        </button>
                    </form>
                    {runtimeChatResult && (
                        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
                            <div className="mb-2 text-xs text-surface-200/45">
                                {runtimeChatResult.provider || runtimeChatResult.ai?.provider || 'runtime'} · {runtimeChatResult.model || runtimeChatResult.ai?.model || 'auto'}
                            </div>
                            <div className="whitespace-pre-wrap text-sm text-surface-100">
                                {runtimeChatResult.text || runtimeChatResult.response || runtimeChatResult.result?.text || JSON.stringify(runtimeChatResult, null, 2)}
                            </div>
                        </div>
                    )}
                </Card>

                <Card className="p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <Inbox size={18} className="text-brand-300" />
                        <h2 className="font-semibold text-surface-50">Runtime inbox & decisions</h2>
                    </div>
                    <div className="space-y-3">
                        {runtimeDecisions.length === 0 && runtimeInbox.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-surface-200/45">No inbound A2A runtime messages yet.</p>
                        ) : (
                            [...runtimeDecisions, ...runtimeInbox.filter(item => !runtimeDecisions.some(decision => decision.id === item.id))].slice(0, 8).map(item => (
                                <div key={item.id || `${item.jobId}-${item.createdAt}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-semibold text-surface-100">{item.event || item.msgType || 'A2A message'}</div>
                                            <div className="mt-1 text-xs text-surface-200/45">
                                                {item.senderRole || 'agent'} · {item.jobId || item.taskId || 'no-job'} · {item.status || 'unread'}
                                            </div>
                                        </div>
                                        {item.requiresDecision ? (
                                            <span className="rounded-full bg-amber-500/15 px-2 py-1 text-xs text-amber-200">decision</span>
                                        ) : null}
                                    </div>
                                    <pre className="mt-3 max-h-28 overflow-auto whitespace-pre-wrap rounded-lg bg-black/20 p-2 text-xs text-surface-200/70">
                                        {typeof item.payload === 'string' ? item.payload : JSON.stringify(item.payload || item, null, 2)}
                                    </pre>
                                    <div className="mt-3 flex gap-2">
                                        <button type="button" disabled={busy} onClick={() => updateInboxStatus(item.id, 'read')} className="rounded-lg bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-surface-100 hover:bg-white/[0.12] disabled:opacity-50">
                                            Mark read
                                        </button>
                                        {item.requiresDecision ? (
                                            <button type="button" disabled={busy} onClick={() => updateInboxStatus(item.id, 'approved')} className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-50">
                                                Approve
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <Card className="p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <KeyRound size={18} className="text-brand-300" />
                        <h2 className="font-semibold text-surface-50">AI provider router</h2>
                    </div>
                    <div className="mb-4 grid gap-3 md:grid-cols-3">
                        {(routerStatus?.providers || []).map(provider => (
                            <button
                                key={provider.provider}
                                type="button"
                                onClick={() => setPreferredProvider(provider.provider)}
                                className={`rounded-xl border p-3 text-left ${routerStatus?.preferredProvider === provider.provider ? 'border-brand-400/60 bg-brand-400/10' : 'border-white/10 bg-white/[0.03] hover:border-brand-400/30'}`}
                            >
                                <div className="text-sm font-semibold text-surface-100">{provider.provider}</div>
                                <div className="mt-1 text-xs text-surface-200/45">
                                    server: {provider.hasServerKey ? 'yes' : 'no'} · configured: {provider.configured ? 'yes' : 'no'}
                                </div>
                            </button>
                        ))}
                    </div>
                    <form onSubmit={saveProviderKey} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Provider">
                                <select className={inputClass} value={keyForm.provider} onChange={e => setKeyForm({ ...keyForm, provider: e.target.value })}>
                                    {providerOptions.filter(p => p.value !== 'auto').map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                            </Field>
                            <Field label="Key name">
                                <input className={inputClass} value={keyForm.name} onChange={e => setKeyForm({ ...keyForm, name: e.target.value })} placeholder="My OpenRouter key" />
                            </Field>
                        </div>
                        <Field label="API key">
                            <input className={inputClass} type="password" value={keyForm.apiKey} onChange={e => setKeyForm({ ...keyForm, apiKey: e.target.value })} placeholder="sk-... / AIza..." required />
                        </Field>
                        <button disabled={busy} className="w-full rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-400 disabled:opacity-50">
                            Save user API key
                        </button>
                    </form>
                    {flattenedUserKeys.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {flattenedUserKeys.map(key => (
                                <div key={key.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                    <div>
                                        <div className="text-sm font-semibold text-surface-100">{key.name || key.provider}</div>
                                        <div className="text-xs text-surface-200/45">{key.provider} · {key.maskedKey || 'saved key'}</div>
                                    </div>
                                    <button type="button" onClick={() => deleteProviderKey(key.id)} className="rounded-lg p-2 text-red-300 hover:bg-red-500/10" title="Delete key">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card className="p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <MessageSquare size={18} className="text-brand-300" />
                        <h2 className="font-semibold text-surface-50">Test OKX.AI → xBot → AI bridge</h2>
                    </div>
                    <form onSubmit={testAiBridge} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Provider">
                                <select className={inputClass} value={chatForm.provider} onChange={e => setChatForm({ ...chatForm, provider: e.target.value })}>
                                    {providerOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                            </Field>
                            <Field label="Model override">
                                <input className={inputClass} value={chatForm.model} onChange={e => setChatForm({ ...chatForm, model: e.target.value })} placeholder="optional model id" />
                            </Field>
                        </div>
                        <Field label="Prompt">
                            <textarea className={`${inputClass} min-h-[120px]`} value={chatForm.prompt} onChange={e => setChatForm({ ...chatForm, prompt: e.target.value })} required />
                        </Field>
                        <button disabled={busy} className="w-full rounded-xl bg-white/[0.08] px-4 py-2.5 text-sm font-bold text-surface-100 hover:bg-white/[0.12] disabled:opacity-50">
                            Send through AI router
                        </button>
                    </form>
                    {chatResult && (
                        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
                            <div className="mb-2 text-xs text-surface-200/45">{chatResult.provider} · {chatResult.model} · {chatResult.source}</div>
                            <div className="whitespace-pre-wrap text-sm text-surface-100">{chatResult.text || JSON.stringify(chatResult, null, 2)}</div>
                        </div>
                    )}
                </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <Card className="p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <Bot size={18} className="text-brand-300" />
                        <h2 className="font-semibold text-surface-50">Register / update local bridge agent</h2>
                    </div>
                    <form onSubmit={registerAgent} className="space-y-4">
                        <Field label="Agent name">
                            <input className={inputClass} value={agentForm.name} onChange={e => setAgentForm({ ...agentForm, name: e.target.value })} required />
                        </Field>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Role">
                                <select className={inputClass} value={agentForm.role} onChange={e => setAgentForm({ ...agentForm, role: e.target.value })}>
                                    <option value="user">User / Buyer</option>
                                    <option value="asp">ASP / Provider</option>
                                    <option value="evaluator">Evaluator</option>
                                </select>
                            </Field>
                            <Field label="Endpoint">
                                <input className={inputClass} value={agentForm.endpoint} onChange={e => setAgentForm({ ...agentForm, endpoint: e.target.value })} placeholder="https://your-domain.com/api/okxai/a2a" />
                            </Field>
                        </div>
                        <Field label="Description">
                            <textarea className={`${inputClass} min-h-[92px]`} value={agentForm.description} onChange={e => setAgentForm({ ...agentForm, description: e.target.value })} />
                        </Field>
                        {agent && (
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-surface-200/60">
                                <div className="flex items-center gap-2 text-emerald-300"><CheckCircle2 size={14} /> Agent ID: <code>{agent.agentId}</code></div>
                            </div>
                        )}
                        <button disabled={busy} className="w-full rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-400 disabled:opacity-50">
                            Save agent
                        </button>
                    </form>
                </Card>

                <Card className="p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <Search size={18} className="text-brand-300" />
                        <h2 className="font-semibold text-surface-50">Search OKX.AI providers</h2>
                    </div>
                    <form onSubmit={searchAgents} className="mb-4 flex gap-2">
                        <input className={inputClass} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="DeFi researcher, trading bot, evaluator..." />
                        <button disabled={busy} className="rounded-xl bg-white/[0.08] px-4 text-sm font-semibold text-surface-100 hover:bg-white/[0.12]">Search</button>
                    </form>
                    <div className="space-y-2">
                        {agents.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-surface-200/45">No providers loaded yet.</p>
                        ) : agents.map((item, idx) => (
                            <button
                                key={item.agentId || idx}
                                onClick={() => setTaskForm(prev => ({ ...prev, aspAgentId: item.agentId || item.id || '' }))}
                                className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left hover:border-brand-400/40"
                            >
                                <div className="font-semibold text-surface-100">{item.name || item.agentId || `Agent ${idx + 1}`}</div>
                                <div className="mt-1 text-xs text-surface-200/45">{item.description || item.role || 'OKX.AI agent'}</div>
                            </button>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <Card className="p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <Send size={18} className="text-brand-300" />
                        <h2 className="font-semibold text-surface-50">Publish A2A task</h2>
                    </div>
                    <form onSubmit={publishTask} className="space-y-4">
                        <Field label="ASP Agent ID">
                            <input className={inputClass} value={taskForm.aspAgentId} onChange={e => setTaskForm({ ...taskForm, aspAgentId: e.target.value })} required />
                        </Field>
                        <Field label="Title">
                            <input className={inputClass} value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Analyze wallet risk" />
                        </Field>
                        <Field label="Task prompt">
                            <textarea className={`${inputClass} min-h-[120px]`} value={taskForm.prompt} onChange={e => setTaskForm({ ...taskForm, prompt: e.target.value })} required />
                        </Field>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Budget">
                                <input className={inputClass} value={taskForm.budget} onChange={e => setTaskForm({ ...taskForm, budget: e.target.value })} placeholder="0" />
                            </Field>
                            <Field label="Currency">
                                <input className={inputClass} value={taskForm.currency} onChange={e => setTaskForm({ ...taskForm, currency: e.target.value })} />
                            </Field>
                        </div>
                        <button disabled={busy} className="w-full rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-400 disabled:opacity-50">
                            Publish task
                        </button>
                    </form>
                </Card>

                <Card className="p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <Wallet size={18} className="text-brand-300" />
                        <h2 className="font-semibold text-surface-50">Execute OKX.AI tool</h2>
                    </div>
                    <form onSubmit={executeTool} className="space-y-4">
                        <Field label="Tool">
                            <select className={inputClass} value={toolForm.tool} onChange={e => setToolForm({ ...toolForm, tool: e.target.value })}>
                                <option value="okxai_search_agents">okxai_search_agents</option>
                                <option value="okxai_create_task">okxai_create_task</option>
                                <option value="okxai_get_task">okxai_get_task</option>
                                <option value="okxai_wallet_status">okxai_wallet_status</option>
                                <option value="okxai_wallet_balances">okxai_wallet_balances</option>
                            </select>
                        </Field>
                        <Field label="JSON arguments">
                            <textarea className={`${inputClass} min-h-[120px] font-mono text-xs`} value={toolForm.args} onChange={e => setToolForm({ ...toolForm, args: e.target.value })} />
                        </Field>
                        <button disabled={busy} className="w-full rounded-xl bg-white/[0.08] px-4 py-2.5 text-sm font-bold text-surface-100 hover:bg-white/[0.12] disabled:opacity-50">
                            Execute
                        </button>
                    </form>
                    {toolResult && (
                        <pre className="mt-4 max-h-80 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-surface-100">
                            {JSON.stringify(toolResult, null, 2)}
                        </pre>
                    )}
                </Card>
            </div>

            <Card className="p-5">
                <h2 className="mb-4 font-semibold text-surface-50">Recent local tasks</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs uppercase tracking-wider text-surface-200/40">
                            <tr>
                                <th className="py-2 pr-4">Task</th>
                                <th className="py-2 pr-4">ASP</th>
                                <th className="py-2 pr-4">Status</th>
                                <th className="py-2 pr-4">Updated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tasks.length === 0 ? (
                                <tr><td className="py-4 text-surface-200/45" colSpan="4">No local tasks yet.</td></tr>
                            ) : tasks.map(task => (
                                <tr key={task.taskId || task.jobId || task.id}>
                                    <td className="py-3 pr-4">
                                        <div className="font-medium text-surface-100">{task.title || task.taskId || task.jobId}</div>
                                        <div className="line-clamp-1 text-xs text-surface-200/40">{task.prompt}</div>
                                    </td>
                                    <td className="py-3 pr-4 text-surface-200/60">{task.aspAgentId || '-'}</td>
                                    <td className="py-3 pr-4"><span className="rounded-full bg-white/[0.06] px-2 py-1 text-xs text-surface-100">{task.status || 'local'}</span></td>
                                    <td className="py-3 pr-4 text-surface-200/45">{task.updatedAt ? new Date(task.updatedAt).toLocaleString() : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}