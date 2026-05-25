import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Calendar } from '../ui/calendar';
import { useAuth } from '../../contexts/AuthContext';
import { bloqueiosApi, Bloqueio } from '../../services/api';
import { toast } from 'sonner';
import { Trash2, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { enUS, pt as ptLocale } from 'date-fns/locale';
import { Appointment } from '../../types';
import { useTranslation } from 'react-i18next';

interface BlockedScheduleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointments: Appointment[];
    onSuccess?: () => void;
    tipo?: 'SECRETARIA' | 'BALNEARIO';
}

const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            if (hour === 17 && minute > 0) break;
            slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        }
    }
    return slots;
};

const ALL_SLOTS = generateTimeSlots();

export function BlockedScheduleDialog({ open, onOpenChange, appointments, onSuccess, tipo = 'SECRETARIA' }: BlockedScheduleDialogProps) {
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language.startsWith('en') ? enUS : ptLocale;
    const { user } = useAuth();
    const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
    const [loading, setLoading] = useState(false);

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    useEffect(() => {
        if (open) {
            fetchBloqueios();
            setSelectedDate(new Date());
            setStartTime('');
            setEndTime('');
        }
    }, [open]);

    // Reset end time when start time changes
    useEffect(() => {
        setEndTime('');
    }, [startTime, selectedDate]);

    const fetchBloqueios = async () => {
        try {
            const data = await bloqueiosApi.listar(tipo);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const filtered = data.filter(b => {
                const blockDate = new Date(b.data);
                blockDate.setHours(0, 0, 0, 0);
                if (blockDate.getTime() > today.getTime()) return true;
                if (blockDate.getTime() < today.getTime()) return false;
                const now = new Date();
                const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                return b.horaFim.substring(0, 5) > currentTime;
            });
            setBloqueios(filtered.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()));
        } catch (error) {
            console.error(t('blockedSchedule.errors.loadBlocks'), error);
        }
    };

    const isSlotUnavailable = (slot: string, date: Date | undefined) => {
        if (!date) return true;
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        if (isToday) {
            const [h, m] = slot.split(':').map(Number);
            const slotTime = new Date(date);
            slotTime.setHours(h, m, 0, 0);
            if (slotTime <= now) return true;
        }
        const hasAppointment = appointments.some(appt => {
            if (appt.status === 'cancelled') return false;
            const apptDate = new Date(appt.date);
            return apptDate.toDateString() === date.toDateString() && appt.time === slot;
        });
        const isBlocked = bloqueios.some(b => {
            const blockDate = new Date(b.data);
            if (blockDate.toDateString() !== date.toDateString()) return false;
            const start = b.horaInicio.substring(0, 5);
            const end = b.horaFim.substring(0, 5);
            return slot >= start && slot < end;
        });
        return hasAppointment || isBlocked;
    };

    // Available start slots: not unavailable, not 17:00
    const startSlots = ALL_SLOTS.filter(s => s !== '17:00' && !isSlotUnavailable(s, selectedDate));

    // Available end slots: after startTime, not blocked by appointment (boundary ok)
    const endSlots = ALL_SLOTS.filter(slot => {
        if (!startTime || slot <= startTime) return false;
        const hasAppointment = appointments.some(appt => {
            if (appt.status === 'cancelled' || !selectedDate) return false;
            const apptDate = new Date(appt.date);
            return apptDate.toDateString() === selectedDate.toDateString() && appt.time === slot;
        });
        const isBlocked = bloqueios.some(b => {
            if (!selectedDate) return false;
            const blockDate = new Date(b.data);
            if (blockDate.toDateString() !== selectedDate.toDateString()) return false;
            const start = b.horaInicio.substring(0, 5);
            const end = b.horaFim.substring(0, 5);
            return slot > start && slot < end;
        });
        return !hasAppointment && !isBlocked;
    });

    const handleCreate = async () => {
        if (!selectedDate || !startTime || !endTime) {
            toast.error(t('blockedSchedule.errors.fillAllFields'));
            return;
        }
        try {
            setLoading(true);
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            await bloqueiosApi.criar({ dataInicio: dateStr, dataFim: dateStr, horaInicio: startTime, horaFim: endTime }, user?.id || 0, tipo);
            toast.success(t('blockedSchedule.messages.blockCreated'));
            await fetchBloqueios();
            setStartTime('');
            setEndTime('');
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            const msg = error instanceof Error ? error.message : t('blockedSchedule.errors.unknownCreateError');
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await bloqueiosApi.remover(id);
            toast.success(t('blockedSchedule.messages.blockRemoved'));
            await fetchBloqueios();
            onSuccess?.();
        } catch (error) {
            toast.error(t('blockedSchedule.errors.removeFailed'));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl bg-card border border-border">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <Lock className="w-5 h-5 text-destructive" />
                        {t('blockedSchedule.title')}
                    </DialogTitle>
                </DialogHeader>

                {/* Calendário + Seleção de horários */}
                <div className="flex flex-col sm:flex-row gap-6 mt-2 items-start">
                    {/* Calendário */}
                    <div className="flex flex-col items-center">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(d) => { if (d) { setSelectedDate(d); setStartTime(''); setEndTime(''); } }}
                            locale={dateLocale}
                            disabled={(d) => {
                                const dow = d.getDay();
                                if (dow === 0 || dow === 6) return true;
                                const todayStart = new Date();
                                todayStart.setHours(0, 0, 0, 0);
                                return d < todayStart;
                            }}
                            initialFocus
                        />
                    </div>

                    {/* Seleção de horários */}
                    <div className="flex flex-col gap-4 flex-1 min-w-0">
                        {/* Hora início */}
                        <div className="flex flex-col gap-2">
                            <Label className="text-xs text-muted-foreground uppercase">{t('blockedSchedule.start')}</Label>
                            {startSlots.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">{t('blockedSchedule.occupied')}</p>
                            ) : (
                                <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto pr-1">
                                    {startSlots.map(slot => (
                                        <button
                                            key={slot}
                                            type="button"
                                            onClick={() => setStartTime(slot)}
                                            className={`px-2 py-1.5 rounded-lg border text-sm font-medium transition-colors ${startTime === slot
                                                ? 'bg-destructive text-white border-destructive'
                                                : 'bg-muted/40 border-border text-foreground/80 hover:border-destructive/60 hover:bg-destructive/10'
                                            }`}
                                        >
                                            {slot}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Hora fim */}
                        <div className="flex flex-col gap-2">
                            <Label className="text-xs text-muted-foreground uppercase">{t('blockedSchedule.end')}</Label>
                            {!startTime ? (
                                <p className="text-sm text-muted-foreground italic">{t('blockedSchedule.start')} primeiro</p>
                            ) : endSlots.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">{t('blockedSchedule.occupied')}</p>
                            ) : (
                                <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto pr-1">
                                    {endSlots.map(slot => (
                                        <button
                                            key={slot}
                                            type="button"
                                            onClick={() => setEndTime(slot)}
                                            className={`px-2 py-1.5 rounded-lg border text-sm font-medium transition-colors ${endTime === slot
                                                ? 'bg-destructive text-white border-destructive'
                                                : 'bg-muted/40 border-border text-foreground/80 hover:border-destructive/60 hover:bg-destructive/10'
                                            }`}
                                        >
                                            {slot}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabela de bloqueios activos */}
                <div className="space-y-2 mt-2">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Lock className="w-4 h-4 text-destructive" />
                        {t('blockedSchedule.activeBlocks')}
                    </h3>
                    <div className="border border-border rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                                <tr>
                                    <th className="px-4 py-2">{t('blockedSchedule.day')}</th>
                                    <th className="px-4 py-2">{t('blockedSchedule.start')}</th>
                                    <th className="px-4 py-2">{t('blockedSchedule.end')}</th>
                                    <th className="px-4 py-2 text-right">{t('blockedSchedule.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-card">
                                {bloqueios.length === 0 ? (
                                    <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">{t('blockedSchedule.noRegisteredBlocks')}</td></tr>
                                ) : (
                                    bloqueios.map((b) => (
                                        <tr key={b.id} className="hover:bg-muted/40">
                                            <td className="px-4 py-2 font-medium">{b.data ? format(new Date(b.data), 'dd MMM yyyy', { locale: dateLocale }) : '-'}</td>
                                            <td className="px-4 py-2 text-muted-foreground">{b.horaInicio?.substring(0, 5)}</td>
                                            <td className="px-4 py-2 text-muted-foreground">{b.horaFim?.substring(0, 5)}</td>
                                            <td className="px-4 py-2 text-right">
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0">
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

                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t('appointmentDialog.actions.cancel')}
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={loading || !selectedDate || !startTime || !endTime}
                        className="bg-destructive hover:bg-destructive/90 text-white font-medium"
                    >
                        {loading ? t('blockedSchedule.processing') : t('blockedSchedule.addBlock')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
