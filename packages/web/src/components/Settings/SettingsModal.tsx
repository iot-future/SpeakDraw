import React from 'react';
import { Modal } from '../common/Modal';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { useConfigStore } from '../../stores/config-store';
import type { Provider, Theme } from '../../stores/config-store';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'hunyuan', label: 'Hunyuan (Tencent)' },
];

const MODEL_OPTIONS: Record<string, { value: string; label: string }[]> = {
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  ],
  anthropic: [
    { value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-opus-latest', label: 'Claude 3 Opus' },
  ],
  deepseek: [
    { value: 'deepseek-chat', label: 'DeepSeek Chat' },
    { value: 'deepseek-coder', label: 'DeepSeek Coder' },
  ],
  hunyuan: [
    { value: 'hunyuan-lite', label: 'Hunyuan Lite' },
    { value: 'hunyuan-pro', label: 'Hunyuan Pro' },
  ],
};

const DIRECTION_OPTIONS = [
  { value: 'TB', label: 'Top to Bottom' },
  { value: 'LR', label: 'Left to Right' },
];

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const {
    apiKey,
    provider,
    model,
    layoutDirection,
    theme,
    setApiKey,
    setProvider,
    setModel,
    setLayoutDirection,
    setTheme,
  } = useConfigStore();

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            Your key is stored locally and never sent to our servers.
          </p>
        </div>

        <Select
          label="Provider"
          value={provider}
          onChange={(v) => setProvider(v as Provider)}
          options={PROVIDER_OPTIONS}
        />

        <Select
          label="Model"
          value={model}
          onChange={setModel}
          options={MODEL_OPTIONS[provider] ?? []}
        />

        <Select
          label="Layout Direction"
          value={layoutDirection}
          onChange={(v) => setLayoutDirection(v as 'LR' | 'TB')}
          options={DIRECTION_OPTIONS}
        />

        <Select
          label="Theme"
          value={theme}
          onChange={(v) => setTheme(v as Theme)}
          options={THEME_OPTIONS}
        />

        <div className="flex justify-end pt-2">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  );
};
