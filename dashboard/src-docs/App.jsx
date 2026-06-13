import { useState, useEffect } from 'react';
import { DOCS_I18N } from './i18n';
import { ArrowLeft, BookOpen, Bot, Key, Code } from 'lucide-react';

const getInitialLang = () => {
    try {
        const saved = localStorage.getItem('xlayer_lang');
        if (saved && DOCS_I18N[saved]) return saved;
        const browserLang = (navigator.language || navigator.userLanguage).split('-')[0].toLowerCase();
        if (DOCS_I18N[browserLang]) return browserLang;
    } catch (e) {}
    return 'en';
};

// Extremely simple markdown-to-html converter for our docs format
const renderMarkdown = (text) => {
    let html = text
        .replace(/### (.*)/g, '<h3 class="text-xl font-semibold text-white mt-6 mb-3">$1</h3>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white">$1</strong>')
        .replace(/\n- (.*)/g, '<li class="ml-4 list-disc mt-1 text-surface-300">$1</li>')
        .replace(/\n\n/g, '<br/><br/>');
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

export default function App() {
    const [lang, setLang] = useState(getInitialLang);
    const [activeTab, setActiveTab] = useState('home');

    // Listen for localStorage changes across tabs to sync language
    useEffect(() => {
        const handleStorage = () => {
            const saved = localStorage.getItem('xlayer_lang');
            if (saved && DOCS_I18N[saved]) setLang(saved);
        };
        window.addEventListener('storage', handleStorage);
        // Fallback interval to check if the user changed it in the same window (e.g. going back to home)
        const interval = setInterval(handleStorage, 1000);
        return () => {
            window.removeEventListener('storage', handleStorage);
            clearInterval(interval);
        };
    }, []);

    const t = DOCS_I18N[lang] || DOCS_I18N['en'];
    const content = t.content[activeTab];

    const menuItems = [
        { id: 'home', icon: <BookOpen size={18} />, label: t.menu.home },
        { id: 'xbot', icon: <Bot size={18} />, label: t.menu.xbot },
        { id: 'xkey', icon: <Key size={18} />, label: t.menu.xkey },
        { id: 'dev', icon: <Code size={18} />, label: t.menu.dev }
    ];

    return (
        <div className="hero-gradient min-h-screen flex flex-col md:flex-row text-surface-100 font-sans">
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-surface-900/50 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col gap-6 shrink-0">
                <a href="/" className="flex items-center gap-2 text-white hover:text-brand-400 transition-colors font-semibold text-lg">
                    <ArrowLeft size={20} />
                    xLayer.my
                </a>
                
                <div className="text-xs uppercase tracking-wider text-surface-500 font-semibold mb-2 mt-4">
                    {t.title}
                </div>

                <nav className="flex flex-col gap-2">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                                activeTab === item.id 
                                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                                : 'text-surface-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {item.icon}
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 md:p-12 max-w-4xl overflow-y-auto">
                <div className="bg-surface-800/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl">
                    <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-6">
                        {content.title}
                    </h1>
                    
                    <div className="text-lg leading-relaxed text-surface-300">
                        {renderMarkdown(content.body)}
                    </div>
                </div>
            </div>
        </div>
    );
}
