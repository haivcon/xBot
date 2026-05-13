import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';

const ThemeContext = createContext(null);
const THEME_KEY = 'xkey_theme';

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    Preferences.get({ key: THEME_KEY }).then(({ value }) => {
      if (value === 'light') {
        setTheme('light');
        document.documentElement.classList.add('theme-light');
      }
    }).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      if (next === 'light') {
        document.documentElement.classList.add('theme-light');
      } else {
        document.documentElement.classList.remove('theme-light');
      }
      Preferences.set({ key: THEME_KEY, value: next }).catch(() => {});
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
