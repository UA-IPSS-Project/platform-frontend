import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { GlassCard } from '../ui/glass-card';
import { LightSwitch } from '../shared/light-switch';
import { useTranslation } from 'react-i18next';

interface LoginFormProps {
  onNavigateToRegister: (accountType?: 'user' | 'employee') => void;
  isDarkMode?: boolean;
}

export function LoginForm({ onNavigateToRegister, isDarkMode }: LoginFormProps) {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [employeeEmailPrefix, setEmployeeEmailPrefix] = useState('');
  const [employeeEmailDomain, setEmployeeEmailDomain] = useState('@florinhasdovouga.pt');
  const [isEditingDomain, setIsEditingDomain] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [loginType, setLoginType] = useState<'user' | 'employee'>('user');
  const { login } = useAuth();

  const employeeIdentifier = `${employeeEmailPrefix}${employeeEmailDomain}`;
  const normalizedEmployeeIdentifier = employeeIdentifier.trim();

  const validateForm = () => {
    const newErrors: { identifier?: string; password?: string } = {};

    const currentIdentifier = loginType === 'employee' ? normalizedEmployeeIdentifier : identifier.trim();

    if (!currentIdentifier) {
      newErrors.identifier = t('auth.requiredField');
    } else if (loginType === 'user' && !/^\d{9}$/.test(currentIdentifier)) {
      newErrors.identifier = t('auth.onlyNumbersAllowed');
    } else if (loginType === 'employee') {
      if (!currentIdentifier.includes('@')) {
        newErrors.identifier = t('auth.invalidInstitutionalEmail');
      } else if (!/^@?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(employeeEmailDomain.replace(/^@/, ''))) {
        newErrors.identifier = t('auth.invalidInstitutionalEmail');
      } else if (!currentIdentifier.endsWith(employeeEmailDomain)) {
        newErrors.identifier = t('auth.useInstitutionalEmail');
      } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(currentIdentifier)) {
        newErrors.identifier = t('auth.invalidInstitutionalEmail');
      }
    }

    if (!password) {
      newErrors.password = t('auth.requiredField');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t('auth.fillAllFields'));
      return;
    }

    try {
      const tipoLogin = loginType === 'user' ? 'utente' : 'funcionario';
      const submitIdentifier = loginType === 'employee' ? normalizedEmployeeIdentifier : identifier;
      await login(submitIdentifier, password, tipoLogin);
      toast.success(t('auth.loginSuccess'));
    } catch (error: any) {
      toast.error(error.message || t('auth.invalidCredentials'));
      setErrors({ identifier: t('auth.invalidCredentials'), password: t('auth.invalidCredentials') });
    }
  };

  const handleToggle = (value: 'user' | 'employee') => {
    setLoginType(value);
    setIdentifier('');
    setEmployeeEmailPrefix('');
    setEmployeeEmailDomain('@florinhasdovouga.pt');
    setIsEditingDomain(false);
    setPassword('');
    setErrors({});
  };

  return (
    <GlassCard className="w-full max-w-md p-8 border border-white/20 dark:border-gray-700/30">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <img
            src={isDarkMode ? "/assets/LogoModoEscuro1.png" : "/assets/LogoSemTextoUltimo.png"}
            alt="Logo Florinhas"
            className="h-16 w-auto object-contain"
          />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t('auth.welcome')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('auth.platformSubtitle')}</p>

        <div className="mt-6 flex items-center justify-center">
          <LightSwitch
            value={loginType}
            onChange={handleToggle}
            variant="subtle"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="identifier" className="text-gray-700 dark:text-gray-300">
            {loginType === 'user' ? t('auth.nif') : t('auth.institutionalEmail')}
          </Label>
          {loginType === 'employee' ? (
            <div className={`flex items-center gap-2 rounded-md border bg-gray-50 dark:bg-gray-700 px-3 h-10 transition-all focus-within:ring-2 focus-within:ring-purple-500 ${errors.identifier ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}>
              <input
                id="identifier"
                type="text"
                placeholder={t('auth.employeeEmailPrefixPlaceholder')}
                value={employeeEmailPrefix}
                onChange={(e) => {
                  const prefix = e.target.value.replace(/@.*/, '');
                  setEmployeeEmailPrefix(prefix);
                  if (errors.identifier) setErrors({ ...errors, identifier: undefined });
                }}
                className="flex-1 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100 h-full min-w-0"
              />
              {isEditingDomain ? (
                <input
                  type="text"
                  placeholder={t('auth.employeeEmailDomainPlaceholder')}
                  value={employeeEmailDomain}
                  onChange={(e) => {
                    const rawDomain = e.target.value.trim();
                    setEmployeeEmailDomain(rawDomain.startsWith('@') || rawDomain.length === 0 ? rawDomain : `@${rawDomain}`);
                    if (errors.identifier) setErrors({ ...errors, identifier: undefined });
                  }}
                  onBlur={() => {
                    if (!employeeEmailDomain || employeeEmailDomain === '@') {
                      setEmployeeEmailDomain('@florinhasdovouga.pt');
                    }
                    setIsEditingDomain(false);
                  }}
                  className="bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-sm text-gray-500 dark:text-gray-400 font-medium w-44 shrink-0"
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingDomain(true)}
                  className="text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0 whitespace-nowrap hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  aria-label={t('auth.institutionalEmail')}
                >
                  {employeeEmailDomain}
                </button>
              )}
            </div>
          ) : (
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
          )}
          {errors.identifier && (
            <p className="text-red-500 text-sm">{errors.identifier}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
            {t('auth.password')}
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
          {t('auth.login')}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          {t('auth.noAccount')}{' '}
          <button
            onClick={() => onNavigateToRegister(loginType)}
            className="text-purple-600 dark:text-purple-400 hover:underline"
          >
            {t('auth.createAccount')}
          </button>
        </p>
      </div>
    </GlassCard>
  );
}
