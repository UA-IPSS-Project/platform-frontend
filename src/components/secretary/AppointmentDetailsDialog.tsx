import { useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { XIcon, UserIcon, ClockIcon, PhoneIcon, MailIcon, FileTextIcon, AlertTriangleIcon, PlayIcon, BellIcon, CheckCircleIcon, CalendarIcon } from '../CustomIcons';
import type { Appointment } from '../SecretaryDashboard';
import { marcacoesApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface AppointmentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment;
  onUpdate: (id: string, updates: Partial<Appointment>) => void;
  onCancel: (id: string, reason: string) => void;
  isClient?: boolean;
}

const WEEKDAYS_LONG = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

export function AppointmentDetailsDialog({
  open,
  onClose,
  appointment,
  onUpdate,
  onCancel,
  isClient = false,
}: AppointmentDetailsDialogProps) {
  const { user: authUser } = useAuth();
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [invalidReasons, setInvalidReasons] = useState<{ [key: number]: string }>({});
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showAddDocDialog, setShowAddDocDialog] = useState(false);
  const [showUpdateDocDialog, setShowUpdateDocDialog] = useState(false);
  const [updateDocIndex, setUpdateDocIndex] = useState<number | null>(null);
  const [newDocName, setNewDocName] = useState('');
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  
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
    }
  }, [open]);

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
      toast.error('Selecione pelo menos um documento');
      return;
    }

    // Verifica se todos os documentos selecionados têm justificativa
    const missingReasons = selectedDocs.some(index => !invalidReasons[index]?.trim());
    if (missingReasons) {
      toast.error('Adicione uma justificativa para cada documento selecionado');
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

    toast.success('Utente notificado sobre documentos inválidos');
    setSelectedDocs([]);
    setInvalidReasons({});
  };

  const handleCancelAppointment = async () => {
    const trimmedReason = cancelReason.trim();
    if (!trimmedReason) {
      toast.error('Descreva o motivo do cancelamento');
      return;
    }

    if (!authUser?.id) {
      toast.error('Erro de autenticação: Utilizador não identificado');
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
        authUser.id
      );

      // Atualizar estado local
      onCancel(appointment.id, trimmedReason);
      onUpdate(appointment.id, { status: 'cancelled', cancellationReason: trimmedReason });
      
      toast.success('Marcação cancelada e utente notificado');
      setCancelReason('');
      setShowCancelDialog(false);
      onClose();
      
    } catch (error: any) {
      console.error('Erro ao cancelar marcação:', error);
      const mensagemErro = error.response?.data?.message || error.message || 'Não foi possível cancelar a marcação';
      toast.error(mensagemErro);
    }
  };

  const handleCompleteAppointment = async () => {
    if (!authUser?.id) {
      toast.error('Erro de autenticação: Utilizador não identificado');
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
        authUser.id
      );

      onUpdate(appointment.id, { status: 'completed' });
      toast.success('Atendimento concluído com sucesso!');
      onClose();
      
    } catch (error: any) {
      console.error('Erro ao concluir atendimento:', error);
      const mensagemErro = error.response?.data?.message || error.message || 'Não foi possível concluir o atendimento';
      toast.error(mensagemErro);
    }
  };

  const handleConfirmAppointment = async () => {
    if (!authUser?.id) {
      toast.error('Erro de autenticação: Utilizador não identificado');
      return;
    }
    
    try {
      console.log('Confirmando marcação:', {
        marcacaoId: parseInt(appointment.id),
        novoEstado: 'AGENDADO',
        funcionarioId: authUser.id
      });

      await marcacoesApi.atualizarEstado(
        parseInt(appointment.id),
        'AGENDADO',
        authUser.id
      );

      onUpdate(appointment.id, { status: 'scheduled' });
      toast.success('Marcação confirmada com sucesso!');
      
      // Fechar o diálogo após confirmar
      onClose();
      
    } catch (error: any) {
      console.error('Erro ao confirmar marcação:', error);
      const mensagemErro = error.response?.data?.message || error.message || 'Não foi possível confirmar a marcação';
      toast.error(mensagemErro);
    }
  };

  const handleStartAppointment = async () => {
    if (!authUser?.id) {
      toast.error('Erro de autenticação: Utilizador não identificado');
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
        authUser.id
      );

      console.log('Resposta da API:', response);

      // Atualizar estado local do React para UI mudar instantaneamente
      onUpdate(appointment.id, { status: 'in-progress' });
      
      toast.success('Atendimento iniciado com sucesso!');
      
      // Fechar o diálogo após atualizar o estado
      onClose();
      
    } catch (error: any) {
      console.error('Erro ao iniciar atendimento:', error);
      const mensagemErro = error.response?.data?.message || error.message || 'Não foi possível iniciar o atendimento';
      toast.error(mensagemErro);
    }
  };

  const handleAddDocument = () => {
    if (!newDocName.trim()) {
      toast.error('Digite o nome do documento');
      return;
    }

    const updatedDocuments = [
      ...(appointment.documents || []),
      { name: newDocName.trim() }
    ];

    onUpdate(appointment.id, { documents: updatedDocuments });
    toast.success('Documento adicionado com sucesso');
    setNewDocName('');
    setShowAddDocDialog(false);
  };

  const handleUpdateDocument = () => {
    if (updateDocIndex === null) return;
    if (!newDocName.trim()) {
      toast.error('Digite o novo nome do documento');
      return;
    }

    const updatedDocuments = appointment.documents?.map((doc, index) =>
      index === updateDocIndex ? { ...doc, name: newDocName.trim() } : doc
    );

    onUpdate(appointment.id, { documents: updatedDocuments });
    toast.success('Documento atualizado com sucesso');
    setNewDocName('');
    setUpdateDocIndex(null);
    setShowUpdateDocDialog(false);
  };

  const handleReschedule = () => {
    if (!rescheduleTime) {
      toast.error('Selecione um horário');
      return;
    }

    const newDate = new Date(rescheduleYear, rescheduleMonth, rescheduleDay);
    
    onUpdate(appointment.id, {
      date: newDate,
      time: rescheduleTime,
    });

    toast.success('Marcação reagendada com sucesso');
    setShowRescheduleDialog(false);
  };

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

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
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
      case 'completed':
        return <Badge className="bg-green-600 text-white rounded-full px-3 flex items-center gap-1">
          <CheckCircleIcon className="w-3 h-3" />
          Concluído
        </Badge>;
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
              <p className="text-gray-900 dark:text-gray-100">{appointment.patientEmail}</p>
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
                          className="border-purple-300 data-[state=checked]:bg-purple-600"
                        />
                      )}
                      <FileTextIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
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
                          Atualizar
                        </Button>
                      )}
                    </div>
                    
                    {/* Caixa de texto aparece imediatamente abaixo do documento selecionado */}
                    {!isClient && selectedDocs.includes(index) && (
                      <div className="mt-2 ml-9">
                        <Textarea
                          placeholder="Razão pela qual este documento é inválido..."
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
              <Button
                onClick={handleStartAppointment}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
              >
                <PlayIcon className="w-4 h-4" />
                Iniciar atendimento
              </Button>
            )}

            {!isClient && appointment.status === 'in-progress' && (
              <Button
                onClick={handleCompleteAppointment}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Concluir
              </Button>
            )}

            {!isClient && selectedDocs.length > 0 && (
              <Button
                onClick={handleNotifyInvalid}
                variant="outline"
                className="w-full border-yellow-300 dark:border-yellow-600 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 gap-2"
              >
                <BellIcon className="w-4 h-4" />
                Notificar Documento Inválido
              </Button>
            )}

            {!isClient && appointment.status === 'warning' && (
              <Button
                onClick={handleStartAppointment}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
              >
                <PlayIcon className="w-4 h-4" />
                Iniciar atendimento
              </Button>
            )}

            {/* Botões para Cliente */}
            {isClient && (appointment.status === 'scheduled' || appointment.status === 'warning') && (
              <>
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
                  onClick={() => setShowAddDocDialog(true)}
                >
                  <FileTextIcon className="w-4 h-4" />
                  Adicionar Documentos
                </Button>
                <Button
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white gap-2"
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
                  Reagendar
                </Button>
              </>
            )}

            {/* Botão Cancelar (comum mas condicionado) */}
            {!isClient && appointment.status !== 'in-progress' && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
              <Button
                variant="destructive"
                onClick={() => setShowCancelDialog(true)}
                className="w-full"
              >
                Cancelar
              </Button>
            )}

            {isClient && appointment.status !== 'in-progress' && appointment.status !== 'cancelled' && (
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
          {isClient ? 'Cancelar marcação' : 'Cancelar marcação'}
        </DialogTitle>
        <DialogPrimitive.Description className="text-sm text-gray-600 dark:text-gray-400">
          {isClient 
            ? 'Por favor, explique brevemente o motivo do cancelamento.'
            : 'Explique brevemente ao utente porque esta marcação será cancelada.'}
        </DialogPrimitive.Description>

        <Textarea
          placeholder={isClient 
            ? "Ex.: Não posso comparecer devido a compromisso urgente..."
            : "Ex.: Utente não enviou os documentos necessários..."}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          rows={4}
          className="text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 mt-4"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {isClient
            ? 'O motivo será enviado à secretaria juntamente com a notificação de cancelamento.'
            : 'O motivo será enviado ao utente juntamente com a notificação de cancelamento.'}
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

    {/* Diálogo Adicionar Documento */}
    <Dialog open={showAddDocDialog} onOpenChange={setShowAddDocDialog}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Adicionar Documento
        </DialogTitle>
        <DialogPrimitive.Description className="text-sm text-gray-600 dark:text-gray-400">
          Digite o nome do documento que deseja adicionar.
        </DialogPrimitive.Description>

        <Input
          placeholder="Ex.: Comprovativo de morada..."
          value={newDocName}
          onChange={(e) => setNewDocName(e.target.value)}
          className="mt-4"
        />

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => {
            setNewDocName('');
            setShowAddDocDialog(false);
          }}>
            Cancelar
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={handleAddDocument}
            disabled={!newDocName.trim()}
          >
            Adicionar
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Diálogo Atualizar Documento */}
    <Dialog open={showUpdateDocDialog} onOpenChange={setShowUpdateDocDialog}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Atualizar Documento
        </DialogTitle>
        <DialogPrimitive.Description className="text-sm text-gray-600 dark:text-gray-400">
          Digite o novo nome para o documento.
        </DialogPrimitive.Description>

        <Input
          placeholder="Novo nome do documento..."
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
            Cancelar
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={handleUpdateDocument}
            disabled={!newDocName.trim()}
          >
            Atualizar
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Diálogo Reagendar */}
    <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
      <DialogContent className="max-w-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Reagendar Marcação
          </DialogTitle>
          <DialogPrimitive.Description className="text-sm text-gray-600 dark:text-gray-400">
            Escolha a nova data e horário para a sua marcação.
          </DialogPrimitive.Description>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-end gap-4 flex-wrap">
            {/* Ano */}
            <div className="flex flex-col gap-1 flex-1 min-w-[110px]">
              <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Ano</Label>
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
              <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Mês</Label>
              <Select value={String(rescheduleMonth)} onValueChange={(value) => setRescheduleMonth(Number(value))}>
                <SelectTrigger className="bg-gray-50 dark:bg-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ maxHeight: '15rem' }} className="overflow-y-auto">
                  {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((month, idx) => (
                    <SelectItem key={idx} value={String(idx)}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dia */}
            <div className="flex flex-col gap-1 flex-1 min-w-[100px]">
              <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Dia</Label>
              <Select 
                value={String(rescheduleDay)} 
                onValueChange={(value) => setRescheduleDay(Math.min(Number(value), getDaysInMonth(rescheduleYear, rescheduleMonth)))}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ maxHeight: '15rem' }} className="overflow-y-auto">
                  {Array.from({ length: getDaysInMonth(rescheduleYear, rescheduleMonth) }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={String(day)}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Horário */}
            <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
              <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Horário</Label>
              <Select value={rescheduleTime} onValueChange={setRescheduleTime}>
                <SelectTrigger className="bg-gray-50 dark:bg-gray-800">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent style={{ maxHeight: '15rem' }} className="overflow-y-auto">
                  {generateTimeSlots().map((slot) => (
                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-yellow-500 hover:bg-yellow-600"
            onClick={handleReschedule}
            disabled={!rescheduleTime}
          >
            Confirmar Reagendamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
