import { ShieldAlert } from 'lucide-react';

export default function AuthErrorScreen({ error }) {
  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4 text-center">
      <div className="max-w-sm w-full">
        <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Vault Locked</h2>
        <p className="text-surface-400 mb-8">{error}</p>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Retry Authentication
          </button>

          {error.includes('Invalid Key') && (
            <button
              onClick={async () => {
                if (window.confirm("WARNING: Your encryption key was lost or corrupted (usually happens if you removed your phone's screen lock). To use the app again, you must wipe all current vault data. Proceed?")) {
                  const { wipeAllData } = await import('../utils/storage');
                  await wipeAllData();
                  window.location.reload();
                }
              }}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Wipe Vault & Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
