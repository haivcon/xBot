import { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { loadTxHistory } from '../utils/storage';

const EXPLORERS = {
  1: 'https://etherscan.io/tx/',
  56: 'https://bscscan.com/tx/',
  196: 'https://www.okx.com/explorer/xlayer/tx/',
  42161: 'https://arbiscan.io/tx/'
};

export default function HistoryView({ aesKey, onBack }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await loadTxHistory(aesKey);
            setHistory(data);
            setLoading(false);
        };
        load();
    }, [aesKey]);

    const openExplorer = (tx) => {
        const base = EXPLORERS[tx.chainId] || EXPLORERS[196];
        window.open(base + tx.hash, '_blank');
    };

    const formatTime = (ts) => {
        const d = new Date(ts);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-surface-900 text-surface-50 p-4 pb-10">
            <header className="flex items-center justify-between mb-6 sticky top-0 bg-surface-900/80 backdrop-blur-md py-4 z-10">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-surface-800 transition-colors">
                    <ArrowLeft size={24} className="text-surface-300" />
                </button>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-surface-400">
                    Transaction History
                </h1>
                <div className="w-10"></div>
            </header>

            <div className="max-w-xl mx-auto space-y-3">
                {history.length === 0 ? (
                    <div className="text-center py-16 text-surface-500">
                        <p className="text-lg mb-2">No transactions yet</p>
                        <p className="text-sm">Transactions signed via the vault will appear here.</p>
                    </div>
                ) : (
                    history.map((tx, i) => (
                        <div key={i} className="glass-card p-4 border border-surface-700">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.status === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                        <ArrowUpRight size={16} className={tx.status === 'success' ? 'text-green-400' : 'text-red-400'} />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">Send {tx.amount} {tx.symbol}</p>
                                        <p className="text-surface-500 text-xs">{tx.network}</p>
                                    </div>
                                </div>
                                <p className="text-surface-500 text-xs">{formatTime(tx.timestamp)}</p>
                            </div>
                            
                            <div className="space-y-1 text-xs">
                                <div className="flex gap-2">
                                    <span className="text-surface-500 w-10">From</span>
                                    <span className="text-surface-300 font-mono truncate">{tx.from}</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-surface-500 w-10">To</span>
                                    <span className="text-surface-300 font-mono truncate">{tx.to}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => openExplorer(tx)}
                                className="mt-3 flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                            >
                                <ExternalLink size={12} />
                                View on Explorer
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
