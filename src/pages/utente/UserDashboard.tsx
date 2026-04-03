import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Button } from '../../components/ui/button';
import { NavDropdown } from '../../components/layout/NavDropdown';
import { NotificationsPage } from '../NotificationsPage';
import { Sidebar } from '../../components/layout/Sidebar';
import { WeeklySchedule } from '../../components/secretary/WeeklySchedule';
import { TodayAppointments } from '../../components/secretary/TodayAppointments';
import { UserCandidaturas } from './UserCandidaturas';
import { HistoryPage } from '../HistoryPage';
import { ProfilePage, getProfileDraftStorageKey } from '../ProfilePage';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(user);

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
  const [profileIsDirty, setProfileIsDirty] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const handleProfileDirtyChange = (isDirty: boolean) => {
    setProfileIsDirty(isDirty);
  };
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
        startIsoString = format(s, "yyyy-MM-dd'T'HH:mm:ss");
      }
      const data = await marcacoesApi.obterPassadas(startIsoString, format(endOfDay, "yyyy-MM-dd'T'HH:mm:ss"), authUser.id);
      setHistoryAppointments(data.map(mapApiToAppointment));
    } catch (error) {
      toast.error('Erro ao carregar histórico');
    }
  };

  useEffect(() => {
    if (getCurrentView() === 'history') carregarHistorico();
  }, [location.pathname, historyStartDate, historyEndDate, authUser?.id]);

  useEffect(() => {
    setUserData({
      name: authUser?.nome || user.name,
      nif: authUser?.nif || user.nif,
      contact: authUser?.telefone || user.contact,
      email: authUser?.email || user.email,
    });
  }, [authUser?.email, authUser?.nif, authUser?.nome, authUser?.telefone, user]);


  const visibleAppointments = useMemo(
    () => allAppointments.filter((apt) => apt.patientNIF === userData.nif),
    [allAppointments, userData.nif]
  );

  const handleUpdateUser = (updatedUser: { name: string; nif: string; contact: string; email: string }) => {
    setUserData(updatedUser);
  };

  const navigateWithGuard = (path: string) => {
    if (currentView === 'profile' && profileIsDirty && path !== '/dashboard/profile') {
      setPendingPath(path);
      setShowLeaveConfirm(true);
      return;
    }

    navigate(path);
  };

  const confirmLeaveProfile = () => {
    const nextPath = pendingPath;
    const draftStorageKey = getProfileDraftStorageKey(authUser?.id || 0);

    setProfileIsDirty(false);
    setShowLeaveConfirm(false);
    setPendingPath(null);

    if (nextPath) {
      navigate(nextPath);
    }

    // Remove draft after navigation to avoid being recreated by the profile page
    // effect while it is still mounted during the transition.
    requestAnimationFrame(() => {
      sessionStorage.removeItem(draftStorageKey);
    });
  };

  const handleNavigate = (view: string) => {
    if (view === 'appointments') navigateWithGuard('/dashboard');
    else if (view === 'history') navigateWithGuard('/dashboard/history');
    else if (view === 'profile') navigateWithGuard('/dashboard/profile');
    else if (view === 'notificacoes') navigateWithGuard('/dashboard/notifications');
    else navigateWithGuard(`/dashboard/${view}`);
  };

  const handleCreateAppointment = async (date: Date, time: string) => {
    await refreshAppointments();
    setEditingSlot({ date, time });
    setShowClientDialog(true);
  };

  const handleViewAppointment = async (appointment: Appointment) => {
    // Sempre atualizar primeiro, antes de qualquer ação
    await refreshAppointments();
    try {
      const latestData = await marcacoesApi.obterPorId(parseInt(appointment.id));
      const dateTime = new Date(latestData.data);
      const utente = latestData.marcacaoSecretaria?.utente;
      const isOwn = utente?.nif === userData.nif || appointment.patientNIF === userData.nif;

      const status = mapStatusFromApiToUi(latestData.estado);

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

  const currentActivity = getCurrentActivity(visibleAppointments, false);

  const UserNavigation = (
    <>
      <Button
        variant={currentView === 'appointments' ? 'default' : 'ghost'}
        onClick={() => navigateWithGuard('/dashboard')}
        className={`text-sm ${currentView === 'appointments' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-gray-700 dark:text-gray-200'}`}
      >
        {t('sidebar.secretary')}
      </Button>

      <NavDropdown
        label={t('sidebar.applications')}
        items={[
          { id: 'creche', label: t('sidebar.creche') },
          { id: 'catl', label: 'CATL' },
          { id: 'erpi', label: 'ERPI' },
        ]}
        isActive={['candidaturas', 'creche', 'catl', 'erpi'].includes(currentView)}
        onSelect={(id) => navigateWithGuard(`/dashboard/${id}`)}
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
        onNavigateToProfile={() => navigateWithGuard('/dashboard/profile')}
        onNavigateToSettings={() => navigateWithGuard('/dashboard/settings')}
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
          navigateWithGuard('/dashboard/notifications');
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

              {/* Candidaturas */}
              <Route path="/creche" element={
                <UserCandidaturas
                  user={userData}
                  onLogout={onLogout}
                  isDarkMode={isDarkMode}
                  onToggleDarkMode={onToggleDarkMode}
                  candidaturaType="CRECHE"
                />
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
                    ...userData,
                  }}
                  onBack={() => navigate('/dashboard')}
                  onUpdateUser={handleUpdateUser}
                  isDarkMode={isDarkMode}
                  onDirtyChange={handleProfileDirtyChange}
                />
              } />

              {/* Notifications */}
              <Route path="/notifications" element={
                <NotificationsPage
                  notifications={notifications.map(n => ({
                    id: n.id?.toString() || Math.random().toString(),
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
                      setCurrentDate(slotDate);
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

      <AlertDialog open={showLeaveConfirm} onOpenChange={(open) => {
        if (!open) {
          setPendingPath(null);
          setShowLeaveConfirm(false);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterações por guardar</AlertDialogTitle>
            <AlertDialogDescription>
              Tem mudanças por guardar. Deseja descartá-las?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPendingPath(null);
              setShowLeaveConfirm(false);
            }}>
              Ficar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeaveProfile} className="bg-red-600 hover:bg-red-700 text-white">
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
