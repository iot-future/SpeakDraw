import React from 'react';
import { useSessionStore } from '../../stores/session-store';
import { Toolbar } from './Toolbar';
import { DrawioEmbed } from './DrawioEmbed';

export const PreviewPanel: React.FC = () => {
  const xml = useSessionStore((s) => s.xml);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="px-4 py-3 border-b dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Preview</h2>
      </div>
      <Toolbar xml={xml} onExportPng={async () => ''} onExportSvg={async () => ''} />
      <DrawioEmbed xml={xml} />
    </div>
  );
};
