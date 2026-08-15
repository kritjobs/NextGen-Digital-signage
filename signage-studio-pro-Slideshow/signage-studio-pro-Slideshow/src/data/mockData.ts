import { SignageTheme, DisplayDevice, Transaction, ActivityLog, TimelineTrack } from '../types';

export const INITIAL_THEMES: SignageTheme[] = [
  {
    id: 'aurelian-gold',
    name: 'Obsidian & Gold',
    category: 'Luxury',
    price: '$9.99 / mo',
    tier: 'Enterprise',
    badge: 'Enterprise',
    previewImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    bgUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
    accentColor: '#F2CA50', // Gold
    secondaryColor: '#131313',
    titleFont: 'Playfair Display',
    headlineText: 'GOLDEN HOUR SPECIAL',
    subtitleText: 'LIMITED TIME OFFER',
    descriptionText: 'Experience unparalleled luxury as the sun sets. Enjoy exclusive access to our premium reserves and bespoke culinary creations, curated specifically for the twilight ambiance.',
    ctaText: 'Discover More',
    activeEffects: ['Gold Dust Particles', 'Ken Burns Motion', 'Subtle Glow']
  },
  {
    id: 'grand-atrium',
    name: 'The Grand Atrium',
    category: 'Luxury',
    price: '$7.99 / mo',
    tier: 'Pro',
    badge: 'PRO',
    previewImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    bgUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=80',
    accentColor: '#E9C349',
    titleFont: 'Playfair Display',
    headlineText: 'THE GRAND ATRIUM',
    subtitleText: 'EXPERIENCE UNPARALLELED LUXURY',
    descriptionText: 'Discover a sanctuary of refined elegance and bespoke service in the heart of the metropolis.',
    ctaText: 'View Schedule',
    activeEffects: ['Ambient Vignette', 'Parallax Depth']
  },
  {
    id: 'executive-residences',
    name: 'Executive Residences',
    category: 'Corporate',
    price: 'Free',
    tier: 'Free',
    isFree: true,
    previewImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    bgUrl: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1600&q=80',
    accentColor: '#38BDF8',
    titleFont: 'Inter',
    headlineText: 'Executive Residences',
    subtitleText: 'Modern Living Redefined',
    descriptionText: 'Architectural excellence meets resort-style living with state-of-the-art residential wellness suites.',
    ctaText: 'Schedule Tour',
    activeEffects: ['Clean Line Sweep']
  },
  {
    id: 'ivory-silk',
    name: 'Ivory Silk',
    category: 'Luxury',
    price: '$5.99 / mo',
    tier: 'Pro',
    badge: 'PRO',
    previewImage: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80',
    bgUrl: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1600&q=80',
    accentColor: '#F2CA50',
    titleFont: 'Playfair Display',
    headlineText: 'IVORY SILK LOUNGE',
    subtitleText: 'MINIMALIST ELEGANCE',
    descriptionText: 'Pure silk textures, bespoke cocktail pairings, and relaxing soundscapes for discerning guests.',
    ctaText: 'Reserve Table',
    activeEffects: ['Silk Wave Flow']
  },
  {
    id: 'neon-nights',
    name: 'Neon Nights',
    category: 'Vibrant',
    price: '$5.99 / mo',
    tier: 'Pro',
    badge: 'PRO',
    previewImage: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
    bgUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80',
    accentColor: '#EC4899',
    secondaryColor: '#06B6D4',
    titleFont: 'Inter',
    headlineText: 'PULSE NIGHTCLUB',
    subtitleText: 'EXCLUSIVE PREMIERE',
    descriptionText: 'High-impact nightclub visuals, synchronized light shows, and world-class guest DJs.',
    ctaText: 'VIP Entry',
    activeEffects: ['Neon Pulse Glow', 'Equalizer Motion']
  },
  {
    id: 'flash-sale',
    name: 'Flash Sale Retail',
    category: 'Vibrant',
    price: '$3.99 / mo',
    tier: 'Pro',
    badge: 'PRO',
    previewImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
    bgUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1600&q=80',
    accentColor: '#F59E0B',
    titleFont: 'Inter',
    headlineText: 'FLASH SALE 50% OFF',
    subtitleText: 'LIMITED TIME ONLY',
    descriptionText: 'Urgency-driven retail templates engineered for maximum foot traffic conversion.',
    ctaText: 'Shop Now',
    activeEffects: ['Shimmer Sweep']
  }
];

