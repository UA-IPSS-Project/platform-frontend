import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Input } from '../ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import SUBJECTS from '../../lib/subjects';
import { toast } from 'sonner';
import { ClockIcon, DownloadIcon, HistoryIcon, AlertTriangleIcon } from '../CustomIcons';
import type { Appointment } from '../SecretaryDashboard';

interface TodayAppointmentsProps {
  appointments: Appointment[];
  onViewAppointment: (appointment: Appointment) => void;
  onShowHistory: () => void;
  isDarkMode: boolean;
  /** show filter button and controls (secretary only) */
  showFilter?: boolean;
}

export function TodayAppointments({ appointments, onViewAppointment, onShowHistory, isDarkMode, showFilter = false }: TodayAppointmentsProps) {
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
        return <Badge className="bg-pink-600 hover:bg-pink-700 text-white rounded-full px-2 py-0.5 text-xs">Agendado</Badge>;
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

  // Filter state (used when showFilter === true)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Appointment['status']>('all');
  const [subjectFilter, setSubjectFilter] = useState<'all' | string>('all');

  // Popover open state and temporary controls so filters are applied only after confirmation
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [tempSearch, setTempSearch] = useState('');
  const [tempStatus, setTempStatus] = useState<'all' | Appointment['status']>('all');
  const [tempSubject, setTempSubject] = useState<'all' | string>('all');

  useEffect(() => {
    if (popoverOpen) {
      // initialize temporary controls from active filters when opening
      setTempSearch(searchTerm);
      setTempStatus(statusFilter);
      setTempSubject(subjectFilter);
    }
  }, [popoverOpen]);

  // Use shared SUBJECTS list (source of truth)
  const uniqueSubjects = SUBJECTS;

  const filteredTodayAppointments = todayAppointments.filter(apt => {
    // Map the special filter value for the warning state correctly
    const statusMatch =
      statusFilter === 'all' ||
      (statusFilter === 'warning' && apt.status === 'warning') ||
      apt.status === statusFilter;
    const subjectMatch = subjectFilter === 'all' || apt.subject === subjectFilter;
    const searchLower = searchTerm.trim().toLowerCase();
    const searchMatch =
      searchLower === '' ||
      apt.subject.toLowerCase().includes(searchLower) ||
      apt.patientName.toLowerCase().includes(searchLower) ||
      apt.patientNIF.includes(searchLower) ||
      apt.time.includes(searchLower);

    return statusMatch && subjectMatch && searchMatch;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg font-semibold ${headerTextClass}`}>Agendamentos de Hoje</h2>
        <div className="flex items-center gap-2">
          {showFilter && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
                  Filtrar
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3">
                <div className="flex flex-col gap-2">
                  <Input
                    placeholder="Pesquisar..."
                    value={tempSearch}
                    onChange={(e) => setTempSearch(e.target.value)}
                    className="text-sm"
                  />

                  <Select value={tempStatus} onValueChange={(v: Appointment['status'] | 'all') => setTempStatus(v)}>
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Todos os estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os estados</SelectItem>
                      <SelectItem value="in-progress">Em Curso</SelectItem>
                      <SelectItem value="scheduled">Agendado</SelectItem>
                      <SelectItem value="warning">
                        <div className="flex items-center gap-2">
                          <AlertTriangleIcon className="w-3 h-3 text-yellow-500" />
                          <span>Agendado</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={tempSubject} onValueChange={(v: string | 'all') => setTempSubject(v)}>
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Todos os assuntos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os assuntos</SelectItem>
                      {uniqueSubjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2 mt-2">
                    <Button
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => {
                        // apply temporary filters to active filters
                        setSearchTerm(tempSearch);
                        setStatusFilter(tempStatus);
                        setSubjectFilter(tempSubject);
                        setPopoverOpen(false);
                      }}
                    >
                      Aplicar
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        // clear both temporary and active filters
                        setTempSearch('');
                        setTempStatus('all');
                        setTempSubject('all');
                        setSearchTerm('');
                        setStatusFilter('all');
                        setSubjectFilter('all');
                      }}
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          <Button variant="outline" size="sm" onClick={onShowHistory} className="gap-2 h-8 text-xs">
            <HistoryIcon className="w-3.5 h-3.5" />
            Histórico
          </Button>
        </div>
      </div>

      {/* Card transparente com altura fixa para 5 marcações */}
      <Card 
        className="p-4 border-transparent bg-transparent shadow-none"
        style={{ height: '650px' }}
      >
        {/* Appointments List - Container com scroll */}
        <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-gray-200 dark:scrollbar-thumb-purple-600 dark:scrollbar-track-gray-800">
          <div className="space-y-3">
            {filteredTodayAppointments.length === 0 ? (
              <div className={`rounded-lg shadow-sm p-8 text-center ${
                isDarkMode
                  ? 'bg-gray-800 backdrop-blur border border-gray-700'
                  : 'bg-white/95 backdrop-blur border border-gray-200'
              }`}>
                <ClockIcon className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-600" />
                <p className="text-sm text-gray-500 dark:text-gray-500">Sem agendamentos para hoje</p>
              </div>
            ) : (
              filteredTodayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className={`rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow p-4 ${
                    isDarkMode
                      ? 'bg-gray-800 backdrop-blur border border-gray-700 hover:border-purple-600'
                      : 'bg-white/95 backdrop-blur border border-gray-200 hover:border-purple-600'
                  }`}
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
        </div>
      </Card>

      {/* Export Button */}
      {filteredTodayAppointments.length > 0 && (
        <Button variant="outline" className="w-full gap-2 h-9 text-sm mt-4" onClick={handleExport}>
          <DownloadIcon className="w-4 h-4" />
          Exportar Lista Diária
        </Button>
      )}
    </div>
  );
}
