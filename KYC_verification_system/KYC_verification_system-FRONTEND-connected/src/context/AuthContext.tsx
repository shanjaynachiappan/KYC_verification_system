import { createContext, useContext, useState, type ReactNode } from 'react';
import { authService } from '../services';
import type { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  signIn: (username: string, password: string, remember: boolean) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (authService.isAuthenticated()) {
      const stored = localStorage.getItem('verifyline_user');
      if (stored) {
        try {
          return JSON.parse(stored) as AuthUser;
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const signIn = async (username: string, password: string, remember: boolean) => {
    const res = await authService.signIn(username, password);
    setUser(res.data);
    if (remember) {
      localStorage.setItem('verifyline_user', JSON.stringify(res.data));
    } else {
      sessionStorage.setItem('verifyline_user', JSON.stringify(res.data));
    }
  };

  const signOut = () => {
    authService.signOut();
    setUser(null);
    localStorage.removeItem('verifyline_user');
    sessionStorage.removeItem('verifyline_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
