import { useState, useEffect, useCallback } from 'react';
import { List } from 'react-window';
import Papa from 'papaparse';
import {
  UploadCloud, ShieldAlert, BarChart3, Clock, Settings, RefreshCw, FileDown, Plus, CheckSquare, Square
} from 'lucide-react';
import { FilePicker } from '@capawesome/capacitor-file-picker';

// Components
import SettingsScreen from './components/SettingsScreen';
import QRCodeModal from './components/QRCodeModal';
import SendFundsModal from './components/SendFundsModal';
import SweepModal from './components/SweepModal';
import DashboardView from './components/DashboardView';
import HistoryView from './components/HistoryView';
import WalletCard from './components/WalletCard';
import AuthErrorScreen from './components/AuthErrorScreen';
import FolderTabs from './components/FolderTabs';
import ActionBar from './components/ActionBar';
import ExportCSVModal from './components/ExportCSVModal';
import CreateWalletModal from './components/CreateWalletModal';

// Utils & Hooks
import { saveWallets, loadWallets, loadApiConfig, saveApiConfig, getEncryptionKey, saveTxRecord } from './utils/storage';
import { exportVaultBackup, parseVaultBackupFile } from './utils/backupUtils';
import { fetchWalletBalances } from './utils/okxApi';
import useAutoLock from './hooks/useAutoLock';
import usePullToRefresh from './hooks/usePullToRefresh';
import { useToast } from './contexts/ToastContext';
import { useConfirm } from './contexts/ConfirmContext';

