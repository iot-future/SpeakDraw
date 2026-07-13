import React from 'react';
import { MessageList } from './MessageList';
import { InputBox } from './InputBox';

interface ChatPanelProps {
  onGenerate: (text: string) => void;
  disabled?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ onGenerate, disabled }) => {
  return (
    <div className="flex flex-col h-full border-r dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="px-4 py-3 border-b dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Conversation</h2>
      </div>
      <MessageList />
      <InputBox onSubmit={onGenerate} disabled={disabled} />
    </div>
  );
};
