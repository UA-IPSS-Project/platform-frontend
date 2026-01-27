import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { TermsOfUseModal } from './TermsOfUseModal';
import { GlassCard } from './ui/glass-card';
import { Eye, EyeOff } from 'lucide-react';

interface NewPasswordFormProps {
  onSuccess?: () => void;
  isDarkMode?: boolean;
}

export default function NewPasswordForm({ onSuccess, isDarkMode }: NewPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsRead, setTermsRead] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; repeat?: string; termsAccepted?: string }>({});

  const validate = () => {
    const e: { password?: string; repeat?: string; termsAccepted?: string } = {};
    if (!password) e.password = 'Campo obrigatório';
    else if (password.length < 8) e.password = 'A palavra-passe deve ter pelo menos 8 caracteres';
    if (password !== repeat) e.repeat = 'As palavras-passe não coincidem';
    if (!termsAccepted) e.termsAccepted = 'Deve aceitar os termos de uso para ativar a conta';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const { updatePassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Corrija os erros antes de continuar');
      return;
    }

    try {
      await updatePassword(password, termsAccepted);
      toast.success('Palavra-passe definida com sucesso');
      onSuccess?.();
    } catch (error) {
      toast.error('Erro ao definir palavra-passe');
    }
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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Definir Nova Palavra-Passe</h1>
        <p className="text-gray-600 dark:text-gray-400">Por favor, defina uma palavra-passe segura para aceder à sua conta.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300">Nova Palavra-Passe</Label>
          <div className={`flex items-center w-full rounded-md border px-3 h-10 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${errors.password
            ? 'border-red-500 focus-within:ring-red-500/50'
            : 'border-gray-200 dark:border-gray-600 focus-within:border-gray-900 dark:focus-within:border-gray-100'
            } bg-gray-50 dark:bg-gray-700`}>
            <input
              id="newPassword"
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
          {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="repeatPassword" className="text-gray-700 dark:text-gray-300">Repetir Palavra-Passe</Label>
          <div className={`flex items-center w-full rounded-md border px-3 h-10 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${errors.repeat
            ? 'border-red-500 focus-within:ring-red-500/50'
            : 'border-gray-200 dark:border-gray-600 focus-within:border-gray-900 dark:focus-within:border-gray-100'
            } bg-gray-50 dark:bg-gray-700`}>
            <input
              id="repeatPassword"
              type={showRepeat ? 'text' : 'password'}
              placeholder="••••••••"
              value={repeat}
              onChange={(e) => {
                setRepeat(e.target.value);
                if (errors.repeat) setErrors({ ...errors, repeat: undefined });
              }}
              className="flex-1 bg-transparent border-0 outline-none text-sm w-full h-full placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={() => setShowRepeat(!showRepeat)}
              className="ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
            >
              {showRepeat ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.repeat && <p className="text-red-500 text-sm">{errors.repeat}</p>}
        </div>

        <div className="space-y-2">
          <div className="bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="termsAccepted"
                checked={termsAccepted}
                onCheckedChange={(checked) => {
                  if (!termsRead) {
                    setShowTermsModal(true);
                    return;
                  }
                  setTermsAccepted(checked === true);
                  if (errors.termsAccepted) setErrors({ ...errors, termsAccepted: undefined });
                }}
                className={`mt-1 shrink-0 ${errors.termsAccepted ? 'border-red-500' : ''}`}
              />
              <label
                htmlFor="termsAccepted"
                className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer select-none text-left"
              >
                Aceito os{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTermsModal(true);
                  }}
                  className="font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline inline focus:outline-none"
                >
                  termos de uso e política de privacidade
                </button>
              </label>
            </div>
          </div>
          {errors.termsAccepted && (
            <p className="text-red-500 text-sm pl-1">{errors.termsAccepted}</p>
          )}
        </div>

        <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-lg transition-colors duration-200">
          Guardar e Entrar na Plataforma
        </Button>
      </form>

      <TermsOfUseModal
        open={showTermsModal}
        onOpenChange={setShowTermsModal}
        onAccept={() => {
          setTermsRead(true);
          setTermsAccepted(true);
          if (errors.termsAccepted) setErrors({ ...errors, termsAccepted: undefined });
        }}
      />
    </GlassCard>
  );
}
