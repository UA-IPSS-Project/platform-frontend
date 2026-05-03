import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { FileUpload } from '../shared/FileUpload';
import { DatePickerField } from '../ui/date-picker-field';
import { utilizadoresApi, UtilizadorInfo, documentosApi, apiRequest, marcacoesApi, type Assunto } from '../../services/api';
import { AlertCircleIcon } from '../shared/CustomIcons';
import { validateNIF, validateEmail, validateContact, validateName, validateBirthDate } from '../../lib/validations';
import { capitalizeFirstLetter } from '../../utils/formatters';
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
  const dateLocale = i18n.resolvedLanguage?.startsWith('en') ? 'en-GB' : 'pt-PT';
  const [isLoading, setIsLoading] = useState(false);
  const [nifError, setNifError] = useState<string | undefined>(undefined);
  const [originalUser, setOriginalUser] = useState<UtilizadorInfo | null>(null);
  const [tempReservaId, setTempReservaId] = useState<number | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  const [subjects, setSubjects] = useState<Assunto[]>([]);

  const [formData, setFormData] = useState({
    nif: '',
    name: '',
    email: '',
    dateOfBirth: '',
    contact: '',
    subject: '',
    description: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDirty = useMemo(() => {
    return (
      formData.nif !== '' ||
      formData.name !== '' ||
      formData.email !== '' ||
      formData.contact !== '' ||
      formData.dateOfBirth !== '' ||
      formData.description !== '' ||
      formData.subject !== '' ||
      selectedFiles.length > 0
    );
  }, [formData, selectedFiles]);

  const blocker = useUnsavedChangesWarning(isDirty && open);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await marcacoesApi.listarAssuntos();
        // Sort subjects alphabetically, but keep "Outro" always last
        const sorted = data.sort((a, b) => {
          if (a.nome.toLowerCase() === 'outro') return 1;
          if (b.nome.toLowerCase() === 'outro') return -1;
          return a.nome.localeCompare(b.nome);
        });
        setSubjects(sorted);
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
      }
    };
    if (open) {
      fetchSubjects();
    }
  }, [open]);

  // Reserva de slot temporária
  useEffect(() => {
    const reservarSlot = async () => {
      if (open && !tempReservaId) {
        try {
          const dataHora = new Date(date);
          const [hours, minutes] = time.split(':');
          dataHora.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          const res = await marcacoesApi.reservarSlot({
            data: format(dataHora, "yyyy-MM-dd'T'HH:mm:ss"),
            tipoAgenda: 'SECRETARIA',
            criadoPorId: funcionarioId
          });
          setTempReservaId(res.tempId);
          console.log('[AppointmentDialog] Slot reservado temporariamente:', res.tempId);
        } catch (error: any) {
          console.error('Falha ao reservar slot temporário:', error);
          toast.error(error.message || 'Não foi possível reservar este horário.');
          onClose();
        }
      }
    };
    reservarSlot();
  }, [open, date, time, tempReservaId, onClose, funcionarioId]);

  const liberarSlot = async () => {
    if (tempReservaId) {
      try {
        await marcacoesApi.libertarSlot(tempReservaId);
        setTempReservaId(null);
        console.log('[AppointmentDialog] Slot temporário libertado.');
      } catch (error) {
        console.error('Erro ao libertar slot:', error);
      }
    }
  };

  useEffect(() => {
    const checkNif = async () => {
      if (formData.nif.length === 9) {
        if (!validateNIF(formData.nif)) {
          setNifError(t('appointmentDialog.errors.nifInvalid'));
          setOriginalUser(null);
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
            toast.info(t('appointmentDialog.messages.userNotFound'));
            setOriginalUser(null);
          }
        } catch (e) {
          console.error('Error fetching user by NIF:', e);
          toast.info(t('appointmentDialog.messages.userNotFoundOrNetwork'));
          setOriginalUser(null);
        }
      } else if (formData.nif.length > 0 && formData.nif.length < 9) {
        // Reset state if NIF is being edited and is not 9 digits
        setOriginalUser(null);
        setNifError(undefined);
      }
    };

    const timeoutId = setTimeout(() => {
      checkNif();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.nif, t]);

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

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = t('appointmentDialog.errors.birthDateRequired');
    } else {
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

      if (originalUser && showConfirmation) {
        try {
          await utilizadoresApi.atualizar(originalUser.id, {
            nome: formData.name,
            email: formData.email,
            telefone: formData.contact,
            dataNasc: formData.dateOfBirth || undefined,
          });
          toast.success(t('appointmentDialog.messages.userUpdated'));
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
          console.error('Failed to update user', e);
          toast.error(t('appointmentDialog.errors.updateUserFailed'));
          throw e;
        }
      }

      const dataHora = new Date(date);
      const [hours, minutes] = time.split(':');
      dataHora.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const payload = {
        funcionarioId,
        criadoPorId: funcionarioId,
        descricao: formData.description,
        data: format(dataHora, "yyyy-MM-dd'T'HH:mm:ss"),
        assunto: formData.subject,
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

      toast.success(t('appointmentDialog.messages.appointmentCreated'));

      if (selectedFiles.length > 0) {
        try {
          await documentosApi.uploadDocumentos(response.id, selectedFiles);
          toast.success(t('appointmentDialog.messages.documentsUploaded', { count: selectedFiles.length }));
        } catch (uploadError) {
          console.error('Erro ao enviar documentos:', uploadError);
          toast.error(t('appointmentDialog.messages.documentsUploadError'));
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">{t('appointmentDialog.title')}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {date.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} {t('appointmentDialog.at')} {time}
          </p>
        </DialogHeader>
        <DialogPrimitive.Description className="sr-only">
          {t('appointmentDialog.description')}
        </DialogPrimitive.Description>

        {showConfirmation ? (
          <div className="space-y-4 mt-4">
            <div className="bg-[color:var(--status-warning-soft)]/40 p-4 rounded-lg border border-[color:var(--status-warning)]/40 flex gap-3">
              <AlertCircleIcon className="w-6 h-6 text-status-warning flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-status-warning">{t('appointmentDialog.confirm.title')}</h4>
                <p className="text-sm text-status-warning mt-1">
                  {t('appointmentDialog.confirm.body')}
                </p>
                <div className="mt-2 text-sm text-status-warning">
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
              <Button onClick={() => { setIsLoading(true); processCreation(); }} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                {t('appointmentDialog.confirm.confirmAndBook')}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nif" className="text-foreground">{t('appointmentDialog.fields.nif')}</Label>
                <Input
                  id="nif"
                  type="text"
                  placeholder={t('appointmentDialog.fields.nifPlaceholder')}
                  maxLength={9}
                  value={formData.nif}
                  onChange={(e) => {
                    const newNif = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, nif: newNif });
                    if (originalUser || nifError) {
                      setOriginalUser(null);
                      setNifError(undefined);
                    }
                  }}
                  aria-invalid={!!errors.nif || !!nifError}
                  aria-describedby={errors.nif ? 'nif-error' : (nifError ? 'nif-remote-error' : undefined)}
                  className={`bg-card border-border text-foreground ${errors.nif || nifError ? 'border-status-error' : ''}`}
                />
                {errors.nif && <p id="nif-error" className="text-sm text-status-error">{errors.nif}</p>}
                {nifError && <p id="nif-remote-error" className="text-sm text-status-error">{nifError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-foreground">{t('appointmentDialog.fields.birthDate')}</Label>
                <DatePickerField
                  id="dateOfBirth"
                  value={formData.dateOfBirth}
                  placeholder={t('appointmentDialog.fields.birthDatePlaceholder')}
                  onChange={(val) => setFormData({ ...formData, dateOfBirth: val })}
                />
                {errors.dateOfBirth && <p className="text-sm text-status-error">{errors.dateOfBirth}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">{t('appointmentDialog.fields.name')}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t('appointmentDialog.fields.namePlaceholder')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
                className={`bg-card border-border text-foreground ${errors.name ? 'border-status-error' : ''}`}
              />
              {errors.name && <p id="name-error" className="text-sm text-status-error">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">{t('appointmentDialog.fields.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('appointmentDialog.fields.emailPlaceholder')}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={`bg-card border-border text-foreground ${errors.email ? 'border-status-error' : ''}`}
              />
              {errors.email && <p id="email-error" className="text-sm text-status-error">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact" className="text-foreground">{t('appointmentDialog.fields.contact')}</Label>
              <Input
                id="contact"
                type="text"
                placeholder={t('appointmentDialog.fields.contactPlaceholder')}
                maxLength={9}
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value.replace(/\D/g, '') })}
                aria-invalid={!!errors.contact}
                aria-describedby={errors.contact ? 'contact-error' : undefined}
                className={`bg-card border-border text-foreground ${errors.contact ? 'border-status-error' : ''}`}
              />
              {errors.contact && <p id="contact-error" className="text-sm text-status-error">{errors.contact}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretary-subject" className="text-foreground">{t('appointmentDialog.fields.subject')}</Label>
              <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                <SelectTrigger
                  id="secretary-subject"
                  aria-invalid={!!errors.subject}
                  aria-describedby={errors.subject ? 'secretary-subject-error' : undefined}
                  className={`bg-card border-border text-foreground ${errors.subject ? 'border-status-error' : ''}`}
                >
                  <SelectValue placeholder={t('appointmentDialog.fields.subjectPlaceholder')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.nome} className="text-popover-foreground">
                      {capitalizeFirstLetter(s.nome)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subject && <p id="secretary-subject-error" className="text-sm text-status-error">{errors.subject}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretary-description" className="text-foreground">{t('appointmentDialog.fields.description')}</Label>
              <Textarea
                id="secretary-description"
                placeholder={t('appointmentDialog.fields.descriptionPlaceholder')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-card border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretary-upload" className="text-foreground mb-2 block">{t('appointmentDialog.fields.attachDocs')}</Label>
              <FileUpload
                inputId="secretary-upload"
                describedById="secretary-upload-help"
                selectedFiles={selectedFiles}
                onChange={setSelectedFiles}
                isUploading={isLoading}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={requestClose} className="flex-1 border-border" disabled={isLoading}>
                {t('appointmentDialog.actions.cancel')}
              </Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
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
