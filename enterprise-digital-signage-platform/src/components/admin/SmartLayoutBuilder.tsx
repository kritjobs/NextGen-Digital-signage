import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Maximize2,
  LayoutGrid,
  Check,
  Sparkles,
  Settings,
  Film,
  Radio,
  Clock,
  CloudSun,
  Type,
  GripVertical,
  Move,
  Image,
  Globe,
  AlertTriangle,
  Magnet,
  Grid3X3,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Palette,
  Rss,
  Youtube,
  Calendar,
  Table,
  Timer,
  UtensilsCrossed,
  TrendingUp,
  Tv
} from 'lucide-react';
import { useSignageStore } from '../../store/useSignageStore';
import { useApiKeysStore } from '../../store/useApiKeysStore';
import { LayoutTemplate, LayoutZone, Orientation, MediaType } from '../../types/signage';
import { LiveWeatherWidget } from '../widgets/LiveWeatherWidget';
import { LiveRssWidget } from '../widgets/LiveRssWidget';
import { LiveCalendarWidget } from '../widgets/LiveCalendarWidget';

// === Widget definitions for the drag panel ===
interface WidgetDef {
  type: MediaType;
  label: string;
  icon: React.ReactNode;
  color: string;
  defaultWidth: number;
  defaultHeight: number;
}

const WIDGET_DEFINITIONS: WidgetDef[] = [
  { type: 'video', label: 'Video Player', icon: <Film className="h-5 w-5" />, color: 'cyan', defaultWidth: 50, defaultHeight: 50 },
  { type: 'image', label: 'Image Gallery', icon: <Image className="h-5 w-5" />, color: 'violet', defaultWidth: 40, defaultHeight: 40 },
  { type: 'ticker', label: 'News Ticker', icon: <Type className="h-5 w-5" />, color: 'amber', defaultWidth: 100, defaultHeight: 15 },
  { type: 'weather', label: 'Weather Widget', icon: <CloudSun className="h-5 w-5" />, color: 'sky', defaultWidth: 30, defaultHeight: 25 },
  { type: 'clock', label: 'Digital Clock', icon: <Clock className="h-5 w-5" />, color: 'emerald', defaultWidth: 25, defaultHeight: 20 },
  { type: 'webpage', label: 'Web Embed', icon: <Globe className="h-5 w-5" />, color: 'indigo', defaultWidth: 60, defaultHeight: 60 },
  { type: 'announcement', label: 'Announcement', icon: <AlertTriangle className="h-5 w-5" />, color: 'rose', defaultWidth: 80, defaultHeight: 30 },
  { type: 'rss', label: 'RSS Feed', icon: <Rss className="h-5 w-5" />, color: 'orange', defaultWidth: 40, defaultHeight: 50 },
  { type: 'youtube', label: 'YouTube', icon: <Youtube className="h-5 w-5" />, color: 'red', defaultWidth: 60, defaultHeight: 45 },
  { type: 'google_calendar', label: 'Google Calendar', icon: <Calendar className="h-5 w-5" />, color: 'blue', defaultWidth: 40, defaultHeight: 50 },
  { type: 'google_sheets', label: 'Google Sheets', icon: <Table className="h-5 w-5" />, color: 'green', defaultWidth: 50, defaultHeight: 40 },
  { type: 'world_clock', label: 'World Clock', icon: <Globe className="h-5 w-5" />, color: 'teal', defaultWidth: 50, defaultHeight: 30 },
  { type: 'menu_board', label: 'Menu Board', icon: <UtensilsCrossed className="h-5 w-5" />, color: 'yellow', defaultWidth: 60, defaultHeight: 70 },
  { type: 'countdown', label: 'Countdown', icon: <Timer className="h-5 w-5" />, color: 'pink', defaultWidth: 40, defaultHeight: 30 },
  { type: 'currencies', label: 'Currencies', icon: <TrendingUp className="h-5 w-5" />, color: 'lime', defaultWidth: 35, defaultHeight: 40 },
  { type: 'hls_stream', label: 'Live Stream', icon: <Tv className="h-5 w-5" />, color: 'fuchsia', defaultWidth: 60, defaultHeight: 50 },
];

// === Widget Categories ===
interface WidgetCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  widgets: MediaType[];
}

const WIDGET_CATEGORIES: WidgetCategory[] = [
  {
    id: 'media',
    label: 'Media',
    icon: <Film className="h-3.5 w-3.5" />,
    color: 'cyan',
    widgets: ['video', 'image', 'youtube', 'hls_stream', 'webpage'],
  },
  {
    id: 'data-time',
    label: 'Time & Date',
    icon: <Clock className="h-3.5 w-3.5" />,
    color: 'emerald',
    widgets: ['clock', 'world_clock', 'countdown'],
  },
  {
    id: 'data-info',
    label: 'Information',
    icon: <CloudSun className="h-3.5 w-3.5" />,
    color: 'sky',
    widgets: ['weather', 'currencies'],
  },
  {
    id: 'data-feeds',
    label: 'Feeds & Data',
    icon: <Rss className="h-3.5 w-3.5" />,
    color: 'orange',
    widgets: ['ticker', 'rss', 'google_calendar', 'google_sheets'],
  },
  {
    id: 'business',
    label: 'Business',
    icon: <UtensilsCrossed className="h-3.5 w-3.5" />,
    color: 'yellow',
    widgets: ['menu_board', 'announcement'],
  },
];

// === Snap-to-grid utility ===
const GRID_SIZE = 5; // snap to 5% increments
const snapToGrid = (value: number, enabled: boolean): number => {
  if (!enabled) return Math.max(0, Math.min(100, value));
  return Math.max(0, Math.min(100, Math.round(value / GRID_SIZE) * GRID_SIZE));
};

// === Color map helper ===
const getWidgetColorClasses = (color: string) => ({
  bg: `bg-${color}-500/20`,
  border: `border-${color}-500/50`,
  text: `text-${color}-400`,
  hoverBorder: `hover:border-${color}-400`,
  shadow: `shadow-${color}-500/20`,
});

