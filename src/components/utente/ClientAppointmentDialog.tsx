import { useState, useEffect, useMemo, FormEvent } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { FileUpload } from '../shared/FileUpload';
import { apiRequest, marcacoesApi, documentosApi, type Assunto } from '../../services/api';
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning';
import { UnsavedChangesModal } from '../shared/UnsavedChangesModal';

interface ClientAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  date: Date;
  time: string;
  utenteId: number;
}

export function ClientAppointmentDialog({ 
  open, 
  onClose, 
  onSuccess, 
  date, 
  time, 
  utenteId 
}: ClientAppointmentDialogProps) {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [subjects, setSubjects] = useState<Assunto[]>([]);
  const [subject, setSubject] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingClose, setPendingClose] = useState(false);

  // Dirty state for protection
  const isDirty = useMemo(() => {
     return subject !== '' || selectedFiles.length > 0;
  }, [subject, selectedFiles]);

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

  const handleClose = () => {
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
    if (!subject) {
      newErrors.subject = t('appointmentDialog.errors.subjectRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const dataHora = new Date(date);
      const [hours, minutes] = time.split(':');
      dataHora.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const payload = {
        utenteId: utenteId,
        criadoPorId: utenteId,
        data: format(dataHora, "yyyy-MM-dd'T'HH:mm:ss"),
        assunto: subject,
      };

      const response = await apiRequest<{ id: number }>('/api/marcacoes/remota', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (selectedFiles.length > 0) {
        try {
          await documentosApi.uploadDocumentosBulk(response.id, selectedFiles);
        } catch (uploadError) {
          console.error('Error uploading files:', uploadError);
        }
      }

      toast.success(t('appointmentDialog.messages.appointmentCreated'));
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      toast.error(error.message || t('appointmentDialog.errors.creationFailed'));
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
                {subjects.map((option) => (
                  <SelectItem key={option.id} value={option.nome} className="text-popover-foreground">
                    {option.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.subject && <p id="client-subject-error" className="text-sm text-status-error">{errors.subject}</p>}
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