export default function App() {
  // Auth state
  const [aesKey, setAesKey] = useState(null);
  const [authError, setAuthError] = useState('');

  // Navigation
  const [currentView, setCurrentView] = useState('home');

  // Vault state
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState('All');
  const [sortOrder, setSortOrder] = useState('none');
  const [activeFilter, setActiveFilter] = useState('all');

  // Modals
  const [qrModalData, setQrModalData] = useState({ isOpen: false, data: '', title: '', subtitle: '' });
  const [sendModalWallet, setSendModalWallet] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedAddrs, setSelectedAddrs] = useState(new Set());
  const [showSweep, setShowSweep] = useState(false);
  const [showExportCSV, setShowExportCSV] = useState(false);
  const [showCreateWallet, setShowCreateWallet] = useState(false);

  // Folder editing
  const [editingFolder, setEditingFolder] = useState(null);
  const [editFolderName, setEditFolderName] = useState('');

  // Import password prompt for portable backups
  const [importPasswordPrompt, setImportPasswordPrompt] = useState(null);

  const { showToast } = useToast();
  const confirm = useConfirm();

  // #3: Auto-lock after 5min idle
  useAutoLock(() => {
    setAesKey(null);
    setCurrentView('home');
    window.location.reload();
  }, !!aesKey);

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

  // ─── File Upload (CSV / .xbot) ───
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
            let backup;
            try {
              backup = await parseVaultBackupFile(file.data, aesKey);
            } catch {
              // Device key failed — ask for password (#14)
              const password = prompt("This appears to be a portable backup. Enter your password:");
              if (!password) { setLoading(false); return; }
              backup = await parseVaultBackupFile(file.data, aesKey, password);
            }

            const newWallets = [...wallets, ...backup.wallets];
            setWallets(newWallets);
            await saveWallets(newWallets, aesKey);

            if (backup.config && backup.config.apiKey) {
              await saveApiConfig(backup.config, aesKey);
            }

            showToast(`Backup imported: ${backup.wallets.length} wallets`, 'success');
            setLoading(false);
            return;
          } catch (err) {
            showToast(err.message || "Failed to import backup", 'error');
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
          showToast('Error reading file data.', 'error');
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
            await saveWallets(newWallets, aesKey);
            showToast(`Imported ${normalizedData.length} wallets from ${folderName}`, 'success');
            setLoading(false);
          },
          error: (err) => {
            showToast('CSV parse error: ' + err.message, 'error');
            setLoading(false);
          }
        });
      }
    } catch (error) {
      console.error('FilePicker Error:', error);
      setLoading(false);
    }
  };

  // ─── Live Balance Sync ───
  const refreshLiveBalances = async () => {
    const config = await loadApiConfig(aesKey);
    if (!config.apiKey || !config.secretKey) {
      showToast('Please set your complete OKX API Key in Settings first.', 'warning');
      return;
    }
    setRefreshing(true);

    try {
      const currentWallets = [...wallets];
      let updatedCount = 0;

      const targetWallets = activeFolder === 'All'
        ? currentWallets
        : currentWallets.filter(w => (w.groupId || 'Imported') === activeFolder);

      for (let i = 0; i < targetWallets.length; i++) {
        const w = targetWallets[i];
        if (!w.address) continue;

        try {
          await new Promise(r => setTimeout(r, 200));
          const data = await fetchWalletBalances(w.address, config);

          if (data && data.totalUsdValue) {
            const originalIndex = currentWallets.findIndex(orig => orig.address === w.address);
            if (originalIndex !== -1) {
              currentWallets[originalIndex].balance = parseFloat(data.totalUsdValue).toFixed(2);
              // #7: Store token assets
              if (data.tokenAssets && data.tokenAssets.length > 0) {
                currentWallets[originalIndex].tokenAssets = data.tokenAssets;
              }
              updatedCount++;
            }
          }
        } catch (err) {
          console.error(`Failed to sync ${w.address}:`, err);
        }
      }

      if (updatedCount > 0) {
        setWallets([...currentWallets]);
        await saveWallets(currentWallets, aesKey);
        showToast(`Synced balances for ${updatedCount} wallets`, 'success');
      } else {
        showToast('No balances updated (rate limits or empty wallets)', 'info');
      }
    } catch (e) {
      showToast("Failed to run Live Sync: " + e.message, 'error');
    }
    setRefreshing(false);
  };

  // ─── Wallet Operations ───
  const handleWipe = () => {
    setWallets([]);
    setAesKey(null);
    setCurrentView('home');
    window.location.reload();
  };

  const handleDeleteWallet = async (walletToDelete) => {
    const ok = await confirm(`Delete wallet "${walletToDelete.name || walletToDelete.address?.substring(0, 10)}"?`);
    if (!ok) return;
    const updated = wallets.filter(w => w.address !== walletToDelete.address);
    setWallets(updated);
    await saveWallets(updated, aesKey);
    showToast('Wallet deleted', 'info');
  };

  const handleDeleteFolder = async (folderName) => {
    const ok = await confirm(`Delete all wallets in folder "${folderName}"?`, { danger: true });
    if (!ok) return;
    const updated = wallets.filter(w => (w.groupId || 'Imported') !== folderName);
    setWallets(updated);
    await saveWallets(updated, aesKey);
    setActiveFolder('All');
    showToast(`Folder "${folderName}" deleted`, 'info');
  };

  const handleRenameFolder = async (oldName, newName) => {
    if (!newName || newName === oldName) { setEditingFolder(null); return; }
    const updated = wallets.map(w => (w.groupId || 'Imported') === oldName ? { ...w, groupId: newName } : w);
    setWallets(updated);
    await saveWallets(updated, aesKey);
    setEditingFolder(null);
    if (activeFolder === oldName) setActiveFolder(newName);
  };

  const handleRenameWallet = async (wallet, newName) => {
    const updated = wallets.map(w => w.address === wallet.address ? { ...w, name: newName } : w);
    setWallets(updated);
    await saveWallets(updated, aesKey);
  };

  const toggleSelect = (addr) => {
    const next = new Set(selectedAddrs);
    next.has(addr) ? next.delete(addr) : next.add(addr);
    setSelectedAddrs(next);
  };

  const handleTxComplete = async (txData) => {
    await saveTxRecord(txData, aesKey);
  };

  // #6: Save newly created wallet
  const handleSaveNewWallet = async (newWallet) => {
    const folder = activeFolder !== 'All' ? activeFolder : 'Created';
    const walletWithGroup = { ...newWallet, groupId: folder };
    const updated = [...wallets, walletWithGroup];
    setWallets(updated);
    await saveWallets(updated, aesKey);
  };

  // #8: Pull-to-refresh
  const { handlers: pullHandlers } = usePullToRefresh(refreshLiveBalances);

  // ─── View Router ───
  if (authError) return <AuthErrorScreen error={authError} />;

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
  if (currentView === 'dashboard') {
    return <DashboardView wallets={wallets} onBack={() => setCurrentView('home')} />;
  }
  if (currentView === 'history') {
    return <HistoryView aesKey={aesKey} onBack={() => setCurrentView('home')} />;
  }

  // ─── Home View ───
  const folders = ['All', ...new Set(wallets.map(w => w.groupId || 'Imported'))];

  const filteredWallets = wallets.filter(w => {
    // Folder filter
    if (activeFolder !== 'All' && (w.groupId || 'Imported') !== activeFolder) return false;
    // Search filter
    const q = searchQuery.toLowerCase();
    const matchSearch = (w.name && w.name.toLowerCase().includes(q)) ||
      (w.address && w.address.toLowerCase().includes(q));
    if (!matchSearch) return false;
    // #10: Advanced filter
    if (activeFilter === 'hasPk') return !!w.privateKey;
    if (activeFilter === 'hasSeed') return !!w.seedPhrase;
    if (activeFilter === 'hasBalance') return (parseFloat(w.balance || 0) || 0) > 0;
    if (activeFilter === 'empty') return (parseFloat(w.balance || 0) || 0) === 0;
    return true;
  }).sort((a, b) => {
    if (sortOrder === 'none') return 0;
    const valA = parseFloat(a.balance || 0) || 0;
    const valB = parseFloat(b.balance || 0) || 0;
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  const totalBalance = filteredWallets.reduce((acc, w) => {
    const val = parseFloat(w.balance || 0);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  // #9: Row renderer for react-window
  const ROW_HEIGHT = 80;
  const Row = ({ index, style }) => {
    const w = filteredWallets[index];
    return (
      <div style={style} className="px-0 pb-3">
        <div className="flex items-start gap-2">
          {selectMode && (
            <button onClick={() => toggleSelect(w.address)} className="mt-5 flex-shrink-0">
              {selectedAddrs.has(w.address) ? <CheckSquare size={20} className="text-yellow-400" /> : <Square size={20} className="text-surface-500" />}
            </button>
          )}
          <div className="flex-1">
            <WalletCard
              wallet={w}
              onShowQR={(data, title, subtitle) => setQrModalData({ isOpen: true, data, title, subtitle })}
              onSendFunds={(wallet) => setSendModalWallet(wallet)}
              onDelete={() => handleDeleteWallet(w)}
              onRename={(newName) => handleRenameWallet(w, newName)}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-surface-950 text-surface-50 font-sans selection:bg-brand-500/30">

      {/* Header */}
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
          <div className="flex items-center gap-1">
            {wallets.length > 0 && (
              <>
                {/* #6: Create wallet */}
                <button onClick={() => setShowCreateWallet(true)} className="p-2 text-surface-400 hover:text-white bg-surface-800 hover:bg-surface-700 rounded-full transition-colors" title="Create Wallet">
                  <Plus size={18} />
                </button>
                {/* #4: Export CSV */}
                <button onClick={() => setShowExportCSV(true)} className="p-2 text-surface-400 hover:text-white bg-surface-800 hover:bg-surface-700 rounded-full transition-colors" title="Export CSV">
                  <FileDown size={18} />
                </button>
              </>
            )}
            <button onClick={() => setCurrentView('dashboard')} className="p-2 text-surface-400 hover:text-white bg-surface-800 hover:bg-surface-700 rounded-full transition-colors" title="Analytics">
              <BarChart3 size={18} />
            </button>
            <button onClick={() => setCurrentView('history')} className="p-2 text-surface-400 hover:text-white bg-surface-800 hover:bg-surface-700 rounded-full transition-colors" title="History">
              <Clock size={18} />
            </button>
            <button onClick={() => setCurrentView('settings')} className="p-2 text-surface-400 hover:text-white bg-surface-800 hover:bg-surface-700 rounded-full transition-colors" title="Settings">
              <Settings size={20} />
            </button>
          </div>
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

      <main className="p-4 max-w-2xl mx-auto pb-20" {...pullHandlers}>

        {wallets.length === 0 ? (
          <div className="space-y-4 mt-10">
            <div
              onClick={handleFileUpload}
              className="glass-card border-dashed border-2 border-surface-200/20 hover:border-brand-500/50 cursor-pointer p-8 flex flex-col items-center justify-center transition-all group"
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
                Your data will be encrypted and stored locally offline.
              </p>
            </div>
            <button
              onClick={() => setShowCreateWallet(true)}
              className="w-full glass-card border-dashed border-2 border-surface-200/20 hover:border-brand-500/50 cursor-pointer p-6 flex items-center justify-center gap-3 transition-all group"
            >
              <Plus size={24} className="text-brand-400 group-hover:scale-110 transition-transform" />
              <span className="text-white font-medium">Create New Wallet</span>
            </button>
          </div>
        ) : (
          <>
            <FolderTabs
              folders={folders} activeFolder={activeFolder} wallets={wallets}
              editingFolder={editingFolder} editFolderName={editFolderName}
              onSelectFolder={(f) => { setActiveFolder(f); setSelectedAddrs(new Set()); }}
              onStartEdit={(f) => { setEditingFolder(f); setEditFolderName(f); }}
              onEditChange={setEditFolderName}
              onFinishEdit={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
            />

            <ActionBar
              searchQuery={searchQuery} onSearchChange={setSearchQuery}
              sortOrder={sortOrder} onSortToggle={() => setSortOrder(prev => prev === 'none' ? 'desc' : prev === 'desc' ? 'asc' : 'none')}
              selectMode={selectMode} onSelectToggle={() => { setSelectMode(!selectMode); setSelectedAddrs(new Set()); }}
              onUpload={handleFileUpload} loading={loading}
              activeFilter={activeFilter} onFilterChange={setActiveFilter}
              selectedCount={selectedAddrs.size} onSweep={() => setShowSweep(true)}
            />

            {/* #9: Virtualized List for 100+ wallets, normal list otherwise */}
            <div className="space-y-3">
              {filteredWallets.length === 0 ? (
                <div className="text-center py-10 text-surface-500">
                  No wallets found matching your criteria.
                </div>
              ) : filteredWallets.length > 100 ? (
                <List
                  height={600}
                  itemCount={filteredWallets.length}
                  itemSize={() => ROW_HEIGHT}
                  width="100%"
                  className="custom-scrollbar"
                >
                  {Row}
                </List>
              ) : (
                filteredWallets.map((w, i) => (
                  <div key={w.address || i} className="flex items-start gap-2">
                    {selectMode && (
                      <button onClick={() => toggleSelect(w.address)} className="mt-5 flex-shrink-0">
                        {selectedAddrs.has(w.address) ? <CheckSquare size={20} className="text-yellow-400" /> : <Square size={20} className="text-surface-500" />}
                      </button>
                    )}
                    <div className="flex-1">
                      <WalletCard
                        wallet={w}
                        onShowQR={(data, title, subtitle) => setQrModalData({ isOpen: true, data, title, subtitle })}
                        onSendFunds={(wallet) => setSendModalWallet(wallet)}
                        onDelete={() => handleDeleteWallet(w)}
                        onRename={(newName) => handleRenameWallet(w, newName)}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>

      {/* Modals */}
      <QRCodeModal
        {...qrModalData}
        onClose={() => setQrModalData({ ...qrModalData, isOpen: false })}
      />

      {sendModalWallet && (
        <SendFundsModal
          wallet={sendModalWallet}
          onClose={() => setSendModalWallet(null)}
          onTxComplete={handleTxComplete}
        />
      )}

      {showSweep && (
        <SweepModal
          selectedWallets={filteredWallets.filter(w => selectedAddrs.has(w.address))}
          onClose={() => { setShowSweep(false); setSelectMode(false); setSelectedAddrs(new Set()); }}
          onTxComplete={handleTxComplete}
        />
      )}

      {showExportCSV && (
        <ExportCSVModal
          wallets={filteredWallets}
          onClose={() => setShowExportCSV(false)}
        />
      )}

      {showCreateWallet && (
        <CreateWalletModal
          onClose={() => setShowCreateWallet(false)}
          onSave={handleSaveNewWallet}
          onShowQR={(data, title, subtitle) => setQrModalData({ isOpen: true, data, title, subtitle })}
        />
      )}
    </div>
  );
}
