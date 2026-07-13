import React from 'react';
import { ChatPanel } from '../components/ChatPanel/ChatPanel';
import { PreviewPanel } from '../components/PreviewPanel/PreviewPanel';
import { useGenerate } from '../hooks/useGenerate';

export const HomePage: React.FC = () => {
  const { generate, isGenerating } = useGenerate();

  return (
    <div className="flex h-full">
      <div className="w-[40%] min-w-[300px] max-w-[500px]">
        <ChatPanel onGenerate={generate} disabled={isGenerating} />
      </div>
      <div className="flex-1">
        <PreviewPanel />
      </div>
    </div>
  );
};
