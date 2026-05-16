import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { ChevronRight } from 'lucide-react';
import { Appointment } from '../../types';
import { calendarioApi } from '../../services/api';
import { toast } from 'sonner';

interface DayScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  date: Date;
  appointments: Appointment[];
  onCreateAppointment: (date: Date, time: string) => void;
  onViewAppointment: (appointment: Appointment) => void;
  appointmentType?: 'SECRETARIA' | 'BALNEARIO';
}

const HOURS = Array.from({ length: 34 }, (_, i) => {
  const totalMinutes = 510 + i * 15; // Start at 8:30
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
});

export function DayScheduleDialog({
  open,
  onClose,
  date,
  appointments,
  onCreateAppointment,
  onViewAppointment,
  appointmentType = 'SECRETARIA',
}: DayScheduleDialogProps) {
  const [slotCapacity, setSlotCapacity] = useState<number>(1);

  useEffect(() => {
    const loadSlotCapacity = async () => {
      try {
        const configs = await calendarioApi.listarConfiguracaoSlots();
        const config = configs.find(item => item.tipo === appointmentType);
        setSlotCapacity(Math.max(1, config?.capacidadePorSlot ?? 1));
      } catch {
        setSlotCapacity(1);
      }
    };

    loadSlotCapacity();
  }, [appointmentType]);

  const getSlotAppointments = (time: string) => {
    const slotAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      aptDate.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);

      return aptDate.getTime() === checkDate.getTime() &&
        apt.time === time &&
        apt.status !== 'cancelled';
    });

    slotAppointments.sort((a, b) => {
      if (a.status === 'reserved' && b.status !== 'reserved') return 1;
      if (a.status !== 'reserved' && b.status === 'reserved') return -1;
      return 0;
    });

    return slotAppointments;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'border-l-4 border-primary bg-primary/10 text-primary';
      case 'scheduled':
        return 'border-l-4 border-status-info bg-status-info-soft/70 text-status-info';
      case 'warning':
        return 'border-l-4 border-status-warning bg-status-warning-soft/60 text-status-warning';
      default:
        return 'border-l-4 border-status-neutral bg-status-neutral-soft/60 text-status-neutral';
    }
  };

  const handleViewWeek = () => {
    onClose();
    // The parent component should switch to weekly view
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 bg-card border-border">
        <div className="p-6 border-b border-border flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {date.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </DialogTitle>
          </DialogHeader>
          <DialogPrimitive.Description className="sr-only">
            Visualize e gerencie as marcações do dia selecionado
          </DialogPrimitive.Description>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Schedule Grid - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="border border-border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[80px_1fr] bg-muted/50 border-b border-border">
                <div className="p-3 border-r border-border">
                  <span className="text-sm text-muted-foreground">Horário</span>
                </div>
                <div className="p-3 text-center">
                  <div className="text-sm text-foreground">
                    {date.toLocaleDateString('pt-PT', { weekday: 'short' })}
                  </div>
                  <div className="text-xs text-muted-foreground">{date.getDate()}</div>
                </div>
              </div>

              {/* Time Slots */}
              {HOURS.map((time) => {
                const slotAppointments = getSlotAppointments(time);
                const [hours, minutes] = time.split(':');
                const slotDateTime = new Date(date);
                slotDateTime.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0);
                const isPast = slotDateTime <= new Date();

                return (
                  <div
                    key={time}
                    className="grid grid-cols-[80px_1fr] border-b last:border-b-0 border-border hover:bg-muted/40"
                  >
                    <div className="p-3 border-r border-border text-sm text-muted-foreground">
                      {time}
                    </div>
                    <div className="min-h-[50px] p-1">
                      <div className="grid gap-1" style={{ gridTemplateRows: `repeat(${slotCapacity}, minmax(0, 1fr))` }}>
                        {Array.from({ length: slotCapacity }).map((_, slotIndex) => {
                          const appointment = slotAppointments[slotIndex];

                          if (appointment) {
                            return (
                              <button
                                key={`${time}-apt-${appointment.id}`}
                                type="button"
                                onClick={() => onViewAppointment(appointment)}
                                className={`rounded p-2 text-left transition-colors hover:opacity-90 ${getStatusColor(appointment.status)}`}
                                aria-label={`Ver marcação de ${appointment.patientName} às ${time}`}
                              >
                                <p className="text-xs truncate">{appointment.patientName}</p>
                              </button>
                            );
                          }

                          const segmentLabel = slotCapacity > 1
                            ? `Adicionar marcação (${slotIndex + 1}/${slotCapacity})`
                            : 'Adicionar marcação';

                          return (
                            <Button
                              key={`${time}-empty-${slotIndex}`}
                              type="button"
                              variant="ghost"
                              disabled={isPast}
                              onClick={async () => {
                                if (isPast) {
                                  toast.error('Não é possível marcar para uma data/hora no passado');
                                  return;
                                }

                                const dateStr = format(date, 'yyyy-MM-dd');
                                const isBlocked = await calendarioApi.verificarSlot(dateStr, time, appointmentType);
                                if (isBlocked) {
                                  toast.error('Horário indisponível');
                                  return;
                                }

                                onCreateAppointment(date, time);
                              }}
                              className="h-8 justify-start px-2 text-[11px] border border-dashed border-border text-muted-foreground hover:bg-accent"
                              aria-label={`${segmentLabel} no horário ${time}`}
                            >
                              {segmentLabel}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* View Week Button - Fixed at bottom */}
          <div className="px-6 py-4 border-t border-border flex-shrink-0">
            <Button
              onClick={handleViewWeek}
              className="w-full gap-2"
            >
              Ver Semana
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
