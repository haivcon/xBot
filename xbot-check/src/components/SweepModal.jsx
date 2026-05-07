import { useState } from 'react';
import { X, Zap, AlertTriangle, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { ethers } from 'ethers';
import { reauthenticate } from '../hooks/useReauth';
import { useToast } from '../contexts/ToastContext';

const NETWORKS = [
  { name: 'X Layer Mainnet', rpc: 'https://rpc.xlayer.tech', chainId: 196, symbol: 'OKB' },
  { name: 'Ethereum Mainnet', rpc: 'https://eth.llamarpc.com', chainId: 1, symbol: 'ETH' },
  { name: 'BNB Smart Chain', rpc: 'https://bsc-dataseed.binance.org', chainId: 56, symbol: 'BNB' },
  { name: 'Arbitrum One', rpc: 'https://arb1.arbitrum.io/rpc', chainId: 42161, symbol: 'ETH' }
];

// #5: Common ERC-20 tokens per chain
const ERC20_TOKENS = {
  1:   [{ symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' }, { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' }],
  56:  [{ symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955' }, { symbol: 'USDC', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' }],
  196: [{ symbol: 'USDT', address: '0x1E4a5963aBFD975d8c9021ce480b42188849D41d' }],
  42161: [{ symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' }, { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' }],
};

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

export default function SweepModal({ selectedWallets, onClose, onTxComplete }) {
  const [network, setNetwork] = useState(NETWORKS[0]);
  const [toAddress, setToAddress] = useState('');
  const [sweeping, setSweeping] = useState(false);
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(false);
  // #5: Token mode
  const [sweepMode, setSweepMode] = useState('native'); // 'native' | 'erc20'
  const [selectedToken, setSelectedToken] = useState('');
  const [customTokenAddr, setCustomTokenAddr] = useState('');
  const { showToast } = useToast();

  const getTokenAddress = () => {
    if (selectedToken === 'custom') return customTokenAddr;
    const tokens = ERC20_TOKENS[network.chainId] || [];
    return tokens.find(t => t.symbol === selectedToken)?.address || '';
  };

  const handleSweep = async () => {
    if (!toAddress || !ethers.isAddress(toAddress)) {
      showToast('Please enter a valid destination address', 'error');
      return;
    }
    if (sweepMode === 'erc20' && !ethers.isAddress(getTokenAddress())) {
      showToast('Please select or enter a valid ERC-20 token address', 'error');
      return;
    }

    // #2: Re-authenticate before executing
    const authed = await reauthenticate('Authenticate to execute batch sweep');
    if (!authed) {
      showToast('Authentication required to sweep', 'warning');
      return;
    }

    const walletsWithPK = selectedWallets.filter(w => w.privateKey);
    if (walletsWithPK.length === 0) {
      showToast('None of the selected wallets have a Private Key', 'error');
      return;
    }

    setSweeping(true);
    const provider = new ethers.JsonRpcProvider(network.rpc);
    const txResults = [];

    for (const w of walletsWithPK) {
      try {
        const signer = new ethers.Wallet(w.privateKey, provider);

        if (sweepMode === 'erc20') {
          // #5: ERC-20 sweep
          const tokenAddr = getTokenAddress();
          const contract = new ethers.Contract(tokenAddr, ERC20_ABI, signer);
          const balance = await contract.balanceOf(signer.address);

          if (balance === 0n) {
            txResults.push({ address: w.address, status: 'skip', error: 'Zero token balance' });
            setResults([...txResults]);
            continue;
          }

          const tx = await contract.transfer(toAddress, balance);
          const decimals = await contract.decimals().catch(() => 18);

          txResults.push({
            address: w.address, status: 'success', hash: tx.hash,
            amount: ethers.formatUnits(balance, decimals)
          });

          if (onTxComplete) {
            onTxComplete({
              hash: tx.hash, from: w.address, to: toAddress,
              amount: ethers.formatUnits(balance, decimals),
              symbol: selectedToken === 'custom' ? 'ERC20' : selectedToken,
              network: network.name, chainId: network.chainId,
              status: 'success', timestamp: Date.now(), type: 'sweep-erc20'
            });
          }
        } else {
          // Native sweep (existing logic)
          const balance = await provider.getBalance(signer.address);
          const gasPrice = (await provider.getFeeData()).gasPrice || ethers.parseUnits('5', 'gwei');
          const gasLimit = 21000n;
          const gasCost = gasPrice * gasLimit;

          if (balance <= gasCost) {
            txResults.push({ address: w.address, status: 'skip', error: 'Insufficient for gas' });
            setResults([...txResults]);
            continue;
          }

          const sweepAmount = balance - gasCost;
          const tx = await signer.sendTransaction({ to: toAddress, value: sweepAmount, gasLimit });

          txResults.push({
            address: w.address, status: 'success', hash: tx.hash,
            amount: ethers.formatEther(sweepAmount)
          });

          if (onTxComplete) {
            onTxComplete({
              hash: tx.hash, from: w.address, to: toAddress,
              amount: ethers.formatEther(sweepAmount), symbol: network.symbol,
              network: network.name, chainId: network.chainId,
              status: 'success', timestamp: Date.now(), type: 'sweep'
            });
          }
        }
      } catch (err) {
        txResults.push({ address: w.address, status: 'error', error: err.reason || err.message });
      }
      setResults([...txResults]);
      await new Promise(r => setTimeout(r, 300));
    }

    setDone(true);
    setSweeping(false);
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const skipCount = results.filter(r => r.status === 'skip').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const availableTokens = ERC20_TOKENS[network.chainId] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-900 border border-surface-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between p-4 border-b border-surface-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap size={18} className="text-yellow-400" />
            Batch Sweep ({selectedWallets.filter(w => w.privateKey).length} wallets)
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-800 rounded-full transition-colors text-surface-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">

          {!done && (
            <>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Network</label>
                <select
                  value={network.chainId}
                  onChange={(e) => { setNetwork(NETWORKS.find(n => n.chainId === parseInt(e.target.value))); setSelectedToken(''); }}
                  disabled={sweeping}
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  {NETWORKS.map(n => <option key={n.chainId} value={n.chainId}>{n.name}</option>)}
                </select>
              </div>

              {/* #5: Sweep Mode */}
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Token Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSweepMode('native')}
                    disabled={sweeping}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${sweepMode === 'native' ? 'bg-brand-500 text-white' : 'bg-surface-800 text-surface-400 hover:bg-surface-700'}`}
                  >
                    Native ({network.symbol})
                  </button>
                  <button
                    onClick={() => setSweepMode('erc20')}
                    disabled={sweeping}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${sweepMode === 'erc20' ? 'bg-brand-500 text-white' : 'bg-surface-800 text-surface-400 hover:bg-surface-700'}`}
                  >
                    ERC-20 Token
                  </button>
                </div>
              </div>

              {/* #5: ERC-20 Token Selector */}
              {sweepMode === 'erc20' && (
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1">Select Token</label>
                  <select
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                    disabled={sweeping}
                    className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Select --</option>
                    {availableTokens.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                    <option value="custom">Custom Address</option>
                  </select>
                  {selectedToken === 'custom' && (
                    <input
                      type="text" placeholder="0x... (token contract)"
                      value={customTokenAddr}
                      onChange={(e) => setCustomTokenAddr(e.target.value)}
                      disabled={sweeping}
                      className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-3 text-sm text-white font-mono placeholder:text-surface-600 focus:outline-none focus:border-brand-500 mt-2"
                    />
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Destination Address</label>
                <input
                  type="text" placeholder="0x..." value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  disabled={sweeping}
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-3 text-sm text-white font-mono placeholder:text-surface-600 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex gap-3">
                <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-500/80 leading-relaxed">
                  This will sweep the <strong>entire {sweepMode === 'erc20' ? 'token' : 'native'} balance</strong> {sweepMode === 'native' ? '(minus gas)' : ''} from each selected wallet. This is irreversible.
                </p>
              </div>
            </>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-surface-400 font-medium">
                Progress: {results.length}/{selectedWallets.filter(w => w.privateKey).length}
                {done && ` — ✓${successCount} ⊘${skipCount} ✗${errorCount}`}
              </p>
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs bg-surface-800/50 p-2 rounded-lg">
                  {r.status === 'success' && <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />}
                  {r.status === 'error' && <XCircle size={14} className="text-red-400 flex-shrink-0" />}
                  {r.status === 'skip' && <AlertTriangle size={14} className="text-yellow-500 flex-shrink-0" />}
                  <span className="text-surface-300 font-mono truncate">{r.address?.substring(0, 10)}...</span>
                  {r.amount && <span className="text-green-400 ml-auto">{parseFloat(r.amount).toFixed(6)}</span>}
                  {r.error && <span className="text-red-400/70 ml-auto truncate max-w-[150px]">{r.error}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-surface-800">
          {done ? (
            <button onClick={onClose} className="w-full bg-surface-800 hover:bg-surface-700 text-white font-medium py-3 rounded-lg transition-colors">
              Close
            </button>
          ) : (
            <button
              onClick={handleSweep}
              disabled={sweeping}
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-semibold py-3 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sweeping ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
              {sweeping ? `Sweeping... (${results.length}/${selectedWallets.filter(w => w.privateKey).length})` : `Sweep All to Destination`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
