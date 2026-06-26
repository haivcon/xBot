import { useState, useEffect, useMemo } from 'react';
import { DOCS_I18N } from './i18n';
import {
    ArrowLeft,
    BookOpen,
    Bot,
    Key,
    Code,
    Search,
    Globe2,
    Link as LinkIcon,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Copy,
    Check,
    Menu,
    X,
    Info,
    AlertTriangle,
    Lightbulb,
    ShieldAlert
} from 'lucide-react';

const DOCS_ORDER = ['home', 'xbot', 'xkey', 'dev'];

const SUPPORTED_LANGS = [
    { code: 'vi', label: '🇻🇳 Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', label: '🇺🇸 English', flag: '🇺🇸' },
    { code: 'zh', label: '🇨🇳 中文', flag: '🇨🇳' },
    { code: 'ko', label: '🇰🇷 한국어', flag: '🇰🇷' },
    { code: 'ja', label: '🇯🇵 日本語', flag: '🇯🇵' },
    { code: 'ru', label: '🇷🇺 Русский', flag: '🇷🇺' },
    { code: 'id', label: '🇮🇩 Indonesia', flag: '🇮🇩' },
    { code: 'th', label: '🇹🇭 ไทย', flag: '🇹🇭' },
    { code: 'es', label: '🇪🇸 Español', flag: '🇪🇸' },
    { code: 'fr', label: '🇫🇷 Français', flag: '🇫🇷' },
    { code: 'de', label: '🇩🇪 Deutsch', flag: '🇩🇪' },
    { code: 'pt', label: '🇧🇷 Português', flag: '🇧🇷' },
    { code: 'ar', label: '🇸🇦 العربية', flag: '🇸🇦' },
    { code: 'hi', label: '🇮🇳 हिन्दी', flag: '🇮🇳' },
    { code: 'tr', label: '🇹🇷 Türkçe', flag: '🇹🇷' }
].filter((item) => DOCS_I18N[item.code]);

const getInitialLang = () => {
    try {
        const saved = localStorage.getItem('xlayer_lang');
        if (saved && DOCS_I18N[saved]) return saved;
        const browserLang = (navigator.language || navigator.userLanguage).split('-')[0].toLowerCase();
        if (DOCS_I18N[browserLang]) return browserLang;
    } catch (e) {}
    return 'en';
};

const getInitialTab = () => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    return DOCS_ORDER.includes(hash) ? hash : 'home';
};

const slugify = (value) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[`*_~()[\]{}:;,.!?/\\|]+/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

const inlineMarkdown = (text, keyPrefix = 'inline') => {
    const parts = [];
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|\[([^\]]+)\]\(([^)]+)\))/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        const token = match[0];
        if (token.startsWith('**')) {
            parts.push(
                <strong key={`${keyPrefix}-strong-${match.index}`} className="text-white font-semibold">
                    {token.slice(2, -2)}
                </strong>
            );
        } else if (token.startsWith('`')) {
            parts.push(
                <code key={`${keyPrefix}-code-${match.index}`} className="px-1.5 py-0.5 rounded-md bg-surface-950/80 border border-white/10 text-cyan-300 text-sm">
                    {token.slice(1, -1)}
                </code>
            );
        } else {
            parts.push(
                <a
                    key={`${keyPrefix}-link-${match.index}`}
                    href={match[3]}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-400 hover:text-cyan-300 underline underline-offset-4"
                >
                    {match[2]}
                </a>
            );
        }

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts;
};

const extractHeadings = (body) =>
    body
        .split('\n')
        .map((line) => {
            const match = /^(#{2,4})\s+(.+)$/.exec(line.trim());
            if (!match) return null;
            return {
                level: match[1].length,
                text: match[2],
                id: slugify(match[2])
            };
        })
        .filter(Boolean);

const parseCallout = (line) => {
    const match = /^>\s?\[!(TIP|INFO|WARNING|DANGER)\]\s?(.*)$/i.exec(line);
    if (!match) return null;
    return {
        type: match[1].toLowerCase(),
        text: match[2]
    };
};

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (e) {}
    };

    return (
        <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[11px] text-surface-300 hover:text-white hover:bg-white/[0.08] transition-colors"
            type="button"
        >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
        </button>
    );
}

