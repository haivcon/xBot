import { useState } from 'react';
import { Search, ArrowDownUp, CheckSquare, UploadCloud, Filter, Zap } from 'lucide-react';

const FILTER_OPTIONS = [
  { key: 'all', label: 'All Wallets' },
  { key: 'hasPk', label: 'Has Private Key' },
  { key: 'hasSeed', label: 'Has Seed Phrase' },
  { key: 'hasBalance', label: 'Balance > 0' },
  { key: 'empty', label: 'Balance = 0' },
];

export default function ActionBar({
  searchQuery, onSearchChange,
  sortOrder, onSortToggle,
  selectMode, onSelectToggle,
  onUpload, loading,
  activeFilter, onFilterChange,
  selectedCount, onSweep
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <>
      <div className="flex gap-2 mb-2 mt-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search by address or name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-surface-900 border border-surface-700 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder:text-surface-500"
          />
        </div>

        {/* #10: Filter */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex-shrink-0 border px-3 py-3 rounded-lg transition-colors flex items-center justify-center ${activeFilter !== 'all' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-surface-800 border-surface-700 text-surface-300 hover:text-white hover:bg-surface-700'}`}
          title="Filter"
        >
          <Filter size={18} />
        </button>

        <button
          onClick={onSortToggle}
          className={`flex-shrink-0 border px-3 py-3 rounded-lg transition-colors flex items-center justify-center ${sortOrder !== 'none' ? 'bg-brand-500/10 border-brand-500/30 text-brand-400' : 'bg-surface-800 border-surface-700 text-surface-300 hover:text-white hover:bg-surface-700'}`}
          title="Sort by Balance"
        >
          <ArrowDownUp size={18} />
        </button>

        <button
          onClick={onSelectToggle}
          className={`flex-shrink-0 border px-3 py-3 rounded-lg transition-colors flex items-center justify-center ${selectMode ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-surface-800 border-surface-700 text-surface-300 hover:text-white hover:bg-surface-700'}`}
          title="Select Mode"
        >
          <CheckSquare size={18} />
        </button>

        <button
          onClick={onUpload}
          disabled={loading}
          className="flex-shrink-0 bg-surface-800 hover:bg-surface-700 border border-surface-700 text-white px-3 py-3 rounded-lg transition-colors flex items-center justify-center"
        >
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UploadCloud size={18} />}
        </button>
      </div>

      {/* #10: Filter Dropdown */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-4 bg-surface-800/50 rounded-lg p-3 border border-surface-700">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => { onFilterChange(opt.key); setShowFilters(false); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeFilter === opt.key ? 'bg-cyan-500 text-white' : 'bg-surface-700 text-surface-300 hover:bg-surface-600'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Sweep Bar */}
      {selectMode && selectedCount > 0 && (
        <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
          <span className="text-sm text-yellow-400 font-medium">{selectedCount} wallets selected</span>
          <button
            onClick={onSweep}
            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Zap size={14} /> Sweep All
          </button>
        </div>
      )}
    </>
  );
}
