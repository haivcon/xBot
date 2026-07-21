import { useState, useEffect } from 'react';
import { ArrowRight, Shield, Cpu, Globe, Lock, Layers, Wallet, BarChart3, Bot, Key, ChevronDown, BookOpen, Waves, Fingerprint, FileMusic, Sparkles } from 'lucide-react';

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
        tagline: 'Hệ sinh thái Web3 — Chat AI & Offline Vault',
        xbotTag: 'Bot Chat AI',
        xbotDesc: 'Bot giao dịch Telegram tích hợp AI Chat, phân tích on-chain, quản lý danh mục đầu tư và hỗ trợ đa ngôn ngữ. Sử dụng OKX Web3.',
        xkeyTag: 'Kho Ví Offline',
        xkeyDesc: 'Quản lý ví Web3 100% offline — xác thực sinh trắc học, mã hóa AES-256 và hỗ trợ đa ngôn ngữ. Khóa của bạn không bao giờ rời khỏi thiết bị.',
        xmusicTag: 'Danh tính âm thanh AI',
        xmusicDesc: 'Biến địa chỉ ví Web3 thành một bản nhạc độc nhất bằng AI — tạo danh tính âm thanh, xuất tệp nhạc và đúc tác phẩm thành NFT trên X Layer.',
        aiChat: 'Chat AI', analytics: 'Phân tích', telegram: 'Telegram', multiLang: 'Đa ngôn ngữ', portfolio: 'Danh mục',
        offlineVault: 'Kho Offline', aes: 'AES-256', biometric: 'Sinh trắc', languages: '15 Ngôn ngữ', batchOps: 'Thao tác hàng loạt',
        launchXbot: 'Mở xBot', launchXkey: 'Mở xKey', launchXmusic: 'Mở xMusic', source: 'Mã nguồn', okxAgent: 'OKX AI Agent',
        aiMusic: 'Âm nhạc AI', sonicIdentity: 'Danh tính âm thanh', walletSong: 'Nhạc ví', musicExport: 'Xuất nhạc', musicNft: 'NFT âm nhạc',
        footer: 'Được xây dựng bởi', docs: 'Tài liệu',
        webDemo: 'BẢN WEB DEMO', securityNotice: 'Lưu ý bảo mật', webPreviewMsg: 'Đây chỉ là bản xem trước trên web. Để bảo mật và trải nghiệm tốt nhất, vui lòng tải phiên bản mới nhất ở Github.', downloadAndroid: 'Tải bản Android trên GitHub', continueWeb: 'Tiếp tục truy cập bản Web',
    },
    en: {
        ecosystem: 'Web3 Ecosystem',
        tagline: 'Web3 Ecosystem — Chat AI & Offline Vault',
        xbotTag: 'Chat AI Bot',
        xbotDesc: 'Telegram trading bot with AI Chat, on-chain analytics, portfolio management, and multi-language support. Powered by OKX Web3.',
        xkeyTag: 'Offline Wallet Vault',
        xkeyDesc: '100% offline, secure Web3 wallet management — featuring biometric authentication, AES-256 encryption, and full i18n support across 15 languages. Your keys never leave your device.',
        xmusicTag: 'AI Sonic Identity',
        xmusicDesc: 'Turn any Web3 wallet address into a one-of-a-kind AI composition — create a sonic identity, export music files, and mint the work as an NFT on X Layer.',
        aiChat: 'Chat AI', analytics: 'Analytics', telegram: 'Telegram', multiLang: 'Multi-lang', portfolio: 'Portfolio',
        offlineVault: 'Offline Vault', aes: 'AES-256', biometric: 'Biometric', languages: '15 Languages', batchOps: 'Batch Ops',
        launchXbot: 'Launch xBot', launchXkey: 'Launch xKey', launchXmusic: 'Launch xMusic', source: 'Source', okxAgent: 'OKX AI Agent',
        aiMusic: 'AI Music', sonicIdentity: 'Sonic Identity', walletSong: 'Wallet Song', musicExport: 'Music Export', musicNft: 'Music NFT',
        footer: 'Built by', docs: 'Docs',
        webDemo: 'WEB DEMO', securityNotice: 'Security Notice', webPreviewMsg: 'This is only a web preview. For security and the best experience, please download the latest version on Github.', downloadAndroid: 'Download Android on GitHub', continueWeb: 'Continue to Web version',
    },
    zh: {
        ecosystem: 'Web3 生态系统',
        tagline: 'Web3 生态系统 — AI 交易与离线金库',
        xbotTag: 'AI 交易机器人',
        xbotDesc: '集成 AI Chat 的 Telegram 机器人，具备链上分析、投资组合管理和多语言支持。由 OKX Web3 驱动。',
        xkeyTag: '离线钱包金库',
        xkeyDesc: '100%离线、安全的Web3钱包管理 — 支持生物识别认证、AES-256加密和15种语言。您的密钥永远不会离开设备。',
        xmusicTag: 'AI 声音身份',
        xmusicDesc: '使用 AI 将任意 Web3 钱包地址转化为独一无二的乐曲 — 创建声音身份、导出音乐文件，并在 X Layer 上铸造为 NFT。',
        aiChat: 'AI Chat', analytics: '分析', telegram: 'Telegram', multiLang: '多语言', portfolio: '投资组合',
        offlineVault: '离线金库', aes: 'AES-256', biometric: '生物识别', languages: '15种语言', batchOps: '批量操作',
        launchXbot: '启动 xBot', launchXkey: '启动 xKey', launchXmusic: '启动 xMusic', source: '源代码', okxAgent: 'OKX AI Agent',
        aiMusic: 'AI 音乐', sonicIdentity: '声音身份', walletSong: '钱包之歌', musicExport: '音乐导出', musicNft: '音乐 NFT',
        footer: '由...构建', docs: '文档',
        webDemo: '网页演示版', securityNotice: '安全提示', webPreviewMsg: '这只是网页预览版。为了您的安全和最佳体验，请在Github上下载最新版本。', downloadAndroid: '在GitHub上下载Android版本', continueWeb: '继续访问网页版',
    },
    ko: {
        ecosystem: 'Web3 생태계',
        tagline: 'Web3 생태계 — AI 트레이딩 & 오프라인 금고',
        xbotTag: 'AI 트레이딩 봇',
        xbotDesc: 'AI Chat, 온체인 분석, 포트폴리오 관리 및 다국어 지원을 제공하는 텔레그램 봇입니다. OKX Web3 기반.',
        xkeyTag: '오프라인 지갑 금고',
        xkeyDesc: '100% 오프라인, 안전한 Web3 지갑 관리 — 생체 인증, AES-256 암호화 및 15개 언어 지원. 개인 키가 기기를 떠나지 않습니다.',
        xmusicTag: 'AI 사운드 아이덴티티',
        xmusicDesc: 'AI로 Web3 지갑 주소를 세상에 하나뿐인 음악으로 변환하세요 — 사운드 아이덴티티를 만들고 음악 파일을 내보내 X Layer에서 NFT로 발행합니다.',
        aiChat: 'AI Chat', analytics: '분석', telegram: '텔레그램', multiLang: '다국어', portfolio: '포트폴리오',
        offlineVault: '오프라인 금고', aes: 'AES-256', biometric: '생체인증', languages: '15개 언어', batchOps: '일괄 작업',
        launchXbot: 'xBot 실행', launchXkey: 'xKey 실행', launchXmusic: 'xMusic 실행', source: '소스코드', okxAgent: 'OKX AI Agent',
        aiMusic: 'AI 음악', sonicIdentity: '사운드 아이덴티티', walletSong: '지갑 음악', musicExport: '음악 내보내기', musicNft: '음악 NFT',
        footer: '제작자', docs: '문서',
        webDemo: '웹 데모', securityNotice: '보안 알림', webPreviewMsg: '이것은 웹 미리보기일 뿐입니다. 보안 및 최상의 경험을 위해 Github에서 최신 버전을 다운로드하세요.', downloadAndroid: 'GitHub에서 Android 버전 다운로드', continueWeb: '웹 버전 계속 이용하기',
    },
    ja: {
        ecosystem: 'Web3エコシステム',
        tagline: 'Web3エコシステム — AIトレーディング＆オフラインボールト',
        xbotTag: 'AIトレーディングボット',
        xbotDesc: 'AI Chat、オンチェーン分析、ポートフォリオ管理、多言語対応を備えたTelegramボット。OKX Web3で駆動。',
        xkeyTag: 'オフラインウォレット',
        xkeyDesc: '100%オフラインの安全なWeb3ウォレット管理 — 生体認証、AES-256暗号化、15言語対応。秘密鍵はデバイスから出ません。',
        xmusicTag: 'AIサウンドアイデンティティ',
        xmusicDesc: 'AIでWeb3ウォレットアドレスを唯一無二の楽曲に変換 — サウンドアイデンティティを作成し、音楽ファイルを出力してX Layer上でNFTとして発行できます。',
        aiChat: 'AI Chat', analytics: '分析', telegram: 'Telegram', multiLang: '多言語', portfolio: 'ポートフォリオ',
        offlineVault: 'オフライン金庫', aes: 'AES-256', biometric: '生体認証', languages: '15言語', batchOps: '一括操作',
        launchXbot: 'xBot起動', launchXkey: 'xKey起動', launchXmusic: 'xMusic起動', source: 'ソースコード', okxAgent: 'OKX AI Agent',
        aiMusic: 'AI音楽', sonicIdentity: 'サウンドID', walletSong: 'ウォレット楽曲', musicExport: '音楽出力', musicNft: '音楽NFT',
        footer: '開発者', docs: 'ドキュメント',
        webDemo: 'ウェブデモ', securityNotice: 'セキュリティに関する注意', webPreviewMsg: 'これはウェブプレビューです。セキュリティと最高のエクスペリエンスのために、Githubで最新バージョンをダウンロードしてください。', downloadAndroid: 'GitHubでAndroid版をダウンロード', continueWeb: 'ウェブ版を続行',
    },
    ru: {
        ecosystem: 'Экосистема Web3',
        tagline: 'Экосистема Web3 — AI Трейдинг & Оффлайн Хранилище',
        xbotTag: 'AI Торговый Бот',
        xbotDesc: 'Telegram-бот с AI Chat, ончейн-аналитикой, управлением портфелем и мультиязычной поддержкой. На базе OKX Web3.',
        xkeyTag: 'Оффлайн Хранилище',
        xkeyDesc: '100% оффлайн, безопасное управление Web3-кошельками — биометрия, шифрование AES-256 и поддержка 15 языков. Ключи никогда не покидают устройство.',
        xmusicTag: 'Звуковая AI-идентичность',
        xmusicDesc: 'Превратите адрес Web3-кошелька в уникальную AI-композицию — создайте звуковую идентичность, экспортируйте музыку и выпустите её как NFT в X Layer.',
        aiChat: 'AI Chat', analytics: 'Аналитика', telegram: 'Telegram', multiLang: 'Мультиязычный', portfolio: 'Портфель',
        offlineVault: 'Оффлайн', aes: 'AES-256', biometric: 'Биометрия', languages: '15 языков', batchOps: 'Пакетные',
        launchXbot: 'Открыть xBot', launchXkey: 'Открыть xKey', launchXmusic: 'Открыть xMusic', source: 'Исходники', okxAgent: 'OKX AI Agent',
        aiMusic: 'AI-музыка', sonicIdentity: 'Звуковой образ', walletSong: 'Музыка кошелька', musicExport: 'Экспорт музыки', musicNft: 'Музыкальный NFT',
        footer: 'Создано', docs: 'Документы',
        webDemo: 'ВЕБ-ДЕМО', securityNotice: 'Уведомление о безопасности', webPreviewMsg: 'Это только веб-версия для предпросмотра. Для безопасности и лучшего опыта, пожалуйста, скачайте последнюю версию на Github.', downloadAndroid: 'Скачать Android версию на GitHub', continueWeb: 'Продолжить в веб-версии',
    },
    id: {
        ecosystem: 'Ekosistem Web3',
        tagline: 'Ekosistem Web3 — AI Trading & Offline Vault',
        xbotTag: 'Bot Trading AI',
        xbotDesc: 'Bot trading Telegram dengan AI Chat, analitik on-chain, manajemen portofolio, dan dukungan multi-bahasa. Didukung oleh OKX Web3.',
        xkeyTag: 'Vault Dompet Offline',
        xkeyDesc: '100% offline, manajemen dompet Web3 yang aman — autentikasi biometrik, enkripsi AES-256, dan dukungan 15 bahasa. Kunci Anda tidak pernah meninggalkan perangkat.',
        xmusicTag: 'Identitas Sonik AI',
        xmusicDesc: 'Ubah alamat dompet Web3 menjadi komposisi AI yang unik — buat identitas sonik, ekspor file musik, dan cetak karya sebagai NFT di X Layer.',
        aiChat: 'AI Chat', analytics: 'Analitik', telegram: 'Telegram', multiLang: 'Multi-bahasa', portfolio: 'Portofolio',
        offlineVault: 'Vault Offline', aes: 'AES-256', biometric: 'Biometrik', languages: '15 Bahasa', batchOps: 'Batch',
        launchXbot: 'Buka xBot', launchXkey: 'Buka xKey', launchXmusic: 'Buka xMusic', source: 'Sumber', okxAgent: 'OKX AI Agent',
        aiMusic: 'Musik AI', sonicIdentity: 'Identitas Sonik', walletSong: 'Lagu Dompet', musicExport: 'Ekspor Musik', musicNft: 'NFT Musik',
        footer: 'Dibuat oleh', docs: 'Dokumen',
        webDemo: 'DEMO WEB', securityNotice: 'Pemberitahuan Keamanan', webPreviewMsg: 'Ini hanya pratinjau web. Untuk keamanan dan pengalaman terbaik, silakan unduh versi terbaru di Github.', downloadAndroid: 'Unduh versi Android di GitHub', continueWeb: 'Lanjutkan ke versi Web',
    },
    th: {
        ecosystem: 'ระบบนิเวศ Web3',
        tagline: 'ระบบนิเวศ Web3 — AI Trading & Offline Vault',
        xbotTag: 'บอทเทรด AI',
        xbotDesc: 'บอทเทรด Telegram พร้อม AI Chat, การวิเคราะห์ on-chain, การจัดการพอร์ต และรองรับหลายภาษา ขับเคลื่อนโดย OKX Web3',
        xkeyTag: 'กระเป๋าออฟไลน์',
        xkeyDesc: 'การจัดการกระเป๋า Web3 แบบออฟไลน์ 100% — การยืนยันตัวตนด้วยไบโอเมตริก, การเข้ารหัส AES-256 และรองรับ 15 ภาษา กุญแจของคุณไม่เคยออกจากอุปกรณ์',
        xmusicTag: 'อัตลักษณ์เสียง AI',
        xmusicDesc: 'เปลี่ยนที่อยู่กระเป๋า Web3 ให้เป็นบทเพลง AI ที่ไม่เหมือนใคร — สร้างอัตลักษณ์เสียง ส่งออกไฟล์เพลง และมินต์ผลงานเป็น NFT บน X Layer',
        aiChat: 'AI Chat', analytics: 'วิเคราะห์', telegram: 'Telegram', multiLang: 'หลายภาษา', portfolio: 'พอร์ต',
        offlineVault: 'ออฟไลน์', aes: 'AES-256', biometric: 'ไบโอเมตริก', languages: '15 ภาษา', batchOps: 'แบทช์',
        launchXbot: 'เปิด xBot', launchXkey: 'เปิด xKey', launchXmusic: 'เปิด xMusic', source: 'ซอร์สโค้ด', okxAgent: 'OKX AI Agent',
        aiMusic: 'เพลง AI', sonicIdentity: 'อัตลักษณ์เสียง', walletSong: 'เพลงกระเป๋า', musicExport: 'ส่งออกเพลง', musicNft: 'NFT เพลง',
        footer: 'สร้างโดย', docs: 'เอกสาร',
        webDemo: 'เว็บเดโม่', securityNotice: 'ประกาศด้านความปลอดภัย', webPreviewMsg: 'นี่เป็นเพียงการดูตัวอย่างผ่านเว็บ เพื่อความปลอดภัยและประสบการณ์ที่ดีที่สุด โปรดดาวน์โหลดเวอร์ชันล่าสุดบน Github', downloadAndroid: 'ดาวน์โหลดเวอร์ชัน Android บน GitHub', continueWeb: 'ดำเนินการต่อไปยังเวอร์ชันเว็บ',
    },
    es: {
        ecosystem: 'Ecosistema Web3',
        tagline: 'Ecosistema Web3 — Trading AI & Bóveda Offline',
        xbotTag: 'Bot de Trading AI',
        xbotDesc: 'Bot de trading en Telegram con chat de IA, análisis on-chain, gestión de portafolio y soporte multilingüe. Potenciado por OKX Web3.',
        xkeyTag: 'Bóveda de Billetera Offline',
        xkeyDesc: '100% offline, gestión segura de billeteras Web3 — autenticación biométrica, cifrado AES-256 y soporte para 15 idiomas. Tus claves nunca salen del dispositivo.',
        xmusicTag: 'Identidad sonora con IA',
        xmusicDesc: 'Convierte cualquier dirección de billetera Web3 en una composición de IA única — crea una identidad sonora, exporta música y acuña la obra como NFT en X Layer.',
        aiChat: 'Chat con IA', analytics: 'Analítica', telegram: 'Telegram', multiLang: 'Multi-idioma', portfolio: 'Portafolio',
        offlineVault: 'Bóveda Offline', aes: 'AES-256', biometric: 'Biométrico', languages: '15 Idiomas', batchOps: 'Lotes',
        launchXbot: 'Abrir xBot', launchXkey: 'Abrir xKey', launchXmusic: 'Abrir xMusic', source: 'Código', okxAgent: 'OKX AI Agent',
        aiMusic: 'Música IA', sonicIdentity: 'Identidad sonora', walletSong: 'Canción de billetera', musicExport: 'Exportar música', musicNft: 'NFT musical',
        footer: 'Creado por', docs: 'Docs',
        webDemo: 'DEMO WEB', securityNotice: 'Aviso de Seguridad', webPreviewMsg: 'Esta es solo una vista previa web. Para seguridad y la mejor experiencia, descarga la última versión en Github.', downloadAndroid: 'Descargar versión Android en GitHub', continueWeb: 'Continuar a la versión Web',
    },
    fr: {
        ecosystem: 'Écosystème Web3',
        tagline: 'Écosystème Web3 — Trading IA & Coffre Hors-ligne',
        xbotTag: 'Bot de Trading IA',
        xbotDesc: 'Bot de trading Telegram avec chat IA, analyse on-chain, gestion de portefeuille et support multilingue. Propulsé par OKX Web3.',
        xkeyTag: 'Coffre de Portefeuille',
        xkeyDesc: '100% hors-ligne, gestion sécurisée de portefeuilles Web3 — authentification biométrique, chiffrement AES-256 et support de 15 langues. Vos clés ne quittent jamais l\'appareil.',
        xmusicTag: 'Identité sonore par IA',
        xmusicDesc: 'Transformez toute adresse de portefeuille Web3 en composition IA unique — créez une identité sonore, exportez la musique et frappez l’œuvre en NFT sur X Layer.',
        aiChat: 'Chat IA', analytics: 'Analytique', telegram: 'Telegram', multiLang: 'Multilingue', portfolio: 'Portefeuille',
        offlineVault: 'Coffre Offline', aes: 'AES-256', biometric: 'Biométrique', languages: '15 Langues', batchOps: 'Par lots',
        launchXbot: 'Ouvrir xBot', launchXkey: 'Ouvrir xKey', launchXmusic: 'Ouvrir xMusic', source: 'Source', okxAgent: 'OKX AI Agent',
        aiMusic: 'Musique IA', sonicIdentity: 'Identité sonore', walletSong: 'Musique du portefeuille', musicExport: 'Export musical', musicNft: 'NFT musical',
        footer: 'Créé par', docs: 'Docs',
        webDemo: 'DÉMO WEB', securityNotice: 'Avis de sécurité', webPreviewMsg: 'Ceci est seulement un aperçu web. Pour la sécurité et la meilleure expérience, veuillez télécharger la dernière version sur Github.', downloadAndroid: 'Télécharger la version Android sur GitHub', continueWeb: 'Continuer vers la version Web',
    },
    de: {
        ecosystem: 'Web3-Ökosystem',
        tagline: 'Web3-Ökosystem — KI-Trading & Offline-Tresor',
        xbotTag: 'KI-Trading-Bot',
        xbotDesc: 'Telegram-Trading-Bot mit KI-Chat, On-Chain-Analyse, Portfoliomanagement und mehrsprachiger Unterstützung. Betrieben von OKX Web3.',
        xkeyTag: 'Offline-Wallet-Tresor',
        xkeyDesc: '100% offline, sichere Web3-Wallet-Verwaltung — biometrische Authentifizierung, AES-256-Verschlüsselung und Unterstützung für 15 Sprachen. Ihre Schlüssel verlassen nie das Gerät.',
        xmusicTag: 'KI-Klangidentität',
        xmusicDesc: 'Verwandle jede Web3-Wallet-Adresse in eine einzigartige KI-Komposition — erstelle eine Klangidentität, exportiere Musik und präge das Werk als NFT auf X Layer.',
        aiChat: 'KI-Chat', analytics: 'Analytik', telegram: 'Telegram', multiLang: 'Mehrsprachig', portfolio: 'Portfolio',
        offlineVault: 'Offline-Tresor', aes: 'AES-256', biometric: 'Biometrisch', languages: '15 Sprachen', batchOps: 'Stapel',
        launchXbot: 'xBot öffnen', launchXkey: 'xKey öffnen', launchXmusic: 'xMusic öffnen', source: 'Quellcode', okxAgent: 'OKX AI Agent',
        aiMusic: 'KI-Musik', sonicIdentity: 'Klangidentität', walletSong: 'Wallet-Song', musicExport: 'Musikexport', musicNft: 'Musik-NFT',
        footer: 'Erstellt von', docs: 'Docs',
        webDemo: 'WEB-DEMO', securityNotice: 'Sicherheitshinweis', webPreviewMsg: 'Dies ist nur eine Webvorschau. Für Sicherheit und das beste Erlebnis laden Sie bitte die neueste Version auf Github herunter.', downloadAndroid: 'Android-Version auf GitHub herunterladen', continueWeb: 'Weiter zur Webversion',
    },
    pt: {
        ecosystem: 'Ecossistema Web3',
        tagline: 'Ecossistema Web3 — Trading com IA & Cofre Offline',
        xbotTag: 'Bot de Trading IA',
        xbotDesc: 'Bot de trading no Telegram com chat de IA, análise on-chain, gestão de portfólio e suporte multilíngue. Potencializado pelo OKX Web3.',
        xkeyTag: 'Cofre de Carteira Offline',
        xkeyDesc: '100% offline, gestão segura de carteiras Web3 — autenticação biométrica, criptografia AES-256 e suporte para 15 idiomas. Suas chaves nunca saem do dispositivo.',
        xmusicTag: 'Identidade sonora por IA',
        xmusicDesc: 'Transforme qualquer endereço de carteira Web3 em uma composição de IA única — crie uma identidade sonora, exporte músicas e cunhe a obra como NFT na X Layer.',
        aiChat: 'Chat com IA', analytics: 'Analítica', telegram: 'Telegram', multiLang: 'Multi-idioma', portfolio: 'Portfólio',
        offlineVault: 'Cofre Offline', aes: 'AES-256', biometric: 'Biométrico', languages: '15 Idiomas', batchOps: 'Lote',
        launchXbot: 'Abrir xBot', launchXkey: 'Abrir xKey', launchXmusic: 'Abrir xMusic', source: 'Fonte', okxAgent: 'OKX AI Agent',
        aiMusic: 'Música IA', sonicIdentity: 'Identidade sonora', walletSong: 'Música da carteira', musicExport: 'Exportar música', musicNft: 'NFT musical',
        footer: 'Criado por', docs: 'Docs',
        webDemo: 'DEMO WEB', securityNotice: 'Aviso de Segurança', webPreviewMsg: 'Esta é apenas uma prévia web. Para segurança e a melhor experiência, baixe a versão mais recente no Github.', downloadAndroid: 'Baixar versão Android no GitHub', continueWeb: 'Continuar na versão Web',
    },
    ar: {
        ecosystem: 'نظام Web3 البيئي',
        tagline: 'نظام Web3 البيئي — تداول بالذكاء الاصطناعي وخزنة غير متصلة',
        xbotTag: 'بوت تداول ذكي',
        xbotDesc: 'بوت تيليجرام مزود بدردشة AI وتحليلات أون شين وإدارة محفظة ودعم متعدد اللغات. مدعوم من OKX Web3.',
        xkeyTag: 'خزنة محفظة غير متصلة',
        xkeyDesc: '100% غير متصل، إدارة آمنة لمحافظ Web3 — مصادقة بيومترية، تشفير AES-256 ودعم 15 لغة. مفاتيحك لا تغادر جهازك أبداً.',
        xmusicTag: 'هوية صوتية بالذكاء الاصطناعي',
        xmusicDesc: 'حوّل أي عنوان محفظة Web3 إلى مقطوعة فريدة بالذكاء الاصطناعي — أنشئ هوية صوتية، وصدّر الموسيقى، واسك العمل كرمز NFT على X Layer.',
        aiChat: 'دردشة AI', analytics: 'تحليلات', telegram: 'تيليجرام', multiLang: 'متعدد اللغات', portfolio: 'محفظة',
        offlineVault: 'خزنة', aes: 'AES-256', biometric: 'بيومتري', languages: '15 لغة', batchOps: 'دفعات',
        launchXbot: 'فتح xBot', launchXkey: 'فتح xKey', launchXmusic: 'فتح xMusic', source: 'المصدر', okxAgent: 'OKX AI Agent',
        aiMusic: 'موسيقى AI', sonicIdentity: 'هوية صوتية', walletSong: 'أغنية المحفظة', musicExport: 'تصدير الموسيقى', musicNft: 'NFT موسيقي',
        footer: 'صنع بواسطة', docs: 'مستندات',
        webDemo: 'عرض الويب', securityNotice: 'إشعار أمني', webPreviewMsg: 'هذه مجرد معاينة على الويب. للأمان وللحصول على أفضل تجربة، يرجى تنزيل أحدث إصدار من Github.', downloadAndroid: 'تنزيل إصدار Android على GitHub', continueWeb: 'الاستمرار إلى إصدار الويب',
    },
    hi: {
        ecosystem: 'Web3 इकोसिस्टम',
        tagline: 'Web3 इकोसिस्टम — AI ट्रेडिंग और ऑफलाइन वॉल्ट',
        xbotTag: 'AI ट्रेडिंग बॉट',
        xbotDesc: 'AI Chat, ऑन-चेन एनालिटिक्स, पोर्टफोलियो प्रबंधन और बहु-भाषा समर्थन वाला टेलीग्राम बॉट। OKX Web3 द्वारा संचालित।',
        xkeyTag: 'ऑफलाइन वॉलेट वॉल्ट',
        xkeyDesc: '100% ऑफलाइन, सुरक्षित Web3 वॉलेट प्रबंधन — बायोमेट्रिक प्रमाणीकरण, AES-256 एन्क्रिप्शन और 15 भाषाओं का समर्थन। आपकी चाबियाँ कभी डिवाइस नहीं छोड़तीं।',
        xmusicTag: 'AI सोनिक पहचान',
        xmusicDesc: 'किसी भी Web3 वॉलेट पते को एक अनोखी AI धुन में बदलें — सोनिक पहचान बनाएँ, संगीत फ़ाइलें निर्यात करें और X Layer पर रचना को NFT के रूप में मिंट करें।',
        aiChat: 'AI Chat', analytics: 'एनालिटिक्स', telegram: 'टेलीग्राम', multiLang: 'बहु-भाषा', portfolio: 'पोर्टफोलियो',
        offlineVault: 'ऑफलाइन वॉल्ट', aes: 'AES-256', biometric: 'बायोमेट्रिक', languages: '15 भाषाएँ', batchOps: 'बैच',
        launchXbot: 'xBot खोलें', launchXkey: 'xKey खोलें', launchXmusic: 'xMusic खोलें', source: 'सोर्स', okxAgent: 'OKX AI Agent',
        aiMusic: 'AI संगीत', sonicIdentity: 'सोनिक पहचान', walletSong: 'वॉलेट गीत', musicExport: 'संगीत निर्यात', musicNft: 'संगीत NFT',
        footer: 'द्वारा निर्मित', docs: 'दस्तावेज़',
        webDemo: 'वेब डेमो', securityNotice: 'सुरक्षा सूचना', webPreviewMsg: 'यह केवल एक वेब पूर्वावलोकन है। सुरक्षा और सर्वोत्तम अनुभव के लिए, कृपया Github पर नवीनतम संस्करण डाउनलोड करें।', downloadAndroid: 'GitHub पर Android संस्करण डाउनलोड करें', continueWeb: 'वेब संस्करण पर जारी रखें',
    },
    tr: {
        ecosystem: 'Web3 Ekosistemi',
        tagline: 'Web3 Ekosistemi — AI Trading & Çevrimdışı Kasa',
        xbotTag: 'AI Ticaret Botu',
        xbotDesc: 'AI Chat, zincir üstü analiz, portföy yönetimi ve çok dilli destek sunan Telegram botu. OKX Web3 ile güçlendirilmiştir.',
        xkeyTag: 'Çevrimdışı Cüzdan Kasası',
        xkeyDesc: '100% çevrimdışı, güvenli Web3 cüzdan yönetimi — biyometrik kimlik doğrulama, AES-256 şifreleme ve 15 dil desteği. Anahtarlarınız cihazınızdan asla çıkmaz.',
        xmusicTag: 'AI Ses Kimliği',
        xmusicDesc: 'Her Web3 cüzdan adresini benzersiz bir AI bestesine dönüştürün — ses kimliği oluşturun, müzik dosyalarını dışa aktarın ve eseri X Layer üzerinde NFT olarak basın.',
        aiChat: 'AI Chat', analytics: 'Analitik', telegram: 'Telegram', multiLang: 'Çok dilli', portfolio: 'Portföy',
        offlineVault: 'Çevrimdışı Kasa', aes: 'AES-256', biometric: 'Biyometrik', languages: '15 Dil', batchOps: 'Toplu İşlem',
        launchXbot: 'xBot Aç', launchXkey: 'xKey Aç', launchXmusic: 'xMusic Aç', source: 'Kaynak', okxAgent: 'OKX AI Agent',
        aiMusic: 'AI Müzik', sonicIdentity: 'Ses Kimliği', walletSong: 'Cüzdan Şarkısı', musicExport: 'Müzik Aktarımı', musicNft: 'Müzik NFT',
        footer: 'Yapımcı', docs: 'Belgeler',
        webDemo: 'WEB DEMOSU', securityNotice: 'Güvenlik Uyarısı', webPreviewMsg: 'Bu sadece bir web önizlemesidir. Güvenlik ve en iyi deneyim için lütfen en son sürümü Github\'dan indirin.', downloadAndroid: 'GitHub\'dan Android sürümünü indir', continueWeb: 'Web sürümüne devam et',
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

const GithubRepoInfo = ({ repo }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRepoData = async () => {
            try {
                const [commitRes, releaseRes] = await Promise.all([
                    fetch(`https://api.github.com/repos/${repo}/commits?per_page=1`),
                    fetch(`https://api.github.com/repos/${repo}/releases/latest`)
                ]);
                
                const commits = commitRes.ok ? await commitRes.json() : null;
                const release = releaseRes.ok ? await releaseRes.json() : null;

                if (commits && commits.length > 0) {
                    const latestCommit = commits[0];
                    setData({
                        message: latestCommit.commit.message.split('\n')[0],
                        date: new Date(latestCommit.commit.author.date).toLocaleDateString(),
                        version: release ? release.tag_name : 'main',
                        url: latestCommit.html_url
                    });
                }
            } catch (error) {
                console.error("Failed to fetch github data for", repo, error);
            } finally {
                setLoading(false);
            }
        };

        fetchRepoData();
    }, [repo]);

    if (loading) return <div className="h-16 mt-3 bg-white/[0.02] border border-white/[0.05] rounded-xl animate-pulse"></div>;
    if (!data) return null;

    return (
        <a href={data.url} target="_blank" rel="noopener noreferrer" 
           className="mt-3 flex flex-col gap-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all group min-w-0">
            <div className="flex items-center justify-between min-w-0">
                <div className="flex items-center gap-2 text-xs font-medium text-surface-400 group-hover:text-surface-300 transition-colors min-w-0 flex-1">
                    <GithubIcon size={14} className="text-surface-500 group-hover:text-white transition-colors shrink-0" />
                    <span className="truncate">{repo}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-800 text-surface-300 border border-white/[0.1] font-mono shrink-0">
                    {data.version}
                </span>
            </div>
            <div className="flex items-center justify-between gap-4 min-w-0">
                <p className="text-sm text-surface-300 truncate font-medium group-hover:text-white transition-colors flex-1 min-w-0" title={data.message}>
                    {data.message}
                </p>
                <span className="text-[10px] text-surface-500 whitespace-nowrap shrink-0">
                    {data.date}
                </span>
            </div>
        </a>
    );
};


