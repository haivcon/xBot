import { useState } from 'react';
import { ArrowLeft, Trash2, ShieldAlert, ShieldCheck, Sun, Moon, Download, Lock, Globe, Check, ChevronDown } from 'lucide-react';
import { loadWallets } from '../utils/storage';
import { exportPortableBackup } from '../utils/backupUtils';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useT, useLanguage } from '../contexts/LanguageContext';
import { LANGUAGES } from '../locales';

export default function SettingsScreen({ aesKey, onBack, onWipe }) {
    const [exporting, setExporting] = useState(false);
    const [showPasswordInput, setShowPasswordInput] = useState(false);
    const [backupPassword, setBackupPassword] = useState('');
    const [backupPasswordConfirm, setBackupPasswordConfirm] = useState('');
    const [showLangPicker, setShowLangPicker] = useState(false);

    const { theme, toggleTheme } = useTheme();
    const { showToast } = useToast();
    const showConfirm = useConfirm();
    const t = useT();
    const { lang, changeLang } = useLanguage();

    const currentLang = LANGUAGES.find(l => l.code === lang);

    const handleExportPortable = async () => {
        if (!backupPassword || backupPassword.length < 6) {
            showToast(t('settings.passwordMinError'), 'warning');
            return;
        }
        if (backupPassword !== backupPasswordConfirm) {
            showToast(t('settings.passwordMismatch'), 'error');
            return;
        }
        setExporting(true);
        try {
            const wallets = await loadWallets(aesKey);
            const success = await exportPortableBackup(wallets, null, backupPassword);
            if (!success) showToast(t('settings.exportFailed'), 'error');
            else {
                showToast(t('settings.exportSuccess'), 'success');
                setShowPasswordInput(false);
                setBackupPassword('');
                setBackupPasswordConfirm('');
            }
        } catch (e) {
            showToast(t('settings.exportError'), 'error');
        }
        setExporting(false);
    };

    const handleWipe = async () => {
        const ok = await showConfirm(t('settings.wipeConfirm'), { danger: true });
        if (!ok) return;
        const { wipeAllData } = await import('../utils/storage');
        await wipeAllData();
        onWipe();
    };

    const isDark = theme === 'dark';

    return (
        <div className="min-h-screen bg-surface-900 text-surface-50 p-4 pb-10">
            <header className="flex items-center justify-between mb-8 sticky top-0 bg-surface-900/80 backdrop-blur-md py-4 z-10">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-surface-800 transition-colors">
                    <ArrowLeft size={24} className="text-surface-300" />
                </button>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-surface-400 pr-1">
                    {t('settings.title')}
                </h1>
                <div className="w-10"></div>
            </header>

            <div className="max-w-xl mx-auto space-y-6">

                {/* ═══ Language Picker — Premium ═══ */}
                <div className="glass-card overflow-hidden">
                    <button
                        onClick={() => setShowLangPicker(!showLangPicker)}
                        className="w-full flex items-center justify-between p-4 hover:bg-surface-800/30 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                                <Globe size={20} className="text-brand-400" />
                            </div>
                            <div className="text-left">
                                <p className="text-white font-medium text-sm">{t('settings.language')}</p>
                                <p className="text-xs text-surface-400">{currentLang?.flag} {currentLang?.nativeName}</p>
                            </div>
                        </div>
                        <ChevronDown size={18} className={`text-surface-500 transition-transform duration-200 ${showLangPicker ? 'rotate-180' : ''}`} />
                    </button>

                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showLangPicker ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="px-4 pb-4 border-t border-surface-700/50">
                            <p className="text-xs text-surface-500 py-3">{t('settings.languageDesc')}</p>
                            <div className="grid grid-cols-3 gap-2">
                                {LANGUAGES.map(l => {
                                    const isActive = lang === l.code;
                                    return (
                                        <button
                                            key={l.code}
                                            onClick={() => { changeLang(l.code); setShowLangPicker(false); }}
                                            className={`relative flex flex-col items-center gap-1 p-3 rounded-xl text-xs transition-all duration-150 
                                                ${isActive 
                                                    ? 'bg-brand-500/15 border-2 border-brand-500/40 text-white shadow-lg shadow-brand-500/5' 
                                                    : 'bg-surface-800/60 border-2 border-transparent text-surface-400 hover:bg-surface-700/80 hover:text-white hover:border-surface-600'}`}
                                        >
                                            <span className="text-xl leading-none">{l.flag}</span>
                                            <span className="font-medium truncate w-full text-center">{l.nativeName}</span>
                                            {isActive && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center shadow-md">
                                                    <Check size={12} className="text-white" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ Theme Toggle — Premium ═══ */}
                <div className="glass-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-indigo-500/10' : 'bg-amber-500/10'}`}>
                            {isDark ? <Moon size={20} className="text-indigo-400" /> : <Sun size={20} className="text-amber-400" />}
                        </div>
                        <div>
                            <p className="text-white font-medium text-sm">{t('settings.appearance')}</p>
                            <p className="text-xs text-surface-400">{isDark ? t('settings.darkMode') : t('settings.lightMode')}</p>
                        </div>
                    </div>
                    {/* Premium toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`relative w-14 h-8 rounded-full transition-all duration-300 ease-in-out
                            ${isDark 
                                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-inner shadow-indigo-900/50' 
                                : 'bg-gradient-to-r from-amber-400 to-orange-400 shadow-inner shadow-amber-600/30'}`}
                    >
                        <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-300
                            ${isDark ? 'left-1' : 'left-7'}`}>
                            {isDark 
                                ? <Moon size={13} className="text-indigo-600" /> 
                                : <Sun size={13} className="text-amber-500" />}
                        </span>
                    </button>
                </div>

                {/* ═══ Vault Backup ═══ */}
                <div className="glass-card p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Download size={20} className="text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">{t('settings.backupTitle')}</h2>
                            <p className="text-xs text-surface-400">{t('settings.backupSubtitle')}</p>
                        </div>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3.5 mb-5 flex gap-2.5">
                        <ShieldCheck size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-surface-300 leading-relaxed">{t('settings.backupInfo')}</p>
                    </div>

                    {!showPasswordInput ? (
                        <button
                            onClick={() => setShowPasswordInput(true)}
                            disabled={exporting}
                            className="w-full bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/20 font-medium py-3 px-4 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Lock size={16} />
                            {t('settings.createBackup')}
                        </button>
                    ) : (
                        <div className="space-y-3 bg-surface-800/50 p-4 rounded-xl border border-surface-700">
                            <div>
                                <label className="block text-xs font-medium text-surface-400 mb-1.5">{t('settings.backupPassword')}</label>
                                <input
                                    type="password" value={backupPassword} autoFocus
                                    onChange={(e) => setBackupPassword(e.target.value)}
                                    placeholder={t('settings.passwordMin')}
                                    className="w-full bg-surface-900 border border-surface-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-surface-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-surface-400 mb-1.5">{t('settings.confirmPassword')}</label>
                                <input
                                    type="password" value={backupPasswordConfirm}
                                    onChange={(e) => setBackupPasswordConfirm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleExportPortable()}
                                    placeholder={t('settings.reenterPassword')}
                                    className="w-full bg-surface-900 border border-surface-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-surface-600"
                                />
                            </div>
                            <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-lg p-2.5 flex gap-2">
                                <ShieldAlert size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                                <p className="text-[11px] text-yellow-300/80 leading-relaxed">{t('settings.passwordWarning')}</p>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button onClick={() => { setShowPasswordInput(false); setBackupPassword(''); setBackupPasswordConfirm(''); }}
                                    className="flex-1 bg-surface-700 hover:bg-surface-600 text-surface-300 py-2.5 rounded-lg text-sm transition-colors">{t('common.cancel')}</button>
                                <button onClick={handleExportPortable} disabled={exporting}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                                    {exporting ? t('settings.exporting') : t('settings.exportBackup')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ═══ Danger Zone ═══ */}
                <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-6 mt-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                            <ShieldAlert size={20} className="text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-red-400">{t('settings.dangerZone')}</h2>
                            <p className="text-xs text-red-400/70">{t('settings.dangerSubtitle')}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleWipe}
                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium py-3 px-4 rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <Trash2 size={18} />
                        {t('settings.wipeAll')}
                    </button>
                    <p className="text-xs text-surface-500 mt-3 text-center">{t('settings.wipeDesc')}</p>
                </div>
            </div>
        </div>
    );
}
