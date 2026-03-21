import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { GlassCard } from '../ui/glass-card';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, CalendarIcon, ClockIcon, FileTextIcon } from '../shared/CustomIcons';
import { Appointment } from '../../types';
import { calendarioApi, BloqueioAgenda, bloqueiosApi } from '../../services/api';
import { useIsMobile } from '../ui/use-mobile';
// Helper: Plus icon for add button
function PlusIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" fill="none" viewBox="0 0 16 16"><path stroke="currentColor" strokeWidth="2" d="M8 3v10M3 8h10"/></svg>
  );
}
import { useTranslation } from 'react-i18next';

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
  isLoading?: boolean;
  appointmentType?: 'SECRETARIA' | 'BALNEARIO';
}

interface SlotNavigatorState {
  date: Date;
  time: string;
  slots: Array<Appointment | null>;
}



// Custom slot generator for BALNEARIO
const generateBalnearioTimeSlots = () => {
  const slots: string[] = [];
  // 9:00 to 10:00 (9:00, 9:30, 10:00)
  for (let t = 9 * 60; t <= 10 * 60; t += 30) {
    const hour = Math.floor(t / 60);
    const minute = t % 60;
    slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
  }
  // 11:00 and 11:30
  slots.push('11:00');
  slots.push('11:30');
  // 14:00 to 16:30 (14:00, 14:30, 15:00, 15:30, 16:00, 16:30)
  for (let t = 14 * 60; t <= 16 * 60 + 30; t += 30) {
    slots.push(`${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`);
  }
  return slots;
};

