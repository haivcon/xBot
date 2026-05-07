# 🛡️ XBOT Check — Web3 Cold Storage Vault

**[🇬🇧 English](#-english) | [🇨🇳 简体中文](#-简体中文) | [🇻🇳 Tiếng Việt](#-tiếng-việt) | [🇰🇷 한국어](#-한국어) | [🇷🇺 Русский](#-русский) | [🇮🇩 Bahasa Indonesia](#-bahasa-indonesia)**

---

<br>

<details open>
<summary><h2>🇬🇧 English</h2></summary>

**XBOT Check** is a secure, offline-first Web3 wallet management application built with React, Vite, and Capacitor. It is designed to act as a highly secure Cold Vault for your crypto assets, featuring biometric authentication, AES-256 encryption, and native transaction signing capabilities.

### 🚀 What's New in v2.1.0 (Current Update)
- **Major API Overhaul**: Migrated to official OKX OnchainOS endpoints (`/api/v5/wallet/asset/all-token-balances-by-address`).
- **N+1 API Optimization**: Implemented batch processing (10 wallets per request) with address deduplication, reducing network overhead by 90%.
- **Resilience Engineering**: Added exponential backoff retry logic (1s, 2s, 4s) to automatically handle HTTP 429 Too Many Requests errors.
- **Offline Safety Guards**: Transactions, Send, and Sweep modals are now strictly guarded against opening when Offline Mode is active.
- **Password-Protected Vaults**: Deprecated 'Device-Locked Backups' to prevent catastrophic data loss on app wipe. 'Portable Password Backups' are now the enforced standard.
- **Enhanced UI**: Added per-wallet live refresh buttons and numerical batch sync progress indicators.
- **Data Integrity**: Exported CSVs now retain folder structures and automatically sanitize corrupted newlines.

<details>
<summary><b>📦 Previous Core Features (v2.0.0)</b></summary>
<br>

- **🔒 Ultimate Security**: All private keys and seed phrases are heavily encrypted locally using AES-256-CBC.
- **👁️ Biometric Auth**: Access is protected by native Android Biometrics (FaceID / Fingerprint) — no manual PIN codes required.
- **📁 Smart Organization**: Import wallets via CSV and automatically organize them into folders.
- **🧹 Batch Sweep Engine**: Select multiple wallets and drain their native balances (ETH, BNB, OKB) to a single destination address in one click.
- **✍️ Offline Signer**: Construct, estimate gas, and sign transactions entirely on your device before broadcasting.
- **📊 Interactive Dashboard**: Monitor your vault's total valuation, asset distribution across folders, and live on-chain balances.
- **📜 Encrypted History**: All your sends and batch sweeps are securely logged locally for auditing.

</details>

### 🚀 Installation & Setup Guide

**Prerequisites**
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Android Studio](https://developer.android.com/studio) (if you want to build the Android APK)
- Git

**1. Clone & Install Dependencies**
```bash
git clone https://github.com/haivcon/xbot.git
cd xbot/xbot-check
npm install
```

**2. Run Locally in Browser (Web Mode)**
```bash
npm run dev
```
> **Note**: Biometric authentication and local filesystem features rely on native Capacitor plugins, which are mocked or bypassed in the web browser.

**3. Build for Android (APK)**
```bash
npm run build
npx cap sync android
npx cap open android
```
Once Android Studio opens:
- Wait for Gradle to finish syncing.
- Click the **Play** button to run on an emulator/device, OR
- Go to `Build > Build Bundle(s) / APK(s) > Build APK(s)` to generate an installable `.apk` file.

### 📖 How to Use
1. **First Launch**: Open the app. It will securely bind to your device's biometric data.
2. **Import Wallets**: Click the `+` button to import a CSV file containing your wallets. The app will automatically map columns (Address, Private Key, Balance) and group them by filename.
3. **Manage Folders**: Navigate via the top tabs. Double-click a tab to rename or delete the entire folder.
4. **Batch Sweep**: Enable "Select Mode", tick multiple wallets, and click the `Sweep` button to consolidate funds to a single address.
5. **Backup Vault**: Go to `Settings > Backup Vault` to export an encrypted `.xbot` file.

### 🔑 OKX API Setup (Optional — for Live Sync & DeFi)

The app works fully **offline** by default. If you want **live on-chain balance sync**, you'll need a free OKX OnchainOS API key:

1. Visit the **[OKX OnchainOS Dev Portal](https://web3.okx.com/vi/onchainos/dev-portal/project)**
2. Sign in with your OKX account (create one for free if needed)
3. Click **"Create Project"** → enter any project name (e.g., "XBOT Vault")
4. Go to your project → **"API Keys"** tab → **"Create API Key"**
5. Set a **Passphrase** (you'll need this later)
6. Copy the three values: **API Key**, **Secret Key**, **Passphrase**
7. In the app, go to **Settings** → paste all three values → **Save**

> **Note**: The API key is only used for read-only balance queries. It does NOT have access to trade, withdraw, or move your funds.

### ✈️ Offline Mode

XBOT Check is designed as an **offline-first** application. You can enable **Offline Mode** in Settings to completely disable all network features:

- ✅ **Works offline**: Import CSV, manage wallets, view data, create wallets, backup/restore
- ✅ **Works offline**: Sign transactions (they will be broadcast only when you go online)
- ❌ **Requires internet**: Live Sync (balance refresh), Send/Sweep transactions
- When Offline Mode is enabled, the header shows a **yellow "Offline" badge** instead of the "Live Sync" button
- Your offline preference is **persisted** across app restarts

### 🛠️ Tech Stack
- **Frontend**: React 19, TailwindCSS v4, Lucide Icons
- **Web3**: ethers.js v6
- **Mobile Framework**: Capacitor 8
- **Security**: CryptoJS (AES-256), Capgo Native Biometric

### ⚠️ Security Notice
- **Never share your `.xbot` backup files or the password used to encrypt them.**
- This application stores sensitive Private Keys. Always ensure your device has a secure screen lock (PIN/Password/Biometrics) enabled. If you remove your device's screen lock, the Android Keystore will drop the biometric keys, rendering the vault inaccessible to protect your assets.

</details>

---

<details>
<summary><h2>🇻🇳 Tiếng Việt</h2></summary>

**XBOT Check** là ứng dụng quản lý ví Web3 ngoại tuyến an toàn, được xây dựng với React, Vite và Capacitor. Ứng dụng đóng vai trò như một Kho Lưu Trữ Lạnh (Cold Vault) bảo mật cao cho tài sản tiền điện tử của bạn, tích hợp xác thực sinh trắc học, mã hóa AES-256 và khả năng ký giao dịch trực tiếp.

### ✨ Tính Năng Chính
- **🔒 Bảo mật Tối đa**: Toàn bộ Private Key và Seed Phrase được mã hóa chuyên sâu cục bộ bằng chuẩn AES-256-CBC.
- **👁️ Xác thực Sinh trắc học**: Truy cập ứng dụng được bảo vệ bởi Sinh trắc học gốc của hệ điều hành (FaceID / Vân tay) — không cần mã PIN thủ công.
- **📁 Quản lý Thông minh**: Nhập ví qua tệp CSV và tự động phân loại chúng vào các thư mục theo tên tệp.
- **🧹 Quét Ví Hàng Loạt (Batch Sweep)**: Chọn nhiều ví và gom toàn bộ số dư token gốc (ETH, BNB, OKB) về một địa chỉ đích chỉ với 1 cú nhấp chuột.
- **✍️ Trình ký Ngoại tuyến (Offline Signer)**: Thiết lập, tính toán phí gas và ký giao dịch hoàn toàn trên thiết bị của bạn trước khi đẩy lên mạng lưới.
- **📊 Bảng Điều khiển (Dashboard)**: Theo dõi tổng định giá tài sản, biểu đồ phân bổ theo thư mục và cập nhật số dư trực tiếp on-chain.
- **📜 Lịch sử Mã hóa**: Tất cả các giao dịch chuyển tiền và gom ví đều được ghi log cục bộ, mã hóa an toàn để tiện đối soát.
- **💾 Sao lưu Vault**: Xuất toàn bộ vault (ví, thư mục, cài đặt) thành một tệp `.xbot` siêu mã hóa để lưu trữ an toàn trên Google Drive hoặc bộ nhớ ngoài.

### 🚀 Hướng Dẫn Cài Đặt

**Yêu cầu hệ thống**
- [Node.js](https://nodejs.org/) (Khuyến nghị v18 trở lên)
- [Android Studio](https://developer.android.com/studio) (Nếu bạn muốn build file APK cho Android)
- Git

**1. Clone & Cài đặt thư viện**
```bash
git clone https://github.com/haivcon/xbot.git
cd xbot/xbot-check
npm install
```

**2. Chạy thử nghiệm trên Web**
```bash
npm run dev
```
> **Lưu ý**: Xác thực sinh trắc học và hệ thống file cục bộ sử dụng các plugin Capacitor gốc của thiết bị, do đó chúng sẽ không hoạt động hoặc bị bypass trên trình duyệt web.

**3. Build ứng dụng Android (APK)**
```bash
npm run build
npx cap sync android
npx cap open android
```
Khi Android Studio mở lên:
- Đợi Gradle đồng bộ xong.
- Nhấn nút **Play** để chạy thử trên máy ảo/điện thoại, HOẶC
- Chọn `Build > Build Bundle(s) / APK(s) > Build APK(s)` để xuất file `.apk` cài đặt.

### 📖 Cách Sử Dụng
1. **Lần khởi chạy đầu tiên**: Mở ứng dụng. Nó sẽ tự động liên kết với dữ liệu sinh trắc học trên thiết bị của bạn.
2. **Nhập ví**: Nhấp vào nút `+` để import tệp CSV. Ứng dụng sẽ tự động ánh xạ các cột (Address, Private Key, Balance) và nhóm theo tên file.
3. **Quản lý Thư mục**: Chuyển đổi qua lại bằng các tab trên cùng. Nháy đúp (double-click) vào một tab để đổi tên hoặc xóa toàn bộ thư mục đó.
4. **Gom số dư (Sweep)**: Bật "Select Mode", chọn các ví bạn muốn, rồi nhấn `Sweep` để chuyển toàn bộ tiền về 1 địa chỉ.
5. **Sao lưu**: Vào `Settings > Backup Vault` để xuất tệp `.xbot` đã được mã hóa.

### ⚠️ Cảnh Báo Bảo Mật
- **Tuyệt đối không chia sẻ tệp backup `.xbot` hoặc mật khẩu dùng để mã hóa tệp đó.**
- Ứng dụng này lưu trữ Private Key vô cùng nhạy cảm. **Luôn đảm bảo thiết bị của bạn đã được cài đặt khóa màn hình (Mã PIN/Mật khẩu/Sinh trắc học).** Nếu bạn gỡ bỏ khóa màn hình của thiết bị, hệ thống Android Keystore sẽ lập tức hủy các khóa sinh trắc học, làm cho Vault không thể truy cập được nữa nhằm bảo vệ tài sản của bạn khỏi kẻ xấu.

</details>

---

<details>
<summary><h2>🇨🇳 简体中文</h2></summary>

**XBOT Check** 是一款安全、离线优先的 Web3 钱包管理应用程序，使用 React、Vite 和 Capacitor 构建。它被设计为您加密资产的高度安全的冷钱包 (Cold Vault)，具有生物识别身份验证、AES-256 加密和原生交易签名功能。

### ✨ 核心特性
- **🔒 极致安全**: 所有私钥和助记词都使用 AES-256-CBC 在本地进行深度加密。
- **👁️ 生物识别**: 访问受原生 Android 生物识别（FaceID / 指纹）保护 — 无需手动输入 PIN 码。
- **📁 智能整理**: 通过 CSV 导入钱包，并根据文件名自动将它们分类到文件夹中。
- **🧹 批量归集 (Batch Sweep)**: 选择多个钱包，只需一键即可将其原生余额 (ETH、BNB、OKB) 归集到单一目标地址。
- **✍️ 离线签名**: 在广播到网络之前，完全在您的设备上构建、估算 Gas 并签署交易。
- **📊 交互式仪表盘**: 监控您的金库总估值、跨文件夹的资产分布以及链上实时余额。
- **📜 加密历史记录**: 您所有的发送和批量归集交易都会在本地安全记录，以便审计。
- **💾 金库备份**: 将整个金库（钱包、文件夹、设置）导出为高度加密的 `.xbot` 文件，以便安全存储在 Google Drive 或冷存储中。

### 🚀 安装与设置指南

**环境要求**
- [Node.js](https://nodejs.org/) (推荐 v18 或更高版本)
- [Android Studio](https://developer.android.com/studio) (如果您想要构建 Android APK)
- Git

**1. 克隆与安装依赖**
```bash
git clone https://github.com/haivcon/xbot.git
cd xbot/xbot-check
npm install
```

**2. 在浏览器中本地运行 (Web 模式)**
```bash
npm run dev
```
> **注意**: 生物识别身份验证和本地文件系统依赖于原生 Capacitor 插件，在 Web 浏览器中这些功能会被模拟或绕过。

**3. 构建 Android 应用程序 (APK)**
```bash
npm run build
npx cap sync android
npx cap open android
```
打开 Android Studio 后:
- 等待 Gradle 同步完成。
- 点击 **Play** 按钮在模拟器/设备上运行，或者
- 选择 `Build > Build Bundle(s) / APK(s) > Build APK(s)` 生成可安装的 `.apk` 文件。

### 📖 使用说明
1. **首次启动**: 打开应用程序。它将安全地与您设备的生物识别数据绑定。
2. **导入钱包**: 点击 `+` 按钮导入包含您钱包的 CSV 文件。应用程序会自动映射列（地址、私钥、余额）并按文件名进行分组。
3. **管理文件夹**: 通过顶部选项卡导航。双击选项卡可重命名或删除整个文件夹。
4. **批量归集**: 启用 "Select Mode" (选择模式)，勾选多个钱包，然后点击 `Sweep` 按钮将资金合并到一个地址。
5. **备份金库**: 进入 `Settings > Backup Vault` 导出加密的 `.xbot` 文件。

### ⚠️ 安全警告
- **切勿分享您的 `.xbot` 备份文件或用于加密它们的密码。**
- 本应用程序存储极其敏感的私钥。**请始终确保您的设备已启用安全的屏幕锁定（PIN/密码/生物识别）。** 如果您移除设备的屏幕锁定，Android Keystore 将会销毁生物识别密钥，导致金库无法访问，以此来保护您的资产免遭窃取。

</details>

---

<details>
<summary><h2>🇰🇷 한국어</h2></summary>

**XBOT Check**는 React, Vite 및 Capacitor로 구축된 안전한 오프라인 우선 Web3 지갑 관리 애플리케이션입니다. 생체 인식 인증, AES-256 암호화 및 기본 트랜잭션 서명 기능을 갖춘 암호화 자산용으로 매우 안전한 콜드 볼트(Cold Vault) 역할을 하도록 설계되었습니다.

### ✨ 주요 기능
- **🔒 최고의 보안**: 모든 개인 키와 시드 구문은 AES-256-CBC를 사용하여 로컬에서 강력하게 암호화됩니다.
- **👁️ 생체 인식 인증**: 수동 PIN 코드가 필요 없이 기본 Android 생체 인식(FaceID/지문)으로 액세스를 보호합니다.
- **📁 스마트 구성**: CSV를 통해 지갑을 가져오고 자동으로 폴더에 정리합니다.
- **🧹 일괄 스윕(Batch Sweep) 엔진**: 한 번의 클릭으로 여러 지갑을 선택하고 기본 잔고(ETH, BNB, OKB)를 단일 목적지 주소로 스윕합니다.
- **✍️ 오프라인 서명기**: 브로드캐스팅하기 전에 전적으로 기기에서 트랜잭션을 구성하고, 가스를 추정하고, 서명합니다.
- **📊 대화형 대시보드**: 볼트의 총 가치 평가, 폴더별 자산 분포, 실시간 온체인 잔고를 모니터링합니다.
- **📜 암호화된 기록**: 감사(Auditing)를 위해 모든 전송 및 일괄 스윕이 로컬에 안전하게 기록됩니다.
- **💾 볼트 백업**: Google 드라이브나 콜드 스토리지에 안전하게 보관할 수 있도록 전체 볼트(지갑, 폴더, 설정)를 고도로 암호화된 `.xbot` 파일로 내보냅니다.

### 🚀 설치 및 설정 가이드

**사전 요구 사항**
- [Node.js](https://nodejs.org/) (v18 이상 권장)
- [Android Studio](https://developer.android.com/studio) (Android APK를 빌드하려는 경우)
- Git

**1. 리포지토리 복제 및 종속성 설치**
```bash
git clone https://github.com/haivcon/xbot.git
cd xbot/xbot-check
npm install
```

**2. 브라우저에서 로컬로 실행 (웹 모드)**
```bash
npm run dev
```
> **참고**: 생체 인식 인증 및 로컬 파일 시스템 기능은 웹 브라우저에서 모의(mock)되거나 우회되는 기본 Capacitor 플러그인에 의존합니다.

**3. Android용 빌드 (APK)**
```bash
npm run build
npx cap sync android
npx cap open android
```
Android Studio가 열리면:
- Gradle이 동기화를 완료할 때까지 기다립니다.
- **Play** 버튼을 클릭하여 에뮬레이터/기기에서 실행하거나,
- `Build > Build Bundle(s) / APK(s) > Build APK(s)`로 이동하여 설치 가능한 `.apk` 파일을 생성합니다.

### 📖 사용 방법
1. **첫 실행**: 앱을 엽니다. 기기의 생체 인식 데이터에 안전하게 바인딩됩니다.
2. **지갑 가져오기**: `+` 버튼을 클릭하여 지갑이 포함된 CSV 파일을 가져옵니다. 앱은 자동으로 열(주소, 개인 키, 잔고)을 매핑하고 파일 이름별로 그룹화합니다.
3. **폴더 관리**: 상단 탭을 통해 탐색합니다. 전체 폴더의 이름을 바꾸거나 삭제하려면 탭을 두 번 클릭합니다.
4. **일괄 스윕(Batch Sweep)**: "Select Mode(선택 모드)"를 활성화하고, 여러 지갑을 선택한 다음 `Sweep` 버튼을 클릭하여 자금을 단일 주소로 통합합니다.
5. **볼트 백업**: 암호화된 `.xbot` 파일을 내보내려면 `Settings > Backup Vault`로 이동합니다.

### ⚠️ 보안 주의 사항
- **`.xbot` 백업 파일이나 이를 암호화하는 데 사용된 비밀번호를 절대 공유하지 마십시오.**
- 이 애플리케이션은 매우 민감한 개인 키를 저장합니다. **항상 기기에 안전한 화면 잠금(PIN/비밀번호/생체 인식)이 활성화되어 있는지 확인하십시오.** 기기의 화면 잠금을 해제하면 Android Keystore에서 생체 인식 키를 삭제하여 자산을 보호하기 위해 볼트에 액세스할 수 없게 됩니다.

</details>

---

<details>
<summary><h2>🇷🇺 Русский</h2></summary>

**XBOT Check** — это безопасное, автономное приложение для управления кошельками Web3, созданное с помощью React, Vite и Capacitor. Оно работает как надежное холодное хранилище (Cold Vault) для ваших криптоактивов и оснащено биометрической аутентификацией, шифрованием AES-256, функцией массовой отправки средств и встроенным подписанием транзакций.

### ✨ Основные возможности
- **🔒 Максимальная безопасность**: Все приватные ключи и seed-фразы надежно зашифрованы локально с использованием AES-256-CBC.
- **👁️ Биометрия**: Доступ защищен встроенной биометрической аутентификацией Android (FaceID / Отпечаток пальца) — ручной ввод PIN-кода не требуется.
- **📁 Умная организация**: Импортируйте кошельки через CSV и автоматически распределяйте их по папкам.
- **🧹 Массовый перевод (Batch Sweep)**: Выберите несколько кошельков и переведите их баланс (ETH, BNB, OKB) на один адрес в один клик.
- **✍️ Автономное подписание**: Формируйте транзакции, рассчитывайте газ и подписывайте их полностью на вашем устройстве перед отправкой в сеть.
- **📊 Интерактивная панель**: Отслеживайте общую стоимость вашего хранилища, распределение активов по папкам и балансы в реальном времени.
- **📜 Зашифрованная история**: Все отправки средств надежно сохраняются в локальном журнале для последующего контроля.
- **💾 Резервное копирование**: Экспортируйте все хранилище (кошельки, папки, настройки) в виде надежно зашифрованного файла `.xbot` для безопасного хранения на Google Drive или внешнем носителе.

### 🚀 Руководство по установке

**Требования**
- [Node.js](https://nodejs.org/) (рекомендуется v18 и выше)
- [Android Studio](https://developer.android.com/studio) (для создания APK для Android)
- Git

**1. Клонирование и установка зависимостей**
```bash
git clone https://github.com/haivcon/xbot.git
cd xbot/xbot-check
npm install
```

**2. Запуск в браузере (Web Mode)**
```bash
npm run dev
```
> **Примечание**: Биометрическая аутентификация и локальная файловая система зависят от нативных плагинов Capacitor, которые не работают в веб-браузере.

**3. Сборка для Android (APK)**
```bash
npm run build
npx cap sync android
npx cap open android
```
Когда откроется Android Studio:
- Дождитесь окончания синхронизации Gradle.
- Нажмите кнопку **Play** для запуска на эмуляторе/устройстве, ИЛИ
- Перейдите в `Build > Build Bundle(s) / APK(s) > Build APK(s)`, чтобы сгенерировать установочный `.apk` файл.

### 📖 Как использовать
1. **Первый запуск**: Откройте приложение. Оно безопасно привяжется к биометрическим данным вашего устройства.
2. **Импорт кошельков**: Нажмите кнопку `+`, чтобы импортировать CSV-файл с вашими кошельками. Приложение автоматически сопоставит столбцы (Адрес, Приватный ключ, Баланс) и сгруппирует их по имени файла.
3. **Управление папками**: Используйте верхние вкладки для навигации. Дважды щелкните вкладку, чтобы переименовать или удалить всю папку.
4. **Массовый перевод (Sweep)**: Включите «Select Mode», выберите несколько кошельков и нажмите кнопку `Sweep`, чтобы объединить средства на одном адресе.
5. **Резервное копирование**: Перейдите в `Settings > Backup Vault`, чтобы экспортировать зашифрованный файл `.xbot`.

### ⚠️ Предупреждение о безопасности
- **Никогда не делитесь файлами резервных копий `.xbot` или паролем, используемым для их шифрования.**
- В этом приложении хранятся конфиденциальные приватные ключи. **Всегда проверяйте, включена ли на вашем устройстве надежная блокировка экрана (PIN/Пароль/Биометрия).** Если вы отключите блокировку экрана устройства, Android Keystore удалит биометрические ключи, сделав хранилище недоступным для защиты ваших активов от кражи.

</details>

---

<details>
<summary><h2>🇮🇩 Bahasa Indonesia</h2></summary>

**XBOT Check** adalah aplikasi manajemen dompet Web3 yang aman, offline-first, dan dibangun dengan React, Vite, dan Capacitor. Aplikasi ini dirancang untuk berfungsi sebagai Cold Vault yang sangat aman untuk aset kripto Anda, dilengkapi dengan otentikasi biometrik, enkripsi AES-256, fungsi batch sweep, dan kemampuan penandatanganan transaksi secara offline.

### ✨ Fitur Utama
- **🔒 Keamanan Tertinggi**: Semua private key dan seed phrase dienkripsi secara mendalam secara lokal menggunakan AES-256-CBC.
- **👁️ Otentikasi Biometrik**: Akses dilindungi oleh Biometrik asli Android (FaceID / Sidik Jari) — tidak perlu PIN manual.
- **📁 Pengorganisasian Pintar**: Impor dompet melalui CSV dan atur secara otomatis ke dalam folder.
- **🧹 Batch Sweep**: Pilih beberapa dompet dan pindahkan saldo (ETH, BNB, OKB) mereka ke satu alamat tujuan hanya dengan satu klik.
- **✍️ Penandatangan Offline**: Buat, perkirakan gas, dan tanda tangani transaksi sepenuhnya di perangkat Anda sebelum menyiarkannya.
- **📊 Dasbor Interaktif**: Pantau total valuasi Vault Anda, distribusi aset di seluruh folder, dan saldo on-chain secara langsung.
- **📜 Riwayat Terenkripsi**: Semua pengiriman dan batch sweep Anda dicatat dengan aman secara lokal untuk tujuan audit.
- **💾 Cadangan Vault**: Ekspor seluruh vault Anda (dompet, folder, pengaturan) sebagai file `.xbot` yang sangat terenkripsi untuk penyimpanan aman di Google Drive atau cold storage.

### 🚀 Panduan Instalasi & Pengaturan

**Prasyarat**
- [Node.js](https://nodejs.org/) (disarankan v18 ke atas)
- [Android Studio](https://developer.android.com/studio) (jika Anda ingin membuat APK Android)
- Git

**1. Klon & Instal Dependensi**
```bash
git clone https://github.com/haivcon/xbot.git
cd xbot/xbot-check
npm install
```

**2. Jalankan Secara Lokal di Browser (Web Mode)**
```bash
npm run dev
```
> **Catatan**: Fitur otentikasi biometrik dan sistem file lokal bergantung pada plugin asli Capacitor, yang di-mock atau dilewati di browser web.

**3. Buat Aplikasi Android (APK)**
```bash
npm run build
npx cap sync android
npx cap open android
```
Setelah Android Studio terbuka:
- Tunggu Gradle selesai mensinkronisasi.
- Klik tombol **Play** untuk menjalankan di emulator/perangkat, ATAU
- Buka `Build > Build Bundle(s) / APK(s) > Build APK(s)` untuk menghasilkan file `.apk` yang dapat diinstal.

### 📖 Cara Menggunakan
1. **Peluncuran Pertama**: Buka aplikasi. Aplikasi ini akan mengikat secara aman ke data biometrik perangkat Anda.
2. **Impor Dompet**: Klik tombol `+` untuk mengimpor file CSV yang berisi dompet Anda. Aplikasi akan secara otomatis memetakan kolom (Alamat, Private Key, Saldo) dan mengelompokkannya berdasarkan nama file.
3. **Kelola Folder**: Navigasikan melalui tab atas. Klik dua kali tab untuk mengganti nama atau menghapus seluruh folder.
4. **Batch Sweep**: Aktifkan "Select Mode", centang beberapa dompet, dan klik tombol `Sweep` untuk mengonsolidasikan dana ke satu alamat.
5. **Cadangkan Vault**: Buka `Settings > Backup Vault` untuk mengekspor file `.xbot` yang terenkripsi.

### ⚠️ Pemberitahuan Keamanan
- **Jangan pernah membagikan file cadangan `.xbot` Anda atau kata sandi yang digunakan untuk mengenkripsinya.**
- Aplikasi ini menyimpan Private Key yang sangat sensitif. **Selalu pastikan perangkat Anda memiliki kunci layar yang aman (PIN/Kata Sandi/Biometrik) diaktifkan.** Jika Anda menghapus kunci layar perangkat Anda, Android Keystore akan menghapus kunci biometrik, membuat vault tidak dapat diakses untuk melindungi aset Anda dari pencurian.

</details>
