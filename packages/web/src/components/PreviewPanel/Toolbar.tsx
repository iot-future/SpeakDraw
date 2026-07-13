import React, { useState } from 'react';
import { Button } from '../common/Button';
import { downloadDrawioFile, copyToClipboard } from '../../utils/download';

interface ToolbarProps {
  xml: string | null;
  onExportPng: () => Promise<string>;
  onExportSvg: () => Promise<string>;
}

export const Toolbar: React.FC<ToolbarProps> = ({ xml, onExportPng, onExportSvg }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    if (!xml) return;
    await copyToClipboard(xml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">Export:</span>
      <Button
        variant="secondary"
        size="sm"
        disabled={!xml}
        onClick={() => xml && downloadDrawioFile(xml)}
      >
        .drawio
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={!xml}
        onClick={async () => {
          const data = await onExportPng();
          if (data) {
            const blob = await import('../../utils/download').then((m) =>
              m.base64ToBlob(data, 'image/png'),
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'diagram.png';
            a.click();
            URL.revokeObjectURL(url);
          }
        }}
      >
        PNG
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={!xml}
        onClick={async () => {
          const data = await onExportSvg();
          if (data) {
            const blob = await import('../../utils/download').then((m) =>
              m.base64ToBlob(data, 'image/svg+xml'),
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'diagram.svg';
            a.click();
            URL.revokeObjectURL(url);
          }
        }}
      >
        SVG
      </Button>
      <Button variant="ghost" size="sm" disabled={!xml} onClick={handleCopy}>
        {copied ? 'Copied!' : 'Copy XML'}
      </Button>
    </div>
  );
};
