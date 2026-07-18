import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { STORAGE_KEYS } from '@/config/constants';
import { authService, type User } from '@/services/auth.service';
import { safeJsonParse } from '@/utils/helpers';

/**
 * Contexto de Autenticación - Estado de autenticación global de la app
 */

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    return {
      user: storedUser ? safeJsonParse<User | null>(storedUser, null) : null,
      isAuthenticated: !!token,
      isLoading: false,
    };
  });

  // Validar el token al montar el componente
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token && !state.user) {
      setState((prev) => ({ ...prev, isLoading: true }));
      authService.getProfile()
        .then((res) => {
          setState({ user: res.data, isAuthenticated: true, isLoading: false });
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          setState({ user: null, isAuthenticated: false, isLoading: false });
        });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.login({ email, password });
      console.log('Login response:', response);
      const { accessToken, refreshToken, user } = response.data;
      console.log('Login successful:', user);
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

      setState({ user, isAuthenticated: true, isLoading: false });
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const updateUser = useCallback((user: User) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    setState((prev) => ({ ...prev, user }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return context;
}
