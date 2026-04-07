import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

import { toast } from 'sonner';
import { documentosApi } from '../../services/api';
import { FileUpload } from '../shared/FileUpload';
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning';
import { UnsavedChangesModal } from '../shared/UnsavedChangesModal';

interface ClientAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  date: Date;
  time: string;
  utenteId: number;
  onSuccess?: () => void;
}

import SUBJECTS, { getSubjectLabel } from '../../lib/subjects';
import { calendarioApi, marcacoesApi, apiRequest } from '../../services/api';
import { useTranslation } from 'react-i18next';

export function ClientAppointmentDialog({ open, onClose, date, time, utenteId, onSuccess }: ClientAppointmentDialogProps) {
  const { t, i18n } = useTranslation();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [tempReservaId, setTempReservaId] = useState<number | null>(null);
  const [pendingClose, setPendingClose] = useState(false);

  const isDirty = useMemo(() => {
    return subject !== '' || description.trim() !== '' || selectedFiles.length > 0;
  }, [subject, description, selectedFiles]);

  const blocker = useUnsavedChangesWarning(isDirty);

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

      // Validar se a data/hora não é no passado
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

      const data = await marcacoesApi.reservarSlot({
        data: localDateTime,
        utenteId: utenteId,
        criadoPorId: utenteId,
      });

      setTempReservaId(data.tempId);
      console.log('Slot reservado temporariamente:', data.tempId);

    } catch (error) {
      console.error('Erro ao reservar slot:', error);
      toast.error(t('appointmentDialog.errors.slotOccupied'));
      onClose();
    }
  };

  const liberarSlot = async () => {
    if (!tempReservaId) return;

    try {
      await marcacoesApi.libertarSlot(tempReservaId);
      console.log('Slot liberado:', tempReservaId);
      setTempReservaId(null);
    } catch (error) {
      console.error('Erro ao liberar slot:', error);
    }
  };

  const handleClose = async () => {
    // Liberar slot antes de fechar
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

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!subject) newErrors.subject = t('appointmentDialog.errors.subjectRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error(t('appointmentDialog.errors.subjectRequired'));
      return;
    }

    setIsLoading(true);
    try {
      // 1. PRIMEIRO: Liberar slot temporário
      if (tempReservaId) {
        await marcacoesApi.libertarSlot(tempReservaId);
        console.log('Slot temporário liberado antes de criar marcação real');
        setTempReservaId(null);
      }

      // 2. DEPOIS: Criar marcação real
      const [hours, minutes] = time.split(':');
      const dateTime = new Date(date);
      dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const localDateTime = format(dateTime, "yyyy-MM-dd'T'HH:mm:ss");

      // Use apiRequest directly to match exact original body format but with CSRF protection
      // We avoid marcacoesApi.criarRemota here because strict typing would force us to send 
      // fields that might not be needed by this specific endpoint variant
      const response = await apiRequest<{ id: number }>('/api/marcacoes/remota', {
        method: 'POST',
        body: JSON.stringify({
          data: localDateTime,
          assunto: subject,
          utenteId: utenteId,
        }),
      });

      // Guardar o ID da marcação criada para upload de documentos
      const marcacaoId = response.id;

      toast.success(t('appointmentDialog.messages.appointmentCreated'));

      // Se houver ficheiros selecionados, fazer upload
      if (selectedFiles.length > 0) {
        try {
          await documentosApi.uploadDocumentos(marcacaoId, selectedFiles);
          toast.success(t('appointmentDialog.messages.documentsUploaded', { count: selectedFiles.length }));
        } catch (uploadError) {
          console.error('Erro ao enviar documentos:', uploadError);
          toast.error(t('appointmentDialog.messages.documentsUploadError'));
        }
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao criar marcação:', error);
      toast.error(error instanceof Error ? error.message : t('auth.errorCreatingAccount'));
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <>
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && requestClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">{t('appointmentDialog.title')}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {date.toLocaleDateString(i18n.resolvedLanguage?.startsWith('en') ? 'en-GB' : 'pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} {t('appointmentDialog.at')} {time}
          </p>
        </DialogHeader>
        <DialogPrimitive.Description className="sr-only">
          {t('appointmentDialog.description')}
        </DialogPrimitive.Description>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-subject" className="text-foreground">{t('appointmentDialog.fields.subject')}</Label>
            <Select value={subject} onValueChange={(value) => setSubject(value)}>
              <SelectTrigger
                id="client-subject"
                aria-invalid={!!errors.subject}
                aria-describedby={errors.subject ? 'client-subject-error' : undefined}
                className={`bg-card border-border text-foreground ${errors.subject ? 'border-status-error' : ''}`}
              >
                <SelectValue placeholder={t('appointmentDialog.fields.subjectPlaceholder')} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {SUBJECTS.map((option) => (
                  <SelectItem key={option} value={option} className="text-popover-foreground">
                    {getSubjectLabel(option, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.subject && <p id="client-subject-error" className="text-sm text-status-error">{errors.subject}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">{t('requisitions.ui.description')}</Label>
            <Textarea
              id="description"
              placeholder={t('appointmentDialog.fields.shortDescriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-card border-border text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-upload" className="text-foreground mb-2 block">{t('appointmentDialog.fields.attachDocs')}</Label>
            <FileUpload
              inputId="client-upload"
              describedById="client-upload-help"
              selectedFiles={selectedFiles}
              onChange={setSelectedFiles}
              isUploading={isLoading}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={requestClose} className="flex-1">
              {t('appointmentDialog.actions.cancel')}
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
              {isLoading ? t('todayAppointments.processing') : t('appointmentDialog.actions.book')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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
    </>
  );
}