function Callout({ type, children }) {
    const variants = {
        tip: {
            icon: <Lightbulb size={18} />,
            className: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
        },
        info: {
            icon: <Info size={18} />,
            className: 'border-blue-400/30 bg-blue-500/10 text-blue-100'
        },
        warning: {
            icon: <AlertTriangle size={18} />,
            className: 'border-amber-400/30 bg-amber-500/10 text-amber-100'
        },
        danger: {
            icon: <ShieldAlert size={18} />,
            className: 'border-red-400/30 bg-red-500/10 text-red-100'
        }
    };

    const variant = variants[type] || variants.info;

    return (
        <div className={`my-4 rounded-xl border p-3.5 text-sm ${variant.className}`}>
            <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{variant.icon}</div>
                <div className="leading-relaxed">{children}</div>
            </div>
        </div>
    );
}

function MarkdownRenderer({ text }) {
    const lines = text.split('\n');
    const elements = [];
    let listItems = [];
    let orderedItems = [];
    let codeBuffer = null;
    let codeLang = '';

    const flushList = () => {
        if (listItems.length) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="my-3 space-y-1.5 pl-5">
                    {listItems.map((item, index) => (
                        <li key={index} className="list-disc text-sm text-surface-300 leading-relaxed">
                            {inlineMarkdown(item, `ul-${elements.length}-${index}`)}
                        </li>
                    ))}
                </ul>
            );
            listItems = [];
        }

        if (orderedItems.length) {
            elements.push(
                <ol key={`ol-${elements.length}`} className="my-3 space-y-1.5 pl-5">
                    {orderedItems.map((item, index) => (
                        <li key={index} className="list-decimal text-sm text-surface-300 leading-relaxed">
                            {inlineMarkdown(item, `ol-${elements.length}-${index}`)}
                        </li>
                    ))}
                </ol>
            );
            orderedItems = [];
        }
    };

    lines.forEach((rawLine, index) => {
        const line = rawLine.trimEnd();

        if (line.startsWith('```')) {
            if (codeBuffer) {
                const code = codeBuffer.join('\n');
                elements.push(
                    <div key={`code-${index}`} className="my-4 overflow-hidden rounded-xl border border-white/[0.08] bg-surface-950/80">
                        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                            <span className="text-xs uppercase tracking-wider text-surface-500">{codeLang || 'code'}</span>
                            <CopyButton text={code} />
                        </div>
                        <pre className="overflow-x-auto p-3.5 text-[13px] leading-relaxed text-cyan-100">
                            <code>{code}</code>
                        </pre>
                    </div>
                );
                codeBuffer = null;
                codeLang = '';
            } else {
                flushList();
                codeBuffer = [];
                codeLang = line.replace('```', '').trim();
            }
            return;
        }

        if (codeBuffer) {
            codeBuffer.push(rawLine);
            return;
        }

        if (!line.trim()) {
            flushList();
            return;
        }

        const headingMatch = /^(#{2,4})\s+(.+)$/.exec(line.trim());
        if (headingMatch) {
            flushList();
            const level = headingMatch[1].length;
            const headingText = headingMatch[2];
            const id = slugify(headingText);
            const className =
                level === 2
                    ? 'text-xl font-bold text-white mt-8 mb-3 scroll-mt-24'
                    : level === 3
                      ? 'text-lg font-semibold text-white mt-6 mb-2.5 scroll-mt-24'
                      : 'text-base font-semibold text-white mt-5 mb-2 scroll-mt-24';

            elements.push(
                <div key={`h-${index}`} className="group flex items-center gap-2">
                    {level === 2 ? (
                        <h2 id={id} className={className}>
                            {inlineMarkdown(headingText, `h-${index}`)}
                        </h2>
                    ) : level === 3 ? (
                        <h3 id={id} className={className}>
                            {inlineMarkdown(headingText, `h-${index}`)}
                        </h3>
                    ) : (
                        <h4 id={id} className={className}>
                            {inlineMarkdown(headingText, `h-${index}`)}
                        </h4>
                    )}
                    <a href={`#${id}`} className="mt-6 opacity-0 group-hover:opacity-100 text-surface-500 hover:text-brand-400 transition-opacity">
                        <LinkIcon size={16} />
                    </a>
                </div>
            );
            return;
        }

        const callout = parseCallout(line);
        if (callout) {
            flushList();
            elements.push(
                <Callout key={`callout-${index}`} type={callout.type}>
                    {inlineMarkdown(callout.text, `callout-${index}`)}
                </Callout>
            );
            return;
        }

        const unorderedMatch = /^[-*]\s+(.+)$/.exec(line.trim());
        if (unorderedMatch) {
            orderedItems = [];
            listItems.push(unorderedMatch[1]);
            return;
        }

        const orderedMatch = /^\d+\.\s+(.+)$/.exec(line.trim());
        if (orderedMatch) {
            listItems = [];
            orderedItems.push(orderedMatch[1]);
            return;
        }

        flushList();
        elements.push(
            <p key={`p-${index}`} className="my-3 text-sm leading-relaxed text-surface-300">
                {inlineMarkdown(line, `p-${index}`)}
            </p>
        );
    });

    flushList();

    return <div>{elements}</div>;
}

