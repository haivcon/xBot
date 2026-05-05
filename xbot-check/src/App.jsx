import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { 
  UploadCloud, Wallet, Key, FileText, Check, Copy, Search, Eye, EyeOff, ChevronDown, ChevronUp, QrCode, Settings, RefreshCw
} from 'lucide-react';
import { FilePicker } from '@capawesome/capacitor-file-picker';

import LockScreen from './components/LockScreen';
import SettingsScreen from './components/SettingsScreen';
import QRCodeModal from './components/QRCodeModal';
import { saveWallets, loadWallets, loadApiKey } from './utils/storage';

function WalletCard({ wallet, onShowQR }) {
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
              {wallet.balance || '0.00'}
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
  const [masterPin, setMasterPin] = useState(null);
  const [currentView, setCurrentView] = useState('home'); // 'home', 'settings'
  
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [qrModalData, setQrModalData] = useState({ isOpen: false, data: '', title: '', subtitle: '' });

  // On Unlock, load data
  useEffect(() => {
    if (masterPin) {
      loadWallets(masterPin).then(savedWallets => {
        if (savedWallets && savedWallets.length > 0) {
          setWallets(savedWallets);
        }
      });
    }
  }, [masterPin]);

  const handleFileUpload = async () => {
    try {
      const result = await FilePicker.pickFiles({
        types: ['text/csv', 'text/comma-separated-values', 'application/csv', '.csv'],
        multiple: false,
        readData: true
      });

      if (result.files && result.files.length > 0) {
        const file = result.files[0];
        setLoading(true);
        
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
            const normalizedData = data.map(row => {
              const normalizedRow = { _raw: row };
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

            setWallets(normalizedData);
            await saveWallets(normalizedData, masterPin); // Save to secure storage
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
    const apiKey = await loadApiKey(masterPin);
    if (!apiKey) {
      alert('Please set your OKX API Key in Settings first.');
      return;
    }
    setRefreshing(true);
    
    // Simulating API call since exact OKX Web3 API endpoint wasn't specified.
    // In production, you would fetch from OKX API here and update wallet balances.
    setTimeout(() => {
      alert(`Simulated live fetch with API Key ending in ...${apiKey.slice(-4)}\nImplement exact OKX API endpoint here.`);
      setRefreshing(false);
    }, 1500);
  };

  const handleWipe = () => {
    setWallets([]);
    setMasterPin(null);
    setCurrentView('home');
  };

  // Views Orchestration
  if (!masterPin) {
    return <LockScreen onUnlock={(pin) => setMasterPin(pin)} />;
  }

  if (currentView === 'settings') {
    return <SettingsScreen masterPin={masterPin} onBack={() => setCurrentView('home')} onWipe={handleWipe} />;
  }

  // Home Vault View
  const filteredWallets = wallets.filter(w => {
    const q = searchQuery.toLowerCase();
    return (w.name && w.name.toLowerCase().includes(q)) || 
           (w.address && w.address.toLowerCase().includes(q));
  });

  // Calculate Total Balance (assuming numeric balances)
  const totalBalance = wallets.reduce((acc, w) => {
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
    </div>
  );
}

// Ensure ShieldAlert is imported if used
import { ShieldAlert } from 'lucide-react';
