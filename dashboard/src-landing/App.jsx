import { useState, useEffect } from 'react';
import { ArrowRight, Shield, Cpu, Globe, Smartphone, Lock, Layers, Wallet, BarChart3, Bot, Key, ChevronDown } from 'lucide-react';

const GithubIcon = ({ size = 16, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
);

const LANGUAGES = [
    { code: 'vi', label: '🇻🇳 Tiếng Việt' },
    { code: 'en', label: '🇺🇸 English' },
    { code: 'zh', label: '🇨🇳 中文' },
    { code: 'ko', label: '🇰🇷 한국어' },
    { code: 'ja', label: '🇯🇵 日本語' },
    { code: 'ru', label: '🇷🇺 Русский' },
    { code: 'id', label: '🇮🇩 Bahasa' },
    { code: 'th', label: '🇹🇭 ไทย' },
    { code: 'es', label: '🇪🇸 Español' },
    { code: 'fr', label: '🇫🇷 Français' },
    { code: 'de', label: '🇩🇪 Deutsch' },
    { code: 'pt', label: '🇧🇷 Português' },
    { code: 'ar', label: '🇸🇦 العربية' },
    { code: 'hi', label: '🇮🇳 हिन्दी' },
    { code: 'tr', label: '🇹🇷 Türkçe' },
];

const TEXTS = {
    vi: {
        ecosystem: 'Hệ sinh thái Web3',
        tagline: 'Hệ sinh thái Web3 — AI Trading & Offline Vault',
        xbotTag: 'Bot Giao dịch AI',
        xbotDesc: 'Bot giao dịch Telegram tích hợp AI với phân tích on-chain, copy trading thông minh, quản lý danh mục đầu tư và hỗ trợ đa ngôn ngữ. Sử dụng OKX Web3.',
        xkeyTag: 'Kho Ví Offline',
        xkeyDesc: 'Quản lý ví Web3 100% offline — xác thực sinh trắc học, mã hóa AES-256 và hỗ trợ đa ngôn ngữ. Khóa của bạn không bao giờ rời khỏi thiết bị.',
        aiTrading: 'AI Trading', analytics: 'Phân tích', telegram: 'Telegram', multiLang: 'Đa ngôn ngữ', portfolio: 'Danh mục',
        offlineVault: 'Kho Offline', aes: 'AES-256', biometric: 'Sinh trắc', languages: '15 Ngôn ngữ', batchOps: 'Thao tác hàng loạt',
        launchXbot: 'Mở xBot', launchXkey: 'Mở xKey', source: 'Mã nguồn',
        footer: 'Được xây dựng bởi',
    },
    en: {
        ecosystem: 'Web3 Ecosystem',
        tagline: 'Web3 Ecosystem — AI Trading & Offline Vault',
        xbotTag: 'AI Trading Bot',
        xbotDesc: 'AI-powered Telegram trading bot with on-chain analytics, smart copy trading, portfolio management, and multi-language support. Powered by OKX Web3.',
        xkeyTag: 'Offline Wallet Vault',
        xkeyDesc: '100% offline, secure Web3 wallet management — featuring biometric authentication, AES-256 encryption, and full i18n support across 15 languages. Your keys never leave your device.',
        aiTrading: 'AI Trading', analytics: 'Analytics', telegram: 'Telegram', multiLang: 'Multi-lang', portfolio: 'Portfolio',
        offlineVault: 'Offline Vault', aes: 'AES-256', biometric: 'Biometric', languages: '15 Languages', batchOps: 'Batch Ops',
        launchXbot: 'Launch xBot', launchXkey: 'Launch xKey', source: 'Source',
        footer: 'Built by',
    },
    zh: {
        ecosystem: 'Web3 生态系统',
        tagline: 'Web3 生态系统 — AI 交易与离线金库',
        xbotTag: 'AI 交易机器人',
        xbotDesc: '基于AI的Telegram交易机器人，具备链上分析、智能跟单、投资组合管理和多语言支持。由OKX Web3驱动。',
        xkeyTag: '离线钱包金库',
        xkeyDesc: '100%离线、安全的Web3钱包管理 — 支持生物识别认证、AES-256加密和15种语言。您的密钥永远不会离开设备。',
        aiTrading: 'AI 交易', analytics: '分析', telegram: 'Telegram', multiLang: '多语言', portfolio: '投资组合',
        offlineVault: '离线金库', aes: 'AES-256', biometric: '生物识别', languages: '15种语言', batchOps: '批量操作',
        launchXbot: '启动 xBot', launchXkey: '启动 xKey', source: '源代码',
        footer: '由...构建',
    },
    ko: {
        ecosystem: 'Web3 생태계',
        tagline: 'Web3 생태계 — AI 트레이딩 & 오프라인 금고',
        xbotTag: 'AI 트레이딩 봇',
        xbotDesc: 'AI 기반 텔레그램 트레이딩 봇으로 온체인 분석, 스마트 카피 트레이딩, 포트폴리오 관리 및 다국어 지원을 제공합니다. OKX Web3 기반.',
        xkeyTag: '오프라인 지갑 금고',
        xkeyDesc: '100% 오프라인, 안전한 Web3 지갑 관리 — 생체 인증, AES-256 암호화 및 15개 언어 지원. 개인 키가 기기를 떠나지 않습니다.',
        aiTrading: 'AI 트레이딩', analytics: '분석', telegram: '텔레그램', multiLang: '다국어', portfolio: '포트폴리오',
        offlineVault: '오프라인 금고', aes: 'AES-256', biometric: '생체인증', languages: '15개 언어', batchOps: '일괄 작업',
        launchXbot: 'xBot 실행', launchXkey: 'xKey 실행', source: '소스코드',
        footer: '제작자',
    },
    ja: {
        ecosystem: 'Web3エコシステム',
        tagline: 'Web3エコシステム — AIトレーディング＆オフラインボールト',
        xbotTag: 'AIトレーディングボット',
        xbotDesc: 'AI搭載のTelegramトレーディングボット。オンチェーン分析、スマートコピートレード、ポートフォリオ管理、多言語対応。OKX Web3で駆動。',
        xkeyTag: 'オフラインウォレット',
        xkeyDesc: '100%オフラインの安全なWeb3ウォレット管理 — 生体認証、AES-256暗号化、15言語対応。秘密鍵はデバイスから出ません。',
        aiTrading: 'AIトレード', analytics: '分析', telegram: 'Telegram', multiLang: '多言語', portfolio: 'ポートフォリオ',
        offlineVault: 'オフライン金庫', aes: 'AES-256', biometric: '生体認証', languages: '15言語', batchOps: '一括操作',
        launchXbot: 'xBot起動', launchXkey: 'xKey起動', source: 'ソースコード',
        footer: '開発者',
    },
    ru: {
        ecosystem: 'Экосистема Web3',
        tagline: 'Экосистема Web3 — AI Трейдинг & Оффлайн Хранилище',
        xbotTag: 'AI Торговый Бот',
        xbotDesc: 'AI-бот для торговли в Telegram с ончейн-аналитикой, умным копи-трейдингом, управлением портфелем и мультиязычной поддержкой. На базе OKX Web3.',
        xkeyTag: 'Оффлайн Хранилище',
        xkeyDesc: '100% оффлайн, безопасное управление Web3-кошельками — биометрия, шифрование AES-256 и поддержка 15 языков. Ключи никогда не покидают устройство.',
        aiTrading: 'AI Трейдинг', analytics: 'Аналитика', telegram: 'Telegram', multiLang: 'Мультиязычный', portfolio: 'Портфель',
        offlineVault: 'Оффлайн', aes: 'AES-256', biometric: 'Биометрия', languages: '15 языков', batchOps: 'Пакетные',
        launchXbot: 'Открыть xBot', launchXkey: 'Открыть xKey', source: 'Исходники',
        footer: 'Создано',
    },
    id: {
        ecosystem: 'Ekosistem Web3',
        tagline: 'Ekosistem Web3 — AI Trading & Offline Vault',
        xbotTag: 'Bot Trading AI',
        xbotDesc: 'Bot trading Telegram bertenaga AI dengan analitik on-chain, smart copy trading, manajemen portofolio, dan dukungan multi-bahasa. Didukung oleh OKX Web3.',
        xkeyTag: 'Vault Dompet Offline',
        xkeyDesc: '100% offline, manajemen dompet Web3 yang aman — autentikasi biometrik, enkripsi AES-256, dan dukungan 15 bahasa. Kunci Anda tidak pernah meninggalkan perangkat.',
        aiTrading: 'AI Trading', analytics: 'Analitik', telegram: 'Telegram', multiLang: 'Multi-bahasa', portfolio: 'Portofolio',
        offlineVault: 'Vault Offline', aes: 'AES-256', biometric: 'Biometrik', languages: '15 Bahasa', batchOps: 'Batch',
        launchXbot: 'Buka xBot', launchXkey: 'Buka xKey', source: 'Sumber',
        footer: 'Dibuat oleh',
    },
    th: {
        ecosystem: 'ระบบนิเวศ Web3',
        tagline: 'ระบบนิเวศ Web3 — AI Trading & Offline Vault',
        xbotTag: 'บอทเทรด AI',
        xbotDesc: 'บอทเทรด Telegram ที่ขับเคลื่อนด้วย AI พร้อมการวิเคราะห์ on-chain, smart copy trading, การจัดการพอร์ต และรองรับหลายภาษา ขับเคลื่อนโดย OKX Web3',
        xkeyTag: 'กระเป๋าออฟไลน์',
        xkeyDesc: 'การจัดการกระเป๋า Web3 แบบออฟไลน์ 100% — การยืนยันตัวตนด้วยไบโอเมตริก, การเข้ารหัส AES-256 และรองรับ 15 ภาษา กุญแจของคุณไม่เคยออกจากอุปกรณ์',
        aiTrading: 'AI Trading', analytics: 'วิเคราะห์', telegram: 'Telegram', multiLang: 'หลายภาษา', portfolio: 'พอร์ต',
        offlineVault: 'ออฟไลน์', aes: 'AES-256', biometric: 'ไบโอเมตริก', languages: '15 ภาษา', batchOps: 'แบทช์',
        launchXbot: 'เปิด xBot', launchXkey: 'เปิด xKey', source: 'ซอร์สโค้ด',
        footer: 'สร้างโดย',
    },
    es: {
        ecosystem: 'Ecosistema Web3',
        tagline: 'Ecosistema Web3 — Trading AI & Bóveda Offline',
        xbotTag: 'Bot de Trading AI',
        xbotDesc: 'Bot de trading en Telegram con IA, análisis on-chain, copy trading inteligente, gestión de portafolio y soporte multilingüe. Potenciado por OKX Web3.',
        xkeyTag: 'Bóveda de Billetera Offline',
        xkeyDesc: '100% offline, gestión segura de billeteras Web3 — autenticación biométrica, cifrado AES-256 y soporte para 15 idiomas. Tus claves nunca salen del dispositivo.',
        aiTrading: 'Trading AI', analytics: 'Analítica', telegram: 'Telegram', multiLang: 'Multi-idioma', portfolio: 'Portafolio',
        offlineVault: 'Bóveda Offline', aes: 'AES-256', biometric: 'Biométrico', languages: '15 Idiomas', batchOps: 'Lotes',
        launchXbot: 'Abrir xBot', launchXkey: 'Abrir xKey', source: 'Código',
        footer: 'Creado por',
    },
    fr: {
        ecosystem: 'Écosystème Web3',
        tagline: 'Écosystème Web3 — Trading IA & Coffre Hors-ligne',
        xbotTag: 'Bot de Trading IA',
        xbotDesc: 'Bot de trading Telegram propulsé par l\'IA avec analyse on-chain, copy trading intelligent, gestion de portefeuille et support multilingue. Propulsé par OKX Web3.',
        xkeyTag: 'Coffre de Portefeuille',
        xkeyDesc: '100% hors-ligne, gestion sécurisée de portefeuilles Web3 — authentification biométrique, chiffrement AES-256 et support de 15 langues. Vos clés ne quittent jamais l\'appareil.',
        aiTrading: 'Trading IA', analytics: 'Analytique', telegram: 'Telegram', multiLang: 'Multilingue', portfolio: 'Portefeuille',
        offlineVault: 'Coffre Offline', aes: 'AES-256', biometric: 'Biométrique', languages: '15 Langues', batchOps: 'Par lots',
        launchXbot: 'Ouvrir xBot', launchXkey: 'Ouvrir xKey', source: 'Source',
        footer: 'Créé par',
    },
    de: {
        ecosystem: 'Web3-Ökosystem',
        tagline: 'Web3-Ökosystem — KI-Trading & Offline-Tresor',
        xbotTag: 'KI-Trading-Bot',
        xbotDesc: 'KI-gestützter Telegram-Trading-Bot mit On-Chain-Analyse, Smart Copy Trading, Portfoliomanagement und mehrsprachiger Unterstützung. Betrieben von OKX Web3.',
        xkeyTag: 'Offline-Wallet-Tresor',
        xkeyDesc: '100% offline, sichere Web3-Wallet-Verwaltung — biometrische Authentifizierung, AES-256-Verschlüsselung und Unterstützung für 15 Sprachen. Ihre Schlüssel verlassen nie das Gerät.',
        aiTrading: 'KI-Trading', analytics: 'Analytik', telegram: 'Telegram', multiLang: 'Mehrsprachig', portfolio: 'Portfolio',
        offlineVault: 'Offline-Tresor', aes: 'AES-256', biometric: 'Biometrisch', languages: '15 Sprachen', batchOps: 'Stapel',
        launchXbot: 'xBot öffnen', launchXkey: 'xKey öffnen', source: 'Quellcode',
        footer: 'Erstellt von',
    },
    pt: {
        ecosystem: 'Ecossistema Web3',
        tagline: 'Ecossistema Web3 — Trading com IA & Cofre Offline',
        xbotTag: 'Bot de Trading IA',
        xbotDesc: 'Bot de trading no Telegram com IA, análise on-chain, copy trading inteligente, gestão de portfólio e suporte multilíngue. Potencializado pelo OKX Web3.',
        xkeyTag: 'Cofre de Carteira Offline',
        xkeyDesc: '100% offline, gestão segura de carteiras Web3 — autenticação biométrica, criptografia AES-256 e suporte para 15 idiomas. Suas chaves nunca saem do dispositivo.',
        aiTrading: 'Trading IA', analytics: 'Analítica', telegram: 'Telegram', multiLang: 'Multi-idioma', portfolio: 'Portfólio',
        offlineVault: 'Cofre Offline', aes: 'AES-256', biometric: 'Biométrico', languages: '15 Idiomas', batchOps: 'Lote',
        launchXbot: 'Abrir xBot', launchXkey: 'Abrir xKey', source: 'Fonte',
        footer: 'Criado por',
    },
    ar: {
        ecosystem: 'نظام Web3 البيئي',
        tagline: 'نظام Web3 البيئي — تداول بالذكاء الاصطناعي وخزنة غير متصلة',
        xbotTag: 'بوت تداول ذكي',
        xbotDesc: 'بوت تداول تيليجرام مدعوم بالذكاء الاصطناعي مع تحليلات أون شين، نسخ تداول ذكي، إدارة محفظة ودعم متعدد اللغات. مدعوم من OKX Web3.',
        xkeyTag: 'خزنة محفظة غير متصلة',
        xkeyDesc: '100% غير متصل، إدارة آمنة لمحافظ Web3 — مصادقة بيومترية، تشفير AES-256 ودعم 15 لغة. مفاتيحك لا تغادر جهازك أبداً.',
        aiTrading: 'تداول AI', analytics: 'تحليلات', telegram: 'تيليجرام', multiLang: 'متعدد اللغات', portfolio: 'محفظة',
        offlineVault: 'خزنة', aes: 'AES-256', biometric: 'بيومتري', languages: '15 لغة', batchOps: 'دفعات',
        launchXbot: 'فتح xBot', launchXkey: 'فتح xKey', source: 'المصدر',
        footer: 'صنع بواسطة',
    },
    hi: {
        ecosystem: 'Web3 इकोसिस्टम',
        tagline: 'Web3 इकोसिस्टम — AI ट्रेडिंग और ऑफलाइन वॉल्ट',
        xbotTag: 'AI ट्रेडिंग बॉट',
        xbotDesc: 'AI-संचालित टेलीग्राम ट्रेडिंग बॉट जिसमें ऑन-चेन एनालिटिक्स, स्मार्ट कॉपी ट्रेडिंग, पोर्टफोलियो प्रबंधन और बहु-भाषा समर्थन है। OKX Web3 द्वारा संचालित।',
        xkeyTag: 'ऑफलाइन वॉलेट वॉल्ट',
        xkeyDesc: '100% ऑफलाइन, सुरक्षित Web3 वॉलेट प्रबंधन — बायोमेट्रिक प्रमाणीकरण, AES-256 एन्क्रिप्शन और 15 भाषाओं का समर्थन। आपकी चाबियाँ कभी डिवाइस नहीं छोड़तीं।',
        aiTrading: 'AI ट्रेडिंग', analytics: 'एनालिटिक्स', telegram: 'टेलीग्राम', multiLang: 'बहु-भाषा', portfolio: 'पोर्टफोलियो',
        offlineVault: 'ऑफलाइन वॉल्ट', aes: 'AES-256', biometric: 'बायोमेट्रिक', languages: '15 भाषाएँ', batchOps: 'बैच',
        launchXbot: 'xBot खोलें', launchXkey: 'xKey खोलें', source: 'सोर्स',
        footer: 'द्वारा निर्मित',
    },
    tr: {
        ecosystem: 'Web3 Ekosistemi',
        tagline: 'Web3 Ekosistemi — AI Trading & Çevrimdışı Kasa',
        xbotTag: 'AI Ticaret Botu',
        xbotDesc: 'AI destekli Telegram ticaret botu — zincir üstü analiz, akıllı kopya ticaret, portföy yönetimi ve çok dilli destek. OKX Web3 ile güçlendirilmiştir.',
        xkeyTag: 'Çevrimdışı Cüzdan Kasası',
        xkeyDesc: '100% çevrimdışı, güvenli Web3 cüzdan yönetimi — biyometrik kimlik doğrulama, AES-256 şifreleme ve 15 dil desteği. Anahtarlarınız cihazınızdan asla çıkmaz.',
        aiTrading: 'AI Ticaret', analytics: 'Analitik', telegram: 'Telegram', multiLang: 'Çok dilli', portfolio: 'Portföy',
        offlineVault: 'Çevrimdışı Kasa', aes: 'AES-256', biometric: 'Biyometrik', languages: '15 Dil', batchOps: 'Toplu İşlem',
        launchXbot: 'xBot Aç', launchXkey: 'xKey Aç', source: 'Kaynak',
        footer: 'Yapımcı',
    },
};

const getInitialLang = () => {
    try {
        const saved = localStorage.getItem('xlayer_lang');
        if (saved && LANGUAGES.some(l => l.code === saved)) return saved;
        const browserLang = (navigator.language || navigator.userLanguage).split('-')[0].toLowerCase();
        if (LANGUAGES.some(l => l.code === browserLang)) return browserLang;
    } catch (e) {}
    return 'en';
};

export default function App() {
    const [lang, setLang] = useState(getInitialLang);
    const [langOpen, setLangOpen] = useState(false);

    useEffect(() => {
        try { localStorage.setItem('xlayer_lang', lang); } catch (e) {}
    }, [lang]);
    
    // Auto-redirect to xBot dashboard if opened within Telegram Mini App
    useEffect(() => {
        const hash = window.location.hash || '';
        if (hash.includes('tgWebAppData')) {
            window.location.replace('/xBot/' + hash);
        }
    }, []);

    const t = TEXTS[lang] || TEXTS.vi;
    const currentLang = LANGUAGES.find(l => l.code === lang);

    return (
        <div className="hero-gradient min-h-[140vh] relative overflow-hidden">
            {/* Background grid */}
            <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
            
            {/* Background glow orbs */}
            <div className="glow-orb-1" style={{ top: '-10%', right: '-5%' }} />
            <div className="glow-orb-2" style={{ bottom: '10%', left: '-8%' }} />

            {/* ── Language Selector (top-right) ── */}
            <div className="absolute top-4 right-6 z-20">
                <button
                    onClick={() => setLangOpen(!langOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-sm text-surface-300 hover:bg-white/[0.08] hover:text-white transition-all"
                >
                    <Globe size={14} className="text-brand-400" />
                    <span>{currentLang?.label.split(' ')[0]}</span>
                    <ChevronDown size={12} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
                </button>
                {langOpen && (
                    <div className="absolute right-0 mt-2 w-44 max-h-80 overflow-y-auto bg-surface-800/95 backdrop-blur-xl border border-white/[0.1] rounded-xl shadow-2xl">
                        {LANGUAGES.map(l => (
                            <button
                                key={l.code}
                                onClick={() => { setLang(l.code); setLangOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                    l.code === lang ? 'bg-brand-500/20 text-brand-400' : 'text-surface-300 hover:bg-white/[0.05] hover:text-white'
                                }`}
                            >
                                {l.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Hero Section ── */}
            <header className="relative z-10 pt-16 pb-10 px-6 text-center">
                <div className="animate-fade-up max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] mb-8 text-sm text-surface-400">
                        <Layers size={14} className="text-brand-400" />
                        <span>{t.ecosystem}</span>
                    </div>

                    <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-4">
                        <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-[length:200%_auto] animate-[gradient-shift_5s_ease-in-out_infinite] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                            xLayer
                        </span>
                        <span className="text-blue-400">.my</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-surface-400 max-w-xl mx-auto leading-relaxed animate-fade-up delay-100">
                        {t.tagline}
                    </p>
                </div>
            </header>

            {/* ── App Cards ── */}
            <main className="relative z-10 max-w-5xl mx-auto px-6 pb-20 grid md:grid-cols-2 gap-8">

                {/* ─── xBot Card ─── */}
                <div className="glass-card p-8 flex flex-col animate-fade-up delay-200">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10">
                            <img src="/xbot-logo.png" alt="xBot" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">xBot</h2>
                            <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full">
                                {t.xbotTag}
                            </span>
                        </div>
                    </div>

                    <p className="text-surface-400 leading-relaxed mb-6">
                        {t.xbotDesc}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-8">
                        <span className="feature-pill"><Cpu size={12} className="text-blue-400" /> {t.aiTrading}</span>
                        <span className="feature-pill"><BarChart3 size={12} className="text-emerald-400" /> {t.analytics}</span>
                        <span className="feature-pill"><Bot size={12} className="text-violet-400" /> {t.telegram}</span>
                        <span className="feature-pill"><Globe size={12} className="text-amber-400" /> {t.multiLang}</span>
                        <span className="feature-pill"><Wallet size={12} className="text-cyan-400" /> {t.portfolio}</span>
                    </div>

                    <div className="mt-auto flex flex-col gap-3 w-full">
                        <a href="/xBot/" className="btn-primary btn-xbot justify-center w-full">
                            {t.launchXbot} <ArrowRight size={16} />
                        </a>
                        <div className="grid grid-cols-2 gap-3">
                            <a href="https://github.com/haivcon/xbot" target="_blank" rel="noopener noreferrer" className="btn-outline justify-center px-1">
                                <GithubIcon size={16} /> {t.source}
                            </a>
                            <a href="https://t.me/XlayerAi_bot" target="_blank" rel="noopener noreferrer" className="btn-outline justify-center px-1">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-surface-200">
                                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.686c.223-.195-.054-.282-.346-.09l-6.4 4.024-2.76-.86c-.6-.185-.612-.6.125-.89l10.814-4.18c.5-.184.95.12.75 1.05z"/>
                                </svg>
                                Telegram
                            </a>
                        </div>
                    </div>
                </div>

                {/* ─── xKey Card ─── */}
                <div className="glass-card p-8 flex flex-col animate-fade-up delay-300">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-500/10">
                            <img src="/xkey-logo.png" alt="xKey" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">xKey</h2>
                            <span className="text-xs font-medium text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full">
                                {t.xkeyTag}
                            </span>
                        </div>
                    </div>

                    <p className="text-surface-400 leading-relaxed mb-6">
                        {t.xkeyDesc}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-8">
                        <span className="feature-pill"><Shield size={12} className="text-emerald-400" /> {t.offlineVault}</span>
                        <span className="feature-pill"><Lock size={12} className="text-red-400" /> {t.aes}</span>
                        <span className="feature-pill"><Key size={12} className="text-amber-400" /> {t.biometric}</span>
                        <span className="feature-pill"><Globe size={12} className="text-blue-400" /> {t.languages}</span>
                        <span className="feature-pill"><Layers size={12} className="text-violet-400" /> {t.batchOps}</span>
                    </div>

                    <div className="mt-auto flex flex-col gap-3 w-full">
                        <a href="/xKey/" className="btn-primary btn-xkey justify-center w-full">
                            {t.launchXkey} <ArrowRight size={16} />
                        </a>
                        <div className="grid grid-cols-2 gap-3">
                            <a href="https://play.google.com/store/apps/details?id=com.haivcon.xkey" target="_blank" rel="noopener noreferrer" className="btn-outline justify-center px-1">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-surface-200">
                                    <path d="M4.646 2.378a2 2 0 0 0-.646 1.488v16.268a2 2 0 0 0 .646 1.488L13.882 12 4.646 2.378z" opacity=".6"/>
                                    <path d="m18.796 14.673-4.914-2.673 4.914-2.673 2.502 1.362a1.5 1.5 0 0 1 0 2.622l-2.502 1.362z" opacity=".8"/>
                                    <path d="m4.646 2.378 9.236 9.622 4.914-2.673L6.071 2.404A1.996 1.996 0 0 0 4.646 2.378z" opacity=".4"/>
                                    <path d="m4.646 21.622 9.236-9.622 4.914 2.673-12.725 6.923a1.996 1.996 0 0 1-1.425.026z" opacity=".3"/>
                                </svg>
                                Google Play
                            </a>
                            <a href="https://github.com/haivcon/xkey" target="_blank" rel="noopener noreferrer" className="btn-outline justify-center px-1">
                                <GithubIcon size={16} /> {t.source}
                            </a>
                        </div>
                    </div>
                </div>
            </main>

            {/* ── Footer ── */}
            <footer className="relative z-10 text-center pb-10 px-6 animate-fade-up delay-500">
                <div className="border-t border-white/[0.05] pt-8 max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-wrap justify-center items-center gap-6">
                        <a href="https://x.com/XlayerAi_bot" target="_blank" rel="noopener noreferrer" className="text-surface-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            @XlayerAi_bot
                        </a>
                        <a href="https://x.com/haivcon" target="_blank" rel="noopener noreferrer" className="text-surface-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            Dev: @haivcon
                        </a>
                    </div>
                    <p className="text-surface-500 text-sm">
                        {t.footer}{' '}
                        <a href="https://t.me/haivcon" target="_blank" rel="noopener noreferrer" className="text-surface-400 hover:text-white transition-colors">
                            ＤＯＲＥＭＯＮ
                        </a>
                        {' '}•{' '}
                        <span className="text-surface-400">xLayer.my</span>
                    </p>
                </div>
            </footer>
        </div>
    );
}
