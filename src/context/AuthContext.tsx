import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setSessionExpiredHandler } from '../lib/api';
import type { Role, User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// The session itself is an HttpOnly cookie. We only keep the email as a display hint.
const HINT_KEY = 'postprep_user';
const readHint = (): string | null => {
  try {
    return (JSON.parse(localStorage.getItem(HINT_KEY) ?? 'null') as { email?: string } | null)?.email ?? null;
  } catch {
    return null;
  }
};
const writeHint = (email: string | null) => {
  try {
    if (email) localStorage.setItem(HINT_KEY, JSON.stringify({ email }));
    else localStorage.removeItem(HINT_KEY);
  } catch {
    /* storage unavailable: the hint is optional */
  }
};

/**
 * The API has no "who am I" endpoint and the cookie is HttpOnly, so the role is probed:
 * the admin overview answers for ADMIN and is refused for everyone else.
 */
async function detectRole(): Promise<Role> {
  try {
    await api.get('/admin/dashboard', { skipAuthRefresh: true });
    return 'ADMIN';
  } catch {
    return 'USER';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Only visitors who signed in before need a session check; everyone else sees the login page instantly.
  const [loading, setLoading] = useState(() => readHint() !== null);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      writeHint(null);
      setUser(null);
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  useEffect(() => {
    const email = readHint();
    if (email === null) return;
    let alive = true;
    (async () => {
      try {
        await api.get('/article/myArticles'); // any authenticated call verifies the session
        const role = await detectRole();
        if (alive) setUser({ email, role });
      } catch {
        if (alive) {
          writeHint(null);
          setUser(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (rawEmail: string, password: string) => {
    // Registration stores lowercased emails and login compares exactly, so normalise here.
    const email = rawEmail.trim().toLowerCase();
    await api.post('/auth/login', { email, password });
    const role = await detectRole();
    writeHint(email);
    setUser({ email, role });
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    await api.post('/auth/register', { username: username.trim(), email: email.trim(), password });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', null, { skipAuthRefresh: true });
    } catch {
      /* cookies are cleared client-side by the next failed request anyway */
    }
    writeHint(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
