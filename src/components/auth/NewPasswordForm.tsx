import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';
import { TermsOfUseModal } from '../dialogs/TermsOfUseModal';
import { GlassCard } from '../ui/glass-card';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { validatePassword, isPasswordValid as checkPasswordValid } from '../../lib/validations';
import { useTranslation } from 'react-i18next';

interface NewPasswordFormProps {
  onSuccess?: () => void;
  isDarkMode?: boolean;
}

export default function NewPasswordForm({ onSuccess, isDarkMode }: NewPasswordFormProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsRead, setTermsRead] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; repeat?: string; termsAccepted?: string }>({});

  const isPasswordValid = checkPasswordValid(password);
  const passwordValidation = validatePassword(password);
  const [showPasswordValidation, setShowPasswordValidation] = useState(false);

  const validate = () => {
    const e: { password?: string; repeat?: string; termsAccepted?: string } = {};
    if (!password) e.password = t('auth.requiredField');
    else if (!isPasswordValid) e.password = t('auth.passwordRequirementsNotMet');
    if (password !== repeat) e.repeat = t('auth.passwordsDoNotMatch');
    if (!termsAccepted) e.termsAccepted = t('auth.mustAcceptTermsActivate');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const { updatePassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error(t('auth.fixErrorsBeforeContinue'));
      return;
    }

    try {
      await updatePassword(password, termsAccepted);
      toast.success(t('auth.passwordSetSuccess'));
      onSuccess?.();
    } catch (error) {
      toast.error(t('auth.errorSettingPassword'));
    }
  };

  return (
    <GlassCard className="w-full max-w-md p-8 border border-border/40">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <img
            src={isDarkMode ? "/assets/LogoModoEscuro1.png" : "/assets/LogoSemTextoUltimo.png"}
            alt="Logo Florinhas"
            className="h-16 w-auto object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{t('auth.setNewPassword')}</h1>
        <p className="text-muted-foreground">{t('auth.setPasswordSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="newPassword" className="text-foreground/85">{t('auth.newPassword')}</Label>
          <div className={`flex items-center w-full rounded-md border px-3 h-10 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${errors.password
            ? 'border-status-error focus-within:ring-status-error/50'
            : 'border-border focus-within:border-foreground'
            } bg-muted`}>
            <input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onFocus={() => setShowPasswordValidation(true)}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              className="flex-1 bg-transparent border-0 outline-none text-sm w-full h-full placeholder:text-muted-foreground/70 text-foreground"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="ml-2 text-muted-foreground hover:text-foreground focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-status-error text-sm">{errors.password}</p>}
          {showPasswordValidation && password && (
            <div className="space-y-1 text-sm pt-2">
              <div className={`flex items-center gap-2 ${passwordValidation.minLength ? 'text-status-success' : 'text-muted-foreground'}`}>
                {passwordValidation.minLength ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                <span>{t('auth.passwordRuleMinLength')}</span>
              </div>
              <div className={`flex items-center gap-2 ${passwordValidation.hasUpperLower ? 'text-status-success' : 'text-muted-foreground'}`}>
                {passwordValidation.hasUpperLower ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                <span>{t('auth.passwordRuleCases')}</span>
              </div>
              <div className={`flex items-center gap-2 ${passwordValidation.hasNumber ? 'text-status-success' : 'text-muted-foreground'}`}>
                {passwordValidation.hasNumber ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                <span>{t('auth.passwordRuleNumbers')}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="repeatPassword" className="text-foreground/85">{t('auth.repeatPassword')}</Label>
          <div className={`flex items-center w-full rounded-md border px-3 h-10 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${errors.repeat
            ? 'border-status-error focus-within:ring-status-error/50'
            : 'border-border focus-within:border-foreground'
            } bg-muted`}>
            <input
              id="repeatPassword"
              type={showRepeat ? 'text' : 'password'}
              placeholder="••••••••"
              value={repeat}
              onChange={(e) => {
                setRepeat(e.target.value);
                if (errors.repeat) setErrors({ ...errors, repeat: undefined });
              }}
              className="flex-1 bg-transparent border-0 outline-none text-sm w-full h-full placeholder:text-muted-foreground/70 text-foreground"
            />
            <button
              type="button"
              onClick={() => setShowRepeat(!showRepeat)}
              className="ml-2 text-muted-foreground hover:text-foreground focus:outline-none"
            >
              {showRepeat ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.repeat && <p className="text-status-error text-sm">{errors.repeat}</p>}
        </div>

        <div className="space-y-2">
          <div className="bg-muted/60 border border-border rounded-lg p-4">
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
                className={`mt-1 shrink-0 ${errors.termsAccepted ? 'border-status-error' : ''}`}
              />
              <label
                htmlFor="termsAccepted"
                className="text-sm text-foreground/85 leading-relaxed cursor-pointer select-none text-left"
              >
                Aceito os{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTermsModal(true);
                  }}
                  className="font-medium text-primary hover:text-primary/90 hover:underline inline focus:outline-none"
                >
                  {t('auth.termsAndPrivacy')}
                </button>
              </label>
            </div>
          </div>
          {errors.termsAccepted && (
            <p className="text-status-error text-sm pl-1">{errors.termsAccepted}</p>
          )}
        </div>

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 rounded-lg transition-colors duration-200">
          {t('auth.saveAndEnter')}
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
