import React from 'react';
import type { StepState } from '../../types/chat';

interface AssistantMessageProps {
  content: string;
  step: StepState;
}

export const AssistantMessage: React.FC<AssistantMessageProps> = ({ content, step }) => {
  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[80%] rounded-lg bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
        <p>{content}</p>
        {step.phase !== 'idle' && step.phase !== 'done' && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="animate-pulse h-2 w-2 rounded-full bg-blue-500" />
            <span>{step.message}</span>
          </div>
        )}
        {step.phase === 'done' && step.durationMs && (
          <div className="mt-1 text-xs text-gray-400">
            Completed in {(step.durationMs / 1000).toFixed(1)}s
          </div>
        )}
        {step.phase === 'error' && (
          <div className="mt-2 text-xs text-red-600 dark:text-red-400">Error: {step.message}</div>
        )}
      </div>
    </div>
  );
};
