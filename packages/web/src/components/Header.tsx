import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './common/Button';
import { SettingsModal } from './Settings/SettingsModal';
import { useConfigStore } from '../stores/config-store';

export const Header: React.FC = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const theme = useConfigStore((s) => s.theme);
  const setTheme = useConfigStore((s) => s.setTheme);

  const cycleTheme = (): void => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  };

  return (
    <>
      <header className="h-12 flex items-center justify-between px-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900 dark:text-white">AI-Diagram</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={cycleTheme} title={`Theme: ${theme}`}>
            {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🖥'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>
            Settings
          </Button>
        </div>
      </header>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};
