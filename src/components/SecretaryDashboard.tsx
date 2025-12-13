import { useEffect, useState, useRef } from 'react';
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
import { ProfilePage } from './ProfilePage';
import { BellIcon, MenuIcon, MoonIcon, SunIcon, ClockIcon, LogOutIcon } from './CustomIcons';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { marcacoesApi } from '../services/api';

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

export interface Appointment {
  id: string;
  version?: number;
  date: Date;
  time: string;
  duration: number;
  patientNIF: string;
  patientName: string;
  patientContact: string;
  patientEmail: string;
  subject: string;
  description: string;
  status: 'scheduled' | 'in-progress' | 'warning' | 'completed' | 'cancelled' | 'reserved';
  cancellationReason?: string;
  documents?: { name: string; invalid?: boolean; reason?: string }[];
  attendantName?: string;
}

type ViewType = 'home' | 'requisitions' | 'sections' | 'appointments' | 'management' | 'more' | 'profile' | 'history' | 'settings' | 'administrative' | 'material' | 'manutencao' | 'transportes' | 'urgente' | 'balneario' | 'escola' | 'valencias' | 'candidaturas' | 'creche' | 'catl' | 'erpi' | 'reports' | string;

export function SecretaryDashboard({ user, onLogout, isDarkMode, onToggleDarkMode }: SecretaryDashboardProps) {
  const { user: authUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [historyAppointments, setHistoryAppointments] = useState<Appointment[]>([]);
  const [userData, setUserData] = useState(user);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDaySchedule, setShowDaySchedule] = useState<Date | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<{ date: Date; time: string } | null>(null);
  // Navigation History Stack
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
      if (prev.length <= 1) return prev; // Don't pop last item
      return prev.slice(0, -1);
    });
  };
  // Monthly view removed - always use weekly schedule
  const [scheduleView] = useState<'weekly' | 'monthly'>('weekly');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const carregarMarcacoes = async () => {
    if (!authUser?.id) return;
    try {
      const data = await marcacoesApi.obterTodas();
      const convertidas = data.map((m: any) => {
        const dateTime = new Date(m.data);
        const utente = m.marcacaoSecretaria?.utente;

        // Mapear estado da API para o formato esperado
        let status: 'scheduled' | 'in-progress' | 'warning' | 'completed' | 'cancelled' | 'reserved' = 'scheduled';
        const estadoUpper = m.estado?.toUpperCase();

        if (m.estado) {
          if (estadoUpper === 'EM_PREENCHIMENTO') status = 'reserved';
          else if (estadoUpper === 'AGENDADO') status = 'scheduled';
          else if (estadoUpper === 'EM_PROGRESSO' || estadoUpper === 'EM PROGRESSO') status = 'in-progress';
          else if (estadoUpper === 'AVISO') status = 'warning';
          else if (estadoUpper === 'CONCLUIDO') status = 'completed';
          else if (estadoUpper === 'CANCELADO') status = 'cancelled';
        }

        return {
          id: m.id.toString(),
          version: m.version,
          date: dateTime,
          time: dateTime.toTimeString().slice(0, 5),
          duration: 15,
          patientNIF: status === 'reserved' ? '' : (utente?.nif || 'N/A'),
          patientName: status === 'reserved' ? 'reserved' : (utente?.nome || 'Nome não disponível'),
          patientContact: status === 'reserved' ? '' : (utente?.telefone || 'N/A'),
          patientEmail: status === 'reserved' ? '' : (utente?.email || 'Email não disponível'),
          subject: status === 'reserved' ? 'reserved' : (m.marcacaoSecretaria?.assunto || 'Sem assunto'),
          description: status === 'reserved' ? '' : (m.marcacaoSecretaria?.descricao || ''),
          status: status,
          attendantName: m.atendenteNome, // Mapear nome do atendente
        };
      });
      setAppointments(convertidas);
      console.log('Total de marcações carregadas:', convertidas.length);
    } catch (error) {
      console.error('Erro ao carregar marcações:', error);
      toast.error('Erro ao carregar marcações');
    }
  };

  const carregarHistorico = async () => {
    try {
      const data = await marcacoesApi.obterPassadas();
      const convertidas = data.map((m: any) => {
        const dateTime = new Date(m.data);
        const utente = m.marcacaoSecretaria?.utente;

        // Mapear estado da API para o formato esperado
        let status: 'scheduled' | 'in-progress' | 'warning' | 'completed' | 'cancelled' | 'reserved' = 'scheduled';
        if (m.estado) {
          const estadoUpper = m.estado.toUpperCase();
          if (estadoUpper === 'EM_PREENCHIMENTO') status = 'reserved';
          else if (estadoUpper === 'AGENDADO') status = 'scheduled';
          else if (estadoUpper === 'EM_PROGRESSO' || estadoUpper === 'EM PROGRESSO') status = 'in-progress';
          else if (estadoUpper === 'AVISO') status = 'warning';
          else if (estadoUpper === 'CONCLUIDO') status = 'completed';
          else if (estadoUpper === 'CANCELADO') status = 'cancelled';
        }

        return {
          id: m.id.toString(),
          version: m.version,
          date: dateTime,
          time: dateTime.toTimeString().slice(0, 5),
          duration: 15,
          patientNIF: status === 'reserved' ? '' : (utente?.nif || 'N/A'),
          patientName: status === 'reserved' ? 'reserved' : (utente?.nome || 'Nome não disponível'),
          patientContact: status === 'reserved' ? '' : (utente?.telefone || 'N/A'),
          patientEmail: status === 'reserved' ? '' : (utente?.email || 'Email não disponível'),
          subject: status === 'reserved' ? 'reserved' : (m.marcacaoSecretaria?.assunto || 'Sem assunto'),
          description: status === 'reserved' ? '' : (m.marcacaoSecretaria?.descricao || ''),
          status: status,
          attendantName: m.atendenteNome,
        };
      });
      setHistoryAppointments(convertidas);
      console.log('Total de marcações no histórico:', convertidas.length);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico');
    }
  };

  useEffect(() => {
    carregarMarcacoes();
  }, [authUser?.id]);

  // Recarregar marcações quando volta ao separador de appointments
  useEffect(() => {
    if (currentView === 'appointments') {
      carregarMarcacoes();
    }
  }, [currentView]);

  useEffect(() => {
    if (currentView === 'history') {
      carregarHistorico();
    }
  }, [currentView]);

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

  // Sample notifications for secretary
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Relatório Mensal Disponível',
      message: 'O relatório mensal de dezembro já está disponível para consulta.',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      isRead: false,
      icon: 'document' as const,
    },
    {
      id: '2',
      title: 'Nova marcação agendada',
      message: 'João Santos agendou uma marcação para amanhã às 10:00.',
      timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
      isRead: false,
      icon: 'calendar' as const,
    },
    {
      id: '3',
      title: 'Candidatura aprovada',
      message: 'A candidatura de Maria Silva para CATL foi aprovada.',
      timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
      isRead: true,
      icon: 'document' as const,
    },
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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

      let status: 'scheduled' | 'in-progress' | 'warning' | 'completed' | 'cancelled' | 'reserved' = 'scheduled';
      const estadoUpper = latestData.estado?.toUpperCase();

      if (latestData.estado) {
        if (estadoUpper === 'EM_PREENCHIMENTO') status = 'reserved';
        else if (estadoUpper === 'AGENDADO') status = 'scheduled';
        else if (estadoUpper === 'EM_PROGRESSO' || estadoUpper === 'EM PROGRESSO') status = 'in-progress';
        else if (estadoUpper === 'AVISO') status = 'warning';
        else if (estadoUpper === 'CONCLUIDO') status = 'completed';
        else if (estadoUpper === 'CANCELADO') status = 'cancelled';
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
              <div className="flex items-center gap-4">
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
                  onSelect={(id) => setCurrentView(id as ViewType)}
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
                    onClick={() => setShowNotifications(!showNotifications)}
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
                      notifications={notifications}
                      onMarkAsRead={handleMarkAsRead}
                      onMarkAllAsRead={handleMarkAllAsRead}
                      onClose={() => setShowNotifications(false)}
                      onNavigateToPage={() => navigateTo('notificacoes')}
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
                notifications={notifications}
                onBack={() => navigateBack()}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                isDarkMode={isDarkMode}
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
              />
            ) : currentView === 'history' ? (
              <HistoryPage
                appointments={historyAppointments}
                onBack={() => navigateBack()}
                onViewAppointment={handleViewAppointment}
                isDarkMode={isDarkMode}
              />
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
      </div>
    </div>
  );
}