import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { TermsOfUseModal } from '../dialogs/TermsOfUseModal';
import { ArrowLeft, Check, X, Eye, EyeOff, User as UserIcon, Briefcase as BriefcaseIcon } from 'lucide-react';
import { DatePickerField } from '../ui/date-picker-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { GlassCard } from '../ui/glass-card';
import { LightSwitch } from '../shared/light-switch';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import {
  validateName,
  validateNIF,
  validateContact,
  validateEmail,
  validatePassword,
  isPasswordValid as checkPasswordValid,
  validateBirthDate,
  type PasswordValidation
} from '../../lib/validations';
import { useTranslation } from 'react-i18next';

interface RegisterFormProps {
  onNavigateToLogin: () => void;
  initialAccountType?: 'user' | 'employee';
}

const toInputDate = (value: string): string => {
  if (!value) return '';
  const [day, month, year] = value.split('/');
  if (!day || !month || !year) return '';
  return `${year}-${month}-${day}`;
};

const toDisplayDate = (value: string): string => {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  if (!day || !month || !year) return '';
  return `${day}/${month}/${year}`;
};

export function RegisterForm({ onNavigateToLogin, initialAccountType = 'user' }: RegisterFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    nif: '',
    contact: '',
    email: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordValidation, setShowPasswordValidation] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsRead, setTermsRead] = useState(false);

  const [accountType, setAccountType] = useState<'user' | 'employee'>(initialAccountType ?? 'user');
  const [employeeRole, setEmployeeRole] = useState('');
  const [emailSelection, setEmailSelection] = useState<'auto' | 'manual'>('auto'); // New state for email selection
  const { registerUtente, registerFuncionario } = useAuth();

  const passwordValidation = validatePassword(formData.password);
  const isPasswordValid = checkPasswordValid(formData.password);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameValidation = validateName(formData.name);
    if (!nameValidation.valid) newErrors.name = nameValidation.error || t('auth.invalidName');

    if (!formData.nif) {
      newErrors.nif = t('auth.nifRequired');
    } else if (!validateNIF(formData.nif)) {
      newErrors.nif = t('auth.nifMustHave9Digits');
    }

    if (formData.contact && !validateContact(formData.contact)) {
      newErrors.contact = t('auth.contactMustHave9Digits');
    }

    if (!formData.email) {
      newErrors.email = t('auth.emailRequired');
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t('auth.emailInvalid');
    }

    if (accountType === 'employee') {
      // require institutional email
      if (!formData.email.endsWith('@florinhasdovouga.pt')) {
        newErrors.email = t('auth.useInstitutionalEmail');
      }
    }

    if (accountType === 'employee') {
      if (!employeeRole) {
        newErrors.employeeRole = t('auth.roleRequiredEmployee');
      }
    }

    if (!formData.birthDate) {
      newErrors.birthDate = t('appointmentDialog.errors.birthDateRequired');
    } else {
      const birthValidation = validateBirthDate(formData.birthDate);
      if (!birthValidation.valid) {
        newErrors.birthDate = birthValidation.error || t('appointmentDialog.errors.dateInvalid');
      }
    }

    if (!formData.password) {
      newErrors.password = t('auth.passwordRequired');
    } else if (!isPasswordValid) {
      newErrors.password = t('auth.passwordRequirementsNotMet');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordsDoNotMatch');
    }

    if (!formData.termsAccepted) {
      newErrors.termsAccepted = t('auth.mustAcceptTermsRegister');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper to normalize strings (remove accents)
  const normalizeString = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const generateInstitutionalEmail = (fullName: string) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return '';

    // First name
    const first = normalizeString(parts[0]);
    if (parts.length === 1) return `${first}@florinhasdovouga.pt`;

    // Last name
    const last = normalizeString(parts[parts.length - 1]);

    // Middle initials
    let middles = '';
    if (parts.length > 2) {
      for (let i = 1; i < parts.length - 1; i++) {
        const p = normalizeString(parts[i]);
        if (p.length > 0) middles += p[0];
      }
    }

    return `${first}${middles}${last}@florinhasdovouga.pt`;
  };

  // Update email when name changes IF selection is auto and account is employee
  useEffect(() => {
    if (accountType === 'employee' && emailSelection === 'auto') {
      const generated = generateInstitutionalEmail(formData.name);
      setFormData(prev => ({ ...prev, email: generated }));
    }
  }, [formData.name, accountType, emailSelection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t('auth.fixFormErrors'));
      return;
    }

    try {
      // Convert date from dd/mm/yyyy to yyyy-mm-dd
      const [day, month, year] = formData.birthDate.split('/');
      const isoDate = `${year}-${month}-${day}`;

      if (accountType === 'user') {
        await registerUtente({
          nome: formData.name,
          nif: formData.nif,
          telefone: formData.contact || undefined,
          email: formData.email,
          dataNasc: isoDate,
          password: formData.password,
          termsAccepted: formData.termsAccepted,
        });
        toast.success(t('auth.accountCreatedSuccess'));
        onNavigateToLogin();
      } else {
        await registerFuncionario({
          nome: formData.name,
          nif: formData.nif,
          contacto: formData.contact || undefined,
          email: formData.email,
          dataNasc: isoDate,
          funcao: employeeRole,
          password: formData.password,
          termsAccepted: formData.termsAccepted,
        });
        // Employee registration success
        toast.success(t('auth.employeeAccountCreatedSuccess'));
        onNavigateToLogin();
      }

    } catch (error: any) {
      toast.error(error.message || t('auth.errorCreatingAccount'));
    }
  };

  const handleChange = (field: string, value: string) => {
    if (field === 'termsAccepted') {
      setFormData({ ...formData, [field]: value === 'true' });
    } else {
      setFormData({ ...formData, [field]: value });
    }
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleAccountTypeChange = (type: 'user' | 'employee') => {
    setAccountType(type);
    // reset role and nif when switching
    if (type === 'employee') {
      setEmployeeRole('');
    } else {
      setFormData({ ...formData, nif: '' });
    }
    setErrors({});
  };

  return (
    <GlassCard className="w-full max-w-md p-8 border border-white/20 dark:border-gray-700/30">
      <button
        onClick={onNavigateToLogin}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('auth.backToLogin')}</span>
      </button>

      <div className="text-center mb-8">
        <h1 className="text-gray-800 dark:text-gray-100 mb-2">{t('auth.createAccount')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('auth.registerInSystem')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          {/*<Label className="text-gray-700 dark:text-gray-300 block text-left mb-2">Tipo de Conta</Label> */}
          <LightSwitch
            value={accountType}
            onChange={(val: 'user' | 'employee') => handleAccountTypeChange(val)}
            variant="default"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
            {t('auth.fullName')} *
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="João Silva"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${errors.name ? 'border-red-500' : ''
              }`}
          />

          {errors.name && (
            <div className="text-red-500 text-sm mt-1 ml-1 space-y-0.5">
              {errors.name.split('\n').filter(Boolean).map((msg, idx) => (
                <p key={idx}>{msg}</p>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700 dark:text-gray-300">
            {t('auth.birthDate')} *
          </Label>
          <DatePickerField
            value={toInputDate(formData.birthDate)}
            onChange={(value) => handleChange('birthDate', toDisplayDate(value))}
            buttonClassName={`bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 ${errors.birthDate ? 'border-red-500' : ''}`}
          />
          {errors.birthDate && <p className="text-red-500 text-sm">{errors.birthDate}</p>}
        </div>

        {/* NIF and Contact fields - always visible */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nif" className="text-gray-700 dark:text-gray-300">
              NIF *
            </Label>
            <Input
              id="nif"
              type="text"
              placeholder="123456789"
              maxLength={9}
              value={formData.nif}
              onChange={(e) => handleChange('nif', e.target.value.replace(/\D/g, ''))}
              className={`bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${errors.nif ? 'border-red-500' : ''
                }`}
            />
            {errors.nif && <p className="text-red-500 text-sm">{errors.nif}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact" className="text-gray-700 dark:text-gray-300">
              {t('auth.contact')} <span className="text-xs font-normal text-gray-500">{t('common.optional')}</span>
            </Label>
            <Input
              id="contact"
              type="text"
              placeholder="912345678"
              maxLength={9}
              value={formData.contact}
              onChange={(e) => handleChange('contact', e.target.value.replace(/\D/g, ''))}
              className={`bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${errors.contact ? 'border-red-500' : ''
                }`}
            />
            {errors.contact && <p className="text-red-500 text-sm">{errors.contact}</p>}
          </div>
        </div>

        {accountType === 'employee' ? (
          <div className="space-y-3">
            <Label className="text-gray-700 dark:text-gray-300">{t('auth.institutionalEmailLabel')} *</Label>

            <div className="space-y-3">
              {/* Option 1: Auto Generated */}
              <div
                onClick={() => setEmailSelection('auto')}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${emailSelection === 'auto'
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 ring-1 ring-purple-500/20'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-700'
                  }`}
              >
                <div className={`flex items-center justify-center w-5 h-5 rounded-full border transition-colors ${emailSelection === 'auto'
                  ? 'border-purple-600 bg-purple-600'
                  : 'border-gray-300 dark:border-gray-600'
                  }`}>
                  {emailSelection === 'auto' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div className="flex flex-col">
                  {/* <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Automático</span> */}
                  <span className={`text-sm font-medium transition-colors ${emailSelection === 'auto' ? 'text-purple-900 dark:text-purple-100' : 'text-gray-700 dark:text-gray-300'}`}>
                    {formData.name ? generateInstitutionalEmail(formData.name) : t('auth.fillNameFirst')}
                  </span>
                </div>
              </div>

              {/* Option 2: Manual Entry */}
              <div
                onClick={() => setEmailSelection('manual')}
                className={`flex flex-col gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${emailSelection === 'manual'
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 ring-1 ring-purple-500/20'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-700'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-5 h-5 rounded-full border transition-colors ${emailSelection === 'manual'
                    ? 'border-purple-600 bg-purple-600'
                    : 'border-gray-300 dark:border-gray-600'
                    }`}>
                    {emailSelection === 'manual' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className={`text-sm font-medium transition-colors ${emailSelection === 'manual' ? 'text-purple-900 dark:text-purple-100' : 'text-gray-700 dark:text-gray-300'}`}>
                    {t('auth.other')}
                  </span>
                </div>

                {emailSelection === 'manual' && (
                  <div className="flex items-center gap-2 pl-8 animate-in mt-1">
                    <Input
                      type="text"
                      placeholder="nome.personalizado"
                      value={formData.email.endsWith('@florinhasdovouga.pt') ? formData.email.slice(0, -20) : formData.email}
                      onChange={(e) => {
                        // Remove any @ chars to prevent confusion, or just rely on append
                        const prefix = e.target.value.split('@')[0];
                        handleChange('email', prefix + '@florinhasdovouga.pt');
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-purple-500 text-sm ${errors.email ? 'border-red-500' : ''}`}
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">@florinhasdovouga.pt</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.pt"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${errors.email ? 'border-red-500' : ''
                }`}
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </div>
        )}

        {
          accountType === 'employee' && (
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">{t('auth.role')} *</Label>
              <div className="flex items-center gap-2">
                <Select onValueChange={(val) => { setEmployeeRole(val); if (errors.employeeRole) { const ne = { ...errors }; delete ne.employeeRole; setErrors(ne); } }}>
                  <SelectTrigger className={`w-full text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-10 ${errors.employeeRole ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder={t('auth.selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Secretaria">{t('auth.roleSecretary')}</SelectItem>
                    <SelectItem value="Balneário Social">{t('auth.roleSocialBath')}</SelectItem>
                    <SelectItem value="Escola">{t('auth.roleSchool')}</SelectItem>
                    <SelectItem value="Serviços Internos">{t('auth.roleInternalServices')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {errors.employeeRole && <p className="text-red-500 text-sm">{errors.employeeRole}</p>}
            </div>
          )
        }

        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
            {t('auth.password')} *
          </Label>
          <div className={`flex items-center w-full rounded-md border px-3 h-10 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${errors.password
            ? 'border-red-500 focus-within:ring-red-500/50'
            : 'border-gray-200 dark:border-gray-600 focus-within:border-gray-900 dark:focus-within:border-gray-100'
            } bg-gray-50 dark:bg-gray-700`}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onFocus={() => setShowPasswordValidation(true)}
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
          {showPasswordValidation && formData.password && (
            <div className="space-y-1 text-sm">
              <div className={`flex items-center gap-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordValidation.minLength ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                <span>{t('auth.passwordRuleMinLength')}</span>
              </div>
              <div className={`flex items-center gap-2 ${passwordValidation.hasUpperLower ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordValidation.hasUpperLower ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                <span>{t('auth.passwordRuleCases')}</span>
              </div>
              <div className={`flex items-center gap-2 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordValidation.hasNumber ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                <span>{t('auth.passwordRuleNumbers')}</span>
              </div>
            </div>
          )}
          {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">
            {t('auth.confirmPassword')} *
          </Label>
          <div className={`flex items-center w-full rounded-md border px-3 h-10 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${errors.confirmPassword
            ? 'border-red-500 focus-within:ring-red-500/50'
            : 'border-gray-200 dark:border-gray-600 focus-within:border-gray-900 dark:focus-within:border-gray-100'
            } bg-gray-50 dark:bg-gray-700`}>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              className="flex-1 bg-transparent border-0 outline-none text-sm w-full h-full placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
        </div>

        <div className="space-y-2">
          <div className="bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="termsAccepted"
                checked={formData.termsAccepted}
                onCheckedChange={(checked) => {
                  if (!termsRead) {
                    setShowTermsModal(true);
                    return;
                  }
                  handleChange('termsAccepted', checked === true ? 'true' : 'false');
                }}
                className={`mt-1 shrink-0 ${errors.termsAccepted ? 'border-red-500' : ''}`}
              />
              <label
                htmlFor="termsAccepted"
                className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer select-none text-left"
              >
                {t('auth.acceptTermsPrefix')}{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTermsModal(true);
                  }}
                  className="font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline inline focus:outline-none"
                >
                  {t('auth.termsAndPrivacy')}
                </button>
              </label>
            </div>
          </div>
          {errors.termsAccepted && (
            <p className="text-red-500 text-sm pl-1">{errors.termsAccepted}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-lg transition-colors duration-200 mt-6"
        >
          {t('auth.createAccount')}
        </Button>
      </form>

      {/* Modal de Termos de Uso */}
      <TermsOfUseModal
        open={showTermsModal}
        onOpenChange={setShowTermsModal}
        onAccept={() => {
          setTermsRead(true);
          setFormData({ ...formData, termsAccepted: true });
          if (errors.termsAccepted) {
            const newErrors = { ...errors };
            delete newErrors.termsAccepted;
            setErrors(newErrors);
          }
        }}
      />
    </GlassCard>
  );
}
