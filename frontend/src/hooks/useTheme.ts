import { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = 'app-theme';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    return savedTheme === 'dark';
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
    document.body.classList.toggle('dark-theme', isDark);
    document.body.classList.toggle('light-theme', !isDark);
  }, [isDark]);

  const value = useMemo<ThemeContextValue>(() => ({
    isDark,
    toggleTheme: () => setIsDark(prev => !prev),
    setTheme: setIsDark
  }), [isDark]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
