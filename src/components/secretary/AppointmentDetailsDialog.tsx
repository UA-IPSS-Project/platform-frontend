import { useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { XIcon, FileTextIcon, UserIcon, ClockIcon, PhoneIcon, MailIcon, BellIcon } from '../shared/CustomIcons';
import { Download, Trash2, Upload, File } from 'lucide-react';
import { Appointment } from '../../types';
import { marcacoesApi, calendarioApi, BloqueioAgenda, documentosApi, DocumentoDTO } from '../../services/api';
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
  const [rescheduleYear, setRescheduleYear] = useState(today.getFullYear());
  const [rescheduleMonth, setRescheduleMonth] = useState(today.getMonth());
  const [rescheduleDay, setRescheduleDay] = useState(today.getDate());
  const [rescheduleTime, setRescheduleTime] = useState('');
  const rescheduleYearOptions = Array.from({ length: 5 }, (_, idx) => today.getFullYear() - 2 + idx);

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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

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

  const handleNotifyInvalid = () => {
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

    const updatedDocuments = appointment.documents?.map((doc, index) => ({
      ...doc,
      invalid: selectedDocs.includes(index) ? true : doc.invalid,
      reason: selectedDocs.includes(index) ? invalidReasons[index] : doc.reason,
    }));

    onUpdate(appointment.id, {
      documents: updatedDocuments,
      status: 'warning',
    });

    toast.success(t('appointmentDetails.userNotifiedInvalidDocuments'));
    setSelectedDocs([]);
    setInvalidReasons({});
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

  const isSlotBooked = (date: Date, time: string) => {
    return existingAppointments.some(apt => {
      const aptDate = new Date(apt.date);
      aptDate.setHours(0, 0, 0, 0);
      const slotDate = new Date(date);
      slotDate.setHours(0, 0, 0, 0);

      // Don't block the CURRENT appointment (we are rescheduling it)
      if (apt.id === appointment.id) return false;

      return aptDate.getTime() === slotDate.getTime() &&
        apt.time === time &&
        apt.status !== 'cancelled';
    });
  };

  // Load blocks when Year/Month changes in Reschedule Dialog
  useEffect(() => {
    if (!showRescheduleDialog) return;

    const loadBlocks = async () => {
      try {
        const bloqueios = await calendarioApi.listarBloqueios(rescheduleYear, rescheduleMonth + 1);
        const newBlocks = new Set<string>();
        const timeSlots = generateTimeSlots();

        bloqueios.forEach((bloqueio: BloqueioAgenda) => {
          const date = new Date(bloqueio.data);
          const dateStr = date.toISOString().split('T')[0];

          if (bloqueio.horaInicio && bloqueio.horaFim) {
            const startTime = bloqueio.horaInicio;
            const endTime = bloqueio.horaFim;

            timeSlots.forEach(slot => {
              if (slot >= startTime && slot < endTime) {
                newBlocks.add(`${dateStr}_${slot}`);
              }
            });
          }
        });
        setQuickMonthBlocks(newBlocks);
      } catch (error) {
        console.error('Erro ao carregar bloqueios para reagendamento:', error);
      }
    };

    loadBlocks();
  }, [rescheduleYear, rescheduleMonth, showRescheduleDialog]);

  useEffect(() => {
    if (!showRescheduleDialog) return;

    const loadHolidays = async () => {
      if (holidaysByYear[rescheduleYear]) return;
      try {
        const dates = await calendarioApi.listarFeriados(rescheduleYear);
        setHolidaysByYear(prev => ({ ...prev, [rescheduleYear]: new Set(dates) }));
      } catch (error) {
        console.error('Erro ao carregar feriados para reagendamento:', error);
      }
    };

    loadHolidays();
  }, [rescheduleYear, showRescheduleDialog, holidaysByYear]);

  const isHoliday = (date: Date) => {
    const set = holidaysByYear[date.getFullYear()];
    if (!set) return false;
    const key = date.toISOString().split('T')[0];
    return set.has(key);
  };

  // Update available slots when blocks, booked slots or date changes
  useEffect(() => {
    if (!showRescheduleDialog) return;

    const selectedDate = new Date(rescheduleYear, rescheduleMonth, rescheduleDay);
    const dateStr = selectedDate.toISOString().split('T')[0];
    const timeSlots = generateTimeSlots();
    const dayOfWeek = selectedDate.getDay();
    const isHolidayDate = isHoliday(selectedDate);

    // Block weekends immediately
    if (dayOfWeek === 0 || dayOfWeek === 6 || isHolidayDate) {
      setAvailableRescheduleSlots([]);
      setRescheduleTime('');
      return;
    }

    const available = timeSlots.filter(slot => {
      const key = `${dateStr}_${slot}`;

      // Check Past
      const [h, m] = slot.split(':');
      const slotDateTime = new Date(selectedDate);
      slotDateTime.setHours(parseInt(h), parseInt(m));
      const isPast = slotDateTime <= new Date();

      // Check Blocks from API
      const isBlocked = quickMonthBlocks.has(key);

      // Check Existing Appointments
      const isBooked = isSlotBooked(selectedDate, slot);

      return !isPast && !isBlocked && !isBooked;
    });

    setAvailableRescheduleSlots(available);

    // Clear selection if not available, or keep if valid
    setRescheduleTime(prev => {
      if (available.includes(prev)) return prev;
      return '';
    });

  }, [rescheduleYear, rescheduleMonth, rescheduleDay, quickMonthBlocks, existingAppointments, showRescheduleDialog]);

  const handleReschedule = async () => {
    if (!rescheduleTime) return;

    // Combinar data e hora
    const [hours, minutes] = rescheduleTime.split(':');
    const newDate = new Date(rescheduleYear, rescheduleMonth, rescheduleDay);
    newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    try {
      // API call to backend
      await marcacoesApi.reagendar(Number(appointment.id), newDate.toISOString());

      onUpdate(appointment.id, {
        date: newDate,
        time: rescheduleTime,
        status: 'scheduled' // Optionally reset status if backend does it
      });

      toast.success(t('appointmentDetails.rescheduledSuccess'));
      setShowRescheduleDialog(false);
      onClose();
    } catch (error) {
      console.error("Erro ao reagendar:", error);
      toast.error(t('appointmentDetails.rescheduledFailed'));
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const invalidDocuments = appointment.documents?.filter(doc => doc.invalid) || [];

  const dateObj = new Date(appointment.date);
  const locale = i18n.language === 'en' ? 'en-GB' : 'pt-PT';
  const dayName = dateObj.toLocaleDateString(locale, { weekday: 'long' });
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString(locale, { month: 'long' });
  const year = dateObj.getFullYear();
  const dateString = t('appointmentDetails.dateString', { dayName, day, month, year, time: appointment.time });

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent hideCloseButton className="max-w-xl p-0 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
          <DialogTitle className="sr-only">{t('appointmentDetails.viewAppointment')}</DialogTitle>
          <DialogPrimitive.Description className="sr-only">
            {t('appointmentDetails.viewAndManage')}
          </DialogPrimitive.Description>

          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-lg text-gray-900 dark:text-gray-100">{t('appointmentDetails.viewAppointment')}</h2>
                <StatusBadge status={appointment.status} size="md" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{dateString}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label={t('appointmentDetails.closeDetails')}
            >
              <XIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Invalid Documents Warning */}
            {invalidDocuments.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-900 dark:text-yellow-100 mb-2">{t('appointmentDetails.invalidDocuments')}</p>
                    {invalidDocuments.map((doc, index) => (
                      <p key={index} className="text-xs text-yellow-800 dark:text-yellow-200">
                        • {doc.name}: <em>{doc.reason}</em>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Appointment Info Grid: NIF and Contact side-by-side (Horário removed) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <Label className="text-sm mb-2"># NIF</Label>
                <p className="text-gray-900 dark:text-gray-100">{appointment.patientNIF}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <Label className="text-sm flex items-center gap-2 mb-2">
                  <PhoneIcon className="w-4 h-4" />
                  {t('appointmentDialog.fields.contact')}
                </Label>
                <p className="text-gray-900 dark:text-gray-100">{appointment.patientContact}</p>
              </div>
            </div>

            {/* Patient Name */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <Label className="text-sm flex items-center gap-2 mb-2">
                <UserIcon className="w-4 h-4" />
                {t('requisitions.ui.name')}
              </Label>
              <p className="text-gray-900 dark:text-gray-100">{appointment.patientName}</p>
            </div>

            {/* Email (separate block, similar style to Nome) */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <Label className="text-sm flex items-center gap-2 mb-2">
                <MailIcon className="w-4 h-4" />
                Email
              </Label>
              <p className="text-gray-900 dark:text-gray-100">{appointment.patientEmail}</p>
            </div>

            {/* Cancellation info */}
            {appointment.status === 'cancelled' && appointment.cancellationReason && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                  {t('appointmentDetails.cancelledAppointment')}
                </p>
                <p className="text-sm text-red-600 dark:text-red-200">
                  {t('appointmentDetails.reason')}: {appointment.cancellationReason}
                </p>
              </div>
            )}

            {/* Subject */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <Label className="text-sm mb-2">{t('requisitions.ui.subjectOptional')}</Label>
              <p className="text-gray-900 dark:text-gray-100">{appointment.subject}</p>
            </div>

            {/* Description */}
            {appointment.description && (
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <Label className="text-sm mb-2">{t('requisitions.ui.description')}</Label>
                <p className="text-gray-900 dark:text-gray-100">{appointment.description}</p>
              </div>
            )}

            {/* Documentos com API real */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm flex items-center gap-2">
                  <FileTextIcon className="w-4 h-4" />
                  {t('appointmentDetails.attachedDocuments')}
                </Label>
                {!isClient && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowDocUpload(true)}
                    className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    {t('appointmentDetails.add')}
                  </Button>
                )}
              </div>

              {loadingDocs ? (
                <p className="text-sm text-gray-500">{t('appointmentDetails.loadingDocuments')}</p>
              ) : documentos.length === 0 ? (
                <p className="text-sm text-gray-500">{t('appointmentDetails.noDocumentsAttached')}</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {documentos.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <File className="w-5 h-5 text-purple-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                            {doc.nomeOriginal}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(doc.uploadedEm).toLocaleDateString('pt-PT')} • {formatFileSize(doc.tamanho)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadDocumento(doc)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                          title="Download"
                        >
                          <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoverDocumento(doc)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                          title={t('appointmentDetails.removeDocument')}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
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
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        {!isClient && (
                          <Checkbox
                            checked={selectedDocs.includes(index)}
                            onCheckedChange={() => handleDocToggle(index)}
                            className="border-slate-300 data-[state=checked]:bg-primary"
                          />
                        )}
                        <FileTextIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{doc.name}</span>
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
                            className="text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
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
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
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
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {t('appointmentDetails.complete')}
                </Button>
              )}

              {!isClient && selectedDocs.length > 0 && (
                <Button
                  onClick={handleNotifyInvalid}
                  variant="outline"
                  className="w-full border-yellow-300 dark:border-yellow-600 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 gap-2"
                >
                  <BellIcon className="w-4 h-4" />
                  {t('appointmentDetails.notifyInvalidDocument')}
                </Button>
              )}

              {/* Botões para Cliente */}
              {isClient && (appointment.status === 'scheduled' || appointment.status === 'warning') && (
                <>
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
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
                      setRescheduleYear(aptDate.getFullYear());
                      setRescheduleMonth(aptDate.getMonth());
                      setRescheduleDay(aptDate.getDate());
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
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('appointmentDetails.cancelDialogTitle')}
          </DialogTitle>
          <DialogPrimitive.Description className="text-sm text-gray-600 dark:text-gray-400">
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
                className="text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 mt-4"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
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
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('appointmentDetails.addDocTitle')}
          </DialogTitle>
          <DialogPrimitive.Description className="text-sm text-gray-600 dark:text-gray-400">
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
              className="bg-purple-600 hover:bg-purple-700"
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
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('appointmentDetails.updateDocTitle')}
          </DialogTitle>
          <DialogPrimitive.Description className="text-sm text-gray-600 dark:text-gray-400">
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
              className="bg-purple-600 hover:bg-purple-700"
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
        <DialogContent className="max-w-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {t('appointmentDetails.rescheduleDialogTitle')}
            </DialogTitle>
            <DialogPrimitive.Description className="text-sm text-gray-600 dark:text-gray-400">
              {t('appointmentDetails.rescheduleDialogDesc')}
            </DialogPrimitive.Description>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="flex items-end gap-4 flex-wrap">
              {/* Ano */}
              <div className="flex flex-col gap-1 flex-1 min-w-[110px]">
                <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">{t('appointmentDetails.rescheduleYear')}</Label>
                <Select value={String(rescheduleYear)} onValueChange={(value) => setRescheduleYear(Number(value))}>
                  <SelectTrigger className="bg-gray-50 dark:bg-gray-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rescheduleYearOptions.map((year) => (
                      <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mês */}
              <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">{t('appointmentDetails.rescheduleMonth')}</Label>
                <Select value={String(rescheduleMonth)} onValueChange={(value) => setRescheduleMonth(Number(value))}>
                  <SelectTrigger className="bg-gray-50 dark:bg-gray-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ maxHeight: '15rem' }} className="overflow-y-auto">
                    {Array.from({ length: 12 }, (_, idx) => (
                      <SelectItem key={idx} value={String(idx)}>
                        {new Date(rescheduleYear, idx).toLocaleDateString(locale, { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dia */}
              <div className="flex flex-col gap-1 flex-1 min-w-[100px]">
                <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">{t('appointmentDetails.rescheduleDay')}</Label>
                <Select
                  value={String(rescheduleDay)}
                  onValueChange={(value) => setRescheduleDay(Math.min(Number(value), getDaysInMonth(rescheduleYear, rescheduleMonth)))}
                >
                  <SelectTrigger className="bg-gray-50 dark:bg-gray-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ maxHeight: '15rem' }} className="overflow-y-auto">
                    {Array.from({ length: getDaysInMonth(rescheduleYear, rescheduleMonth) }, (_, i) => i + 1).map((day) => {
                      const testDate = new Date(rescheduleYear, rescheduleMonth, day);
                      const dayOfWeek = testDate.getDay();
                      if (dayOfWeek === 0 || dayOfWeek === 6 || isHoliday(testDate)) return null;

                      return <SelectItem key={day} value={String(day)}>{day}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Horário */}
              <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
                <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">{t('appointmentDetails.rescheduleHour')}</Label>
                <Select value={rescheduleTime} onValueChange={setRescheduleTime} disabled={!availableRescheduleSlots.length}>
                  <SelectTrigger className="bg-gray-50 dark:bg-gray-800">
                    <SelectValue placeholder={availableRescheduleSlots.length ? t('appointmentDetails.rescheduleSelectPlaceholder') : t('appointmentDetails.rescheduleUnavailable')} />
                  </SelectTrigger>
                  <SelectContent style={{ maxHeight: '15rem' }} className="overflow-y-auto">
                    {availableRescheduleSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
              {t('appointmentDialog.actions.cancel')}
            </Button>
            <Button
              className="bg-yellow-500 hover:bg-yellow-600"
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
        onSuccess={(docs) => {
          setDocumentos(prev => [...prev, ...docs]);
          setShowDocUpload(false);
        }}
      />
    </>
  );
}
