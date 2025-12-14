import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Check, X, Calendar as CalendarIcon, Eye, EyeOff } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

interface RegisterFormProps {
  onNavigateToLogin: () => void;
  initialAccountType?: 'user' | 'employee';
}

interface PasswordValidation {
  minLength: boolean;
  hasUpperLower: boolean;
  hasNumber: boolean;
}

export function RegisterForm({ onNavigateToLogin, initialAccountType = 'user' }: RegisterFormProps) {
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordValidation, setShowPasswordValidation] = useState(false);
  const [birthDatePickerOpen, setBirthDatePickerOpen] = useState(false);
  const [birthDateValue, setBirthDateValue] = useState<Date | undefined>(undefined);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  const [accountType, setAccountType] = useState<'user' | 'employee'>(initialAccountType ?? 'user');
  const [employeeRole, setEmployeeRole] = useState('');
  const { registerUtente, registerFuncionario } = useAuth();

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

    // Validar idade mínima de 18 anos
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    const dayDiff = today.getDate() - date.getDate();

    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (actualAge < 18) {
      return { valid: false, error: 'Deve ter pelo menos 18 anos para se registar' };
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

    if (accountType === 'employee') {
      // require institutional email
      if (!formData.email.endsWith('@florinhas.pt')) {
        newErrors.email = 'Use um email institucional (@florinhas.pt)';
      }
    }

    if (accountType === 'employee') {
      if (!employeeRole) {
        newErrors.employeeRole = 'Role é obrigatória para funcionários';
      }
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    try {
      // Converter data de dd/mm/yyyy para yyyy-mm-dd
      const [day, month, year] = formData.birthDate.split('/');
      const isoDate = `${year}-${month}-${day}`;

      if (accountType === 'user') {
        await registerUtente({
          nome: formData.name,
          nif: formData.nif,
          telefone: formData.contact,
          email: formData.email,
          dataNasc: isoDate,
          password: formData.password,
        });
      } else {
        await registerFuncionario({
          nome: formData.name,
          nif: formData.nif,
          contacto: formData.contact,
          email: formData.email,
          dataNasc: isoDate,
          funcao: employeeRole,
          password: formData.password,
        });
      }

      toast.success('Conta criada com sucesso!');
      onNavigateToLogin();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar conta');
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
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => handleAccountTypeChange('user')}
            className={
              accountType === 'user'
                ? 'text-purple-600 text-lg underline font-semibold focus:outline-none'
                : 'text-gray-600 hover:text-purple-600 text-base focus:outline-none'
            }
          >
            Utilizador
          </button>
          <button
            type="button"
            onClick={() => handleAccountTypeChange('employee')}
            className={
              accountType === 'employee'
                ? 'text-purple-600 text-lg underline font-semibold focus:outline-none'
                : 'text-gray-600 hover:text-purple-600 text-base focus:outline-none'
            }
          >
            Funcionário
          </button>
        </div>
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
            className={`bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${errors.name ? 'border-red-500' : ''
              }`}
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700 dark:text-gray-300">
            Data de Nascimento *
          </Label>
          <Popover open={birthDatePickerOpen} onOpenChange={(open) => {
            setBirthDatePickerOpen(open);
            if (open) {
              // when opening, focus calendar to existing birthDate or today
              setCalendarMonth(birthDateValue ?? new Date());
            }
          }}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={`w-full justify-between bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 ${errors.birthDate ? 'border-red-500' : ''
                  }`}
              >
                {formData.birthDate || 'Selecionar data'}
                <CalendarIcon className="w-4 h-4 opacity-70" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-3" align="start">
              <div className="flex gap-2 items-center mb-2">
                <select
                  aria-label="Ano"
                  value={calendarMonth.getFullYear()}
                  onChange={(e) => {
                    const y = Number(e.target.value);
                    const m = calendarMonth.getMonth();
                    const newDate = new Date(y, m, 1);
                    setCalendarMonth(newDate);
                  }}
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-sm"
                >
                  {Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => 1900 + i).reverse().map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <select
                  aria-label="Mês"
                  value={calendarMonth.getMonth()}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    const y = calendarMonth.getFullYear();
                    setCalendarMonth(new Date(y, m, 1));
                  }}
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-sm"
                >
                  {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((mn, idx) => (
                    <option key={mn} value={idx}>{mn}</option>
                  ))}
                </select>
              </div>
              <Calendar
                mode="single"
                selected={birthDateValue}
                month={calendarMonth}
                onMonthChange={(d) => setCalendarMonth(d)}
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

        {accountType === 'user' ? (
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
                Contacto *
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
        ) : (
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
                Contacto *
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
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
            {accountType === 'employee' ? 'Email institucional *' : 'Email *'}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={accountType === 'employee' ? 'nome@florinhas.pt' : 'email@exemplo.pt'}
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${errors.email ? 'border-red-500' : ''
              }`}
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
        </div>

        {accountType === 'employee' && (
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Função *</Label>
            <div className="flex items-center gap-2">
              <Select onValueChange={(val) => { setEmployeeRole(val); if (errors.employeeRole) { const ne = { ...errors }; delete ne.employeeRole; setErrors(ne); } }}>
                <SelectTrigger className={`w-full text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-10 ${errors.employeeRole ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Secretaria">Secretaria</SelectItem>
                  <SelectItem value="Balneário Social">Balneário Social</SelectItem>
                  <SelectItem value="Escola">Escola</SelectItem>
                  <SelectItem value="Serviços Internos">Serviços Internos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errors.employeeRole && <p className="text-red-500 text-sm">{errors.employeeRole}</p>}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
            Palavra-passe *
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
