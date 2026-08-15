export type ViewMode = 
  | 'dashboard' 
  | 'studio' 
  | 'marketplace' 
  | 'fleet' 
  | 'media' 
  | 'analytics' 
  | 'settings';

export type ThemeCategory = 'Luxury' | 'Corporate' | 'Vibrant' | 'Beach' | 'Marketplace';

export interface SignageTheme {
  id: string;
  name: string;
  category: ThemeCategory;
  price: string;
  isFree?: boolean;
  tier: 'Free' | 'Pro' | 'Enterprise';
  previewImage: string;
  bgUrl: string;
  accentColor: string;
  secondaryColor?: string;
  titleFont: string;
  headlineText: string;
  subtitleText: string;
  descriptionText?: string;
  ctaText?: string;
  badge?: string;
  activeEffects?: string[];
}

export interface DisplayDevice {
  id: string;
  name: string;
  location: string;
  status: 'Online' | 'Offline' | 'Syncing' | 'Warning';
  resolution: '4K UHD' | '1080p FHD' | '8K Ultra';
  currentSlide: string;
  uptime: string;
  ipAddress: string;
  lastPing: string;
  group: string;
}

export interface Transaction {
  id: string;
  customerName: string;
  avatarUrl: string;
  plan: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
  timestamp: string;
  screensLicensed: number;
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface TimelineTrackItem {
  id: string;
  title: string;
  startSec: number;
  durationSec: number;
  type: 'video' | 'image' | 'text' | 'audio' | 'effect';
  color: string;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'media' | 'effects' | 'text' | 'audio';
  items: TimelineTrackItem[];
}
