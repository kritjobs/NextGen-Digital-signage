import { create } from 'zustand';
import { authApi, getStoredUser, clearTokens, getAccessToken } from '../services/api';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'admin' | 'staff' | 'viewer' | 'device';
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  loginError: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  isAuthenticated: !!getAccessToken(),
  isLoggingIn: false,
  loginError: null,

  login: async (email, password) => {
    set({ isLoggingIn: true, loginError: null });
    try {
      const data = await authApi.login(email, password);
      set({
        user: data.user,
        isAuthenticated: true,
        isLoggingIn: false,
        loginError: null,
      });
      return true;
    } catch (err: any) {
      set({
        isLoggingIn: false,
        loginError: err.message || 'Login failed',
      });
      return false;
    }
  },

  logout: async () => {
    await authApi.logout();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: () => {
    const token = getAccessToken();
    const user = getStoredUser();
    if (token && user) {
      set({ isAuthenticated: true, user });
    } else {
      set({ isAuthenticated: false, user: null });
      clearTokens();
    }
  },
}));

// Listen for forced logout (token expired + refresh failed)
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    useAuthStore.getState().logout();
  });
}
