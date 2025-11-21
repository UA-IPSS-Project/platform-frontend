import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Check, X, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { toast } from 'sonner@2.0.3';

interface RegisterFormProps {
  onRegister: (userData: {
    name: string;
    nif: string;
    contact: string;
    email: string;
    birthDate: string;
  }, password: string) => boolean;
  onNavigateToLogin: () => void;
}

interface PasswordValidation {
  minLength: boolean;
  hasUpperLower: boolean;
  hasNumber: boolean;
}

export function RegisterForm({ onRegister, onNavigateToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    nif: '',
    contact: '',
    email: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPasswordValidation, setShowPasswordValidation] = useState(false);
  const [birthDatePickerOpen, setBirthDatePickerOpen] = useState(false);
  const [birthDateValue, setBirthDateValue] = useState<Date | undefined>(undefined);

  const validatePassword = (password: string): PasswordValidation => {
    return {
      minLength: password.length >= 8,
      hasUpperLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
    };
  };

  const passwordValidation = validatePassword(formData.password);
  const isPasswordValid = passwordValidation.minLength && passwordValidation.hasUpperLower && passwordValidation.hasNumber;

  const validateNIF = (nif: string): boolean => {
    return /^\d{9}$/.test(nif);
  };

  const validateContact = (contact: string): boolean => {
    return /^\d{9}$/.test(contact);
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

const validateBirthDate = (birthDate: string): { valid: boolean; error?: string } => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(birthDate)) {
    return { valid: false, error: 'Utilize o formato dd/mm/aaaa' };
  }
  const [dayStr, monthStr, yearStr] = birthDate.split('/');
  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = Number(yearStr);
  const date = new Date(year, month - 1, day);
  const isRealDate =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  if (!isRealDate) {
    return { valid: false, error: 'Data inválida' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) {
    return { valid: false, error: 'Data não pode ser no futuro' };
  }
  return { valid: true };
};

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.nif) {
      newErrors.nif = 'NIF é obrigatório';
    } else if (!validateNIF(formData.nif)) {
      newErrors.nif = 'NIF deve ter 9 dígitos';
    }

    if (!formData.contact) {
      newErrors.contact = 'Contacto é obrigatório';
    } else if (!validateContact(formData.contact)) {
      newErrors.contact = 'Contacto deve ter 9 dígitos';
    }

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

  if (!formData.birthDate) {
    newErrors.birthDate = 'Data de nascimento é obrigatória';
  } else {
    const birthValidation = validateBirthDate(formData.birthDate);
    if (!birthValidation.valid) {
      newErrors.birthDate = birthValidation.error || 'Data inválida';
    }
  }

    if (!formData.password) {
      newErrors.password = 'Palavra-passe é obrigatória';
    } else if (!isPasswordValid) {
      newErrors.password = 'Palavra-passe não cumpre os requisitos';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de palavra-passe é obrigatória';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As palavras-passe não coincidem';
    }

    // Check if NIF or email already exists
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.some((u: any) => u.nif === formData.nif)) {
      newErrors.nif = 'NIF já registado';
    }
    if (users.some((u: any) => u.email === formData.email)) {
      newErrors.email = 'Email já registado';
    }
    if (users.some((u: any) => u.contact === formData.contact)) {
      newErrors.contact = 'Contacto já registado';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    const success = onRegister({
      name: formData.name,
      nif: formData.nif,
      contact: formData.contact,
      email: formData.email,
      birthDate: formData.birthDate,
    }, formData.password);

    if (success) {
      toast.success('Conta criada com sucesso!');
    } else {
      toast.error('Erro ao criar conta');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 transition-colors duration-300">
      <button
        onClick={onNavigateToLogin}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar ao Login</span>
      </button>

      <div className="text-center mb-8">
        <h1 className="text-gray-800 dark:text-gray-100 mb-2">Criar Conta</h1>
        <p className="text-gray-600 dark:text-gray-400">Registe-se no sistema</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
            Nome Completo *
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="João Silva"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
              errors.name ? 'border-red-500' : ''
            }`}
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700 dark:text-gray-300">
            Data de Nascimento *
          </Label>
          <Popover open={birthDatePickerOpen} onOpenChange={setBirthDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={`w-full justify-between bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 ${
                  errors.birthDate ? 'border-red-500' : ''
                }`}
              >
                {formData.birthDate || 'Selecionar data'}
                <CalendarIcon className="w-4 h-4 opacity-70" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Calendar
                mode="single"
                selected={birthDateValue}
                initialFocus
                onSelect={(date) => {
                  if (date) {
                    setBirthDateValue(date);
                    handleChange('birthDate', formatDate(date));
                    setBirthDatePickerOpen(false);
                  }
                }}
              />
            </PopoverContent>
          </Popover>
          {errors.birthDate && <p className="text-red-500 text-sm">{errors.birthDate}</p>}
        </div>

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
              className={`bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                errors.nif ? 'border-red-500' : ''
              }`}
            />
            {errors.nif && <p className="text-red-500 text-sm">{errors.nif}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact" className="text-gray-700 dark:text-gray-300">
              Contacto *
            </Label>
            <Input
              id="contact"
              type="text"
              placeholder="912345678"
              maxLength={9}
              value={formData.contact}
              onChange={(e) => handleChange('contact', e.target.value.replace(/\D/g, ''))}
              className={`bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                errors.contact ? 'border-red-500' : ''
              }`}
            />
            {errors.contact && <p className="text-red-500 text-sm">{errors.contact}</p>}
          </div>
        </div>

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
            className={`bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
              errors.email ? 'border-red-500' : ''
            }`}
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
            Palavra-passe *
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            onFocus={() => setShowPasswordValidation(true)}
            className={`bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
              errors.password ? 'border-red-500' : ''
            }`}
          />
          {showPasswordValidation && formData.password && (
            <div className="space-y-1 text-sm">
              <div className={`flex items-center gap-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordValidation.minLength ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                <span>Min. 8 caracteres</span>
              </div>
              <div className={`flex items-center gap-2 ${passwordValidation.hasUpperLower ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordValidation.hasUpperLower ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                <span>Maiúsculas e minúsculas</span>
              </div>
              <div className={`flex items-center gap-2 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordValidation.hasNumber ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                <span>Números</span>
              </div>
            </div>
          )}
          {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">
            Confirmar Palavra-passe *
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            className={`bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
              errors.confirmPassword ? 'border-red-500' : ''
            }`}
          />
          {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
        </div>

        <Button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-lg transition-colors duration-200 mt-6"
        >
          Criar Conta
        </Button>
      </form>
    </div>
  );
}
