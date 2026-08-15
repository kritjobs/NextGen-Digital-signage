import { create } from 'zustand';

export interface BrandingConfig {
  platformName: string;
  platformSubtitle: string;
  logoUrl: string; // URL or /uploads/... path
  faviconUrl: string;
  primaryColor: string; // hex
  accentColor: string; // hex
  footerText: string;
  loginTitle: string;
  loginSubtitle: string;
}

interface BrandingState extends BrandingConfig {
  setBranding: (config: Partial<BrandingConfig>) => void;
  resetToDefault: () => void;
}

const DEFAULT_BRANDING: BrandingConfig = {
  platformName: 'SIGNAGE',
  platformSubtitle: 'Smart Layout & Realtime Display Engine',
  logoUrl: '', // empty = use default icon
  faviconUrl: '',
  primaryColor: '#06b6d4', // cyan-500
  accentColor: '#8b5cf6', // violet-500
  footerText: 'Enterprise Digital Signage Platform',
  loginTitle: 'SIGNAGE ENTERPRISE',
  loginSubtitle: 'Smart Digital Signage Management Platform',
};

const STORAGE_KEY = 'signage_branding';

function loadBranding(): BrandingConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_BRANDING, ...JSON.parse(raw) } : DEFAULT_BRANDING;
  } catch { return DEFAULT_BRANDING; }
}

function saveBranding(config: BrandingConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export const useBrandingStore = create<BrandingState>((set, get) => ({
  ...loadBranding(),

  setBranding: (config) => {
    const updated = { ...get(), ...config };
    set(updated);
    saveBranding(updated);
    // Update favicon if changed
    if (config.faviconUrl) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) link.href = config.faviconUrl;
    }
  },

  resetToDefault: () => {
    set(DEFAULT_BRANDING);
    saveBranding(DEFAULT_BRANDING);
  },
}));
