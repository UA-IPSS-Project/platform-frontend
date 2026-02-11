import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { GlassCard } from '../ui/glass-card';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, CalendarIcon, ClockIcon, UserIcon, FileTextIcon } from '../CustomIcons';
import { Appointment } from '../../types';
import { calendarioApi, BloqueioAgenda, bloqueiosApi } from '../../services/api';
import { useIsMobile } from '../ui/use-mobile';

interface WeeklyScheduleProps {
  appointments: Appointment[];
  allAppointments?: Appointment[];
  currentUserNif?: string;
  isClient?: boolean;
  onCreateAppointment: (date: Date, time: string) => void;
  onViewAppointment: (appointment: Appointment) => void;
  onToggleView: () => void;
  isDarkMode: boolean;
  onRefresh?: () => Promise<void>;
  onBlockSchedule?: () => void;
  refreshTrigger?: number;

  highlightedSlot?: { date: Date; time: string } | null;
  currentDate: Date;
  onDateChange: (date: Date) => void;
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

const WEEKDAYS_SHORT = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const WEEKDAYS_MEDIUM = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
const WEEKDAYS_MOBILE = ['S', 'T', 'Q', 'Q', 'S'];

export function WeeklySchedule({ appointments, allAppointments, currentUserNif, isClient, onCreateAppointment, onViewAppointment, isDarkMode, onRefresh, onBlockSchedule, refreshTrigger, highlightedSlot, currentDate, onDateChange }: Readonly<WeeklyScheduleProps>) {
  const isMobile = useIsMobile();
  const [isTablet, setIsTablet] = useState(false);
  // const [currentDate, setCurrentDate] = useState(new Date()); // State lifted to parent
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [quickDialogOpen, setQuickDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Campo Ano como Select
  const [quickYear, setQuickYear] = useState(today.getFullYear());
  const [quickMonth, setQuickMonth] = useState(today.getMonth());
  const [quickDay, setQuickDay] = useState(today.getDate());
  const [quickDate, setQuickDate] = useState<Date>(today);
  const [quickTime, setQuickTime] = useState('');
  const [quickSlots, setQuickSlots] = useState<string[]>([]);
  const [quickMonthBlocks, setQuickMonthBlocks] = useState<Set<string>>(new Set());
  const [holidaysByYear, setHolidaysByYear] = useState<Record<number, Set<string>>>({});

  // Opções de ano (dropdown)
  const quickYearOptions = Array.from({ length: 5 }, (_, idx) => today.getFullYear() - 2 + idx);
  const selectMenuClassName = "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 overflow-y-auto";
  const selectMenuStyle = { maxHeight: '15rem' };

  // Ensure currentDate is valid
  const validCurrentDate = (currentDate && !isNaN(currentDate.getTime())) ? currentDate : new Date();

  const getWeekDays = (date: Date) => {
    const curr = new Date(date);
    if (isNaN(curr.getTime())) return [];

    // Adjust to Monday
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // If Sunday, go back 6 days to Monday. If Mon-Sat, go back (day-1) to Monday.

    const days = [];
    // Reset to Monday of that week
    const monday = new Date(curr.setDate(diff));

    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }

    return days;
  };

  const weekDays = getWeekDays(validCurrentDate);
  const timeSlots = generateTimeSlots();
  // Sempre mostrar todas as marcações para verificar disponibilidade
  const bookingSource = allAppointments ?? appointments;
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    const handleChange = () => setIsTablet(media.matches);

    handleChange();
    media.addEventListener('change', handleChange);

    return () => media.removeEventListener('change', handleChange);
  }, []);

  // Gerar ID estável para slot (formato: slot-YYYY-MM-DD-HHMM)
  const getSlotId = (date: Date, time: string) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const timeFormatted = time.replace(':', '');
    return `slot-${year}-${month}-${day}-${timeFormatted}`;
  };

  // Efeito para scroll e highlight quando highlightedSlot muda
  useEffect(() => {
    if (!highlightedSlot) {
      setActiveHighlight(null);
      return;
    }

    const slotId = getSlotId(highlightedSlot.date, highlightedSlot.time);
    const element = document.getElementById(slotId);

    if (element) {
      // Scroll suave até o elemento
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);

      // Ativar highlight
      setActiveHighlight(slotId);

      // Remover highlight após 5 segundos (3 ciclos de 1.5s)
      const timer = setTimeout(() => {
        setActiveHighlight(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [highlightedSlot]);

  const isSlotBooked = (date: Date, time: string) => {
    return bookingSource.some(apt => {
      const aptDate = new Date(apt.date);
      aptDate.setHours(0, 0, 0, 0);
      const slotDate = new Date(date);
      slotDate.setHours(0, 0, 0, 0);

      return aptDate.getTime() === slotDate.getTime() &&
        apt.time === time &&
        apt.status !== 'cancelled';
    });
  };

  const isSlotInPast = (date: Date, time: string) => {
    const [hours, minutes] = time.split(':');
    const slotDateTime = new Date(date);
    slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return slotDateTime <= new Date();
  };

  const [blockedSlots, setBlockedSlots] = useState<Set<string>>(new Set());

  // Helper para minutos
  const timeToMinutes = (time: string) => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  // Carregar bloqueios
  const fetchBlocks = async () => {
    try {
      // Buscar todos os bloqueios para evitar problemas entre meses
      const blocks = await bloqueiosApi.listar();

      const newBlockedSlots = new Set<string>();

      blocks.forEach(block => {
        const date = new Date(block.data);
        if (isNaN(date.getTime())) return;
        const dateStr = date.toISOString().split('T')[0];

        // Usar lógica de minutos para comparar
        const startMins = timeToMinutes(block.horaInicio);
        const endMins = timeToMinutes(block.horaFim);

        timeSlots.forEach(slot => {
          const slotMins = timeToMinutes(slot);
          if (slotMins >= startMins && slotMins < endMins) {
            newBlockedSlots.add(`${dateStr}_${slot}`);
          }
        });
      });
      setBlockedSlots(newBlockedSlots);
    } catch (error) {
      console.error("Erro ao carregar bloqueios:", error);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, [currentDate, onRefresh, refreshTrigger]); // Recarregar quando muda a semana ou refresh solicitado

  // Verificar se um slot está bloqueado (visualização + clique)
  const isSlotBlockedSync = (date: Date, time: string): boolean => {
    if (!date || isNaN(date.getTime())) return false;
    const dateStr = date.toISOString().split('T')[0];
    const key = `${dateStr}_${time}`;
    return blockedSlots.has(key);
  };

  // Async check for click action (double verification)
  const isSlotBlocked = async (date: Date, time: string): Promise<boolean> => {
    // Primeiro verifica cache local
    if (isSlotBlockedSync(date, time)) return true;

    // Fallback api check
    const dateStr = date.toISOString().split('T')[0];
    try {
      return await calendarioApi.verificarSlot(dateStr, time);
    } catch (e) { return false; }
  };

  const getAvailableSlotsForDate = (date: Date) =>
    timeSlots.filter((slot) => {
      const dateStr = date.toISOString().split('T')[0];
      const key = `${dateStr}_${slot}`;
      // Verificar tanto os bloqueios da semana quanto do mês do quick dialog
      const isBlockedInWeek = blockedSlots.has(key);
      const isBlockedInQuick = quickMonthBlocks.has(key);
      return !isSlotBooked(date, slot) && !isSlotInPast(date, slot) && !isBlockedInWeek && !isBlockedInQuick;
    });

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(validCurrentDate);
    newDate.setDate(validCurrentDate.getDate() + (direction === 'next' ? 7 : -7));
    onDateChange(newDate);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
      setCalendarOpen(false);
    }
  };

  const getAppointmentForSlot = (date: Date, time: string) => {
    const slotAppointments = bookingSource.filter(apt => {
      const aptDate = new Date(apt.date);
      aptDate.setHours(0, 0, 0, 0);
      const slotDate = new Date(date);
      slotDate.setHours(0, 0, 0, 0);

      return aptDate.getTime() === slotDate.getTime() &&
        apt.time === time &&
        apt.status !== 'cancelled';
    });

    // Se houver mais do que uma (ex: Reservado + Agendado), dar prioridade à Agendada
    // Ordenar: real (não-reserved) primeiro
    slotAppointments.sort((a, b) => {
      if (a.status === 'reserved' && b.status !== 'reserved') return 1;
      if (a.status !== 'reserved' && b.status === 'reserved') return -1;
      return 0;
    });

    return slotAppointments[0];
  };

  const handleSlotClick = async (date: Date, time: string) => {
    const appointment = getAppointmentForSlot(date, time);

    // Se já existe marcação, permitir visualizar (mesmo no passado)
    if (appointment) {
      // Verificar se é marcação própria
      const isOwn = appointment && (
        (appointment.patientNIF && currentUserNif && String(appointment.patientNIF) === String(currentUserNif)) ||
        appointments.some(a => a.id === appointment.id)
      );

      // Se for slot reservado ou bloqueado, recarregar marcações
      if (appointment.status === 'reserved' || (isClient && !isOwn)) {
        if (onRefresh) {
          toast.info('A atualizar marcações...');
          await onRefresh();
          toast.success('Marcações atualizadas!');
        }
        return;
      }
      onViewAppointment(appointment);
      return;
    }

    // Validar se o horário não é no passado APENAS para criar nova marcação
    if (isSlotInPast(date, time)) {
      toast.error('Não é possível marcar para uma data/hora no passado');
      return;
    }

    // Verificar se o slot está bloqueado (fim de semana, feriado, etc)
    // Se isSlotBlocked retornar true, significa que o backend detectou algo (bloqueio ou marcação existente)
    // Nesse caso, devemos forçar um refresh visual para o utilizador ver o novo estado
    const blocked = await isSlotBlocked(date, time);
    if (blocked) {
      toast.error('Horário indisponível');
      if (onRefresh) {
        // Forçar atualização imediata para mostrar o slot como Reservado/Bloqueado
        onRefresh();
      }
      return;
    }

    onCreateAppointment(date, time);
  };

  const getWeekLabel = () => {
    const firstDay = weekDays[0];
    const month = firstDay.toLocaleDateString('pt-PT', { month: 'long' });
    return `${firstDay.getDate()} de ${month}`;
  };

  // Obter marcações da semana para exportação
  const getWeekAppointments = () => {
    const weekStart = new Date(weekDays[0]);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekDays[weekDays.length - 1]);
    weekEnd.setHours(23, 59, 59, 999);

    const weekAppointments = bookingSource.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= weekStart && aptDate <= weekEnd && apt.status !== 'reserved';
    });

    // Ordenar por data e hora
    return [...weekAppointments].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      const dateCompare = dateA.getTime() - dateB.getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  };

  // Mapear status para português
  const statusLabels: Record<string, string> = {
    'scheduled': 'Agendado',
    'in-progress': 'Em Curso',
    'warning': 'Aviso',
    'completed': 'Concluído',
    'cancelled': 'Cancelado',
    'no-show': 'Faltou'
  };

  // Gerar nome do arquivo
  const getFileName = (extension: string) => {
    const firstDay = weekDays[0];
    const lastDay = weekDays[weekDays.length - 1];
    return `agenda_${firstDay.toLocaleDateString('pt-PT').replace(/\//g, '-')}_a_${lastDay.toLocaleDateString('pt-PT').replace(/\//g, '-')}.${extension}`;
  };

  // Exportar como CSV
  const handleExportCSV = () => {
    const sortedAppointments = getWeekAppointments();

    if (sortedAppointments.length === 0) {
      toast.warning('Não existem marcações para exportar nesta semana');
      return;
    }

    const headers = ['Data', 'Hora', 'Nome do Utente', 'NIF', 'Contacto', 'Email', 'Assunto', 'Estado'];
    const csvContent = [
      headers.join(';'),
      ...sortedAppointments.map(apt => {
        const date = new Date(apt.date);
        const formattedDate = date.toLocaleDateString('pt-PT');
        const status = statusLabels[apt.status] || apt.status;

        const escapeField = (field: string) => {
          if (field.includes(';') || field.includes('"') || field.includes('\n')) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        };

        return [
          formattedDate,
          apt.time,
          escapeField(apt.patientName || ''),
          apt.patientNIF || '',
          apt.patientContact || '',
          apt.patientEmail || '',
          escapeField(apt.subject || ''),
          status
        ].join(';');
      })
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', getFileName('csv'));
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setExportDialogOpen(false);
    toast.success('Agenda exportada em CSV com sucesso');
  };

  // Exportar como Excel (usando formato XML do Excel)
  const handleExportExcel = () => {
    const sortedAppointments = getWeekAppointments();

    if (sortedAppointments.length === 0) {
      toast.warning('Não existem marcações para exportar nesta semana');
      return;
    }

    const headers = ['Data', 'Hora', 'Nome do Utente', 'NIF', 'Contacto', 'Email', 'Assunto', 'Estado'];

    // Criar conteúdo HTML que o Excel pode abrir
    let tableContent = '<table border="1">';
    tableContent += '<tr>' + headers.map(h => `<th style="background-color:#4a5568;color:white;font-weight:bold;padding:8px;">${h}</th>`).join('') + '</tr>';

    // Função para obter cor do status
    const getStatusColor = (statusKey: string) => {
      switch (statusKey) {
        case 'completed': return '#38a169'; // Verde
        case 'no-show': return '#e53e3e'; // Vermelho
        case 'warning': return '#d69e2e'; // Amarelo
        case 'cancelled': return '#718096'; // Cinzento
        case 'in-progress': return '#805ad5'; // Roxo
        default: return '#4a5568'; // Default
      }
    };

    sortedAppointments.forEach(apt => {
      const date = new Date(apt.date);
      const formattedDate = date.toLocaleDateString('pt-PT');
      const status = statusLabels[apt.status] || apt.status;
      const statusColor = getStatusColor(apt.status);

      tableContent += '<tr>';
      tableContent += `<td style="padding:6px;">${formattedDate}</td>`;
      tableContent += `<td style="padding:6px;">${apt.time}</td>`;
      tableContent += `<td style="padding:6px;">${apt.patientName || ''}</td>`;
      tableContent += `<td style="padding:6px;">${apt.patientNIF || ''}</td>`;
      tableContent += `<td style="padding:6px;">${apt.patientContact || ''}</td>`;
      tableContent += `<td style="padding:6px;">${apt.patientEmail || ''}</td>`;
      tableContent += `<td style="padding:6px;">${apt.subject || ''}</td>`;
      tableContent += `<td style="padding:6px;color:${statusColor};font-weight:bold;">${status}</td>`;
      tableContent += '</tr>';
    });
    tableContent += '</table>';

    const excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head><meta charset="UTF-8"></head>
      <body>${tableContent}</body>
      </html>
    `;

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', getFileName('xls'));
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setExportDialogOpen(false);
    toast.success('Agenda exportada em Excel com sucesso');
  };

  // Exportar como PDF
  const handleExportPDF = () => {
    const sortedAppointments = getWeekAppointments();

    if (sortedAppointments.length === 0) {
      toast.warning('Não existem marcações para exportar nesta semana');
      return;
    }

    const headers = ['Data', 'Hora', 'Nome do Utente', 'NIF', 'Contacto', 'Email', 'Assunto', 'Estado'];
    const firstDay = weekDays[0];
    const lastDay = weekDays[weekDays.length - 1];
    const periodLabel = `${firstDay.toLocaleDateString('pt-PT')} a ${lastDay.toLocaleDateString('pt-PT')}`;

    // Criar HTML para impressão como PDF
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Agenda Semanal - ${periodLabel}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #1a202c; text-align: center; margin-bottom: 5px; }
          .period { text-align: center; color: #4a5568; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #4a5568; color: white; padding: 10px; text-align: left; font-size: 12px; }
          td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
          tr:nth-child(even) { background-color: #f7fafc; }
          .status-scheduled { color: #4a5568; }
          .status-completed { color: #38a169; font-weight: bold; }
          .status-cancelled { color: #718096; }
          .status-in_progress { color: #805ad5; font-weight: bold; }
          .status-no_show { color: #e53e3e; font-weight: bold; }
          .status-warning { color: #d69e2e; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #718096; }
        </style>
      </head>
      <body>
        <br/><br/><br/>
        <h1>Agenda Semanal</h1>
        <p class="period">${periodLabel}</p>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
    `;

    sortedAppointments.forEach(apt => {
      const date = new Date(apt.date);
      const formattedDate = date.toLocaleDateString('pt-PT');
      const status = statusLabels[apt.status] || apt.status;
      const statusClass = `status-${apt.status.toLowerCase().replace('-', '_')}`;

      htmlContent += `
        <tr>
          <td>${formattedDate}</td>
          <td>${apt.time}</td>
          <td>${apt.patientName || ''}</td>
          <td>${apt.patientNIF || ''}</td>
          <td>${apt.patientContact || ''}</td>
          <td>${apt.patientEmail || ''}</td>
          <td>${apt.subject || ''}</td>
          <td class="${statusClass}">${status}</td>
        </tr>
      `;
    });

    htmlContent += `
          </tbody>
        </table>
        <p class="footer">Gerado em ${new Date().toLocaleDateString('pt-PT')} às ${new Date().toLocaleTimeString('pt-PT')}</p>
      </body>
      </html>
    `;

    // Abrir nova janela para impressão como PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      printWindow.document.replaceChild(
        printWindow.document.importNode(doc.documentElement, true),
        printWindow.document.documentElement
      );
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }

    setExportDialogOpen(false);
    toast.success('A preparar PDF para impressão...');
  };

  // Exportar como ICS (iCalendar) - apenas marcações agendadas
  const handleExportICS = () => {
    const allAppointments = getWeekAppointments();
    // Filtrar apenas marcações com status 'scheduled' (agendadas)
    const scheduledAppointments = allAppointments.filter(apt => apt.status === 'scheduled');

    if (scheduledAppointments.length === 0) {
      toast.warning('Não existem marcações agendadas para exportar nesta semana');
      return;
    }

    // Função para formatar data no formato ICS (YYYYMMDDTHHMMSS)
    const formatICSDate = (date: Date, time: string) => {
      const [hours, minutes] = time.split(':');
      const d = new Date(date);
      d.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0);
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    // Função para formatar data de fim (intervalos de 15 minutos)
    const formatICSEndDate = (date: Date, time: string) => {
      const [hours, minutes] = time.split(':');
      const d = new Date(date);
      d.setHours(Number.parseInt(hours), Number.parseInt(minutes) + 15, 0, 0);
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    // Gerar UID único para cada evento
    const generateUID = (apt: Appointment) => {
      return `${apt.id}-${Date.now()}@juntafreguesia.pt`;
    };

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Junta de Freguesia//Agenda//PT',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:Agenda Semanal - ${getWeekLabel()}`,
    ];

    scheduledAppointments.forEach(apt => {
      const aptDate = new Date(apt.date);
      const status = statusLabels[apt.status] || apt.status;

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${generateUID(apt)}`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART:${formatICSDate(aptDate, apt.time)}`,
        `DTEND:${formatICSEndDate(aptDate, apt.time)}`,
        `SUMMARY:${apt.subject} - ${apt.patientName}`,
        `DESCRIPTION:Utente: ${apt.patientName}\\nNIF: ${apt.patientNIF || 'N/A'}\\nContacto: ${apt.patientContact || 'N/A'}\\nEmail: ${apt.patientEmail || 'N/A'}\\nEstado: ${status}`,
        `STATUS:${apt.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', getFileName('ics'));
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setExportDialogOpen(false);
    toast.success('Agenda exportada em formato iCalendar com sucesso');
  };

  const handleExportClick = () => {
    setExportDialogOpen(true);
  };

  const handleQuickDialogToggle = async (open: boolean) => {
    setQuickDialogOpen(open);

    if (open) {
      // Quando abrir o dialog, encontrar a primeira data disponível (não bloqueada)
      await findFirstAvailableDate();
    }
  };

  // Encontrar a primeira data disponível (não bloqueada, não fim de semana)
  const findFirstAvailableDate = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Procurar até 30 dias à frente
    for (let i = 0; i < 30; i++) {
      const testDate = new Date(today);
      testDate.setDate(today.getDate() + i);

      // Ignorar fins de semana
      const dayOfWeek = testDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      // Verificar se há algum horário disponível nesse dia
      let hasAvailable = false;

      for (const slot of timeSlots) {
        const blocked = await isSlotBlocked(testDate, slot);
        const booked = isSlotBooked(testDate, slot);
        const past = isSlotInPast(testDate, slot);

        if (!blocked && !booked && !past) {
          hasAvailable = true;
          break;
        }
      }

      if (hasAvailable) {
        setQuickYear(testDate.getFullYear());
        setQuickMonth(testDate.getMonth());
        setQuickDay(testDate.getDate());
        return;
      }
    }

    // Se não encontrou nenhuma data disponível, manter a data atual
    toast.warning('Não foram encontrados horários disponíveis nos próximos 30 dias');
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  useEffect(() => {
    const clampedDay = Math.min(quickDay, getDaysInMonth(quickYear, quickMonth));
    if (clampedDay !== quickDay) {
      setQuickDay(clampedDay);
      return;
    }
    const newDate = new Date(quickYear, quickMonth, quickDay);
    newDate.setHours(0, 0, 0, 0);
    setQuickDate(newDate);
  }, [quickDay, quickMonth, quickYear]);



  // Carregar bloqueios do mês selecionado no quick dialog
  useEffect(() => {
    const loadQuickMonthBlocks = async () => {
      try {
        const bloqueios = await calendarioApi.listarBloqueios(quickYear, quickMonth + 1);
        const newBlocks = new Set<string>();

        bloqueios.forEach((bloqueio: BloqueioAgenda) => {
          const date = new Date(bloqueio.data);
          const dateStr = date.toISOString().split('T')[0];

          const startMins = timeToMinutes(bloqueio.horaInicio);
          const endMins = timeToMinutes(bloqueio.horaFim);

          timeSlots.forEach(slot => {
            const slotMins = timeToMinutes(slot);
            if (slotMins >= startMins && slotMins < endMins) {
              newBlocks.add(`${dateStr}_${slot}`);
            }
          });
        });

        setQuickMonthBlocks(newBlocks);
      } catch (error) {
        console.error('Erro ao carregar bloqueios do mês:', error);
      }
    };

    if (quickDialogOpen) {
      loadQuickMonthBlocks();
    }
  }, [quickYear, quickMonth, quickDialogOpen]);

  useEffect(() => {
    const slots = getAvailableSlotsForDate(quickDate);
    setQuickSlots(slots);
    setQuickTime((prev) => {
      if (!slots.length) {
        return '';
      }
      if (prev && slots.includes(prev)) {
        return prev;
      }
      return slots[0];
    });
  }, [quickDate, appointments, blockedSlots, quickMonthBlocks]);

  const loadHolidays = async (year: number) => {
    if (holidaysByYear[year]) return;
    try {
      const dates = await calendarioApi.listarFeriados(year);
      setHolidaysByYear(prev => ({ ...prev, [year]: new Set(dates) }));
    } catch (error) {
      console.error('Erro ao carregar feriados:', error);
    }
  };

  // Helper function to check if a date is a holiday
  const isHoliday = (date: Date): boolean => {
    const set = holidaysByYear[date.getFullYear()];
    if (!set) return false;
    const key = date.toISOString().split('T')[0];
    return set.has(key);
  };

  useEffect(() => {
    if (quickDialogOpen) {
      loadHolidays(quickYear);
    }
  }, [quickDialogOpen, quickYear, quickMonth]);

  // Helper function to check if a date has available slots
  const hasAvailableSlotsForDate = (date: Date): boolean => {
    return getAvailableSlotsForDate(date).length > 0;
  };

  const handleConfirmQuickAppointment = () => {
    if (!quickTime) {
      toast.error('Selecione um horário disponível');
      return;
    }
    setQuickDialogOpen(false);
    onCreateAppointment(new Date(quickDate), quickTime);
  };

  return (
    <div>
      {/* Header - Outside Card */}
      <div className="mb-4 flex flex-col gap-1">
        <div className="mb-1">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-100">Agenda Semanal</h2>
        </div>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
          Clique numa célula vazia para iniciar uma marcação
        </p>
      </div>

      {/* Navigation - Outside Card */}
      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateWeek('prev')}
          className={`h-8 w-8 rounded transition-colors ${isDarkMode ? 'bg-gray-800/10 text-gray-400 hover:bg-gray-800/60 hover:text-gray-200' : 'bg-white text-gray-700 hover:bg-white/90'}`}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Button>

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={`gap-2 h-8 px-3 text-sm rounded transition-opacity ${isDarkMode ? 'bg-gray-800/40 text-gray-200 hover:bg-gray-800/70' : 'bg-white text-gray-700 hover:bg-white/90'}`}
            >
              <CalendarIcon className="w-4 h-4" />
              {getWeekLabel()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <CalendarComponent
              mode="single"
              selected={validCurrentDate}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateWeek('next')}
          className={`h-8 w-8 rounded transition-colors ${isDarkMode ? 'bg-gray-800/10 text-gray-400 hover:bg-gray-800/60 hover:text-gray-200' : 'bg-white text-gray-700 hover:bg-white/90'}`}
        >
          <ChevronRightIcon className="w-4 h-4" />
        </Button>
        {!isClient && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onBlockSchedule}
              className={`px-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800`}
            >
              Bloquear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDialogToggle(true)}
              className={`px-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800`}
            >
              Nova marcação
            </Button>
          </div>
        )}
      </div>

      <GlassCard className="p-4">

        {/* Schedule Grid */}
        <div className="w-full">
          {/* CORREÇÃO 1: Scrollbar para os dias/horários: max-height e overflow-y-auto */}
          {/* Header Row - Static outside scroll */}
          <div
            className={`grid grid-cols-6 gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pr-4`}
            style={{ gridTemplateColumns: '80px repeat(5, minmax(0, 1fr))' }}
          >
            <div className={`p-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Hora</div>
            {weekDays.map((day, index) => (
              <div key={index} className="text-center">
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {isMobile ? WEEKDAYS_MOBILE[index] : isTablet ? WEEKDAYS_MEDIUM[index] : WEEKDAYS_SHORT[index]}
                </div>
                <div className={`mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{day.getDate()}</div>
              </div>
            ))}
          </div>

          {/* Time Slots - Scrollable */}
          <div className="overflow-y-auto pr-2" style={{ maxHeight: '540px' }}>

            {/* Time Slots */}
            <div className="space-y-0.5 pb-2">
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="grid grid-cols-6 gap-2"
                  style={{ gridTemplateColumns: '80px repeat(5, minmax(0, 1fr))' }}
                >
                  <div className={`p-1 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} flex items-center`}>
                    {time}
                  </div>
                  {weekDays.map((day, idx) => {
                    const booked = isSlotBooked(day, time);
                    const inPast = isSlotInPast(day, time);
                    const appointment = getAppointmentForSlot(day, time);
                    // Verificar se é marcação própria: tem NIF preenchido E corresponde ao utente
                    // OU está no array appointments (que contém apenas marcações do utente)
                    const isOwn = appointment && (
                      (appointment.patientNIF && currentUserNif && String(appointment.patientNIF) === String(currentUserNif)) ||
                      appointments.some(a => a.id === appointment.id)
                    );

                    const isBlockedAdmin = isSlotBlockedSync(day, time);
                    const isHolidayDay = isHoliday(day);
                    // Clientes só podem clicar nas suas próprias marcações
                    // Admin bloqueado também conta como blocked
                    const blocked = (booked && isClient && !isOwn) || isBlockedAdmin;

                    const base = `p-1.5 min-h-[40px] rounded border transition-all text-xs`;
                    const available = isDarkMode
                      ? 'border-gray-800 hover:bg-gray-800/50 hover:border-purple-600 cursor-pointer'
                      : 'border-gray-200 hover:bg-gray-50 hover:border-purple-600 cursor-pointer';
                    const pastSlot = isDarkMode
                      ? 'border-gray-800 bg-gray-900/50 text-gray-600 cursor-not-allowed'
                      : 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed';
                    const holidaySlot = isDarkMode
                      ? 'border-gray-800 bg-gray-900/60 text-gray-500 cursor-not-allowed'
                      : 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed';

                    // Estilos: verde para marcações próprias, cinzento para marcações de outros (quando cliente)
                    // Helper function to get status-based styles
                    const getStatusStyle = (status: string | undefined, isInteractive: boolean): string => {
                      const statusStyles: Record<string, string> = {
                        'completed': isInteractive
                          ? 'bg-green-600 text-white border-green-700 hover:bg-green-700'
                          : 'bg-green-600 text-white border-green-700',
                        'cancelled': isInteractive
                          ? 'bg-red-600 text-white border-red-700 hover:bg-red-700'
                          : 'bg-red-600 text-white border-red-700',
                        'in-progress': isInteractive
                          ? 'bg-purple-600 text-white border-purple-700 hover:bg-purple-700'
                          : 'bg-purple-600 text-white border-purple-700',
                        'warning': isInteractive
                          ? 'bg-yellow-600 text-white border-yellow-700 hover:bg-yellow-700'
                          : 'bg-yellow-600 text-white border-yellow-700',
                        'no-show': 'bg-[#f97316] text-white border-[#ea580c] cursor-not-allowed',
                      };
                      const defaultStyle = isInteractive
                        ? 'bg-pink-600 text-white border-pink-700 hover:bg-pink-700'
                        : 'bg-pink-600 text-white border-pink-700';
                      return statusStyles[status || ''] || defaultStyle;
                    };

                    // Determine appointment styles based on state
                    let appointmentStyles: string;
                    if (appointment?.status === 'reserved') {
                      appointmentStyles = isDarkMode
                        ? 'bg-gray-600/50 text-gray-300 border-gray-600 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed';
                    } else if (blocked) {
                      appointmentStyles = isDarkMode
                        ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed'
                        : 'bg-gray-300 text-gray-600 border-gray-400 cursor-not-allowed';
                    } else {
                      const isInteractive = !!(isClient && isOwn);
                      appointmentStyles = getStatusStyle(appointment?.status, isInteractive);
                    }

                    // Compute tooltip title in a separate statement to avoid nested ternary
                    const getSlotTooltip = (): string => {
                      if (!appointment) {
                        if (isHolidayDay) return 'Feriado';
                        return inPast ? 'Horário no passado' : 'Clique para marcar';
                      }
                      if (appointment.status === 'reserved') {
                        return 'Slot reservado - clique para atualizar';
                      }
                      if (blocked) {
                        return 'Horário ocupado - clique para atualizar';
                      }
                      if (isClient && isOwn) {
                        return 'Sua marcação - clique para ver detalhes';
                      }
                      if (inPast) {
                        return 'Marcação histórica - clique para ver detalhes';
                      }
                      return 'Clique para ver detalhes';
                    };

                    // Gerar ID estável para este slot
                    const slotId = getSlotId(day, time);
                    const isActiveHighlight = activeHighlight === slotId;

                    return (
                      <button
                        key={idx}
                        id={slotId}
                        onClick={() => handleSlotClick(day, time)}
                        disabled={(inPast && !appointment) || (isHolidayDay && !appointment)}
                        style={appointment?.status === 'no-show' ? { backgroundColor: '#f97316', borderColor: '#ea580c', color: 'white' } : {}}
                        title={getSlotTooltip()}
                        className={`${base} ${inPast && !appointment
                          ? pastSlot
                          : isHolidayDay && !appointment
                            ? holidaySlot
                          : booked
                            ? appointmentStyles
                            : available
                          } ${isActiveHighlight ? 'slot-highlight' : ''}`}
                      >
                        {(() => {
                          // Render blocked status (Administrative)
                          if (isBlockedAdmin) {
                            // Se estiver no passado, não mostrar "Indisponível", apenas estilo desativado (retornar null deixa cair no default)
                            if (inPast) return null;

                            return (
                              <div className="flex items-center justify-center text-center font-medium text-xs text-red-500 bg-red-50 dark:bg-red-900/10 dark:text-red-400 w-full h-full rounded border border-red-200 dark:border-red-800">
                                <ClockIcon className={`w-3 h-3 ${!isMobile ? 'mr-1' : ''}`} />
                                {!isMobile && 'Indisponível'}
                              </div>
                            );
                          }

                          // Render reserved status
                          if (appointment?.status === 'reserved') {
                            return (
                              <div className="flex items-center justify-center w-full h-full">
                                <span className="text-[10px] font-medium truncate leading-none px-0.5">
                                  Reservado
                                </span>
                              </div>
                            );
                          }

                          // Render appointment details if not blocked
                          if (appointment && !blocked) {
                            const displayText = appointment.status === 'no-show'
                              ? 'Faltou'
                              : (isClient && isOwn ? 'Sua marcação' : appointment.patientName);

                            return (
                              <div className="flex items-center gap-1 text-left truncate font-semibold text-sm leading-tight">
                                <UserIcon className="w-3.5 h-3.5 text-white" />
                                <span className="truncate">{displayText}</span>
                              </div>
                            );
                          }

                          return null;
                        })()}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
      <div className="flex justify-end mt-4">
        <Button variant="outline" onClick={handleExportClick} className="gap-2 h-9 text-sm bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800">
          <DownloadIcon className="w-4 h-4" />
          Exportar Agenda
        </Button>
      </div>

      {/* Dialog de seleção de formato de exportação */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-md w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Exportar Agenda</DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Escolha o formato de exportação da agenda semanal
            </p>
          </DialogHeader>
          <div className="grid gap-3 mt-4">
            <Button
              variant="outline"
              className="flex items-center justify-start gap-4 h-16 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={handleExportCSV}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30">
                <FileTextIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <div className="font-medium">CSV</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Formato de texto compatível com Excel e outras aplicações</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-start gap-4 h-16 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={handleExportExcel}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium">Excel</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Ficheiro formatado para Microsoft Excel</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-start gap-4 h-16 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={handleExportPDF}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium">PDF</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Documento para impressão ou visualização</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-start gap-4 h-16 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={handleExportICS}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium">iCalendar - Apenas marcações agendadas (.ics)</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Google Calendar, Outlook</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={quickDialogOpen} onOpenChange={handleQuickDialogToggle}>
        {/* CORREÇÃO 3: DialogContent como card */}
        <DialogContent className="max-w-5xl w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Criar nova marcação</DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Escolha rapidamente um dia específico e um horário disponível
            </p>
          </DialogHeader>
          <div className="space-y-4">
            {/* CORREÇÃO 3: items-end garante alinhamento do botão com os campos */}
            {/* Forçar wrap em todos os breakpoints para evitar que o botão ultrapasse o card */}
            <div className="flex items-end gap-4 flex-wrap">

              {/* Campo Ano (Select/Dropdown) */}
              <div className="flex flex-col gap-1 flex-1 min-w-[110px]">
                <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Ano</Label>
                <Select
                  value={String(quickYear)}
                  onValueChange={(value) => setQuickYear(Number(value))}
                >
                  <SelectTrigger className="min-w-[120px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={selectMenuClassName} style={selectMenuStyle}>
                    {quickYearOptions.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Campo Mês */}
              <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Mês</Label>
                <Select
                  value={String(quickMonth)}
                  onValueChange={(value) => setQuickMonth(Number(value))}
                >
                  <SelectTrigger className="min-w-[160px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={selectMenuClassName} style={selectMenuStyle}>
                    {Array.from({ length: 12 }).map((_, index) => {
                      const monthDate = new Date(quickYear, index, 1);
                      return (
                        <SelectItem key={index} value={String(index)}>
                          {monthDate.toLocaleDateString('pt-PT', { month: 'long' })}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Campo Dia (Com Scrollbar) - Apenas dias de semana */}
              <div className="flex flex-col gap-1 flex-1 min-w-[110px]">
                <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Dia</Label>
                <Select
                  value={String(quickDay)}
                  onValueChange={(value) => setQuickDay(Number(value))}
                >
                  <SelectTrigger className="min-w-[120px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  {/* CORREÇÃO 2: Scrollbar para os dias - APENAS DIAS DE SEMANA */}
                  <SelectContent className={selectMenuClassName} style={selectMenuStyle}>
                    {Array.from({ length: getDaysInMonth(quickYear, quickMonth) }).map((_, index) => {
                      const day = index + 1;
                      const testDate = new Date(quickYear, quickMonth, day);
                      const dayOfWeek = testDate.getDay();
                      const isPastDay = testDate < today;

                      // Filtrar apenas dias de semana (1=segunda, 5=sexta)
                      if (dayOfWeek === 0 || dayOfWeek === 6) return null;
                      if (isHoliday(testDate)) return null;
                      if (isPastDay) return null;
                      if (!hasAvailableSlotsForDate(testDate)) return null;

                      return (
                        <SelectItem key={day} value={String(day)}>
                          {day.toString().padStart(2, '0')}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Campo Horário (Com Scrollbar) */}
              <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
                <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Horário</Label>
                <Select
                  value={quickTime}
                  onValueChange={setQuickTime}
                  disabled={!quickSlots.length}
                >
                  <SelectTrigger className="min-w-[160px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-10">
                    <SelectValue placeholder="Sem horários disponíveis" />
                  </SelectTrigger>
                  {/* CORREÇÃO 2: Scrollbar para os horários */}
                  <SelectContent className={selectMenuClassName} style={selectMenuStyle}>
                    {quickSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>

            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white h-12 px-8 text-base rounded-lg w-full"
              onClick={handleConfirmQuickAppointment}
              disabled={!quickTime}
            >
              Escolher
            </Button>

            {!quickSlots.length && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Não existem horários disponíveis para esta data.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}
