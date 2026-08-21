import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUser } from '@/services/apiClient';

export type ThemeMode = 'light' | 'dark';

export interface UserInfo {
  username: string;
  userId?: string; // backend user_id (users.id) -- created on sign-up, required by every other endpoint
  aadhaar?: string;
  aadhaarName?: string;
  pan?: string;
  panName?: string;
  verifiedAt?: string;
  crossCheckPassed?: boolean;
  amlFlagged?: boolean;
  selfieSubmitted?: boolean;
  selfieMatchScore?: number;
  documentUploaded?: boolean;
  documentType?: string;
}

interface AppState {
  theme: ThemeMode;
  toggleTheme: () => void;
  isSignedUp: boolean;
  isSignedIn: boolean;
  user: UserInfo | null;
  signUp: (info: UserInfo) => Promise<void>;
  signIn: (username: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateUser: (info: Partial<UserInfo>) => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [storedTheme, storedUser, storedSignedIn] = await Promise.all([
          AsyncStorage.getItem('theme'),
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('isSignedIn'),
        ]);
        if (storedTheme === 'light' || storedTheme === 'dark') setTheme(storedTheme);
        if (storedUser) {
          const parsed = JSON.parse(storedUser) as UserInfo;
          setUser(parsed);
          setIsSignedUp(true);
        }
        if (storedSignedIn === 'true') setIsSignedIn(true);
      } catch {}
    })();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem('theme', next).catch(() => {});
      return next;
    });
  }, []);

  const signUp = useCallback(async (info: UserInfo) => {
    // Create the backend onboarding session -- every pipeline endpoint
    // downstream (PAN verify, DigiLocker, face match, AML) needs this user_id.
    // If this fails, we throw rather than silently continuing -- proceeding
    // without a user_id just defers a confusing failure to the identity
    // screen, several taps later, with no clue what actually went wrong.
    let userId: string;
    try {
      const created = await createUser();
      userId = created.user_id;
    } catch (e) {
      throw new Error(
        'Could not reach the verification server. Check that the backend is running ' +
        'and that EXPO_PUBLIC_API_BASE_URL in your .env points to it, then try again.'
      );
    }

    const withBackendId = { ...info, userId };
    setUser(withBackendId);
    setIsSignedUp(true);
    setIsSignedIn(true);
    await Promise.all([
      AsyncStorage.setItem('user', JSON.stringify(withBackendId)),
      AsyncStorage.setItem('isSignedIn', 'true'),
    ]);
  }, []);

  const signIn = useCallback(
    async (username: string): Promise<boolean> => {
      if (!isSignedUp || !user) return false;
      if (user.username.toLowerCase() !== username.toLowerCase()) return false;
      setIsSignedIn(true);
      await AsyncStorage.setItem('isSignedIn', 'true');
      return true;
    },
    [isSignedUp, user]
  );

  const signOut = useCallback(async () => {
    setIsSignedIn(false);
    await AsyncStorage.removeItem('isSignedIn');
  }, []);

  const updateUser = useCallback(async (info: Partial<UserInfo>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...info };
      AsyncStorage.setItem('user', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{ theme, toggleTheme, isSignedUp, isSignedIn, user, signUp, signIn, signOut, updateUser }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
