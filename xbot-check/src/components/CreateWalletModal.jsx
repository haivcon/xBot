import { useState } from 'react';
import { X, Plus, Copy, Check, QrCode, Wallet, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';
import { useToast } from '../contexts/ToastContext';

export default function CreateWalletModal({ onClose, onSave, onShowQR }) {
  const [wallet, setWallet] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [walletName, setWalletName] = useState('');
  const { showToast } = useToast();

  const generateWallet = () => {
    const w = ethers.Wallet.createRandom();
    setWallet({
      address: w.address,
      privateKey: w.privateKey,
      mnemonic: w.mnemonic?.phrase || '',
    });
    setWalletName(`Wallet ${Date.now().toString(36).slice(-4).toUpperCase()}`);
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = () => {
    if (!wallet) return;
    onSave({
      name: walletName || 'New Wallet',
      address: wallet.address,
      privateKey: wallet.privateKey,
      seedPhrase: wallet.mnemonic,
      balance: '0.00'
    });
    showToast('Wallet created and saved to vault', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-900 border border-surface-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-surface-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus size={18} className="text-brand-400" />
            Create New Wallet
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-800 rounded-full transition-colors text-surface-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {!wallet ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet size={32} className="text-brand-400" />
              </div>
              <p className="text-surface-400 text-sm mb-6">
                Generate a brand new wallet with a secure random private key and mnemonic phrase.
              </p>
              <button
                onClick={generateWallet}
                className="bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 px-8 rounded-lg transition-all active:scale-[0.98] flex items-center gap-2 mx-auto"
              >
                <Plus size={18} />
                Generate Wallet
              </button>
            </div>
          ) : (
            <>
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Wallet Name</label>
                <input
                  type="text" value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Address</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-surface-800 text-brand-300 p-3 rounded-lg text-sm break-all">{wallet.address}</code>
                  <button onClick={() => onShowQR(wallet.address, 'Wallet Address', walletName)} className="p-2 bg-surface-800 hover:bg-brand-500/20 text-brand-400 rounded-lg"><QrCode size={16} /></button>
                  <button onClick={() => handleCopy(wallet.address, 'addr')} className="p-2 bg-surface-800 hover:bg-surface-700 text-surface-300 rounded-lg">
                    {copiedField === 'addr' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Private Key */}
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Private Key</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-surface-800 text-red-300 p-3 rounded-lg text-xs break-all font-mono">{wallet.privateKey}</code>
                  <button onClick={() => handleCopy(wallet.privateKey, 'pk')} className="p-2 bg-surface-800 hover:bg-surface-700 text-surface-300 rounded-lg">
                    {copiedField === 'pk' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Mnemonic */}
              {wallet.mnemonic && (
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1">Mnemonic (12 words)</label>
                  <div className="bg-surface-800 p-3 rounded-lg">
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {wallet.mnemonic.split(' ').map((word, i) => (
                        <span key={i} className="text-xs text-surface-200 bg-surface-700 px-2 py-1 rounded text-center">
                          <span className="text-surface-500 mr-1">{i + 1}.</span>{word}
                        </span>
                      ))}
                    </div>
                    <button onClick={() => handleCopy(wallet.mnemonic, 'mn')} className="text-xs text-surface-400 hover:text-brand-400 flex items-center gap-1">
                      {copiedField === 'mn' ? <><Check size={12} className="text-green-400" /> Copied!</> : <><Copy size={12} /> Copy mnemonic</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400">
                ⚠️ <strong>Back up your Private Key and Mnemonic NOW.</strong> They will be encrypted after saving and cannot be recovered if you lose your device without a backup.
              </div>

              {/* Regenerate */}
              <button onClick={generateWallet} className="text-xs text-surface-500 hover:text-brand-400 flex items-center gap-1 mx-auto">
                <RefreshCw size={12} /> Generate another
              </button>
            </>
          )}
        </div>

        {wallet && (
          <div className="p-4 border-t border-surface-800">
            <button
              onClick={handleSave}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-lg transition-all active:scale-[0.98]"
            >
              Save to Vault
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
