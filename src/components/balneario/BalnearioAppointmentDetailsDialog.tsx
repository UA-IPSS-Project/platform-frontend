import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { XIcon, AlertTriangleIcon, CheckCircleIcon, UserIcon } from '../shared/CustomIcons';
import { ClipboardList } from 'lucide-react';
import { Appointment } from '../../types';
import { marcacoesApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface BalnearioAppointmentDetailsDialogProps {
    open: boolean;
    onClose: () => void;
    appointment: Appointment;
    onUpdate: (id: string, updates: Partial<Appointment>) => void;
    onCancel: (id: string, reason: string) => void;
}

const WEEKDAYS_LONG = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

export function BalnearioAppointmentDetailsDialog({
    open,
    onClose,
    appointment,
    onUpdate,
    onCancel
}: BalnearioAppointmentDetailsDialogProps) {
    const { user: authUser } = useAuth();

    const handleCancelAppointment = async () => {
        const reason = 'Cancelado pelo funcionário do Balneário';

        if (!authUser?.id) return;

        try {
            await marcacoesApi.atualizarEstado(
                parseInt(appointment.id),
                'CANCELADO',
                authUser.id,
                appointment.version,
                reason
            );

            onCancel(appointment.id, reason);
            onUpdate(appointment.id, { status: 'cancelled', cancellationReason: reason });
            toast.success('Marcação cancelada');
            onClose();
        } catch (error: any) {
            const mensagemErro = error.response?.data?.message || error.message || 'Não foi possível cancelar a marcação';
            toast.error(mensagemErro);
        }
    };

    const handleCompleteAppointment = async () => {
        if (!authUser?.id) return;

        try {
            await marcacoesApi.atualizarEstado(
                parseInt(appointment.id),
                'CONCLUIDO',
                authUser.id,
                appointment.version
            );

            onUpdate(appointment.id, { status: 'completed' });
            toast.success('Banho concluído com sucesso!');
            onClose();
        } catch (error: any) {
            const mensagemErro = error.response?.data?.message || error.message || 'Não foi possível concluir o atendimento';
            toast.error(mensagemErro);
        }
    };

    const handleNoShowAppointment = async () => {
        if (!authUser?.id) return;

        try {
            await marcacoesApi.atualizarEstado(
                parseInt(appointment.id),
                'NAO_COMPARECIDO',
                authUser.id,
                appointment.version
            );

            onUpdate(appointment.id, { status: 'no-show' });
            toast.success('Marcação atualizada para não comparência.');
            onClose();
        } catch (error: any) {
            const mensagemErro = error.response?.data?.message || error.message || 'Não foi possível atualizar estado';
            toast.error(mensagemErro);
        }
    };

    const handleStartAppointment = async () => {
        if (!authUser?.id) return;

        try {
            await marcacoesApi.atualizarEstado(
                parseInt(appointment.id),
                'EM_PROGRESSO',
                authUser.id,
                appointment.version
            );

            onUpdate(appointment.id, { status: 'in-progress' });
            toast.success('Presença registada!');
            onClose();
        } catch (error: any) {
            const mensagemErro = error.response?.data?.message || error.message || 'Não foi possível iniciar o atendimento';
            toast.error(mensagemErro);
        }
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
            case 'no-show':
                return (
                    <Badge style={{ backgroundColor: '#f97316', color: 'white' }} className="rounded-full px-3 flex items-center gap-1">
                        <UserIcon className="w-3 h-3 text-white" />
                        Não compareceu
                    </Badge>
                );
            case 'cancelled':
                return <Badge variant="destructive" className="rounded-full px-3">Cancelado</Badge>;
            default:
                return null;
        }
    };

    const dateObj = new Date(appointment.date);
    const dayName = WEEKDAYS_LONG[dateObj.getDay()];
    const day = dateObj.getDate();
    const month = dateObj.toLocaleDateString('pt-PT', { month: 'long' });
    const year = dateObj.getFullYear();
    const dateString = `${dayName}, ${day} de ${month} de ${year} às ${appointment.time}`;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent hideCloseButton className="max-w-xl p-0 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
                <DialogTitle className="sr-only">Detalhes do Agendamento Balneário</DialogTitle>
                <DialogPrimitive.Description className="sr-only">
                    Consulte as necessidades e informações do utente.
                </DialogPrimitive.Description>

                {/* Header - Fixed */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Detalhes do Banho</h2>
                            {getStatusBadge(appointment.status)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{dateString}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        aria-label="Fechar detalhes"
                    >
                        <XIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    {/* Patient Name */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5 border border-purple-100 dark:border-purple-800">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-2 mb-2">
                            <UserIcon className="w-4 h-4" />
                            Nome do Utente
                        </Label>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{appointment.patientName}</p>
                    </div>

                    {/* Cancellation info */}
                    {appointment.status === 'cancelled' && appointment.cancellationReason && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                            <p className="text-sm font-bold text-red-700 dark:text-red-300 mb-1">
                                Marcação cancelada
                            </p>
                            <p className="text-sm text-red-600 dark:text-red-200">
                                Motivo: {appointment.cancellationReason}
                            </p>
                        </div>
                    )}

                    {/* Checklist */}
                    <div>
                        <Label className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
                            <ClipboardList className="w-4 h-4 text-purple-600" />
                            Necessidades Assinaladas
                        </Label>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Serviços Solicitados:</h4>
                        <div className="space-y-2">
                            {(!appointment.balnearioDetails?.produtosHigiene &&
                                !appointment.balnearioDetails?.lavagemRoupa &&
                                (!appointment.balnearioDetails?.roupas || appointment.balnearioDetails.roupas.length === 0)) ? (
                                <p className="text-sm text-gray-500 italic">Nenhum serviço logístico específico registado.</p>
                            ) : (
                                <>
                                    {appointment.balnearioDetails?.produtosHigiene && (
                                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-md">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            Produtos de higiene (Gel de banho / Shampoo)
                                        </div>
                                    )}

                                    {appointment.balnearioDetails?.lavagemRoupa && (
                                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-md">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            Lavar a roupa
                                        </div>
                                    )}

                                    {appointment.balnearioDetails?.roupas && appointment.balnearioDetails.roupas.map((roupa, index) => (
                                        <div key={index} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-md">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            Fornecimento: {roupa.categoria} {roupa.tamanho ? `(Tam: ${roupa.tamanho})` : ''} x{roupa.quantidade}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Additional Notes */}
                    {appointment.description && appointment.description !== 'Serviços Logísticos' && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Notas Adicionais:</h4>
                            <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-md whitespace-pre-wrap border border-yellow-100">
                                {appointment.description}
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 pt-4 pb-2 border-t border-gray-100 dark:border-gray-800">
                        {(appointment.status === 'scheduled' || appointment.status === 'warning') && (
                            <div className="grid grid-cols-2 gap-3 mb-2">
                                <Button
                                    onClick={handleStartAppointment}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-sm transition-all py-6 h-auto"
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <CheckCircleIcon className="w-5 h-5 mb-1" />
                                        Compareceu
                                    </div>
                                </Button>

                                <Button
                                    onClick={handleNoShowAppointment}
                                    variant="outline"
                                    className="border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800/50 dark:text-orange-400 dark:hover:bg-orange-900/20 font-medium py-6 h-auto"
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <UserIcon className="w-5 h-5 mb-1" />
                                        Faltou
                                    </div>
                                </Button>
                            </div>
                        )}

                        {appointment.status === 'in-progress' && (
                            <Button
                                onClick={handleCompleteAppointment}
                                className="bg-green-600 hover:bg-green-700 text-white font-medium w-full py-6 h-auto mb-2"
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <CheckCircleIcon className="w-5 h-5 mb-1" />
                                    Concluir Atendimento
                                </div>
                            </Button>
                        )}

                        {(appointment.status === 'scheduled' || appointment.status === 'warning') && (
                            <Button
                                variant="ghost"
                                onClick={handleCancelAppointment}
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 w-full"
                            >
                                Cancelar Marcação
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
