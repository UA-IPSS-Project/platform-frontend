import { useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog@1.1.6';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import { XIcon, UserIcon, ClockIcon, PhoneIcon, MailIcon, FileTextIcon, AlertTriangleIcon, PlayIcon, BellIcon, CheckCircleIcon } from '../CustomIcons';
import type { Appointment } from '../SecretaryDashboard';

interface AppointmentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment;
  onUpdate: (id: string, updates: Partial<Appointment>) => void;
  onCancel: (id: string, reason: string) => void;
}

const WEEKDAYS_LONG = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

export function AppointmentDetailsDialog({
  open,
  onClose,
  appointment,
  onUpdate,
  onCancel,
}: AppointmentDetailsDialogProps) {
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [invalidReason, setInvalidReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    if (!open) {
      setCancelReason('');
      setShowCancelDialog(false);
    }
  }, [open]);

  const handleDocToggle = (index: number) => {
    setSelectedDocs(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleNotifyInvalid = () => {
    if (selectedDocs.length === 0 || !invalidReason.trim()) {
      toast.error('Selecione documentos e adicione uma justificativa');
      return;
    }

    const updatedDocuments = appointment.documents?.map((doc, index) => ({
      ...doc,
      invalid: selectedDocs.includes(index) ? true : doc.invalid,
      reason: selectedDocs.includes(index) ? invalidReason : doc.reason,
    }));

    onUpdate(appointment.id, {
      documents: updatedDocuments,
      status: 'warning',
    });

    toast.success('Utente notificado sobre documentos inválidos');
    setSelectedDocs([]);
    setInvalidReason('');
  };

  const handleCancelAppointment = () => {
    const trimmedReason = cancelReason.trim();
    if (!trimmedReason) {
      toast.error('Descreva o motivo do cancelamento');
      return;
    }

    onCancel(appointment.id, trimmedReason);
    toast.success('Marcação cancelada e utente notificado');
    setCancelReason('');
    setShowCancelDialog(false);
    onClose();
  };

  const handleCompleteAppointment = () => {
    onUpdate(appointment.id, { status: 'scheduled' });
    toast.success('Atendimento concluído');
    onClose();
  };

  const handleConfirmAppointment = () => {
    onUpdate(appointment.id, { status: 'scheduled' });
    toast.success('Marcação confirmada');
  };

  const handleStartAppointment = () => {
    onUpdate(appointment.id, { status: 'in-progress' });
    toast.success('Atendimento iniciado');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-progress':
        return <Badge className="bg-purple-600 text-white rounded-full px-3">Em Curso</Badge>;
      case 'scheduled':
        return <Badge className="bg-purple-500 text-white rounded-full px-3">Agendado</Badge>;
      case 'warning':
        return (
          <Badge className="bg-yellow-500 text-gray-900 rounded-full px-3 flex items-center gap-1">
            <AlertTriangleIcon className="w-3 h-3" />
            Agendado
          </Badge>
        );
      case 'cancelled':
        return <Badge variant="destructive" className="rounded-full px-3">Cancelado</Badge>;
      default:
        return null;
    }
  };

  const invalidDocuments = appointment.documents?.filter(doc => doc.invalid) || [];

  const dateObj = new Date(appointment.date);
  const dayName = WEEKDAYS_LONG[dateObj.getDay()];
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('pt-PT', { month: 'long' });
  const year = dateObj.getFullYear();
  const dateString = `${dayName}, ${day} de ${month} de ${year} às ${appointment.time}`;

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent hideCloseButton className="max-w-xl p-0 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
        <DialogTitle className="sr-only">Consultar Agendamento</DialogTitle>
        <DialogPrimitive.Description className="sr-only">
          Visualize e gerencie os detalhes da marcação
        </DialogPrimitive.Description>

        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg text-gray-900 dark:text-gray-100">Consultar Agendamento</h2>
              {getStatusBadge(appointment.status)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{dateString}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Fechar detalhes do agendamento"
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
                  <p className="text-sm text-yellow-900 dark:text-yellow-100 mb-2">Documentos Inválidos</p>
                  {invalidDocuments.map((doc, index) => (
                    <p key={index} className="text-xs text-yellow-800 dark:text-yellow-200">
                      • {doc.name}: <em>{doc.reason}</em>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Appointment Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
              <Label className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-2 mb-2">
                <ClockIcon className="w-4 h-4" />
                Horário
              </Label>
              <p className="text-gray-900 dark:text-gray-100">{appointment.time}</p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
              <Label className="text-xs text-purple-600 dark:text-purple-400 mb-2"># NIF</Label>
              <p className="text-gray-900 dark:text-gray-100">{appointment.patientNIF}</p>
            </div>
          </div>

          {/* Patient Name */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
            <Label className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-2 mb-2">
              <UserIcon className="w-4 h-4" />
              Nome
            </Label>
            <p className="text-gray-900 dark:text-gray-100">{appointment.patientName}</p>
          </div>

          {/* Contact & Email */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
              <Label className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-2 mb-2">
                <PhoneIcon className="w-4 h-4" />
                Contacto
              </Label>
              <p className="text-gray-900 dark:text-gray-100">{appointment.patientContact}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
              <Label className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-2 mb-2">
                <MailIcon className="w-4 h-4" />
                Email
              </Label>
              <p className="text-gray-900 dark:text-gray-100">pedro.oliveira@email.pt</p>
            </div>
          </div>

          {/* Cancellation info */}
          {appointment.status === 'cancelled' && appointment.cancellationReason && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                Marcação cancelada
              </p>
              <p className="text-sm text-red-600 dark:text-red-200">
                Motivo: {appointment.cancellationReason}
              </p>
            </div>
          )}

          {/* Subject */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
            <Label className="text-xs text-purple-600 dark:text-purple-400 mb-2">Assunto</Label>
            <p className="text-gray-900 dark:text-gray-100">{appointment.subject}</p>
          </div>

          {/* Description */}
          {appointment.description && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
              <Label className="text-xs text-purple-600 dark:text-purple-400 mb-2">Descrição</Label>
              <p className="text-gray-900 dark:text-gray-100">{appointment.description}</p>
            </div>
          )}

          {/* Documents */}
          {appointment.documents && appointment.documents.length > 0 && (
            <div>
              <Label className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-2 mb-3">
                <FileTextIcon className="w-4 h-4" />
                Documentos Extra
              </Label>
              <div className="space-y-2">
                {appointment.documents.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <Checkbox
                      checked={selectedDocs.includes(index)}
                      onCheckedChange={() => handleDocToggle(index)}
                      className="border-purple-300 data-[state=checked]:bg-purple-600"
                    />
                    <FileTextIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{doc.name}</span>
                  </div>
                ))}
              </div>

              {selectedDocs.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Textarea
                    placeholder="Razão pela qual o documento é inválido..."
                    value={invalidReason}
                    onChange={(e) => setInvalidReason(e.target.value)}
                    rows={3}
                    className="text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-4 pb-2">
            {appointment.status === 'scheduled' && (
              <Button
                onClick={handleStartAppointment}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
              >
                <PlayIcon className="w-4 h-4" />
                Iniciar atendimento
              </Button>
            )}

            {appointment.status === 'in-progress' && (
              <Button
                onClick={handleCompleteAppointment}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Concluir
              </Button>
            )}

            {selectedDocs.length > 0 && (
              <Button
                onClick={handleNotifyInvalid}
                variant="outline"
                className="w-full border-yellow-300 dark:border-yellow-600 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 gap-2"
              >
                <BellIcon className="w-4 h-4" />
                Notificar Documento Inválido
              </Button>
            )}

            {appointment.status === 'warning' && (
              <Button
                onClick={handleConfirmAppointment}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Confirmar Marcação
              </Button>
            )}

            {appointment.status !== 'in-progress' && appointment.status !== 'cancelled' && (
              <Button
                variant="destructive"
                onClick={() => setShowCancelDialog(true)}
                className="w-full"
              >
                Cancelar
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
          Cancelar marcação
        </DialogTitle>
        <DialogPrimitive.Description className="text-sm text-gray-600 dark:text-gray-400">
          Explique brevemente ao utente porque esta marcação será cancelada.
        </DialogPrimitive.Description>

        <Textarea
          placeholder="Ex.: Utente não enviou os documentos necessários..."
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          rows={4}
          className="text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 mt-4"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          O motivo será enviado ao utente juntamente com a notificação de cancelamento.
        </p>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => {
            setCancelReason('');
            setShowCancelDialog(false);
          }}>
            Esquecer
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancelAppointment}
            disabled={!cancelReason.trim()}
          >
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
