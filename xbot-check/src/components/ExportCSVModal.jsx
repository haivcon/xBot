import { useState } from 'react';
import { X, Download, Copy, Check, ShieldAlert } from 'lucide-react';
import { reauthenticate } from '../hooks/useReauth';
import { useToast } from '../contexts/ToastContext';

const COLUMNS = [
  { key: 'name', label: 'Name', default: true },
  { key: 'address', label: 'Address', default: true },
  { key: 'balance', label: 'Balance', default: true },
  { key: 'groupId', label: 'Folder', default: true },
  { key: 'privateKey', label: 'Private Key', default: false, sensitive: true },
  { key: 'seedPhrase', label: 'Seed Phrase', default: false, sensitive: true },
];

export default function ExportCSVModal({ wallets, onClose }) {
  const [selected, setSelected] = useState(new Set(COLUMNS.filter(c => c.default).map(c => c.key)));
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const toggle = async (key) => {
    const col = COLUMNS.find(c => c.key === key);
    if (col.sensitive && !selected.has(key)) {
      const ok = await reauthenticate('Authenticate to include sensitive data');
      if (!ok) {
        showToast('Authentication required to export sensitive data', 'warning');
        return;
      }
    }
    const next = new Set(selected);
    next.has(key) ? next.delete(key) : next.add(key);
    setSelected(next);
  };

  const buildCSV = () => {
    const cols = COLUMNS.filter(c => selected.has(c.key));
    const header = cols.map(c => c.label).join(',');
    const rows = wallets.map(w =>
      cols.map(c => {
        const val = String(w[c.key] || '').replace(/\r?\n/g, ' ').replace(/"/g, '""');
        return `"${val}"`;
      }).join(',')
    );
    return [header, ...rows].join('\n');
  };

  const handleCopy = () => {
    const csv = buildCSV();
    navigator.clipboard.writeText(csv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast(`Copied ${wallets.length} wallets to clipboard`, 'success');
  };

  const handleDownload = async () => {
    try {
      const csv = buildCSV();
      const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');
      const fileName = `xbot_export_${Date.now()}.csv`;

      const result = await Filesystem.writeFile({
        path: fileName,
        data: csv,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });

      await Share.share({
        title: 'XBOT Vault Export',
        url: result.uri,
        dialogTitle: 'Save CSV Export'
      });
      // Clean up cache
      try { await Filesystem.deleteFile({ path: fileName, directory: Directory.Cache }); } catch {}
      showToast('CSV exported successfully', 'success');
    } catch (e) {
      // Fallback: copy to clipboard
      handleCopy();
    }
  };

  const hasSensitive = [...selected].some(k => COLUMNS.find(c => c.key === k)?.sensitive);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-900 border border-surface-700 w-full max-w-md rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-surface-800">
          <h2 className="text-lg font-bold text-white">Export CSV</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-800 rounded-full transition-colors text-surface-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-surface-400">Select columns to include ({wallets.length} wallets)</p>

          <div className="space-y-2">
            {COLUMNS.map(col => (
              <button
                key={col.key}
                onClick={() => toggle(col.key)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors ${selected.has(col.key) ? 'bg-brand-500/10 border-brand-500/30 text-white' : 'bg-surface-800 border-surface-700 text-surface-400'}`}
              >
                <span className="flex items-center gap-2">
                  {col.label}
                  {col.sensitive && <ShieldAlert size={14} className="text-red-400" />}
                </span>
                {selected.has(col.key) && <Check size={16} className="text-brand-400" />}
              </button>
            ))}
          </div>

          {hasSensitive && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400 flex gap-2">
              <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
              <span>Sensitive data (Private Key / Seed) will be exported in plaintext. Handle with extreme caution.</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-surface-800 flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 bg-surface-800 hover:bg-surface-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