export default function App() {
    const [lang, setLang] = useState(getInitialLang);
    const [langOpen, setLangOpen] = useState(false);
    const [showXKeyModal, setShowXKeyModal] = useState(false);

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
        <div className="hero-gradient min-h-[140vh] w-full relative overflow-x-hidden">
            {/* Background grid */}
            <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
            
            {/* Background glow orbs */}
            <div className="glow-orb-1" style={{ top: '-10%', right: '-5%' }} />
            <div className="glow-orb-2" style={{ bottom: '10%', left: '-8%' }} />

            {/* ── Top-right Navigation ── */}
            <div className="absolute top-4 right-4 sm:right-6 z-20 flex items-center gap-2 sm:gap-3">
                <a href="/docs/" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-sm font-medium text-surface-300 hover:bg-white/[0.08] hover:text-white transition-all">
                    <BookOpen size={14} className="text-purple-400" />
                    <span>{t.docs}</span>
                </a>
                
                <div className="relative">
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
            </div>

            {/* ── Hero Section ── */}
            <header className="relative z-10 pt-16 pb-10 px-4 sm:px-6 text-center">
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
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-20 grid md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">

                {/* ─── xBot Card ─── */}
                <div className="glass-card min-w-0 p-6 sm:p-8 flex flex-col animate-fade-up delay-200">
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
                        <span className="feature-pill"><Cpu size={12} className="text-blue-400" /> {t.aiChat}</span>
                        <span className="feature-pill"><BarChart3 size={12} className="text-emerald-400" /> {t.analytics}</span>
                        <span className="feature-pill"><Bot size={12} className="text-violet-400" /> {t.telegram}</span>
                        <span className="feature-pill"><Globe size={12} className="text-amber-400" /> {t.multiLang}</span>
                        <span className="feature-pill"><Wallet size={12} className="text-cyan-400" /> {t.portfolio}</span>
                    </div>

                    <div className="mt-auto flex flex-col gap-3 w-full min-w-0">
                        <a href="/xBot/" className="btn-primary btn-xbot justify-center w-full">
                            {t.launchXbot} <ArrowRight size={16} />
                        </a>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        <GithubRepoInfo repo="haivcon/xbot" />
                    </div>
                </div>

                {/* ─── xKey Card ─── */}
                <div className="glass-card min-w-0 p-6 sm:p-8 flex flex-col animate-fade-up delay-300">
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

                    <div className="mt-auto flex flex-col gap-3 w-full min-w-0">
                        <a href="/xKey/" 
                           onClick={(e) => {
                               e.preventDefault();
                               setShowXKeyModal(true);
                           }}
                           className="btn-primary btn-xkey justify-center w-full">
                            {t.launchXkey} <ArrowRight size={16} />
                        </a>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <a href="https://play.google.com/store/apps/details?id=com.haivcon.xkey" target="_blank" rel="noopener noreferrer" className="btn-outline justify-center px-1">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-surface-200">
                                    <path d="M4.646 2.378a2 2 0 0 0-.646 1.488v16.268a2 2 0 0 0 .646 1.488L13.882 12 4.646 2.378z" opacity=".6"/>
                                    <path d="m18.796 14.673-4.914-2.673 4.914-2.673 2.502 1.362a1.5 1.5 0 0 1 0 2.622l-2.502 1.362z" opacity=".8"/>
                                    <path d="m4.646 2.378 9.236 9.622 4.914-2.673L6.071 2.404A1.996 1.996 0 0 0 4.646 2.378z" opacity=".4"/>
                                    <path d="m4.646 21.622 9.236-9.622 4.914 2.673-12.725 6.923a1.996 1.996 0 0 1-1.425.026z" opacity=".3"/>
                                </svg>
                                Google Play
                            </a>
                            <a href="https://github.com/haivcon/xKey" target="_blank" rel="noopener noreferrer" className="btn-outline justify-center px-1">
                                <GithubIcon size={16} /> {t.source}
                            </a>
                        </div>
                        <GithubRepoInfo repo="haivcon/xKey" />
                    </div>
                </div>

                {/* ─── xMusic Card ─── */}
                <div className="glass-card min-w-0 p-6 sm:p-8 flex flex-col animate-fade-up delay-400 md:col-span-2 xl:col-span-1">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-violet-500/20 shadow-lg shadow-violet-500/10">
                            <img src="/xmusic-logo.jpg" alt="xMusic" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">xMusic</h2>
                            <span className="text-xs font-medium text-violet-300 bg-violet-500/10 px-2.5 py-0.5 rounded-full">
                                {t.xmusicTag}
                            </span>
                        </div>
                    </div>

                    <p className="text-surface-400 leading-relaxed mb-6">
                        {t.xmusicDesc}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-8">
                        <span className="feature-pill"><Sparkles size={12} className="text-violet-400" /> {t.aiMusic}</span>
                        <span className="feature-pill"><Fingerprint size={12} className="text-fuchsia-400" /> {t.sonicIdentity}</span>
                        <span className="feature-pill"><Waves size={12} className="text-cyan-400" /> {t.walletSong}</span>
                        <span className="feature-pill"><FileMusic size={12} className="text-amber-400" /> {t.musicExport}</span>
                        <span className="feature-pill"><Layers size={12} className="text-emerald-400" /> {t.musicNft}</span>
                    </div>

                    <div className="mt-auto flex flex-col gap-3 w-full min-w-0">
                        <a href="https://xmusic.xlayer.my" className="btn-primary btn-xmusic justify-center w-full">
                            {t.launchXmusic} <ArrowRight size={16} />
                        </a>
                        <a
                            href="https://www.okx.ai/agents/4447"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-outline justify-center w-full"
                        >
                            <Bot size={16} /> {t.okxAgent}
                        </a>

                    </div>
                </div>
            </main>

            {/* ── Footer ── */}
            <footer className="relative z-10 text-center pb-10 px-4 sm:px-6 animate-fade-up delay-500">
                <div className="border-t border-white/[0.05] pt-8 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
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

            {/* ── xKey Warning Modal ── */}
            {showXKeyModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm" onClick={() => setShowXKeyModal(false)}></div>
                    <div className="relative bg-surface-900 border border-white/[0.1] rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-fade-up">
                        <div className="p-6 sm:p-8">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                                    <Shield size={20} />
                                </div>
                                <span className="px-3 py-1 bg-[#422006] text-[#eab308] border border-[#eab308]/20 text-xs font-bold rounded-md tracking-wide">
                                    {t.webDemo}
                                </span>
                            </div>
                            
                            <h3 className="text-xl font-bold text-white mb-3">{t.securityNotice}</h3>
                            <p className="text-surface-300 text-sm leading-relaxed mb-8">
                                {t.webPreviewMsg}
                            </p>
                            
                            <div className="flex flex-col gap-3">
                                <a href="https://github.com/haivcon/xKey/releases/latest" target="_blank" rel="noopener noreferrer" 
                                   className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-white text-surface-900 font-bold rounded-xl hover:bg-surface-200 transition-all active:scale-[0.98]">
                                    <GithubIcon size={18} />
                                    {t.downloadAndroid}
                                </a>
                                <a href="/xKey/" 
                                   className="flex items-center justify-center w-full py-3.5 px-4 bg-white/[0.03] border border-white/[0.05] text-surface-300 font-medium rounded-xl hover:bg-white/[0.08] hover:text-white transition-all active:scale-[0.98]">
                                    {t.continueWeb}
                                </a>
                            </div>
                        </div>
                        
                        <button onClick={() => setShowXKeyModal(false)} className="absolute top-4 right-4 text-surface-500 hover:text-white transition-colors p-2 bg-surface-800 rounded-full hover:bg-surface-700">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
