import { useState, useMemo } from 'react';
import { X, Link2, Wand2, Check, ChevronDown } from 'lucide-react';
import { useT } from '../contexts/LanguageContext';
import { hapticTap, hapticSuccess } from '../utils/haptics';

const NETWORKS = ['ETH', 'BSC', 'Polygon', 'Arbitrum', 'Optimism', 'Solana', 'Tron', 'Base'];

const NETWORK_COLORS = {
  ETH: 'text-blue-400 bg-blue-500/15',
  BSC: 'text-yellow-400 bg-yellow-500/15',
  Polygon: 'text-purple-400 bg-purple-500/15',
  Arbitrum: 'text-sky-400 bg-sky-500/15',
  Optimism: 'text-red-400 bg-red-500/15',
  Solana: 'text-green-400 bg-green-500/15',
  Tron: 'text-red-300 bg-red-600/15',
  Base: 'text-blue-300 bg-blue-600/15',
};

/**
 * Auto-detect chain from address format
 */
function detectChain(address) {
  if (!address) return null;
  const a = address.trim();
  // Tron: starts with T, 34 chars base58
  if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(a)) return 'Tron';
  // Solana: base58, 32-44 chars, no 0x prefix
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a) && !a.startsWith('0x')) return 'Solana';
  // EVM: 0x + 40 hex chars → can't distinguish ETH/BSC/etc, return 'EVM'
  if (/^0x[a-fA-F0-9]{40}$/.test(a)) return 'EVM';
  return null;
}

export default function ChainBulkModal({ wallets, onApply, onClose }) {
  const t = useT();
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [targetChain, setTargetChain] = useState('ETH');
  const [mode, setMode] = useState('manual'); // 'manual' | 'auto'
  const [filterChain, setFilterChain] = useState('all');

  const filteredWallets = useMemo(() => {
    if (filterChain === 'all') return wallets;
    return wallets.filter(w => (w.network || 'ETH') === filterChain);
  }, [wallets, filterChain]);

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
    hapticTap();
  };

  const selectAll = () => {
    if (selectedIds.size === filteredWallets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredWallets.map(w => w._id)));
    }
    hapticTap();
  };

  const handleApplyManual = () => {
    if (selectedIds.size === 0) return;
    onApply(Array.from(selectedIds), targetChain);
    hapticSuccess();
    onClose();
  };

  const handleAutoDetect = () => {
    const updates = [];
    wallets.forEach(w => {
      const detected = detectChain(w.address);
      if (detected && detected !== 'EVM') {
        updates.push({ id: w._id, chain: detected });
      }
    });
    if (updates.length > 0) {
      updates.forEach(u => onApply([u.id], u.chain));
      hapticSuccess();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-900 border border-surface-700 w-full max-w-md rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-800">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Link2 size={18} className="text-brand-400" />
            {t('chainBulk.title')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-800 rounded-full transition-colors text-surface-400">
            <X size={20} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-surface-800">
          <button onClick={() => setMode('manual')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'manual' ? 'text-brand-400 border-b-2 border-brand-400' : 'text-surface-500 hover:text-surface-300'}`}>
            {t('chainBulk.manualMode')}
          </button>
          <button onClick={() => setMode('auto')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${mode === 'auto' ? 'text-brand-400 border-b-2 border-brand-400' : 'text-surface-500 hover:text-surface-300'}`}>
            <Wand2 size={14} /> {t('chainBulk.autoMode')}
          </button>
        </div>

        {mode === 'manual' ? (
          <>
            {/* Target Chain */}
            <div className="px-4 pt-4 pb-2">
              <label className="text-xs text-surface-400 mb-2 block">{t('chainBulk.targetChain')}</label>
              <div className="flex flex-wrap gap-1.5">
                {NETWORKS.map(n => (
                  <button key={n} onClick={() => { setTargetChain(n); hapticTap(); }}
                    className={`text-[11px] px-2.5 py-1.5 rounded-full font-medium transition-all
                      ${targetChain === n ? `${NETWORK_COLORS[n]} ring-1 ring-current` : 'bg-surface-800 text-surface-400 hover:text-white'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter */}
            <div className="px-4 pb-2 flex items-center gap-2">
              <span className="text-xs text-surface-500">{t('chainBulk.filterBy')}:</span>
              <select value={filterChain} onChange={e => setFilterChain(e.target.value)}
                className="bg-surface-800 border border-surface-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none">
                <option value="all">{t('chainBulk.allWallets')}</option>
                {NETWORKS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <button onClick={selectAll} className="ml-auto text-xs text-brand-400 hover:text-brand-300">
                {selectedIds.size === filteredWallets.length ? t('chainBulk.deselectAll') : t('chainBulk.selectAll')}
              </button>
            </div>

            {/* Wallet List */}
            <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-1 min-h-0">
              {filteredWallets.map(w => {
                const selected = selectedIds.has(w._id);
                const nc = NETWORK_COLORS[w.network || 'ETH'];
                return (
                  <button key={w._id} onClick={() => toggleSelect(w._id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm
                      ${selected ? 'bg-brand-500/10 border border-brand-500/30' : 'bg-surface-800/50 border border-transparent hover:bg-surface-800'}`}>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0
                      ${selected ? 'bg-brand-500' : 'bg-surface-700 border border-surface-600'}`}>
                      {selected && <Check size={12} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-white truncate block">{w.name || w.address?.substring(0, 12) || 'Unnamed'}</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${nc}`}>
                      {w.network || 'ETH'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Apply */}
            <div className="p-4 border-t border-surface-800">
              <button onClick={handleApplyManual} disabled={selectedIds.size === 0}
                className="btn-glow btn-glow-success w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                <Check size={16} />
                {t('chainBulk.apply', { count: selectedIds.size, chain: targetChain })}
              </button>
            </div>
          </>
        ) : (
          /* Auto-detect mode */
          <div className="p-6 space-y-4">
            <div className="glass-card p-4 border border-surface-700 space-y-3">
              <p className="text-sm text-surface-300 leading-relaxed">{t('chainBulk.autoDesc')}</p>
              <div className="space-y-1.5 text-xs text-surface-400">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400" /> <code>T...</code> → Tron</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400" /> <code>Base58 (32-44)</code> → Solana</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400" /> <code>0x...</code> → EVM ({t('chainBulk.evmNote')})</div>
              </div>
            </div>
            <button onClick={handleAutoDetect}
              className="btn-glow btn-glow-success w-full bg-brand-600 hover:bg-brand-500 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2">
              <Wand2 size={16} />
              {t('chainBulk.runAutoDetect')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
