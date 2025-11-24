import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner@2.0.3';

interface LoginFormProps {
  onLogin: (identifier: string, password: string) => boolean;
  onNavigateToRegister: () => void;
}

export function LoginForm({ onLogin, onNavigateToRegister }: LoginFormProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [loginType, setLoginType] = useState<'user' | 'employee'>('user');

  const validateForm = () => {
    const newErrors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      newErrors.identifier = 'Campo obrigatório';
    } else if (loginType === 'user' && !/^\d{9}$/.test(identifier.trim())) {
      newErrors.identifier = 'NIF deve ter 9 dígitos';
    } else if (loginType === 'employee' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(identifier.trim())) {
      newErrors.identifier = 'Email institucional inválido';
    }

    if (!password) {
      newErrors.password = 'Campo obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    const success = onLogin(identifier, password);
    
    if (success) {
      toast.success('Login realizado com sucesso!');
    } else {
      toast.error('Credenciais inválidas');
      setErrors({ identifier: 'Credenciais inválidas', password: 'Credenciais inválidas' });
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 transition-colors duration-300">
      <div className="text-center mb-8">
        <h1 className="text-gray-800 dark:text-gray-100 mb-2">Bem-vindo</h1>
        <p className="text-gray-600 dark:text-gray-400">Plataforma Institucional das Florinhas do Vouga</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant={loginType === 'user' ? 'default' : 'ghost'}
            onClick={() => {
              setLoginType('user');
              setIdentifier('');
              setPassword('');
              setErrors({});
            }}
            className="px-4"
          >
            Utilizador
          </Button>
          <Button
            variant={loginType === 'employee' ? 'default' : 'ghost'}
            onClick={() => {
              setLoginType('employee');
              setIdentifier('');
              setPassword('');
              setErrors({});
            }}
            className="px-4"
          >
            Funcionário
          </Button>
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
            placeholder={loginType === 'user' ? '123456789' : 'email@instituicao.pt'}
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (errors.identifier) setErrors({ ...errors, identifier: undefined });
            }}
            className={`bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
              errors.identifier ? 'border-red-500' : ''
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
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            className={`bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
              errors.password ? 'border-red-500' : ''
            }`}
          />
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
            onClick={onNavigateToRegister}
            className="text-purple-600 dark:text-purple-400 hover:underline"
          >
            Criar Conta
          </button>
        </p>
      </div>
    </div>
  );
}
