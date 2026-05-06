import { useState } from 'react';
import { X, Send, AlertTriangle, Loader2 } from 'lucide-react';
import { ethers } from 'ethers';

const NETWORKS = [
  { name: 'X Layer Mainnet', rpc: 'https://rpc.xlayer.tech', chainId: 196, symbol: 'OKB' },
  { name: 'Ethereum Mainnet', rpc: 'https://eth.llamarpc.com', chainId: 1, symbol: 'ETH' },
  { name: 'BNB Smart Chain', rpc: 'https://bsc-dataseed.binance.org', chainId: 56, symbol: 'BNB' },
  { name: 'Arbitrum One', rpc: 'https://arb1.arbitrum.io/rpc', chainId: 42161, symbol: 'ETH' }
];

export default function SendFundsModal({ wallet, onClose, onTxComplete }) {
  const [network, setNetwork] = useState(NETWORKS[0]);
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');

  const handleSend = async () => {
    setError('');
    setTxHash('');

    if (!toAddress || !amount) {
      setError("Please fill in both address and amount.");
      return;
    }

    if (!ethers.isAddress(toAddress)) {
      setError("Invalid destination address.");
      return;
    }

    if (!wallet.privateKey) {
      setError("This wallet has no private key available.");
      return;
    }

    setLoading(true);

    try {
      // Create Provider
      const provider = new ethers.JsonRpcProvider(network.rpc);
      
      // Create Wallet Signer
      const signer = new ethers.Wallet(wallet.privateKey, provider);

      // Parse amount
      const parsedAmount = ethers.parseEther(amount.toString());

      // Construct and Send Transaction
      // Ethers v6 automatically calculates gasPrice vs maxFeePerGas based on network support
      const tx = await signer.sendTransaction({
        to: toAddress,
        value: parsedAmount
      });

      setTxHash(tx.hash);
      
      // Record to history
      if (onTxComplete) {
        onTxComplete({
          hash: tx.hash,
          from: wallet.address,
          to: toAddress,
          amount,
          symbol: network.symbol,
          network: network.name,
          chainId: network.chainId,
          status: 'success',
          timestamp: Date.now(),
          type: 'send'
        });
      }

    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || "Transaction failed");
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-900 border border-surface-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-800 bg-surface-900/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Send size={18} className="text-brand-400" />
            Send Funds
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-800 rounded-full transition-colors text-surface-400">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Network Selector */}
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1">Network</label>
            <select 
              value={network.chainId}
              onChange={(e) => setNetwork(NETWORKS.find(n => n.chainId === parseInt(e.target.value)))}
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              {NETWORKS.map(n => (
                <option key={n.chainId} value={n.chainId}>{n.name}</option>
              ))}
            </select>
          </div>

          {/* Destination */}
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1">To Address</label>
            <input 
              type="text" 
              placeholder="0x..." 
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-3 text-sm text-white font-mono placeholder:text-surface-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1">Amount ({network.symbol})</label>
            <div className="relative">
              <input 
                type="number" 
                placeholder="0.0" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-3 text-sm text-white font-mono placeholder:text-surface-600 focus:outline-none focus:border-brand-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-500 font-medium">
                {network.symbol}
              </span>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex gap-3">
            <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-500/80 leading-relaxed">
              This will sign the transaction locally on your device and broadcast it to the network. Please double check the address. This action is irreversible.
            </p>
          </div>

          {/* Error / Success Status */}
          {error && <div className="text-xs text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</div>}
          
          {txHash && (
            <div className="text-xs text-green-400 bg-green-400/10 p-3 rounded-lg border border-green-400/20">
              Transaction Broadcasted!<br/>
              <span className="text-surface-400 font-mono mt-1 break-all select-all block">Tx: {txHash}</span>
            </div>
          )}

          {/* Action Button */}
          <button 
            onClick={handleSend}
            disabled={loading || txHash}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 px-4 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {loading ? 'Signing & Broadcasting...' : 'Sign & Send'}
          </button>

        </div>
      </div>
    </div>
  );
}
