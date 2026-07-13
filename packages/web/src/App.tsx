import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { PreviewPage } from './pages/PreviewPage';
import { useTheme } from './hooks/useTheme';

export const App: React.FC = () => {
  useTheme();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
        />
        <Route
          path="/settings"
          element={
            <Layout>
              <SettingsPage />
            </Layout>
          }
        />
        <Route path="/preview/:sessionId" element={<PreviewPage />} />
      </Routes>
    </BrowserRouter>
  );
};
