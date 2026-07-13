import React, { useState, useCallback } from 'react';
import { Button } from '../common/Button';

interface InputBoxProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

export const InputBox: React.FC<InputBoxProps> = ({ onSubmit, disabled = false }) => {
  const [text, setText] = useState('');

  const handleSubmit = useCallback((): void => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setText('');
  }, [text, disabled, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t dark:border-gray-700 p-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your diagram... (Shift+Enter for new line)"
          disabled={disabled}
          className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <Button onClick={handleSubmit} disabled={disabled || !text.trim()}>
          Generate
        </Button>
      </div>
    </div>
  );
};
