import { useState, useEffect } from 'react';
import { ArrowLeft, Key, Trash2, ShieldAlert } from 'lucide-react';
import { loadApiConfig, saveApiConfig, wipeAllData } from '../utils/storage';

export default function SettingsScreen({ aesKey, onBack, onWipe }) {
    const [config, setConfig] = useState({ apiKey: '', secretKey: '', passphrase: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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
        if (success) {
            alert('Settings saved successfully!');
        } else {
            alert('Failed to save settings.');
        }
    };

    const handleWipe = async () => {
        if (window.confirm("WARNING: This will delete all encrypted wallets and API keys from this device. You will lose access to this vault. Are you sure?")) {
            await wipeAllData();
            onWipe();
        }
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-surface-900 text-surface-50 p-4 pb-10">
            {/* Header */}
            <header className="flex items-center justify-between mb-8 sticky top-0 bg-surface-900/80 backdrop-blur-md py-4 z-10">
                <button 
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-surface-800 transition-colors"
                >
                    <ArrowLeft size={24} className="text-surface-300" />
                </button>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-surface-400">
                    Vault Settings
                </h1>
                <div className="w-10"></div> {/* Spacer for centering */}
            </header>

            <div className="max-w-xl mx-auto space-y-6">
                
                {/* OKX API Key */}
                <div className="glass-card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center">
                            <Key size={20} className="text-brand-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">OKX OnchainOS API</h2>
                            <p className="text-xs text-surface-400">Required for DeFi (swap, live balance, gas)</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-surface-400 mb-1">OKX API Key</label>
                            <input 
                                type="text" 
                                value={config.apiKey}
                                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                                placeholder="your_okx_api_key"
                                className="w-full bg-surface-900 border border-surface-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder:text-surface-600"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-surface-400 mb-1">OKX Secret Key</label>
                            <input 
                                type="password" 
                                value={config.secretKey}
                                onChange={(e) => setConfig({ ...config, secretKey: e.target.value })}
                                placeholder="your_okx_secret_key"
                                className="w-full bg-surface-900 border border-surface-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder:text-surface-600"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-surface-400 mb-1">OKX API Passphrase</label>
                            <input 
                                type="password" 
                                value={config.passphrase}
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
