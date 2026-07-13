import React, { useEffect } from 'react';
import { Spinner } from '../common/Spinner';
import { useDrawioEmbed } from '../../hooks/useDrawioEmbed';

interface DrawioEmbedProps {
  xml: string | null;
}

export const DrawioEmbed: React.FC<DrawioEmbedProps> = ({ xml }) => {
  const { DRAWIO_EMBED_URL, iframeRef, ready, hasContent, handleMessage, loadXml } =
    useDrawioEmbed();

  useEffect((): (() => void) => {
    window.addEventListener('message', handleMessage);
    return (): void => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  useEffect((): void => {
    if (xml && ready) {
      loadXml(xml);
    }
  }, [xml, ready, loadXml]);

  return (
    <div className="flex-1 relative">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-col items-center gap-2">
            <Spinner size="lg" />
            <span className="text-sm text-gray-500">Loading draw.io viewer...</span>
          </div>
        </div>
      )}
      {!hasContent && ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 pointer-events-none">
          <span className="text-sm text-gray-400">Your diagram will appear here</span>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={DRAWIO_EMBED_URL}
        className="w-full h-full border-0"
        title="Diagram Preview"
      />
    </div>
  );
};
