import React, { useEffect, useRef } from 'react';
import { useSessionStore } from '../../stores/session-store';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';

export const MessageList: React.FC = () => {
  const messages = useSessionStore((s) => s.messages);
  const currentStep = useSessionStore((s) => s.currentStep);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStep]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
        <p>Describe your diagram to get started...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map((msg) =>
        msg.role === 'user' ? (
          <UserMessage key={msg.id} content={msg.content} />
        ) : (
          <AssistantMessage key={msg.id} content={msg.content} step={currentStep} />
        ),
      )}
      <div ref={bottomRef} />
    </div>
  );
};
