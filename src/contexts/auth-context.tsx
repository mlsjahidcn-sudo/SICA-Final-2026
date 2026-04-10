'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  role: string;
  full_name: string;
  avatar_url?: string;
  partner_id?: string;
  partner_role?: string;
  approval_status?: string;
  rejection_reason?: string;
}

interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role: string, partnerInfo?: Record<string, string>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
  /** Get a valid (possibly refreshed) access token, or null if not authenticated */
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'sica_auth_token';
const REFRESH_TOKEN_KEY = 'sica_refresh_token';
const EXPIRES_AT_KEY = 'sica_token_expires_at';
const USER_KEY = 'sica_user_data';

/** Refresh 5 minutes before expiry */
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    checkAuth();
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  // ─── Token Refresh ──────────────────────────────────────────────

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    // Deduplicate concurrent refresh calls
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      console.warn('[Auth] No refresh token available, clearing session');
      clearSession();
      return null;
    }

    refreshPromiseRef.current = (async () => {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) {
          console.warn('[Auth] Token refresh failed, clearing session');
          clearSession();
          return null;
        }

        const data = await response.json();
        const session: Session = data.session;

        // Persist new tokens
        localStorage.setItem(TOKEN_KEY, session.access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
        localStorage.setItem(EXPIRES_AT_KEY, String(session.expires_at));

        // Update user if returned
        if (data.user) {
          setUser(data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }

        // Schedule next proactive refresh
        scheduleTokenRefresh(session.expires_at);

        return session.access_token;
      } catch (error) {
        console.error('[Auth] Token refresh error:', error);
        clearSession();
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, []);

  /** Schedule a proactive refresh before the token expires */
  const scheduleTokenRefresh = useCallback((expiresAt: number) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    const expiresAtMs = expiresAt * 1000; // expires_at is in seconds
    const now = Date.now();
    const timeUntilRefresh = expiresAtMs - now - REFRESH_BUFFER_MS;

    if (timeUntilRefresh <= 0) {
      // Already within buffer — refresh now
      refreshAccessToken();
      return;
    }

    refreshTimerRef.current = setTimeout(() => {
      refreshAccessToken();
    }, timeUntilRefresh);
  }, [refreshAccessToken]);

  /** Get a valid access token, refreshing if necessary */
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiresAtStr = localStorage.getItem(EXPIRES_AT_KEY);

    if (!token) {
      return null;
    }

    // If we have expiry info, check if we need to refresh
    if (expiresAtStr) {
      const expiresAtMs = parseInt(expiresAtStr, 10) * 1000;
      const now = Date.now();

      if (now >= expiresAtMs - REFRESH_BUFFER_MS) {
        // Token is expired or about to expire — refresh
        return refreshAccessToken();
      }
    }

    return token;
  }, [refreshAccessToken]);

  // ─── Session Management ─────────────────────────────────────────

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));

        // Schedule proactive refresh if we have expires_at
        const expiresAtStr = localStorage.getItem(EXPIRES_AT_KEY);
        if (expiresAtStr) {
          scheduleTokenRefresh(parseInt(expiresAtStr, 10));
        }
      } else {
        // Try refresh once
        const newToken = await refreshAccessToken();
        if (newToken) {
          const retryResponse = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${newToken}`,
            },
          });
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            setUser(retryData.user);
            localStorage.setItem(USER_KEY, JSON.stringify(retryData.user));
          } else {
            clearSession();
          }
        } else {
          clearSession();
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      clearSession();
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, refreshAccessToken, scheduleTokenRefresh, clearSession]);

  // ─── Auth Actions ───────────────────────────────────────────────

  const signUp = async (email: string, password: string, fullName: string, role: string, partnerInfo?: Record<string, string>) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, fullName, role, partnerInfo }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: new Error(data.error || 'Sign up failed') };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: new Error(data.error || 'Sign in failed') };
      }

      // Store tokens and user data
      const session: Session = data.session;
      localStorage.setItem(TOKEN_KEY, session.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
      localStorage.setItem(EXPIRES_AT_KEY, String(session.expires_at));
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);

      // Schedule proactive refresh
      scheduleTokenRefresh(session.expires_at);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        await fetch('/api/auth/signout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Signout error:', error);
    } finally {
      clearSession();
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }, [getAccessToken]);

  const updateProfile = async (updates: Partial<User>) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        return { error: new Error('Not authenticated') };
      }

      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: new Error(data.error || 'Update failed') };
      }

      setUser(data.user);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateProfile, refreshUser, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
