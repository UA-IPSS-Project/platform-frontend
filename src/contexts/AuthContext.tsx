import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { API_BASE_URL, authApi, AuthResponse } from '../services/api';

interface User {
  id: number;
  email: string;
  nome: string;
  role: 'FUNCIONARIO' | 'UTENTE' | 'SECRETARIA';
  nif?: string;
  telefone?: string;
  active: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string, type: 'funcionario' | 'utente') => Promise<void>;
  registerUtente: (data: UtenteRegisterData) => Promise<void>;
  registerFuncionario: (data: FuncionarioRegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  updatePassword: (password: string, termsAccepted: boolean) => Promise<void>;
}

interface UtenteRegisterData {
  nome: string;
  email: string;
  password: string;
  nif: string;
  telefone: string;
  dataNasc: string; // ISO format: YYYY-MM-DD
  termsAccepted: boolean;
}

interface FuncionarioRegisterData {
  nome: string;
  email: string;
  password: string;
  nif: string;
  contacto: string;
  funcao: string;
  dataNasc: string; // ISO format: YYYY-MM-DD
  termsAccepted: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  // Token state removed (managed by HTTP-Only Cookie)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

  const checkAuth = async (retryCount = 0) => {
    console.log('[Auth] checkAuth called - retryCount:', retryCount, 'current user:', user?.role);
    try {
      // Verify session with backend (sends cookie automatically)
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: 'include' // Important
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('[Auth] checkAuth SUCCESS - role:', userData.role);
        const updatedUser: User = {
          id: userData.id,
          email: userData.email,
          nome: userData.nome,
          role: userData.role,
          nif: userData.nif,
          telefone: userData.telefone,
          active: userData.active,
        };
        setUser(updatedUser);
        setIsAuthenticated(true);
        updateActivity();
        setIsLoading(false); // Success - stop loading
      } else {
        console.log('[Auth] checkAuth FAILED - status:', response.status, 'retryCount:', retryCount);
        // Retry once after 500ms if this is the first attempt
        // This handles page reload timing issues where cookies aren't immediately available
        if (retryCount === 0) {
          console.log('[Auth] Initial check failed, retrying in 500ms...');
          // CRITICAL: Don't clear user state during retry - keep existing auth state
          setTimeout(() => checkAuth(1), 500);
          return; // Don't call handleLogoutState yet - and don't clear isLoading
        }
        // After retry, session is truly invalid
        console.log('[Auth] Auth failed after retry - logging out');
        handleLogoutState();
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Auth verification failed:', error);
      // Same retry logic for network errors
      if (retryCount === 0) {
        console.log('[Auth] Network error, retrying in 500ms...');
        setTimeout(() => checkAuth(1), 500);
        return;
      }
      handleLogoutState();
      setIsLoading(false);
    }
  };

  const updateActivity = () => {
    const now = Date.now().toString();
    localStorage.setItem('lastActivity', now);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Activity listeners
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    // Throttle Update Activity to run max once every minute
    let lastUpdateLocal = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastUpdateLocal > 60000) { // 1 minute throttle
        if (isAuthenticated) {
          updateActivity();
          lastUpdateLocal = now;
        }
      }
    };

    events.forEach(event => window.addEventListener(event, handleActivity));

    // Periodic check for inactivity interval
    const intervalId = setInterval(() => {
      if (isAuthenticated) {
        const savedLastActivity = localStorage.getItem('lastActivity');
        if (savedLastActivity) {
          const lastActivityTime = parseInt(savedLastActivity);
          const now = Date.now();
          if (now - lastActivityTime > INACTIVITY_TIMEOUT) {
            logout();
          }
        }
      }
    }, 60000); // Check every minute

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  const handleAuthSuccess = (data: any) => {
    const userData: User = {
      id: data.id,
      email: data.email,
      nome: data.nome,
      role: data.role,
      nif: data.nif,
      telefone: data.telefone,
      active: data.active,
    };

    setUser(userData);
    setIsAuthenticated(true);

    localStorage.setItem('user', JSON.stringify(userData)); // Optional: cache user info, but NOT token
    localStorage.setItem('lastActivity', Date.now().toString());

    // Clear legacy dashboard views
    localStorage.removeItem('userDashboardView');
    localStorage.removeItem('secretaryDashboardView');
  };

  const handleLogoutState = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    localStorage.removeItem('token'); // Clear legacy token if exists
  };

  const login = async (identifier: string, password: string, type: 'funcionario' | 'utente') => {
    try {
      let data: AuthResponse;

      if (type === 'funcionario') {
        data = await authApi.loginFuncionario({ email: identifier, password });
      } else {
        data = await authApi.loginUtente({ nif: identifier, password });
      }

      handleAuthSuccess(data);

    } catch (error: any) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const registerUtente = async (data: UtenteRegisterData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register/utente`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao registar');
      }

      const responseData = await response.json();
      handleAuthSuccess(responseData);
    } catch (error) {
      console.error('Erro no registo:', error);
      throw error;
    }
  };

  const registerFuncionario = async (data: FuncionarioRegisterData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register/funcionario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao registar');
      }

      const responseData = await response.json();

      if (responseData.active === false && responseData.role === 'FUNCIONARIO') {
        return;
      }

      handleAuthSuccess(responseData);
    } catch (error) {
      console.error('Erro no registo:', error);
      throw error;
    }
  };

  const updatePassword = async (password: string, termsAccepted: boolean) => {
    try {
      // Use authApi to ensure correct endpoint and CSRF headers are sent
      await authApi.updatePassword(password, termsAccepted);

      if (user) {
        const updated = { ...user, active: true };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Erro ao definir password:', error);
      throw error;
    }
  };

  const logout = async () => {
    // Optimistic logout: Clear state immediately to prevent race conditions (e.g. dashboard intervals firing)
    handleLogoutState();

    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include' // Cookies
      });
    } catch (e) {
      console.error("Logout error (server side might not have cleared cookie):", e);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    registerUtente,
    registerFuncionario,
    logout,
    isAuthenticated,
    isLoading,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
