import React, { useCallback, useRef, useState } from 'react';

const DRAWIO_EMBED_URL =
  'https://embed.diagrams.net/?embed=1&proto=json&spin=1&ui=min&noSaveBtn=1&noExitBtn=1';

export function useDrawioEmbed(): {
  DRAWIO_EMBED_URL: string;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  ready: boolean;
  hasContent: boolean;
  handleMessage: (event: MessageEvent) => void;
  loadXml: (xml: string) => void;
  exportDiagram: (format: 'xmlpng' | 'xmlsvg' | 'xml') => Promise<string>;
} {
  const iframeRef = useRef<HTMLIFrameElement>(null!);
  const [ready, setReady] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  const handleMessage = useCallback((event: MessageEvent): void => {
    if (event.origin !== 'https://embed.diagrams.net') return;
    const data = event.data;
    if (typeof data !== 'object' || !data) return;

    if (data['event'] === 'init') {
      setReady(true);
    }
  }, []);

  const loadXml = useCallback(
    (xml: string): void => {
      if (!iframeRef.current?.contentWindow || !ready) return;
      const msg = {
        action: 'load',
        xml: xml,
        autosave: 0,
      };
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify(msg),
        'https://embed.diagrams.net',
      );
      setHasContent(true);
    },
    [ready],
  );

  const exportDiagram = useCallback((format: 'xmlpng' | 'xmlsvg' | 'xml'): Promise<string> => {
    return new Promise((resolve) => {
      if (!iframeRef.current?.contentWindow) return resolve('');
      const handler = (event: MessageEvent): void => {
        if (event.origin !== 'https://embed.diagrams.net') return;
        const data = event.data;
        if (typeof data === 'object' && data && data['event'] === 'export') {
          window.removeEventListener('message', handler);
          resolve(data['data'] ?? '');
        }
      };
      window.addEventListener('message', handler);
      const msg = { action: 'export', format };
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify(msg),
        'https://embed.diagrams.net',
      );
    });
  }, []);

  return {
    DRAWIO_EMBED_URL,
    iframeRef,
    ready,
    hasContent,
    handleMessage,
    loadXml,
    exportDiagram,
  };
}