// Modular slot generator: intervalMinutes (default 15)
const generateTimeSlots = (intervalMinutes: number = 15, appointmentType?: string) => {
  if (appointmentType === 'BALNEARIO') {
    return generateBalnearioTimeSlots();
  }
  const slots = [];
  for (let hour = 9; hour < 17; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      // For 16:00, only allow up to 16:45 for 15min, or 16:30 for 30min
      if (hour === 16 && ((intervalMinutes === 15 && minute > 45) || (intervalMinutes === 30 && minute > 30))) break;
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return slots;
};

export function WeeklySchedule({ appointments, allAppointments, currentUserNif, isClient, onCreateAppointment, onViewAppointment, isDarkMode, onRefresh, onBlockSchedule, refreshTrigger, highlightedSlot, currentDate, onDateChange, appointmentType = 'SECRETARIA' }: Readonly<WeeklyScheduleProps>) {
    // Expanded slots state for mobile/tap (must be at top level)
    const [expandedSlots, setExpandedSlots] = useState<{ [key: string]: boolean }>({});
    const isMobile = useIsMobile();

    // Helper to expand/collapse slot on mobile
    const handleExpandSlot = (id: string) => {
      setExpandedSlots(prev => ({ ...prev, [id]: !prev[id] }));
    };
  const { i18n } = useTranslation();

  // Helper function to get status-based styles (must be outside JSX)
  const getStatusStyle = (status: string | undefined, isInteractive: boolean): string => {
    const normalizedStatus = (status || '').toLowerCase();
    const statusStyles: Record<string, string> = {
      'completed': isInteractive
        ? 'border-l-4 border-emerald-600 bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200 dark:border-emerald-400 dark:bg-emerald-800/45 dark:text-emerald-100 dark:border-emerald-700 dark:hover:bg-emerald-800/55'
        : 'border-l-4 border-emerald-600 bg-emerald-100 text-emerald-900 border-emerald-300 dark:border-emerald-400 dark:bg-emerald-800/45 dark:text-emerald-100 dark:border-emerald-700',
      'concluded': isInteractive
        ? 'border-l-4 border-emerald-600 bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200 dark:border-emerald-400 dark:bg-emerald-800/45 dark:text-emerald-100 dark:border-emerald-700 dark:hover:bg-emerald-800/55'
        : 'border-l-4 border-emerald-600 bg-emerald-100 text-emerald-900 border-emerald-300 dark:border-emerald-400 dark:bg-emerald-800/45 dark:text-emerald-100 dark:border-emerald-700',
      'done': isInteractive
        ? 'border-l-4 border-emerald-600 bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200 dark:border-emerald-400 dark:bg-emerald-800/45 dark:text-emerald-100 dark:border-emerald-700 dark:hover:bg-emerald-800/55'
        : 'border-l-4 border-emerald-600 bg-emerald-100 text-emerald-900 border-emerald-300 dark:border-emerald-400 dark:bg-emerald-800/45 dark:text-emerald-100 dark:border-emerald-700',
      'cancelled': isInteractive
        ? 'border-l-4 border-red-600 bg-red-100 text-red-900 border-red-300 hover:bg-red-200 dark:border-red-400 dark:bg-red-900/40 dark:text-red-100 dark:border-red-700 dark:hover:bg-red-900/50'
        : 'border-l-4 border-red-600 bg-red-100 text-red-900 border-red-300 dark:border-red-400 dark:bg-red-900/40 dark:text-red-100 dark:border-red-700',
      'in-progress': isInteractive
        ? 'border-l-4 border-violet-600 bg-violet-100 text-violet-900 border-violet-300 hover:bg-violet-200 dark:border-violet-400 dark:bg-violet-900/40 dark:text-violet-100 dark:border-violet-700 dark:hover:bg-violet-900/50'
        : 'border-l-4 border-violet-600 bg-violet-100 text-violet-900 border-violet-300 dark:border-violet-400 dark:bg-violet-900/40 dark:text-violet-100 dark:border-violet-700',
      'scheduled': isInteractive
        ? 'border-l-4 border-pink-500 bg-pink-100 text-pink-900 border-pink-300 hover:bg-pink-200 dark:border-pink-400 dark:bg-pink-900/40 dark:text-pink-100 dark:border-pink-700 dark:hover:bg-pink-900/50'
        : 'border-l-4 border-pink-500 bg-pink-100 text-pink-900 border-pink-300 dark:border-pink-400 dark:bg-pink-900/40 dark:text-pink-100 dark:border-pink-700',
      'warning': isInteractive
        ? 'border-l-4 border-amber-600 bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 dark:border-amber-400 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/50'
        : 'border-l-4 border-amber-600 bg-amber-100 text-amber-900 border-amber-300 dark:border-amber-400 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-700',
      'no-show': 'border-l-4 border-amber-600 bg-amber-100 text-amber-900 border-amber-300 cursor-not-allowed dark:border-amber-400 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-700',
    };
    const defaultStyle = isInteractive
      ? 'border-l-4 border-pink-500 bg-pink-100 text-pink-900 border-pink-300 hover:bg-pink-200 dark:border-pink-400 dark:bg-pink-900/40 dark:text-pink-100 dark:border-pink-700 dark:hover:bg-pink-900/50'
      : 'border-l-4 border-pink-500 bg-pink-100 text-pink-900 border-pink-300 dark:border-pink-400 dark:bg-pink-900/40 dark:text-pink-100 dark:border-pink-700';
    return statusStyles[normalizedStatus] || defaultStyle;
  };

  // Helper for mini-cells: only background/text color, no border-l-4
  const getMiniCellStatusStyle = (status: string | undefined, isInteractive: boolean): string => {
    const normalizedStatus = (status || '').toLowerCase();
    const statusStyles: Record<string, string> = {
      'completed': isInteractive
        ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-800/45 dark:text-emerald-100 dark:hover:bg-emerald-800/55'
        : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-800/45 dark:text-emerald-100',
      'concluded': isInteractive
        ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-800/45 dark:text-emerald-100 dark:hover:bg-emerald-800/55'
        : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-800/45 dark:text-emerald-100',
      'done': isInteractive
        ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-800/45 dark:text-emerald-100 dark:hover:bg-emerald-800/55'
        : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-800/45 dark:text-emerald-100',
      'cancelled': isInteractive
        ? 'bg-red-100 text-red-900 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-100 dark:hover:bg-red-900/50'
        : 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100',
      'in-progress': isInteractive
        ? 'bg-violet-100 text-violet-900 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-100 dark:hover:bg-violet-900/50'
        : 'bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-100',
      'scheduled': isInteractive
        ? 'bg-pink-100 text-pink-900 hover:bg-pink-200 dark:bg-pink-900/40 dark:text-pink-100 dark:hover:bg-pink-900/50'
        : 'bg-pink-100 text-pink-900 dark:bg-pink-900/40 dark:text-pink-100',
      'warning': isInteractive
        ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-100 dark:hover:bg-amber-900/50'
        : 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100',
      'no-show': 'bg-amber-100 text-amber-900 cursor-not-allowed dark:bg-amber-900/40 dark:text-amber-100',
    };
    const defaultStyle = isInteractive
      ? 'bg-pink-100 text-pink-900 hover:bg-pink-200 dark:bg-pink-900/40 dark:text-pink-100 dark:hover:bg-pink-900/50'
      : 'bg-pink-100 text-pink-900 dark:bg-pink-900/40 dark:text-pink-100';
    return statusStyles[normalizedStatus] || defaultStyle;
  };
  const tt = (pt: string, en: string) => (i18n.language.startsWith('en') ? en : pt);
  const currentLocale = i18n.language.startsWith('en') ? 'en-GB' : 'pt-PT';
  const weekdaysShort = i18n.language.startsWith('en') ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] : ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  const weekdaysMedium = i18n.language.startsWith('en') ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] : ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
  const weekdaysMobile = i18n.language.startsWith('en') ? ['M', 'T', 'W', 'T', 'F'] : ['S', 'T', 'Q', 'Q', 'S'];
  const [isTablet, setIsTablet] = useState(false);
  // const [currentDate, setCurrentDate] = useState(new Date()); // State lifted to parent
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [quickDialogOpen, setQuickDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Campo Ano como Select
    // Estado global para hover de slot (expansão inline)
    const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [quickYear, setQuickYear] = useState(today.getFullYear());
  const [quickMonth, setQuickMonth] = useState(today.getMonth());
  const [quickDay, setQuickDay] = useState(today.getDate());
  const [quickDate, setQuickDate] = useState<Date>(today);
  const [quickTime, setQuickTime] = useState('');
  const [quickSlots, setQuickSlots] = useState<string[]>([]);
  const [quickMonthBlocks, setQuickMonthBlocks] = useState<Set<string>>(new Set());
  const [slotCapacity, setSlotCapacity] = useState<number>(1);
  const [slotNavigatorOpen, setSlotNavigatorOpen] = useState(false);
  const [slotNavigator, setSlotNavigator] = useState<SlotNavigatorState | null>(null);
  const [slotNavigatorIndex, setSlotNavigatorIndex] = useState(0);

  // ===== SLIDING WINDOW CACHE: Holidays & Blocks =====
  // Cache de feriados por ano (mantém todos os anos carregados)
  const [holidaysByYear, setHolidaysByYear] = useState<Record<number, Set<string>>>({});

  // Cache de bloqueios por semana (mantém apenas janela deslizante: -2, -1, 0, +1, +2)
  const [blocksByWeek, setBlocksByWeek] = useState<Record<string, Set<string>>>({});

  // Rastreio de semanas em carregamento (para evitar múltiplas chamadas simultâneas)
  const [loadingBlockWeeks, setLoadingBlockWeeks] = useState<Set<string>>(new Set());

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
  // Use custom slots for balneário, 15min otherwise
  const slotInterval = appointmentType === 'BALNEARIO' ? 30 : 15;
  const timeSlots = generateTimeSlots(slotInterval, appointmentType);
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

  const getSlotAppointments = (date: Date, time: string) => {
    const slotAppointments = bookingSource.filter(apt => {
      const aptDate = new Date(apt.date);
      aptDate.setHours(0, 0, 0, 0);
      const slotDate = new Date(date);
      slotDate.setHours(0, 0, 0, 0);

      return aptDate.getTime() === slotDate.getTime() &&
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

  const isSlotInPast = (date: Date, time: string) => {
    const [hours, minutes] = time.split(':');
    const slotDateTime = new Date(date);
    slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return slotDateTime <= new Date();
  };

  // ===== LEGACY STATE: blockedSlots (unified view from cache) =====
  // Mantido para compatibilidade: agregado de todos os bloqueios das semanas em cache
  const [blockedSlots, setBlockedSlots] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadSlotCapacity = async () => {
      try {
        const configs = await calendarioApi.listarConfiguracaoSlots();
        const config = configs.find(item => item.tipo === appointmentType);
        setSlotCapacity(Math.max(1, config?.capacidadePorSlot ?? 1));
      } catch (error) {
        console.error('Erro ao carregar capacidade por slot:', error);
        setSlotCapacity(1);
      }
    };

    loadSlotCapacity();
  }, [appointmentType]);

  // ===== HELPER FUNCTIONS =====
  // Helper para minutos
  const timeToMinutes = (time: string) => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  // Formatar chave de data (YYYY-MM-DD)
  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Obter semana e chave
  const getWeekRange = (date: Date) => {
    const safeDate = new Date(date);
    if (isNaN(safeDate.getTime())) {
      safeDate.setTime(Date.now());
    }

    const day = safeDate.getDay();
    const diff = safeDate.getDate() - day + (day === 0 ? -6 : 1);

    const startOfWeek = new Date(safeDate);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return {
      startOfWeek,
      endOfWeek,
      key: formatDateKey(startOfWeek),
    };
  };

  // Adicionar dias a uma data
  const addDays = (date: Date, days: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  };

  // ===== SLIDING WINDOW CACHE: Carregar bloqueios por semana =====
  // Carrega bloqueios de uma semana específica e armazena no cache
  const loadWeekBlocks = async (date: Date, force = false) => {
    const { startOfWeek, endOfWeek, key } = getWeekRange(date);

    // Se já está em cache ou em carregamento, skip
    if (!force && (blocksByWeek[key] || loadingBlockWeeks.has(key))) {
      console.log('[DEBUG] loadWeekBlocks skip (cached or loading):', { key });
      return;
    }

    console.log('[DEBUG] loadWeekBlocks start:', { key, start: startOfWeek, end: endOfWeek });
    setLoadingBlockWeeks(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    try {
      // Buscar bloqueios da semana
      const blocks = await bloqueiosApi.listar(appointmentType);

      const weekBlockedSlots = new Set<string>();

      blocks.forEach(block => {
        const date = new Date(block.data);
        if (isNaN(date.getTime())) return;

        // Apenas bloqueios dentro da janela da semana
        if (date < startOfWeek || date > endOfWeek) return;

        const dateStr = date.toISOString().split('T')[0];
        const startMins = timeToMinutes(block.horaInicio);
        const endMins = timeToMinutes(block.horaFim);

        timeSlots.forEach(slot => {
          const slotMins = timeToMinutes(slot);
          if (slotMins >= startMins && slotMins < endMins) {
            weekBlockedSlots.add(`${dateStr}_${slot}`);
          }
        });
      });

      // Armazenar no cache
      setBlocksByWeek(prev => ({
        ...prev,
        [key]: weekBlockedSlots,
      }));

      console.log('[DEBUG] loadWeekBlocks done:', { key, count: weekBlockedSlots.size });
    } catch (error) {
      console.error('[ERROR] loadWeekBlocks:', error);
    } finally {
      setLoadingBlockWeeks(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  // ===== SLIDING WINDOW: Atualizar janela de bloqueios (2 semanas antes/depois) =====
  useEffect(() => {
    console.log('[DEBUG] blocks sliding window update triggered:', { currentDate });

    // Calcular chaves das 5 semanas (2 antes, atual, 2 depois)
    const currentWeek = currentDate;
    const prevWeek1 = addDays(currentDate, -7);
    const prevWeek2 = addDays(currentDate, -14);
    const nextWeek1 = addDays(currentDate, 7);
    const nextWeek2 = addDays(currentDate, 14);

    const { key: currentKey } = getWeekRange(currentWeek);
    const { key: prevKey1 } = getWeekRange(prevWeek1);
    const { key: prevKey2 } = getWeekRange(prevWeek2);
    const { key: nextKey1 } = getWeekRange(nextWeek1);
    const { key: nextKey2 } = getWeekRange(nextWeek2);

    console.log('[DEBUG] blocks window keys:', {
      prevKey2,
      prevKey1,
      currentKey,
      nextKey1,
      nextKey2,
    });

    // Podar cache: manter apenas as 5 semanas da janela
    setBlocksByWeek(prev => {
      const nextCache: Record<string, Set<string>> = {};
      if (prev[prevKey2]) nextCache[prevKey2] = prev[prevKey2];
      if (prev[prevKey1]) nextCache[prevKey1] = prev[prevKey1];
      if (prev[currentKey]) nextCache[currentKey] = prev[currentKey];
      if (prev[nextKey1]) nextCache[nextKey1] = prev[nextKey1];
      if (prev[nextKey2]) nextCache[nextKey2] = prev[nextKey2];
      return nextCache;
    });

    // Carregar as 5 semanas (em paralelo, mas cada função verifica cache)
    loadWeekBlocks(prevWeek2);
    loadWeekBlocks(prevWeek1);
    loadWeekBlocks(currentWeek);
    loadWeekBlocks(nextWeek1);
    loadWeekBlocks(nextWeek2);
  }, [currentDate, onRefresh]);

  // Forçar reload de bloqueios quando houver alteração explícita (add/remove bloqueio)
  useEffect(() => {
    if (refreshTrigger === undefined) return;

    console.log('[DEBUG] force reload blocks by refreshTrigger:', { refreshTrigger });

    const currentWeek = currentDate;
    const prevWeek1 = addDays(currentDate, -7);
    const prevWeek2 = addDays(currentDate, -14);
    const nextWeek1 = addDays(currentDate, 7);
    const nextWeek2 = addDays(currentDate, 14);

    loadWeekBlocks(prevWeek2, true);
    loadWeekBlocks(prevWeek1, true);
    loadWeekBlocks(currentWeek, true);
    loadWeekBlocks(nextWeek1, true);
    loadWeekBlocks(nextWeek2, true);
  }, [refreshTrigger, currentDate]);

  // ===== AGREGADO: Combinar todos os bloqueios em cache numa única Set =====
  // (Para compatibilidade com código existente que usa blockedSlots)
  useEffect(() => {
    const allBlocks = new Set<string>();
    Object.values(blocksByWeek).forEach(weekSet => {
      weekSet.forEach(slot => allBlocks.add(slot));
    });
    setBlockedSlots(allBlocks);
    console.log('[DEBUG] blockedSlots aggregated:', { total: allBlocks.size });
  }, [blocksByWeek]);

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
      return await calendarioApi.verificarSlot(dateStr, time, appointmentType);
    } catch (e) { return false; }
  };

  const getAvailableSlotsForDate = (date: Date) =>
    timeSlots.filter((slot) => {
      const dateStr = date.toISOString().split('T')[0];
      const key = `${dateStr}_${slot}`;
      // Verificar tanto os bloqueios da semana quanto do mês do quick dialog
      const isBlockedInWeek = blockedSlots.has(key);
      const isBlockedInQuick = quickMonthBlocks.has(key);
      return getSlotAppointments(date, slot).length < slotCapacity && !isSlotInPast(date, slot) && !isBlockedInWeek && !isBlockedInQuick;
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

  const getAppointmentForSlot = (date: Date, time: string) => getSlotAppointments(date, time)[0];

  const openSlotNavigator = (date: Date, time: string) => {
    const slotAppointments = getSlotAppointments(date, time);
    const slots = Array.from({ length: slotCapacity }, (_, index) => slotAppointments[index] ?? null);
    setSlotNavigator({ date, time, slots });
    setSlotNavigatorIndex(0);
    setSlotNavigatorOpen(true);
  };

  const handleSlotNavigatorAction = async () => {
    if (!slotNavigator) return;

    const selected = slotNavigator.slots[slotNavigatorIndex];
    if (selected) {
      if (selected.status === 'reserved') {
        if (onRefresh) {
          toast.info(tt('A atualizar marcações...', 'Updating appointments...'));
          await onRefresh();
          toast.success(tt('Marcações atualizadas!', 'Appointments updated!'));
        }
        return;
      }

      setSlotNavigatorOpen(false);
      onViewAppointment(selected);
      return;
    }

    if (isSlotInPast(slotNavigator.date, slotNavigator.time)) {
      toast.error(tt('Não é possível marcar para uma data/hora no passado', 'It is not possible to book a past date/time'));
      return;
    }

    const blocked = await isSlotBlocked(slotNavigator.date, slotNavigator.time);
    if (blocked) {
      toast.error(tt('Horário indisponível', 'Time slot unavailable'));
      if (onRefresh) {
        onRefresh();
      }
      return;
    }

    setSlotNavigatorOpen(false);
    onCreateAppointment(slotNavigator.date, slotNavigator.time);
  };

  const handleSlotClick = async (date: Date, time: string) => {
    const slotAppointments = getSlotAppointments(date, time);

    // Com capacidade > 1, só abrir navegador quando já houver marcações ativas no slot.
    // Se estiver vazio (inclui casos em que todas foram canceladas), criar diretamente.
    if (!isClient && slotCapacity > 1 && slotAppointments.length > 0) {
      openSlotNavigator(date, time);
      return;
    }

    const appointment = getAppointmentForSlot(date, time);
    const slotIsFull = slotAppointments.length >= slotCapacity;

    // Se o slot ainda não estiver cheio, permitir criar nova marcação
    // mesmo quando já existem marcações nesse horário.
    if (!isClient && slotAppointments.length > 0 && !slotIsFull) {
      if (isSlotInPast(date, time)) {
        toast.error(tt('Não é possível marcar para uma data/hora no passado', 'It is not possible to book a past date/time'));
        return;
      }

      const blocked = await isSlotBlocked(date, time);
      if (blocked) {
        toast.error(tt('Horário indisponível', 'Time slot unavailable'));
        if (onRefresh) {
          onRefresh();
        }
        return;
      }

      onCreateAppointment(date, time);
      return;
    }

    // Se já existe marcação, permitir visualizar (mesmo no passado)
    if (appointment) {
      // Verificar se é marcação própria
      const isOwn = slotAppointments.some(item =>
        (item.patientNIF && currentUserNif && String(item.patientNIF) === String(currentUserNif)) ||
        appointments.some(a => a.id === item.id)
      );

      // Se for slot reservado ou bloqueado, recarregar marcações
      if (appointment.status === 'reserved' || (isClient && !isOwn)) {
        if (onRefresh) {
          toast.info(tt('A atualizar marcações...', 'Updating appointments...'));
          await onRefresh();
          toast.success(tt('Marcações atualizadas!', 'Appointments updated!'));
        }
        return;
      }
      onViewAppointment(appointment);
      return;
    }

    // Validar se o horário não é no passado APENAS para criar nova marcação
    if (isSlotInPast(date, time)) {
      toast.error(tt('Não é possível marcar para uma data/hora no passado', 'It is not possible to book a past date/time'));
      return;
    }

    // Verificar se o slot está bloqueado (fim de semana, feriado, etc)
    // Se isSlotBlocked retornar true, significa que o backend detectou algo (bloqueio ou marcação existente)
    // Nesse caso, devemos forçar um refresh visual para o utilizador ver o novo estado
    const blocked = await isSlotBlocked(date, time);
    if (blocked) {
      toast.error(tt('Horário indisponível', 'Time slot unavailable'));
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
    const month = firstDay.toLocaleDateString(currentLocale, { month: 'long' });
    if (i18n.language.startsWith('en')) {
      return `${month} ${firstDay.getDate()}`;
    }
    return `${firstDay.getDate()} ${tt('de', 'of')} ${month}`;
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

  // Map status labels by language
  const statusLabels: Record<string, string> = {
    'scheduled': tt('Agendado', 'Scheduled'),
    'in-progress': tt('Em Curso', 'In progress'),
    'warning': tt('Aviso', 'Warning'),
    'completed': tt('Concluído', 'Completed'),
    'cancelled': tt('Cancelado', 'Cancelled'),
    'no-show': tt('Faltou', 'No-show')
  };

  // Gerar nome do arquivo
  const getFileName = (extension: string) => {
    const firstDay = weekDays[0];
    const lastDay = weekDays[weekDays.length - 1];
    return `agenda_${firstDay.toLocaleDateString(currentLocale).replace(/\//g, '-')}_${tt('a', 'to')}_${lastDay.toLocaleDateString(currentLocale).replace(/\//g, '-')}.${extension}`;
  };

  // Exportar como CSV
  const handleExportCSV = () => {
    const sortedAppointments = getWeekAppointments();

    if (sortedAppointments.length === 0) {
      toast.warning(tt('Não existem marcações para exportar nesta semana', 'There are no appointments to export this week'));
      return;
    }

    const headers = i18n.language.startsWith('en')
      ? ['Date', 'Time', 'Patient name', 'NIF', 'Contact', 'Email', 'Subject', 'Status']
      : ['Data', 'Hora', 'Nome do Utente', 'NIF', 'Contacto', 'Email', 'Assunto', 'Estado'];
    const csvContent = [
      headers.join(';'),
      ...sortedAppointments.map(apt => {
        const date = new Date(apt.date);
        const formattedDate = date.toLocaleDateString(currentLocale);
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
    toast.success(tt('Agenda exportada em CSV com sucesso', 'Schedule exported to CSV successfully'));
  };

  // Exportar como Excel (usando formato XML do Excel)
  const handleExportExcel = () => {
    const sortedAppointments = getWeekAppointments();

    if (sortedAppointments.length === 0) {
      toast.warning(tt('Não existem marcações para exportar nesta semana', 'There are no appointments to export this week'));
      return;
    }

    const headers = i18n.language.startsWith('en')
      ? ['Date', 'Time', 'Patient name', 'NIF', 'Contact', 'Email', 'Subject', 'Status']
      : ['Data', 'Hora', 'Nome do Utente', 'NIF', 'Contacto', 'Email', 'Assunto', 'Estado'];

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
      const formattedDate = date.toLocaleDateString(currentLocale);
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
    toast.success(tt('Agenda exportada em Excel com sucesso', 'Schedule exported to Excel successfully'));
  };

  // Exportar como PDF
  const handleExportPDF = () => {
    const sortedAppointments = getWeekAppointments();

    if (sortedAppointments.length === 0) {
      toast.warning(tt('Não existem marcações para exportar nesta semana', 'There are no appointments to export this week'));
      return;
    }

    const headers = i18n.language.startsWith('en')
      ? ['Date', 'Time', 'Patient name', 'NIF', 'Contact', 'Email', 'Subject', 'Status']
      : ['Data', 'Hora', 'Nome do Utente', 'NIF', 'Contacto', 'Email', 'Assunto', 'Estado'];
    const firstDay = weekDays[0];
    const lastDay = weekDays[weekDays.length - 1];
    const periodLabel = `${firstDay.toLocaleDateString(currentLocale)} ${tt('a', 'to')} ${lastDay.toLocaleDateString(currentLocale)}`;

    // Criar HTML para impressão como PDF
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${tt('Agenda Semanal', 'Weekly Schedule')} - ${periodLabel}</title>
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
        <h1>${tt('Agenda Semanal', 'Weekly Schedule')}</h1>
        <p class="period">${periodLabel}</p>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
    `;

    sortedAppointments.forEach(apt => {
      const date = new Date(apt.date);
      const formattedDate = date.toLocaleDateString(currentLocale);
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
        <p class="footer">${tt('Gerado em', 'Generated on')} ${new Date().toLocaleDateString(currentLocale)} ${tt('às', 'at')} ${new Date().toLocaleTimeString(currentLocale)}</p>
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
    toast.success(tt('A preparar PDF para impressão...', 'Preparing PDF for printing...'));
  };

  // Exportar como ICS (iCalendar) - apenas marcações agendadas
  const handleExportICS = () => {
    const allAppointments = getWeekAppointments();
    // Filtrar apenas marcações com status 'scheduled' (agendadas)
    const scheduledAppointments = allAppointments.filter(apt => apt.status === 'scheduled');

    if (scheduledAppointments.length === 0) {
      toast.warning(tt('Não existem marcações agendadas para exportar nesta semana', 'There are no scheduled appointments to export this week'));
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
      `X-WR-CALNAME:${tt('Agenda Semanal', 'Weekly Schedule')} - ${getWeekLabel()}`,
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
        `DESCRIPTION:${tt('Utente', 'Patient')}: ${apt.patientName}\\nNIF: ${apt.patientNIF || 'N/A'}\\n${tt('Contacto', 'Contact')}: ${apt.patientContact || 'N/A'}\\nEmail: ${apt.patientEmail || 'N/A'}\\n${tt('Estado', 'Status')}: ${status}`,
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
        const booked = getSlotAppointments(testDate, slot).length >= slotCapacity;
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
    toast.warning(tt('Não foram encontrados horários disponíveis nos próximos 30 dias', 'No available slots were found in the next 30 days'));
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
        const bloqueios = await calendarioApi.listarBloqueios(quickYear, quickMonth + 1, appointmentType);
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
  }, [quickDate, appointments, blockedSlots, quickMonthBlocks, slotCapacity]);

  // ===== SLIDING WINDOW CACHE: Carregar feriados por ano =====
  // Carrega feriados de um ano se ainda não estiverem em cache
  const loadHolidays = async (year: number) => {
    if (holidaysByYear[year]) {
      console.log('[DEBUG] loadHolidays skip (cached):', { year });
      return;
    }
    console.log('[DEBUG] loadHolidays start:', { year });
    try {
      const dates = await calendarioApi.listarFeriados(year);
      setHolidaysByYear(prev => ({ ...prev, [year]: new Set(dates) }));
      console.log('[DEBUG] loadHolidays done:', { year, count: dates.length });
    } catch (error) {
      console.error('[ERROR] loadHolidays:', error);
    }
  };

  // Helper function to check if a date is a holiday
  const isHoliday = (date: Date): boolean => {
    const set = holidaysByYear[date.getFullYear()];
    if (!set) return false;
    const key = date.toISOString().split('T')[0];
    return set.has(key);
  };

  // ===== SLIDING WINDOW: Carregar feriados dos anos das 5 semanas =====
  useEffect(() => {
    console.log('[DEBUG] holidays sliding window update triggered:', { currentDate });

    // Calcular anos únicos nas 5 semanas (2 antes, atual, 2 depois)
    const currentWeek = currentDate;
    const prevWeek1 = addDays(currentDate, -7);
    const prevWeek2 = addDays(currentDate, -14);
    const nextWeek1 = addDays(currentDate, 7);
    const nextWeek2 = addDays(currentDate, 14);

    const years = new Set([
      prevWeek2.getFullYear(),
      prevWeek1.getFullYear(),
      currentWeek.getFullYear(),
      nextWeek1.getFullYear(),
      nextWeek2.getFullYear(),
    ]);

    console.log('[DEBUG] holidays window years:', Array.from(years));

    // Carregar feriados de cada ano único
    years.forEach(year => loadHolidays(year));
  }, [currentDate]);

  // ===== QUICK DIALOG: Carregar feriados do ano selecionado =====
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
      toast.error(tt('Selecione um horário disponível', 'Select an available time slot'));
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
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-100">{tt('Agenda Semanal', 'Weekly Schedule')}</h2>
        </div>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
          {tt('Clique numa célula vazia para iniciar uma marcação', 'Click an empty cell to start an appointment')}
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
              {tt('Bloquear', 'Block')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDialogToggle(true)}
              className={`px-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800`}
            >
              {tt('Nova marcação', 'New appointment')}
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
            <div className={`p-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{tt('Hora', 'Time')}</div>
            {weekDays.map((day, index) => (
              <div key={index} className="text-center">
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {isMobile ? weekdaysMobile[index] : isTablet ? weekdaysMedium[index] : weekdaysShort[index]}
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
                    const slotAppointments = getSlotAppointments(day, time);
                    const booked = slotAppointments.length >= slotCapacity;
                    const inPast = isSlotInPast(day, time);
                    const appointment = slotAppointments[0];
                    const isOwn = appointment && (
                      (appointment.patientNIF && currentUserNif && String(appointment.patientNIF) === String(currentUserNif)) ||
                      appointments.some(a => a.id === appointment.id)
                    );
                    const isBlockedAdmin = isSlotBlockedSync(day, time);
                    const isHolidayDay = isHoliday(day);
                    const blocked = ((slotAppointments.length > 0) && isClient && !isOwn) || isBlockedAdmin;
                    const slotId = getSlotId(day, time);
                    const isActiveHighlight = activeHighlight === slotId;
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

                    // Use top-level expandedSlots and isMobile
                    const isExpanded = expandedSlots[slotId];

                    // Helper: render all mini-cells as clickable buttons and add button
                    const renderExpandedSlot = () => {
                      // Only expand to number of appointments + 1 (for '+'), not full slotCapacity
                      const showAddButton = !booked && !inPast && !blocked && slotAppointments.length < slotCapacity;
                      return (
                        <div className="w-full h-full flex flex-col gap-1">
                          {slotAppointments.map((splitAppointment, splitIndex) => {
                            const splitIsOwn =
                              (splitAppointment.patientNIF && currentUserNif && String(splitAppointment.patientNIF) === String(currentUserNif)) ||
                              appointments.some(a => a.id === splitAppointment.id);
                            const displayText = splitAppointment.status === 'no-show'
                              ? 'Faltou'
                              : (isClient && splitIsOwn ? tt('Sua marcação', 'Your appointment') : splitAppointment.patientName);
                            // Get status style for each mini-cell
                            const isInteractive = !!(isClient && splitIsOwn);
                            const miniCellStatusClass = getMiniCellStatusStyle(splitAppointment.status, isInteractive);
                            return (
                              <button
                                key={`${splitAppointment.id}-${splitIndex}`}
                                className={`text-left truncate font-semibold text-[13px] leading-tight px-2 py-1.5 rounded hover:bg-purple-100 dark:hover:bg-purple-900/40 transition ${miniCellStatusClass}`}
                                style={{ minHeight: '38px', height: '38px' }}
                                aria-label={`Marcação ${splitIndex + 1} de ${slotCapacity}: ${displayText}`}
                                onClick={e => {
                                  e.stopPropagation();
                                  onViewAppointment(splitAppointment);
                                }}
                                type="button"
                              >
                                <span className="truncate block">{displayText}</span>
                              </button>
                            );
                          })}
                          {showAddButton && (
                            <button
                              key={`add-${slotAppointments.length}`}
                              className="flex items-center justify-center gap-1 rounded border border-dashed border-purple-400 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-200 py-1.5 px-0 text-base font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition"
                              style={{ minHeight: '38px', height: '38px' }}
                              onClick={e => {
                                e.stopPropagation();
                                onCreateAppointment(day, time);
                              }}
                              aria-label={tt('Criar nova marcação', 'Create new appointment')}
                            >
                              <PlusIcon className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      );
                    };

                    // Single-capacity slot: keep default button
                    if (slotCapacity === 1) {
                      // ...existing code for single slot...
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
                      const getSlotTooltip = (): string => {
                        if (!appointment) {
                          if (isHolidayDay) return tt('Feriado', 'Holiday');
                          return inPast ? tt('Horário no passado', 'Past time slot') : tt('Clique para marcar', 'Click to book');
                        }
                        if (appointment.status === 'reserved') {
                          return tt('Slot reservado - clique para atualizar', 'Reserved slot - click to refresh');
                        }
                        if (blocked) {
                          return tt('Horário ocupado - clique para atualizar', 'Occupied slot - click to refresh');
                        }
                        if (isClient && isOwn) {
                          return tt('Sua marcação', 'Your appointment') + ' - ' + tt('clique para ver detalhes', 'click to view details');
                        }
                        if (inPast) {
                          return tt('Marcação histórica - clique para ver detalhes', 'Past appointment - click to view details');
                        }
                        return tt('Clique para ver detalhes', 'Click to view details');
                      };
                      return (
                        <button
                          key={idx}
                          id={slotId}
                          onClick={() => handleSlotClick(day, time)}
                          disabled={(inPast && !appointment) || (isHolidayDay && !appointment)}
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
                          {/* ...existing single slot rendering... */}
                          {(() => {
                            if (isBlockedAdmin) {
                              if (inPast) return null;
                              return (
                                <div className="flex items-center justify-center text-center font-medium text-xs text-red-500 bg-red-50 dark:bg-red-900/10 dark:text-red-400 w-full h-full rounded border border-red-200 dark:border-red-800">
                                  <ClockIcon className={`w-3 h-3 ${!isMobile ? 'mr-1' : ''}`} />
                                  {!isMobile && tt('Indisponível', 'Unavailable')}
                                </div>
                              );
                            }
                            if (appointment?.status === 'reserved') {
                              return (
                                <div className="flex items-center justify-center w-full h-full">
                                  <span className="text-[10px] font-medium truncate leading-none px-0.5">
                                    {tt('Reservado', 'Reserved')}
                                  </span>
                                </div>
                              );
                            }
                            if (slotAppointments.length > 0 && !blocked) {
                              return (
                                <div className="w-full h-full flex items-center">
                                  <span className="truncate block font-semibold text-[11px] px-1 py-0.5 rounded bg-white/25 dark:bg-black/20">
                                    {slotAppointments[0].patientName}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </button>
                      );
                    }

                    // Multi-capacity slot: expand inline on hover (desktop), tap to expand (mobile)
                    if (slotCapacity > 1 && slotAppointments.length > 0) {
                      if (!isMobile) {
                        // Desktop: expand inline on hover (usando estado global hoveredSlot)
                        const expanded = hoveredSlot === slotId;
                        // Height: number of appointments + 1 (if add button), each 38px + gap
                        return (
                          <div
                            key={idx}
                            id={slotId}
                            className={`${base} ${inPast ? pastSlot : isHolidayDay ? holidaySlot : booked ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20' : available} ${isActiveHighlight ? 'slot-highlight' : ''}`}
                            onMouseEnter={() => setHoveredSlot(slotId)}
                            onMouseLeave={() => setHoveredSlot(null)}
                            style={{ minHeight: expanded ? `${(slotAppointments.length + (!booked && !inPast && !blocked && slotAppointments.length < slotCapacity ? 1 : 0)) * 40 + 12}px` : undefined, zIndex: expanded ? 10 : undefined, position: 'relative' }}
                          >
                            {expanded ? (
                              renderExpandedSlot()
                            ) : (
                              (() => {
                                const total = slotAppointments.length;
                                if (total === 1) {
                                  const apt = slotAppointments[0];
                                  const isInteractive = !!(isClient && ((apt.patientNIF && currentUserNif && String(apt.patientNIF) === String(currentUserNif)) || appointments.some(a => a.id === apt.id)));
                                  const miniCellStatusClass = getMiniCellStatusStyle(apt.status, isInteractive);
                                  return (
                                    <div className="flex flex-col items-stretch w-full h-full gap-1">
                                      <span
                                        className={`truncate block font-semibold text-[13px] px-2 py-1.5 rounded flex-1 min-h-0 h-full flex items-center ${miniCellStatusClass}`}
                                        style={{height: '100%'}}
                                      >
                                        {apt.patientName}
                                      </span>
                                    </div>
                                  );
                                } else if (total === 2) {
                                  return (
                                    <div className="flex flex-col items-stretch w-full h-full gap-1" style={{height: '100%'}}>
                                      {slotAppointments.slice(0, 2).map((apt) => {
                                        const isInteractive = !!(isClient && ((apt.patientNIF && currentUserNif && String(apt.patientNIF) === String(currentUserNif)) || appointments.some(a => a.id === apt.id)));
                                        const miniCellStatusClass = getMiniCellStatusStyle(apt.status, isInteractive);
                                        return (
                                          <span
                                            key={apt.id}
                                            className={`truncate block font-semibold text-[13px] px-2 py-1.5 rounded flex-1 min-h-0 flex items-center ${miniCellStatusClass}`}
                                            style={{height: '50%'}}
                                          >
                                            {apt.patientName}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  );
                                } else if (total > 2) {
                                  return (
                                    <div className="flex flex-col items-stretch w-full h-full gap-1" style={{height: '100%'}}>
                                      {slotAppointments.slice(0, 2).map((apt) => {
                                        const isInteractive = !!(isClient && ((apt.patientNIF && currentUserNif && String(apt.patientNIF) === String(currentUserNif)) || appointments.some(a => a.id === apt.id)));
                                        const miniCellStatusClass = getMiniCellStatusStyle(apt.status, isInteractive);
                                        return (
                                          <span
                                            key={apt.id}
                                            className={`truncate block font-semibold text-[13px] px-2 py-1.5 rounded flex-1 min-h-0 flex items-center ${miniCellStatusClass}`}
                                            style={{height: '33.33%'}}
                                          >
                                            {apt.patientName}
                                          </span>
                                        );
                                      })}
                                      <span
                                        className="text-xs text-gray-400 flex items-center justify-center font-semibold bg-white/10 dark:bg-black/10 rounded flex-1 min-h-0"
                                        style={{height: '33.33%'}}
                                      >
                                        +{slotAppointments.length - 2} {tt('mais', 'more')}
                                      </span>
                                    </div>
                                  );
                                }
                                return null;
                              })()
                            )}
                          </div>
                        );
                      } else {
                        // Mobile: tap to expand/collapse (mantém comportamento anterior)
                        // Only disable if slot is empty and inPast/holiday, not if it has appointments
                        const shouldDisable = (slotAppointments.length === 0) && (inPast || isHolidayDay) || blocked;
                        return (
                          <div key={idx} className="relative">
                            <button
                              id={slotId}
                              className={`${base} ${inPast ? pastSlot : isHolidayDay ? holidaySlot : booked ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20' : available} ${isActiveHighlight ? 'slot-highlight' : ''}`}
                              disabled={shouldDisable}
                              aria-label={tt('Expandir marcações', 'Expand appointments')}
                              onClick={() => handleExpandSlot(slotId)}
                            >
                              <div className="flex flex-col gap-0.5 items-stretch w-full">
                                {slotAppointments.slice(0, 2).map(apt => (
                                  <span key={apt.id} className="truncate block font-semibold text-[11px] px-1 py-0.5 rounded bg-white/25 dark:bg-black/20">{apt.patientName}</span>
                                ))}
                                {slotAppointments.length > 2 && (
                                  <span className="text-xs text-gray-400">+{slotAppointments.length - 2} {tt('mais', 'more')}</span>
                                )}
                              </div>
                            </button>
                            {isExpanded && (
                              <div
                                className="absolute z-10 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-lg p-2 mt-1"
                                style={{ minHeight: `${(slotAppointments.length + ((!booked && !inPast && !blocked && slotAppointments.length < slotCapacity) ? 1 : 0)) * 40 + 12}px` }}
                              >
                                {renderExpandedSlot()}
                              </div>
                            )}
                          </div>
                        );
                      }
                    }
                    // Multi-capacity slot but empty: behave like single slot (no expansion, direct create)
                    if (slotCapacity > 1 && slotAppointments.length === 0) {
                      // Reuse single slot logic for empty multi-capacity slots
                      let appointmentStyles: string;
                      if (isBlockedAdmin) {
                        appointmentStyles = isDarkMode
                          ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed'
                          : 'bg-gray-300 text-gray-600 border-gray-400 cursor-not-allowed';
                      } else {
                        appointmentStyles = available;
                      }
                      const getSlotTooltip = (): string => {
                        if (isHolidayDay) return tt('Feriado', 'Holiday');
                        return inPast ? tt('Horário no passado', 'Past time slot') : tt('Clique para marcar', 'Click to book');
                      };
                      return (
                        <button
                          key={idx}
                          id={slotId}
                          onClick={() => handleSlotClick(day, time)}
                          disabled={inPast || isHolidayDay}
                          title={getSlotTooltip()}
                          className={`${base} ${inPast ? pastSlot : isHolidayDay ? holidaySlot : appointmentStyles} ${isActiveHighlight ? 'slot-highlight' : ''}`}
                        >
                          {/* Empty slot: show nothing inside */}
                        </button>
                      );
                    }
                    // fallback
                    return null;
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
          {tt('Exportar Agenda', 'Export schedule')}
        </Button>
      </div>

      <Dialog
        open={slotNavigatorOpen}
        onOpenChange={(open) => {
          setSlotNavigatorOpen(open);
          if (!open) {
            setSlotNavigator(null);
            setSlotNavigatorIndex(0);
          }
        }}
      >
        <DialogContent className="max-w-md w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle>{tt('Navegar marcações do slot', 'Browse slot appointments')}</DialogTitle>
          </DialogHeader>

          {slotNavigator && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {slotNavigator.date.toLocaleDateString('pt-PT')} às {slotNavigator.time}
              </p>

              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSlotNavigatorIndex((prev) => Math.max(0, prev - 1))}
                  disabled={slotNavigatorIndex === 0}
                  aria-label={tt('Ver sub-slot anterior', 'View previous sub-slot')}
                >
                  ←
                </Button>

                <div className="text-center flex-1">
                  <p className="text-sm font-medium">
                    {tt('Sub-slot', 'Sub-slot')} {slotNavigatorIndex + 1} {tt('de', 'of')} {slotNavigator.slots.length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {slotNavigator.slots[slotNavigatorIndex]
                      ? `${tt('Marcado para', 'Scheduled for')} ${slotNavigator.slots[slotNavigatorIndex]?.patientName}`
                      : tt('Disponível para nova marcação', 'Available for a new appointment')}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSlotNavigatorIndex((prev) => Math.min(slotNavigator.slots.length - 1, prev + 1))}
                  disabled={slotNavigatorIndex === slotNavigator.slots.length - 1}
                  aria-label={tt('Ver sub-slot seguinte', 'View next sub-slot')}
                >
                  →
                </Button>
              </div>

              <Button
                type="button"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleSlotNavigatorAction}
                aria-label={slotNavigator.slots[slotNavigatorIndex]
                  ? tt('Abrir marcação selecionada', 'Open selected appointment')
                  : tt('Criar marcação no sub-slot selecionado', 'Create appointment in selected sub-slot')}
              >
                {slotNavigator.slots[slotNavigatorIndex]
                  ? tt('Abrir marcação', 'Open appointment')
                  : tt('Criar marcação neste sub-slot', 'Create appointment in this sub-slot')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de seleção de formato de exportação */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-md w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{tt('Exportar Agenda', 'Export schedule')}</DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {tt('Escolha o formato de exportação da agenda semanal', 'Choose the weekly schedule export format')}
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
                <div className="text-xs text-gray-500 dark:text-gray-400">{tt('Formato de texto compatível com Excel e outras aplicações', 'Text format compatible with Excel and other apps')}</div>
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
                <div className="text-xs text-gray-500 dark:text-gray-400">{tt('Ficheiro formatado para Microsoft Excel', 'File formatted for Microsoft Excel')}</div>
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
                <div className="text-xs text-gray-500 dark:text-gray-400">{tt('Documento para impressão ou visualização', 'Document for printing or viewing')}</div>
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
                <div className="font-medium">{tt('iCalendar - Apenas marcações agendadas (.ics)', 'iCalendar - Scheduled appointments only (.ics)')}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{tt('Google Calendar, Outlook', 'Google Calendar, Outlook')}</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={quickDialogOpen} onOpenChange={handleQuickDialogToggle}>
        {/* CORREÇÃO 3: DialogContent como card */}
        <DialogContent className="max-w-5xl w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{tt('Criar nova marcação', 'Create new appointment')}</DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {tt('Escolha rapidamente um dia específico e um horário disponível', 'Quickly choose a specific day and an available time')}
            </p>
          </DialogHeader>
          <div className="space-y-4">
            {/* CORREÇÃO 3: items-end garante alinhamento do botão com os campos */}
            {/* Forçar wrap em todos os breakpoints para evitar que o botão ultrapasse o card */}
            <div className="flex items-end gap-4 flex-wrap">

              {/* Campo Ano (Select/Dropdown) */}
              <div className="flex flex-col gap-1 flex-1 min-w-[110px]">
                <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">{tt('Ano', 'Year')}</Label>
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
                <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">{tt('Mês', 'Month')}</Label>
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
                          {monthDate.toLocaleDateString(currentLocale, { month: 'long' })}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Campo Dia (Com Scrollbar) - Apenas dias de semana */}
              <div className="flex flex-col gap-1 flex-1 min-w-[110px]">
                <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">{tt('Dia', 'Day')}</Label>
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
                <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">{tt('Horário', 'Time')}</Label>
                <Select
                  value={quickTime}
                  onValueChange={setQuickTime}
                  disabled={!quickSlots.length}
                >
                  <SelectTrigger className="min-w-[160px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-10">
                    <SelectValue placeholder={tt('Sem horários disponíveis', 'No available time slots')} />
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
              {tt('Escolher', 'Choose')}
            </Button>

            {!quickSlots.length && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {tt('Não existem horários disponíveis para esta data.', 'There are no available time slots for this date.')}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}
