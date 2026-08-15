import { create } from 'zustand';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'STUDENT' | 'ADMIN' | 'GRADER';
  tier: 'FREE' | 'GOLD' | 'PREMIUM';
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  activeSessionId: string | null;
  isLoading: boolean;
  error: string | null;

  setAuth: (user: UserProfile, token: string, activeSessionId?: string | null) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: string; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  activeSessionId: null,
  isLoading: false,
  error: null,

  setAuth: (user, token, activeSessionId = null) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ielts_token', token);
    }
    set({ user, accessToken: token, activeSessionId, error: null });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          device_fingerprint: typeof window !== 'undefined' ? window.navigator.userAgent : 'web-client',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.message || 'Authentication failed';
        set({ error: errorMsg, isLoading: false });
        return { success: false, error: errorMsg };
      }

      get().setAuth(data.user, data.access_token, data.active_session_id);
      set({ isLoading: false });
      return { success: true, role: data.user.role };
    } catch (err: any) {
      const msg = err.message || 'Could not connect to authentication server';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  logout: async () => {
    const token = get().accessToken;
    if (token) {
      try {
        await fetch('http://localhost:4000/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        console.error('Logout error', e);
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ielts_token');
    }
    set({ user: null, accessToken: null, activeSessionId: null });
  },

  checkSession: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('ielts_token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:4000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
        set({ user, accessToken: token });
      } else {
        localStorage.removeItem('ielts_token');
        set({ user: null, accessToken: null });
      }
    } catch {
      // Offline fallback
    }
  },
}));
