export const DOCS_I18N = {
  vi: {
    title: "Tài liệu hệ sinh thái",
    menu: { home: "Giới thiệu", xbot: "🤖 xBot AI", xkey: "🔑 xKey Vault", dev: "💻 Dành cho Dev" },
    content: {
      home: {
        title: "Chào mừng đến với xLayer",
        body: "Hệ sinh thái xLayer được xây dựng để cung cấp bộ công cụ toàn diện và bảo mật nhất cho người dùng Web3. Sự kết hợp giữa tốc độ của giao dịch trên Telegram và độ an toàn tuyệt đối của ví ngoại tuyến mang đến một trải nghiệm không thỏa hiệp.\n\n### Mục tiêu cốt lõi\n- **Bảo mật tối đa**: Với triết lý Zero-Trust, private key của bạn không bao giờ rời khỏi thiết bị.\n- **Tốc độ vượt trội**: xBot sử dụng hạ tầng mạng lưới độc lập giúp khớp lệnh siêu tốc.\n- **Đa chuỗi**: Hỗ trợ EVM, Solana, TRON.\n\n### Luồng vận hành chuẩn\n1. Tải và cài đặt xKey Vault trên điện thoại.\n2. Khởi tạo ví hoặc import seed phrase hoàn toàn offline.\n3. Trích xuất mã Private Key đã được mã hóa.\n4. Mở ứng dụng xBot trên Telegram và dán khóa an toàn để bắt đầu giao dịch."
      },
      xbot: {
        title: "xBot - Cỗ Máy AI Trading",
        body: "xBot không chỉ là một Telegram bot thông thường. Đây là một cỗ máy giao dịch On-chain được tích hợp AI tiên tiến nhất.\n\n### Tính năng nổi bật\n- **Phân tích On-Chain & AI**: Tích hợp dữ liệu từ OKX Web3, xBot có khả năng lọc nhiễu, phát hiện Smart Money (Dòng tiền thông minh) và theo vết dòng tiền của Cá Mập.\n- **Copy Trading Thông Minh**: Dễ dàng cấu hình bot để theo dõi bất kỳ ví nào. Khi ví đó giao dịch, bot sẽ sao chép lập tức trên Base, BSC hoặc Ethereum.\n- **Thao tác hàng loạt (Batch Ops)**: Thay vì chuyển tiền thủ công, xBot cho phép phân bổ tài sản đến hàng chục ví con, thực hiện Batch Swap và tự động gom token về ví chính chỉ với một lệnh.\n- **Quản lý rủi ro tự động**: Tính năng Take-profit và Stop-loss nâng cao, chống MEV bot và tự động điều chỉnh trượt giá (Slippage) khi mạng nghẽn."
      },
      xkey: {
        title: "xKey - Kho Lưu Trữ Offline",
        body: "Bảo mật là yếu tố sống còn trong Web3. xKey là giải pháp lưu trữ hoàn toàn ngoại tuyến, biến điện thoại cũ của bạn thành một chiếc ví lạnh an toàn tuyệt đối.\n\n### Cơ chế hoạt động\n- **100% Offline**: Ứng dụng hoàn toàn không có quyền truy cập Internet. Không một dòng code nào có thể gửi dữ liệu của bạn ra ngoài.\n- **Mã hóa Cấp độ Quân sự**: Dữ liệu được mã hóa chuẩn AES-256-CBC kết hợp với Salt ngẫu nhiên và PBKDF2.\n- **Bảo vệ Sinh trắc học**: Bất kỳ hành động nhạy cảm nào (xem private key, xuất dữ liệu) đều yêu cầu xác thực bằng vân tay hoặc FaceID.\n\n### Hướng dẫn sử dụng\n1. Tắt kết nối WiFi/4G trên thiết bị dự phòng.\n2. Mở xKey, thiết lập mã PIN 6 số an toàn.\n3. Dễ dàng quản lý danh mục hàng trăm ví con mà không bao giờ lo sợ bị hacker dòm ngó."
      },
      dev: {
        title: "Mã Nguồn Mở & Cộng Đồng",
        body: "Chúng tôi tin tưởng tuyệt đối vào sức mạnh của mã nguồn mở và sự minh bạch trong Web3.\n\n### Mã nguồn mở 100%\nTất cả các thành phần cốt lõi của hệ sinh thái xKey và xBot đều được công khai trên Github. Bất kỳ chuyên gia bảo mật hay lập trình viên nào cũng có thể tự do kiểm toán (Audit) mã nguồn của chúng tôi.\n\n- **xKey Repository**: `github.com/haivcon/xkey`\n- **xBot Repository**: `github.com/haivcon/xbot`\n\n### Hướng dẫn đóng góp (Contributing)\n1. Fork dự án về Github cá nhân của bạn.\n2. Tạo một nhánh mới (`git checkout -b feature/AmazingFeature`).\n3. Commit các thay đổi và tối ưu hóa code.\n4. Push nhánh của bạn (`git push origin feature/AmazingFeature`).\n5. Tạo một Pull Request. Đội ngũ kỹ sư của chúng tôi sẽ phản hồi trong vòng 24h."
      }
    }
  },
  en: {
    title: "Ecosystem Docs",
    menu: { home: "Introduction", xbot: "🤖 xBot AI", xkey: "🔑 xKey Vault", dev: "💻 Developers" },
    content: {
      home: {
        title: "Welcome to xLayer",
        body: "The xLayer ecosystem provides the most comprehensive and secure toolset for Web3 users. The combination of Telegram's trading speed and the absolute safety of an offline vault offers an uncompromising experience.\n\n### Core Objectives\n- **Maximum Security**: With a Zero-Trust philosophy, your private keys never leave your device.\n- **Superior Speed**: xBot utilizes an independent network infrastructure for lightning-fast execution.\n- **Multi-chain**: Supports EVM, Solana, TRON.\n\n### Standard Flow\n1. Download and install xKey Vault on your phone.\n2. Initialize a wallet or import a seed phrase completely offline.\n3. Extract the encrypted Private Key securely.\n4. Open the xBot app on Telegram and paste the secure key to start trading."
      },
      xbot: {
        title: "xBot - AI Trading Machine",
        body: "xBot is not just a typical Telegram bot. It's an On-chain trading machine integrated with the most advanced AI.\n\n### Key Features\n- **On-Chain Analytics & AI**: Integrating data from OKX Web3, xBot filters noise, detects Smart Money, and tracks Whale money flows.\n- **Smart Copy Trading**: Easily configure the bot to track any wallet. When that wallet trades, the bot copies instantly on Base, BSC, or Ethereum.\n- **Batch Operations**: Instead of manual transfers, xBot allows allocating assets to dozens of sub-wallets, executing Batch Swaps, and auto-collecting tokens to the main wallet with one command.\n- **Auto Risk Management**: Advanced Take-profit and Stop-loss features, anti-MEV bot protection, and dynamic slippage adjustments during network congestion."
      },
      xkey: {
        title: "xKey - Offline Vault",
        body: "Security is vital in Web3. xKey is a fully offline storage solution, turning your old phone into an absolutely secure cold wallet.\n\n### Mechanism\n- **100% Offline**: The application has zero internet access. No code can send your data outward.\n- **Military-Grade Encryption**: Data is encrypted using AES-256-CBC combined with a random Salt and PBKDF2.\n- **Biometric Protection**: Any sensitive action (viewing private keys, exporting data) requires fingerprint or FaceID authentication.\n\n### Usage Guide\n1. Turn off WiFi/4G on your spare device.\n2. Open xKey and set up a secure 6-digit PIN.\n3. Easily manage a portfolio of hundreds of sub-wallets without ever fearing hackers."
      },
      dev: {
        title: "Open Source & Community",
        body: "We absolutely believe in the power of open source and transparency in Web3.\n\n### 100% Open Source\nAll core components of the xKey and xBot ecosystem are public on Github. Any security expert or developer can freely audit our source code.\n\n- **xKey Repository**: `github.com/haivcon/xkey`\n- **xBot Repository**: `github.com/haivcon/xbot`\n\n### Contributing Guide\n1. Fork the project to your personal Github.\n2. Create a new branch (`git checkout -b feature/AmazingFeature`).\n3. Commit your changes and optimize the code.\n4. Push your branch (`git push origin feature/AmazingFeature`).\n5. Create a Pull Request. Our engineering team will respond within 24 hours."
      }
    }
  },
  zh: {
    title: "生态系统文档",
    menu: { home: "介绍", xbot: "🤖 xBot AI", xkey: "🔑 xKey Vault", dev: "💻 开发者" },
    content: {
      home: {
        title: "欢迎来到 xLayer",
        body: "xLayer 生态系统为 Web3 用户提供了最全面、最安全的工具集。Telegram 交易速度与离线金库绝对安全性的结合，带来了不妥协的体验。\n\n### 核心目标\n- **最高安全性**：采用零信任理念，您的私钥永远不会离开您的设备。\n- **卓越速度**：xBot 利用独立的网络基础设施实现闪电般的执行速度。\n- **多链支持**：支持 EVM、Solana、TRON。\n\n### 标准流程\n1. 在您的手机上下载并安装 xKey Vault。\n2. 完全离线地初始化钱包或导入助记词。\n3. 安全地提取加密的私钥。\n4. 在 Telegram 上打开 xBot 应用程序并粘贴安全密钥即可开始交易。"
      },
      xbot: {
        title: "xBot - AI 交易机器",
        body: "xBot 不仅仅是一个典型的 Telegram 机器人。它是一个集成了最先进 AI 的链上交易机器。\n\n### 核心功能\n- **链上分析与 AI**：整合来自 OKX Web3 的数据，xBot 过滤噪音，检测聪明钱，追踪巨鲸资金流。\n- **智能跟单交易**：轻松配置机器人以追踪任何钱包。当该钱包交易时，机器人会在 Base、BSC 或 Ethereum 上立即复制。\n- **批量操作**：不同于手动转账，xBot 允许一键将资产分配到几十个子钱包、执行批量兑换以及自动将代币归集到主钱包。\n- **自动风险管理**：高级止盈止损功能、防 MEV 机器人保护以及网络拥堵时的动态滑点调整。"
      },
      xkey: {
        title: "xKey - 离线金库",
        body: "安全性在 Web3 中至关重要。xKey 是一种完全离线的存储解决方案，将您的旧手机变成绝对安全的冷钱包。\n\n### 机制\n- **100% 离线**：应用程序零互联网访问权限。没有任何代码可以将您的数据向外发送。\n- **军用级加密**：数据使用 AES-256-CBC 结合随机 Salt 和 PBKDF2 进行加密。\n- **生物识别保护**：任何敏感操作（查看私钥、导出数据）都需要指纹或 FaceID 认证。\n\n### 使用指南\n1. 关闭备用设备上的 WiFi/4G。\n2. 打开 xKey 并设置安全的 6 位 PIN 码。\n3. 轻松管理包含数百个子钱包的投资组合，永远不用担心黑客。"
      },
      dev: {
        title: "开源与社区",
        body: "我们绝对相信开源和透明在 Web3 中的力量。\n\n### 100% 开源\nxKey 和 xBot 生态系统的所有核心组件都在 Github 上公开。任何安全专家或开发人员都可以自由审查我们的源代码。\n\n- **xKey 代码库**：`github.com/haivcon/xkey`\n- **xBot 代码库**：`github.com/haivcon/xbot`\n\n### 贡献指南\n1. 将项目 Fork 到您个人的 Github。\n2. 创建一个新分支 (`git checkout -b feature/AmazingFeature`)。\n3. 提交您的更改并优化代码。\n4. 推送您的分支 (`git push origin feature/AmazingFeature`)。\n5. 创建一个 Pull Request。我们的工程团队将在 24 小时内回复。"
      }
    }
  },
  ko: {
    title: "생태계 문서",
    menu: { home: "소개", xbot: "🤖 xBot AI", xkey: "🔑 xKey Vault", dev: "💻 개발자" },
    content: {
      home: {
        title: "xLayer에 오신 것을 환영합니다",
        body: "xLayer 생태계는 Web3 사용자에게 가장 포괄적이고 안전한 툴셋을 제공합니다. 텔레그램 거래의 속도와 오프라인 금고의 절대적인 안전성을 결합하여 타협 없는 경험을 제공합니다.\n\n### 핵심 목표\n- **최대 보안**: 제로 트러스트 철학을 바탕으로, 프라이빗 키는 절대 기기를 벗어나지 않습니다.\n- **탁월한 속도**: xBot은 빛처럼 빠른 실행을 위해 독립적인 네트워크 인프라를 활용합니다.\n- **멀티체인**: EVM, Solana, TRON 지원.\n\n### 표준 흐름\n1. 휴대폰에 xKey Vault를 다운로드하고 설치합니다.\n2. 지갑을 초기화하거나 오프라인 상태에서 시드 구문을 가져옵니다.\n3. 암호화된 프라이빗 키를 안전하게 추출합니다.\n4. 텔레그램에서 xBot 앱을 열고 보안 키를 붙여넣어 거래를 시작합니다."
      },
      xbot: {
        title: "xBot - AI 트레이딩 머신",
        body: "xBot은 단순한 텔레그램 봇이 아닙니다. 가장 진보된 AI가 통합된 온체인 거래 머신입니다.\n\n### 주요 기능\n- **온체인 분석 및 AI**: OKX Web3의 데이터를 통합하여 xBot은 노이즈를 필터링하고 스마트 머니를 감지하며 고래 자금 흐름을 추적합니다.\n- **스마트 카피 트레이딩**: 봇이 모든 지갑을 추적하도록 쉽게 구성할 수 있습니다. 해당 지갑이 거래될 때 봇은 Base, BSC 또는 이더리움에서 즉시 복사합니다.\n- **일괄 작업**: 수동 이체 대신 xBot을 사용하면 자산을 수십 개의 하위 지갑에 할당하고, 일괄 스왑을 실행하며, 하나의 명령으로 토큰을 주 지갑으로 자동 수집할 수 있습니다.\n- **자동 위험 관리**: 고급 이익 실현 및 손절매 기능, 안티 MEV 봇 보호 및 네트워크 혼잡 시 동적 슬리피지 조정."
      },
      xkey: {
        title: "xKey - 오프라인 금고",
        body: "보안은 Web3에서 필수적입니다. xKey는 완전 오프라인 스토리지 솔루션으로, 사용자의 구형 휴대폰을 절대적으로 안전한 콜드 월렛으로 변환합니다.\n\n### 메커니즘\n- **100% 오프라인**: 애플리케이션은 인터넷 접속 권한이 전혀 없습니다. 어떤 코드도 사용자의 데이터를 외부로 전송할 수 없습니다.\n- **군사 등급 암호화**: 데이터는 임의의 솔트 및 PBKDF2와 결합된 AES-256-CBC를 사용하여 암호화됩니다.\n- **생체 인식 보호**: 민감한 작업(프라이빗 키 보기, 데이터 내보내기)에는 지문 또는 FaceID 인증이 필요합니다.\n\n### 사용 안내서\n1. 스페어 기기에서 WiFi/4G를 끕니다.\n2. xKey를 열고 안전한 6자리 PIN을 설정합니다.\n3. 해커의 위협 없이 수백 개의 하위 지갑 포트폴리오를 쉽게 관리하세요."
      },
      dev: {
        title: "오픈 소스 및 커뮤니티",
        body: "우리는 Web3에서 오픈 소스와 투명성의 힘을 절대적으로 믿습니다.\n\n### 100% 오픈 소스\nxKey 및 xBot 생태계의 모든 핵심 구성 요소는 Github에 공개되어 있습니다. 보안 전문가나 개발자는 누구나 우리의 소스 코드를 자유롭게 감사할 수 있습니다.\n\n- **xKey 저장소**: `github.com/haivcon/xkey`\n- **xBot 저장소**: `github.com/haivcon/xbot`\n\n### 기여 가이드\n1. 프로젝트를 개인 Github로 포크합니다.\n2. 새 브랜치를 만듭니다 (`git checkout -b feature/AmazingFeature`).\n3. 변경 사항을 커밋하고 코드를 최적화합니다.\n4. 브랜치를 푸시합니다 (`git push origin feature/AmazingFeature`).\n5. 풀 리퀘스트를 생성합니다. 엔지니어링 팀이 24시간 이내에 응답할 것입니다."
      }
    }
  },
  ja: {
    title: "エコシステムドキュメント",
    menu: { home: "紹介", xbot: "🤖 xBot AI", xkey: "🔑 xKey Vault", dev: "💻 開発者" },
    content: {
      home: {
        title: "xLayerへようこそ",
        body: "xLayerエコシステムは、Web3ユーザーに最も包括的で安全なツールセットを提供します。Telegram取引の利便性とオフラインボールトの絶対的な安全性を組み合わせ、妥協のない体験を提供します。\n\n### コアの目標\n- **最大限のセキュリティ**: ゼロトラストの哲学により、秘密鍵がデバイスから離れることはありません。\n- **卓越した速度**: xBotは独立したネットワークインフラストラクチャを利用し、超高速の約定を実現します。\n- **マルチチェーン**: EVM、Solana、TRONをサポート。\n\n### 標準フロー\n1. 携帯電話にxKey Vaultをダウンロードしてインストールします。\n2. ウォレットを初期化するか、完全にオフラインでシードフレーズをインポートします。\n3. 暗号化された秘密鍵を安全に抽出します。\n4. TelegramでxBotアプリを開き、安全な鍵を貼り付けて取引を開始します。"
      },
      xbot: {
        title: "xBot - AIトレーディングマシン",
        body: "xBotは単なる典型的なTelegramボットではありません。最先端のAIが統合されたオンチェーントレーディングマシンです。\n\n### 主な機能\n- **オンチェーン分析＆AI**: OKX Web3からのデータを統合し、xBotはノイズを除去し、スマートマネーを検出し、クジラの資金の流れを追跡します。\n- **スマートコピートレード**: 任意のウォレットを追跡するようにボットを簡単に設定できます。そのウォレットが取引されると、ボットはBase、BSC、またはEthereumですぐにコピーします。\n- **バッチ操作**: 手動の転送ではなく、xBotは資産を何十ものサブウォレットに割り当て、バッチスワップを実行し、1つのコマンドでトークンをメインウォレットに自動収集できます。\n- **自動リスク管理**: 高度な利食いおよび損切り機能、アンチMEVボット保護、ネットワーク混雑時の動的なスリッページ調整。"
      },
      xkey: {
        title: "xKey - オフラインボールト",
        body: "Web3においてセキュリティは不可欠です。xKeyは完全なオフラインストレージソリューションであり、古い携帯電話を絶対に安全なコールドウォレットに変えます。\n\n### メカニズム\n- **100%オフライン**: アプリケーションはインターネットへのアクセスを一切持ちません。データを外部に送信できるコードは存在しません。\n- **軍事レベルの暗号化**: データは、ランダムなソルトとPBKDF2を組み合わせたAES-256-CBCを使用して暗号化されます。\n- **生体認証保護**: 機密性の高いアクション（秘密鍵の表示、データのエクスポート）には、指紋またはFaceID認証が必要です。\n\n### 使い方\n1. 予備のデバイスでWiFi/4Gをオフにします。\n2. xKeyを開き、安全な6桁のPINを設定します。\n3. ハッカーを恐れることなく、何百ものサブウォレットのポートフォリオを簡単に管理します。"
      },
      dev: {
        title: "オープンソースとコミュニティ",
        body: "私たちは、Web3におけるオープンソースと透明性の力を絶対に信じています。\n\n### 100%オープンソース\nxKeyおよびxBotエコシステムのすべてのコアコンポーネントはGithubで公開されています。セキュリティ専門家や開発者は誰でも私たちのソースコードを自由に監査できます。\n\n- **xKeyリポジトリ**: `github.com/haivcon/xkey`\n- **xBotリポジトリ**: `github.com/haivcon/xbot`\n\n### 貢献ガイド\n1. プロジェクトを個人のGithubにフォークします。\n2. 新しいブランチを作成します（`git checkout -b feature/AmazingFeature`）。\n3. 変更をコミットし、コードを最適化します。\n4. ブランチをプッシュします（`git push origin feature/AmazingFeature`）。\n5. プルリクエストを作成します。当社のエンジニアリングチームは24時間以内に対応します。"
      }
    }
  },
  ru: {
    title: "Документация",
    menu: { home: "Введение", xbot: "🤖 xBot AI", xkey: "🔑 xKey Vault", dev: "💻 Разработчикам" },
    content: {
      home: {
        title: "Добро пожаловать в xLayer",
        body: "Экосистема xLayer предоставляет самый полный и безопасный набор инструментов для пользователей Web3. Комбинация скорости торговли в Telegram и абсолютной безопасности оффлайн-хранилища предлагает бескомпромиссный опыт.\n\n### Основные цели\n- **Максимальная безопасность**: С философией Zero-Trust ваши приватные ключи никогда не покидают ваше устройство.\n- **Превосходная скорость**: xBot использует независимую сетевую инфраструктуру для молниеносного исполнения.\n- **Мультичейн**: Поддержка EVM, Solana, TRON.\n\n### Стандартный процесс\n1. Загрузите и установите xKey Vault на свой телефон.\n2. Инициализируйте кошелек или импортируйте seed-фразу полностью оффлайн.\n3. Безопасно извлеките зашифрованный приватный ключ.\n4. Откройте приложение xBot в Telegram и вставьте безопасный ключ, чтобы начать торговлю."
      },
      xbot: {
        title: "xBot - Машина для AI Трейдинга",
        body: "xBot - это не просто типичный Telegram-бот. Это ончейн-машина для трейдинга, интегрированная с самым передовым AI.\n\n### Ключевые особенности\n- **Ончейн-аналитика и AI**: Интегрируя данные из OKX Web3, xBot фильтрует шум, обнаруживает Smart Money и отслеживает денежные потоки Китов.\n- **Умный Копи-трейдинг**: Легко настройте бота для отслеживания любого кошелька. Когда этот кошелек торгует, бот немедленно копирует сделки на Base, BSC или Ethereum.\n- **Пакетные операции**: Вместо ручных переводов xBot позволяет распределять активы по десяткам суб-кошельков, выполнять пакетные свопы и автоматически собирать токены на основной кошелек одной командой.\n- **Автоматическое управление рисками**: Продвинутые функции тейк-профита и стоп-лосса, защита от MEV-ботов и динамическая настройка проскальзывания при перегрузке сети."
      },
      xkey: {
        title: "xKey - Оффлайн Хранилище",
        body: "Безопасность жизненно важна в Web3. xKey - это полностью оффлайн решение для хранения, превращающее ваш старый телефон в абсолютно безопасный холодный кошелек.\n\n### Механизм\n- **100% Оффлайн**: Приложение не имеет доступа к Интернету. Никакой код не может отправить ваши данные наружу.\n- **Шифрование военного уровня**: Данные шифруются с использованием AES-256-CBC в сочетании со случайной солью и PBKDF2.\n- **Биометрическая защита**: Любое конфиденциальное действие (просмотр приватных ключей, экспорт данных) требует аутентификации по отпечатку пальца или FaceID.\n\n### Руководство по использованию\n1. Отключите WiFi/4G на вашем запасном устройстве.\n2. Откройте xKey и установите безопасный 6-значный PIN-код.\n3. Легко управляйте портфелем из сотен суб-кошельков, никогда не опасаясь хакеров."
      },
      dev: {
        title: "Открытый исходный код и Сообщество",
        body: "Мы абсолютно верим в силу открытого исходного кода и прозрачности в Web3.\n\n### 100% Открытый исходный код\nВсе основные компоненты экосистемы xKey и xBot публично доступны на Github. Любой эксперт по безопасности или разработчик может свободно провести аудит нашего исходного кода.\n\n- **Репозиторий xKey**: `github.com/haivcon/xkey`\n- **Репозиторий xBot**: `github.com/haivcon/xbot`\n\n### Руководство по участию\n1. Сделайте форк проекта на свой личный Github.\n2. Создайте новую ветку (`git checkout -b feature/AmazingFeature`).\n3. Закоммитьте свои изменения и оптимизируйте код.\n4. Запушьте свою ветку (`git push origin feature/AmazingFeature`).\n5. Создайте Pull Request. Наша команда инженеров ответит в течение 24 часов."
      }
    }
  },
  id: {
    title: "Dokumen Ekosistem",
    menu: { home: "Pengenalan", xbot: "🤖 xBot AI", xkey: "🔑 xKey Vault", dev: "💻 Developer" },
    content: {
      home: {
        title: "Selamat Datang di xLayer",
        body: "Ekosistem xLayer menyediakan setelan alat yang paling komprehensif dan aman untuk pengguna Web3. Kombinasi kecepatan perdagangan Telegram dan keamanan mutlak dari brankas offline menawarkan pengalaman tanpa kompromi.\n\n### Tujuan Utama\n- **Keamanan Maksimal**: Dengan filosofi Zero-Trust, private key Anda tidak pernah meninggalkan perangkat Anda.\n- **Kecepatan Unggul**: xBot menggunakan infrastruktur jaringan independen untuk eksekusi secepat kilat.\n- **Multi-chain**: Mendukung EVM, Solana, TRON.\n\n### Alur Standar\n1. Unduh dan instal xKey Vault di ponsel Anda.\n2. Inisialisasi dompet atau impor seed phrase sepenuhnya offline.\n3. Ekstrak Private Key yang terenkripsi dengan aman.\n4. Buka aplikasi xBot di Telegram dan rekatkan kunci aman untuk mulai trading."
      },
      xbot: {
        title: "xBot - Mesin Trading AI",
        body: "xBot bukan hanya sekadar bot Telegram biasa. Ini adalah mesin perdagangan On-chain yang terintegrasi dengan AI paling canggih.\n\n### Fitur Utama\n- **Analitik On-Chain & AI**: Mengintegrasikan data dari OKX Web3, xBot menyaring kebisingan, mendeteksi Smart Money, dan melacak aliran dana Whale.\n- **Smart Copy Trading**: Konfigurasi bot dengan mudah untuk melacak dompet mana pun. Saat dompet itu melakukan trading, bot menyalin secara instan di Base, BSC, atau Ethereum.\n- **Operasi Batch**: Alih-alih transfer manual, xBot memungkinkan alokasi aset ke puluhan sub-dompet, mengeksekusi Batch Swaps, dan mengumpulkan token otomatis ke dompet utama dengan satu perintah.\n- **Manajemen Risiko Otomatis**: Fitur Take-profit dan Stop-loss tingkat lanjut, perlindungan bot anti-MEV, dan penyesuaian slippage dinamis selama kemacetan jaringan."
      },
      xkey: {
        title: "xKey - Brankas Offline",
        body: "Keamanan sangat vital di Web3. xKey adalah solusi penyimpanan sepenuhnya offline, mengubah ponsel lama Anda menjadi cold wallet yang benar-benar aman.\n\n### Mekanisme\n- **100% Offline**: Aplikasi tidak memiliki akses internet sama sekali. Tidak ada kode yang dapat mengirim data Anda ke luar.\n- **Enkripsi Tingkat Militer**: Data dienkripsi menggunakan AES-256-CBC yang dikombinasikan dengan Salt acak dan PBKDF2.\n- **Perlindungan Biometrik**: Setiap tindakan sensitif (melihat private key, mengekspor data) memerlukan autentikasi sidik jari atau FaceID.\n\n### Panduan Penggunaan\n1. Matikan WiFi/4G pada perangkat cadangan Anda.\n2. Buka xKey dan siapkan PIN 6 digit yang aman.\n3. Kelola portofolio ratusan sub-dompet dengan mudah tanpa pernah takut akan peretas."
      },
      dev: {
        title: "Sumber Terbuka & Komunitas",
        body: "Kami benar-benar percaya pada kekuatan sumber terbuka dan transparansi di Web3.\n\n### 100% Open Source\nSemua komponen inti dari ekosistem xKey dan xBot bersifat publik di Github. Setiap pakar keamanan atau pengembang dapat dengan bebas mengaudit kode sumber kami.\n\n- **Repositori xKey**: `github.com/haivcon/xkey`\n- **Repositori xBot**: `github.com/haivcon/xbot`\n\n### Panduan Kontribusi\n1. Fork proyek ke Github pribadi Anda.\n2. Buat cabang baru (`git checkout -b feature/AmazingFeature`).\n3. Lakukan commit perubahan Anda dan optimalkan kode.\n4. Push cabang Anda (`git push origin feature/AmazingFeature`).\n5. Buat Pull Request. Tim teknik kami akan merespons dalam waktu 24 jam."
      }
    }
  },
  th: {
    title: "เอกสารระบบนิเวศ",
    menu: { home: "บทนำ", xbot: "🤖 xBot AI", xkey: "🔑 xKey Vault", dev: "💻 นักพัฒนา" },
    content: {
      home: { title: "ยินดีต้อนรับ", body: "ระบบนิเวศ xLayer เป็นเครื่องมือ Web3 ที่ปลอดภัยที่สุด ผสมผสาน Telegram trading และกระเป๋าออฟไลน์\n\n### คุณสมบัติ\n- ปลอดภัยสูงสุดด้วย Offline Vault\n- รวดเร็วด้วย Network ของเราเอง\n- รองรับหลาย Chain" },
      xbot: { title: "xBot - บอทเทรด AI", body: "เปลี่ยน Telegram เป็นสถานีเทรดด้วย AI\n\n- วิเคราะห์ On-chain และหาเงินอัจฉริยะ\n- ก๊อปปี้เทรดจากเซียน\n- จัดการหลายกระเป๋าและโอนแบทช์" },
      xkey: { title: "xKey - ออฟไลน์", body: "จัดการกระเป๋าปลอดภัยสุด\n\n- ออฟไลน์ 100% ไม่มีอินเตอร์เน็ต\n- เข้ารหัส AES-256 ระดับทหาร\n- สแกนใบหน้า/นิ้วมือเพื่อดู Private Key" },
      dev: { title: "โอเพนซอร์ส", body: "เราเปิดซอร์สเพื่อความโปร่งใส\n- xKey: github.com/haivcon/xkey\n- xBot: github.com/haivcon/xbot\nยินดีรับ Pull Request!" }
    }
  },
  es: {
    title: "Docs del Ecosistema",
    menu: { home: "Inicio", xbot: "🤖 xBot AI", xkey: "🔑 xKey Vault", dev: "💻 Devs" },
    content: {
      home: { title: "Bienvenido a xLayer", body: "El ecosistema Web3 más seguro. Combina trading en Telegram y bóveda offline.\n\n### Características\n- Máxima Seguridad Offline\n- Velocidad Extrema\n- Multicadena" },
      xbot: { title: "xBot - AI Bot", body: "Convierte Telegram en una estación On-chain.\n\n- Analítica OKX y Detección de Smart Money\n- Copy Trading Inteligente\n- Gestión Multibilletera y Batch Swap" },
      xkey: { title: "xKey - Offline Vault", body: "Gestor ultraseguro.\n\n- 100% offline, sin acceso a internet\n- Cifrado AES-256\n- Biometría obligatoria" },
      dev: { title: "Código Abierto", body: "Proyectos open source para total transparencia.\n- xKey: github.com/haivcon/xkey\n- xBot: github.com/haivcon/xbot" }
    }
  },
  fr: {
    title: "Docs de l'Écosystème",
    menu: { home: "Accueil", xbot: "🤖 xBot AI", xkey: "🔑 xKey Vault", dev: "💻 Devs" },
    content: {
      home: { title: "Bienvenue sur xLayer", body: "L'écosystème Web3 le plus sécurisé. Combine le trading Telegram et le coffre offline.\n\n### Fonctionnalités\n- Sécurité maximale\n- Vitesse exceptionnelle\n- Multi-chaîne" },
      xbot: { title: "xBot - Trading IA", body: "Transforme Telegram en station de trading.\n\n- Analytique OKX\n- Copy Trading\n- Multi-portefeuilles et transferts groupés" },
      xkey: { title: "xKey - Coffre Hors-ligne", body: "Gestion sécurisée.\n\n- 100% offline\n- Chiffrement AES-256\n- Biométrie" },
      dev: { title: "Open Source", body: "Transparence totale.\n- xKey: github.com/haivcon/xkey\n- xBot: github.com/haivcon/xbot" }
    }
  },
  de: {
    title: "Ökosystem-Docs",
    menu: { home: "Start", xbot: "🤖 xBot AI", xkey: "🔑 xKey Vault", dev: "💻 Devs" },
    content: {
      home: { title: "Willkommen", body: "Das sichere Web3-Ökosystem. Kombiniert Telegram-Trading und Offline-Tresor.\n\n### Features\n- Maximale Sicherheit\n- Überlegene Geschwindigkeit\n- Multi-Chain" },
      xbot: { title: "xBot - KI Trading", body: "Macht Telegram zur Trading-Station.\n\n- OKX Analytik\n- Smart Copy Trading\n- Multi-Wallet" },
      xkey: { title: "xKey - Offline Tresor", body: "Sicherste Verwaltung.\n\n- 100% offline\n- AES-256\n- Biometrie" },
      dev: { title: "Open Source", body: "Open Source für Transparenz.\n- xKey: github.com/haivcon/xkey\n- xBot: github.com/haivcon/xbot" }
    }
  },
  pt: {
    title: "Docs do Ecossistema",
    menu: { home: "Início", xbot: "🤖 xBot AI", xkey: "🔑 xKey Vault", dev: "💻 Devs" },
    content: {
      home: { title: "Bem-vindo", body: "O ecossistema Web3 seguro. Combina trading no Telegram e cofre offline.\n\n### Recursos\n- Segurança Máxima\n- Velocidade\n- Multi-chain" },
      xbot: { title: "xBot - IA Trading", body: "Transforma o Telegram em estação de trading.\n\n- Análise OKX\n- Copy Trading\n- Multi-carteiras" },
      xkey: { title: "xKey - Cofre Offline", body: "Gestão segura.\n\n- 100% offline\n- Criptografia AES-256\n- Biometria" },
      dev: { title: "Código Aberto", body: "Projetos de código aberto.\n- xKey: github.com/haivcon/xkey\n- xBot: github.com/haivcon/xbot" }
    }
  },
  ar: {
    title: "مستندات النظام",
    menu: { home: "الرئيسية", xbot: "🤖 xBot AI", xkey: "🔑 xKey Vault", dev: "💻 مطورون" },
    content: {
      home: { title: "مرحباً بكم", body: "النظام البيئي Web3 الآمن. يجمع بين تداول تيليجرام والخزنة غير المتصلة.\n\n### الخصائص\n- أمان تام\n- سرعة فائقة\n- دعم سلاسل متعددة" },
      xbot: { title: "xBot - بوت ذكي", body: "يحول تيليجرام لمحطة تداول.\n\n- تحليلات OKX\n- نسخ التداول الذكي\n- إدارة محافظ متعددة" },
      xkey: { title: "xKey - غير متصل", body: "إدارة آمنة.\n\n- 100% غير متصل\n- تشفير AES-256\n- حماية بيومترية" },
      dev: { title: "مفتوح المصدر", body: "شفافية تامة.\n- xKey: github.com/haivcon/xkey\n- xBot: github.com/haivcon/xbot" }
    }
  },
  hi: {
    title: "इकोसिस्टम डॉक्स",
    menu: { home: "होम", xbot: "🤖 xBot AI", xkey: "🔑 xKey Vault", dev: "💻 डेव" },
    content: {
      home: { title: "स्वागत है", body: "सुरक्षित Web3 इकोसिस्टम। टेलीग्राम ट्रेडिंग और ऑफलाइन वॉल्ट को जोड़ता है।\n\n### मुख्य विशेषताएं\n- अधिकतम सुरक्षा\n- तीव्र गति\n- मल्टी-चेन" },
      xbot: { title: "xBot - AI बॉट", body: "टेलीग्राम को ट्रेडिंग स्टेशन बनाता है।\n\n- OKX एनालिटिक्स\n- कॉपी ट्रेडिंग\n- मल्टी-वॉलेट" },
      xkey: { title: "xKey - ऑफलाइन", body: "सुरक्षित प्रबंधन।\n\n- 100% ऑफलाइन\n- AES-256 एन्क्रिप्शन\n- बायोमेट्रिक सुरक्षा" },
      dev: { title: "ओपन सोर्स", body: "सुरक्षा के लिए ओपन सोर्स।\n- xKey: github.com/haivcon/xkey\n- xBot: github.com/haivcon/xbot" }
    }
  },
  tr: {
    title: "Ekosistem Belgeleri",
    menu: { home: "Ana Sayfa", xbot: "🤖 xBot AI", xkey: "🔑 xKey Vault", dev: "💻 Geliştirici" },
    content: {
      home: { title: "Hoş Geldiniz", body: "Güvenli Web3 ekosistemi. Telegram ticareti ile çevrimdışı kasayı birleştirir.\n\n### Özellikler\n- Maksimum Güvenlik\n- Üstün Hız\n- Çoklu Zincir" },
      xbot: { title: "xBot - AI Bot", body: "Telegram'ı bir ticaret istasyonuna dönüştürür.\n\n- OKX Analitiği\n- Kopya Ticaret\n- Çoklu Cüzdan" },
      xkey: { title: "xKey - Çevrimdışı", body: "En güvenli yönetim.\n\n- %100 çevrimdışı\n- AES-256 şifreleme\n- Biyometrik Koruma" },
      dev: { title: "Açık Kaynak", body: "Şeffaflık için açık kaynak.\n- xKey: github.com/haivcon/xkey\n- xBot: github.com/haivcon/xbot" }
    }
  }
};
