/**
 * API Service Layer — with JWT Token Management
 * Auto-attach Bearer token, auto-refresh on 401, logout on failure
 */

const BASE_URL = '/api';

// ─── Token Storage ──────────────────────────────────────────
let accessToken: string | null = localStorage.getItem('signage_access_token');
let refreshToken: string | null = localStorage.getItem('signage_refresh_token');
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('signage_access_token', access);
  localStorage.setItem('signage_refresh_token', refresh);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('signage_access_token');
  localStorage.removeItem('signage_refresh_token');
  localStorage.removeItem('signage_user');
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getStoredUser() {
  const raw = localStorage.getItem('signage_user');
  return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user: any) {
  localStorage.setItem('signage_user', JSON.stringify(user));
}


// ─── Token Refresh Logic ────────────────────────────────────
async function doRefreshToken(): Promise<boolean> {
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return false;
    }
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

// ─── Core Request Function (with auto-refresh) ──────────────
interface RequestOptions extends RequestInit {
  /** If true, suppress auto-logout on auth failure (for background/scheduler calls) */
  silent?: boolean;
}

async function request<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  const { silent, ...fetchOptions } = options || {};
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions?.headers as Record<string, string> || {}),
  };

  // Attach token
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${BASE_URL}${endpoint}`, { ...fetchOptions, headers });

  // If 401, try refresh once
  if (res.status === 401 && refreshToken) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = doRefreshToken();
    }
    const refreshed = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;

    if (refreshed) {
      // Retry with new token
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(`${BASE_URL}${endpoint}`, { ...fetchOptions, headers });
    } else {
      if (!silent) {
        // Refresh failed — force logout (only for interactive requests)
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
      throw new Error('Session expired. Please login again.');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API Error: ${res.status}`);
  }
  return res.json();
}


// ─── Auth API (no token needed for login) ───────────────────
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    setStoredUser(data.user);
    return data;
  },

  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch { /* ignore */ }
    clearTokens();
  },

  me: () => request<any>('/auth/me'),

  refresh: doRefreshToken,
};

