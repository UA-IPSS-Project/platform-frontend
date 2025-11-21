import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import { ClockIcon, DownloadIcon, HistoryIcon, AlertTriangleIcon } from '../CustomIcons';
import type { Appointment } from '../SecretaryDashboard';

interface TodayAppointmentsProps {
  appointments: Appointment[];
  onViewAppointment: (appointment: Appointment) => void;
  onShowHistory: () => void;
  isDarkMode: boolean;
}

export function TodayAppointments({ appointments, onViewAppointment, onShowHistory, isDarkMode }: TodayAppointmentsProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayAppointments = appointments
    .filter(apt => {
      const aptDate = new Date(apt.date);
      aptDate.setHours(0, 0, 0, 0);
      return aptDate.getTime() === today.getTime() && apt.status !== 'cancelled';
    })
    .sort((a, b) => {
      const [aHour, aMin] = a.time.split(':').map(Number);
      const [bHour, bMin] = b.time.split(':').map(Number);
      return aHour * 60 + aMin - (bHour * 60 + bMin);
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-progress':
        return <Badge className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-2 py-0.5 text-xs">Em Curso</Badge>;
      case 'scheduled':
        return <Badge className="bg-gray-700 hover:bg-gray-800 text-white rounded-full px-2 py-0.5 text-xs dark:bg-gray-600">Agendado</Badge>;
      case 'warning':
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-full px-2 py-0.5 text-xs flex items-center gap-1">
            <AlertTriangleIcon className="w-3 h-3" />
            Agendado
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleExport = () => {
    toast.success('Lista diária exportada com sucesso');
  };

  const headerTextClass = isDarkMode ? 'text-gray-100' : 'text-gray-900';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-base font-semibold ${headerTextClass}`}>Agendamentos de Hoje</h2>
        <Button variant="outline" size="sm" onClick={onShowHistory} className="gap-2 h-8 text-xs">
          <HistoryIcon className="w-3.5 h-3.5" />
          Histórico
        </Button>
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        {todayAppointments.length === 0 ? (
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-sm p-8 text-center">
            <ClockIcon className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-500">Sem agendamentos para hoje</p>
          </div>
        ) : (
          todayAppointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow p-4"
              onClick={() => onViewAppointment(apt)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <ClockIcon className="w-3.5 h-3.5" />
                  <span>{apt.time}</span>
                </div>
                {getStatusBadge(apt.status)}
              </div>
              
              <h3 className="text-sm text-gray-900 dark:text-gray-100 mb-1">{apt.patientName}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">{apt.subject}</p>
            </div>
          ))
        )}
      </div>

      {/* Export Button */}
      {todayAppointments.length > 0 && (
        <Button variant="outline" className="w-full gap-2 h-9 text-sm" onClick={handleExport}>
          <DownloadIcon className="w-4 h-4" />
          Exportar Lista Diária
        </Button>
      )}
    </div>
  );
}