export const MOCK_DEVICES: DisplayDevice[] = [
  {
    id: 'DISP-01',
    name: 'Grand Horizon Lobby Display',
    location: 'Main Hotel Lobby (East Wing)',
    status: 'Online',
    resolution: '4K UHD',
    currentSlide: 'Obsidian & Gold (Golden Hour)',
    uptime: '99.98%',
    ipAddress: '192.168.1.104',
    lastPing: '2 sec ago',
    group: 'Luxury Hospitality'
  },
  {
    id: 'DISP-02',
    name: 'Aurelian VIP Entrance Kiosk',
    location: 'VIP Skybridge Lounge',
    status: 'Online',
    resolution: '4K UHD',
    currentSlide: 'The Grand Atrium',
    uptime: '100.0%',
    ipAddress: '192.168.1.108',
    lastPing: '1 sec ago',
    group: 'Luxury Hospitality'
  },
  {
    id: 'DISP-03',
    name: 'Executive Residences West Display',
    location: 'West Tower Entrance',
    status: 'Syncing',
    resolution: '1080p FHD',
    currentSlide: 'Executive Residences',
    uptime: '98.50%',
    ipAddress: '192.168.2.15',
    lastPing: '12 sec ago',
    group: 'Residential'
  },
  {
    id: 'DISP-04',
    name: 'Retail Flagship Main Video Wall',
    location: '5th Avenue Retail Store',
    status: 'Online',
    resolution: '8K Ultra',
    currentSlide: 'Neon Nights VIP Promo',
    uptime: '99.95%',
    ipAddress: '10.0.4.88',
    lastPing: '3 sec ago',
    group: 'Retail Outlets'
  },
  {
    id: 'DISP-05',
    name: 'Culinary Pavilion Menu Signage',
    location: 'Restaurant Arcade',
    status: 'Online',
    resolution: '4K UHD',
    currentSlide: 'Golden Hour Special Menu',
    uptime: '99.90%',
    ipAddress: '192.168.1.210',
    lastPing: '4 sec ago',
    group: 'Dining'
  },
  {
    id: 'DISP-06',
    name: 'Penthouse Elevator Bank Display',
    location: 'Floors 40-52 Elevators',
    status: 'Offline',
    resolution: '1080p FHD',
    currentSlide: 'Ivory Silk Lounge',
    uptime: '94.20%',
    ipAddress: '192.168.3.12',
    lastPing: '18 min ago',
    group: 'Luxury Hospitality'
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-9042',
    customerName: 'Aurelian Hotel Group',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    plan: 'Enterprise 4K Unlimited',
    amount: 14500,
    status: 'Completed',
    timestamp: 'Just now',
    screensLicensed: 120
  },
  {
    id: 'TX-9041',
    customerName: 'Metropolis Luxury Residences',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    plan: 'Pro Display Cluster',
    amount: 3200,
    status: 'Completed',
    timestamp: '12 mins ago',
    screensLicensed: 24
  },
  {
    id: 'TX-9040',
    customerName: 'Apex Retail Stores Inc',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    plan: 'Pro Multi-Screen',
    amount: 5800,
    status: 'Completed',
    timestamp: '45 mins ago',
    screensLicensed: 48
  },
  {
    id: 'TX-9039',
    customerName: 'Pulse Entertainment Venues',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    plan: 'Vibrant Signage Bundle',
    amount: 2400,
    status: 'Completed',
    timestamp: '2 hours ago',
    screensLicensed: 16
  },
  {
    id: 'TX-9038',
    customerName: 'Boutique Resort Mallorca',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    plan: 'Luxury Tier Annual',
    amount: 9600,
    status: 'Pending',
    timestamp: '3 hours ago',
    screensLicensed: 32
  }
];

export const MOCK_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'ACT-101',
    user: 'Sarah Jenkins (Chief Creative)',
    action: 'Published campaign "Golden Hour Special v3"',
    target: '12 Displays in Luxury Hospitality Group',
    time: '3 mins ago',
    type: 'success'
  },
  {
    id: 'ACT-102',
    user: 'System Sync Bot',
    action: '4K Texture Assets Cached',
    target: 'DISP-01, DISP-02, DISP-05',
    time: '14 mins ago',
    type: 'info'
  },
  {
    id: 'ACT-103',
    user: 'Marcus Vance (Admin)',
    action: 'Applied Theme "Obsidian & Gold" to fleet',
    target: 'Grand Horizon Lobby Cluster',
    time: '28 mins ago',
    type: 'success'
  },
  {
    id: 'ACT-104',
    user: 'Network Monitor',
    action: 'Connection Warning: High latency (210ms)',
    target: 'Penthouse Elevator Display (DISP-06)',
    time: '1 hour ago',
    type: 'warning'
  }
];

export const INITIAL_TIMELINE_TRACKS: TimelineTrack[] = [
  {
    id: 'track-media',
    name: 'Media 1',
    type: 'media',
    items: [
      { id: 'm1', title: 'Golden_Hour_Bg.mp4 (4K)', startSec: 0, durationSec: 12, type: 'video', color: '#6366F1' },
      { id: 'm2', title: 'Lobby_Pan_Loop.mp4', startSec: 12, durationSec: 8, type: 'video', color: '#4F46E5' }
    ]
  },
  {
    id: 'track-effects',
    name: 'Active Effects',
    type: 'effects',
    items: [
      { id: 'e1', title: 'Energetic Particle Glow', startSec: 2, durationSec: 14, type: 'effect', color: '#06B6D4' }
    ]
  },
  {
    id: 'track-text',
    name: 'Typography',
    type: 'text',
    items: [
      { id: 't1', title: '"GOLDEN HOUR SPECIAL"', startSec: 1, durationSec: 10, type: 'text', color: '#F2CA50' },
      { id: 't2', title: '"LIMITED TIME OFFER"', startSec: 11, durationSec: 7, type: 'text', color: '#E2E8F0' }
    ]
  },
  {
    id: 'track-audio',
    name: 'Audio Track',
    type: 'audio',
    items: [
      { id: 'a1', title: 'Luxe_Twilight_Ambient_Soundscape.wav', startSec: 0, durationSec: 20, type: 'audio', color: '#22C55E' }
    ]
  }
];