export default function App() {
    const [lang, setLang] = useState(getInitialLang);
    const [activeTab, setActiveTab] = useState(getInitialTab);
    const [query, setQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const [activeHeading, setActiveHeading] = useState('');

    useEffect(() => {
        const handleStorage = () => {
            const saved = localStorage.getItem('xlayer_lang');
            if (saved && DOCS_I18N[saved]) setLang(saved);
        };
        window.addEventListener('storage', handleStorage);
        const interval = setInterval(handleStorage, 1000);
        return () => {
            window.removeEventListener('storage', handleStorage);
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#/', '').replace('#', '');
            if (DOCS_ORDER.includes(hash)) {
                setActiveTab(hash);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const t = DOCS_I18N[lang] || DOCS_I18N.en;
    const content = t.content[activeTab] || t.content.home;
    const currentLang = SUPPORTED_LANGS.find((item) => item.code === lang) || SUPPORTED_LANGS[0];
    const headings = useMemo(() => extractHeadings(content.body), [content.body]);

    useEffect(() => {
        setActiveHeading(headings[0]?.id || '');
        const observers = [];

        headings.forEach((heading) => {
            const element = document.getElementById(heading.id);
            if (!element) return;

            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setActiveHeading(heading.id);
                    }
                },
                { rootMargin: '-20% 0px -70% 0px' }
            );

            observer.observe(element);
            observers.push(observer);
        });

        return () => observers.forEach((observer) => observer.disconnect());
    }, [headings, activeTab]);

    const menuItems = [
        { id: 'home', icon: <BookOpen size={18} />, label: t.menu.home },
        { id: 'xbot', icon: <Bot size={18} />, label: t.menu.xbot },
        { id: 'xkey', icon: <Key size={18} />, label: t.menu.xkey },
        { id: 'dev', icon: <Code size={18} />, label: t.menu.dev }
    ];

    const searchResults = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return [];

        return DOCS_ORDER.map((id) => {
            const page = t.content[id];
            const haystack = `${page.title} ${page.body}`.toLowerCase();
            const index = haystack.indexOf(normalized);
            if (index === -1) return null;

            const plainBody = page.body.replace(/[#*`>\-[\]()]/g, ' ').replace(/\s+/g, ' ');
            const bodyIndex = plainBody.toLowerCase().indexOf(normalized);
            const snippetStart = Math.max(0, bodyIndex - 60);
            const snippet = bodyIndex >= 0 ? plainBody.slice(snippetStart, snippetStart + 160) : page.title;

            return { id, title: page.title, snippet };
        }).filter(Boolean);
    }, [query, t]);

    const activeIndex = DOCS_ORDER.indexOf(activeTab);
    const previousPage = activeIndex > 0 ? DOCS_ORDER[activeIndex - 1] : null;
    const nextPage = activeIndex < DOCS_ORDER.length - 1 ? DOCS_ORDER[activeIndex + 1] : null;

    const changeTab = (id) => {
        setActiveTab(id);
        setMobileMenuOpen(false);
        setLangOpen(false);
        window.history.replaceState(null, '', `#/${id}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const changeLang = (nextLang) => {
        setLang(nextLang);
        try {
            localStorage.setItem('xlayer_lang', nextLang);
        } catch (e) {}
    };

    const sidebar = (
        <>
            <a href="/" className="flex items-center gap-2 text-white hover:text-brand-400 transition-colors font-semibold text-base">
                <ArrowLeft size={18} />
                xLayer.my
            </a>

            <div>
                <div className="text-xs uppercase tracking-wider text-surface-500 font-semibold mb-2 mt-6">
                    {t.title}
                </div>

                <div className="relative mb-4">
                    <Search size={14} className="absolute left-3 top-2.5 text-surface-500" />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search docs..."
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2 pl-8 pr-3 text-sm text-white placeholder:text-surface-500 outline-none focus:border-brand-400/50 focus:bg-white/[0.05] transition-colors"
                    />
                </div>

                {query.trim() && (
                    <div className="mb-4 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-surface-950/70 p-2">
                        {searchResults.length ? (
                            searchResults.map((result) => (
                                <button
                                    key={result.id}
                                    onClick={() => {
                                        setQuery('');
                                        changeTab(result.id);
                                    }}
                                    className="w-full rounded-lg p-3 text-left hover:bg-white/5 transition-colors"
                                    type="button"
                                >
                                    <div className="text-sm font-semibold text-white">{result.title}</div>
                                    <div className="mt-1 line-clamp-2 text-xs leading-relaxed text-surface-400">{result.snippet}</div>
                                </button>
                            ))
                        ) : (
                            <div className="p-3 text-sm text-surface-400">No results found.</div>
                        )}
                    </div>
                )}

                <nav className="flex flex-col gap-1.5">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => changeTab(item.id)}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left text-sm ${
                                activeTab === item.id
                                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                                    : 'text-surface-400 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                            type="button"
                        >
                            {item.icon}
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            <div className="relative mt-auto pt-4">
                <button
                    onClick={() => setLangOpen((value) => !value)}
                    className="flex w-full items-center justify-between rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-surface-300 shadow-lg shadow-black/10 transition-all hover:bg-white/[0.08] hover:text-white"
                    type="button"
                >
                    <span className="flex items-center gap-2">
                        <Globe2 size={14} className="text-brand-400" />
                        <span className="text-base leading-none">{currentLang?.flag}</span>
                        <span className="font-medium">{currentLang?.label.replace(`${currentLang?.flag} `, '')}</span>
                    </span>
                    <ChevronDown size={13} className={`text-surface-500 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
                </button>

                {langOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-full max-h-72 overflow-y-auto rounded-xl border border-white/[0.1] bg-surface-800/95 p-1.5 shadow-2xl backdrop-blur-xl">
                        {SUPPORTED_LANGS.map((item) => (
                            <button
                                key={item.code}
                                onClick={() => {
                                    changeLang(item.code);
                                    setLangOpen(false);
                                }}
                                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                    item.code === lang ? 'bg-brand-500/20 text-brand-300' : 'text-surface-300 hover:bg-white/[0.06] hover:text-white'
                                }`}
                                type="button"
                            >
                                <span className="text-base leading-none">{item.flag}</span>
                                <span>{item.label.replace(`${item.flag} `, '')}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </>
    );

    return (
        <div className="hero-gradient min-h-screen text-surface-100 font-sans">
            <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
            <div className="glow-orb-1" style={{ top: '-18%', right: '-10%' }} />
            <div className="glow-orb-2" style={{ bottom: '8%', left: '-12%' }} />
            <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-surface-950/80 px-4 py-3 backdrop-blur-xl md:hidden">
                <a href="/" className="flex items-center gap-2 text-white font-semibold">
                    <ArrowLeft size={18} />
                    xLayer Docs
                </a>
                <button
                    onClick={() => setMobileMenuOpen((value) => !value)}
                    className="rounded-lg border border-white/10 p-2 text-surface-300"
                    type="button"
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            <div className="relative z-10 flex min-h-screen flex-col md:flex-row">
                <aside className="hidden md:flex w-64 bg-surface-900/40 backdrop-blur-xl border-r border-white/[0.08] p-5 flex-col gap-5 shrink-0 sticky top-0 h-screen">
                    {sidebar}
                </aside>

                {mobileMenuOpen && (
                    <aside className="fixed inset-x-0 top-[57px] z-30 border-b border-white/10 bg-surface-950/95 p-5 backdrop-blur-xl md:hidden">
                        <div className="flex flex-col gap-5">{sidebar}</div>
                    </aside>
                )}

                <main className="flex-1 px-4 py-5 md:p-8 lg:p-10">
                    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
                        <article className="min-w-0">
                            <div className="bg-surface-800/35 backdrop-blur-md border border-white/[0.08] rounded-2xl p-5 md:p-7 lg:p-8 shadow-2xl">
                                <div className="mb-5 flex flex-wrap items-center gap-2">
                                    <span className="rounded-full border border-brand-400/20 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-300">
                                        {menuItems.find((item) => item.id === activeTab)?.label}
                                    </span>
                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-surface-400">
                                        Updated docs experience
                                    </span>
                                </div>

                                <h1 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 mb-5 leading-tight">
                                    {content.title}
                                </h1>

                                <MarkdownRenderer text={content.body} />

                                <div className="mt-9 grid grid-cols-1 gap-3 border-t border-white/[0.08] pt-5 sm:grid-cols-2">
                                    {previousPage ? (
                                        <button
                                            onClick={() => changeTab(previousPage)}
                                            className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-3.5 text-left text-sm hover:border-brand-400/40 hover:bg-brand-500/10 transition-colors"
                                            type="button"
                                        >
                                            <ChevronLeft className="text-surface-400" size={20} />
                                            <div>
                                                <div className="text-xs text-surface-500">Previous</div>
                                                <div className="font-semibold text-white">{t.content[previousPage].title}</div>
                                            </div>
                                        </button>
                                    ) : (
                                        <div />
                                    )}

                                    {nextPage && (
                                        <button
                                            onClick={() => changeTab(nextPage)}
                                            className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-3.5 text-left text-sm hover:border-brand-400/40 hover:bg-brand-500/10 transition-colors sm:col-start-2"
                                            type="button"
                                        >
                                            <div>
                                                <div className="text-xs text-surface-500">Next</div>
                                                <div className="font-semibold text-white">{t.content[nextPage].title}</div>
                                            </div>
                                            <ChevronRight className="text-surface-400" size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </article>

                        <aside className="hidden lg:block">
                            <div className="sticky top-8 rounded-2xl border border-white/[0.08] bg-surface-900/35 p-4 backdrop-blur-xl">
                                <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-surface-500">
                                    On this page
                                </div>
                                {headings.length ? (
                                    <nav className="space-y-2">
                                        {headings.map((heading) => (
                                            <a
                                                key={heading.id}
                                                href={`#${heading.id}`}
                                                className={`block border-l pl-3 text-xs transition-colors ${
                                                    activeHeading === heading.id
                                                        ? 'border-brand-400 text-brand-300'
                                                        : 'border-white/10 text-surface-400 hover:border-white/30 hover:text-white'
                                                } ${heading.level === 4 ? 'ml-3' : heading.level === 3 ? 'ml-1.5' : ''}`}
                                            >
                                                {heading.text}
                                            </a>
                                        ))}
                                    </nav>
                                ) : (
                                    <div className="text-sm text-surface-500">No sections available.</div>
                                )}
                            </div>
                        </aside>
                    </div>
                </main>
            </div>
        </div>
    );
}