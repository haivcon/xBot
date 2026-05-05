import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { 
  UploadCloud, Wallet, Key, FileText, Check, Copy, Search, Eye, EyeOff, ChevronDown, ChevronUp, QrCode, Settings, RefreshCw, Send, ArrowDownUp
} from 'lucide-react';
import { FilePicker } from '@capawesome/capacitor-file-picker';

import SettingsScreen from './components/SettingsScreen';
import QRCodeModal from './components/QRCodeModal';
import SendFundsModal from './components/SendFundsModal';
import { saveWallets, loadWallets, loadApiConfig, saveApiConfig, getEncryptionKey } from './utils/storage';
import { exportVaultBackup, parseVaultBackupFile } from './utils/backupUtils';
import { fetchWalletBalances } from './utils/okxApi';

// ... (WalletCard unchanged)

function WalletCard({ wallet, onShowQR, onSendFunds }) {
  const [expanded, setExpanded] = useState(false);
  const [showPk, setShowPk] = useState(false);
  const [showSeed, setShowSeed] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="glass-card mb-4 overflow-hidden border border-surface-700 hover:border-brand-500/30 transition-colors">
      {/* Header - Always visible */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer bg-surface-800/30 hover:bg-surface-800/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center flex-shrink-0">
            <Wallet size={20} className="text-brand-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-medium truncate">
              {wallet.name || 'Unnamed Wallet'}
            </h3>
            <p className="text-surface-400 text-sm font-mono truncate">
              {wallet.address ? `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}` : 'No Address'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-white font-semibold">
              ${wallet.balance || '0.00'}
            </p>
            <p className="text-xs text-surface-400">Balance</p>
          </div>
          {expanded ? <ChevronUp size={20} className="text-surface-500" /> : <ChevronDown size={20} className="text-surface-500" />}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="p-4 border-t border-surface-700 bg-surface-900/50 space-y-4">
          
          {/* Address */}
          {wallet.address && (
            <div>
              <label className="text-xs text-surface-400 uppercase tracking-wider mb-1 block">Address</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-surface-800 text-brand-300 p-2 rounded text-sm break-all">
                  {wallet.address}
                </code>
                {wallet.privateKey && (
                  <button 
                    onClick={() => onSendFunds(wallet)}
                    className="p-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded transition-colors"
                  >
                    <Send size={18} />
                  </button>
                )}
                <button 
                  onClick={() => onShowQR(wallet.address, 'Wallet Address', wallet.name)}
                  className="p-2 bg-surface-800 hover:bg-brand-500/20 text-brand-400 rounded transition-colors"
                >
                  <QrCode size={18} />
                </button>
                <button 
                  onClick={() => handleCopy(wallet.address, 'address')}
                  className="p-2 bg-surface-800 hover:bg-surface-700 text-surface-300 rounded transition-colors"
                >
                  {copiedField === 'address' ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Private Key */}
          {wallet.privateKey && (
            <div>
              <label className="text-xs text-surface-400 uppercase tracking-wider mb-1 block">Private Key</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-surface-800 text-surface-200 p-2 rounded text-sm break-all font-mono">
                  {showPk ? wallet.privateKey : '•'.repeat(Math.min(wallet.privateKey.length, 64))}
                </code>
                <button 
                  onClick={() => setShowPk(!showPk)}
                  className="p-2 bg-surface-800 hover:bg-surface-700 text-surface-300 rounded transition-colors"
                >
                  {showPk ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button 
                  onClick={() => onShowQR(wallet.privateKey, 'Private Key', 'WARNING: Do not scan in public')}
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                >
                  <QrCode size={18} />
                </button>
                <button 
                  onClick={() => handleCopy(wallet.privateKey, 'pk')}
                  className="p-2 bg-surface-800 hover:bg-surface-700 text-surface-300 rounded transition-colors"
                >
                  {copiedField === 'pk' ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Seed Phrase */}
          {wallet.seedPhrase && (
            <div>
              <label className="text-xs text-surface-400 uppercase tracking-wider mb-1 block">Seed Phrase</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-surface-800 text-surface-200 p-2 rounded text-sm break-words leading-relaxed">
                  {showSeed ? wallet.seedPhrase : '• '.repeat(wallet.seedPhrase.split(' ').length)}
                </code>
                <button 
                  onClick={() => setShowSeed(!showSeed)}
                  className="p-2 bg-surface-800 hover:bg-surface-700 text-surface-300 rounded transition-colors h-fit self-start"
                >
                  {showSeed ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button 
                  onClick={() => handleCopy(wallet.seedPhrase, 'seed')}
                  className="p-2 bg-surface-800 hover:bg-surface-700 text-surface-300 rounded transition-colors h-fit self-start"
                >
                  {copiedField === 'seed' ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [aesKey, setAesKey] = useState(null);
  const [authError, setAuthError] = useState('');
  const [currentView, setCurrentView] = useState('home'); // 'home', 'settings'
  
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState('All');
  const [sortOrder, setSortOrder] = useState('none'); // 'none', 'asc', 'desc'
  
  const [qrModalData, setQrModalData] = useState({ isOpen: false, data: '', title: '', subtitle: '' });
  const [sendModalWallet, setSendModalWallet] = useState(null);

  // On Unlock, load data
  useEffect(() => {
    const authenticate = async () => {
      try {
        const key = await getEncryptionKey();
        setAesKey(key);
        const savedWallets = await loadWallets(key);
        if (savedWallets && savedWallets.length > 0) {
          setWallets(savedWallets);
        }
      } catch (err) {
        setAuthError(err.message || "Failed to authenticate.");
      }
    };
    authenticate();
  }, []);

  const handleFileUpload = async () => {
    try {
      const result = await FilePicker.pickFiles({
        types: ['text/csv', 'text/comma-separated-values', 'application/csv', '.csv', 'application/octet-stream'],
        multiple: false,
        readData: true
      });

      if (result.files && result.files.length > 0) {
        const file = result.files[0];
        setLoading(true);

        // Handle .xbot Backup File
        if (file.name && file.name.toLowerCase().endsWith('.xbot')) {
            try {
                const backup = await parseVaultBackupFile(file.data, aesKey);
                
                // Merge wallets
                const newWallets = [...wallets, ...backup.wallets];
                setWallets(newWallets);
                await saveWallets(newWallets, aesKey);
                
                // Merge config (overwrite if exists)
                if (backup.config && backup.config.apiKey) {
                    await saveApiConfig(backup.config, aesKey);
                }
                
                alert('Backup imported successfully!');
                setLoading(false);
                return;
            } catch (err) {
                alert(err.message || "Failed to import backup");
                setLoading(false);
                return;
            }
        }
        
        // Handle CSV File
        let csvString = '';
        try {
            const binString = atob(file.data);
            const bytes = new Uint8Array(binString.length);
            for (let i = 0; i < binString.length; i++) {
                bytes[i] = binString.charCodeAt(i);
            }
            csvString = new TextDecoder().decode(bytes);
        } catch (e) {
            console.error('Base64 decode error:', e);
            alert('Error reading file data.');
            setLoading(false);
            return;
        }

        Papa.parse(csvString, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            const { data } = results;
            const folderName = file.name ? file.name.replace(/\.csv$/i, '') : 'Imported';
            
            const normalizedData = data.map(row => {
              const normalizedRow = { _raw: row, groupId: folderName };
              for (const [key, value] of Object.entries(row)) {
                const lowerKey = key.toLowerCase().trim();
                if (lowerKey.includes('name')) normalizedRow.name = value;
                else if (lowerKey.includes('address')) normalizedRow.address = value;
                else if (lowerKey.includes('private') || lowerKey === 'pk') normalizedRow.privateKey = value;
                else if (lowerKey.includes('seed') || lowerKey.includes('phrase')) normalizedRow.seedPhrase = value;
                else if (lowerKey.includes('balance') || lowerKey.includes('amount')) normalizedRow.balance = value;
              }
              return normalizedRow;
            });

            const newWallets = [...wallets, ...normalizedData];
            setWallets(newWallets);
            await saveWallets(newWallets, aesKey); // Save to secure storage
            setLoading(false);
          },
          error: (err) => {
            console.error('CSV Parse Error:', err);
            setLoading(false);
          }
        });
      }
    } catch (error) {
      console.error('FilePicker Error:', error);
      setLoading(false);
    }
  };

  const refreshLiveBalances = async () => {
    const config = await loadApiConfig(aesKey);
    if (!config.apiKey || !config.secretKey) {
      alert('Please set your complete OKX API Key in Settings first.');
      return;
    }
    setRefreshing(true);
    
    try {
        const currentWallets = [...wallets];
        let updatedCount = 0;
        
        // Only refresh wallets in the currently active folder
        const targetWallets = activeFolder === 'All' 
            ? currentWallets 
            : currentWallets.filter(w => (w.groupId || 'Imported') === activeFolder);

        for (let i = 0; i < targetWallets.length; i++) {
            const w = targetWallets[i];
            if (!w.address) continue;
            
            try {
                // Delay to prevent OKX rate limit (max 10/s)
                await new Promise(r => setTimeout(r, 200));
                
                const data = await fetchWalletBalances(w.address, config);
                
                // Update balance (data.totalUsdValue)
                if (data && data.totalUsdValue) {
                    const originalIndex = currentWallets.findIndex(orig => orig.address === w.address);
                    if (originalIndex !== -1) {
                        currentWallets[originalIndex].balance = parseFloat(data.totalUsdValue).toFixed(2);
                        updatedCount++;
                    }
                }
            } catch (err) {
                console.error(`Failed to sync ${w.address}:`, err);
            }
        }
        
        if (updatedCount > 0) {
            setWallets(currentWallets);
            await saveWallets(currentWallets, aesKey);
            alert(`Successfully synced balances for ${updatedCount} wallets!`);
        } else {
            alert('Live Sync completed, but no balances were updated (rate limits or empty wallets).');
        }
        
    } catch (e) {
        alert("Failed to run Live Sync: " + e.message);
    }
    setRefreshing(false);
  };

  const handleWipe = () => {
    setWallets([]);
    setAesKey(null);
    setCurrentView('home');
    // Reload to force new key generation
    window.location.reload();
  };

  // Views Orchestration
  if (authError) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4 text-center">
        <div className="max-w-sm w-full">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Vault Locked</h2>
          <p className="text-surface-400 mb-8">{authError}</p>
          
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Retry Authentication
            </button>
            
            {authError.includes('Invalid Key') && (
              <button 
                onClick={async () => {
                  if (window.confirm("WARNING: Your encryption key was lost or corrupted (usually happens if you removed your phone's screen lock). To use the app again, you must wipe all current vault data. Proceed?")) {
                    const { wipeAllData } = await import('./utils/storage');
                    await wipeAllData();
                    window.location.reload();
                  }
                }}
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Wipe Vault & Reset
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!aesKey) {
    return (
      <div className="min-h-screen bg-surface-900 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-surface-400 text-sm">Unlocking Vault...</p>
      </div>
    );
  }

  if (currentView === 'settings') {
    return <SettingsScreen aesKey={aesKey} onBack={() => setCurrentView('home')} onWipe={handleWipe} />;
  }

  // Folders logic
  const folders = ['All', ...new Set(wallets.map(w => w.groupId || 'Imported'))];

  // Home Vault View
  const filteredWallets = wallets.filter(w => {
    if (activeFolder !== 'All' && (w.groupId || 'Imported') !== activeFolder) return false;
    const q = searchQuery.toLowerCase();
    return (w.name && w.name.toLowerCase().includes(q)) || 
           (w.address && w.address.toLowerCase().includes(q));
  }).sort((a, b) => {
    if (sortOrder === 'none') return 0;
    const valA = parseFloat(a.balance || 0) || 0;
    const valB = parseFloat(b.balance || 0) || 0;
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  // Calculate Total Balance (assuming numeric balances)
  const totalBalance = filteredWallets.reduce((acc, w) => {
    const val = parseFloat(w.balance || 0);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <div className="min-h-screen bg-surface-950 text-surface-50 font-sans selection:bg-brand-500/30">
      
      {/* Top Header - Analytics & Navigation */}
      <header className="sticky top-0 z-10 bg-surface-900/80 backdrop-blur-md border-b border-surface-800 px-4 py-4 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded flex items-center justify-center">
              <ShieldAlert size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-surface-400">
              Vault
            </h1>
          </div>
          <button 
            onClick={() => setCurrentView('settings')}
            className="p-2 text-surface-400 hover:text-white bg-surface-800 hover:bg-surface-700 rounded-full transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>

        {wallets.length > 0 && (
          <div className="glass-card p-4 flex justify-between items-end mb-2">
            <div>
              <p className="text-surface-400 text-xs uppercase tracking-wider mb-1">Total Assets</p>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </h2>
            </div>
            <button 
              onClick={refreshLiveBalances}
              disabled={refreshing}
              className="flex items-center gap-2 text-xs font-medium text-brand-400 bg-brand-500/10 px-3 py-2 rounded-lg hover:bg-brand-500/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Syncing...' : 'Live Sync'}
            </button>
          </div>
        )}
      </header>

      <main className="p-4 max-w-2xl mx-auto pb-20">
        
        {/* Upload Area (If empty) */}
        {wallets.length === 0 ? (
          <div 
            onClick={handleFileUpload}
            className="glass-card border-dashed border-2 border-surface-200/20 hover:border-brand-500/50 cursor-pointer p-8 flex flex-col items-center justify-center transition-all group mt-10"
          >
            <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              {loading ? (
                <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <UploadCloud size={32} className="text-brand-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Import Secure CSV</h3>
            <p className="text-surface-400 text-sm text-center">
              Your data will be encrypted with your PIN and stored locally offline.
            </p>
          </div>
        ) : (
          <>
            {/* Folder Tabs */}
            {folders.length > 1 && (
              <div className="flex overflow-x-auto gap-2 pb-2 mb-4 scrollbar-hide">
                {folders.map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveFolder(f)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeFolder === f ? 'bg-brand-500 text-white' : 'bg-surface-800 text-surface-400 hover:text-white hover:bg-surface-700'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6 mt-2">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input 
                  type="text" 
                  placeholder="Search by address or name..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-900 border border-surface-700 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder:text-surface-500"
                />
              </div>
              
              <button 
                onClick={() => setSortOrder(prev => prev === 'none' ? 'desc' : prev === 'desc' ? 'asc' : 'none')}
                className={`flex-shrink-0 border px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${sortOrder !== 'none' ? 'bg-brand-500/10 border-brand-500/30 text-brand-400' : 'bg-surface-800 border-surface-700 text-surface-300 hover:text-white hover:bg-surface-700'}`}
                title="Sort by Balance"
              >
                <ArrowDownUp size={18} className={sortOrder === 'desc' ? 'text-brand-400' : sortOrder === 'asc' ? 'text-brand-400 rotate-180 transition-transform' : ''} />
              </button>

              <button 
                onClick={handleFileUpload}
                disabled={loading}
                className="bg-surface-800 hover:bg-surface-700 border border-surface-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UploadCloud size={18} />}
                Import New
              </button>
            </div>

            {/* List */}
            <div className="space-y-4">
              {filteredWallets.length === 0 ? (
                <div className="text-center py-10 text-surface-500">
                  No wallets found matching your search.
                </div>
              ) : (
                filteredWallets.map((w, i) => (
                  <WalletCard 
                    key={i} 
                    wallet={w} 
                    onShowQR={(data, title, subtitle) => setQrModalData({ isOpen: true, data, title, subtitle })}
                    onSendFunds={(wallet) => setSendModalWallet(wallet)}
                  />
                ))
              )}
            </div>
          </>
        )}
      </main>

      <QRCodeModal 
        {...qrModalData} 
        onClose={() => setQrModalData({ ...qrModalData, isOpen: false })} 
      />

      {sendModalWallet && (
        <SendFundsModal 
          wallet={sendModalWallet} 
          onClose={() => setSendModalWallet(null)} 
        />
      )}
    </div>
  );
}

// Ensure ShieldAlert is imported if used
import { ShieldAlert } from 'lucide-react';
