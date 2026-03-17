import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { NavDropdown } from '../../components/layout/NavDropdown';
import { NotificationsPage } from '../NotificationsPage';
import { Sidebar } from '../../components/layout/Sidebar';
import { WeeklySchedule } from '../../components/secretary/WeeklySchedule';
import { TodayAppointments } from '../../components/secretary/TodayAppointments';
import { HistoryPage } from '../HistoryPage';
import { ProfilePage } from '../ProfilePage';
import { ClientAppointmentDialog } from '../../components/utente/ClientAppointmentDialog';
import { AppointmentDetailsDialog } from '../../components/secretary/AppointmentDetailsDialog';
import { ClockIcon } from '../../components/shared/CustomIcons';
import type { Appointment } from '../../types';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { marcacoesApi } from '../../services/api';
import { mapApiToAppointment, mapStatusFromApiToUi, getCurrentActivity } from '../../utils/appointmentUtils';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppointments } from '../../hooks/useAppointments';
import { useNotifications } from '../../hooks/useNotifications';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useTranslation } from 'react-i18next';

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

export function UserDashboard({ user, onLogout, isDarkMode, onToggleDarkMode }: Readonly<UserDashboardProps>) {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    allAppointments,
    blockedAppointments,
    refreshAppointments,
    setAllAppointments
  } = useAppointments(authUser?.id, authUser?.nif);

  // Custom Hooks
  const {
    notifications,
    unreadCount,
    carregarNotificacoes,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDeleteNotification,
    handleDeleteAllNotifications
  } = useNotifications(authUser?.email, refreshAppointments);

  // States managed locally
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{ date: Date; time: string } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [highlightedNotificationId, setHighlightedNotificationId] = useState<string | null>(null);
  const [highlightedSlot, setHighlightedSlot] = useState<{ date: Date; time: string } | null>(null);
  const [currentDate, setCurrentDate] = useState(() => {
    const saved = sessionStorage.getItem('utente_currentDate');
    return saved ? new Date(saved) : new Date();
  });

  // Persist current week view across reloads
  useEffect(() => {
    sessionStorage.setItem('utente_currentDate', currentDate.toISOString());
  }, [currentDate]);

  // Navigation Logic
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
  const [historyEndDate, setHistoryEndDate] = useState<Date>(() => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    return futureDate;
  });
  const [historyAppointments, setHistoryAppointments] = useState<Appointment[]>([]);

  const carregarHistorico = async () => {
    if (!authUser?.id) return;
    try {
      const endOfDay = new Date(historyEndDate);
      endOfDay.setHours(23, 59, 59, 999);
      let startIsoString = undefined;
      if (historyStartDate) {
        const s = new Date(historyStartDate);
        s.setHours(0, 0, 0, 0);
        startIsoString = s.toISOString();
      }
      const data = await marcacoesApi.obterPassadas(startIsoString, endOfDay.toISOString(), authUser.id);
      setHistoryAppointments(data.map(mapApiToAppointment));
    } catch (error) {
      console.error('Erro ao carregar histórico do utente:', error);
      toast.error(t('dashboard.errors.loadHistory'));
    }
  };

  useEffect(() => {
    if (getCurrentView() === 'history') carregarHistorico();
  }, [location.pathname, historyStartDate, historyEndDate, authUser?.id]);


  const visibleAppointments = useMemo(
    () => allAppointments.filter((apt) => apt.patientNIF === user.nif),
    [allAppointments, user.nif]
  );

  const handleNavigate = (view: string) => {
    if (view === 'appointments') navigate('/dashboard');
    else if (view === 'history') navigate('/dashboard/history');
    else if (view === 'profile') navigate('/dashboard/profile');
    else if (view === 'notificacoes') navigate('/dashboard/notifications');
    else navigate(`/dashboard/${view}`);
  };

  const handleCreateAppointment = async (date: Date, time: string) => {
    await refreshAppointments();
    setEditingSlot({ date, time });
    setShowClientDialog(true);
  };

  const handleViewAppointment = async (appointment: Appointment) => {
    try {
      const latestData = await marcacoesApi.obterPorId(Number.parseInt(appointment.id, 10));
      const dateTime = new Date(latestData.data);
      const utente = latestData.marcacaoSecretaria?.utente;
      const isOwn = utente?.nif === user.nif || appointment.patientNIF === user.nif;

      const status = mapStatusFromApiToUi(latestData.estado);
      const genericLabel = status === 'reserved'
        ? t('dashboard.userHome.labels.reserved')
        : t('dashboard.userHome.labels.occupied');
      const genericSubject = status === 'reserved'
        ? t('dashboard.userHome.labels.unavailableTime')
        : t('dashboard.userHome.labels.occupied');

      const fresh: Appointment = {
        id: latestData.id.toString(),
        version: latestData.version,
        date: dateTime,
        time: dateTime.toTimeString().slice(0, 5),
        duration: 15,
        patientNIF: isOwn ? utente?.nif || '' : '',
        patientName: isOwn ? utente?.nome || '' : genericLabel,
        patientContact: isOwn ? utente?.telefone || '' : '',
        patientEmail: isOwn ? utente?.email || '' : '',
        subject: isOwn ? latestData.marcacaoSecretaria?.assunto || '' : genericSubject,
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
    } catch (error) {
      console.error('Erro ao abrir detalhes da marcação no dashboard do utente:', error);
      toast.error(t('dashboard.errors.loadDetails'));
      refreshAppointments();
    }
  };

  const getNotificationIcon = (tipo?: string): 'calendar' | 'document' | 'alert' => {
    if (tipo === 'LEMBRETE') return 'calendar';
    if (tipo === 'FICHEIRO') return 'document';
    return 'alert';
  };

  const renderPlaceholder = (title: string) => (
    <div className="flex items-center justify-center h-[500px]">
      <div className="text-center">
        <h2 className="text-xl text-gray-600 dark:text-gray-300 mb-2">{title}</h2>
        <p className="text-gray-500 dark:text-gray-500">{t('dashboard.inDevelopment')}</p>
      </div>
    </div>
  );

  const currentActivity = getCurrentActivity(visibleAppointments, false);

  const UserNavigation = (
    <>
      <Button
        variant={currentView === 'appointments' ? 'default' : 'ghost'}
        onClick={() => navigate('/dashboard')}
        className={`text-sm ${currentView === 'appointments' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-gray-700 dark:text-gray-200'}`}
      >
        {t('dashboard.secretary')}
      </Button>

      <NavDropdown
        label={t('dashboard.applications')}
        items={[
          { id: 'creche', label: t('dashboard.creche') },
          { id: 'catl', label: 'CATL' },
          { id: 'erpi', label: 'ERPI' },
        ]}
        isActive={['candidaturas', 'creche', 'catl', 'erpi'].includes(currentView)}
        onSelect={(id) => navigate(`/dashboard/${id}`)}
      />
    </>
  );

  return (
    <>
      <DashboardLayout
        isDarkMode={isDarkMode}
        onToggleDarkMode={onToggleDarkMode}
        onLogout={onLogout}
        onMenuToggle={() => setSidebarOpen(true)}
        roleTitle={t('dashboard.user')}
        navigationContent={UserNavigation}
        notifications={notifications}
        unreadCount={unreadCount}
        showNotifications={showNotifications}
        onToggleNotifications={(show) => {
          setShowNotifications(show);
          if (!show) carregarNotificacoes();
        }}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDeleteNotification={handleDeleteNotification}
        onDeleteAllNotifications={handleDeleteAllNotifications}
        onNavigateToNotifications={() => {
          navigate('/dashboard/notifications');
          setShowNotifications(false);
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Routes location={location}>
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
                        appointmentType="SECRETARIA"
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
                      <p className="text-gray-800 dark:text-gray-200">{currentActivity}</p>
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
                    icon: getNotificationIcon(n.tipo),
                    type: n.tipo,
                    metadata: n.metadata,
                  }))}
                  onBack={() => {
                    navigate('/dashboard');
                    setHighlightedNotificationId(null);
                  }}
                  onMarkAsRead={(id) => handleMarkAsRead(Number.parseInt(id, 10))}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onDelete={(id) => handleDeleteNotification(Number.parseInt(id, 10))}
                  onDeleteAll={handleDeleteAllNotifications}
                  isDarkMode={isDarkMode}
                  highlightedNotificationId={highlightedNotificationId || undefined}
                  actionCallbacks={{
                    onNavigateToAppointment: (appointmentId) => {
                      navigate('/dashboard');
                      setShowNotifications(false);
                      const go = async () => {
                        try {
                          const id = typeof appointmentId === 'string' ? Number.parseInt(appointmentId, 10) : appointmentId;
                          const response = await marcacoesApi.obterPorId(id);
                          const appointment = mapApiToAppointment(response);
                          setSelectedAppointment(appointment);
                          setShowDetailsDialog(true);
                        } catch (error) {
                          console.error('Erro ao navegar para marcação por notificação (utente):', error);
                          toast.error(t('dashboard.errors.findAppointment'));
                        }
                      };
                      void go();
                    },
                    onNavigateToHistory: () => {
                      navigate('/dashboard/history');
                      setShowNotifications(false);
                    },
                    onNavigateToDocument: () => toast.info(t('dashboard.userHome.messages.documentViewInDevelopment')),
                    onNavigateToCancelledSlot: (dateStr, time) => {
                      navigate('/dashboard');
                      setShowNotifications(false);
                      const slotDate = new Date(dateStr);
                      setCurrentDate(slotDate);
                      setHighlightedSlot({ date: slotDate, time });
                      setTimeout(() => setHighlightedSlot(null), 5000);
                    },
                  }}
                />
              } />

              {/* Placeholders */}
              <Route path="/balneario" element={renderPlaceholder(t('dashboard.userHome.placeholders.balnearioAppointments'))} />
              <Route path="/balneario-sobre" element={renderPlaceholder(t('dashboard.userHome.placeholders.balnearioAbout'))} />
              <Route path="/voluntariado" element={renderPlaceholder(t('dashboard.userHome.placeholders.volunteeringSignup'))} />
              <Route path="/voluntariado-sobre" element={renderPlaceholder(t('dashboard.userHome.placeholders.volunteeringAbout'))} />
              <Route path="/settings" element={renderPlaceholder(t('dashboard.userHome.placeholders.settings'))} />
              <Route path="*" element={renderPlaceholder(t('dashboard.userHome.placeholders.notFound'))} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </DashboardLayout>

      {/* Floating Overlays */}
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
          onUpdate={(id, updates) => {
            setAllAppointments(prev => prev.map(apt => apt.id === id ? { ...apt, ...updates } : apt));
            refreshAppointments();
          }}
          onCancel={(id, reason) => {
            setAllAppointments(prev => prev.map(apt => apt.id === id ? { ...apt, status: 'cancelled' as const, cancellationReason: reason } : apt));
            setShowDetailsDialog(false);
            setSelectedAppointment(null);
            refreshAppointments();
          }}
          isClient={true}
          existingAppointments={[...allAppointments, ...blockedAppointments]}
        />
      )}
    </>
  );
}
