import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Client } from '@stomp/stompjs';
import { Button } from './ui/button';
import { NavDropdown } from './ui/NavDropdown';
import { NotificationsPanel } from './ui/NotificationsPanel';
import { NotificationsPage } from './NotificationsPage';
import { WeeklySchedule } from './secretary/WeeklySchedule';
import { TodayAppointments } from './secretary/TodayAppointments';
import { HistoryPage } from './secretary/HistoryPage';
import SecretaryHome from './secretary/SecretaryHome';
import { AppointmentDialog } from './secretary/AppointmentDialog';
import { AppointmentDetailsDialog } from './secretary/AppointmentDetailsDialog';
import { DayScheduleDialog } from './secretary/DayScheduleDialog';
import { Sidebar } from './Sidebar';
import { BlockedScheduleDialog } from './BlockedScheduleDialog';
import { UserManagement } from './secretary/UserManagement';
import { ProfilePage } from './ProfilePage';
import { BellIcon, MenuIcon, MoonIcon, SunIcon, ClockIcon, LogOutIcon } from './CustomIcons';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { marcacoesApi, API_BASE_URL } from '../services/api';
import { Appointment, ViewType } from '../types';
import { notificationsApi, Notificacao } from '../services/api';

interface SecretaryDashboardProps {
  user: {
    name: string;
    nif: string;
    contact: string;
    email: string;
  };
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

import { mapApiToAppointment } from '../utils/appointmentUtils';

export function SecretaryDashboard({ user, onLogout, isDarkMode, onToggleDarkMode }: SecretaryDashboardProps) {
  const { user: authUser, isLoading: authLoading } = useAuth();

  // ===== SLIDING WINDOW CACHE: Appointments =====
  // Estado principal: marcações da semana atual (exibido no WeeklySchedule)
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Cache: marcações organizadas por semana (chave = data da segunda-feira YYYY-MM-DD)
  // Mantém apenas 5 semanas em memória: -2, -1, atual, +1, +2
  const [appointmentsByWeek, setAppointmentsByWeek] = useState<Record<string, Appointment[]>>({});

  // Controlo de carregamento: conjunto de chaves de semanas em fetch
  const [loadingWeeks, setLoadingWeeks] = useState<Set<string>>(new Set());

  // Chave da semana atual (para sincronizar UI e cache)
  const [currentWeekKey, setCurrentWeekKey] = useState('');
  // ===== END SLIDING WINDOW CACHE =====
  const [historyAppointments, setHistoryAppointments] = useState<Appointment[]>([]);
  const [historyStartDate, setHistoryStartDate] = useState<Date | null>(null);
  const [historyEndDate, setHistoryEndDate] = useState<Date>(() => {
    // Include future cancelled appointments by default (1 year ahead)
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    return futureDate;
  });
  const [userData, setUserData] = useState(user);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showBlockedDialog, setShowBlockedDialog] = useState(false);
  const [showDaySchedule, setShowDaySchedule] = useState<Date | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<{ date: Date; time: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Para forçar atualização do calendário
  const [currentDate, setCurrentDate] = useState(new Date()); // Lifted state for week navigation
  const [viewHistory, setViewHistory] = useState<ViewType[]>(() => {
    // Restore history if needed, or start with just home
    const saved = localStorage.getItem('secretaryDashboardView');
    return saved ? [saved as ViewType] : ['home'];
  });

  // Current view is the last item in history
  const currentView = viewHistory[viewHistory.length - 1] || 'home';

  const navigateTo = (view: ViewType) => {
    setViewHistory(prev => [...prev, view]);
  };

  const navigateBack = () => {
    setViewHistory(prev => {
      if (prev.length > 1) {
        return prev.slice(0, -1);
      }
      return ['home'];
    });
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [highlightedNotificationId, setHighlightedNotificationId] = useState<string | null>(null);
  const [highlightedSlot, setHighlightedSlot] = useState<{ date: Date; time: string } | null>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const carregarMarcacoesRef = useRef<(() => Promise<void>) | undefined>(undefined);
  // ===== SLIDING WINDOW: Helper refs =====
  // Ref para evitar múltiplas chamadas simultâneas da mesma semana
  const inFlightWeeksRef = useRef<Set<string>>(new Set());

  // Ref para rastrear a semana atualmente visível (sincroniza com currentDate)
  const currentWeekKeyRef = useRef<string>('');

  // ===== SLIDING WINDOW: Utility Functions =====
  // Formatar data como chave (YYYY-MM-DD)
  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calcular início/fim de semana e gerar chave (segunda-feira)
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

  // ===== SLIDING WINDOW: Carregar marcações de uma semana =====
  // Busca marcações de uma semana específica e armazena no cache
  // Opções:
  //   - force: forçar reload mesmo se em cache
  //   - setCurrent: atualizar appointments[] com os resultados
  //   - expectedKey: validar se a semana ainda é a atual antes de atualizar UI
  const loadWeekAppointments = async (
    date: Date,
    options: { force?: boolean; setCurrent?: boolean; expectedKey?: string } = {}
  ) => {
    // Aguardar autenticação
    if (authLoading || !authUser?.id) {
      return;
    }

    const { startOfWeek, endOfWeek, key } = getWeekRange(date);
    const cached = appointmentsByWeek[key];
    const expectedKey = options.expectedKey ?? key;

    // Se está em cache e não é force, usar cache
    if (cached && !options.force) {
      if (options.setCurrent && currentWeekKeyRef.current === expectedKey) {
        setAppointments(cached);
      }
      return;
    }

    // Evitar múltiplas chamadas simultâneas para a mesma semana
    if (inFlightWeeksRef.current.has(key)) {
      return;
    }

    console.log('[DEBUG] loadWeekAppointments start', {
      key,
      expectedKey,
      force: options.force,
      setCurrent: options.setCurrent,
    });

    // Marcar como em fetch e adicionar ao controlo de carregamento
    inFlightWeeksRef.current.add(key);
    setLoadingWeeks(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    try {
      const response = await marcacoesApi.consultarAgenda(
        startOfWeek.toISOString(),
        endOfWeek.toISOString()
      );
      const data = response;
      const convertidas = (Array.isArray(data) ? data : []).map(mapApiToAppointment);

      // Armazenar no cache
      setAppointmentsByWeek(prev => ({
        ...prev,
        [key]: convertidas,
      }));

      // Se setCurrent e a semana ainda é a atual, atualizar UI
      if (options.setCurrent && currentWeekKeyRef.current === expectedKey) {
        setAppointments(convertidas);
      }
    } catch (error) {
      console.error('Erro ao carregar marcações:', error);
      toast.error('Erro ao carregar marcações');
    } finally {
      // Limpar controlo de carregamento
      inFlightWeeksRef.current.delete(key);
      setLoadingWeeks(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      console.log('[DEBUG] loadWeekAppointments done', { key });
    }
  };

  // ===== SLIDING WINDOW: Refresh da semana atual =====
  // Força reload da semana visível (usado por botões e WebSocket)
  const refreshCurrentWeek = async () => {
    const { key } = getWeekRange(currentDate);
    currentWeekKeyRef.current = key;
    setCurrentWeekKey(key);
    console.log('[DEBUG] refreshCurrentWeek', { key, date: currentDate });
    await loadWeekAppointments(currentDate, { force: true, setCurrent: true, expectedKey: key });
  };

  // Keep ref updated with latest function
  carregarMarcacoesRef.current = refreshCurrentWeek;

  const carregarHistorico = async () => {
    try {
      // Use state dates
      const start = historyStartDate;
      const end = historyEndDate;

      // Ensure end date covers the full day
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);

      const startOfDay = start ? new Date(start) : new Date('2000-01-01');
      startOfDay.setHours(0, 0, 0, 0);

      const data = await marcacoesApi.obterPassadas(
        startOfDay.toISOString(),
        endOfDay.toISOString()
      );
      const convertidas = (Array.isArray(data) ? data : []).map(mapApiToAppointment);
      setHistoryAppointments(convertidas);
      console.log('Total de histórico carregado:', convertidas.length);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico');
    }
  };

  useEffect(() => {
    if (currentView === 'history') {
      carregarHistorico();
    }
    // Reload when filters change (if view is history)
  }, [currentView, historyStartDate, historyEndDate]);

  // ===== SLIDING WINDOW: Efeito principal =====
  // Quando currentDate muda, atualiza a janela deslizante:
  //   1. Poda o cache (mantém apenas -2, -1, 0, +1, +2)
  //   2. Carrega as 5 semanas (em paralelo, com cache check)
  useEffect(() => {
    if (authLoading || !authUser?.id) {
      return;
    }

    const { key: currentKey } = getWeekRange(currentDate);
    currentWeekKeyRef.current = currentKey;
    setCurrentWeekKey(currentKey);

    // Calcular chaves das 5 semanas
    const prevDate = addDays(currentDate, -7);
    const prevPrevDate = addDays(currentDate, -14);
    const nextDate = addDays(currentDate, 7);
    const nextNextDate = addDays(currentDate, 14);
    const { key: prevKey } = getWeekRange(prevDate);
    const { key: prevPrevKey } = getWeekRange(prevPrevDate);
    const { key: nextKey } = getWeekRange(nextDate);
    const { key: nextNextKey } = getWeekRange(nextNextDate);

    console.log('[DEBUG] sliding window update', {
      currentKey,
      prevKey,
      prevPrevKey,
      nextKey,
      nextNextKey,
    });

    // Podar cache: manter apenas as 5 semanas
    setAppointmentsByWeek(prev => {
      const nextCache: Record<string, Appointment[]> = {};
      if (prev[prevPrevKey]) nextCache[prevPrevKey] = prev[prevPrevKey];
      if (prev[prevKey]) nextCache[prevKey] = prev[prevKey];
      if (prev[currentKey]) nextCache[currentKey] = prev[currentKey];
      if (prev[nextKey]) nextCache[nextKey] = prev[nextKey];
      if (prev[nextNextKey]) nextCache[nextNextKey] = prev[nextNextKey];
      return nextCache;
    });

    // Carregar as 5 semanas (em paralelo)
    loadWeekAppointments(currentDate, { setCurrent: true, expectedKey: currentKey });
    loadWeekAppointments(prevDate);
    loadWeekAppointments(prevPrevDate);
    loadWeekAppointments(nextDate);
    loadWeekAppointments(nextNextDate);
  }, [authUser?.id, authLoading, currentDate]);

  // Recarregar marcações quando volta ao separador de appointments
  useEffect(() => {
    if (currentView === 'appointments') {
      refreshCurrentWeek();
    }
  }, [currentView]);

  // Removed duplicate useEffect for history loading as it's merged above


  // Persist view changes (save only current view for refresh, but component logic uses history)
  useEffect(() => {
    localStorage.setItem('secretaryDashboardView', currentView);
  }, [currentView]);

  // Atualização automática a cada 60 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentView === 'appointments') {
        refreshCurrentWeek();
      } else if (currentView === 'history') {
        carregarHistorico();
      }
    }, 60000); // 60 segundos