export const SmartLayoutBuilder: React.FC = () => {
  const { layouts, playlists, addLayout, updateLayout, deleteLayout } = useSignageStore();
  const { openWeatherApiKey, googleApiKey, setOpenWeatherApiKey, setGoogleApiKey } = useApiKeysStore();
  const [showApiKeysModal, setShowApiKeysModal] = useState(false);

  // ===== Comprehensive Template Library =====
  const TEMPLATE_LIBRARY: LayoutTemplate[] = [
    // ─── LANDSCAPE 16:9 Templates ─────────────────────────────
    {
      id: 'tpl-full-screen',
      name: '1 Full Screen',
      description: 'Single full-screen zone',
      orientation: 'landscape',
      aspectRatio: '16:9',
      widthPx: 1920, heightPx: 1080,
      zones: [
        { id: 'z1', name: 'Main', x: 0, y: 0, width: 100, height: 100, zIndex: 1, mediaType: 'video' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-main-ticker',
      name: '1 Main + Ticker',
      description: 'Main zone with bottom ticker bar',
      orientation: 'landscape',
      aspectRatio: '16:9',
      widthPx: 1920, heightPx: 1080,
      zones: [
        { id: 'z1', name: 'Main', x: 0, y: 0, width: 100, height: 85, zIndex: 1, mediaType: 'video' },
        { id: 'z2', name: 'Ticker', x: 0, y: 85, width: 100, height: 15, zIndex: 2, mediaType: 'ticker' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-2-split-h',
      name: '2 Split Horizontal',
      description: 'Two equal zones side by side',
      orientation: 'landscape',
      aspectRatio: '16:9',
      widthPx: 1920, heightPx: 1080,
      zones: [
        { id: 'z1', name: 'Left', x: 0, y: 0, width: 50, height: 100, zIndex: 1, mediaType: 'video' },
        { id: 'z2', name: 'Right', x: 50, y: 0, width: 50, height: 100, zIndex: 2, mediaType: 'image' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-2-split-v',
      name: '2 Split Vertical',
      description: 'Two equal zones stacked',
      orientation: 'landscape',
      aspectRatio: '16:9',
      widthPx: 1920, heightPx: 1080,
      zones: [
        { id: 'z1', name: 'Top', x: 0, y: 0, width: 100, height: 50, zIndex: 1, mediaType: 'video' },
        { id: 'z2', name: 'Bottom', x: 0, y: 50, width: 100, height: 50, zIndex: 2, mediaType: 'image' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-video-frame',
      name: 'Video + Sidebar',
      description: 'Large video with right sidebar',
      orientation: 'landscape',
      aspectRatio: '16:9',
      widthPx: 1920, heightPx: 1080,
      zones: [
        { id: 'z1', name: 'Main Video', x: 0, y: 0, width: 70, height: 100, zIndex: 1, mediaType: 'video' },
        { id: 'z2', name: 'Sidebar', x: 70, y: 0, width: 30, height: 100, zIndex: 2, mediaType: 'image' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-3-zone-classic',
      name: '3 Zones Classic',
      description: 'Main + sidebar + ticker bar',
      orientation: 'landscape',
      aspectRatio: '16:9',
      widthPx: 1920, heightPx: 1080,
      zones: [
        { id: 'z1', name: 'Main', x: 0, y: 0, width: 70, height: 85, zIndex: 1, mediaType: 'video' },
        { id: 'z2', name: 'Sidebar', x: 70, y: 0, width: 30, height: 85, zIndex: 2, mediaType: 'weather' },
        { id: 'z3', name: 'Ticker', x: 0, y: 85, width: 100, height: 15, zIndex: 3, mediaType: 'ticker' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-3-zone-split',
      name: '3 Zones Split',
      description: 'Three equal vertical columns',
      orientation: 'landscape',
      aspectRatio: '16:9',
      widthPx: 1920, heightPx: 1080,
      zones: [
        { id: 'z1', name: 'Left', x: 0, y: 0, width: 33, height: 100, zIndex: 1, mediaType: 'video' },
        { id: 'z2', name: 'Center', x: 33, y: 0, width: 34, height: 100, zIndex: 2, mediaType: 'image' },
        { id: 'z3', name: 'Right', x: 67, y: 0, width: 33, height: 100, zIndex: 3, mediaType: 'webpage' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-3-zone-l-shape',
      name: '3 Zones L-Shape',
      description: 'Main + two stacked right panels',
      orientation: 'landscape',
      aspectRatio: '16:9',
      widthPx: 1920, heightPx: 1080,
      zones: [
        { id: 'z1', name: 'Main', x: 0, y: 0, width: 65, height: 100, zIndex: 1, mediaType: 'video' },
        { id: 'z2', name: 'Top Right', x: 65, y: 0, width: 35, height: 50, zIndex: 2, mediaType: 'weather' },
        { id: 'z3', name: 'Bottom Right', x: 65, y: 50, width: 35, height: 50, zIndex: 3, mediaType: 'clock' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-4-zone-grid',
      name: '4 Zones Grid',
      description: 'Four equal quadrants',
      orientation: 'landscape',
      aspectRatio: '16:9',
      widthPx: 1920, heightPx: 1080,
      zones: [
        { id: 'z1', name: 'Top Left', x: 0, y: 0, width: 50, height: 50, zIndex: 1, mediaType: 'video' },
        { id: 'z2', name: 'Top Right', x: 50, y: 0, width: 50, height: 50, zIndex: 2, mediaType: 'image' },
        { id: 'z3', name: 'Bottom Left', x: 0, y: 50, width: 50, height: 50, zIndex: 3, mediaType: 'weather' },
        { id: 'z4', name: 'Bottom Right', x: 50, y: 50, width: 50, height: 50, zIndex: 4, mediaType: 'clock' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-4-zone-main-3side',
      name: '4 Zones Main + 3 Side',
      description: 'Large main + 3 stacked side panels',
      orientation: 'landscape',
      aspectRatio: '16:9',
      widthPx: 1920, heightPx: 1080,
      zones: [
        { id: 'z1', name: 'Main', x: 0, y: 0, width: 70, height: 100, zIndex: 1, mediaType: 'video' },
        { id: 'z2', name: 'Side Top', x: 70, y: 0, width: 30, height: 33, zIndex: 2, mediaType: 'weather' },
        { id: 'z3', name: 'Side Mid', x: 70, y: 33, width: 30, height: 34, zIndex: 3, mediaType: 'clock' },
        { id: 'z4', name: 'Side Bottom', x: 70, y: 67, width: 30, height: 33, zIndex: 4, mediaType: 'ticker' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-4-zone-ticker',
      name: '4 Zones + Ticker',
      description: 'Main + sidebar split + full-width ticker',
      orientation: 'landscape',
      aspectRatio: '16:9',
      widthPx: 1920, heightPx: 1080,
      zones: [
        { id: 'z1', name: 'Main', x: 0, y: 0, width: 65, height: 85, zIndex: 1, mediaType: 'video' },
        { id: 'z2', name: 'Right Top', x: 65, y: 0, width: 35, height: 45, zIndex: 2, mediaType: 'weather' },
        { id: 'z3', name: 'Right Bottom', x: 65, y: 45, width: 35, height: 40, zIndex: 3, mediaType: 'clock' },
        { id: 'z4', name: 'Ticker', x: 0, y: 85, width: 100, height: 15, zIndex: 4, mediaType: 'ticker' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-5-zone-dashboard',
      name: '5 Zones Dashboard',
      description: 'Main + 3 side panels + bottom ticker',
      orientation: 'landscape',
      aspectRatio: '16:9',
      widthPx: 1920, heightPx: 1080,
      zones: [
        { id: 'z1', name: 'Main', x: 0, y: 0, width: 65, height: 85, zIndex: 1, mediaType: 'video' },
        { id: 'z2', name: 'Side Top', x: 65, y: 0, width: 35, height: 30, zIndex: 2, mediaType: 'weather' },
        { id: 'z3', name: 'Side Mid', x: 65, y: 30, width: 35, height: 30, zIndex: 3, mediaType: 'clock' },
        { id: 'z4', name: 'Side Bottom', x: 65, y: 60, width: 35, height: 25, zIndex: 4, mediaType: 'announcement' },
        { id: 'z5', name: 'Ticker', x: 0, y: 85, width: 100, height: 15, zIndex: 5, mediaType: 'ticker' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-5-zone-mosaic',
      name: '5 Zones Mosaic',
      description: 'Large main with 4 small panels',
      orientation: 'landscape',
      aspectRatio: '16:9',
      widthPx: 1920, heightPx: 1080,
      zones: [
        { id: 'z1', name: 'Main', x: 0, y: 0, width: 60, height: 70, zIndex: 1, mediaType: 'video' },
        { id: 'z2', name: 'Top Right', x: 60, y: 0, width: 40, height: 35, zIndex: 2, mediaType: 'image' },
        { id: 'z3', name: 'Mid Right', x: 60, y: 35, width: 40, height: 35, zIndex: 3, mediaType: 'weather' },
        { id: 'z4', name: 'Bottom Left', x: 0, y: 70, width: 60, height: 30, zIndex: 4, mediaType: 'ticker' },
        { id: 'z5', name: 'Bottom Right', x: 60, y: 70, width: 40, height: 30, zIndex: 5, mediaType: 'clock' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-6-zone-broadcast',
      name: '6 Zones Broadcast',
      description: 'Full broadcast control room layout',
      orientation: 'landscape',
      aspectRatio: '16:9',
      widthPx: 1920, heightPx: 1080,
      zones: [
        { id: 'z1', name: 'Main', x: 0, y: 0, width: 50, height: 70, zIndex: 1, mediaType: 'video' },
        { id: 'z2', name: 'Preview', x: 50, y: 0, width: 50, height: 35, zIndex: 2, mediaType: 'video' },
        { id: 'z3', name: 'Info Panel', x: 50, y: 35, width: 25, height: 35, zIndex: 3, mediaType: 'weather' },
        { id: 'z4', name: 'Clock', x: 75, y: 35, width: 25, height: 35, zIndex: 4, mediaType: 'clock' },
        { id: 'z5', name: 'Ticker', x: 0, y: 70, width: 100, height: 15, zIndex: 5, mediaType: 'ticker' },
        { id: 'z6', name: 'Alert Bar', x: 0, y: 85, width: 100, height: 15, zIndex: 6, mediaType: 'announcement' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-main-left-sidebar',
      name: 'Left Sidebar + Main',
      description: 'Navigation sidebar with main content',
      orientation: 'landscape',
      aspectRatio: '16:9',
      widthPx: 1920, heightPx: 1080,
      zones: [
        { id: 'z1', name: 'Sidebar', x: 0, y: 0, width: 25, height: 100, zIndex: 1, mediaType: 'image' },
        { id: 'z2', name: 'Main', x: 25, y: 0, width: 75, height: 100, zIndex: 2, mediaType: 'video' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-main-top-bar',
      name: 'Top Bar + Main',
      description: 'Header bar with main content below',
      orientation: 'landscape',
      aspectRatio: '16:9',
      widthPx: 1920, heightPx: 1080,
      zones: [
        { id: 'z1', name: 'Header', x: 0, y: 0, width: 100, height: 15, zIndex: 1, mediaType: 'announcement' },
        { id: 'z2', name: 'Main', x: 0, y: 15, width: 100, height: 85, zIndex: 2, mediaType: 'video' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-main-top-bottom',
      name: 'Header + Main + Ticker',
      description: 'Top header, main content, bottom ticker',
      orientation: 'landscape',
      aspectRatio: '16:9',
      widthPx: 1920, heightPx: 1080,
      zones: [
        { id: 'z1', name: 'Header', x: 0, y: 0, width: 100, height: 12, zIndex: 1, mediaType: 'announcement' },
        { id: 'z2', name: 'Main', x: 0, y: 12, width: 100, height: 76, zIndex: 2, mediaType: 'video' },
        { id: 'z3', name: 'Ticker', x: 0, y: 88, width: 100, height: 12, zIndex: 3, mediaType: 'ticker' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-pip-overlay',
      name: 'PiP Overlay',
      description: 'Picture-in-picture small overlay on full screen',
      orientation: 'landscape',
      aspectRatio: '16:9',
      widthPx: 1920, heightPx: 1080,
      zones: [
        { id: 'z1', name: 'Background', x: 0, y: 0, width: 100, height: 100, zIndex: 1, mediaType: 'video' },
        { id: 'z2', name: 'PiP', x: 70, y: 5, width: 25, height: 30, zIndex: 2, mediaType: 'video' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-main-small-side-ticker',
      name: 'Main + Small Right + Ticker',
      description: 'Main content with small inset right and bottom ticker',
      orientation: 'landscape',
      aspectRatio: '16:9',
      widthPx: 1920, heightPx: 1080,
      zones: [
        { id: 'z1', name: 'Main', x: 0, y: 0, width: 75, height: 85, zIndex: 1, mediaType: 'video' },
        { id: 'z2', name: 'Small Right', x: 75, y: 0, width: 25, height: 85, zIndex: 2, mediaType: 'image' },
        { id: 'z3', name: 'Ticker', x: 0, y: 85, width: 100, height: 15, zIndex: 3, mediaType: 'ticker' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },

    // ─── PORTRAIT 9:16 Templates ─────────────────────────────
    {
      id: 'tpl-portrait-full',
      name: 'Portrait Full',
      description: 'Single full-screen portrait zone',
      orientation: 'portrait',
      aspectRatio: '9:16',
      widthPx: 1080, heightPx: 1920,
      zones: [
        { id: 'z1', name: 'Main', x: 0, y: 0, width: 100, height: 100, zIndex: 1, mediaType: 'video' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-portrait-2-split',
      name: 'Portrait 2 Split',
      description: 'Two stacked zones portrait',
      orientation: 'portrait',
      aspectRatio: '9:16',
      widthPx: 1080, heightPx: 1920,
      zones: [
        { id: 'z1', name: 'Top', x: 0, y: 0, width: 100, height: 50, zIndex: 1, mediaType: 'video' },
        { id: 'z2', name: 'Bottom', x: 0, y: 50, width: 100, height: 50, zIndex: 2, mediaType: 'image' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-portrait-3-stack',
      name: 'Portrait 3 Stack',
      description: 'Three stacked zones portrait',
      orientation: 'portrait',
      aspectRatio: '9:16',
      widthPx: 1080, heightPx: 1920,
      zones: [
        { id: 'z1', name: 'Top', x: 0, y: 0, width: 100, height: 40, zIndex: 1, mediaType: 'video' },
        { id: 'z2', name: 'Middle', x: 0, y: 40, width: 100, height: 35, zIndex: 2, mediaType: 'image' },
        { id: 'z3', name: 'Bottom', x: 0, y: 75, width: 100, height: 25, zIndex: 3, mediaType: 'ticker' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-portrait-4-split',
      name: 'Portrait 4 Split',
      description: 'Main + 2 side + ticker portrait',
      orientation: 'portrait',
      aspectRatio: '9:16',
      widthPx: 1080, heightPx: 1920,
      zones: [
        { id: 'z1', name: 'Main', x: 0, y: 0, width: 100, height: 50, zIndex: 1, mediaType: 'video' },
        { id: 'z2', name: 'Left', x: 0, y: 50, width: 50, height: 35, zIndex: 2, mediaType: 'weather' },
        { id: 'z3', name: 'Right', x: 50, y: 50, width: 50, height: 35, zIndex: 3, mediaType: 'clock' },
        { id: 'z4', name: 'Ticker', x: 0, y: 85, width: 100, height: 15, zIndex: 4, mediaType: 'ticker' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-portrait-main-ticker',
      name: 'Portrait Main + Ticker',
      description: 'Large main with ticker below',
      orientation: 'portrait',
      aspectRatio: '9:16',
      widthPx: 1080, heightPx: 1920,
      zones: [
        { id: 'z1', name: 'Main', x: 0, y: 0, width: 100, height: 85, zIndex: 1, mediaType: 'video' },
        { id: 'z2', name: 'Ticker', x: 0, y: 85, width: 100, height: 15, zIndex: 2, mediaType: 'ticker' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-portrait-header-main-footer',
      name: 'Portrait Header+Main+Footer',
      description: 'Header, main content, footer bar',
      orientation: 'portrait',
      aspectRatio: '9:16',
      widthPx: 1080, heightPx: 1920,
      zones: [
        { id: 'z1', name: 'Header', x: 0, y: 0, width: 100, height: 10, zIndex: 1, mediaType: 'announcement' },
        { id: 'z2', name: 'Main', x: 0, y: 10, width: 100, height: 78, zIndex: 2, mediaType: 'video' },
        { id: 'z3', name: 'Footer', x: 0, y: 88, width: 100, height: 12, zIndex: 3, mediaType: 'ticker' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'tpl-portrait-wayfinding',
      name: 'Portrait Wayfinding',
      description: 'Map/directory with info panels',
      orientation: 'portrait',
      aspectRatio: '9:16',
      widthPx: 1080, heightPx: 1920,
      zones: [
        { id: 'z1', name: 'Header', x: 0, y: 0, width: 100, height: 12, zIndex: 1, mediaType: 'announcement' },
        { id: 'z2', name: 'Map', x: 0, y: 12, width: 100, height: 55, zIndex: 2, mediaType: 'image' },
        { id: 'z3', name: 'Info', x: 0, y: 67, width: 60, height: 23, zIndex: 3, mediaType: 'webpage' },
        { id: 'z4', name: 'Weather', x: 60, y: 67, width: 40, height: 23, zIndex: 4, mediaType: 'weather' },
        { id: 'z5', name: 'Ticker', x: 0, y: 90, width: 100, height: 10, zIndex: 5, mediaType: 'ticker' },
      ],
      status: 'published', approvalStatus: 'approved',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
  ];

  const effectiveLayouts = layouts.length > 0 ? layouts : TEMPLATE_LIBRARY.map(t => ({ ...t, status: 'published' as const }));
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>(effectiveLayouts[0]?.id || 'tpl-full-screen');
  const activeLayout = effectiveLayouts.find((l) => l.id === selectedLayoutId) || effectiveLayouts[0];

  const [activeZoneId, setActiveZoneId] = useState<string | null>(activeLayout?.zones[0]?.id || null);

  // New Layout Modal State
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');
  const [newLayoutOrientation, setNewLayoutOrientation] = useState<Orientation>('landscape');
  const [newLayoutAspectRatio, setNewLayoutAspectRatio] = useState('16:9');

  // Template Gallery State
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [galleryTab, setGalleryTab] = useState<'landscape' | 'portrait'>('landscape');
  const [pendingTemplate, setPendingTemplate] = useState<LayoutTemplate | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Pro UX State
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [previewMode, setPreviewMode] = useState(false);
  const [widgetSearch, setWidgetSearch] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [favouriteWidgets, setFavouriteWidgets] = useState<MediaType[]>(() => {
    try { const raw = localStorage.getItem('signage_fav_widgets'); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [disabledWidgets] = useState<MediaType[]>(() => {
    try { const raw = localStorage.getItem('signage_disabled_widgets'); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [dragOverCanvas, setDragOverCanvas] = useState(false);
  const [isDraggingZone, setIsDraggingZone] = useState(false);
  const [isResizingZone, setIsResizingZone] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [dragStartZonePos, setDragStartZonePos] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<LayoutZone[][]>([]);

  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedZone = activeLayout?.zones.find((z) => z.id === activeZoneId);

  // === Undo support ===
  const pushUndo = useCallback(() => {
    if (activeLayout) {
      setUndoStack((prev) => [...prev.slice(-19), activeLayout.zones.map((z) => ({ ...z }))]);
    }
  }, [activeLayout]);

  const handleUndo = () => {
    if (undoStack.length === 0 || !activeLayout) return;
    const prevZones = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    updateLayout(activeLayout.id, { zones: prevZones });
  };

  // === Layout CRUD ===
  const handleCreateNewLayout = (e: React.FormEvent) => {
    e.preventDefault();
    const id = 'lay-' + Date.now();
    const isPortrait = newLayoutOrientation === 'portrait';
    const newTemplate: LayoutTemplate = {
      id,
      name: newLayoutName || 'Custom Multi-Zone Layout',
      description: 'Custom canvas template with multi-zone support.',
      orientation: newLayoutOrientation,
      aspectRatio: newLayoutAspectRatio,
      widthPx: isPortrait ? 1080 : 1920,
      heightPx: isPortrait ? 1920 : 1080,
      status: 'draft',
      approvalStatus: 'pending',
      zones: [
        {
          id: 'z-main-' + Date.now(),
          name: 'Main Zone',
          x: 0, y: 0, width: 100, height: 80,
          zIndex: 1,
          playlistId: playlists[0]?.id
        },
        {
          id: 'z-ticker-' + Date.now(),
          name: 'Bottom Ticker',
          x: 0, y: 80, width: 100, height: 20,
          zIndex: 2,
          mediaType: 'ticker',
          playlistId: playlists[3]?.id
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    addLayout(newTemplate);
    setSelectedLayoutId(id);
    setActiveZoneId(newTemplate.zones[0].id);
    setIsCreatingNew(false);
    setNewLayoutName('');
  };

  // === Template Gallery: select template → rename → save to store ===
  const handleSelectTemplate = (tpl: LayoutTemplate) => {
    setPendingTemplate(tpl);
    setRenameValue(tpl.name);
  };

  const handleConfirmTemplate = () => {
    if (!pendingTemplate) return;
    const id = 'lay-' + Date.now();
    const newLayout: LayoutTemplate = {
      ...pendingTemplate,
      id,
      name: renameValue || pendingTemplate.name,
      status: 'published',
      zones: pendingTemplate.zones.map((z, i) => ({ ...z, id: `${id}-z${i + 1}` })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addLayout(newLayout);
    setSelectedLayoutId(id);
    setActiveZoneId(newLayout.zones[0].id);
    setPendingTemplate(null);
    setShowTemplateGallery(false);
    setRenameValue('');
  };

  // === Zone manipulation ===
  const handleAddZone = () => {
    if (!activeLayout) return;
    pushUndo();
    const newZone: LayoutZone = {
      id: 'zone-' + Date.now(),
      name: `Zone ${activeLayout.zones.length + 1}`,
      x: 10, y: 10, width: 40, height: 40,
      zIndex: activeLayout.zones.length + 1,
      backgroundColor: '#1e293b'
    };
    const updatedZones = [...activeLayout.zones, newZone];
    updateLayout(activeLayout.id, { zones: updatedZones });
    setActiveZoneId(newZone.id);
  };

  const handleDeleteZone = (zoneId: string) => {
    if (!activeLayout || activeLayout.zones.length <= 1) return;
    pushUndo();
    const updatedZones = activeLayout.zones.filter((z) => z.id !== zoneId);
    updateLayout(activeLayout.id, { zones: updatedZones });
    setActiveZoneId(updatedZones[0]?.id || null);
  };

  const handleDuplicateZone = (zoneId: string) => {
    if (!activeLayout) return;
    pushUndo();
    const source = activeLayout.zones.find((z) => z.id === zoneId);
    if (!source) return;
    const newZone: LayoutZone = {
      ...source,
      id: 'zone-' + Date.now(),
      name: source.name + ' (Copy)',
      x: Math.min(source.x + 5, 90),
      y: Math.min(source.y + 5, 90),
      zIndex: activeLayout.zones.length + 1,
    };
    updateLayout(activeLayout.id, { zones: [...activeLayout.zones, newZone] });
    setActiveZoneId(newZone.id);
  };

  const handleUpdateZoneProps = (zoneId: string, partial: Partial<LayoutZone>) => {
    if (!activeLayout) return;
    const updatedZones = activeLayout.zones.map((z) => z.id === zoneId ? { ...z, ...partial } : z);
    updateLayout(activeLayout.id, { zones: updatedZones });
  };

  // === Widget Panel Drag → Canvas Drop (create new zone) ===
  const toggleFavourite = (type: MediaType) => {
    setFavouriteWidgets(prev => {
      const next = prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type];
      localStorage.setItem('signage_fav_widgets', JSON.stringify(next));
      return next;
    });
  };

  const handleWidgetDragStart = (e: React.DragEvent, widget: WidgetDef) => {
    e.dataTransfer.setData('application/widget-type', JSON.stringify(widget));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverCanvas(true);
  };

  const handleCanvasDragLeave = () => {
    setDragOverCanvas(false);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCanvas(false);

    const widgetData = e.dataTransfer.getData('application/widget-type');
    if (!widgetData || !activeLayout || !canvasRef.current) return;

    const widget: WidgetDef = JSON.parse(widgetData);
    const rect = canvasRef.current.getBoundingClientRect();
    const dropX = ((e.clientX - rect.left) / rect.width) * 100;
    const dropY = ((e.clientY - rect.top) / rect.height) * 100;

    const x = snapToGrid(Math.max(0, dropX - widget.defaultWidth / 2), snapEnabled);
    const y = snapToGrid(Math.max(0, dropY - widget.defaultHeight / 2), snapEnabled);
    const width = Math.min(widget.defaultWidth, 100 - x);
    const height = Math.min(widget.defaultHeight, 100 - y);

    pushUndo();
    const newZone: LayoutZone = {
      id: 'zone-' + Date.now(),
      name: widget.label,
      x, y, width, height,
      zIndex: activeLayout.zones.length + 1,
      mediaType: widget.type,
    };
    updateLayout(activeLayout.id, { zones: [...activeLayout.zones, newZone] });
    setActiveZoneId(newZone.id);
  };

  // === Zone Drag-to-Move on Canvas ===
  const handleZoneMouseDown = (e: React.MouseEvent, zone: LayoutZone) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveZoneId(zone.id);
    setIsDraggingZone(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setDragStartZonePos({ x: zone.x, y: zone.y, w: zone.width, h: zone.height });
    pushUndo();
  };

  // === Zone Drag-to-Resize ===
  const handleResizeMouseDown = (e: React.MouseEvent, zone: LayoutZone, direction: string) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveZoneId(zone.id);
    setIsResizingZone(true);
    setResizeDirection(direction);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setDragStartZonePos({ x: zone.x, y: zone.y, w: zone.width, h: zone.height });
    pushUndo();
  };

  // === Global mouse handlers for move/resize ===
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current || !dragStartPos || !dragStartZonePos || !activeZoneId || !activeLayout) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const deltaXPercent = ((e.clientX - dragStartPos.x) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - dragStartPos.y) / rect.height) * 100;

      if (isDraggingZone) {
        let newX = snapToGrid(dragStartZonePos.x + deltaXPercent, snapEnabled);
        let newY = snapToGrid(dragStartZonePos.y + deltaYPercent, snapEnabled);
        newX = Math.max(0, Math.min(100 - dragStartZonePos.w, newX));
        newY = Math.max(0, Math.min(100 - dragStartZonePos.h, newY));

        const updatedZones = activeLayout.zones.map((z) =>
          z.id === activeZoneId ? { ...z, x: newX, y: newY } : z
        );
        updateLayout(activeLayout.id, { zones: updatedZones });
      }

      if (isResizingZone && resizeDirection) {
        let { x, y, w, h } = dragStartZonePos;

        if (resizeDirection.includes('e')) {
          w = snapToGrid(w + deltaXPercent, snapEnabled);
          w = Math.max(10, Math.min(100 - x, w));
        }
        if (resizeDirection.includes('w')) {
          const newX = snapToGrid(x + deltaXPercent, snapEnabled);
          const diff = x - newX;
          x = Math.max(0, newX);
          w = Math.max(10, w + diff);
        }
        if (resizeDirection.includes('s')) {
          h = snapToGrid(h + deltaYPercent, snapEnabled);
          h = Math.max(10, Math.min(100 - y, h));
        }
        if (resizeDirection.includes('n')) {
          const newY = snapToGrid(y + deltaYPercent, snapEnabled);
          const diff = y - newY;
          y = Math.max(0, newY);
          h = Math.max(10, h + diff);
        }

        const updatedZones = activeLayout.zones.map((z) =>
          z.id === activeZoneId ? { ...z, x, y, width: w, height: h } : z
        );
        updateLayout(activeLayout.id, { zones: updatedZones });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingZone(false);
      setIsResizingZone(false);
      setResizeDirection(null);
      setDragStartPos(null);
      setDragStartZonePos(null);
    };

    if (isDraggingZone || isResizingZone) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingZone, isResizingZone, dragStartPos, dragStartZonePos, activeZoneId, activeLayout, snapEnabled, resizeDirection]);

  // === Get media type icon for zones ===
  const getMediaTypeIcon = (type?: MediaType) => {
    switch (type) {
      case 'video': return <Film className="h-3 w-3 text-cyan-400" />;
      case 'image': return <Image className="h-3 w-3 text-violet-400" />;
      case 'ticker': return <Type className="h-3 w-3 text-amber-400" />;
      case 'weather': return <CloudSun className="h-3 w-3 text-sky-400" />;
      case 'clock': return <Clock className="h-3 w-3 text-emerald-400" />;
      case 'webpage': return <Globe className="h-3 w-3 text-indigo-400" />;
      case 'announcement': return <AlertTriangle className="h-3 w-3 text-rose-400" />;
      case 'rss': return <Rss className="h-3 w-3 text-orange-400" />;
      case 'youtube': return <Youtube className="h-3 w-3 text-red-400" />;
      case 'google_calendar': return <Calendar className="h-3 w-3 text-blue-400" />;
      case 'google_sheets': return <Table className="h-3 w-3 text-green-400" />;
      case 'world_clock': return <Globe className="h-3 w-3 text-teal-400" />;
      case 'menu_board': return <UtensilsCrossed className="h-3 w-3 text-yellow-400" />;
      case 'countdown': return <Timer className="h-3 w-3 text-pink-400" />;
      case 'currencies': return <TrendingUp className="h-3 w-3 text-lime-400" />;
      case 'hls_stream': return <Tv className="h-3 w-3 text-fuchsia-400" />;
      default: return <Layers className="h-3 w-3 text-slate-400" />;
    }
  };

  const getZoneBorderColor = (type?: MediaType) => {
    switch (type) {
      case 'video': return 'border-cyan-500/60';
      case 'image': return 'border-violet-500/60';
      case 'ticker': return 'border-amber-500/60';
      case 'weather': return 'border-sky-500/60';
      case 'clock': return 'border-emerald-500/60';
      case 'webpage': return 'border-indigo-500/60';
      case 'announcement': return 'border-rose-500/60';
      case 'rss': return 'border-orange-500/60';
      case 'youtube': return 'border-red-500/60';
      case 'google_calendar': return 'border-blue-500/60';
      case 'google_sheets': return 'border-green-500/60';
      case 'world_clock': return 'border-teal-500/60';
      case 'menu_board': return 'border-yellow-500/60';
      case 'countdown': return 'border-pink-500/60';
      case 'currencies': return 'border-lime-500/60';
      case 'hls_stream': return 'border-fuchsia-500/60';
      default: return 'border-slate-600/80';
    }
  };

  const getZoneBgColor = (type?: MediaType) => {
    switch (type) {
      case 'video': return 'bg-cyan-950/40';
      case 'image': return 'bg-violet-950/40';
      case 'ticker': return 'bg-amber-950/40';
      case 'weather': return 'bg-sky-950/40';
      case 'clock': return 'bg-emerald-950/40';
      case 'webpage': return 'bg-indigo-950/40';
      case 'announcement': return 'bg-rose-950/40';
      case 'rss': return 'bg-orange-950/40';
      case 'youtube': return 'bg-red-950/40';
      case 'google_calendar': return 'bg-blue-950/40';
      case 'google_sheets': return 'bg-green-950/40';
      case 'world_clock': return 'bg-teal-950/40';
      case 'menu_board': return 'bg-yellow-950/40';
      case 'countdown': return 'bg-pink-950/40';
      case 'currencies': return 'bg-lime-950/40';
      case 'hls_stream': return 'bg-fuchsia-950/40';
      default: return 'bg-slate-800/70';
    }
  };

  // === Live Preview Widget Renderer ===
  const LiveWidgetContent: React.FC<{ zone: LayoutZone }> = ({ zone }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
      if (!previewMode) return;
      const timer = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(timer);
    }, [previewMode]);

    if (!zone.mediaType) {
      return <div className="flex items-center justify-center h-full text-slate-500 text-xs">Empty Zone</div>;
    }

    switch (zone.mediaType) {
      case 'clock': {
        const tz = zone.contentData?.timezone || 'Asia/Bangkok';
        const fmt = zone.contentData?.clockFormat || '24h';
        const label = zone.contentData?.clockLabel || tz.split('/')[1]?.replace('_', ' ') || '';
        const timeStr = time.toLocaleTimeString('en-US', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: fmt === '12h',
        });
        const dateStr = time.toLocaleDateString('en-US', {
          timeZone: tz,
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-emerald-950 to-slate-950 p-2">
            <div className="text-emerald-400 font-mono font-bold text-lg leading-none">{timeStr}</div>
            <div className="text-emerald-300/60 text-[9px] mt-1">{dateStr}</div>
            {label && <div className="text-emerald-200/80 text-[8px] mt-0.5 font-semibold">{label}</div>}
          </div>
        );
      }
      case 'weather': {
        return <LiveWeatherWidget zone={zone} />;
      }
      case 'ticker': {
        const text = zone.contentData?.tickerText || 'Breaking News: Welcome to Enterprise Digital Signage Platform • All systems operational';
        const speed = zone.contentData?.tickerSpeed || 60;
        return (
          <div className="h-full bg-gradient-to-r from-amber-950 to-slate-950 flex items-center overflow-hidden">
            <div
              className="whitespace-nowrap text-amber-300 text-xs font-semibold animate-marquee"
              style={{ animation: `marquee ${Math.max(5, text.length * 100 / speed)}s linear infinite` }}
            >
              {text} &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp; {text}
            </div>
          </div>
        );
      }
      case 'announcement': {
        const header = zone.contentData?.announcementHeader || 'NOTICE';
        const body = zone.contentData?.announcementBody || 'Important announcement will appear here.';
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-rose-950 to-slate-950 p-2 text-center">
            <AlertTriangle className="h-4 w-4 text-rose-400 mb-1" />
            <div className="text-rose-300 font-bold text-[10px] uppercase">{header}</div>
            <div className="text-rose-200/70 text-[8px] mt-0.5 line-clamp-3">{body}</div>
          </div>
        );
      }
      case 'webpage': {
        const url = zone.contentData?.webUrl || 'https://example.com';
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-indigo-950 to-slate-950 p-2">
            <Globe className="h-5 w-5 text-indigo-400 mb-1" />
            <div className="text-indigo-300 text-[8px] truncate max-w-full">{url}</div>
            <div className="text-indigo-200/40 text-[7px] mt-0.5">Web Embed</div>
          </div>
        );
      }
      case 'video': {
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-cyan-950 to-slate-950 p-2">
            <Film className="h-6 w-6 text-cyan-400 mb-1 opacity-60" />
            <div className="text-cyan-300/60 text-[9px]">Video Player</div>
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400/40 flex items-center justify-center mt-1">
              <div className="w-0 h-0 border-l-[6px] border-l-cyan-400/60 border-y-[4px] border-y-transparent ml-0.5" />
            </div>
          </div>
        );
      }
      case 'image': {
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-violet-950 to-slate-950 p-2">
            <Image className="h-6 w-6 text-violet-400 mb-1 opacity-60" />
            <div className="text-violet-300/60 text-[9px]">Image Gallery</div>
          </div>
        );
      }
      case 'rss': {
        return <LiveRssWidget zone={zone} />;
      }
      case 'youtube': {
        const videoId = zone.contentData?.youtubeVideoId || '';
        const extractedId = videoId.includes('watch?v=')
          ? videoId.split('watch?v=')[1]?.split('&')[0]
          : videoId.includes('youtu.be/')
          ? videoId.split('youtu.be/')[1]?.split('?')[0]
          : videoId;
        const autoplay = zone.contentData?.youtubeAutoplay !== false;
        const muted = zone.contentData?.youtubeMuted !== false;
        const loop = zone.contentData?.youtubeLoop !== false;

        if (extractedId) {
          const params = new URLSearchParams({
            autoplay: autoplay ? '1' : '0',
            mute: muted ? '1' : '0',
            loop: loop ? '1' : '0',
            playlist: loop ? extractedId : '',
            controls: '0',
            modestbranding: '1',
          }).toString();
          return (
            <iframe
              src={`https://www.youtube.com/embed/${extractedId}?${params}`}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          );
        }
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-red-950 to-slate-950 p-2">
            <Youtube className="h-7 w-7 text-red-400 mb-1" />
            <div className="text-red-300/60 text-[9px]">YouTube Player</div>
            <div className="text-red-200/40 text-[7px] mt-0.5">Enter Video ID to preview</div>
          </div>
        );
      }
      case 'google_calendar': {
        return <LiveCalendarWidget zone={zone} />;
      }
      case 'google_sheets': {
        const sheetUrl = zone.contentData?.googleSheetsUrl || '';
        const range = zone.contentData?.googleSheetsRange || 'A1:D5';
        const mockData = [
          ['Product', 'Q1', 'Q2', 'Q3'],
          ['Widget A', '1,234', '1,456', '1,789'],
          ['Widget B', '987', '1,100', '1,300'],
          ['Widget C', '2,100', '2,400', '2,800'],
        ];
        return (
          <div className="h-full bg-gradient-to-br from-green-950 to-slate-950 p-2 flex flex-col overflow-hidden">
            <div className="flex items-center space-x-1 mb-1.5 shrink-0">
              <Table className="h-3 w-3 text-green-400" />
              <span className="text-green-300 text-[8px] font-bold">Spreadsheet</span>
              <span className="text-green-400/40 text-[6px] ml-auto">{range}</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <table className="w-full text-[7px]">
                <thead>
                  <tr>
                    {mockData[0].map((h, i) => (
                      <th key={i} className="text-green-300/80 font-semibold text-left px-0.5 py-0.5 border-b border-green-800/30">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockData.slice(1).map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="text-green-200/60 px-0.5 py-0.5 border-b border-green-900/20">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!sheetUrl && <div className="text-green-400/40 text-[6px] mt-1 shrink-0">Configure Sheet URL for live data</div>}
          </div>
        );
      }
      case 'world_clock': {
        const cities = zone.contentData?.worldClockCities || [
          { label: 'Bangkok', timezone: 'Asia/Bangkok' },
          { label: 'Tokyo', timezone: 'Asia/Tokyo' },
          { label: 'New York', timezone: 'America/New_York' },
        ];
        return (
          <div className="h-full bg-gradient-to-br from-slate-950 to-teal-950 p-2 flex flex-col overflow-hidden">
            <div className="flex items-center space-x-1 mb-1 shrink-0">
              <Globe className="h-3 w-3 text-teal-400" />
              <span className="text-teal-300 text-[7px] font-bold">World Clock</span>
            </div>
            <div className="flex-1 space-y-0.5 overflow-hidden">
              {cities.slice(0, 4).map((c, i) => (
                <div key={i} className="flex justify-between items-center bg-teal-900/20 rounded px-1 py-0.5">
                  <span className="text-teal-200/60 text-[7px]">{c.label}</span>
                  <span className="text-teal-400 text-[8px] font-mono font-bold">
                    {time.toLocaleTimeString('en-US', { timeZone: c.timezone, hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'menu_board': {
        const title = zone.contentData?.menuBoardTitle || 'Menu';
        return (
          <div className="h-full bg-gradient-to-br from-slate-950 to-yellow-950 p-2 flex flex-col items-center justify-center">
            <UtensilsCrossed className="h-4 w-4 text-yellow-400 mb-1" />
            <span className="text-yellow-300 text-[8px] font-bold">{title}</span>
            <span className="text-yellow-200/40 text-[7px] mt-0.5">Menu Board</span>
          </div>
        );
      }
      case 'countdown': {
        const target = zone.contentData?.countdownTarget ? new Date(zone.contentData.countdownTarget) : new Date(Date.now() + 86400000);
        const label = zone.contentData?.countdownLabel || 'Event';
        const diff = Math.max(0, target.getTime() - time.getTime());
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return (
          <div className="h-full bg-gradient-to-br from-pink-950 to-slate-950 p-2 flex flex-col items-center justify-center">
            <span className="text-pink-200/50 text-[7px] mb-0.5">{label}</span>
            <span className="text-pink-300 font-mono font-bold text-sm">{String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}</span>
          </div>
        );
      }
      case 'currencies': {
        return (
          <div className="h-full bg-gradient-to-br from-slate-950 to-lime-950 p-2 flex flex-col items-center justify-center">
            <TrendingUp className="h-4 w-4 text-lime-400 mb-1" />
            <span className="text-lime-300 text-[8px] font-bold">Exchange Rates</span>
            <span className="text-lime-200/40 text-[7px]">Live Data</span>
          </div>
        );
      }
      case 'hls_stream': {
        return (
          <div className="h-full bg-gradient-to-br from-fuchsia-950 to-slate-950 p-2 flex flex-col items-center justify-center">
            <Tv className="h-4 w-4 text-fuchsia-400 mb-1" />
            <span className="text-fuchsia-300 text-[8px] font-bold">Live Stream</span>
            <span className="text-fuchsia-200/40 text-[7px]">.m3u8</span>
          </div>
        );
      }
      default:
        return <div className="flex items-center justify-center h-full text-slate-500 text-xs">Widget</div>;
    }
  };

  // === Resize handle positions ===
  const resizeHandles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
  const getHandleStyle = (dir: string): React.CSSProperties => {
    const base: React.CSSProperties = { position: 'absolute', width: '10px', height: '10px', borderRadius: '2px', background: '#06b6d4', border: '1px solid #0e7490', zIndex: 50 };
    if (dir.includes('n')) { base.top = '-5px'; } else if (dir.includes('s')) { base.bottom = '-5px'; } else { base.top = '50%'; base.marginTop = '-5px'; }
    if (dir.includes('w')) { base.left = '-5px'; } else if (dir.includes('e')) { base.right = '-5px'; } else { base.left = '50%'; base.marginLeft = '-5px'; }
    const cursorMap: Record<string, string> = { n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize' };
    base.cursor = cursorMap[dir] || 'move';
    return base;
  };

  return (
    <div className="space-y-5">

      {/* ===== Top Controls Bar ===== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Layers className="h-5 w-5 text-cyan-400" />
            <span>Smart Layout Builder</span>
            <span className="ml-2 text-[10px] font-semibold bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Pro</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Drag widgets onto the canvas to compose multi-zone layouts with precision snap-to-grid</p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap">
          {/* Saved layouts selector (if any exist in store) */}
          {layouts.length > 0 && (
            <select
              value={selectedLayoutId}
              onChange={(e) => {
                setSelectedLayoutId(e.target.value);
                const target = effectiveLayouts.find((l) => l.id === e.target.value);
                if (target?.zones[0]) setActiveZoneId(target.zones[0].id);
              }}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-semibold max-w-[200px]"
            >
              {layouts.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          )}

          {/* Current template indicator (when using defaults) */}
          {layouts.length === 0 && (
            <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
              <span className="text-xs text-slate-300 font-semibold truncate max-w-[160px]">{activeLayout.name}</span>
              <span className="text-[10px] text-slate-500">({activeLayout.aspectRatio})</span>
            </div>
          )}

          {/* Publish/Draft Badge + Toggle */}
          {activeLayout && layouts.length > 0 && (
            <button
              onClick={() => {
                const newStatus = activeLayout.status === 'published' ? 'draft' : 'published';
                updateLayout(activeLayout.id, { status: newStatus } as any);
              }}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                activeLayout.status === 'published'
                  ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                  : 'bg-amber-950 border-amber-700 text-amber-300'
              }`}
              title={activeLayout.status === 'published' ? 'Click to set as Draft' : 'Click to Publish'}
            >
              <span className={`w-2 h-2 rounded-full ${activeLayout.status === 'published' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{activeLayout.status === 'published' ? 'Published' : 'Draft'}</span>
            </button>
          )}

          <button
            onClick={() => setShowTemplateGallery(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Templates</span>
          </button>

          <button onClick={() => setIsCreatingNew(true)} className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer">
            <Plus className="h-4 w-4" />
            <span>Blank</span>
          </button>

          <button
            onClick={() => setShowApiKeysModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs border border-slate-600 transition-all cursor-pointer"
            title="Configure API Keys"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ===== Main 3-Column Layout: Widget Panel | Canvas | Inspector ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* === LEFT: Widget Panel (Categorized) === */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl flex flex-col max-h-[720px]">
          {/* Header */}
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5 mb-2 shrink-0">
            <Palette className="h-4 w-4 text-violet-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Widgets</h3>
            <span className="text-[9px] text-slate-500 ml-auto">{WIDGET_DEFINITIONS.length}</span>
          </div>

          {/* Search */}
          <div className="relative mb-2 shrink-0">
            <input
              type="text"
              value={widgetSearch}
              onChange={(e) => setWidgetSearch(e.target.value)}
              placeholder="Search widgets..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-2 py-1.5 text-[10px] text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-600"
            />
            <svg className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8" strokeWidth="2"/><path d="m21 21-4.3-4.3" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>

          {/* Scrollable widget list */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 scrollbar-thin">

            {/* ⭐ Favourites Section */}
            {favouriteWidgets.length > 0 && !widgetSearch && (
              <div className="mb-2">
                <div className="flex items-center space-x-1.5 px-1 py-1 text-[9px] font-bold text-yellow-400 uppercase tracking-wider">
                  <span>⭐</span>
                  <span>Favourites</span>
                </div>
                <div className="space-y-1">
                  {favouriteWidgets.map((type) => {
                    const widget = WIDGET_DEFINITIONS.find(w => w.type === type);
                    if (!widget) return null;
                    return (
                      <div
                        key={`fav-${widget.type}`}
                        draggable
                        onDragStart={(e) => handleWidgetDragStart(e, widget)}
                        className="flex items-center space-x-2 p-2 rounded-lg border border-yellow-800/30 bg-yellow-950/20 cursor-grab active:cursor-grabbing hover:border-yellow-600/50 hover:bg-yellow-950/30 transition-all group select-none"
                      >
                        <div className="flex items-center justify-center w-6 h-6 rounded bg-slate-800 text-slate-300 shrink-0">
                          {React.cloneElement(widget.icon as React.ReactElement, { className: 'h-3.5 w-3.5' })}
                        </div>
                        <span className="text-[10px] font-medium text-slate-200 truncate flex-1">{widget.label}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavourite(widget.type); }}
                          className="text-yellow-400 hover:text-yellow-300 shrink-0"
                          title="Remove from favourites"
                        >
                          <span className="text-[10px]">★</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Categories */}
            {WIDGET_CATEGORIES.map((category) => {
              const categoryWidgets = category.widgets
                .map(type => WIDGET_DEFINITIONS.find(w => w.type === type))
                .filter(Boolean) as WidgetDef[];

              // Apply search filter + disabled filter
              const filtered = categoryWidgets
                .filter(w => !disabledWidgets.includes(w.type))
                .filter(w => widgetSearch
                  ? w.label.toLowerCase().includes(widgetSearch.toLowerCase()) || w.type.includes(widgetSearch.toLowerCase())
                  : true
                );

              if (filtered.length === 0) return null;

              const isCollapsed = collapsedCategories[category.id] && !widgetSearch;

              return (
                <div key={category.id} className="mb-1">
                  {/* Category Header (clickable to collapse) */}
                  <button
                    onClick={() => setCollapsedCategories(prev => ({ ...prev, [category.id]: !prev[category.id] }))}
                    className={`w-full flex items-center space-x-1.5 px-1.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors hover:bg-slate-800/50 text-${category.color}-400`}
                  >
                    {category.icon}
                    <span className="flex-1 text-left">{category.label}</span>
                    <span className="text-slate-600 text-[8px] font-normal">{filtered.length}</span>
                    <svg className={`h-3 w-3 text-slate-600 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7"/></svg>
                  </button>

                  {/* Widget Items */}
                  {!isCollapsed && (
                    <div className="space-y-0.5 mt-0.5">
                      {filtered.map((widget) => {
                        const isFav = favouriteWidgets.includes(widget.type);
                        return (
                          <div
                            key={widget.type}
                            draggable
                            onDragStart={(e) => handleWidgetDragStart(e, widget)}
                            className={`flex items-center space-x-2 p-1.5 rounded-lg border border-slate-700/50 bg-slate-800/30 cursor-grab active:cursor-grabbing hover:border-slate-600 hover:bg-slate-800/60 transition-all group select-none`}
                          >
                            <div className={`flex items-center justify-center w-6 h-6 rounded bg-${widget.color}-500/10 border border-${widget.color}-500/20 text-${widget.color}-400 shrink-0`}>
                              {React.cloneElement(widget.icon as React.ReactElement, { className: 'h-3.5 w-3.5' })}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-medium text-slate-200 truncate">{widget.label}</p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleFavourite(widget.type); }}
                              className={`shrink-0 text-[10px] transition-colors ${isFav ? 'text-yellow-400' : 'text-slate-700 hover:text-yellow-500 opacity-0 group-hover:opacity-100'}`}
                              title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                            >
                              {isFav ? '★' : '☆'}
                            </button>
                            <GripVertical className="h-3 w-3 text-slate-700 group-hover:text-slate-500 shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Blank Zone button */}
          <button
            onClick={handleAddZone}
            className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold border border-slate-700 border-dashed mt-2 transition-colors shrink-0"
          >
            <Plus className="h-3 w-3 text-cyan-400" />
            <span>Blank Zone</span>
          </button>
        </div>

        {/* === CENTER: Interactive Canvas Studio (7 cols) === */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
          {/* Canvas Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950 px-2 py-1 rounded border border-cyan-800">
                {activeLayout.orientation.toUpperCase()} {activeLayout.aspectRatio}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{activeLayout.widthPx}×{activeLayout.heightPx}px</span>
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Snap Toggle */}
              <button
                onClick={() => setSnapEnabled(!snapEnabled)}
                className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                  snapEnabled ? 'bg-cyan-950 border-cyan-700 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title="Toggle snap-to-grid"
              >
                <Magnet className="h-3 w-3" />
                <span>Snap</span>
              </button>

              {/* Grid Toggle */}
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                  showGrid ? 'bg-violet-950 border-violet-700 text-violet-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title="Toggle grid overlay"
              >
                <Grid3X3 className="h-3 w-3" />
                <span>Grid</span>
              </button>

              {/* Undo */}
              <button
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className="flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-semibold border bg-slate-800 border-slate-700 text-slate-400 hover:text-white disabled:opacity-40 transition-all"
                title="Undo last change"
              >
                <RotateCcw className="h-3 w-3" />
              </button>

              {/* Zoom */}
              <div className="flex items-center space-x-1 bg-slate-800 border border-slate-700 rounded-lg px-1.5 py-0.5">
                <button onClick={() => setZoomLevel(Math.max(60, zoomLevel - 10))} className="text-slate-400 hover:text-white"><ZoomOut className="h-3 w-3" /></button>
                <span className="text-[10px] text-slate-300 font-mono w-8 text-center">{zoomLevel}%</span>
                <button onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))} className="text-slate-400 hover:text-white"><ZoomIn className="h-3 w-3" /></button>
              </div>

              {/* Preview Toggle */}
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                  previewMode ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/30' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title="Toggle live preview"
              >
                <Eye className="h-3 w-3" />
                <span>{previewMode ? 'LIVE' : 'Preview'}</span>
              </button>
            </div>
          </div>

          {/* Marquee animation for ticker preview */}
          {previewMode && (
            <style>{`
              @keyframes marquee {
                0% { transform: translateX(0%); }
                100% { transform: translateX(-50%); }
              }
              .animate-marquee { animation: marquee 15s linear infinite; }
            `}</style>
          )}

          {/* Canvas Drop Area */}
          <div
            className={`w-full flex items-center justify-center p-4 rounded-xl border-2 border-dashed transition-all min-h-[400px] ${
              dragOverCanvas
                ? 'border-cyan-400 bg-cyan-950/20 shadow-[inset_0_0_30px_rgba(6,182,212,0.1)]'
                : 'border-slate-800 bg-slate-950/60'
            }`}
            onDragOver={handleCanvasDragOver}
            onDragLeave={handleCanvasDragLeave}
            onDrop={handleCanvasDrop}
          >
            <div
              ref={canvasRef}
              className={`relative bg-slate-900 border-2 border-slate-700 rounded-xl overflow-hidden shadow-2xl transition-all ${
                activeLayout.orientation === 'portrait' ? 'w-[240px] h-[420px]' : 'w-full max-w-[600px] aspect-video'
              }`}
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }}
            >
              {/* Grid Overlay */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none z-[5]" style={{
                  backgroundImage: `linear-gradient(rgba(100,116,139,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.15) 1px, transparent 1px)`,
                  backgroundSize: `${GRID_SIZE}% ${GRID_SIZE}%`
                }} />
              )}

              {/* Drop hint */}
              {dragOverCanvas && (
                <div className="absolute inset-0 flex items-center justify-center z-[60] pointer-events-none">
                  <div className="bg-cyan-500/20 border border-cyan-400/50 rounded-xl px-4 py-2 backdrop-blur-sm">
                    <p className="text-cyan-300 text-xs font-bold">Drop widget here</p>
                  </div>
                </div>
              )}

              {/* Zones Rendered */}
              {activeLayout.zones.map((zone) => {
                const isSelected = zone.id === activeZoneId;
                const assignedPlaylist = playlists.find((p) => p.id === zone.playlistId);

                // === PREVIEW MODE: render live widget content ===
                if (previewMode) {
                  return (
                    <div
                      key={zone.id}
                      className="absolute overflow-hidden border border-slate-700/30"
                      style={{
                        left: `${zone.x}%`,
                        top: `${zone.y}%`,
                        width: `${zone.width}%`,
                        height: `${zone.height}%`,
                        zIndex: zone.zIndex,
                      }}
                    >
                      <LiveWidgetContent zone={zone} />
                    </div>
                  );
                }

                // === EDIT MODE: render interactive zones ===
                return (
                  <div
                    key={zone.id}
                    onMouseDown={(e) => handleZoneMouseDown(e, zone)}
                    className={`absolute flex flex-col justify-between border-2 transition-colors select-none overflow-hidden ${
                      isSelected
                        ? `border-cyan-400 ring-2 ring-cyan-400/30 z-30 ${getZoneBgColor(zone.mediaType)}`
                        : `${getZoneBorderColor(zone.mediaType)} ${getZoneBgColor(zone.mediaType)} hover:border-slate-400 hover:z-20`
                    }`}
                    style={{
                      left: `${zone.x}%`,
                      top: `${zone.y}%`,
                      width: `${zone.width}%`,
                      height: `${zone.height}%`,
                      zIndex: isSelected ? 30 : zone.zIndex,
                      cursor: isDraggingZone && isSelected ? 'grabbing' : 'grab',
                    }}
                  >
                    {/* Zone Header */}
                    <div className="flex items-center justify-between text-[9px] font-bold text-white bg-slate-950/80 px-1.5 py-0.5">
                      <div className="flex items-center space-x-1 truncate">
                        {getMediaTypeIcon(zone.mediaType)}
                        <span className="truncate">{zone.name}</span>
                      </div>
                      <span className="text-cyan-400 font-mono text-[8px]">z{zone.zIndex}</span>
                    </div>

                    {/* Zone Body */}
                    <div className="flex-1 flex items-center justify-center p-1">
                      <div className="text-center">
                        {zone.mediaType && (
                          <div className="mb-0.5 opacity-40">
                            {React.cloneElement(getMediaTypeIcon(zone.mediaType) as React.ReactElement, { className: 'h-6 w-6 mx-auto' })}
                          </div>
                        )}
                        <p className="text-[8px] text-slate-400 font-medium truncate">
                          {assignedPlaylist ? assignedPlaylist.name : zone.mediaType || 'Empty'}
                        </p>
                      </div>
                    </div>

                    {/* Zone Footer */}
                    <div className="flex items-center justify-between text-[8px] text-slate-500 px-1.5 py-0.5 bg-slate-950/60">
                      <span className="font-mono">{Math.round(zone.x)},{Math.round(zone.y)}</span>
                      <span className="font-mono">{Math.round(zone.width)}×{Math.round(zone.height)}%</span>
                    </div>

                    {/* Resize Handles (only on selected zone) */}
                    {isSelected && !isDraggingZone && resizeHandles.map((dir) => (
                      <div
                        key={dir}
                        style={getHandleStyle(dir)}
                        onMouseDown={(e) => handleResizeMouseDown(e, zone, dir)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Canvas Status Bar */}
          <div className="text-[10px] text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <Move className="h-3 w-3 text-cyan-400" />
                <span>Drag to move</span>
              </span>
              <span className="text-slate-600">|</span>
              <span>Handles to resize</span>
              <span className="text-slate-600">|</span>
              <span>Snap: <span className={snapEnabled ? 'text-cyan-400 font-semibold' : 'text-slate-500'}>{snapEnabled ? `${GRID_SIZE}%` : 'OFF'}</span></span>
            </div>
            <span className="font-semibold text-cyan-400">{activeLayout.zones.length} Zones</span>
          </div>
        </div>

        {/* === RIGHT: Zone Inspector Panel (3 cols) === */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl max-h-[680px] overflow-y-auto">
          <h3 className="text-xs font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Settings className="h-4 w-4 text-cyan-400" />
            <span>Zone Inspector</span>
          </h3>

          {selectedZone ? (
            <div className="space-y-3">
              {/* Zone Name + Lock Toggle */}
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Name</label>
                  <input
                    type="text"
                    value={selectedZone.name}
                    onChange={(e) => handleUpdateZoneProps(selectedZone.id, { name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    disabled={selectedZone.isLocked}
                  />
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => handleUpdateZoneProps(selectedZone.id, { isLocked: !selectedZone.isLocked })}
                    className={`p-1.5 rounded-lg border transition-all ${
                      selectedZone.isLocked
                        ? 'bg-amber-950 border-amber-700 text-amber-400'
                        : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'
                    }`}
                    title={selectedZone.isLocked ? 'Unlock zone (admin only can edit)' : 'Lock zone (prevent staff from editing)'}
                  >
                    {selectedZone.isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              {selectedZone.isLocked && (
                <div className="bg-amber-950/30 border border-amber-800/30 rounded-lg px-2.5 py-1.5 text-[9px] text-amber-300">
                  🔒 Zone locked — only admins can modify this zone's settings
                </div>
              )}

              {/* Media Type */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Widget Type</label>
                <select
                  value={selectedZone.mediaType || ''}
                  onChange={(e) => handleUpdateZoneProps(selectedZone.id, { mediaType: (e.target.value || undefined) as MediaType | undefined })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- None --</option>
                  {WIDGET_DEFINITIONS.map((w) => (
                    <option key={w.type} value={w.type}>{w.label}</option>
                  ))}
                </select>
              </div>

              {/* Playlist Assignment */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Zone Default Playlist
                  <span className="ml-1 text-[8px] text-slate-600 font-normal">(ต่ำสุด — ถูก override โดย Schedule)</span>
                </label>
                <select
                  value={selectedZone.playlistId || ''}
                  onChange={(e) => handleUpdateZoneProps(selectedZone.id, { playlistId: e.target.value || undefined })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- No Playlist --</option>
                  {playlists.map((pl) => (
                    <option key={pl.id} value={pl.id}>{pl.name} ({pl.items.length} items)</option>
                  ))}
                </select>
                <p className="text-[8px] text-slate-600 mt-0.5">💡 ใช้เมื่อไม่มี Schedule หรือ Screen Config override</p>
              </div>

              {/* === Widget Configuration Panel === */}
              {selectedZone.mediaType && (
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2.5">
                  <span className="text-[10px] font-bold text-violet-400 block uppercase tracking-wider">
                    Widget Settings — {selectedZone.mediaType}
                  </span>

                  {/* Clock Config */}
                  {selectedZone.mediaType === 'clock' && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Timezone</label>
                        <select
                          value={selectedZone.contentData?.timezone || 'Asia/Bangkok'}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, timezone: e.target.value } })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        >
                          <optgroup label="Asia">
                            <option value="Asia/Bangkok">Phuket / Bangkok (GMT+7)</option>
                            <option value="Asia/Tokyo">Tokyo, Japan (GMT+9)</option>
                            <option value="Asia/Shanghai">Shanghai, China (GMT+8)</option>
                            <option value="Asia/Singapore">Singapore (GMT+8)</option>
                            <option value="Asia/Dubai">Dubai, UAE (GMT+4)</option>
                            <option value="Asia/Kolkata">Mumbai, India (GMT+5:30)</option>
                            <option value="Asia/Seoul">Seoul, Korea (GMT+9)</option>
                            <option value="Asia/Hong_Kong">Hong Kong (GMT+8)</option>
                          </optgroup>
                          <optgroup label="Americas">
                            <option value="America/New_York">New York (GMT-5)</option>
                            <option value="America/Chicago">Chicago (GMT-6)</option>
                            <option value="America/Los_Angeles">Los Angeles (GMT-8)</option>
                            <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                          </optgroup>
                          <optgroup label="Europe">
                            <option value="Europe/London">London (GMT+0)</option>
                            <option value="Europe/Paris">Paris (GMT+1)</option>
                            <option value="Europe/Berlin">Berlin (GMT+1)</option>
                            <option value="Europe/Moscow">Moscow (GMT+3)</option>
                          </optgroup>
                          <optgroup label="Pacific / Oceania">
                            <option value="Australia/Sydney">Sydney (GMT+11)</option>
                            <option value="Pacific/Auckland">Auckland (GMT+12)</option>
                          </optgroup>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Label</label>
                        <input
                          type="text"
                          value={selectedZone.contentData?.clockLabel || ''}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, clockLabel: e.target.value } })}
                          placeholder="e.g. Phuket, Thailand"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Format</label>
                        <select
                          value={selectedZone.contentData?.clockFormat || '24h'}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, clockFormat: e.target.value as '12h' | '24h' } })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        >
                          <option value="24h">24-hour (14:30)</option>
                          <option value="12h">12-hour (2:30 PM)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Weather Config */}
                  {selectedZone.mediaType === 'weather' && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">City</label>
                        <input
                          type="text"
                          value={selectedZone.contentData?.weatherCity || ''}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, weatherCity: e.target.value } })}
                          placeholder="e.g. Phuket, TH"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Temperature Unit</label>
                        <select
                          value={selectedZone.contentData?.weatherUnit || 'celsius'}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, weatherUnit: e.target.value as 'celsius' | 'fahrenheit' } })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        >
                          <option value="celsius">Celsius (°C)</option>
                          <option value="fahrenheit">Fahrenheit (°F)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Ticker Config */}
                  {selectedZone.mediaType === 'ticker' && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Ticker Text</label>
                        <textarea
                          value={selectedZone.contentData?.tickerText || ''}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, tickerText: e.target.value } })}
                          placeholder="Breaking news or scrolling message..."
                          rows={3}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Speed (px/sec)</label>
                        <input
                          type="number"
                          min={10}
                          max={300}
                          value={selectedZone.contentData?.tickerSpeed || 60}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, tickerSpeed: Number(e.target.value) } })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Announcement Config */}
                  {selectedZone.mediaType === 'announcement' && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Header</label>
                        <input
                          type="text"
                          value={selectedZone.contentData?.announcementHeader || ''}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, announcementHeader: e.target.value } })}
                          placeholder="e.g. IMPORTANT NOTICE"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Body Message</label>
                        <textarea
                          value={selectedZone.contentData?.announcementBody || ''}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, announcementBody: e.target.value } })}
                          placeholder="Announcement content..."
                          rows={3}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Webpage Config */}
                  {selectedZone.mediaType === 'webpage' && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Web URL</label>
                        <input
                          type="url"
                          value={selectedZone.contentData?.webUrl || ''}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, webUrl: e.target.value } })}
                          placeholder="https://example.com"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Video / Image Config */}
                  {(selectedZone.mediaType === 'video' || selectedZone.mediaType === 'image') && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Source URL</label>
                        <input
                          type="url"
                          value={selectedZone.contentData?.sourceUrl || ''}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, sourceUrl: e.target.value } })}
                          placeholder={selectedZone.mediaType === 'video' ? 'https://cdn.example.com/video.mp4' : 'https://cdn.example.com/image.jpg'}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <p className="text-[9px] text-slate-600">Or assign a playlist above to use media library</p>
                    </div>
                  )}

                  {/* RSS Feed Config */}
                  {selectedZone.mediaType === 'rss' && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">RSS Feed URL</label>
                        <input
                          type="url"
                          value={selectedZone.contentData?.rssUrl || ''}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, rssUrl: e.target.value } })}
                          placeholder="https://feeds.bbci.co.uk/news/rss.xml"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Max Items</label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={selectedZone.contentData?.rssMaxItems || 5}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, rssMaxItems: Number(e.target.value) } })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Scroll Speed (px/sec)</label>
                        <input
                          type="number"
                          min={10}
                          max={200}
                          value={selectedZone.contentData?.rssScrollSpeed || 40}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, rssScrollSpeed: Number(e.target.value) } })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* YouTube Config */}
                  {selectedZone.mediaType === 'youtube' && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">YouTube Video ID or URL</label>
                        <input
                          type="text"
                          value={selectedZone.contentData?.youtubeVideoId || ''}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, youtubeVideoId: e.target.value } })}
                          placeholder="dQw4w9WgXcQ or full URL"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-1 text-[9px] text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedZone.contentData?.youtubeAutoplay ?? true}
                            onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, youtubeAutoplay: e.target.checked } })}
                            className="accent-red-500 w-3 h-3"
                          />
                          <span>Autoplay</span>
                        </label>
                        <label className="flex items-center space-x-1 text-[9px] text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedZone.contentData?.youtubeMuted ?? true}
                            onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, youtubeMuted: e.target.checked } })}
                            className="accent-red-500 w-3 h-3"
                          />
                          <span>Muted</span>
                        </label>
                        <label className="flex items-center space-x-1 text-[9px] text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedZone.contentData?.youtubeLoop ?? true}
                            onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, youtubeLoop: e.target.checked } })}
                            className="accent-red-500 w-3 h-3"
                          />
                          <span>Loop</span>
                        </label>
                      </div>
                      <p className="text-[9px] text-slate-600">Supports: youtube.com/watch?v=ID or youtu.be/ID</p>
                    </div>
                  )}

                  {/* Google Calendar Config */}
                  {selectedZone.mediaType === 'google_calendar' && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Calendar ID</label>
                        <input
                          type="text"
                          value={selectedZone.contentData?.googleCalendarId || ''}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, googleCalendarId: e.target.value } })}
                          placeholder="your-email@gmail.com or public calendar ID"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">API Key</label>
                        <input
                          type="password"
                          value={selectedZone.contentData?.googleCalendarApiKey || ''}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, googleCalendarApiKey: e.target.value } })}
                          placeholder="AIza..."
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Days Ahead</label>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={selectedZone.contentData?.googleCalendarDaysAhead || 7}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, googleCalendarDaysAhead: Number(e.target.value) } })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <p className="text-[9px] text-slate-600">Requires Google Calendar API key from console.cloud.google.com</p>
                    </div>
                  )}

                  {/* Google Sheets Config */}
                  {selectedZone.mediaType === 'google_sheets' && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Published Sheet URL</label>
                        <input
                          type="url"
                          value={selectedZone.contentData?.googleSheetsUrl || ''}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, googleSheetsUrl: e.target.value } })}
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Range (optional)</label>
                        <input
                          type="text"
                          value={selectedZone.contentData?.googleSheetsRange || ''}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, googleSheetsRange: e.target.value } })}
                          placeholder="Sheet1!A1:D10"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">API Key (optional, for private sheets)</label>
                        <input
                          type="password"
                          value={selectedZone.contentData?.googleSheetsApiKey || ''}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, googleSheetsApiKey: e.target.value } })}
                          placeholder="AIza..."
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <p className="text-[9px] text-slate-600">Publish sheet: File → Share → Publish to web</p>
                    </div>
                  )}

                  {/* World Clock Config */}
                  {selectedZone.mediaType === 'world_clock' && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Style</label>
                        <select
                          value={selectedZone.contentData?.worldClockStyle || 'digital'}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, worldClockStyle: e.target.value as any } })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        >
                          <option value="digital">Digital</option>
                          <option value="analog">Analog</option>
                          <option value="both">Both</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Cities (one per line: Label|Timezone)</label>
                        <textarea
                          value={(selectedZone.contentData?.worldClockCities || []).map(c => `${c.label}|${c.timezone}`).join('\n') || 'Phuket|Asia/Bangkok\nTokyo|Asia/Tokyo\nNew York|America/New_York\nLondon|Europe/London'}
                          onChange={(e) => {
                            const cities = e.target.value.split('\n').filter(l => l.trim()).map(l => {
                              const [label, timezone] = l.split('|');
                              return { label: (label || '').trim(), timezone: (timezone || '').trim() };
                            });
                            handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, worldClockCities: cities } });
                          }}
                          rows={4}
                          placeholder="Phuket|Asia/Bangkok&#10;Tokyo|Asia/Tokyo"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none resize-none"
                        />
                      </div>
                      <p className="text-[9px] text-slate-600">Format: City Name|IANA_Timezone</p>
                    </div>
                  )}

                  {/* Menu Board Config */}
                  {selectedZone.mediaType === 'menu_board' && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Board Title</label>
                        <input
                          type="text"
                          value={selectedZone.contentData?.menuBoardTitle || ''}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, menuBoardTitle: e.target.value } })}
                          placeholder="Today's Menu"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Currency Symbol</label>
                        <input
                          type="text"
                          value={selectedZone.contentData?.menuBoardCurrency || '฿'}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, menuBoardCurrency: e.target.value } })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Theme</label>
                        <select
                          value={selectedZone.contentData?.menuBoardTheme || 'dark'}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, menuBoardTheme: e.target.value as any } })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        >
                          <option value="dark">Dark</option>
                          <option value="light">Light</option>
                          <option value="neon">Neon</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Menu Items (JSON)</label>
                        <textarea
                          value={JSON.stringify(selectedZone.contentData?.menuBoardCategories || [{ name: 'Main Course', items: [{ name: 'Pad Thai', price: '120' }, { name: 'Green Curry', price: '150', highlight: true }] }], null, 1)}
                          onChange={(e) => { try { const cat = JSON.parse(e.target.value); handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, menuBoardCategories: cat } }); } catch {} }}
                          rows={5}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[9px] text-white font-mono focus:border-cyan-500 focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Countdown Config */}
                  {selectedZone.mediaType === 'countdown' && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Target Date & Time</label>
                        <input
                          type="datetime-local"
                          value={selectedZone.contentData?.countdownTarget?.slice(0, 16) || ''}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, countdownTarget: new Date(e.target.value).toISOString() } })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Label</label>
                        <input
                          type="text"
                          value={selectedZone.contentData?.countdownLabel || ''}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, countdownLabel: e.target.value } })}
                          placeholder="e.g. Grand Opening!"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Expired Text</label>
                        <input
                          type="text"
                          value={selectedZone.contentData?.countdownExpiredText || ''}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, countdownExpiredText: e.target.value } })}
                          placeholder="Event has started!"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Style</label>
                        <select
                          value={selectedZone.contentData?.countdownStyle || 'simple'}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, countdownStyle: e.target.value as any } })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        >
                          <option value="simple">Simple</option>
                          <option value="flip">Flip Clock</option>
                          <option value="circle">Circle Progress</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Currencies Config */}
                  {selectedZone.mediaType === 'currencies' && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Currency Pairs (one per line)</label>
                        <textarea
                          value={(selectedZone.contentData?.currencyPairs || ['USD/THB', 'EUR/THB', 'GBP/THB', 'JPY/THB']).join('\n')}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, currencyPairs: e.target.value.split('\n').filter(l => l.trim()) } })}
                          rows={4}
                          placeholder="USD/THB&#10;EUR/THB&#10;BTC/USD"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Refresh (seconds)</label>
                        <input
                          type="number"
                          min={30}
                          max={600}
                          value={selectedZone.contentData?.currencyRefreshSec || 60}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, currencyRefreshSec: Number(e.target.value) } })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <p className="text-[9px] text-slate-600">Requires external API for live rates</p>
                    </div>
                  )}

                  {/* HLS Live Stream Config */}
                  {selectedZone.mediaType === 'hls_stream' && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">HLS Stream URL (.m3u8)</label>
                        <input
                          type="url"
                          value={selectedZone.contentData?.hlsUrl || ''}
                          onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, hlsUrl: e.target.value } })}
                          placeholder="https://stream.example.com/live/stream.m3u8"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-1 text-[9px] text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedZone.contentData?.hlsAutoplay ?? true}
                            onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, hlsAutoplay: e.target.checked } })}
                            className="accent-fuchsia-500 w-3 h-3"
                          />
                          <span>Autoplay</span>
                        </label>
                        <label className="flex items-center space-x-1 text-[9px] text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedZone.contentData?.hlsMuted ?? true}
                            onChange={(e) => handleUpdateZoneProps(selectedZone.id, { contentData: { ...selectedZone.contentData, hlsMuted: e.target.checked } })}
                            className="accent-fuchsia-500 w-3 h-3"
                          />
                          <span>Muted</span>
                        </label>
                      </div>
                      <p className="text-[9px] text-slate-600">Supports .m3u8 HLS streams (CCTV, live TV, etc.)</p>
                    </div>
                  )}
                </div>
              )}

              {/* Coordinates */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2.5">
                <span className="text-[10px] font-bold text-cyan-400 block uppercase tracking-wider">Position & Size</span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-0.5">X (%)</label>
                    <input type="number" min={0} max={100} value={Math.round(selectedZone.x)}
                      onChange={(e) => { pushUndo(); handleUpdateZoneProps(selectedZone.id, { x: Number(e.target.value) }); }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-0.5">Y (%)</label>
                    <input type="number" min={0} max={100} value={Math.round(selectedZone.y)}
                      onChange={(e) => { pushUndo(); handleUpdateZoneProps(selectedZone.id, { y: Number(e.target.value) }); }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-0.5">Width (%)</label>
                    <input type="number" min={10} max={100} value={Math.round(selectedZone.width)}
                      onChange={(e) => { pushUndo(); handleUpdateZoneProps(selectedZone.id, { width: Number(e.target.value) }); }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-0.5">Height (%)</label>
                    <input type="number" min={10} max={100} value={Math.round(selectedZone.height)}
                      onChange={(e) => { pushUndo(); handleUpdateZoneProps(selectedZone.id, { height: Number(e.target.value) }); }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-0.5">Z-Index</label>
                    <input type="number" min={1} max={20} value={selectedZone.zIndex}
                      onChange={(e) => handleUpdateZoneProps(selectedZone.id, { zIndex: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-0.5">BG Color</label>
                    <input type="color" value={selectedZone.backgroundColor || '#1e293b'}
                      onChange={(e) => handleUpdateZoneProps(selectedZone.id, { backgroundColor: e.target.value })}
                      className="w-full h-7 bg-slate-900 border border-slate-700 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleDuplicateZone(selectedZone.id)}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition-colors"
                >
                  <Copy className="h-3 w-3" />
                  <span>Duplicate</span>
                </button>
                {activeLayout.zones.length > 1 && (
                  <button
                    onClick={() => handleDeleteZone(selectedZone.id)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 text-[10px] font-semibold border border-rose-800/50 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Layers className="h-8 w-8 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Select a zone on the canvas</p>
              <p className="text-[10px] text-slate-600 mt-1">or drag a widget to create one</p>
            </div>
          )}

          {/* Zone List */}
          <div className="border-t border-slate-800 pt-3 space-y-1.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">All Zones ({activeLayout.zones.length})</h4>
            {activeLayout.zones.map((zone) => (
              <div
                key={zone.id}
                onClick={() => setActiveZoneId(zone.id)}
                className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-all text-[10px] ${
                  zone.id === activeZoneId
                    ? 'bg-cyan-950/60 border border-cyan-700/50 text-cyan-200'
                    : 'bg-slate-800/50 border border-transparent hover:border-slate-700 text-slate-300'
                }`}
              >
                {getMediaTypeIcon(zone.mediaType)}
                <span className="flex-1 truncate font-medium">{zone.name}</span>
                <span className="text-slate-500 font-mono text-[8px]">z{zone.zIndex}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ===== Modal: Create New Template ===== */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-3">Create Smart Layout Template</h3>
            <form onSubmit={handleCreateNewLayout} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Template Name</label>
                <input
                  type="text"
                  placeholder="e.g. Executive Lobby Multi-Screen"
                  value={newLayoutName}
                  onChange={(e) => setNewLayoutName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Orientation</label>
                <select
                  value={newLayoutOrientation}
                  onChange={(e) => {
                    const orient = e.target.value as Orientation;
                    setNewLayoutOrientation(orient);
                    setNewLayoutAspectRatio(orient === 'portrait' ? '9:16' : '16:9');
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="landscape">Landscape Horizontal (16:9)</option>
                  <option value="portrait">Portrait Vertical (9:16)</option>
                </select>
              </div>
              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button type="button" onClick={() => setIsCreatingNew(false)} className="px-4 py-2 text-slate-400 hover:text-white">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 font-bold rounded-xl text-white">
                  Create Canvas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Template Gallery Modal ===== */}
      {showTemplateGallery && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
            {/* Gallery Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <LayoutGrid className="h-5 w-5 text-violet-400" />
                  <span>Template Gallery</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Select a layout template to start designing</p>
              </div>
              <button onClick={() => { setShowTemplateGallery(false); setPendingTemplate(null); }} className="text-slate-400 hover:text-white text-xl px-2">✕</button>
            </div>

            {/* Tab Switch */}
            <div className="px-5 pt-4 flex items-center space-x-2">
              <button
                onClick={() => setGalleryTab('landscape')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${galleryTab === 'landscape' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}
              >
                Landscape 16:9 ({TEMPLATE_LIBRARY.filter(t => t.orientation === 'landscape').length})
              </button>
              <button
                onClick={() => setGalleryTab('portrait')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${galleryTab === 'portrait' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}
              >
                Portrait 9:16 ({TEMPLATE_LIBRARY.filter(t => t.orientation === 'portrait').length})
              </button>
            </div>

            {/* Template Grid */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {TEMPLATE_LIBRARY.filter(t => t.orientation === galleryTab).map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`group cursor-pointer rounded-xl border-2 p-3 transition-all hover:shadow-xl ${
                      pendingTemplate?.id === tpl.id
                        ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-500/20'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
                    }`}
                  >
                    {/* Mini Canvas Preview */}
                    <div className={`relative bg-slate-950 rounded-lg overflow-hidden mb-2.5 border border-slate-700 ${
                      tpl.orientation === 'portrait' ? 'h-28 w-16 mx-auto' : 'h-20 w-full'
                    }`}>
                      {tpl.zones.map((zone, idx) => (
                        <div
                          key={idx}
                          className={`absolute border ${
                            zone.mediaType === 'video' ? 'bg-cyan-500/25 border-cyan-500/40' :
                            zone.mediaType === 'image' ? 'bg-violet-500/25 border-violet-500/40' :
                            zone.mediaType === 'ticker' ? 'bg-amber-500/25 border-amber-500/40' :
                            zone.mediaType === 'weather' ? 'bg-sky-500/25 border-sky-500/40' :
                            zone.mediaType === 'clock' ? 'bg-emerald-500/25 border-emerald-500/40' :
                            zone.mediaType === 'webpage' ? 'bg-indigo-500/25 border-indigo-500/40' :
                            zone.mediaType === 'announcement' ? 'bg-rose-500/25 border-rose-500/40' :
                            zone.mediaType === 'rss' ? 'bg-orange-500/25 border-orange-500/40' :
                            zone.mediaType === 'youtube' ? 'bg-red-500/25 border-red-500/40' :
                            zone.mediaType === 'google_calendar' ? 'bg-blue-500/25 border-blue-500/40' :
                            zone.mediaType === 'google_sheets' ? 'bg-green-500/25 border-green-500/40' :
                            zone.mediaType === 'world_clock' ? 'bg-teal-500/25 border-teal-500/40' :
                            zone.mediaType === 'menu_board' ? 'bg-yellow-500/25 border-yellow-500/40' :
                            zone.mediaType === 'countdown' ? 'bg-pink-500/25 border-pink-500/40' :
                            zone.mediaType === 'currencies' ? 'bg-lime-500/25 border-lime-500/40' :
                            zone.mediaType === 'hls_stream' ? 'bg-fuchsia-500/25 border-fuchsia-500/40' :
                            'bg-slate-700/40 border-slate-600/50'
                          }`}
                          style={{
                            left: `${zone.x}%`, top: `${zone.y}%`,
                            width: `${zone.width}%`, height: `${zone.height}%`,
                          }}
                        >
                          <span className="text-[6px] text-white/60 absolute inset-0 flex items-center justify-center font-bold truncate px-0.5">
                            {zone.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Template Info */}
                    <p className="text-[11px] font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">{tpl.name}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{tpl.zones.length} zones • {tpl.aspectRatio}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer with confirm/rename */}
            {pendingTemplate && (
              <div className="p-5 border-t border-slate-800 bg-slate-950/50">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">Name your layout</label>
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      placeholder="e.g. Lobby Main Display"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmTemplate(); }}
                    />
                  </div>
                  <button
                    onClick={handleConfirmTemplate}
                    className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-cyan-600/30 transition-all mt-4"
                  >
                    <Check className="h-4 w-4 inline mr-1" />
                    Use Template
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Based on: <span className="text-slate-300">{pendingTemplate.name}</span> • Saved layouts are available in Scheduler</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== API Keys Configuration Modal ===== */}
      {showApiKeysModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-cyan-400" />
                  <span>API Keys Configuration</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Required for live widget data from external services</p>
              </div>
              <button onClick={() => setShowApiKeysModal(false)} className="text-slate-400 hover:text-white text-xl px-2">✕</button>
            </div>

            <div className="p-5 space-y-5">
              {/* OpenWeather API */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2">
                  <CloudSun className="h-4 w-4 text-sky-400" />
                  <span className="text-sm font-semibold text-white">OpenWeather API</span>
                  {openWeatherApiKey && <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full">Active</span>}
                </div>
                <p className="text-[10px] text-slate-500">Get a free key at openweathermap.org/api</p>
                <input
                  type="password"
                  value={openWeatherApiKey}
                  onChange={(e) => setOpenWeatherApiKey(e.target.value)}
                  placeholder="Enter OpenWeather API key..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Google API Key */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-semibold text-white">Google API Key</span>
                  {googleApiKey && <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full">Active</span>}
                </div>
                <p className="text-[10px] text-slate-500">Used for Google Calendar & Sheets. Get from console.cloud.google.com</p>
                <input
                  type="password"
                  value={googleApiKey}
                  onChange={(e) => setGoogleApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Info */}
              <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-800">
                <p className="text-[10px] text-slate-400">
                  <strong className="text-slate-300">Note:</strong> API keys are stored locally in your browser. 
                  For production, configure them in the server environment (.env file).
                  YouTube and RSS Feed widgets work without API keys.
                </p>
              </div>
            </div>

            <div className="p-5 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowApiKeysModal(false)}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-sm transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
