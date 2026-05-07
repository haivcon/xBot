import { useState, useEffect } from 'react';
import { ArrowLeft, Key, Trash2, ShieldAlert, Sun, Moon, Download, Lock, Wifi, WifiOff, ExternalLink } from 'lucide-react';
import { loadApiConfig, saveApiConfig, wipeAllData, loadWallets } from '../utils/storage';
import { exportVaultBackup, exportPortableBackup } from '../utils/backupUtils';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

export default function SettingsScreen({ aesKey, onBack, onWipe, offlineMode, onToggleOffline }) {
    const [config, setConfig] = useState({ apiKey: '', secretKey: '', passphrase: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);
    // #14: Portable backup
    const [showPasswordInput, setShowPasswordInput] = useState(false);
    const [backupPassword, setBackupPassword] = useState('');
    const [backupPasswordConfirm, setBackupPasswordConfirm] = useState('');

    const { theme, toggleTheme } = useTheme();
    const { showToast } = useToast();
    const showConfirm = useConfirm();

    useEffect(() => {
        const fetchApiConfig = async () => {
            try {
                const savedConfig = await loadApiConfig(aesKey);
                setConfig(savedConfig || { apiKey: '', secretKey: '', passphrase: '' });
            } catch (e) {
                console.error("Failed to load API config", e);
            }
            setLoading(false);
        };
        fetchApiConfig();
    }, [aesKey]);

    const handleSave = async () => {
        setSaving(true);
        const success = await saveApiConfig(config, aesKey);
        setSaving(false);
        showToast(success ? 'Settings saved successfully!' : 'Failed to save settings.', success ? 'success' : 'error');
    };

    const handleExportDeviceLocked = async () => {
        setExporting(true);
        try {
            const wallets = await loadWallets(aesKey);
            const currentConfig = await loadApiConfig(aesKey);
            const success = await exportVaultBackup(wallets, currentConfig, aesKey);
            if (!success) showToast('Export failed.', 'error');
            else showToast('Device-locked backup exported', 'success');
        } catch (e) {
            showToast('Error exporting backup.', 'error');
        }
        setExporting(false);
    };

    // #14: Portable backup with password
    const handleExportPortable = async () => {
        if (!backupPassword || backupPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'warning');
            return;
        }
        if (backupPassword !== backupPasswordConfirm) {
            showToast('Passwords do not match', 'error');
            return;
        }
        setExporting(true);
        try {
            const wallets = await loadWallets(aesKey);
            const currentConfig = await loadApiConfig(aesKey);
            const success = await exportPortableBackup(wallets, currentConfig, backupPassword);
            if (!success) showToast('Export failed.', 'error');
            else {
                showToast('Portable backup exported successfully', 'success');
                setShowPasswordInput(false);
                setBackupPassword('');
                setBackupPasswordConfirm('');
            }
        } catch (e) {
            showToast('Error exporting portable backup.', 'error');
        }
        setExporting(false);
    };

    const handleWipe = async () => {
        const ok = await showConfirm("WARNING: This will delete all encrypted wallets and API keys from this device. You will lose access to this vault. Are you sure?", { danger: true });
        if (!ok) return;
        await wipeAllData();
        onWipe();
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-surface-900 text-surface-50 p-4 pb-10">
            <header className="flex items-center justify-between mb-8 sticky top-0 bg-surface-900/80 backdrop-blur-md py-4 z-10">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-surface-800 transition-colors">
                    <ArrowLeft size={24} className="text-surface-300" />
                </button>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-surface-400 pr-1">
                    Vault Settings
                </h1>
                <div className="w-10"></div>
            </header>

            <div className="max-w-xl mx-auto space-y-6">

                {/* #11: Theme Toggle */}
                <div className="glass-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {theme === 'dark' ? <Moon size={20} className="text-brand-400" /> : <Sun size={20} className="text-yellow-400" />}
                        <div>
                            <p className="text-white font-medium text-sm">Appearance</p>
                            <p className="text-xs text-surface-400">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                        </div>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className={`relative w-12 h-6 rounded-full transition-colors ${theme === 'light' ? 'bg-brand-500' : 'bg-surface-700'}`}
                    >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${theme === 'light' ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                </div>

                {/* Offline Mode Toggle */}
                <div className="glass-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {offlineMode ? <WifiOff size={20} className="text-yellow-400" /> : <Wifi size={20} className="text-green-400" />}
                        <div>
                            <p className="text-white font-medium text-sm">Offline Mode</p>
                            <p className="text-xs text-surface-400">{offlineMode ? 'All network features disabled' : 'Online — API features available'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onToggleOffline}
                        className={`relative w-12 h-6 rounded-full transition-colors ${offlineMode ? 'bg-yellow-500' : 'bg-surface-700'}`}
                    >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${offlineMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                </div>

                {/* OKX API Key */}
                <div className={`glass-card p-6 ${offlineMode ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center">
                            <Key size={20} className="text-brand-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">OKX OnchainOS API</h2>
                            <p className="text-xs text-surface-400">Required for DeFi (swap, live balance, gas)</p>
                        </div>
                    </div>

                    {/* Registration guide */}
                    <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-4 mb-4">
                        <p className="text-sm text-brand-300 font-medium mb-2">📋 How to get your API Key</p>
                        <ol className="text-xs text-surface-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                            <li>Open the OKX Dev Portal and sign in with your OKX account</li>
                            <li>Click <strong>"Create Project"</strong> → enter any project name</li>
                            <li>After creation, go to your project → <strong>"API Keys"</strong> tab</li>
                            <li>Click <strong>"Create API Key"</strong>, set a passphrase</li>
                            <li>Copy <strong>API Key</strong>, <strong>Secret Key</strong> and <strong>Passphrase</strong> below</li>
                        </ol>
                        <a
                            href="https://web3.okx.com/vi/onchainos/dev-portal/project"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 flex items-center gap-1.5 text-brand-400 hover:text-brand-300 text-xs font-medium transition-colors"
                        >
                            <ExternalLink size={14} />
                            Open OKX OnchainOS Dev Portal →
                        </a>
                    </div>

                    {offlineMode && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4 text-xs text-yellow-400 flex items-center gap-2">
                            <WifiOff size={14} />
                            API is disabled in Offline Mode. Toggle it off above to use online features.
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-surface-400 mb-1">OKX API Key</label>
                            <input
                                type="text" value={config.apiKey}
                                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                                placeholder="your_okx_api_key"
                                className="w-full bg-surface-900 border border-surface-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder:text-surface-600"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-surface-400 mb-1">OKX Secret Key</label>
                            <input
                                type="password" value={config.secretKey}
                                onChange={(e) => setConfig({ ...config, secretKey: e.target.value })}
                                placeholder="your_okx_secret_key"
                                className="w-full bg-surface-900 border border-surface-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder:text-surface-600"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-surface-400 mb-1">OKX API Passphrase</label>
                            <input
                                type="password" value={config.passphrase}
                                onChange={(e) => setConfig({ ...config, passphrase: e.target.value })}
                                placeholder="your_okx_passphrase"
                                className="w-full bg-surface-900 border border-surface-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder:text-surface-600"
                            />
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-medium py-3 px-4 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
                        >
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>

                {/* Vault Backup */}
                <div className="glass-card p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Download size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Vault Backup</h2>
                            <p className="text-xs text-surface-400">Export encrypted backup file</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleExportDeviceLocked}
                            disabled={exporting}
                            className="w-full bg-surface-800 hover:bg-surface-700 text-white border border-surface-700 font-medium py-3 px-4 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Lock size={16} />
                            {exporting ? 'Exporting...' : 'Device-Locked Backup'}
                        </button>
                        <p className="text-xs text-surface-500 text-center">
                            Encrypted with your device biometric key. Only restorable on this device.
                        </p>

                        {/* #14: Portable */}
                        {!showPasswordInput ? (
                            <button
                                onClick={() => setShowPasswordInput(true)}
                                disabled={exporting}
                                className="w-full bg-surface-800 hover:bg-surface-700 text-white border border-surface-700 font-medium py-3 px-4 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Key size={16} />
                                Portable Backup (Password)
                            </button>
                        ) : (
                            <div className="space-y-3 bg-surface-800/50 p-4 rounded-lg border border-surface-700">
                                <p className="text-xs text-surface-400">Choose a strong password. This backup can be restored on any device.</p>
                                <input
                                    type="password" value={backupPassword}
                                    onChange={(e) => setBackupPassword(e.target.value)}
                                    placeholder="Password (min 6 chars)"
                                    className="w-full bg-surface-900 border border-surface-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 placeholder:text-surface-600"
                                />
                                <input
                                    type="password" value={backupPasswordConfirm}
                                    onChange={(e) => setBackupPasswordConfirm(e.target.value)}
                                    placeholder="Confirm password"
                                    className="w-full bg-surface-900 border border-surface-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 placeholder:text-surface-600"
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => { setShowPasswordInput(false); setBackupPassword(''); setBackupPasswordConfirm(''); }}
                                        className="flex-1 bg-surface-700 hover:bg-surface-600 text-surface-300 py-2.5 rounded-lg text-sm transition-colors">Cancel</button>
                                    <button onClick={handleExportPortable} disabled={exporting}
                                        className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                                        {exporting ? 'Exporting...' : 'Export'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-6 mt-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                            <ShieldAlert size={20} className="text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
                            <p className="text-xs text-red-400/70">Irreversible destructive actions</p>
                        </div>
                    </div>

                    <button
                        onClick={handleWipe}
                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium py-3 px-4 rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <Trash2 size={18} />
                        Wipe All Vault Data
                    </button>
                    <p className="text-xs text-surface-500 mt-3 text-center">
                        This action deletes the AES Encryption Key, API keys, and all encrypted wallets. You cannot recover them.
                    </p>
                </div>

            </div>
        </div>
    );
}