// ─── Screens ────────────────────────────────────────────────
export const screenApi = {
  getAll:  () => request<{ data: any[]; total: number }>('/screens'),
  getById: (id: string) => request<any>(`/screens/${id}`),
  create:  (data: any) => request<any>('/screens', { method: 'POST', body: JSON.stringify(data) }),
  update:  (id: string, data: any) => request<any>(`/screens/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  /** Silent update — won't trigger auto-logout on 401 (for scheduler background sync) */
  silentUpdate: (id: string, data: any) => request<any>(`/screens/${id}`, { method: 'PATCH', body: JSON.stringify(data), silent: true }),
  delete:  (id: string) => request<any>(`/screens/${id}`, { method: 'DELETE' }),
};

// ─── Media Items ────────────────────────────────────────────
export const mediaApi = {
  getAll:  (type?: string) => request<{ data: any[]; total: number }>(`/media${type ? `?type=${type}` : ''}`),
  getById: (id: string) => request<any>(`/media/${id}`),
  create:  (data: any) => request<any>('/media', { method: 'POST', body: JSON.stringify(data) }),
  delete:  (id: string) => request<any>(`/media/${id}`, { method: 'DELETE' }),
};

// ─── Layouts ────────────────────────────────────────────────
export const layoutApi = {
  getAll:  () => request<{ data: any[]; total: number }>('/layouts'),
  getById: (id: string) => request<any>(`/layouts/${id}`),
  create:  (data: any) => request<any>('/layouts', { method: 'POST', body: JSON.stringify(data) }),
  update:  (id: string, data: any) => request<any>(`/layouts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete:  (id: string) => request<any>(`/layouts/${id}`, { method: 'DELETE' }),
  /** Content Approval: admin อนุมัติ/ปฏิเสธ layout */
  approve: (id: string, approvalStatus: 'approved' | 'rejected' | 'pending') =>
    request<any>(`/layouts/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ approvalStatus }) }),
};

// ─── Playlists ──────────────────────────────────────────────
export const playlistApi = {
  getAll:  () => request<{ data: any[]; total: number }>('/playlists'),
  getById: (id: string) => request<any>(`/playlists/${id}`),
  create:  (data: any) => request<any>('/playlists', { method: 'POST', body: JSON.stringify(data) }),
  update:  (id: string, data: any) => request<any>(`/playlists/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete:  (id: string) => request<any>(`/playlists/${id}`, { method: 'DELETE' }),
  /** Content Approval: admin อนุมัติ/ปฏิเสธเพลย์ลิสต์ */
  approve: (id: string, approvalStatus: 'approved' | 'rejected' | 'pending') =>
    request<any>(`/playlists/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ approvalStatus }) }),
};

// ─── Schedules ──────────────────────────────────────────────
export const scheduleApi = {
  getAll:  () => request<{ data: any[]; total: number }>('/schedules'),
  create:  (data: any) => request<any>('/schedules', { method: 'POST', body: JSON.stringify(data) }),
  update:  (id: string, data: any) => request<any>(`/schedules/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete:  (id: string) => request<any>(`/schedules/${id}`, { method: 'DELETE' }),
};

// ─── Campaigns (REQ-011: ฝั่ง server แทน localStorage) ──────
export const campaignApi = {
  getAll: () => request<{ data: any[]; total: number }>('/campaigns'),
  create: (data: any) => request<any>('/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/campaigns/${id}`, { method: 'DELETE' }),
};

// ─── Emergency ──────────────────────────────────────────────
export const emergencyApi = {
  trigger: (data: any) => request<{ success: boolean; alert: any }>('/emergency/trigger', { method: 'POST', body: JSON.stringify(data) }),
  clear:   (alertId: string) => request<{ success: boolean }>('/emergency/clear', { method: 'POST', body: JSON.stringify({ alertId }) }),
};

// ─── Control ────────────────────────────────────────────────
export const controlApi = {
  sendCommand: (screenId: string, command: string, payload?: any) =>
    request<{ success: boolean }>('/control/command', { method: 'POST', body: JSON.stringify({ screenId, command, payload }) }),
};

// ─── Analytics ──────────────────────────────────────────────
export const analyticsApi = {
  getTelemetry:   (limit = 100, lang?: string) => request<{ data: any[]; total: number }>(`/analytics/telemetry?limit=${limit}${lang ? `&lang=${lang}` : ''}`),
  getProofOfPlay: (limit = 100) => request<{ data: any[]; total: number }>(`/analytics/proof-of-play?limit=${limit}`),
  getSummary:     () => request<any>('/analytics/summary'),
  // REQ-005: player รายงานการเล่นสื่อจริงเข้า server
  reportProofOfPlay: (pop: any) => request<{ success: boolean }>('/analytics/proof-of-play', { method: 'POST', body: JSON.stringify(pop) }),
};


// ─── Audit Logs (REQ-010) ──────────────────────────────────
export const auditApi = {
  getLogs: (params?: { action?: string; resource?: string; q?: string; limit?: number; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.action) qs.set('action', params.action);
    if (params?.resource) qs.set('resource', params.resource);
    if (params?.q) qs.set('q', params.q);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.page) qs.set('page', String(params.page));
    return request<{ data: any[]; total: number }>(`/audit-logs${qs.toString() ? `?${qs}` : ''}`);
  },
};

// ─── Live Screen Preview ────────────────────────────────────
export const monitoringApi = {
  // สถานะการแสดงผลล่าสุดของทุกจอ (จาก SCREEN_STATE ของ player)
  live: () => request<{ states: any[]; now: string }>('/monitoring/live'),
};

// ─── Backups (REQ-007) ─────────────────────────────────────
export const backupApi = {
  list: () => request<{ data: any[]; config: any; lastRun: string | null }>('/backups'),
  run: () => request<{ ok: boolean; data: any[]; lastRun: string | null }>('/backups/run', { method: 'POST' }),
  downloadUrl: (name: string) => `/api/backups/${encodeURIComponent(name)}/download`,
  remove: (name: string) => request<{ ok: boolean }>(`/backups/${encodeURIComponent(name)}`, { method: 'DELETE' }),
};

// ─── Slideshows ─────────────────────────────────────────────
export const slideshowApi = {
  getAll:     () => request<{ data: any[]; total: number }>('/slideshows'),
  getById:    (id: string) => request<any>(`/slideshows/${id}`),
  create:     (data: any) => request<any>('/slideshows', { method: 'POST', body: JSON.stringify(data) }),
  update:     (id: string, data: any) => request<any>(`/slideshows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete:     (id: string) => request<any>(`/slideshows/${id}`, { method: 'DELETE' }),
  publish:    (id: string) => request<any>(`/slideshows/${id}/publish`, { method: 'POST' }),
  unpublish:  (id: string) => request<any>(`/slideshows/${id}/unpublish`, { method: 'POST' }),
};


// ─── AI ─────────────────────────────────────────────────────
export const aiApi = {
  generate:     (task: string, prompt: string, options?: any) => request<any>('/ai/generate', { method: 'POST', body: JSON.stringify({ task, prompt, ...options }) }),
  getProviders: () => request<{ data: any[] }>('/ai/providers'),
  addProvider:  (data: any) => request<any>('/ai/providers', { method: 'POST', body: JSON.stringify(data) }),
  updateProvider: (id: string, data: any) => request<any>(`/ai/providers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProvider: (id: string) => request<any>(`/ai/providers/${id}`, { method: 'DELETE' }),
  testProvider: (id: string) => request<any>(`/ai/providers/${id}/test`, { method: 'POST' }),
  getTasks:     () => request<{ data: any[] }>('/ai/tasks'),
  updateTask:   (id: string, data: any) => request<any>(`/ai/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};
