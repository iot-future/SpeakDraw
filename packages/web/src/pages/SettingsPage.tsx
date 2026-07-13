import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsModal } from '../components/Settings/SettingsModal';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full flex items-center justify-center">
      <SettingsModal open={true} onClose={() => navigate('/')} />
    </div>
  );
};
