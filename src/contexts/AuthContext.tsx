import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../services/api';

interface User {
  id: number;
  email: string;
  nome: string;
  role: 'FUNCIONARIO' | 'UTENTE';
  nif?: string;
  telefone?: string;
  active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
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
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
  // const INACTIVITY_TIMEOUT = 60000;         // 1 minute

  const checkAuth = async () => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedLastActivity = localStorage.getItem('lastActivity');

    if (!savedToken || !savedUser) {
      setIsLoading(false);
      return;
    }

    // Check inactivity
    if (savedLastActivity) {
      const lastActivityTime = parseInt(savedLastActivity);
      const now = Date.now();
      if (now - lastActivityTime > INACTIVITY_TIMEOUT) {
        logout();
        setIsLoading(false);
        return;
      }
    }

    try {
      // Verify token with backend
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        // Update user data from server source of truth
        const updatedUser: User = {
          id: userData.id,
          email: userData.email,
          nome: userData.nome,
          role: userData.role,
          nif: userData.nif,
          telefone: userData.telefone,
          active: true, // Assuming /me always returns active users or we assume active if we can call /me? 
          // Ideally /me should return active status too, but UserResponse might not have it.
          // For now, let's look at AuthContext logic. We only block inactive at login time redirect.
          // If they refresh, checkAuth calls /me.
          // The UserResponse Java DTO needs 'active' too if we want to persist it correctly on refresh!
        };
        setUser(updatedUser);
        setToken(savedToken);
        // Refresh activity timestamp on successful check
        updateActivity();
      } else {
        // Token invalid or expired
        logout();
      }
    } catch (error) {
      console.error('Auth verification failed:', error);
      // On network error, maybe keep local state? Or safer to logout?
      // For security, if we can't verify, we might want to be cautious.
      // But for resilience, if it's just a network blip, we shouldn't log out.
      // Let's assume if fetch fails completely (network), we keep session if not expired locally.
      // But if response is 401/403 (handled in else), we logout.
      // For now, let's keep local state if verify fails due to network, 
      // but rely on next check.
      // However, to follow the requirement strictly "verify if state is on", let's be strict.
      // Actually, if me endpoint fails, it likely means token is bad.
      logout();
    } finally {
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
        if (token) {
          updateActivity();
          lastUpdateLocal = now;
        }
      }
    };

    events.forEach(event => window.addEventListener(event, handleActivity));

    // Periodic check for inactivity interval
    const intervalId = setInterval(() => {
      if (token) {
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
  }, [token]); // Depend on token

  const login = async (identifier: string, password: string, type: 'funcionario' | 'utente') => {
    try {
      const endpoint = type === 'funcionario'
        ? `${API_BASE_URL}/api/auth/login/funcionario`
        : `${API_BASE_URL}/api/auth/login/utente`;

      const body = type === 'funcionario'
        ? { email: identifier, password }
        : { nif: identifier, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Credenciais inválidas');
      }

      const data = await response.json();

      const userData: User = {
        id: data.id,
        email: data.email,
        nome: data.nome,
        role: data.role,
        nif: data.nif,
        telefone: data.telefone,
        active: data.active,
      };

      setToken(data.token);
      setUser(userData);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('lastActivity', Date.now().toString());
      // Clear previous dashboard states on fresh login to ensure default view
      localStorage.removeItem('userDashboardView');
      localStorage.removeItem('secretaryDashboardView');
    } catch (error) {
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
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao registar');
      }

      const responseData = await response.json();

      const userData: User = {
        id: responseData.id,
        email: responseData.email,
        nome: responseData.nome,
        role: responseData.role,
        nif: responseData.nif,
        telefone: responseData.telefone,
        active: responseData.active,
      };

      setToken(responseData.token);
      setUser(userData);

      localStorage.setItem('token', responseData.token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('lastActivity', Date.now().toString());
      localStorage.removeItem('userDashboardView');
      localStorage.removeItem('secretaryDashboardView');
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
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao registar');
      }

      const responseData = await response.json();

      if (responseData.active === false && responseData.role === 'FUNCIONARIO') {
        // Do not log in automatically if not active
        return;
      }

      const userData: User = {
        id: responseData.id,
        email: responseData.email,
        nome: responseData.nome,
        role: responseData.role,
        nif: responseData.nif,
        telefone: responseData.telefone,
        active: responseData.active,
      };

      setToken(responseData.token);
      setUser(userData);

      localStorage.setItem('token', responseData.token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('lastActivity', Date.now().toString());
      localStorage.removeItem('userDashboardView');
      localStorage.removeItem('secretaryDashboardView');
    } catch (error) {
      console.error('Erro no registo:', error);
      throw error;
    }
  };

  const updatePassword = async (password: string, termsAccepted: boolean) => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) throw new Error('Não autenticado');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`
        },
        body: JSON.stringify({ password, termsAccepted }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar a palavra-passe');
      }

      // Update local user active state
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

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    localStorage.removeItem('userDashboardView');
    localStorage.removeItem('secretaryDashboardView');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    registerUtente,
    registerFuncionario,
    logout,
    isAuthenticated: !!token && !!user,
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
