import React from 'react';

interface UserMessageProps {
  content: string;
}

export const UserMessage: React.FC<UserMessageProps> = ({ content }) => {
  return (
    <div className="flex justify-end mb-3">
      <div className="max-w-[80%] rounded-lg bg-blue-600 text-white px-4 py-2 text-sm">
        {content}
      </div>
    </div>
  );
};
