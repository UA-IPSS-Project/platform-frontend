import { useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { FileUpload } from '../shared/FileUpload';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import SUBJECTS from '../../lib/subjects';
import { calendarioApi, utilizadoresApi, UtilizadorInfo, documentosApi, apiRequest } from '../../services/api';
import { AlertCircleIcon } from '../shared/CustomIcons';
import { validateName, validateNIF, validateContact, validateEmail } from '../../lib/validations';

interface AppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  date: Date;
  time: string;
  funcionarioId: number;
}

export function AppointmentDialog({ open, onClose, onSuccess, date, time, funcionarioId }: AppointmentDialogProps) {
  const [formData, setFormData] = useState({
    nif: '',
    name: '',
    email: '',
    contact: '',
    dateOfBirth: '',
    subject: '',
    description: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [tempReservaId, setTempReservaId] = useState<number | null>(null);
  const [originalUser, setOriginalUser] = useState<UtilizadorInfo | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [birthDatePickerOpen, setBirthDatePickerOpen] = useState(false);
  const [birthDateValue, setBirthDateValue] = useState<Date | undefined>(undefined);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  // Reservar slot ao abrir o dialog
  useEffect(() => {
    if (open) {
      reservarSlot();
    }

    // Cleanup: liberar reserva ao fechar ou desmontar
    return () => {
      if (tempReservaId) {
        liberarSlot();
      }
    };
  }, [open]);

  const reservarSlot = async () => {
    try {
      const [hours, minutes] = time.split(':');
      const dateTime = new Date(date);
      dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Validate if date/time is not in the past
      const now = new Date();
      if (dateTime <= now) {
        toast.error('Não é possível marcar para uma data/hora no passado');
        onClose();
        return;
      }

      // Verificar se o slot está bloqueado
      const dateStr = date.toISOString().split('T')[0];
      const isBlocked = await calendarioApi.verificarSlot(dateStr, time);
      if (isBlocked) {
        toast.error('Horário indisponível');
        onClose();
        return;
      }

      const localDateTime = dateTime.toISOString().slice(0, 19);

      // Use apiRequest for automatic CSRF token inclusion and cookie-based auth
      const data = await apiRequest<{ tempId: number }>('/api/marcacoes/reservar-slot', {
        method: 'POST',
        body: JSON.stringify({
          data: localDateTime,
          criadoPorId: funcionarioId,
        }),
      });

      setTempReservaId(data.tempId);
      console.log('Slot reservado temporariamente:', data.tempId);
    } catch (error: any) {
      console.error('Erro ao reservar slot:', error);
      toast.error(error.message || 'Este horário já está ocupado');
      onClose();
    }
  };

  const liberarSlot = async () => {
    if (!tempReservaId) return;

    try {
      await apiRequest(`/api/marcacoes/libertar-slot/${tempReservaId}`, {
        method: 'DELETE',
      });
      console.log('Slot liberado:', tempReservaId);
      setTempReservaId(null);
    } catch (error) {
      console.error('Erro ao liberar slot:', error);
    }
  };

  // NIF Auto-fill Effect
  useEffect(() => {
    console.log('NIF changed:', formData.nif, 'Length:', formData.nif.length);
    const checkNif = async () => {
      if (formData.nif.length === 9) {
        console.log('NIF reached 9 digits. Triggering search for:', formData.nif);
        try {
          const user = await utilizadoresApi.buscarPorNif(formData.nif);
          console.log('User found by NIF:', user);
          if (user) {
            setFormData(prev => ({
              ...prev,
              name: user.nome,
              email: user.email,
              contact: user.telefone,
              dateOfBirth: user.dataNascimento ? user.dataNascimento.split('T')[0] : ''
            }));
            setOriginalUser(user);
            toast.success('Dados do utente carregados');
          } else {
            // Should not happen if API throws 404, but coverage
            toast.info('Utente não encontrado com este NIF.');
            setOriginalUser(null);
          }
        } catch (e) {
          console.error('Error fetching user by NIF:', e);
          toast.info('Utente não encontrado na base de dados (ou erro de rede).');
          setOriginalUser(null);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      checkNif();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData.nif]);

  const handleClose = async () => {
    await liberarSlot();
    onClose();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!validateNIF(formData.nif)) {
      newErrors.nif = 'NIF deve ter 9 dígitos';
    }
    const nameValidation = validateName(formData.name);
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.error || 'Nome inválido';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!validateContact(formData.contact)) {
      newErrors.contact = 'Contacto deve ter 9 dígitos';
    }
    // Validation for date of birth if entered? Assuming optional or mandatory?
    // User requested "Data de nascimento" field. Let's make it optional for now or consistent with others.
    // If auto-fill brings it, good.
    if (!formData.subject) {
      newErrors.subject = 'Selecione um assunto';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const processCreation = async () => {
    try {
      if (tempReservaId) {
        await apiRequest(`/api/marcacoes/libertar-slot/${tempReservaId}`, {
          method: 'DELETE',
        });
        setTempReservaId(null);
      }

      // If updating user
      if (originalUser && showConfirmation) {
        try {
          await utilizadoresApi.atualizar(originalUser.id, {
            nome: formData.name,
            email: formData.email,
            telefone: formData.contact,
            dataNasc: formData.dateOfBirth || undefined,
          });
          toast.success('Dados do utilizador atualizados');

          // Wait 1 second to ensure persistence/propagation and provide visual feedback
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (e) {
          console.error('Failed to update user', e);
          toast.error('Erro ao atualizar dados do utilizador');
          throw e; // Stop here if update fails
        }
      }

      const dataHora = new Date(date);
      const [hours, minutes] = time.split(':');
      dataHora.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const payload = {
        funcionarioId,
        criadoPorId: funcionarioId, // Added for consistency
        data: dataHora.toISOString().slice(0, 19),
        assunto: formData.subject,
        descricao: formData.description,
        utenteNif: formData.nif,
        utenteNome: formData.name,
        utenteEmail: formData.email,
        utenteTelefone: formData.contact,
      };

      const response = await apiRequest<{ id: number }>('/api/marcacoes/presencial', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      console.log('[AppointmentDialog] Marcação criada no backend, aguardando 500ms antes de recarregar...');
      toast.success('Marcação criada com sucesso!');

      // Se houver ficheiros selecionados, fazer upload
      if (selectedFiles.length > 0) {
        try {
          await documentosApi.uploadDocumentos(response.id, selectedFiles);
          toast.success(`${selectedFiles.length} documento(s) enviado(s) com sucesso!`);
        } catch (uploadError) {
          console.error('Erro ao enviar documentos:', uploadError);
          toast.error('Marcação criada, mas houve erro ao enviar documentos');
        }
      }

      // Wait 500ms to ensure backend transaction commits before reloading
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('[AppointmentDialog] Chamando onSuccess para recarregar marcações...');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao criar marcação:', error);
      toast.error(`Erro: ${error.message || 'Falha na criação'}`);
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setIsLoading(true);

    // Check for user updates
    if (originalUser) {
      const userDob = originalUser.dataNascimento ? originalUser.dataNascimento.split('T')[0] : '';
      const hasChanges =
        formData.name !== originalUser.nome ||
        formData.email !== originalUser.email ||
        formData.contact !== originalUser.telefone ||
        (formData.dateOfBirth && formData.dateOfBirth !== userDob);

      if (hasChanges) {
        setShowConfirmation(true);
        setIsLoading(false);
        return;
      }
    }

    await processCreation();
  };



  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">Novo Agendamento</DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {date.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} às {time}
          </p>
        </DialogHeader>
        <DialogPrimitive.Description className="sr-only">
          Preencha os dados do utente para criar uma nova marcação
        </DialogPrimitive.Description>

        {showConfirmation ? (
          <div className="space-y-4 mt-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 flex gap-3">
              <AlertCircleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">Alterações detetadas</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  Os dados do utente foram alterados. Deseja atualizar a ficha do utente com as novas informações antes de criar a marcação?
                </p>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                  <ul className="list-disc pl-4">
                    {formData.name !== originalUser?.nome && <li>Nome alterado</li>}
                    {formData.email !== originalUser?.email && <li>Email alterado</li>}
                    {formData.contact !== originalUser?.telefone && <li>Contacto alterado</li>}
                    {formData.dateOfBirth !== (originalUser?.dataNascimento?.split('T')[0] || '') && <li>Data de nasc. alterada</li>}
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowConfirmation(false)} className="flex-1">
                Voltar / Corrigir
              </Button>
              <Button onClick={() => { setIsLoading(true); processCreation(); }} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                Confirmar e Marcar
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nif" className="text-gray-900 dark:text-gray-100">NIF *</Label>
                <Input
                  id="nif"
                  type="text"
                  placeholder="123456789"
                  maxLength={9}
                  value={formData.nif}
                  onChange={(e) => setFormData({ ...formData, nif: e.target.value.replace(/\D/g, '') })}
                  className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${errors.nif ? 'border-red-500' : ''}`}
                />
                {errors.nif && <p className="text-sm text-red-500">{errors.nif}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob" className="text-gray-900 dark:text-gray-100">Data de Nascimento</Label>
                <Popover open={birthDatePickerOpen} onOpenChange={(open) => {
                  setBirthDatePickerOpen(open);
                  if (open) {
                    setCalendarMonth(birthDateValue ?? new Date());
                  }
                }}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      {formData.dateOfBirth || 'Selecionar data'}
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
                          const formatted = date.toISOString().split('T')[0];
                          setFormData({ ...formData, dateOfBirth: formatted });
                          setBirthDatePickerOpen(false);
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-900 dark:text-gray-100">Nome *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && <p className="text-sm text-red-500 whitespace-pre-line">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-900 dark:text-gray-100">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact" className="text-gray-900 dark:text-gray-100">Contacto *</Label>
              <Input
                id="contact"
                type="text"
                placeholder="912345678"
                maxLength={9}
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value.replace(/\D/g, '') })}
                className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${errors.contact ? 'border-red-500' : ''}`}
              />
              {errors.contact && <p className="text-sm text-red-500">{errors.contact}</p>}
            </div>


            <div className="space-y-2">
              <Label htmlFor="subject" className="text-gray-900 dark:text-gray-100">Assunto *</Label>
              <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                <SelectTrigger className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${errors.subject ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Selecione o assunto" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject} className="text-gray-900 dark:text-gray-100">
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-900 dark:text-gray-100">Descrição curta</Label>
              <Textarea
                id="description"
                placeholder="Descreva brevemente o motivo da marcação..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-gray-100 mb-2 block">Anexar documentos (opcional)</Label>
              <FileUpload
                selectedFiles={selectedFiles}
                onChange={setSelectedFiles}
                isUploading={isLoading}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1 border-gray-300 dark:border-gray-700" disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" disabled={isLoading}>
                {isLoading ? 'A marcar...' : 'Marcar'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
