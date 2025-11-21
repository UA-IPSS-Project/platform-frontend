import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner@2.0.3';
import { ArrowLeftIcon, DownloadIcon } from '../CustomIcons';
import type { Appointment } from '../SecretaryDashboard';

interface HistoryPageProps {
  appointments: Appointment[];
  onBack: () => void;
  onViewAppointment: (appointment: Appointment) => void;
  isDarkMode: boolean;
}

const ITEMS_PER_PAGE = 4;

const parseAppointmentDate = (value: Appointment['date']) => {
  const parsed = new Date(value as Date);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const getStatusLabel = (status: Appointment['status']) => {
  switch (status) {
    case 'in-progress':
      return 'Em Curso';
    case 'scheduled':
      return 'Concluído';
    case 'warning':
      return 'Não compareceu';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status;
  }
};

const getStatusBadge = (status: Appointment['status']) => {
  switch (status) {
    case 'in-progress':
      return <Badge className="bg-purple-500 text-white">Em Curso</Badge>;
    case 'scheduled':
      return <Badge className="bg-green-600 text-white">Concluído</Badge>;
    case 'warning':
      return <Badge className="bg-yellow-500 text-gray-900">Não compareceu</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Cancelado</Badge>;
    default:
      return null;
  }
};

export function HistoryPage({ appointments, onBack, onViewAppointment, isDarkMode }: HistoryPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Sort appointments by date (most recent first)
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = parseAppointmentDate(a.date);
    const dateB = parseAppointmentDate(b.date);
    const dateCompare = (dateB?.getTime() ?? 0) - (dateA?.getTime() ?? 0);
    if (dateCompare !== 0) return dateCompare;
    
    const [aHour, aMin] = a.time.split(':').map(Number);
    const [bHour, bMin] = b.time.split(':').map(Number);
    return (bHour * 60 + bMin) - (aHour * 60 + aMin);
  });

  // Get unique subjects for filter
  const uniqueSubjects = Array.from(new Set(appointments.map(apt => apt.subject)));

  // Filter appointments
  const filteredAppointments = sortedAppointments.filter(apt => {
    const statusText = getStatusLabel(apt.status);
    const appointmentDate = parseAppointmentDate(apt.date);
    const matchesSearch = 
      searchTerm === '' ||
      apt.time.includes(searchTerm) ||
      appointmentDate?.toLocaleDateString('pt-PT')?.includes(searchTerm) ||
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patientNIF.includes(searchTerm) ||
      apt.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      statusText.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    const matchesSubject = subjectFilter === 'all' || apt.subject === subjectFilter;

    return matchesSearch && matchesStatus && matchesSubject;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);

  const handleExport = () => {
    toast.success('Histórico exportado com sucesso');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>Voltar para Marcações</span>
      </button>

      {/* History Card */}
      <div className={`rounded-lg ${isDarkMode ? 'bg-gray-900/50 border border-gray-800 shadow-lg' : 'bg-white shadow-xl'} p-6`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl text-gray-900 dark:text-gray-100">Histórico de Marcações</h1>
          <Button 
            variant="outline" 
            onClick={handleExport} 
            className="gap-2"
          >
            <DownloadIcon className="w-4 h-4" />
            Exportar
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Input
            type="text"
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={`${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white'} shadow-sm`}
          />
          
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className={`${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white'} shadow-sm`}>
              <SelectValue placeholder="Todos os estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              <SelectItem value="scheduled">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
              <SelectItem value="warning">Não compareceu</SelectItem>
              <SelectItem value="in-progress">Em Curso</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={subjectFilter}
            onValueChange={(value) => {
              setSubjectFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className={`${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white'} shadow-sm`}>
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
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? 'bg-gray-900/30' : 'bg-gray-50'}>
              <tr className={`border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <th className="text-left py-3 px-4 text-sm text-purple-600 dark:text-purple-400">HORÁRIO</th>
                <th className="text-left py-3 px-4 text-sm text-purple-600 dark:text-purple-400">DIA</th>
                <th className="text-left py-3 px-4 text-sm text-purple-600 dark:text-purple-400">ATENDENTE</th>
                <th className="text-left py-3 px-4 text-sm text-purple-600 dark:text-purple-400">UTENTE</th>
                <th className="text-left py-3 px-4 text-sm text-purple-600 dark:text-purple-400">ASSUNTO</th>
                <th className="text-left py-3 px-4 text-sm text-purple-600 dark:text-purple-400">ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    Nenhuma marcação encontrada
                  </td>
                </tr>
              ) : (
                paginatedAppointments.map((apt) => (
                  <tr
                    key={apt.id}
                    onClick={() => onViewAppointment(apt)}
                    className={`border-b cursor-pointer transition-colors ${
                      isDarkMode 
                        ? 'border-gray-800 hover:bg-gray-800/50' 
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-4 px-4 text-gray-900 dark:text-gray-100">{apt.time}</td>
                    <td className="py-4 px-4 text-gray-900 dark:text-gray-100">
                      {parseAppointmentDate(apt.date)?.toLocaleDateString('pt-PT') ?? String(apt.date)}
                    </td>
                    <td className="py-4 px-4 text-gray-900 dark:text-gray-100">Ana Silva</td>
                    <td className="py-4 px-4 text-gray-900 dark:text-gray-100">{apt.patientName}</td>
                    <td className="py-4 px-4 text-gray-900 dark:text-gray-100">{apt.subject}</td>
                    <td className="py-4 px-4">{getStatusBadge(apt.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredAppointments.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              A mostrar {startIndex + 1}-{Math.min(endIndex, filteredAppointments.length)} de {filteredAppointments.length} resultados
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={isDarkMode ? 'border-gray-700' : ''}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={isDarkMode ? 'border-gray-700' : ''}
              >
                Seguinte
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
