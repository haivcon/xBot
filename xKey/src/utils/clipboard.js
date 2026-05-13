import { hapticTap } from './haptics';

let clearTimer = null;

/**
 * Copy text to clipboard with auto-clear after specified duration.
 * @param {string} text - Text to copy
 * @param {number} clearAfterMs - Auto-clear delay in ms (0 = no auto-clear)
 * @param {function} onClear - Optional callback when clipboard is cleared
 */
export const secureCopy = async (text, clearAfterMs = 30000, onClear = null) => {
  try {
    await navigator.clipboard.writeText(text);
    hapticTap();

    // Cancel any previous pending clear
    if (clearTimer) clearTimeout(clearTimer);

    // Schedule auto-clear
    if (clearAfterMs > 0) {
      clearTimer = setTimeout(async () => {
        try {
          // Only clear if clipboard still contains our text
          const current = await navigator.clipboard.readText();
          if (current === text) {
            await navigator.clipboard.writeText('');
          }
        } catch {
          // readText may fail due to permissions — write empty anyway
          try { await navigator.clipboard.writeText(''); } catch {}
        }
        clearTimer = null;
        if (onClear) onClear();
      }, clearAfterMs);
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Get the clipboard timeout preference key
 */
export const CLIPBOARD_TIMEOUT_KEY = 'xkey_clipboard_timeout';

/**
 * Default timeout options (ms)
 */
export const CLIPBOARD_OPTIONS = [
  { label: '30s', value: 30000 },
  { label: '60s', value: 60000 },
  { label: '90s', value: 90000 },
  { label: '2min', value: 120000 },
  { label: '∞', value: 0 },
];
