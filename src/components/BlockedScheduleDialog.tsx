import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth } from '../contexts/AuthContext';
import { bloqueiosApi } from '../services/api';
import { toast } from 'sonner';
import { Trash2, Calendar as CalendarIcon, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from './ui/utils';
import { Appointment } from '../types';
import { Bloqueio } from '../services/api';

interface BlockedScheduleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointments: Appointment[];
    onSuccess?: () => void;
}

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

export function BlockedScheduleDialog({ open, onOpenChange, appointments, onSuccess }: BlockedScheduleDialogProps) {
    const { user } = useAuth();
    const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [startDate, setStartDate] = useState<Date | undefined>(new Date());
    const [endDate, setEndDate] = useState<Date | undefined>(new Date());
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');

    const allSlots = generateTimeSlots();

    useEffect(() => {
        if (open) {
            fetchBloqueios();
            setStartDate(new Date());
            setEndDate(new Date());
            setStartTime('09:00');
            setEndTime('17:00');
        }
    }, [open]);

    const fetchBloqueios = async () => {
        try {
            const data = await bloqueiosApi.listar();
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const filtered = data.filter(b => {
                const blockDate = new Date(b.data);
                blockDate.setHours(0, 0, 0, 0);
                return blockDate.getTime() >= today.getTime();
            });

            const sorted = filtered.sort((a, b) => {
                const dateA = new Date(a.data);
                const dateB = new Date(b.data);
                return dateA.getTime() - dateB.getTime();
            });
            setBloqueios(sorted);
        } catch (error) {
            console.error('Erro ao carregar bloqueios:', error);
        }
    };

    // Filter slots based on appointments for the selected day
    const getAvailableSlots = (date: Date | undefined) => {
        if (!date) return [];
        return allSlots.filter(slot => {
            // Check if any appointment exists at this time on this date
            const hasAppointment = appointments.some(appt => {
                if (appt.status === 'cancelled') return false;
                const apptDate = new Date(appt.date);

                // Compare dates strictly
                const isSameDate =
                    apptDate.getDate() === date.getDate() &&
                    apptDate.getMonth() === date.getMonth() &&
                    apptDate.getFullYear() === date.getFullYear();

                return isSameDate && appt.time === slot;
            });
            return !hasAppointment;
        });
    };

    const startSlots = getAvailableSlots(startDate);
    // Include 17:00 as a valid end time
    const endSlots = [...getAvailableSlots(endDate), "17:00"];

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate || !startTime || !endTime) {
            toast.error('Preencha todos os campos');
            return;
        }

        if (startDate > endDate) {
            toast.error('A data de fim deve ser posterior ou igual à data de início');
            return;
        }

        try {
            setLoading(true);
            let finalEndTime = endTime;

            // Se hora inicio == hora fim, significa que o user quer bloquear apenas aquele slot (15 min)
            if (startTime === endTime) {
                const idx = allSlots.indexOf(startTime);
                if (idx !== -1 && idx < allSlots.length - 1) {
                    finalEndTime = allSlots[idx + 1];
                } else if (idx === allSlots.length - 1) {
                    finalEndTime = "17:00";
                }
            }

            await bloqueiosApi.criar({
                dataInicio: format(startDate, 'yyyy-MM-dd'),
                dataFim: format(endDate, 'yyyy-MM-dd'),
                horaInicio: startTime,
                horaFim: finalEndTime
            }, user?.id || 0);

            toast.success('Bloqueio criado com sucesso');
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error('Error creating block', error);
            const msg = error instanceof Error ? error.message : "Erro desconhecido ao criar bloqueio";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await bloqueiosApi.remover(id);
            toast.success('Bloqueio removido');
            fetchBloqueios();
        } catch (error) {
            toast.error('Erro ao remover bloqueio');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <Lock className="w-5 h-5 text-red-500" />
                        Gerir Bloqueios de Horário
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Create Form */}
                    <form onSubmit={handleCreate} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4 border border-gray-100 dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Start Date & Time */}
                            <div className="space-y-2">
                                <Label className="text-xs uppercase text-gray-500 font-semibold">Início</Label>
                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full flex-1 justify-start text-left font-normal bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
                                                    !startDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {startDate ? format(startDate, "dd/MM/yyyy") : <span>Data</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={startDate}
                                                onSelect={(date) => {
                                                    setStartDate(date);
                                                    if (date) {
                                                        setEndDate(date);
                                                        // Reset times if needed, or keeping defaults is fine
                                                    }
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    <Select value={startTime} onValueChange={(val) => {
                                        setStartTime(val);
                                        // Default end time is same as start time (single cell block)
                                        setEndTime(val);
                                    }}>
                                        <SelectTrigger className="w-[110px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {startSlots.length > 0 ? (
                                                startSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)
                                            ) : (
                                                <SelectItem value="none" disabled>Ocupado</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* End Date & Time */}
                            <div className="space-y-2">
                                <Label className="text-xs uppercase text-gray-500 font-semibold">Fim</Label>
                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full flex-1 justify-start text-left font-normal bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
                                                    !endDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {endDate ? format(endDate, "dd/MM/yyyy") : <span>Data</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={endDate}
                                                onSelect={setEndDate}
                                                disabled={(date) => startDate ? date < startDate : false}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    <Select value={endTime} onValueChange={setEndTime}>
                                        <SelectTrigger className="w-[110px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {endSlots
                                                .filter(slot => {
                                                    // Se for no mesmo dia, hora fim >= hora inicio
                                                    if (startDate && endDate &&
                                                        startDate.getDate() === endDate.getDate() &&
                                                        startDate.getMonth() === endDate.getMonth() &&
                                                        startDate.getFullYear() === endDate.getFullYear()) {
                                                        return slot >= startTime;
                                                    }
                                                    return true;
                                                })
                                                .length > 0 ? (
                                                endSlots
                                                    .filter(slot => {
                                                        if (startDate && endDate &&
                                                            startDate.getDate() === endDate.getDate() &&
                                                            startDate.getMonth() === endDate.getMonth() &&
                                                            startDate.getFullYear() === endDate.getFullYear()) {
                                                            return slot >= startTime;
                                                        }
                                                        return true;
                                                    })
                                                    .map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)
                                            ) : (
                                                <SelectItem value="none" disabled>Indisp.</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || !startDate || !endDate}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium h-10"
                        >
                            {loading ? 'A processar...' : 'Adicionar Bloqueio'}
                        </Button>
                    </form>

                    {/* List Table */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            Bloqueios Ativos
                        </h3>

                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-4 py-3">Dia</th>
                                        <th className="px-4 py-3">Início</th>
                                        <th className="px-4 py-3">Fim</th>
                                        <th className="px-4 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                                    {bloqueios.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                                Não existem bloqueios registados
                                            </td>
                                        </tr>
                                    ) : (
                                        bloqueios.map((b) => (
                                            <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-4 py-3 font-medium">
                                                    {b.data ? format(new Date(b.data), "dd MMM yyyy", { locale: pt }) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                    {b.horaInicio?.substring(0, 5)}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                    {b.horaFim?.substring(0, 5)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(b.id)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
