import { useState, useEffect, useRef } from 'react';

// === Weather Data ===
export interface WeatherData {
  city: string;
  country: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
}

export function useWeatherData(city: string, unit: 'celsius' | 'fahrenheit', apiKey: string, enabled: boolean) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const lastFetch = useRef<number>(0);
  const cacheKey = useRef<string>('');

  useEffect(() => {
    if (!enabled || !city) return;

    const key = `${city}-${unit}-${apiKey}`;
    const now = Date.now();

    // Cache for 5 minutes
    if (key === cacheKey.current && now - lastFetch.current < 5 * 60 * 1000 && data) return;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      try {
        const units = unit === 'celsius' ? 'metric' : 'imperial';
        const params = new URLSearchParams({ city, units, ...(apiKey ? { apiKey } : {}) });
        const res = await fetch(`/api/widgets/weather?${params}`);
        const json = await res.json();

        if (!res.ok) {
          setError(json.error || 'Failed to fetch weather');
          return;
        }

        setData(json);
        lastFetch.current = Date.now();
        cacheKey.current = key;
      } catch (e: any) {
        setError(e.message || 'Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city, unit, apiKey, enabled]);

  return { data, error, loading };
}

// === RSS Feed Data ===
export interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

export interface RssData {
  title: string;
  items: RssItem[];
  fetchedAt: string;
}

export function useRssData(feedUrl: string, maxItems: number, enabled: boolean) {
  const [data, setData] = useState<RssData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const lastFetch = useRef<number>(0);
  const cacheKey = useRef<string>('');

  useEffect(() => {
    if (!enabled || !feedUrl) return;

    const key = `${feedUrl}-${maxItems}`;
    const now = Date.now();

    // Cache for 3 minutes
    if (key === cacheKey.current && now - lastFetch.current < 3 * 60 * 1000 && data) return;

    const fetchRss = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ url: feedUrl, max: String(maxItems) });
        const res = await fetch(`/api/widgets/rss?${params}`);
        const json = await res.json();

        if (!res.ok) {
          setError(json.error || 'Failed to fetch RSS');
          return;
        }

        setData(json);
        lastFetch.current = Date.now();
        cacheKey.current = key;
      } catch (e: any) {
        setError(e.message || 'Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchRss();
    // Refresh every 5 minutes
    const interval = setInterval(fetchRss, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [feedUrl, maxItems, enabled]);

  return { data, error, loading };
}

// === Google Calendar Data ===
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string;
  description: string;
}

export interface CalendarData {
  events: CalendarEvent[];
  fetchedAt: string;
}

export function useCalendarData(calendarId: string, apiKey: string, daysAhead: number, enabled: boolean) {
  const [data, setData] = useState<CalendarData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const lastFetch = useRef<number>(0);
  const cacheKey = useRef<string>('');

  useEffect(() => {
    if (!enabled || !calendarId || !apiKey) return;

    const key = `${calendarId}-${apiKey}-${daysAhead}`;
    const now = Date.now();

    // Cache for 5 minutes
    if (key === cacheKey.current && now - lastFetch.current < 5 * 60 * 1000 && data) return;

    const fetchCalendar = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ calendarId, apiKey, days: String(daysAhead) });
        const res = await fetch(`/api/widgets/calendar?${params}`);
        const json = await res.json();

        if (!res.ok) {
          setError(json.error || 'Failed to fetch calendar');
          return;
        }

        setData(json);
        lastFetch.current = Date.now();
        cacheKey.current = key;
      } catch (e: any) {
        setError(e.message || 'Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
    // Refresh every 10 minutes
    const interval = setInterval(fetchCalendar, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [calendarId, apiKey, daysAhead, enabled]);

  return { data, error, loading };
}
