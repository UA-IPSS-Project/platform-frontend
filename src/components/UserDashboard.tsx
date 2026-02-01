import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './ui/button';
import { NavDropdown } from './ui/NavDropdown';
import { NotificationsPanel } from './ui/NotificationsPanel';
import { NotificationsPage } from './NotificationsPage';
import { Sidebar } from './Sidebar';
import { WeeklySchedule } from './secretary/WeeklySchedule';
import { TodayAppointments } from './secretary/TodayAppointments';
import { HistoryPage } from './secretary/HistoryPage';
import { ProfilePage } from './ProfilePage';
import { ClientAppointmentDialog } from './client/ClientAppointmentDialog';
import { AppointmentDetailsDialog } from './secretary/AppointmentDetailsDialog';
import { DayScheduleDialog } from './secretary/DayScheduleDialog';
import { BellIcon, ClockIcon, LogOutIcon, MenuIcon, MoonIcon, SunIcon } from './CustomIcons';
import type { Appointment } from '../types';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { marcacoesApi } from '../services/api';
import { notificationsApi, Notificacao } from '../services/notificationsApi';
import { mapApiToAppointment } from '../utils/appointmentUtils';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAppointments } from '../hooks/useAppointments';

interface UserDashboardProps {
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

export function UserDashboard({ user, onLogout, isDarkMode, onToggleDarkMode }: UserDashboardProps) {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Custom Hook for Appointments
  const {
    allAppointments,
    blockedAppointments,
    isLoading: isLoadingAppointments,
    refreshAppointments,
    setAllAppointments
  } = useAppointments(authUser?.id, authUser?.nif);

  // States managed locally
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{ date: Date; time: string } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDaySchedule, setShowDaySchedule] = useState<Date | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [highlightedNotificationId, setHighlightedNotificationId] = useState<string | null>(null);
  const [highlightedSlot, setHighlightedSlot] = useState<{ date: Date; time: string } | null>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Navigation Logic
  // Derive currentView from path
  const getCurrentView = () => {
    const path = location.pathname;
    if (path.endsWith('/history')) return 'history';
    if (path.endsWith('/profile')) return 'profile';
    if (path.endsWith('/notifications')) return 'notificacoes';
    if (path.includes('/dashboard')) return 'appointments'; // default
    return 'appointments';
  };

  const currentView = getCurrentView();

  // History Date State
  const [historyStartDate, setHistoryStartDate] = useState<Date | null>(null);
  const [historyEndDate, setHistoryEndDate] = useState<Date>(new Date());
  const [historyAppointments, setHistoryAppointments] = useState<Appointment[]>([]);

  const carregarHistorico = async () => {
    if (!authUser?.id) return;

    try {
      const endOfDay = new Date(historyEndDate);
      endOfDay.setHours(23, 59, 59, 999);

      // If startDate is null, use a far past date (or whatever backend expects for "all")
      // Currently backend defaults to 2000-01-01 if null, so passing null or undefined is fine if API allows.
      // But our updated API signature takes optional strings.
      // Let's pass undefined if null.
      const startIso = historyStartDate ? historyStartDate.toISOString() : undefined;

      // But wait, if we want to ensure time starts at 00:00:00 for the selected start date:
      let startIsoString = undefined;
      if (historyStartDate) {
        const s = new Date(historyStartDate);
        s.setHours(0, 0, 0, 0);
        startIsoString = s.toISOString();
      }

      const data = await marcacoesApi.obterPassadas(
        startIsoString,
        endOfDay.toISOString(),
        authUser.id // Filter by current user
      );

      const mapped = data.map(mapApiToAppointment);
      setHistoryAppointments(mapped);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico');
    }
  };

  useEffect(() => {
    if (getCurrentView() === 'history') {
      carregarHistorico();
    }
  }, [location.pathname, historyStartDate, historyEndDate, authUser?.id]);

