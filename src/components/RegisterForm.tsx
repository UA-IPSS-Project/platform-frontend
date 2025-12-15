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
import {
  validateName,
  validateNIF,
  validateContact,
  validateEmail,
  validatePassword,
  isPasswordValid as checkPasswordValid,
  validateBirthDate,
  formatDate,
  type PasswordValidation
} from '../lib/validations';

interface RegisterFormProps {
  onNavigateToLogin: () => void;
  initialAccountType?: 'user' | 'employee';
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

  const passwordValidation = validatePassword(formData.password);
  const isPasswordValid = checkPasswordValid(formData.password);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameValidation = validateName(formData.name);
    if (!nameValidation.valid) newErrors.name = nameValidation.error || 'Nome inválido';

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
      if (!formData.email.endsWith('@florinhasdovouga.pt')) {
        newErrors.email = 'Use um email institucional (@florinhasdovouga.pt)';
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
      // Convert date from dd/mm/yyyy to yyyy-mm-dd
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
        toast.success('Conta criada com sucesso!');
        onNavigateToLogin();
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
        // Employee registration success
        toast.success('Conta criada com sucesso! Aguarde aprovação da secretaria.');
        onNavigateToLogin();
      }

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
          {errors.name && (
            <ul className="text-red-500 text-sm list-disc ml-4 space-y-0.5">
              {errors.name.split('\n').filter(Boolean).map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          )}
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
            <PopoverContent className="p-0" align="start">
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

        {/* Account Type Selection - Checkboxes */}
        <div className="space-y-2">
          <Label className="text-gray-700 dark:text-gray-300">Tipo de Conta *</Label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={accountType === 'user'}
                onChange={() => handleAccountTypeChange('user')}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-gray-700 dark:text-gray-300">Utilizador</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={accountType === 'employee'}
                onChange={() => handleAccountTypeChange('employee')}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-gray-700 dark:text-gray-300">Funcionário</span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
            {accountType === 'employee' ? 'Email institucional *' : 'Email *'}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={accountType === 'employee' ? 'nome@florinhasdovouga.pt' : 'email@exemplo.pt'}
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${errors.email ? 'border-red-500' : ''
              }`}
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
        </div>

        {
          accountType === 'employee' && (
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
          )
        }

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
      </form >
    </div >
  );
}
