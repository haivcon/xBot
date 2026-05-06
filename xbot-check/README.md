# 🛡️ XBOT Check — Web3 Cold Storage Vault

**XBOT Check** is a secure, offline-first Web3 wallet management application built with React, Vite, and Capacitor. It is designed to act as a highly secure Cold Vault for your crypto assets, featuring biometric authentication, AES-256 encryption, and native transaction signing capabilities.

## ✨ Key Features

- **🔒 Ultimate Security**: All private keys and seed phrases are heavily encrypted locally using AES-256-CBC.
- **👁️ Biometric Auth**: Access is protected by native Android Biometrics (FaceID / Fingerprint) — no manual PIN codes required.
- **📁 Smart Organization**: Import wallets via CSV and automatically organize them into folders.
- **🧹 Batch Sweep Engine**: Select multiple wallets and drain their native balances (ETH, BNB, OKB) to a single destination address in one click.
- **✍️ Offline Signer**: Construct, estimate gas, and sign transactions entirely on your device before broadcasting.
- **📊 Interactive Dashboard**: Monitor your vault's total valuation, asset distribution across folders, and live on-chain balances.
- **📜 Encrypted History**: All your sends and batch sweeps are securely logged locally for auditing.
- **💾 Vault Backups**: Export your entire vault (wallets, folders, settings) as a highly encrypted `.xbot` file for safe storage on Google Drive or cold storage.

## 🚀 Installation & Setup Guide

To run or build XBOT Check on your local machine, follow these steps:

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Android Studio](https://developer.android.com/studio) (if you want to build the Android APK)
- Git

### 1. Clone & Install Dependencies
First, clone the repository and navigate to the `xbot-check` directory:
```bash
git clone https://github.com/haivcon/xbot.git
cd xbot/xbot-check

# Install Node dependencies
npm install
```

### 2. Run Locally in Browser (Web Mode)
You can run the app in your browser for testing and development:
```bash
npm run dev
```
> **Note**: Biometric authentication and local filesystem features rely on native Capacitor plugins, which are mocked or bypassed in the web browser.

### 3. Build for Android (APK)
To compile the app into an Android APK, you need Android Studio installed.

```bash
# 1. Build the React web assets
npm run build

# 2. Sync the built assets with the Android project
npx cap sync android

# 3. Open Android Studio
npx cap open android
```
Once Android Studio opens:
- Wait for Gradle to finish syncing.
- Click the **Play** button to run on an emulator/device, OR
- Go to `Build > Build Bundle(s) / APK(s) > Build APK(s)` to generate an installable `.apk` file.

## 📖 How to Use

1. **First Launch**: Open the app. It will securely bind to your device's biometric data.
2. **Import Wallets**: Click the `+` button to import a CSV file containing your wallets. The app will automatically map columns (Address, Private Key, Balance) and group them by filename.
3. **Manage Folders**: Navigate via the top tabs. Double-click a tab to rename or delete the entire folder.
4. **Batch Sweep**: Enable "Select Mode", tick multiple wallets, and click the `Sweep` button to consolidate funds to a single address.
5. **Backup Vault**: Go to `Settings > Backup Vault` to export an encrypted `.xbot` file.

## 🛠️ Tech Stack
- **Frontend**: React 19, TailwindCSS v4, Lucide Icons
- **Web3**: ethers.js v6
- **Mobile Framework**: Capacitor 8
- **Security**: CryptoJS (AES-256), Capgo Native Biometric

## ⚠️ Security Notice
- **Never share your `.xbot` backup files or the password used to encrypt them.**
- This application stores sensitive Private Keys. Always ensure your device has a secure screen lock (PIN/Password/Biometrics) enabled. If you remove your device's screen lock, the Android Keystore will drop the biometric keys, rendering the vault inaccessible to protect your assets.
