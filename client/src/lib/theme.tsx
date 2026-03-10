import { createContext, useContext, useState, useEffect, useCallback, ReactNode, MouseEvent } from 'react';

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{
  theme: Theme;
  toggle: (e?: MouseEvent) => void;
}>({
  theme: 'dark',
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function applyTheme(next: Theme, x?: number, y?: number) {
  const doc = document.documentElement;
  const direction = next === 'dark' ? 'to-dark' : 'to-light';

  if (x !== undefined && y !== undefined) {
    doc.style.setProperty('--transition-x', `${x}px`);
    doc.style.setProperty('--transition-y', `${y}px`);
  }

  if (!('startViewTransition' in document)) {
    doc.setAttribute('data-theme', next);
    return;
  }

  doc.setAttribute('data-transition', direction);
  (document as any).startViewTransition(() => {
    doc.setAttribute('data-theme', next);
  }).finished.then(() => {
    doc.removeAttribute('data-transition');
  });
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('dns-text-theme') as Theme | null;
    const initial = saved ?? 'dark';
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  const toggle = useCallback((e?: MouseEvent) => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('dns-text-theme', next);
    applyTheme(next, e?.clientX, e?.clientY);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
