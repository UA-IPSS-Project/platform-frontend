import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '../ui/dialog';
import { Button } from '../ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Label } from '../ui/label';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { XIcon, FileTextIcon, AlertTriangleIcon, UserIcon, ClockIcon, PhoneIcon, MailIcon, BellIcon, MenuIcon } from '../shared/CustomIcons';
import { Download, Trash2, Upload } from 'lucide-react';

// EyeIcon SVG inline (usado para preview)
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
import { Appointment } from '../../types';
import { marcacoesApi, calendarioApi, documentosApi, DocumentoDTO } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { DocumentUploadDialog } from '../dialogs/DocumentUploadDialog';
import { StatusBadge } from '../shared/status-badge';
import { useTranslation } from 'react-i18next';

interface AppointmentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment;
  onUpdate: (id: string, updates: Partial<Appointment>) => void;
  onCancel: (id: string, reason: string) => void;
  isClient?: boolean;
  existingAppointments?: Appointment[];
}



export function AppointmentDetailsDialog({
  open,
  onClose,
  appointment,
  onUpdate,
  onCancel,
  isClient = false,
  existingAppointments = []
}: AppointmentDetailsDialogProps) {
  const { user: authUser } = useAuth();
  const { t, i18n } = useTranslation();
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [invalidReasons, setInvalidReasons] = useState<{ [key: number]: string }>({});
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showAddDocDialog, setShowAddDocDialog] = useState(false);
  const [showUpdateDocDialog, setShowUpdateDocDialog] = useState(false);
  const [updateDocIndex, setUpdateDocIndex] = useState<number | null>(null);
  const [newDocName, setNewDocName] = useState('');
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);

  // Estados para documentos
  const [documentos, setDocumentos] = useState<DocumentoDTO[]>([]);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Estados para reagendamento
  const today = new Date();
  const [rescheduleDate, setRescheduleDate] = useState<Date>(today);
  const [rescheduleTime, setRescheduleTime] = useState('');

  useEffect(() => {
    if (!open) {
      setCancelReason('');
      setShowCancelDialog(false);
      setSelectedDocs([]);
      setInvalidReasons({});
    } else {
      // Carregar documentos quando abrir o dialog
      loadDocumentos();
    }
  }, [open]);

  const loadDocumentos = async () => {
    setLoadingDocs(true);
    try {
      const docs = await documentosApi.listarDocumentos(parseInt(appointment.id));
      setDocumentos(docs);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleDownloadDocumento = async (doc: DocumentoDTO) => {
    try {
      await documentosApi.downloadDocumento(doc.id, doc.nomeOriginal);
      toast.success(t('documents.messages.downloadStarted', { name: doc.nomeOriginal }));
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      toast.error(t('documents.errors.download'));
    }
  };

  const handleRemoverDocumento = async (doc: DocumentoDTO) => {
    if (!confirm(t('appointmentDetails.confirmRemoveDocument', { name: doc.nomeOriginal }))) {
      return;
    }

    try {
      await documentosApi.removerDocumento(doc.id);
      setDocumentos(prev => prev.filter(d => d.id !== doc.id));
      toast.success(t('appointmentDetails.documentRemoved'));
    } catch (error) {
      console.error('Erro ao remover documento:', error);
      toast.error(t('appointmentDetails.documentRemoveError'));
    }
  };

  function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function cleanFilename(name: string) {
  if (!name) return "";
  const dotIndex = name.lastIndexOf(".");
  const baseName = dotIndex !== -1 ? name.substring(0, dotIndex) : name;
  const extension = dotIndex !== -1 ? name.substring(dotIndex) : "";

  const parts = baseName.split("_");
  if (parts.length >= 4) {
    // Novo formato: NIF_ASSUNTO_DATA_UUID (ASSUNTO pode ter underscores)
    const nif = parts[0];
    const contador = parts[parts.length - 2];
    const assuntoParts = parts.slice(1, parts.length - 2);
    const assunto = assuntoParts.join("_");
    
    // Na vista de marcação, apenas NIF_ASSUNTO_1 (sem data, pois já está no título)
    return `${nif}_${assunto}_${contador}${extension}`;
  } else if (parts.length === 3) {
    // Formato legado: NIF_TIPO_UUID
    return `${parts[0]}_${parts[1]}${extension}`;
  }
  return name;
}

  const handleDocToggle = (index: number) => {
    setSelectedDocs(prev => {
      const newSelected = prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index];

      // Remove a razão se desmarcar
      if (!newSelected.includes(index)) {
        setInvalidReasons(prevReasons => {
          const newReasons = { ...prevReasons };
          delete newReasons[index];
          return newReasons;
        });
      }

      return newSelected;
    });
  };

  const handleReasonChange = (index: number, reason: string) => {
    setInvalidReasons(prev => ({
      ...prev,
      [index]: reason
    }));
  };

  const handleNotifyInvalid = async () => {
    if (selectedDocs.length === 0) {
      toast.error(t('appointmentDetails.selectAtLeastOneDocument'));
      return;
    }

    // Verifica se todos os documentos selecionados têm justificativa
    const missingReasons = selectedDocs.some(index => !invalidReasons[index]?.trim());
    if (missingReasons) {
      toast.error(t('appointmentDetails.addReasonForEachDocument'));
      return;
    }

    try {
      const marcacaoId = parseInt(appointment.id);
      let notifiedCount = 0;
      await Promise.all(selectedDocs.map(async (index) => {
        const doc = appointment.documents?.[index];
        if (doc && 'id' in doc && typeof doc.id === 'number') {
          await documentosApi.notificarDocumentoInvalido(marcacaoId, doc.id, invalidReasons[index]);
          notifiedCount++;
        }
      }));
      if (notifiedCount > 0) {
        toast.success(t('appointmentDetails.userNotifiedInvalidDocuments'));
      } else {
        toast.error('Nenhum documento válido selecionado para notificação.');
      }
      setSelectedDocs([]);
      setInvalidReasons({});
    } catch (error: any) {
      toast.error(error.message || 'Erro ao notificar utente.');
    }
  };

  const handleCancelAppointment = async () => {
    let trimmedReason = cancelReason.trim();

    // Se for cliente e não tiver motivo, define motivo padrão
    if (isClient && !trimmedReason) {
      trimmedReason = t('appointmentDetails.cancelledByUser');
    }

    if (!trimmedReason) {
      toast.error(t('appointmentDetails.describeCancelReason'));
      return;
    }

    if (!authUser?.id) {
      toast.error(t('appointmentDetails.authUserNotIdentified'));
      return;
    }

    try {
      console.log('Cancelando marcação:', {
        marcacaoId: parseInt(appointment.id),
        novoEstado: 'CANCELADO',
        funcionarioId: authUser.id
      });

      // Usar a mesma API de mudar estado
      await marcacoesApi.atualizarEstado(
        parseInt(appointment.id),
        'CANCELADO',
        authUser.id,
        appointment.version,
        trimmedReason
      );

      // Atualizar estado local
      onCancel(appointment.id, trimmedReason);
      onUpdate(appointment.id, { status: 'cancelled', cancellationReason: trimmedReason });

      toast.success(t('appointmentDetails.appointmentCancelledAndUserNotified'));
      setCancelReason('');
      setShowCancelDialog(false);
      onClose();

    } catch (error: any) {
      console.error('Erro ao cancelar marcação:', error);
      const mensagemErro = error.response?.data?.message || error.message || t('appointmentDetails.cancelFailed');
      toast.error(mensagemErro);
    }
  };

  const handleCompleteAppointment = async () => {
    if (!authUser?.id) {
      toast.error(t('appointmentDetails.authUserNotIdentified'));
      return;
    }

    try {
      console.log('Concluindo atendimento:', {
        marcacaoId: parseInt(appointment.id),
        novoEstado: 'CONCLUIDO',
        funcionarioId: authUser.id
      });

      await marcacoesApi.atualizarEstado(
        parseInt(appointment.id),
        'CONCLUIDO',
        authUser.id,
        appointment.version
      );

      onUpdate(appointment.id, { status: 'completed' });
      toast.success(t('appointmentDetails.appointmentCompleted'));
      onClose();

    } catch (error: any) {
      console.error('Erro ao concluir atendimento:', error);
      const mensagemErro = error.response?.data?.message || error.message || t('appointmentDetails.completeFailed');
      toast.error(mensagemErro);
    }
  };

  const handleNoShowAppointment = async () => {
    if (!authUser?.id) {
      toast.error(t('appointmentDetails.authUserNotIdentified'));
      return;
    }

    try {
      console.log('Marcando como não compareceu:', {
        marcacaoId: parseInt(appointment.id),
        novoEstado: 'NAO_COMPARECIDO',
        funcionarioId: authUser.id
      });

      await marcacoesApi.atualizarEstado(
        parseInt(appointment.id),
        'NAO_COMPARECIDO',
        authUser.id,
        appointment.version
      );

      onUpdate(appointment.id, { status: 'no-show' });
      toast.success(t('appointmentDetails.markedNoShow'));
      onClose();

    } catch (error: any) {
      console.error('Erro ao marcar não comparência:', error);
      const mensagemErro = error.response?.data?.message || error.message || t('appointmentDetails.statusUpdateFailed');
      toast.error(mensagemErro);
    }
  };

  const handleStartAppointment = async () => {
    if (!authUser?.id) {
      toast.error(t('appointmentDetails.authUserNotIdentified'));
      return;
    }

    try {
      console.log('Iniciando atendimento:', {
        marcacaoId: parseInt(appointment.id),
        novoEstado: 'EM_PROGRESSO',
        funcionarioId: authUser.id
      });

      // Chamada à API com os parâmetros corretos
      const response = await marcacoesApi.atualizarEstado(
        parseInt(appointment.id),
        'EM_PROGRESSO',
        authUser.id,
        appointment.version
      );

      console.log('Resposta da API:', response);

      // Atualizar estado local do React para UI mudar instantaneamente
      onUpdate(appointment.id, { status: 'in-progress' });

      toast.success(t('appointmentDetails.appointmentStarted'));

      // Fechar o diálogo após atualizar o estado
      onClose();

    } catch (error: any) {
      console.error('Erro ao iniciar atendimento:', error);
      const mensagemErro = error.response?.data?.message || error.message || t('appointmentDetails.startFailed');
      toast.error(mensagemErro);
    }
  };

  const handleAddDocument = () => {
    if (!newDocName.trim()) {
      toast.error(t('appointmentDetails.enterDocumentName'));
      return;
    }

    const updatedDocuments = [
      ...(appointment.documents || []),
      { name: newDocName.trim() }
    ];

    onUpdate(appointment.id, { documents: updatedDocuments });
    toast.success(t('appointmentDetails.documentAdded'));
    setNewDocName('');
    setShowAddDocDialog(false);
  };

  const handleUpdateDocument = () => {
    if (updateDocIndex === null) return;
    if (!newDocName.trim()) {
      toast.error(t('appointmentDetails.enterNewDocumentName'));
      return;
    }

    const updatedDocuments = appointment.documents?.map((doc, index) =>
      index === updateDocIndex ? { ...doc, name: newDocName.trim() } : doc
    );

    onUpdate(appointment.id, { documents: updatedDocuments });
    toast.success(t('appointmentDetails.documentUpdated'));
    setNewDocName('');
    setUpdateDocIndex(null);
    setShowUpdateDocDialog(false);
  };


  // Availability Logic for Rescheduling
  const [availableRescheduleSlots, setAvailableRescheduleSlots] = useState<string[]>([]);
  const [slotCapacity, setSlotCapacity] = useState<number>(1);
  const [quickMonthBlocks, setQuickMonthBlocks] = useState<Set<string>>(new Set());
  const [holidaysByYear, setHolidaysByYear] = useState<Record<number, Set<string>>>({});

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        if (hour === 16 && minute > 45) break;
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  };

  useEffect(() => {
    if (!showRescheduleDialog) return;

    const loadHolidays = async () => {
      const year = rescheduleDate.getFullYear();
      if (holidaysByYear[year]) return;
      try {
        const dates = await calendarioApi.listarFeriados(year);
        setHolidaysByYear(prev => ({ ...prev, [year]: new Set(dates) }));
      } catch (error) {
        console.error('Erro ao carregar feriados para reagendamento:', error);
      }
    };

    loadHolidays();
  }, [rescheduleDate, showRescheduleDialog, holidaysByYear]);

  const isHoliday = (date: Date) => {
    const set = holidaysByYear[date.getFullYear()];
    if (!set) return false;
    const key = format(date, 'yyyy-MM-dd');
    return set.has(key);
  };

  // Fetch slot capacity once when dialog opens
  useEffect(() => {
    if (!showRescheduleDialog) return;
    calendarioApi.listarConfiguracaoSlots()
      .then((cfgs: any[]) => {
        const cfg = cfgs.find(c => c.tipo === 'SECRETARIA');
        setSlotCapacity(Math.max(1, cfg?.capacidadePorSlot ?? 1));
      })
      .catch(() => setSlotCapacity(1));
  }, [showRescheduleDialog]);

  const rescheduleYear = rescheduleDate.getFullYear();
  const rescheduleMonth = rescheduleDate.getMonth() + 1;

  // Load admin blocks for the current month
  useEffect(() => {
    if (!showRescheduleDialog) return;
    const loadBlocks = async () => {
      try {
        const bloqueios = await calendarioApi.listarBloqueios(rescheduleYear, rescheduleMonth);
        const newBlocks = new Set<string>();
        const timeSlots = generateTimeSlots();
        bloqueios.forEach((b: any) => {
          const dateStr = format(new Date(b.data), 'yyyy-MM-dd');
          if (b.horaInicio && b.horaFim) {
            timeSlots.forEach(slot => {
              if (slot >= b.horaInicio && slot < b.horaFim) newBlocks.add(`${dateStr}_${slot}`);
            });
          }
        });
        setQuickMonthBlocks(newBlocks);
      } catch { /* ignore */ }
    };
    loadBlocks();
  }, [rescheduleYear, rescheduleMonth, showRescheduleDialog]);

  // Filter available slots: exclude past, blocked, and full slots
  useEffect(() => {
    if (!showRescheduleDialog) return;

    const selectedDate = new Date(rescheduleDate);
    selectedDate.setHours(0, 0, 0, 0);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const now = new Date();

    const available = generateTimeSlots().filter(slot => {
      // Past
      const [h, m] = slot.split(':').map(Number);
      const slotDt = new Date(selectedDate);
      slotDt.setHours(h, m);
      if (slotDt <= now) return false;

      // Admin block
      if (quickMonthBlocks.has(`${dateStr}_${slot}`)) return false;

      // Capacity: count non-cancelled appointments at this slot, excluding the one being rescheduled
      const occupied = existingAppointments.filter(apt => {
        if (apt.id === appointment.id) return false;
        if (apt.status === 'cancelled') return false;
        const aptDate = new Date(apt.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === selectedDate.getTime() && apt.time === slot;
      }).length;
      if (occupied >= slotCapacity) return false;

      return true;
    });

    setAvailableRescheduleSlots(available);
    setRescheduleTime(prev => (available.includes(prev) ? prev : ''));
  }, [rescheduleDate, quickMonthBlocks, slotCapacity, existingAppointments, showRescheduleDialog]);


  const handleReschedule = async () => {
    if (!rescheduleTime) return;

    // Combinar data e hora
    const [hours, minutes] = rescheduleTime.split(':');
    const newDate = new Date(rescheduleDate);
    newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    try {
      // API call to backend - backend handles all validation
      await marcacoesApi.reagendar(Number(appointment.id), format(newDate, "yyyy-MM-dd'T'HH:mm:ss"));

      onUpdate(appointment.id, {
        date: newDate,
        time: rescheduleTime,
        status: 'scheduled'
      });

      toast.success(t('appointmentDetails.rescheduledSuccess'));
      setShowRescheduleDialog(false);
      onClose();
    } catch (error: any) {
      console.error("Erro ao reagendar:", error);
      const msg = error?.response?.data?.message || error?.message || t('appointmentDetails.rescheduledFailed');
      toast.error(msg);
    }
  };



  const invalidDocuments = appointment.documents?.filter(doc => doc.invalid) || [];

  const dateObj = new Date(appointment.date);
  const locale = i18n.language === 'en' ? 'en-GB' : 'pt-PT';
  const dayName = dateObj.toLocaleDateString(locale, { weekday: 'long' });
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString(locale, { month: 'long' });
  const year = dateObj.getFullYear();
  const dateString = t('appointmentDetails.dateString', { dayName, day, month, year, time: appointment.time });

  // Só permite editar documentos se o estado for scheduled ou warning
  const isEditable = appointment.status === 'scheduled' || appointment.status === 'warning';


  // Função utilitária para saber se o documento tem preview
  function hasPreview(nomeOriginal: string): boolean {
    if (!nomeOriginal) return false;
    const ext = nomeOriginal.split('.').pop()?.toLowerCase();
    return ['jpeg', 'jpg', 'png', 'pdf'].includes(ext || '');
  }


  function handleNotificarDocumentoInvalido(doc: DocumentoDTO) {
    const motivo = window.prompt(t('appointmentDetails.invalidReasonPrompt', 'Indique o motivo do documento ser inválido:'));
    if (!motivo || !motivo.trim()) {
      toast.error(t('appointmentDetails.addReasonForEachDocument', 'Indique o motivo.'));
      return;
    }
    documentosApi
      .notificarDocumentoInvalido(parseInt(appointment.id), doc.id, motivo)
      .then(() => {
        toast.success(t('appointmentDetails.userNotifiedInvalidDocuments', 'Utente notificado.'));
      })
      .catch((error: any) => {
        toast.error(error.message || 'Erro ao notificar utente.');
      });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent hideCloseButton className="max-w-xl p-0 bg-card border-border flex flex-col max-h-[90vh]">
          <DialogTitle className="sr-only">{t('appointmentDetails.viewAppointment')}</DialogTitle>
          <DialogPrimitive.Description className="sr-only">
            {t('appointmentDetails.viewAndManage')}
          </DialogPrimitive.Description>

          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-lg text-foreground">{t('appointmentDetails.viewAppointment')}</h2>
                <StatusBadge status={appointment.status} size="md" />
              </div>
              <p className="text-sm text-muted-foreground">{dateString}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label={t('appointmentDetails.closeDetails')}
            >
              <XIcon className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Invalid Documents Warning */}
            {invalidDocuments.length > 0 && (
              <div className="bg-status-warning-soft/40 border border-status-warning/40 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangleIcon className="w-5 h-5 text-status-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-status-warning mb-2">{t('appointmentDetails.invalidDocuments')}</p>
                    {invalidDocuments.map((doc, index) => (
                      <p key={index} className="text-xs text-status-warning">
                        • {doc.name}: <em>{doc.reason}</em>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Appointment Info Grid: NIF and Contact side-by-side (Horário removed) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <Label className="text-sm mb-2"># NIF</Label>
                <p className="text-foreground">{appointment.patientNIF}</p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <Label className="text-sm flex items-center gap-2 mb-2">
                  <PhoneIcon className="w-4 h-4" />
                  {t('appointmentDialog.fields.contact')}
                </Label>
                <p className="text-foreground">{appointment.patientContact}</p>
              </div>
            </div>

            {/* Patient Name */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <Label className="text-sm flex items-center gap-2 mb-2">
                <UserIcon className="w-4 h-4" />
                {t('requisitions.ui.name')}
              </Label>
              <p className="text-foreground">{appointment.patientName}</p>
            </div>

            {/* Email (separate block, similar style to Nome) */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <Label className="text-sm flex items-center gap-2 mb-2">
                <MailIcon className="w-4 h-4" />
                Email
              </Label>
              <p className="text-foreground">{appointment.patientEmail}</p>
            </div>

            {/* Cancellation info */}
            {appointment.status === 'cancelled' && appointment.cancellationReason && (
              <div className="bg-status-error-soft/40 border border-status-error/40 rounded-lg p-4">
                <p className="text-sm font-medium text-status-error mb-1">
                  {t('appointmentDetails.cancelledAppointment')}
                </p>
                <p className="text-sm text-status-error">
                  {t('appointmentDetails.reason')}: {appointment.cancellationReason}
                </p>
              </div>
            )}

            {/* Subject */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <Label className="text-sm mb-2">{t('requisitions.ui.subjectOptional')}</Label>
              <p className="text-foreground">{appointment.subject}</p>
            </div>

            {/* Description */}
            {appointment.description && (
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <Label className="text-sm mb-2">{t('requisitions.ui.description')}</Label>
                <p className="text-foreground">{appointment.description}</p>
              </div>
            )}

            {/* Documentos com API real */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm flex items-center gap-2">
                  <FileTextIcon className="w-4 h-4" />
                  {t('appointmentDetails.attachedDocuments')}
                </Label>
                {!isClient && isEditable && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowDocUpload(true)}
                    className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    {t('appointmentDetails.add')}
                  </Button>
                )}
              </div>

              {loadingDocs ? (
                <p className="text-sm text-muted-foreground">{t('appointmentDetails.loadingDocuments')}</p>
              ) : documentos.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('appointmentDetails.noDocumentsAttached')}</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {documentos.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded border bg-muted/40 border-border"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileTextIcon className="w-5 h-5 text-primary flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-sm font-medium text-foreground truncate max-w-[300px] md:max-w-[450px] lg:max-w-[550px]"
                            title={doc.nomeOriginal}
                          >
                            {cleanFilename(doc.nomeOriginal)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(doc.uploadedEm).toLocaleDateString('pt-PT')} • {formatFileSize(doc.tamanho)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasPreview(doc.nomeOriginal) ? (
                          <>
                            <button
                              type="button"
                              onClick={() => documentosApi.previewDocumento(doc.id)}
                              className="p-2 hover:bg-muted rounded"
                              title={t('appointmentDetails.previewDocument', 'Visualizar')}
                              aria-label={t('appointmentDetails.previewDocument', 'Visualizar')}
                            >
                              <EyeIcon className="w-4 h-4 text-status-info" />
                            </button>
                            {isEditable && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="p-2 hover:bg-muted rounded"
                                    title={t('appointmentDetails.moreOptions', 'Mais opções')}
                                    aria-label={t('appointmentDetails.moreOptions', 'Mais opções')}
                                  >
                                    <MenuIcon className="w-4 h-4 text-muted-foreground" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-1.5 flex flex-col gap-1 bg-popover border-border shadow-xl rounded-xl z-50" align="end">
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadDocumento(doc)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-popover-foreground hover:bg-accent rounded-lg transition-colors"
                                  >
                                    <Download className="w-4 h-4 text-primary" />
                                    {t('appointmentDetails.download', 'Transferir')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoverDocumento(doc)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-status-error hover:bg-status-error-soft rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    {t('appointmentDetails.removeDocument', 'Apagar')}
                                  </button>
                                  {/* Só mostra o botão de documento inválido se NÃO for utente */}
                                  {!isClient && (
                                    <button
                                      type="button"
                                      onClick={() => handleNotificarDocumentoInvalido(doc)}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-status-warning hover:bg-status-warning-soft rounded-lg transition-colors"
                                    >
                                      <BellIcon className="w-4 h-4" />
                                      {t('appointmentDetails.notifyInvalidDocument', 'Notificar como inválido')}
                                    </button>
                                  )}
                                </PopoverContent>
                              </Popover>
                            )}
                          </>
                        ) : (
                          <>
                            {isEditable && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="p-2 hover:bg-muted rounded"
                                    title={t('appointmentDetails.moreOptions', 'Mais opções')}
                                    aria-label={t('appointmentDetails.moreOptions', 'Mais opções')}
                                  >
                                    <MenuIcon className="w-4 h-4 text-muted-foreground" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-40 p-1 flex flex-col gap-1" align="end">
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadDocumento(doc)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-popover-foreground hover:bg-accent rounded"
                                  >
                                    <Download className="w-4 h-4" />
                                    {t('appointmentDetails.download', 'Transferir')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoverDocumento(doc)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-status-error hover:bg-status-error-soft rounded"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    {t('appointmentDetails.removeDocument', 'Apagar')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleNotificarDocumentoInvalido(doc)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-status-warning hover:bg-status-warning-soft rounded"
                                  >
                                    <BellIcon className="w-4 h-4" />
                                    {t('appointmentDetails.notifyInvalidDocument', 'Notificar como inválido')}
                                  </button>
                                </PopoverContent>
                              </Popover>
                            )}
                          </>
                        )}


                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Documents antigos (manter para compatibilidade se houver) */}
            {appointment.documents && appointment.documents.length > 0 && (
              <div>
                <Label className="text-sm flex items-center gap-2 mb-3">
                  <FileTextIcon className="w-4 h-4" />
                  {t('appointmentDetails.legacyDocuments')}
                </Label>
                <div className="space-y-3">
                  {appointment.documents.map((doc, index) => (
                    <div key={index}>
                      <div
                        className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border"
                      >
                        {!isClient && (
                          <Checkbox
                            checked={selectedDocs.includes(index)}
                            onCheckedChange={() => handleDocToggle(index)}
                            className="border-border data-[state=checked]:bg-primary"
                          />
                        )}
                        <FileTextIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground/85 flex-1">{doc.name}</span>
                        {isClient && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              setUpdateDocIndex(index);
                              setNewDocName(doc.name);
                              setShowUpdateDocDialog(true);
                            }}
                          >
                            {t('appointmentDetails.updateLegacyDoc')}
                          </Button>
                        )}
                      </div>

                      {/* Caixa de texto aparece imediatamente abaixo do documento selecionado */}
                      {!isClient && selectedDocs.includes(index) && (
                        <div className="mt-2 ml-9">
                          <Textarea
                            placeholder={t('appointmentDetails.invalidReasonPlaceholder')}
                            value={invalidReasons[index] || ''}
                            onChange={(e) => handleReasonChange(index, e.target.value)}
                            rows={2}
                            className="text-sm bg-card border-border text-foreground"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-4 pb-2">
              {/* Botões para Secretaria */}
              {!isClient && (appointment.status === 'scheduled' || appointment.status === 'warning') && (
                <>
                  <Button
                    onClick={handleStartAppointment}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {t('appointmentDetails.startAppointment')}
                  </Button>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="destructive"
                      onClick={() => setShowCancelDialog(true)}
                      className="w-full"
                    >
                      {t('appointmentDialog.actions.cancel')}
                    </Button>
                    <Button
                      onClick={handleNoShowAppointment}
                      variant="warning"
                      className="w-full"
                    >
                      {t('appointmentDetails.noShow')}
                    </Button>
                  </div>
                </>
              )}

              {!isClient && appointment.status === 'in-progress' && (
                <Button
                  onClick={handleCompleteAppointment}
                  className="w-full bg-status-success hover:bg-status-success/90 text-primary-foreground"
                >
                  {t('appointmentDetails.complete')}
                </Button>
              )}

              {!isClient && selectedDocs.length > 0 && (
                <Button
                  onClick={handleNotifyInvalid}
                  variant="outline"
                  className="w-full border-status-warning/50 text-status-warning hover:bg-status-warning-soft gap-2"
                >
                  <BellIcon className="w-4 h-4" />
                  {t('appointmentDetails.notifyInvalidDocument')}
                </Button>
              )}

              {/* Botões para Cliente */}
              {isClient && (appointment.status === 'scheduled' || appointment.status === 'warning') && (
                <>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                    onClick={() => setShowDocUpload(true)}
                  >
                    <FileTextIcon className="w-4 h-4" />
                    {t('appointmentDetails.addDocuments')}
                  </Button>
                  <Button
                    variant="warning"
                    className="w-full gap-2"
                    onClick={() => {
                      const aptDate = new Date(appointment.date);
                      setRescheduleDate(aptDate);
                      setRescheduleTime(appointment.time);
                      setShowRescheduleDialog(true);
                    }}
                  >
                    <ClockIcon className="w-4 h-4" />
                    {t('appointmentDetails.reschedule')}
                  </Button>
                </>
              )}

              {/* Botão Cancelar (comum mas condicionado) */}
              {!isClient && appointment.status !== 'scheduled' && appointment.status !== 'warning' && appointment.status !== 'in-progress' && appointment.status !== 'cancelled' && appointment.status !== 'completed' && appointment.status !== 'no-show' && (
                <Button
                  variant="destructive"
                  onClick={() => setShowCancelDialog(true)}
                  className="w-full"
                >
                  {t('appointmentDialog.actions.cancel')}
                </Button>
              )}

              {isClient && appointment.status !== 'in-progress' && appointment.status !== 'cancelled' && appointment.status !== 'completed' && appointment.status !== 'no-show' && (
                <Button
                  variant="destructive"
                  onClick={() => setShowCancelDialog(true)}
                  className="w-full"
                >
                  {t('appointmentDialog.actions.cancel')}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelDialog} onOpenChange={(openState) => {
        setShowCancelDialog(openState);
        if (!openState) setCancelReason('');
      }}>
        <DialogContent className="max-w-md bg-card border border-border">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {t('appointmentDetails.cancelDialogTitle')}
          </DialogTitle>
          <DialogPrimitive.Description className="text-sm text-muted-foreground">
            {isClient
              ? t('appointmentDetails.cancelDialogDescClient')
              : t('appointmentDetails.cancelDialogDescSecretary')}
          </DialogPrimitive.Description>

          {!isClient && (
            <>
              <Textarea
                placeholder={t('appointmentDetails.cancelReasonPlaceholder')}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                className="text-sm bg-card border-border text-foreground mt-4"
              />
              <p className="text-xs text-muted-foreground">
                {t('appointmentDetails.cancelReasonHint')}
              </p>
            </>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => {
              setCancelReason('');
              setShowCancelDialog(false);
            }}>
              {isClient ? t('appointmentDetails.cancelDialogNo') : t('appointmentDetails.cancelDialogForget')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelAppointment}
              disabled={!isClient && !cancelReason.trim()}
            >
              {isClient ? t('appointmentDetails.cancelDialogConfirmClient') : t('appointmentDetails.cancelDialogConfirmSecretary')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo Adicionar Documento */}
      <Dialog open={showAddDocDialog} onOpenChange={setShowAddDocDialog}>
        <DialogContent className="max-w-md bg-card border border-border">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {t('appointmentDetails.addDocTitle')}
          </DialogTitle>
          <DialogPrimitive.Description className="text-sm text-muted-foreground">
            {t('appointmentDetails.addDocDesc')}
          </DialogPrimitive.Description>

          <Input
            placeholder={t('appointmentDetails.addDocPlaceholder')}
            value={newDocName}
            onChange={(e) => setNewDocName(e.target.value)}
            className="mt-4"
          />

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => {
              setNewDocName('');
              setShowAddDocDialog(false);
            }}>
              {t('appointmentDialog.actions.cancel')}
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleAddDocument}
              disabled={!newDocName.trim()}
            >
              {t('appointmentDetails.add')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo Atualizar Documento */}
      <Dialog open={showUpdateDocDialog} onOpenChange={setShowUpdateDocDialog}>
        <DialogContent className="max-w-md bg-card border border-border">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {t('appointmentDetails.updateDocTitle')}
          </DialogTitle>
          <DialogPrimitive.Description className="text-sm text-muted-foreground">
            {t('appointmentDetails.updateDocDesc')}
          </DialogPrimitive.Description>

          <Input
            placeholder={t('appointmentDetails.updateDocPlaceholder')}
            value={newDocName}
            onChange={(e) => setNewDocName(e.target.value)}
            className="mt-4"
          />

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => {
              setNewDocName('');
              setUpdateDocIndex(null);
              setShowUpdateDocDialog(false);
            }}>
              {t('appointmentDialog.actions.cancel')}
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleUpdateDocument}
              disabled={!newDocName.trim()}
            >
              {t('appointmentDetails.updateLegacyDoc')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo Reagendar */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent className="max-w-3xl bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
              {t('appointmentDetails.rescheduleDialogTitle')}
            </DialogTitle>
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              {t('appointmentDetails.rescheduleDialogDesc')}
            </DialogPrimitive.Description>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row gap-6 mt-4 items-start">
            {/* Calendário */}
            <div className="flex flex-col items-center">
              <CalendarComponent
                mode="single"
                selected={rescheduleDate}
                onSelect={(d) => {
                  if (d) {
                    setRescheduleDate(d);
                    setRescheduleTime('');
                  }
                }}
                disabled={(d) => {
                  const dow = d.getDay();
                  if (dow === 0 || dow === 6) return true;
                  if (isHoliday(d)) return true;
                  const todayStart = new Date();
                  todayStart.setHours(0, 0, 0, 0);
                  if (d < todayStart) return true;
                  return false;
                }}
                initialFocus
              />
            </div>

            {/* Horário */}
            <div className="flex flex-col gap-2 flex-1 min-w-[150px]">
              <Label className="text-xs text-muted-foreground uppercase">{t('appointmentDetails.rescheduleHour')}</Label>
              {availableRescheduleSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  {t('appointmentDetails.rescheduleUnavailable')}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {availableRescheduleSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setRescheduleTime(slot)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        rescheduleTime === slot
                          ? 'bg-status-warning text-primary-foreground border-status-warning'
                          : 'bg-muted/40 border-border text-foreground/80 hover:border-status-warning/60 hover:bg-status-warning-soft/40'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
              {t('appointmentDialog.actions.cancel')}
            </Button>
            <Button
              className="bg-status-warning hover:bg-status-warning/90 text-primary-foreground"
              onClick={handleReschedule}
              disabled={!rescheduleTime}
            >
              {t('appointmentDetails.rescheduleConfirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Upload de Documentos */}
      <DocumentUploadDialog
        open={showDocUpload}
        onClose={() => setShowDocUpload(false)}
        marcacaoId={parseInt(appointment.id)}
        isClient={isClient}
        onSuccess={(docs) => {
          setDocumentos(prev => [...prev, ...docs]);
          setShowDocUpload(false);
        }}
      />
    </>
  );
}
