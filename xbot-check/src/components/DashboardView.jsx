import { ArrowLeft, Wallet, TrendingUp, AlertCircle, FolderOpen } from 'lucide-react';

export default function DashboardView({ wallets, onBack }) {
    // Folder distribution
    const folderMap = {};
    wallets.forEach(w => {
        const g = w.groupId || 'Imported';
        if (!folderMap[g]) folderMap[g] = { count: 0, total: 0 };
        folderMap[g].count++;
        folderMap[g].total += parseFloat(w.balance || 0) || 0;
    });
    const folderEntries = Object.entries(folderMap).sort((a, b) => b[1].total - a[1].total);

    const totalBalance = wallets.reduce((s, w) => s + (parseFloat(w.balance || 0) || 0), 0);
    const activeWallets = wallets.filter(w => (parseFloat(w.balance || 0) || 0) > 0).length;
    const emptyWallets = wallets.length - activeWallets;
    const walletsWithPK = wallets.filter(w => w.privateKey).length;

    // Simple pie chart with CSS conic-gradient
    const colors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#22c55e', '#ec4899', '#6366f1', '#14b8a6'];
    let gradientParts = [];
    let offset = 0;
    folderEntries.forEach(([name, data], i) => {
        const pct = totalBalance > 0 ? (data.total / totalBalance) * 100 : (100 / folderEntries.length);
        const color = colors[i % colors.length];
        gradientParts.push(`${color} ${offset}% ${offset + pct}%`);
        offset += pct;
    });
    const pieGradient = gradientParts.length > 0 
        ? `conic-gradient(${gradientParts.join(', ')})`
        : 'conic-gradient(#374151 0% 100%)';

    return (
        <div className="min-h-screen bg-surface-900 text-surface-50 p-4 pb-10">
            <header className="flex items-center justify-between mb-6 sticky top-0 bg-surface-900/80 backdrop-blur-md py-4 z-10">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-surface-800 transition-colors">
                    <ArrowLeft size={24} className="text-surface-300" />
                </button>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-surface-400">
                    Analytics
                </h1>
                <div className="w-10"></div>
            </header>

            <div className="max-w-xl mx-auto space-y-6">

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="glass-card p-4 border border-surface-700">
                        <div className="flex items-center gap-2 mb-2">
                            <Wallet size={16} className="text-brand-400" />
                            <span className="text-xs text-surface-400">Total Wallets</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{wallets.length}</p>
                    </div>
                    <div className="glass-card p-4 border border-surface-700">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp size={16} className="text-green-400" />
                            <span className="text-xs text-surface-400">Active (Balance {'>'} 0)</span>
                        </div>
                        <p className="text-2xl font-bold text-green-400">{activeWallets}</p>
                    </div>
                    <div className="glass-card p-4 border border-surface-700">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle size={16} className="text-surface-500" />
                            <span className="text-xs text-surface-400">Empty Wallets</span>
                        </div>
                        <p className="text-2xl font-bold text-surface-400">{emptyWallets}</p>
                    </div>
                    <div className="glass-card p-4 border border-surface-700">
                        <div className="flex items-center gap-2 mb-2">
                            <FolderOpen size={16} className="text-cyan-400" />
                            <span className="text-xs text-surface-400">With Private Key</span>
                        </div>
                        <p className="text-2xl font-bold text-cyan-400">{walletsWithPK}</p>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="glass-card p-6 border border-surface-700">
                    <h3 className="text-white font-semibold mb-4">Asset Distribution by Folder</h3>
                    <div className="flex items-center gap-6">
                        <div 
                            className="w-28 h-28 rounded-full flex-shrink-0"
                            style={{ background: pieGradient }}
                        >
                            <div className="w-full h-full rounded-full flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-surface-900 flex items-center justify-center">
                                    <span className="text-xs text-surface-400 font-medium">{folderEntries.length} folders</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 space-y-2 overflow-hidden">
                            {folderEntries.map(([name, data], i) => (
                                <div key={name} className="flex items-center gap-2 text-sm">
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }}></div>
                                    <span className="text-surface-300 truncate flex-1">{name}</span>
                                    <span className="text-surface-500 text-xs flex-shrink-0">{data.count}w</span>
                                    <span className="text-white font-medium text-xs flex-shrink-0">${data.total.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Total */}
                <div className="glass-card p-6 border border-brand-500/20 bg-brand-500/5">
                    <p className="text-surface-400 text-xs uppercase tracking-wider mb-1">Total Vault Value</p>
                    <p className="text-3xl font-bold text-white">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</p>
                </div>
            </div>
        </div>
    );
}
