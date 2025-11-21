import * as DialogPrimitive from '@radix-ui/react-dialog@1.1.6';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { ChevronRight } from 'lucide-react';
import type { Appointment } from '../SecretaryDashboard';

interface DayScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  date: Date;
  appointments: Appointment[];
  onCreateAppointment: (date: Date, time: string) => void;
  onViewAppointment: (appointment: Appointment) => void;
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
}: DayScheduleDialogProps) {
  const getAppointmentForSlot = (time: string) => {
    return appointments.find(apt => {
      const aptDate = new Date(apt.date);
      aptDate.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      
      return aptDate.getTime() === checkDate.getTime() && 
             apt.time === time && 
             apt.status !== 'cancelled';
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'bg-purple-500 text-white';
      case 'scheduled':
        return 'bg-gray-700 text-white dark:bg-gray-600';
      case 'warning':
        return 'bg-yellow-500 text-gray-900';
      default:
        return 'bg-gray-300 text-gray-700';
    }
  };

  const handleViewWeek = () => {
    onClose();
    // The parent component should switch to weekly view
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">
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
            <div className="border rounded-lg dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[80px_1fr] bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
                <div className="p-3 border-r dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Horário</span>
                </div>
                <div className="p-3 text-center">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {date.toLocaleDateString('pt-PT', { weekday: 'short' })}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{date.getDate()}</div>
                </div>
              </div>

              {/* Time Slots */}
              {HOURS.map((time, index) => {
                const appointment = getAppointmentForSlot(time);
                
                return (
                  <div
                    key={index}
                    className="grid grid-cols-[80px_1fr] border-b last:border-b-0 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                  >
                    <div className="p-3 border-r dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                      {time}
                    </div>
                    <div
                      className="min-h-[50px] relative cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                      onClick={() => {
                        if (appointment) {
                          onViewAppointment(appointment);
                        } else {
                          onCreateAppointment(date, time);
                        }
                      }}
                    >
                      {appointment && (
                        <div className={`absolute inset-0 m-0.5 rounded p-2 ${getStatusColor(appointment.status)} flex flex-col justify-center`}>
                          <p className="text-xs truncate">{appointment.patientName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* View Week Button - Fixed at bottom */}
          <div className="px-6 py-4 border-t dark:border-gray-700 flex-shrink-0">
            <Button
              onClick={handleViewWeek}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
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