    return () => clearInterval(interval);
  }, [currentView]);


  // ...

  // Inside component:
  const [notifications, setNotifications] = useState<Notificacao[]>([]);

  const carregarNotificacoes = async () => {
    try {
      const data = await notificationsApi.listar();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  useEffect(() => {
    if (authUser?.id) {
      carregarNotificacoes();
    }
  }, [authUser?.id]);

  useEffect(() => {
    // Configurar WebSocket
    const baseUrl = API_BASE_URL || window.location.origin;
    const wsUrl = baseUrl.replace(/^http/, 'ws') + '/ws';

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log('WebSocket Conectado (Secretary)');
      client.subscribe('/user/queue/notifications', (message) => {
        if (message.body) {
          try {
            const novaNotificacao: Notificacao = JSON.parse(message.body);
            setNotifications(prev => [novaNotificacao, ...prev]);
            toast.info(novaNotificacao.titulo, {
              description: novaNotificacao.mensagem,
            });
            // Refresh appointments to reflect changes
            // Small delay to allow backend transaction to commit before querying
            setTimeout(() => {
              console.log('[WS] Refreshing appointments after delay');
              carregarMarcacoesRef.current?.();
            }, 500);
          } catch (e) {
            console.error('Erro ao processar notificação:', e);
          }
        }
      });
    };

    client.onStompError = (frame) => {
      console.error('Erro no Broker STOMP:', frame.headers['message']);
      console.error('Detalhes:', frame.body);
    };

    client.activate();

    return () => {
      client.deactivate();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
      await notificationsApi.marcarComoLida(id);
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
      await notificationsApi.marcarTodasComoLidas();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await notificationsApi.eliminar(id);
    } catch (error) {
      console.error('Erro ao eliminar notificação:', error);
      toast.error('Erro ao eliminar notificação');
    }
  };

  const handleDeleteAllNotifications = async () => {
    try {
      setNotifications([]);
      await notificationsApi.eliminarTodas();
      toast.success('Todas as notificações foram eliminadas');
    } catch (error) {
      console.error('Erro ao eliminar todas as notificações:', error);
      toast.error('Erro ao eliminar notificações');
    }
  };

  const unreadCount = notifications.filter(n => !n.lida).length;

  const handleCreateAppointment = async (date: Date, time: string) => {
    // Recarregar marcações antes de abrir o dialog
    await refreshCurrentWeek();
    setEditingAppointment({ date, time });
    setShowAppointmentDialog(true);
  };

  const handleViewAppointment = async (appointment: Appointment) => {
    if (appointment.status === 'reserved') {
      return; // Não abrir detalhes para slots reserveds
    }

    try {
      // Fetch fresh data
      const latestData = await marcacoesApi.obterPorId(parseInt(appointment.id));

      // Map response to Appointment type
      const dateTime = new Date(latestData.data);
      const utente = latestData.marcacaoSecretaria?.utente;

      let status: 'scheduled' | 'in-progress' | 'warning' | 'completed' | 'cancelled' | 'reserved' | 'no-show' = 'scheduled';
      const estadoUpper = latestData.estado?.toUpperCase();

      if (latestData.estado) {
        if (estadoUpper === 'EM_PREENCHIMENTO') status = 'reserved';
        else if (estadoUpper === 'AGENDADO') status = 'scheduled';
        else if (estadoUpper === 'EM_PROGRESSO' || estadoUpper === 'EM PROGRESSO') status = 'in-progress';
        else if (estadoUpper === 'AVISO') status = 'warning';
        else if (estadoUpper === 'CONCLUIDO') status = 'completed';
        else if (estadoUpper === 'CANCELADO') status = 'cancelled';
        else if (estadoUpper === 'NAO_COMPARECIDO') status = 'no-show';
      }

      const freshAppointment: Appointment = {
        id: latestData.id.toString(),
        version: latestData.version,
        date: dateTime,
        time: dateTime.toTimeString().slice(0, 5),
        duration: 15,
        patientNIF: status === 'reserved' ? '' : (utente?.nif || 'N/A'),
        patientName: status === 'reserved' ? 'reserved' : (utente?.nome || 'Nome não disponível'),
        patientContact: status === 'reserved' ? '' : (utente?.telefone || 'N/A'),
        patientEmail: status === 'reserved' ? '' : (utente?.email || 'Email não disponível'),
        subject: status === 'reserved' ? 'reserved' : (latestData.marcacaoSecretaria?.assunto || 'Sem assunto'),
        description: status === 'reserved' ? '' : (latestData.marcacaoSecretaria?.descricao || ''),
        status: status,
        cancellationReason: latestData.motivoCancelamento,
        attendantName: latestData.atendenteNome,
      };

      // Update in list if changed
      setAppointments(prev => prev.map(apt => apt.id === freshAppointment.id ? freshAppointment : apt));

      setSelectedAppointment(freshAppointment);
      setShowDetailsDialog(true);
    } catch (error) {
      console.error('Erro ao atualizar marcação:', error);
      toast.error('Não foi possível carregar os dados mais recentes da marcação.');
      // Fallback: open with existing data if fetch fails? Or just returning is safer?
      // Better to refresh list and stop if it likely doesn't exist.
      refreshCurrentWeek();
    }
  };

  const handleUpdateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => prev.map(apt =>
      apt.id === id ? { ...apt, ...updates } : apt
    ));

    const { key } = getWeekRange(currentDate);
    setAppointmentsByWeek(prev => {
      const currentWeek = prev[key];
      if (!currentWeek) return prev;
      return {
        ...prev,
        [key]: currentWeek.map(apt => (apt.id === id ? { ...apt, ...updates } : apt)),
      };
    });
  };

  const handleCancelAppointment = (id: string, reason: string) => {
    handleUpdateAppointment(id, { status: 'cancelled', cancellationReason: reason });
    toast.success('Marcação cancelada e utente notificado com o motivo');
    // Refresh appointments to reflect the cancellation immediately
    refreshCurrentWeek();
  };

  const handleNavigate = (view: ViewType) => {
    navigateTo(view);
  };

  const handleUpdateUser = (updatedUser: { name: string; nif: string; contact: string; email: string }) => {
    setUserData(updatedUser);
  };

  const getCurrentActivity = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const todayAppointments = appointments
      .filter(apt => {
        const aptDate = new Date(apt.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === today.getTime() && apt.status !== 'cancelled';
      })
      .sort((a, b) => {
        const [aHour, aMin] = a.time.split(':').map(Number);
        const [bHour, bMin] = b.time.split(':').map(Number);
        return (aHour * 60 + aMin) - (bHour * 60 + bMin);
      });

    // Check for in-progress appointment
    const inProgressApt = todayAppointments.find(apt => apt.status === 'in-progress');
    if (inProgressApt) {
      return `Atendimento a decorrer - ${inProgressApt.patientName}`;
    }

    // Find next upcoming appointment
    for (const apt of todayAppointments) {
      const [hour, minute] = apt.time.split(':').map(Number);
      const aptTime = hour * 60 + minute;

      if (currentTime < aptTime) {
        const diff = aptTime - currentTime;
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;

        if (hours > 0) {
          return `Próximo agendamento em ${hours} hora${hours > 1 ? 's' : ''} e ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
        } else {
          return `Próximo agendamento em ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
        }
      }
    }

    return 'Ainda não existem marcações para hoje';
  };

  const currentActivity = getCurrentActivity();
  const isCurrentWeekLoading = currentWeekKey ? loadingWeeks.has(currentWeekKey) : false;

  const renderPlaceholder = (view: ViewType) => (
    <div className="flex items-center justify-center h-[600px]">
      <div className="text-center">
        <h2 className="text-2xl text-gray-600 dark:text-gray-400 mb-2">
          {view === 'requisitions' && 'Requisições'}
          {view === 'sections' && 'Secções'}
          {view === 'management' && 'Gestão'}
          {view === 'settings' && 'Definições'}
          {view === 'more' && 'Mais'}
          {view === 'administrative' && 'Área Administrativa'}
          {view === 'material' && 'Requisições - Material'}
          {view === 'manutencao' && 'Requisições - Manutenção'}
          {view === 'transportes' && 'Requisições - Transporte'}
          {view === 'urgente' && 'Requisições - Prioridade Alta'}
          {view === 'balneario' && 'Valências - Balneário'}
          {view === 'escola' && 'Valências - Escola'}
          {view === 'valencias' && 'Valências'}
          {view === 'candidaturas' && 'Candidaturas'}
          {view === 'creche' && 'Candidaturas - Creche'}
          {view === 'catl' && 'Candidaturas - CATL'}
          {view === 'erpi' && 'Candidaturas - ERPI'}
          {view === 'reports' && 'Relatórios'}
          {!['home', 'requisitions', 'sections', 'management', 'settings', 'more', 'appointments', 'profile', 'history', 'notificacoes', 'administrative', 'material', 'manutencao', 'transportes', 'urgente', 'balneario', 'escola', 'valencias', 'candidaturas', 'creche', 'catl', 'erpi', 'reports'].includes(view) && view.charAt(0).toUpperCase() + view.slice(1)}
        </h2>
        <p className="text-gray-500 dark:text-gray-500">Em desenvolvimento</p>
      </div>
    </div>
  );

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen relative">
        {/* Content */}
        <div className="relative">
          {/* Header - Full Width */}
          <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 relative z-10">
            <div className="px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={isDarkMode ? '/assets/LogoModoEscuro1.png' : '/assets/LogoSemTextoUltimo.png'}
                  alt="Logo Florinhas do Vouga"
                  className="h-10 w-auto object-contain"
                />
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-gray-700 dark:text-gray-200">
                  <MenuIcon className="w-5 h-5" />
                </Button>
                <span className="text-gray-700 dark:text-gray-200">Secretaria</span>
              </div>

              <nav className="hidden md:flex items-center gap-1">
                <NavDropdown
                  label="Requisições"
                  items={[
                    { id: 'material', label: 'Material' },
                    { id: 'manutencao', label: 'Manutenção' },
                    { id: 'transportes', label: 'Transporte' },
                    { id: 'urgente', label: 'Prioridade Alta' },
                  ]}
                  isActive={['requisitions', 'material', 'manutencao', 'transportes', 'urgente'].includes(currentView)}
                  onSelect={(id) => navigateTo(id as ViewType)}
                  isDarkMode={isDarkMode}
                />

                <NavDropdown
                  label="Valências"
                  items={[
                    { id: 'balneario', label: 'Balneário' },
                    { id: 'escola', label: 'Escola' },
                  ]}
                  isActive={['valencias', 'balneario', 'escola'].includes(currentView)}
                  onSelect={(id) => navigateTo(id as ViewType)}
                  isDarkMode={isDarkMode}
                />

                <Button
                  variant={currentView === 'appointments' ? 'default' : 'ghost'}
                  onClick={() => navigateTo('appointments')}
                  className={`text-sm ${currentView === 'appointments' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-gray-700 dark:text-gray-200'}`}
                >
                  Marcações
                </Button>

                <NavDropdown
                  label="Candidaturas"
                  items={[
                    { id: 'creche', label: 'Creche' },
                    { id: 'catl', label: 'CATL' },
                    { id: 'erpi', label: 'ERPI' },
                  ]}
                  isActive={['candidaturas', 'creche', 'catl', 'erpi'].includes(currentView)}
                  onSelect={(id) => navigateTo(id as ViewType)}
                  isDarkMode={isDarkMode}
                />

                <Button
                  variant={currentView === 'reports' ? 'default' : 'ghost'}
                  onClick={() => navigateTo('reports')}
                  className={`text-sm ${currentView === 'reports' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-gray-700 dark:text-gray-200'}`}
                >
                  Relatórios
                </Button>

                <Button
                  variant={currentView === 'management' ? 'default' : 'ghost'}
                  onClick={() => navigateTo('management')}
                  className={`text-sm ${currentView === 'management' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-gray-700 dark:text-gray-200'}`}
                >
                  Gestão
                </Button>
              </nav>

              <div className="flex items-center gap-2">
                <div className="relative z-[10000]" ref={notificationsRef}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (!showNotifications) {
                        carregarNotificacoes();
                      }
                    }}
                  >
                    <BellIcon className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 bg-purple-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm transform translate-x-1/4 -translate-y-1/4">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                  {showNotifications && (
                    <NotificationsPanel
                      notifications={notifications.map(n => ({
                        id: n.id.toString(),
                        title: n.titulo,
                        message: n.mensagem,
                        timestamp: n.dataCriacao,
                        isRead: n.lida,
                        icon: n.tipo === 'LEMBRETE' ? 'calendar' : n.tipo === 'FICHEIRO' ? 'document' : 'alert'
                      }))}
                      onMarkAsRead={(id) => handleMarkAsRead(parseInt(id))}
                      onMarkAllAsRead={handleMarkAllAsRead}
                      onDelete={(id) => handleDeleteNotification(parseInt(id))}
                      onDeleteAll={handleDeleteAllNotifications}
                      onClose={() => setShowNotifications(false)}
                      onNavigateToPage={() => navigateTo('notificacoes')}
                      onNotificationClick={(id) => {
                        setHighlightedNotificationId(id);
                        navigateTo('notificacoes');
                      }}
                      isDarkMode={isDarkMode}
                    />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleDarkMode}
                  className="text-gray-700 dark:text-gray-200"
                >
                  {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={onLogout} className="text-gray-700 dark:text-gray-200">
                  <LogOutIcon className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="w-full px-6 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {currentView === 'home' ? (
                  <SecretaryHome
                    key={currentView}
                    isDarkMode={isDarkMode}
                    onNavigate={navigateTo}
                  />
                ) : currentView === 'notificacoes' ? (
                  <NotificationsPage
                    notifications={notifications.map(n => ({
                      id: n.id.toString(),
                      title: n.titulo,
                      message: n.mensagem,
                      timestamp: n.dataCriacao,
                      isRead: n.lida,
                      icon: n.tipo === 'LEMBRETE' ? 'calendar' : n.tipo === 'FICHEIRO' ? 'document' : 'alert',
                      type: n.tipo,
                      metadata: n.metadata,
                    }))}
                    onBack={() => {
                      navigateBack();
                      setHighlightedNotificationId(null);
                    }}
                    onMarkAsRead={(id) => handleMarkAsRead(parseInt(id))}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    onDelete={(id) => handleDeleteNotification(parseInt(id))}
                    onDeleteAll={handleDeleteAllNotifications}
                    isDarkMode={isDarkMode}
                    highlightedNotificationId={highlightedNotificationId || undefined}
                    actionCallbacks={{
                      onNavigateToAppointment: async (appointmentId) => {
                        navigateTo('appointments');
                        setShowNotifications(false);
                        try {
                          const response = await marcacoesApi.obterPorId(parseInt(appointmentId));
                          const appointment = mapApiToAppointment(response);
                          setSelectedAppointment(appointment);
                          setShowDetailsDialog(true);
                          toast.success('Marcação encontrada');
                        } catch (error) {
                          console.error('Erro ao carregar marcação:', error);
                          toast.error('Não foi possível encontrar a marcação');
                        }
                      },
                      onNavigateToCancelledSlot: (dateStr, time) => {
                        navigateTo('appointments');
                        setShowNotifications(false);
                        const slotDate = new Date(dateStr);
                        setHighlightedSlot({ date: slotDate, time });
                        setTimeout(() => {
                          setHighlightedSlot(null);
                        }, 5000);
                        toast.info('A mostrar slot cancelado no calendário');
                      },
                    }}
                  />
                ) : currentView === 'profile' ? (
                  <ProfilePage
                    user={{
                      id: authUser?.id || 0,
                      name: authUser?.nome || userData.name,
                      nif: authUser?.nif || userData.nif,
                      contact: authUser?.telefone || userData.contact,
                      email: authUser?.email || userData.email,
                    }}
                    onBack={() => navigateBack()}
                    onUpdateUser={handleUpdateUser}
                    isDarkMode={isDarkMode}
                    isEmployee={true}
                  />
                ) : currentView === 'history' ? (
                  <HistoryPage
                    appointments={historyAppointments}
                    onBack={() => navigateBack()}
                    onViewAppointment={handleViewAppointment}
                    isDarkMode={isDarkMode}
                    startDate={historyStartDate}
                    endDate={historyEndDate}
                    onDateChange={(start, end) => {
                      setHistoryStartDate(start);
                      setHistoryEndDate(end);
                    }}
                  />
                ) : currentView === 'management' ? (
                  <UserManagement isDarkMode={isDarkMode} />
                ) : currentView === 'appointments' ? (
                  <div className="grid lg:grid-cols-[1fr_380px] gap-6 max-w-[1600px] mx-auto items-start">
                    {/* Left Column - Schedules */}
                    <div className="space-y-6">
                      {isCurrentWeekLoading && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          A carregar semana...
                        </div>
                      )}
                      <WeeklySchedule
                        appointments={appointments}
                        onCreateAppointment={handleCreateAppointment}
                        onViewAppointment={handleViewAppointment}
                        onToggleView={() => { /* no-op: monthly view removed */ }}
                        isDarkMode={isDarkMode}
                        onRefresh={refreshCurrentWeek}
                        onBlockSchedule={() => setShowBlockedDialog(true)}
                        refreshTrigger={refreshKey}
                        highlightedSlot={highlightedSlot}
                        currentDate={currentDate}
                        onDateChange={setCurrentDate}
                      />
                    </div>

                    {/* Right Column - Today's Appointments */}
                    <div>
                      <TodayAppointments
                        appointments={appointments}
                        onViewAppointment={handleViewAppointment}
                        onShowHistory={() => navigateTo('history')}
                        showFilter={true}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  </div>
                ) : (
                  renderPlaceholder(currentView)
                )}

                {/* Activity Banner - Always visible on appointments page */}
                {currentView === 'appointments' && (
                  <div className="mt-6 max-w-[1600px] mx-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border-l-4 border-purple-600">
                    <div className="flex items-center gap-3">
                      <ClockIcon className="w-5 h-5 text-purple-600" />
                      <p className="text-gray-800 dark:text-gray-200">{currentActivity}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentView={currentView}
          onNavigate={handleNavigate}
          onLogout={onLogout}
          isDarkMode={isDarkMode}
        />

        {/* Dialogs */}
        {showAppointmentDialog && editingAppointment && authUser?.id && (
          <AppointmentDialog
            open={showAppointmentDialog}
            onClose={() => {
              setShowAppointmentDialog(false);
              setEditingAppointment(null);
            }}
            onSuccess={refreshCurrentWeek}
            date={editingAppointment.date}
            time={editingAppointment.time}
            funcionarioId={authUser.id}
          />
        )}

        {showDetailsDialog && selectedAppointment && (
          <AppointmentDetailsDialog
            open={showDetailsDialog}
            onClose={() => {
              setShowDetailsDialog(false);
              setSelectedAppointment(null);
              refreshCurrentWeek();
            }}
            appointment={selectedAppointment}
            onUpdate={handleUpdateAppointment}
            onCancel={handleCancelAppointment}
            existingAppointments={appointments}
          />
        )}



        {showDaySchedule && (
          <DayScheduleDialog
            open={!!showDaySchedule}
            onClose={() => setShowDaySchedule(null)}
            date={showDaySchedule}
            appointments={appointments}
            onCreateAppointment={handleCreateAppointment}
            onViewAppointment={handleViewAppointment}
          />
        )}

        <BlockedScheduleDialog
          open={showBlockedDialog}
          onOpenChange={setShowBlockedDialog}
          appointments={appointments}
          onSuccess={() => {
            refreshCurrentWeek();
            setRefreshKey(prev => prev + 1);
          }}
        />
      </div>
    </div>
  );
}