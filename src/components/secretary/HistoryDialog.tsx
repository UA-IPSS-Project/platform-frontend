import { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Search, Calendar, Clock } from 'lucide-react';
import type { Appointment } from '../SecretaryDashboard';

interface HistoryDialogProps {
  open: boolean;
  onClose: () => void;
  appointments: Appointment[];
  onViewAppointment: (appointment: Appointment) => void;
}

const parseAppointmentDate = (value: Appointment['date']) => {
  const parsed = new Date(value as Date);
  return isNaN(parsed.getTime()) ? null : parsed;
};

export function HistoryDialog({ open, onClose, appointments, onViewAppointment }: HistoryDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = parseAppointmentDate(a.date);
    const dateB = parseAppointmentDate(b.date);
    const dateCompare = (dateB?.getTime() ?? 0) - (dateA?.getTime() ?? 0);
    if (dateCompare !== 0) return dateCompare;
    
    const [aHour, aMin] = a.time.split(':').map(Number);
    const [bHour, bMin] = b.time.split(':').map(Number);
    return (bHour * 60 + bMin) - (aHour * 60 + aMin);
  });

  const filteredAppointments = sortedAppointments.filter(apt =>
    apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.patientNIF.includes(searchTerm) ||
    apt.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-progress':
        return <Badge className="bg-purple-500 text-white">Em Curso</Badge>;
      case 'scheduled':
        return <Badge className="bg-gray-700 text-white">Agendado</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500 text-gray-900">! Agendado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Histórico de Marcações</DialogTitle>
        </DialogHeader>
        <DialogPrimitive.Description className="sr-only">
          Visualize e pesquise todas as marcações anteriores
        </DialogPrimitive.Description>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Pesquisar por nome, NIF ou assunto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Appointments List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>Nenhuma marcação encontrada</p>
              </div>
            ) : (
              filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                    apt.status === 'cancelled'
                      ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => onViewAppointment(apt)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-gray-900 dark:text-gray-100 mb-1">{apt.patientName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{apt.subject}</p>
                    </div>
                    {getStatusBadge(apt.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{parseAppointmentDate(apt.date)?.toLocaleDateString('pt-PT') ?? String(apt.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{apt.time}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
