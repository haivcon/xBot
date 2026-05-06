# 🛡️ XBOT Check — Web3 Cold Storage Vault

**[🇬🇧 English](#-english) | [🇻🇳 Tiếng Việt](#-tiếng-việt) | [🇨🇳 简体中文](#-简体中文)**

---

<br>

<details open>
<summary><h2>🇬🇧 English</h2></summary>

**XBOT Check** is a secure, offline-first Web3 wallet management application built with React, Vite, and Capacitor. It is designed to act as a highly secure Cold Vault for your crypto assets, featuring biometric authentication, AES-256 encryption, and native transaction signing capabilities.

### ✨ Key Features
- **🔒 Ultimate Security**: All private keys and seed phrases are heavily encrypted locally using AES-256-CBC.
- **👁️ Biometric Auth**: Access is protected by native Android Biometrics (FaceID / Fingerprint) — no manual PIN codes required.
- **📁 Smart Organization**: Import wallets via CSV and automatically organize them into folders.
- **🧹 Batch Sweep Engine**: Select multiple wallets and drain their native balances (ETH, BNB, OKB) to a single destination address in one click.
- **✍️ Offline Signer**: Construct, estimate gas, and sign transactions entirely on your device before broadcasting.
- **📊 Interactive Dashboard**: Monitor your vault's total valuation, asset distribution across folders, and live on-chain balances.
- **📜 Encrypted History**: All your sends and batch sweeps are securely logged locally for auditing.
- **💾 Vault Backups**: Export your entire vault (wallets, folders, settings) as a highly encrypted `.xbot` file for safe storage on Google Drive or cold storage.

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
