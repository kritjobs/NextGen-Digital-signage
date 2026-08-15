import { create } from 'zustand';

export interface ApiKeysState {
  openWeatherApiKey: string;
  googleApiKey: string; // Shared Google API key for Calendar & Sheets
  // Actions
  setOpenWeatherApiKey: (key: string) => void;
  setGoogleApiKey: (key: string) => void;
  loadFromStorage: () => void;
}

const STORAGE_KEY = 'signage_api_keys';

function loadKeys(): Partial<ApiKeysState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveKeys(state: { openWeatherApiKey: string; googleApiKey: string }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    openWeatherApiKey: state.openWeatherApiKey,
    googleApiKey: state.googleApiKey,
  }));
}

const stored = loadKeys();

export const useApiKeysStore = create<ApiKeysState>((set, get) => ({
  openWeatherApiKey: (stored as any).openWeatherApiKey || '',
  googleApiKey: (stored as any).googleApiKey || '',

  setOpenWeatherApiKey: (key) => {
    set({ openWeatherApiKey: key });
    saveKeys({ ...get(), openWeatherApiKey: key });
  },

  setGoogleApiKey: (key) => {
    set({ googleApiKey: key });
    saveKeys({ ...get(), googleApiKey: key });
  },

  loadFromStorage: () => {
    const keys = loadKeys();
    set({
      openWeatherApiKey: (keys as any).openWeatherApiKey || '',
      googleApiKey: (keys as any).googleApiKey || '',
    });
  },
}));
