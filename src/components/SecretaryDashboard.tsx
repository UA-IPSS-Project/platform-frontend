import { useEffect, useState, useRef } from 'react';
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
import { notificationsApi, Notificacao } from '../services/notificationsApi';

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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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
  // Monthly view removed - always use weekly schedule
  const [scheduleView] = useState<'weekly' | 'monthly'>('weekly');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [highlightedNotificationId, setHighlightedNotificationId] = useState<string | null>(null);
  const [highlightedSlot, setHighlightedSlot] = useState<{ date: Date; time: string } | null>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const carregarMarcacoesRef = useRef<(() => Promise<void>) | undefined>(undefined);

  const carregarMarcacoes = async () => {
    console.log('[DEBUG] carregarMarcacoes called - authLoading:', authLoading, 'authUser:', authUser?.id);
    // Wait for auth to complete before loading data
    if (authLoading || !authUser?.id) {
      console.log('[DEBUG] Skipping carregarMarcacoes - waiting for auth');
      return;
    }
    console.log('[DEBUG] Proceeding to load marcações');
    try {
      // Calcular início e fim da semana para filtrar
      const curr = new Date(currentDate);
      const day = curr.getDay(); // 0 (Sun) to 6 (Sat)
      // Se for Domingo (0), queremos a segunda-feira da semana passada? 
      // Ou assumimos que a semana começa à Segunda.
      // Ajuste para garantir que apanhamos a Segunda-feira da semana atual
      const diff = curr.getDate() - day + (day === 0 ? -6 : 1);

      const startOfWeek = new Date(curr);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Até Domingo
      endOfWeek.setHours(23, 59, 59, 999);

      const response = await marcacoesApi.consultarAgenda(
        startOfWeek.toISOString(),
        endOfWeek.toISOString()
      );
      // A resposta de consultarAgenda é MarcacaoResponse[], não Page
      const data = response;
      const convertidas = (Array.isArray(data) ? data : []).map(mapApiToAppointment);
      setAppointments(convertidas);
      console.log('Total de marcações carregadas (semana):', convertidas.length);
    } catch (error) {
      console.error('Erro ao carregar marcações:', error);
      toast.error('Erro ao carregar marcações');
    }
  };

  // Keep ref updated with latest function
  carregarMarcacoesRef.current = carregarMarcacoes;

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

  useEffect(() => {
    console.log('[DEBUG] useEffect[authUser.id, authLoading, currentDate] triggered');
    carregarMarcacoes();
  }, [authUser?.id, authLoading, currentDate]);

  // Recarregar marcações quando volta ao separador de appointments
  useEffect(() => {
    if (currentView === 'appointments') {
      carregarMarcacoes();
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
        carregarMarcacoes();
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
    await carregarMarcacoes();
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
      carregarMarcacoes();
    }
  };

  const handleUpdateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAppointments(appointments.map(apt =>
      apt.id === id ? { ...apt, ...updates } : apt
    ));
  };

  const handleCancelAppointment = (id: string, reason: string) => {
    handleUpdateAppointment(id, { status: 'cancelled', cancellationReason: reason });
    toast.success('Marcação cancelada e utente notificado com o motivo');
    // Refresh appointments to reflect the cancellation immediately
    carregarMarcacoes();
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
                  <WeeklySchedule
                    appointments={appointments}
                    onCreateAppointment={handleCreateAppointment}
                    onViewAppointment={handleViewAppointment}
                    onToggleView={() => { /* no-op: monthly view removed */ }}
                    isDarkMode={isDarkMode}
                    onRefresh={carregarMarcacoes}
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
            onSuccess={carregarMarcacoes}
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
              carregarMarcacoes();
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
            carregarMarcacoes();
            setRefreshKey(prev => prev + 1);
          }}
        />
      </div>
    </div>
  );
}