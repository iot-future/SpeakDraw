import { useEffect } from 'react';
import { useConfigStore } from '../stores/config-store';

export function useTheme(): void {
  const theme = useConfigStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
      const listener = (e: MediaQueryListEvent): void => {
        root.classList.toggle('dark', e.matches);
      };
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', listener);
      return (): void => {
        mq.removeEventListener('change', listener);
      };
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
    return;
  }, [theme]);
}
