import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { 
  UploadCloud, 
  Wallet, 
  Key, 
  FileText, 
  Check, 
  Copy, 
  Search,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import { FilePicker } from '@capawesome/capacitor-file-picker';

export default function App() {
  const [wallets, setWallets] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleFileUpload = async () => {
    try {
      const result = await FilePicker.pickFiles({
        types: ['text/csv', 'text/comma-separated-values', 'application/csv', '.csv'],
        multiple: false,
        readData: true
      });

      if (result.files && result.files.length > 0) {
        const file = result.files[0];
        
        // Quick validation
        if (file.name && !file.name.toLowerCase().endsWith('.csv') && file.mimeType && !file.mimeType.includes('csv') && !file.mimeType.includes('excel')) {
            alert('Please select a valid CSV file.');
        }

        setLoading(true);
        
        // Decode base64 data to UTF-8 string safely
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
            alert('Error reading file data. Ensure it is a valid CSV text file.');
            setLoading(false);
            return;
        }

        Papa.parse(csvString, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const { data, meta } = results;
            setColumns(meta.fields || []);
            
            // Normalize keys slightly so we can easily find PK, Seed, Name, Address
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
      // User cancelled or error
      setLoading(false);
    }
  };

  const filteredWallets = wallets.filter(w => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (w.name && w.name.toLowerCase().includes(q)) ||
      (w.address && w.address.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen p-4 pb-12 flex flex-col items-center">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6 mt-4">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-500/20">
            <Wallet size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-surface-100">XBot Vault Reader</h1>
          <p className="text-sm text-surface-200/60 mt-1">Securely view your exported wallets offline</p>
        </div>

        {/* Upload Area */}
        {wallets.length === 0 ? (
          <div 
            onClick={handleFileUpload}
            className="glass-card border-dashed border-2 border-surface-200/20 hover:border-brand-500/50 cursor-pointer p-8 flex flex-col items-center justify-center transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-surface-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              {loading ? (
                <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <UploadCloud size={24} className="text-brand-400" />
              )}
            </div>
            <p className="text-base font-semibold text-surface-100 mb-1">Upload CSV File</p>
            <p className="text-xs text-surface-200/50 text-center">Tap to select the exported wallet file from XBot</p>
          </div>
        ) : (
          <>
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-200/40" />
              <input 
                type="text" 
                placeholder="Search by name or address..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-surface-800 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-surface-100 focus:outline-none focus:border-brand-500/50 transition-colors"
              />
              <button 
                onClick={() => setWallets([])}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-surface-700 hover:bg-surface-600 px-2 py-1 rounded text-surface-200"
              >
                Clear
              </button>
            </div>

            {/* List */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1 mb-2">
                <span className="text-xs font-semibold text-surface-200/40 uppercase tracking-wider">
                  {filteredWallets.length} Wallets Loaded
                </span>
              </div>
              
              {filteredWallets.map((wallet, idx) => (
                <WalletCard key={idx} wallet={wallet} columns={columns} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WalletCard({ wallet, columns }) {
  const [expanded, setExpanded] = useState(false);
  const [showPk, setShowPk] = useState(false);
  const [showSeed, setShowSeed] = useState(false);

  // Shorten address for header
  const shortAddr = (addr) => addr && addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

  return (
    <div className="glass-card overflow-hidden">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-800 border border-white/5 flex items-center justify-center flex-shrink-0">
            <Wallet size={16} className="text-brand-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-surface-100">{wallet.name || 'Unnamed Wallet'}</h3>
            {wallet.address && (
              <p className="text-xs text-surface-200/50 font-mono mt-0.5">{shortAddr(wallet.address)}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {wallet.balance && (
            <span className="text-xs font-bold text-emerald-400">{wallet.balance}</span>
          )}
          {expanded ? <ChevronUp size={16} className="text-surface-200/30" /> : <ChevronDown size={16} className="text-surface-200/30" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-3">
          {columns.map((col, i) => {
            const rawVal = wallet._raw[col];
            if (!rawVal) return null;
            
            const lowerCol = col.toLowerCase().trim();
            const isPk = lowerCol.includes('private') || lowerCol === 'pk';
            const isSeed = lowerCol.includes('seed') || lowerCol.includes('phrase');
            const isSensitive = isPk || isSeed;

            const isRevealed = (isPk && showPk) || (isSeed && showSeed);
            const displayVal = isSensitive && !isRevealed ? '••••••••••••••••••••••••••••••••••••••••••' : rawVal;

            const toggleReveal = () => {
              if (isPk) setShowPk(!showPk);
              if (isSeed) setShowSeed(!showSeed);
            };

            return (
              <div key={i} className="bg-surface-900/50 rounded-xl p-3 border border-white/[0.03]">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-semibold text-surface-200/40 uppercase tracking-wider">{col}</span>
                  <div className="flex gap-1.5">
                    {isSensitive && (
                      <CopyButton value={rawVal} />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex-1 text-xs font-mono break-all ${isSensitive && !isRevealed ? 'text-surface-200/30' : 'text-surface-100'}`}>
                    {displayVal}
                  </div>
                  {isSensitive ? (
                    <button 
                      onClick={toggleReveal}
                      className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-200/50 hover:text-surface-100 transition-colors"
                    >
                      {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  ) : (
                    <CopyButton value={rawVal} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className={`p-1.5 rounded-lg transition-colors flex items-center justify-center flex-shrink-0 ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand-500/10 hover:bg-brand-500/20 text-brand-400'}`}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}
