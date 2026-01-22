import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { TermsOfUseModal } from './TermsOfUseModal';

interface NewPasswordFormProps {
  onSuccess?: () => void;
}

export default function NewPasswordForm({ onSuccess }: NewPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
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
    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 transition-colors duration-300">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Definir Nova Palavra-Passe</h1>
        <p className="text-gray-600 dark:text-gray-400">Por favor, defina uma palavra-passe segura para aceder à sua conta.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300">Nova Palavra-Passe</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            className={`${errors.password ? 'border-red-500' : ''}`}
          />
          {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="repeatPassword" className="text-gray-700 dark:text-gray-300">Repetir Palavra-Passe</Label>
          <Input
            id="repeatPassword"
            type="password"
            placeholder="••••••••"
            value={repeat}
            onChange={(e) => {
              setRepeat(e.target.value);
              if (errors.repeat) setErrors({ ...errors, repeat: undefined });
            }}
            className={`${errors.repeat ? 'border-red-500' : ''}`}
          />
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
    </div>
  );
}