  // Notifications State
  const [notifications, setNotifications] = useState<Notificacao[]>([]);

  const carregarNotificacoes = async () => {
    try {
      const data = await notificationsApi.listar();
      setNotifications(data);
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
    const interval = setInterval(carregarNotificacoes, 30000);
    return () => clearInterval(interval);
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
    setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
    try { await notificationsApi.marcarTodasComoLidas(); } catch (e) { console.error(e); }
  };

  const handleDeleteNotification = async (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try { await notificationsApi.eliminar(id); } catch (e) { console.error(e); }
  };

  const handleDeleteAllNotifications = async () => {
    setNotifications([]);
    try { await notificationsApi.eliminarTodas(); toast.success('Todas as notificações eliminadas'); } catch (e) { console.error(e); }
  };

  const unreadCount = notifications.filter(n => !n.lida).length;

  const visibleAppointments = useMemo(
    () => allAppointments.filter((apt) => apt.patientNIF === user.nif),
    [allAppointments, user.nif]
  );



  const handleNavigate = (view: string) => {
    if (view === 'appointments') navigate('/dashboard');
    else if (view === 'history') navigate('/dashboard/history');
    else if (view === 'profile') navigate('/dashboard/profile');
    else if (view === 'notificacoes') navigate('/dashboard/notifications');
    else navigate(`/dashboard/${view}`); // Fail-safe for other views
  };

  const handleCreateAppointment = async (date: Date, time: string) => {
    await refreshAppointments();
    setEditingSlot({ date, time });
    setShowClientDialog(true);
  };

  const handleViewAppointment = async (appointment: Appointment) => {
    try {
      const latestData = await marcacoesApi.obterPorId(parseInt(appointment.id));
      const dateTime = new Date(latestData.data);
      const utente = latestData.marcacaoSecretaria?.utente;
      const isOwn = utente?.nif === user.nif || appointment.patientNIF === user.nif;

      let status: 'scheduled' | 'in-progress' | 'warning' | 'completed' | 'cancelled' | 'reserved' | 'no-show' = 'scheduled';
      if (latestData.estado === 'EM_PREENCHIMENTO') status = 'reserved';
      else if (latestData.estado === 'AGENDADO') status = 'scheduled';
      else if (latestData.estado === 'EM_PROGRESSO') status = 'in-progress';
      else if (latestData.estado === 'AVISO') status = 'warning';
      else if (latestData.estado === 'CONCLUIDO') status = 'completed';
      else if (latestData.estado === 'CANCELADO') status = 'cancelled';
      else if (latestData.estado === 'NAO_COMPARECIDO') status = 'no-show';

      const fresh: Appointment = {
        id: latestData.id.toString(),
        version: latestData.version,
        date: dateTime,
        time: dateTime.toTimeString().slice(0, 5),
        duration: 15,
        patientNIF: isOwn ? utente?.nif || '' : '',
        patientName: isOwn ? utente?.nome || '' : (status === 'reserved' ? 'Reservado' : 'Ocupado'),
        patientContact: isOwn ? utente?.telefone || '' : '',
        patientEmail: isOwn ? utente?.email || '' : '',
        subject: isOwn ? latestData.marcacaoSecretaria?.assunto || '' : (status === 'reserved' ? 'Horário Indisponível' : 'Ocupado'),
        description: isOwn ? latestData.marcacaoSecretaria?.descricao || '' : '',
        status: status,
        cancellationReason: latestData.motivoCancelamento,
        attendantName: latestData.atendenteNome
      };

      if (isOwn) {
        setAllAppointments(prev => prev.map(a => a.id === fresh.id ? fresh : a));
      }
      setSelectedAppointment(fresh);
      setShowDetailsDialog(true);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar detalhes');
      refreshAppointments();
    }
  };

  const renderPlaceholder = (title: string) => (
    <div className="flex items-center justify-center h-[500px]">
      <div className="text-center">
        <h2 className="text-xl text-gray-600 dark:text-gray-300 mb-2">{title}</h2>
        <p className="text-gray-500 dark:text-gray-500">Em desenvolvimento</p>
      </div>
    </div>
  );

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen relative">
        <div className="relative">
          <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 relative z-10">
            <div className="px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={isDarkMode ? '/assets/LogoModoEscuro1.png' : '/assets/LogoSemTextoUltimo.png'}
                  alt="Logo Florinhas do Vouga"
                  className="h-10 w-auto object-contain"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="text-gray-700 dark:text-gray-200"
                >
                  <MenuIcon className="w-5 h-5" />
                </Button>
                <span className="text-gray-700 dark:text-gray-200">Utente</span>
              </div>

              <nav className="hidden md:flex items-center gap-1">
                <Button
                  variant={currentView === 'appointments' ? 'default' : 'ghost'}
                  onClick={() => navigate('/dashboard')}
                  className={`text-sm ${currentView === 'appointments' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-gray-700 dark:text-gray-200'}`}
                >
                  Secretaria
                </Button>

                <NavDropdown
                  label="Candidaturas"
                  items={[
                    { id: 'creche', label: 'Creche' },
                    { id: 'catl', label: 'CATL' },
                    { id: 'erpi', label: 'ERPI' },
                  ]}
                  isActive={['candidaturas', 'creche', 'catl', 'erpi'].includes(currentView)}
                  onSelect={(id) => navigate(`/dashboard/${id}`)}
                  isDarkMode={isDarkMode}
                />
              </nav>

              <div className="flex items-center gap-2">
                <div className="relative z-[10000]" ref={notificationsRef}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (!showNotifications) carregarNotificacoes();
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
                      onNavigateToPage={() => navigate('/dashboard/notifications')}
                      onNotificationClick={(id) => {
                        setHighlightedNotificationId(id);
                        navigate('/dashboard/notifications');
                      }}
                      isDarkMode={isDarkMode}
                    />
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={onToggleDarkMode} className="text-gray-700 dark:text-gray-200">
                  {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={onLogout} className="text-gray-700 dark:text-gray-200">
                  <LogOutIcon className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </header>

          <main className="w-full px-6 py-6">
            <Routes>
              {/* Home / Appointments */}
              <Route path="/" element={
                <>
                  <div className="grid lg:grid-cols-[1fr_380px] gap-6 max-w-[1600px] mx-auto items-start">
                    <div className="space-y-6">
                      <WeeklySchedule
                        appointments={visibleAppointments}
                        allAppointments={[...allAppointments, ...blockedAppointments]}
                        currentUserNif={user.nif}
                        isClient
                        onCreateAppointment={handleCreateAppointment}
                        onViewAppointment={handleViewAppointment}
                        onToggleView={() => { }}
                        isDarkMode={isDarkMode}
                        onRefresh={refreshAppointments}
                        highlightedSlot={highlightedSlot}
                        currentDate={currentDate}
                        onDateChange={setCurrentDate}
                      />
                    </div>
                    <div>
                      <TodayAppointments
                        appointments={visibleAppointments}
                        onViewAppointment={handleViewAppointment}
                        onShowHistory={() => navigate('/dashboard/history')}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  </div>
                  <div className="mt-6 max-w-[1600px] mx-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border-l-4 border-purple-600">
                    <div className="flex items-center gap-3">
                      <ClockIcon className="w-5 h-5 text-purple-600" />
                      <p className="text-gray-800 dark:text-gray-200">Consulte e agende os seus horários disponíveis.</p>
                    </div>
                  </div>
                </>
              } />

              {/* History */}
              <Route path="/history" element={
                <HistoryPage
                  appointments={historyAppointments}
                  onBack={() => navigate('/dashboard')}
                  onViewAppointment={handleViewAppointment}
                  isDarkMode={isDarkMode}
                  startDate={historyStartDate}
                  endDate={historyEndDate}
                  onDateChange={(start, end) => {
                    setHistoryStartDate(start);
                    setHistoryEndDate(end);
                  }}
                  isClient
                />
              } />

              {/* Profile */}
              <Route path="/profile" element={
                <ProfilePage
                  user={{
                    id: authUser?.id || 0,
                    name: authUser?.nome || user.name,
                    nif: authUser?.nif || user.nif,
                    contact: authUser?.telefone || user.contact,
                    email: authUser?.email || user.email,
                  }}
                  onBack={() => navigate('/dashboard')}
                  onUpdateUser={() => { }}
                  isDarkMode={isDarkMode}
                />
              } />

              {/* Notifications */}
              <Route path="/notifications" element={
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
                    navigate('/dashboard');
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
                      navigate('/dashboard');
                      setShowNotifications(false);
                      try {
                        const id = typeof appointmentId === 'string' ? parseInt(appointmentId) : appointmentId;
                        const response = await marcacoesApi.obterPorId(id);
                        const appointment = mapApiToAppointment(response);
                        setSelectedAppointment(appointment);
                        setShowDetailsDialog(true);
                      } catch (e) {
                        toast.error('Não foi possível encontrar a marcação');
                      }
                    },
                    onNavigateToHistory: async () => {
                      navigate('/dashboard/history');
                      setShowNotifications(false);
                    },
                    onNavigateToDocument: () => toast.info('Em desenvolvimento'),
                    onNavigateToCancelledSlot: (dateStr, time) => {
                      navigate('/dashboard');
                      setShowNotifications(false);
                      const slotDate = new Date(dateStr);
                      setHighlightedSlot({ date: slotDate, time });
                      setTimeout(() => setHighlightedSlot(null), 5000);
                    },
                  }}
                />
              } />

              {/* Placeholders */}
              <Route path="/balneario" element={renderPlaceholder('Balneário - Marcações')} />
              <Route path="/balneario-sobre" element={renderPlaceholder('Balneário - Sobre')} />
              <Route path="/voluntariado" element={renderPlaceholder('Voluntariado - Inscrição')} />
              <Route path="/voluntariado-sobre" element={renderPlaceholder('Voluntariado - Sobre')} />
              <Route path="/settings" element={renderPlaceholder('Definições')} />
              <Route path="*" element={renderPlaceholder('Página não encontrada')} />
            </Routes>
          </main>
        </div>

        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentView={currentView}
          onNavigate={handleNavigate}
          onLogout={onLogout}
          isDarkMode={isDarkMode}
          mode="client"
        />

        {showClientDialog && editingSlot && authUser && (
          <ClientAppointmentDialog
            open={showClientDialog}
            onClose={() => {
              setShowClientDialog(false);
              setEditingSlot(null);
            }}
            date={editingSlot.date}
            time={editingSlot.time}
            utenteId={authUser.id}
            onSuccess={() => {
              refreshAppointments();
              carregarNotificacoes();
            }}
          />
        )}

        {showDetailsDialog && selectedAppointment && (
          <AppointmentDetailsDialog
            open={showDetailsDialog}
            onClose={() => {
              setShowDetailsDialog(false);
              setSelectedAppointment(null);
              refreshAppointments();
            }}
            appointment={selectedAppointment}
            onUpdate={(id, updates) => refreshAppointments()}
            onCancel={(id, reason) => {
              setShowDetailsDialog(false);
              setSelectedAppointment(null);
              refreshAppointments();
            }}
            isClient={true}
            existingAppointments={[...allAppointments, ...blockedAppointments]}
          />
        )}

        {showDaySchedule && (
          <DayScheduleDialog
            open={!!showDaySchedule}
            onClose={() => setShowDaySchedule(null)}
            date={showDaySchedule}
            appointments={visibleAppointments}
            onCreateAppointment={handleCreateAppointment}
            onViewAppointment={handleViewAppointment}
          />
        )}
      </div>
    </div>
  );
}
