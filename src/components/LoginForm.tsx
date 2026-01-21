import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, User, Briefcase } from 'lucide-react';

interface LoginFormProps {
  onNavigateToRegister: (accountType?: 'user' | 'employee') => void;
  isDarkMode?: boolean;
}

export function LoginForm({ onNavigateToRegister, isDarkMode }: LoginFormProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [loginType, setLoginType] = useState<'user' | 'employee'>('user');
  const { login } = useAuth();

  const validateForm = () => {
    const newErrors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      newErrors.identifier = 'Campo obrigatório';
    } else if (loginType === 'user' && !/^\d{9}$/.test(identifier.trim())) {
      newErrors.identifier = 'Apenas é permitido números';
    } else if (loginType === 'employee' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(identifier.trim())) {
      newErrors.identifier = 'Email institucional inválido';
    }

    if (!password) {
      newErrors.password = 'Campo obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    try {
      const tipoLogin = loginType === 'user' ? 'utente' : 'funcionario';
      await login(identifier, password, tipoLogin);
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Credenciais inválidas');
      setErrors({ identifier: 'Credenciais inválidas', password: 'Credenciais inválidas' });
    }
  };

  return (
    <div className="w-full max-w-md bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-2xl p-8 transition-colors duration-300 border border-white/20 dark:border-gray-700/30">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <img
            src={isDarkMode ? "/assets/LogoModoEscuro1.png" : "/assets/LogoSemTextoUltimo.png"}
            alt="Logo Florinhas"
            className="h-16 w-auto object-contain"
          />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Bem-vindo</h1>
        <p className="text-gray-600 dark:text-gray-400">Plataforma Institucional das Florinhas do Vouga</p>
        <div className="mt-6 flex items-center justify-center">
          <div className="relative flex p-1 rounded-full bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 h-10 w-full max-w-[280px]">
            {/* Sliding Background */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-white dark:bg-gray-700 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${loginType === 'employee' ? 'translate-x-full left-1' : 'left-1'
                }`}
            />

            {/* User Button */}
            <button
              type="button"
              onClick={() => {
                setLoginType('user');
                setIdentifier('');
                setPassword('');
                setErrors({});
              }}
              className={`z-10 flex-1 flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors duration-200 ${loginType === 'user' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              <User className="w-3.5 h-3.5" />
              Utilizador
            </button>

            {/* Employee Button */}
            <button
              type="button"
              onClick={() => {
                setLoginType('employee');
                setIdentifier('');
                setPassword('');
                setErrors({});
              }}
              className={`z-10 flex-1 flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors duration-200 ${loginType === 'employee' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Funcionário
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="identifier" className="text-gray-700 dark:text-gray-300">
            {loginType === 'user' ? 'NIF' : 'Email institucional'}
          </Label>
          <Input
            id="identifier"
            type="text"
            placeholder={loginType === 'user' ? '123456789' : 'email@florinhasdovouga.pt'}
            value={identifier}
            maxLength={loginType === 'user' ? 9 : undefined}
            onChange={(e) => {
              const value = loginType === 'user' ? e.target.value.replace(/\D/g, '') : e.target.value;
              setIdentifier(value);
              if (errors.identifier) setErrors({ ...errors, identifier: undefined });
            }}
            className={`bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${errors.identifier ? 'border-red-500' : ''
              }`}
          />
          {errors.identifier && (
            <p className="text-red-500 text-sm">{errors.identifier}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
            Palavra-passe
          </Label>
          <div className={`flex items-center w-full rounded-md border px-3 h-10 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${errors.password
            ? 'border-red-500 focus-within:ring-red-500/50'
            : 'border-gray-200 dark:border-gray-600 focus-within:border-gray-900 dark:focus-within:border-gray-100'
            } bg-gray-50 dark:bg-gray-700`}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              className="flex-1 bg-transparent border-0 outline-none text-sm w-full h-full placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-lg transition-colors duration-200"
        >
          Entrar
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Não tem conta?{' '}
          <button
            onClick={() => onNavigateToRegister(loginType)}
            className="text-purple-600 dark:text-purple-400 hover:underline"
          >
            Criar Conta
          </button>
        </p>
      </div>
    </div>
  );
}
