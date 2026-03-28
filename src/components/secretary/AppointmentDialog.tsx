import { useState, useEffect, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { FileUpload } from '../shared/FileUpload';
import { DatePickerField } from '../ui/date-picker-field';
import SUBJECTS, { getSubjectLabel } from '../../lib/subjects';
import { calendarioApi, utilizadoresApi, UtilizadorInfo, documentosApi, apiRequest } from '../../services/api';
import { AlertCircleIcon } from '../shared/CustomIcons';
import { validateName, validateNIF, validateContact, validateEmail, validateBirthDate } from '../../lib/validations';
import { useTranslation } from 'react-i18next';
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning';
import { UnsavedChangesModal } from '../shared/UnsavedChangesModal';

interface AppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  date: Date;
  time: string;
  funcionarioId: number;
}

export function AppointmentDialog({ open, onClose, onSuccess, date, time, funcionarioId }: AppointmentDialogProps) {
  const { t, i18n } = useTranslation();
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
  const tempReservaRef = useRef<number | null>(null);

  const [originalUser, setOriginalUser] = useState<UtilizadorInfo | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  const dateLocale = i18n.resolvedLanguage?.startsWith('en') ? 'en-GB' : 'pt-PT';

  const isDirty = useMemo(() => {
    return (
      formData.nif !== '' ||
      formData.name !== '' ||
      formData.email !== '' ||
      formData.contact !== '' ||
      formData.dateOfBirth !== '' ||
      formData.subject !== '' ||
      formData.description !== '' ||
      selectedFiles.length > 0
    );
  }, [formData, selectedFiles]);

  const blocker = useUnsavedChangesWarning(isDirty);

  const setNifError = (message?: string) => {
    setErrors((prev) => {
      if (!message) {
        if (!prev.nif) return prev;
        const { nif, ...rest } = prev;
        return rest;
      }
      return { ...prev, nif: message };
    });
  };

  const handleNifChange = (rawValue: string) => {
    const nif = rawValue.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, nif }));

    // While typing, clear previous lookup data and only show hard error when 9 digits are present and invalid.
    if (nif.length < 9) {
      setOriginalUser(null);
      setNifError(undefined);
      return;
    }

    if (!validateNIF(nif)) {
      setOriginalUser(null);
      setNifError(t('appointmentDialog.errors.nifInvalid'));
      return;
    }

    setNifError(undefined);
  };

  // Reservar slot ao abrir o dialog
  useEffect(() => {
    if (open) {
      reservarSlot();
    }

    // Cleanup: liberar reserva ao fechar ou desmontar
    return () => {
      if (tempReservaRef.current) {
        liberarSlotRef(tempReservaRef.current);
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
        toast.error(t('appointmentDialog.errors.pastDate'));
        onClose();
        return;
      }

      // Verificar se o slot está bloqueado
      const dateStr = format(date, 'yyyy-MM-dd');
      const isBlocked = await calendarioApi.verificarSlot(dateStr, time, 'SECRETARIA');
      if (isBlocked) {
        toast.error(t('appointmentDialog.errors.slotUnavailable'));
        onClose();
        return;
      }

      const localDateTime = format(dateTime, "yyyy-MM-dd'T'HH:mm:ss");

      // Use apiRequest for automatic CSRF token inclusion and cookie-based auth
      const data = await apiRequest<{ tempId: number }>('/api/marcacoes/reservar-slot', {
        method: 'POST',
        body: JSON.stringify({
          data: localDateTime,
          criadoPorId: funcionarioId,
          tipoAgenda: 'SECRETARIA',
        }),
      });

      setTempReservaId(data.tempId);
      tempReservaRef.current = data.tempId;
      console.log(t('appointmentDialog.messages.slotReserved'), data.tempId);
    } catch (error: any) {
      console.error('Erro ao reservar slot:', error);
      toast.error(error.message || t('appointmentDialog.errors.slotOccupied'));
      onClose();
    }
  };

  const liberarSlotRef = async (id: number) => {
    try {
      await apiRequest(`/api/marcacoes/libertar-slot/${id}`, {
        method: 'DELETE',
      });
      console.log('Slot liberado via ref:', id);
    } catch (error) {
      console.error('Erro ao liberar slot:', error);
    }
  };

  const liberarSlot = async () => {
    if (!tempReservaId) return;

    try {
      await apiRequest(`/api/marcacoes/libertar-slot/${tempReservaId}`, {
        method: 'DELETE',
      });
      console.log(t('appointmentDialog.messages.slotReleased'), tempReservaId);
      setTempReservaId(null);
      tempReservaRef.current = null;
    } catch (error) {
      console.error('Erro ao liberar slot:', error);
    }
  };

  // NIF Auto-fill Effect
  useEffect(() => {
    console.log('NIF changed:', formData.nif, 'Length:', formData.nif.length);
    const checkNif = async () => {
      if (formData.nif.length === 9) {
        if (!validateNIF(formData.nif)) {
          setOriginalUser(null);
          setNifError(t('appointmentDialog.errors.nifInvalid'));
          return;
        }

        setNifError(undefined);
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
            toast.success(t('appointmentDialog.messages.userLoaded'));
          } else {
            // Should not happen if API throws 404, but coverage
            toast.info(t('appointmentDialog.messages.userNotFound'));
            setOriginalUser(null);
          }
        } catch (e) {
          console.error('Error fetching user by NIF:', e);
          toast.info(t('appointmentDialog.messages.userNotFoundOrNetwork'));
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

  const requestClose = () => {
    if (isDirty) {
      setPendingClose(true);
    } else {
      handleClose();
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!validateNIF(formData.nif)) {
      newErrors.nif = t('appointmentDialog.errors.nifMustHave9Digits');
    }
    const nameValidation = validateName(formData.name);
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.error || t('appointmentDialog.errors.nameInvalid');
    }
    if (!formData.email.trim()) {
      newErrors.email = t('appointmentDialog.errors.emailRequired');
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t('appointmentDialog.errors.emailInvalid');
    }
    if (formData.contact && !validateContact(formData.contact)) {
      newErrors.contact = t('appointmentDialog.errors.contactInvalid');
    }

    // Mandatory Date of Birth validation
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = t('appointmentDialog.errors.birthDateRequired');
    } else {
      // Reformat from YYYY-MM-DD to DD/MM/YYYY for the validator
      const [year, month, day] = formData.dateOfBirth.split('-');
      const formattedDateForValidation = `${day}/${month}/${year}`;
      const birthValidation = validateBirthDate(formattedDateForValidation);
      if (!birthValidation.valid) {
        newErrors.dateOfBirth = birthValidation.error || t('appointmentDialog.errors.dateInvalid');
      }
    }

    if (!formData.subject) {
      newErrors.subject = t('appointmentDialog.errors.subjectRequired');
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
          toast.success(t('appointmentDialog.messages.userUpdated'));

          // Wait 1 second to ensure persistence/propagation and provide visual feedback
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (e) {
          console.error('Failed to update user', e);
          toast.error(t('appointmentDialog.errors.updateUserFailed'));
          throw e; // Stop here if update fails
        }
      }

      const dataHora = new Date(date);
      const [hours, minutes] = time.split(':');
      dataHora.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const payload = {
        funcionarioId,
        criadoPorId: funcionarioId, // Added for consistency
        data: format(dataHora, "yyyy-MM-dd'T'HH:mm:ss"),
        assunto: formData.subject,
        descricao: formData.description,
        utenteNif: formData.nif,
        utenteNome: formData.name,
        utenteEmail: formData.email,
        utenteTelefone: formData.contact,
        utenteDataNasc: formData.dateOfBirth || undefined,
      };

      const response = await apiRequest<{ id: number }>('/api/marcacoes/presencial', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      console.log('[AppointmentDialog] Marcação criada no backend, aguardando 500ms antes de recarregar...');
      toast.success(t('appointmentDialog.messages.appointmentCreated'));

      // Se houver ficheiros selecionados, fazer upload
      if (selectedFiles.length > 0) {
        try {
          await documentosApi.uploadDocumentos(response.id, selectedFiles);
          toast.success(t('appointmentDialog.messages.documentsUploaded', { count: selectedFiles.length }));
        } catch (uploadError) {
          console.error('Erro ao enviar documentos:', uploadError);
          toast.error(t('appointmentDialog.messages.documentsUploadError'));
        }
      }

      // Wait 500ms to ensure backend transaction commits before reloading
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('[AppointmentDialog] Chamando onSuccess para recarregar marcações...');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao criar marcação:', error);
      toast.error(t('appointmentDialog.errors.creationFailed', { message: error.message || 'Falha na criação' }));
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t('appointmentDialog.errors.fixForm'));
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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && requestClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">{t('appointmentDialog.title')}</DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {date.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} {t('appointmentDialog.at')} {time}
          </p>
        </DialogHeader>
        <DialogPrimitive.Description className="sr-only">
          {t('appointmentDialog.description')}
        </DialogPrimitive.Description>

        {showConfirmation ? (
          <div className="space-y-4 mt-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 flex gap-3">
              <AlertCircleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">{t('appointmentDialog.confirm.title')}</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  {t('appointmentDialog.confirm.body')}
                </p>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                  <ul className="list-disc pl-4">
                    {formData.name !== originalUser?.nome && <li>{t('appointmentDialog.confirm.nameChanged')}</li>}
                    {formData.email !== originalUser?.email && <li>{t('appointmentDialog.confirm.emailChanged')}</li>}
                    {formData.contact !== originalUser?.telefone && <li>{t('appointmentDialog.confirm.contactChanged')}</li>}
                    {formData.dateOfBirth !== (originalUser?.dataNascimento?.split('T')[0] || '') && <li>{t('appointmentDialog.confirm.birthDateChanged')}</li>}
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowConfirmation(false)} className="flex-1">
                {t('appointmentDialog.confirm.back')}
              </Button>
              <Button onClick={() => { setIsLoading(true); processCreation(); }} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                {t('appointmentDialog.confirm.confirmAndBook')}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nif" className="text-gray-900 dark:text-gray-100">{t('appointmentDialog.fields.nif')}</Label>
                <Input
                  id="nif"
                  type="text"
                  placeholder={t('appointmentDialog.fields.nifPlaceholder')}
                  maxLength={9}
                  value={formData.nif}
                  onChange={(e) => handleNifChange(e.target.value)}
                  onBlur={() => {
                    if (!formData.nif) {
                      setNifError(t('appointmentDialog.errors.nifRequired'));
                      return;
                    }
                    if (!validateNIF(formData.nif)) {
                      setNifError(t('appointmentDialog.errors.nifInvalid'));
                      return;
                    }
                    setNifError(undefined);
                  }}
                  aria-invalid={!!errors.nif}
                  aria-describedby={errors.nif ? 'nif-error' : undefined}
                  className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${errors.nif ? 'border-red-500' : ''}`}
                />
                {errors.nif && <p id="nif-error" className="text-sm text-red-500">{errors.nif}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob" className="text-gray-900 dark:text-gray-100">{t('appointmentDialog.fields.birthDate')}</Label>
                <DatePickerField
                  id="dob"
                  value={formData.dateOfBirth}
                  onChange={(value) => setFormData({ ...formData, dateOfBirth: value })}
                  buttonClassName={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                />
                {errors.dateOfBirth && <p className="text-sm text-red-500">{errors.dateOfBirth}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-900 dark:text-gray-100">{t('appointmentDialog.fields.name')}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t('appointmentDialog.fields.name')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
                className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && <p id="name-error" className="text-sm text-red-500 whitespace-pre-line">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-900 dark:text-gray-100">{t('appointmentDialog.fields.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('appointmentDialog.fields.emailPlaceholder')}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && <p id="email-error" className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact" className="text-gray-900 dark:text-gray-100">
                {t('appointmentDialog.fields.contact')} <span className="text-xs font-normal text-gray-500">{t('common.optional')}</span>
              </Label>
              <Input
                id="contact"
                type="text"
                placeholder={t('appointmentDialog.fields.contactPlaceholder')}
                maxLength={9}
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value.replace(/\D/g, '') })}
                aria-invalid={!!errors.contact}
                aria-describedby={errors.contact ? 'contact-error' : undefined}
                className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${errors.contact ? 'border-red-500' : ''}`}
              />
              {errors.contact && <p id="contact-error" className="text-sm text-red-500">{errors.contact}</p>}
            </div>


            <div className="space-y-2">
              <Label htmlFor="secretary-subject" className="text-gray-900 dark:text-gray-100">{t('appointmentDialog.fields.subject')}</Label>
              <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                <SelectTrigger
                  id="secretary-subject"
                  aria-invalid={!!errors.subject}
                  aria-describedby={errors.subject ? 'secretary-subject-error' : undefined}
                  className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${errors.subject ? 'border-red-500' : ''}`}
                >
                  <SelectValue placeholder={t('appointmentDialog.fields.subjectPlaceholder')} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject} className="text-gray-900 dark:text-gray-100">
                      {getSubjectLabel(subject, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subject && <p id="secretary-subject-error" className="text-sm text-red-500">{errors.subject}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-900 dark:text-gray-100">{t('appointmentDialog.fields.shortDescription')}</Label>
              <Textarea
                id="description"
                placeholder={t('appointmentDialog.fields.shortDescriptionPlaceholder')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretary-upload" className="text-gray-900 dark:text-gray-100 mb-2 block">{t('appointmentDialog.fields.attachDocs')}</Label>
              <FileUpload
                inputId="secretary-upload"
                describedById="secretary-upload-help"
                selectedFiles={selectedFiles}
                onChange={setSelectedFiles}
                isUploading={isLoading}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={requestClose} className="flex-1 border-gray-300 dark:border-gray-700" disabled={isLoading}>
                {t('appointmentDialog.actions.cancel')}
              </Button>
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" disabled={isLoading}>
                {isLoading ? t('appointmentDialog.actions.booking') : t('appointmentDialog.actions.book')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
      <UnsavedChangesModal 
        isOpen={blocker.state === 'blocked' || pendingClose}
        onConfirm={() => {
          if (blocker.state === 'blocked') blocker.proceed?.();
          if (pendingClose) {
            setPendingClose(false);
            setTimeout(() => {
              handleClose();
            }, 100);
          }
        }}
        onCancel={() => {
          if (blocker.state === 'blocked') blocker.reset?.();
          if (pendingClose) setPendingClose(false);
        }}
      />
    </Dialog>
  );
}
