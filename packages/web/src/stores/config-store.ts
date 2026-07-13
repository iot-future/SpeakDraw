import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';

export type Provider = 'openai' | 'anthropic' | 'deepseek' | 'hunyuan';
export type Theme = 'light' | 'dark' | 'system';

interface ConfigState {
  apiKey: string;
  provider: Provider;
  model: string;
  layoutDirection: 'LR' | 'TB';
  theme: Theme;
  setApiKey: (key: string) => void;
  setProvider: (p: Provider) => void;
  setModel: (m: string) => void;
  setLayoutDirection: (d: 'LR' | 'TB') => void;
  setTheme: (t: Theme) => void;
  getHeaders: () => Record<string, string>;
}

type PersistedState = Pick<ConfigState, 'apiKey' | 'provider' | 'model' | 'layoutDirection' | 'theme'>;

const STORAGE_KEYS: Record<keyof PersistedState, string> = {
  apiKey: 'ai-diagram-api-key',
  provider: 'ai-diagram-provider',
  model: 'ai-diagram-model',
  layoutDirection: 'ai-diagram-layout-direction',
  theme: 'ai-diagram-theme',
};

const customStorage: PersistStorage<PersistedState> = {
  getItem: (_name: string) => {
    const stored: Record<string, string> = {};
    for (const [field, key] of Object.entries(STORAGE_KEYS)) {
      const value = localStorage.getItem(key);
      if (value !== null) {
        stored[field] = value;
      }
    }
    return {
      state: stored as unknown as PersistedState,
      version: 0,
    };
  },
  setItem: (_name: string, value: { state: PersistedState }) => {
    const state = value.state;
    for (const [field, key] of Object.entries(STORAGE_KEYS)) {
      const val = (state as Record<string, unknown>)[field];
      if (val !== undefined && val !== null) {
        localStorage.setItem(key, String(val));
      }
    }
  },
  removeItem: (_name: string) => {
    for (const key of Object.values(STORAGE_KEYS)) {
      localStorage.removeItem(key);
    }
  },
};

const DEFAULT_MODELS: Record<Provider, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-3-5-sonnet-latest',
  deepseek: 'deepseek-chat',
  hunyuan: 'hunyuan-lite',
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      apiKey: '',
      provider: 'openai' as Provider,
      model: DEFAULT_MODELS['openai'],
      layoutDirection: 'TB' as const,
      theme: 'system' as Theme,
      setApiKey: (apiKey: string) => set({ apiKey }),
      setProvider: (provider: Provider) =>
        set({ provider, model: DEFAULT_MODELS[provider] }),
      setModel: (model: string) => set({ model }),
      setLayoutDirection: (layoutDirection: 'LR' | 'TB') => set({ layoutDirection }),
      setTheme: (theme: Theme) => set({ theme }),
      getHeaders: () => {
        const { apiKey, provider } = get();
        return {
          'Authorization': apiKey ? `Bearer ${apiKey}` : '',
          'X-Provider': provider,
        };
      },
    }),
    {
      name: 'ai-diagram-config',
      storage: customStorage,
      partialize: (state) => ({
        apiKey: state.apiKey,
        provider: state.provider,
        model: state.model,
        layoutDirection: state.layoutDirection,
        theme: state.theme,
      }),
    },
  ),
);
