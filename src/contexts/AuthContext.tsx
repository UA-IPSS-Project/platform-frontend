import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  nome: string;
  role: 'FUNCIONARIO' | 'UTENTE';
  nif?: string;
  telefone?: string;
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
}

interface UtenteRegisterData {
  nome: string;
  email: string;
  password: string;
  nif: string;
  telefone: string;
  dataNasc: string; // ISO format: YYYY-MM-DD
}

interface FuncionarioRegisterData {
  nome: string;
  email: string;
  password: string;
  nif: string;
  contacto: string;
  funcao: string;
  dataNasc: string; // ISO format: YYYY-MM-DD
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Recuperar token e user do localStorage ao carregar
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (identifier: string, password: string, type: 'funcionario' | 'utente') => {
    try {
      const endpoint = type === 'funcionario' 
        ? 'http://localhost:8080/api/auth/login/funcionario'
        : 'http://localhost:8080/api/auth/login/utente';

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
      };

      setToken(data.token);
      setUser(userData);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const registerUtente = async (data: UtenteRegisterData) => {
    try {
      const response = await fetch('http://localhost:8080/api/auth/register/utente', {
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
      };

      setToken(responseData.token);
      setUser(userData);
      
      localStorage.setItem('token', responseData.token);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Erro no registo:', error);
      throw error;
    }
  };

  const registerFuncionario = async (data: FuncionarioRegisterData) => {
    try {
      const response = await fetch('http://localhost:8080/api/auth/register/funcionario', {
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
      };

      setToken(responseData.token);
      setUser(userData);
      
      localStorage.setItem('token', responseData.token);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Erro no registo:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
