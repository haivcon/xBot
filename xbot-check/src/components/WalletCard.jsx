import { useState, useEffect } from 'react';
import { Wallet, Key, Check, Copy, Eye, EyeOff, ChevronDown, ChevronUp, QrCode, Send, Pencil, Trash2, RefreshCw } from 'lucide-react';

const AUTO_HIDE_MS = 30000; // 30 seconds

export default function WalletCard({ wallet, onShowQR, onSendFunds, onDelete, onRename, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [showPk, setShowPk] = useState(false);
  const [showSeed, setShowSeed] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(wallet.name || '');
  const [refreshing, setRefreshing] = useState(false);

  // #1: Auto-hide PK after 30s
  useEffect(() => {
    if (!showPk) return;
    const t = setTimeout(() => setShowPk(false), AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [showPk]);

  // #1: Auto-hide Seed after 30s
  useEffect(() => {
    if (!showSeed) return;
    const t = setTimeout(() => setShowSeed(false), AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [showSeed]);

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // #7: token assets
  const tokens = wallet.tokenAssets || [];

  return (
    <div className="glass-card overflow-hidden border border-surface-700 hover:border-brand-500/30 transition-colors">
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer bg-surface-800/30 hover:bg-surface-800/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center flex-shrink-0">
            <Wallet size={20} className="text-brand-400" />
          </div>
          <div className="min-w-0">
            {editing ? (
              <input
                autoFocus
                className="bg-transparent border-b border-brand-500 text-white text-sm outline-none w-full"
                value={editName}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => { onRename(editName); setEditing(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { onRename(editName); setEditing(false); } }}
              />
            ) : (
              <h3 className="text-white font-medium truncate">{wallet.name || 'Unnamed Wallet'}</h3>
            )}
            <p className="text-surface-400 text-sm font-mono truncate">
              {wallet.address ? `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}` : 'No Address'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-white font-semibold">${wallet.balance || '0.00'}</p>
            <p className="text-xs text-surface-400">Balance</p>
          </div>
          {onRefresh && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                setRefreshing(true);
                try { await onRefresh(wallet); } finally { setRefreshing(false); }
              }}
              disabled={refreshing}
              className="p-1.5 rounded-full hover:bg-surface-700 text-surface-400 hover:text-brand-400 transition-colors disabled:opacity-50"
              title="Refresh balance"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          )}
          {expanded ? <ChevronUp size={20} className="text-surface-500" /> : <ChevronDown size={20} className="text-surface-500" />}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="p-4 border-t border-surface-700 bg-surface-900/50 space-y-4">

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button onClick={() => { setEditing(true); }} className="flex items-center gap-1 text-xs text-surface-400 hover:text-brand-400 bg-surface-800 px-3 py-1.5 rounded-lg transition-colors">
              <Pencil size={12} /> Rename
            </button>
            <button onClick={onDelete} className="flex items-center gap-1 text-xs text-surface-400 hover:text-red-400 bg-surface-800 px-3 py-1.5 rounded-lg transition-colors">
              <Trash2 size={12} /> Delete
            </button>
          </div>

          {/* #7: Token Assets List */}
          {tokens.length > 0 && (
            <div>
              <label className="text-xs text-surface-400 uppercase tracking-wider mb-2 block">Token Holdings</label>
              <div className="space-y-1">
                {tokens.map((tk, i) => (
                  <div key={i} className="flex items-center justify-between bg-surface-800/60 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      {tk.logoUrl ? (
                        <img src={tk.logoUrl} alt={tk.symbol} className="w-5 h-5 rounded-full" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-surface-600 flex items-center justify-center text-[10px] text-surface-300">{(tk.symbol || '?')[0]}</div>
                      )}
                      <span className="text-sm text-surface-200">{tk.symbol}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-white">{parseFloat(tk.balance || 0).toFixed(4)}</span>
                      {tk.usdValue && <span className="text-xs text-surface-500 ml-2">${parseFloat(tk.usdValue).toFixed(2)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              <label className="text-xs text-surface-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                Private Key
                {showPk && <span className="text-yellow-500/70 text-[10px] normal-case">(auto-hides in 30s)</span>}
              </label>
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
              <label className="text-xs text-surface-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                Seed Phrase
                {showSeed && <span className="text-yellow-500/70 text-[10px] normal-case">(auto-hides in 30s)</span>}
              </label>
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
