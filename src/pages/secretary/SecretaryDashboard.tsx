import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { NavDropdown } from '../../components/layout/NavDropdown';
import { NotificationsPage } from '../NotificationsPage';
import { SecretaryAdminArea } from './SecretaryAdminArea';
import { WeeklySchedule } from '../../components/secretary/WeeklySchedule';
import { TodayAppointments } from '../../components/secretary/TodayAppointments';
import { HistoryPage } from '../HistoryPage';
import { DocumentsSearchPage } from './DocumentsSearchPage';
import { SecretaryRequisitionsPage } from './SecretaryRequisitionsPage';
import SecretaryHome from '../../components/secretary/SecretaryHome';
import { AppointmentDialog } from '../../components/secretary/AppointmentDialog';
import { AppointmentDetailsDialog } from '../../components/secretary/AppointmentDetailsDialog';
import { DayScheduleDialog } from '../../components/secretary/DayScheduleDialog';
import { Sidebar } from '../../components/layout/Sidebar';
import { BlockedScheduleDialog } from '../../components/dialogs/BlockedScheduleDialog';
import { UserManagement } from '../../components/secretary/UserManagement';
import { ProfilePage, getProfileDraftStorageKey } from '../ProfilePage';
import { SettingsPage } from '../SettingsPage';
import { ClockIcon } from '../../components/shared/CustomIcons';
import { ReportsPage } from './ReportsPage';
import { CandidaturasByTypePage } from '../candidaturas/CandidaturasByTypePage';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { marcacoesApi } from '../../services/api';
import { Appointment, ViewType } from '../../types';
import { mapApiToAppointment, getCurrentActivity } from '../../utils/appointmentUtils';
import { useNotifications } from '../../hooks/useNotifications';
import { useSlidingWindowAppointments } from '../../hooks/useSlidingWindowAppointments';
import { usePersistentState } from '../../hooks/usePersistentState';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
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
import { CandidaturaDetailPage } from '../candidaturas/CandidaturaDetailPage';

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

export function SecretaryDashboard({ user, onLogout, isDarkMode, onToggleDarkMode }: SecretaryDashboardProps) {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  const candidaturaDetailMatch = location.pathname.match(/^\/dashboard\/(creche|catl|erpi)\/([^/]+)$/i);
  const isCandidaturaDetailView = Boolean(candidaturaDetailMatch);

  const {
    appointments,
    loadingWeeks,
    loadWeekAppointments,
    refreshCurrentWeek,
    updateAppointmentOptimistically,
    getWeekKeyByDate
  } = useSlidingWindowAppointments('SECRETARIA');

  // Stable wrapper for refreshCurrentWeek (it takes a Date, but onRefreshNeeded takes no args)
  const handleRefreshFromNotification = useCallback(() => {
    refreshCurrentWeek(new Date());
  }, [refreshCurrentWeek]);

  // Custom Hooks
  const {
    notifications,
    unreadCount,
    carregarNotificacoes,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDeleteNotification,
    handleDeleteAllNotifications
  } = useNotifications(authUser?.email, handleRefreshFromNotification);

  // Component States
  const [historyAppointments, setHistoryAppointments] = useState<Appointment[]>([]);
  const [historyStartDate, setHistoryStartDate] = useState<Date | null>(null);
  const [historyEndDate, setHistoryEndDate] = useState<Date>(() => {
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

  const [currentDate, setCurrentDate] = useState(() => {
    const saved = sessionStorage.getItem('secretary_currentDate');
    return saved ? new Date(saved) : new Date();
  });

  // Persist current week view across reloads
  useEffect(() => {
    sessionStorage.setItem('secretary_currentDate', currentDate.toISOString());
  }, [currentDate]);
  const [viewHistory, setViewHistory] = usePersistentState<ViewType[]>(
    'secretaryDashboardViewHistory',
    () => {
      const legacySaved = localStorage.getItem('secretaryDashboardView');
      return legacySaved ? [legacySaved as ViewType] : ['home'];
    }
  );

  const currentView = viewHistory[viewHistory.length - 1] || 'home';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [highlightedNotificationId, setHighlightedNotificationId] = useState<string | null>(null);
  const [highlightedSlot, setHighlightedSlot] = useState<{ date: Date; time: string } | null>(null);
  const [blockRefreshTrigger, setBlockRefreshTrigger] = useState(0);

  const [profileIsDirty, setProfileIsDirty] = useState(false);
  const [requisitionsIsDirty, setRequisitionsIsDirty] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<ViewType | null>(null);

  const handleProfileDirtyChange = useCallback((isDirty: boolean) => {
    setProfileIsDirty(isDirty);
  }, []);

  const handleRequisitionsDirtyChange = useCallback((isDirty: boolean) => {
    setRequisitionsIsDirty(isDirty);
  }, []);

  const navigateTo = (view: ViewType) => {
    const isProfileDirty = currentView === 'profile' && profileIsDirty;
    const isRequisitionsDirty = ['requisitions', 'requisitions-create', 'material', 'manutencao', 'transportes', 'urgente'].includes(currentView) && requisitionsIsDirty;

    if ((isProfileDirty || isRequisitionsDirty) && view !== currentView) {
      setPendingNavigation(view);
      setShowLeaveConfirm(true);
    } else {
      setViewHistory(prev => [...prev, view]);
    }
  };

  const confirmLeave = () => {
    if (currentView === 'profile') {
      sessionStorage.removeItem(getProfileDraftStorageKey(authUser?.id || 0));
      setProfileIsDirty(false);
    } else {
      setRequisitionsIsDirty(false);
    }

    setShowLeaveConfirm(false);
    if (pendingNavigation) {
      setViewHistory(prev => [...prev, pendingNavigation]);
      setPendingNavigation(null);
    }
  };

  const navigateBack = () => {
    setViewHistory(prev => (prev.length > 1 ? prev.slice(0, -1) : ['home']));
  };

  const currentWeekKey = getWeekKeyByDate(currentDate);
  const isCurrentWeekLoading = loadingWeeks[currentWeekKey] || false;

  const carregarHistorico = async () => {
    try {
      const start = historyStartDate;
      const end = historyEndDate;
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      const startOfDay = start ? new Date(start) : new Date('2000-01-01');
      startOfDay.setHours(0, 0, 0, 0);

      const data = await marcacoesApi.obterPassadas(
        format(startOfDay, "yyyy-MM-dd'T'HH:mm:ss"),
        format(endOfDay, "yyyy-MM-dd'T'HH:mm:ss")
      );
      setHistoryAppointments((Array.isArray(data) ? data : []).map(mapApiToAppointment));
    } catch (error) {
      toast.error('Erro ao carregar histórico');
    }
  };

  useEffect(() => {
    if (currentView === 'history') carregarHistorico();
  }, [currentView, historyStartDate, historyEndDate]);

  // Sliding Window Main Effect
  useEffect(() => {
    if (authLoading || !authUser?.id) return;
    loadWeekAppointments(currentDate, { setCurrent: true });

    // Preload surrounds
    const preDate = new Date(currentDate);
    const nextDate = new Date(currentDate);
    preDate.setDate(preDate.getDate() - 7);
    nextDate.setDate(nextDate.getDate() + 7);
    loadWeekAppointments(preDate);
    loadWeekAppointments(nextDate);
  }, [authUser?.id, authLoading, currentDate, loadWeekAppointments]);

  useEffect(() => {
    if (currentView === 'appointments') refreshCurrentWeek(currentDate);
  }, [currentView, refreshCurrentWeek, currentDate]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentView === 'appointments') refreshCurrentWeek(currentDate);
      else if (currentView === 'history') carregarHistorico();
    }, 60000);
    return () => clearInterval(interval);
  }, [currentView, refreshCurrentWeek, currentDate]);

  const handleRefreshCurrentWeek = useCallback(async () => {
    await refreshCurrentWeek(currentDate);
  }, [refreshCurrentWeek, currentDate]);


  const handleCreateAppointment = async (date: Date, time: string) => {
    await refreshCurrentWeek(currentDate);
    setEditingAppointment({ date, time });
    setShowAppointmentDialog(true);
  };

  const handleViewAppointment = async (appointment: Appointment) => {
    if (appointment.status === 'reserved') return;

    try {
      const latestData = await marcacoesApi.obterPorId(parseInt(appointment.id));
      const freshAppointment = mapApiToAppointment(latestData);
      updateAppointmentOptimistically(freshAppointment.id, freshAppointment);
      setSelectedAppointment(freshAppointment);
      setShowDetailsDialog(true);
    } catch (error) {
      toast.error('Não foi possível carregar os dados mais recentes da marcação.');
      refreshCurrentWeek(currentDate);
    }
  };

  const handleCancelAppointment = (id: string, reason: string) => {
    updateAppointmentOptimistically(id, { status: 'cancelled', cancellationReason: reason });
    toast.success('Marcação cancelada e utente notificado com o motivo');
    refreshCurrentWeek(currentDate);
  };

  const handleUpdateUser = (updatedUser: { name: string; nif: string; contact: string; email: string }) => {
    setUserData(updatedUser);
  };



  const renderPlaceholder = (view: ViewType) => (
    <div className="flex items-center justify-center h-[600px]">
      <div className="text-center">
        <h2 className="text-2xl text-muted-foreground mb-2">
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
        <p className="text-muted-foreground">Em desenvolvimento</p>
      </div>
    </div>
  );

  const SecretaryNavigation = (
    <>
      <NavDropdown
        label={t('sidebar.requisitions')}
        items={[
          { id: 'requisitions', label: t('sidebar.requisitions') },
          { id: 'requisitions-create', label: t('sidebar.createRequisition') },
        ]}
        isActive={['requisitions', 'requisitions-create', 'material', 'manutencao', 'transportes', 'urgente'].includes(currentView)}
        onSelect={(id) => navigateTo(id as ViewType)}
        onLabelClick={() => navigateTo('requisitions')}
      />

      <NavDropdown
        label={t('sidebar.services')}
        items={[
          { id: 'balneario', label: t('sidebar.balneario') },
          { id: 'escola', label: t('sidebar.school') },
        ]}
        isActive={['valencias', 'balneario', 'escola'].includes(currentView)}
        onSelect={(id) => navigateTo(id as ViewType)}
        className="hidden lg:block"
      />

      <Button
        variant={currentView === 'appointments' ? 'default' : 'ghost'}
        onClick={() => navigateTo('appointments')}
        className={`text-sm ${currentView === 'appointments' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'text-foreground hover:bg-primary/10 hover:text-primary'}`}
      >
        {t('sidebar.appointments')}
      </Button>

      <NavDropdown
        label={t('sidebar.applications')}
        items={[
          { id: 'creche', label: t('sidebar.creche') },
          { id: 'catl', label: 'CATL' },
          { id: 'erpi', label: 'ERPI' },
        ]}
        isActive={['candidaturas', 'creche', 'catl', 'erpi'].includes(currentView)}
        onSelect={(id) => navigateTo(id as ViewType)}
        className="hidden lg:block"
      />

      <Button
        variant={currentView === 'reports' ? 'default' : 'ghost'}
        onClick={() => navigateTo('reports')}
        className={`text-sm hidden lg:inline-flex ${currentView === 'reports' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'text-foreground hover:bg-primary/10 hover:text-primary'}`}
      >
        {t('sidebar.reports')}
      </Button>

      <NavDropdown
        label={t('sidebar.management')}
        items={[
          { id: 'management', label: t('userManagement.title') },
          { id: 'admin-area', label: t('userManagement.title2') },
        ]}
        isActive={['management', 'admin-area'].includes(currentView)}
        onSelect={(id) => navigateTo(id as ViewType)}
        onLabelClick={() => navigateTo('management')}
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
        roleTitle={t('dashboard.secretary')}
        navigationContent={SecretaryNavigation}
        onNavigateToProfile={() => navigateTo('profile')}
        onNavigateToSettings={() => navigateTo('settings')}
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
          navigateTo('notificacoes');
          setShowNotifications(false);
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {isCandidaturaDetailView ? (
              <CandidaturaDetailPage />
            ) : currentView === 'home' ? (
              <SecretaryHome
                isDarkMode={isDarkMode}
                onNavigate={navigateTo}
                notifications={notifications}
              />
            ) : currentView === 'appointments' ? (
              <>
                <div className="grid lg:grid-cols-[1fr_380px] gap-6 max-w-[1600px] mx-auto items-start">
                  <div className="space-y-6">
                    <WeeklySchedule
                      appointments={appointments}
                      allAppointments={appointments}
                      currentUserNif=""
                      isClient={false}
                      onCreateAppointment={handleCreateAppointment}
                      onViewAppointment={handleViewAppointment}
                      onToggleView={() => { }}
                      isDarkMode={isDarkMode}
                      onRefresh={handleRefreshCurrentWeek}
                      onBlockSchedule={() => setShowBlockedDialog(true)}
                      onDateChange={setCurrentDate}
                      currentDate={currentDate}
                      isLoading={isCurrentWeekLoading}
                      appointmentType="SECRETARIA"
                      highlightedSlot={highlightedSlot}
                      refreshTrigger={blockRefreshTrigger}
                    />
                  </div>
                  <div className="space-y-6 lg:sticky lg:top-24">
                    <TodayAppointments
                      appointments={appointments}
                      onViewAppointment={handleViewAppointment}
                      onShowHistory={() => navigateTo('history')}
                      onShowDocumentSearch={() => navigateTo('documents-search')}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                </div>

                <div className="mt-6 max-w-[1600px] mx-auto bg-card backdrop-blur-sm rounded-lg p-4 shadow-lg border-l-4 border-primary">
                  <div className="flex items-center gap-3">
                    <ClockIcon className="w-5 h-5 text-primary" />
                    <p className="text-foreground">{getCurrentActivity(appointments, true)}</p>
                  </div>
                </div>
              </>
            ) : currentView === 'history' ? (
              <HistoryPage
                appointments={historyAppointments}
                onBack={navigateBack}
                onViewAppointment={handleViewAppointment}
                isDarkMode={isDarkMode}
                startDate={historyStartDate}
                endDate={historyEndDate}
                onDateChange={(start, end) => {
                  setHistoryStartDate(start);
                  setHistoryEndDate(end);
                }}
              />
            ) : currentView === 'documents-search' ? (
              <DocumentsSearchPage
                onBack={navigateBack}
                isDarkMode={isDarkMode}
              />
            ) : ['requisitions', 'requisitions-create', 'material', 'manutencao', 'transportes', 'urgente'].includes(currentView) ? (
              <SecretaryRequisitionsPage
                isDarkMode={isDarkMode}
                currentUserId={authUser?.id || 0}
                initialSection={currentView === 'requisitions-create' ? 'create' : 'list'}
                initialTipo={
                  currentView === 'material'
                    ? 'MATERIAL'
                    : currentView === 'manutencao'
                      ? 'MANUTENCAO'
                      : currentView === 'transportes'
                        ? 'TRANSPORTE'
                        : undefined
                }
                initialPrioridade={currentView === 'urgente' ? 'URGENTE' : undefined}
                onDirtyChange={handleRequisitionsDirtyChange}
              />
            ) : currentView === 'management' ? (
              <UserManagement
                isDarkMode={isDarkMode}
              />
            ) : currentView === 'admin-area' ? (
              <div className="py-8">
                <SecretaryAdminArea />
              </div>
            ) : currentView === 'profile' ? (
              <ProfilePage
                user={{ id: authUser?.id || 0, ...userData }}
                onBack={navigateBack}
                onUpdateUser={handleUpdateUser}
                isDarkMode={isDarkMode}
                onDirtyChange={handleProfileDirtyChange}
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
                onMarkAsRead={(id) => handleMarkAsRead(Number(id))}
                onMarkAllAsRead={handleMarkAllAsRead}
                onDelete={(id) => handleDeleteNotification(Number(id))}
                onDeleteAll={handleDeleteAllNotifications}
                isDarkMode={isDarkMode}
                highlightedNotificationId={highlightedNotificationId || undefined}
                actionCallbacks={{
                  onNavigateToAppointment: async (appointmentId) => {
                    navigateTo('appointments');
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
                    navigateTo('history');
                    setShowNotifications(false);
                  },
                  onNavigateToDocument: () => toast.info('A funcionalidade de visualização de documentos está em desenvolvimento.'),
                  onNavigateToCancelledSlot: (dateStr, time) => {
                    navigateTo('appointments');
                    setShowNotifications(false);
                    const slotDate = new Date(dateStr);
                    setCurrentDate(slotDate);
                    setHighlightedSlot({ date: slotDate, time });
                    setTimeout(() => setHighlightedSlot(null), 5000);
                  },
                }}
              />
            ) : currentView === 'reports' ? (
              <ReportsPage />
            ) : ['creche', 'catl', 'erpi'].includes(currentView) ? (
              <CandidaturasByTypePage
                mode="secretaria"
                candidaturaType={currentView}
                currentUserName={userData.name}
              />
            ) : currentView === 'settings' ? (
              <SettingsPage 
                isDarkMode={isDarkMode}
                onToggleDarkMode={onToggleDarkMode}
              />
            ) : (
              renderPlaceholder(currentView)
            )}
          </motion.div>
        </AnimatePresence>
      </DashboardLayout>

      {/* Overlays */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentView={currentView}
        onNavigate={navigateTo}
        onLogout={onLogout}
        isDarkMode={isDarkMode}
        mode="secretaria"
      />

      {showAppointmentDialog && editingAppointment && authUser?.id && (
        <AppointmentDialog
          open={showAppointmentDialog}
          onClose={() => {
            setShowAppointmentDialog(false);
            setEditingAppointment(null);
          }}
          date={editingAppointment.date}
          time={editingAppointment.time}
          funcionarioId={authUser.id}
          onSuccess={() => {
            refreshCurrentWeek(currentDate);
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
            refreshCurrentWeek(currentDate);
          }}
          appointment={selectedAppointment}
          onUpdate={(id, updates) => {
            updateAppointmentOptimistically(id, updates);
            refreshCurrentWeek(currentDate);
          }}
          onCancel={handleCancelAppointment}
          isClient={false}
          existingAppointments={appointments}
        />
      )}

      {showDaySchedule && (
        <DayScheduleDialog
          open={true}
          onClose={() => setShowDaySchedule(null)}
          date={showDaySchedule}
          appointments={appointments}
          onCreateAppointment={handleCreateAppointment}
          onViewAppointment={handleViewAppointment}
          appointmentType="SECRETARIA"
        />
      )}

      {showBlockedDialog && (
        <BlockedScheduleDialog
          open={showBlockedDialog}
          onOpenChange={setShowBlockedDialog}
          appointments={appointments}
          tipo="SECRETARIA"
          onSuccess={() => {
            refreshCurrentWeek(currentDate);
            setBlockRefreshTrigger(prev => prev + 1);
          }}
        />
      )}

      <AlertDialog open={showLeaveConfirm} onOpenChange={(open) => { if (!open) setShowLeaveConfirm(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterações por guardar</AlertDialogTitle>
            <AlertDialogDescription>
              Tem mudanças por guardar. Deseja descartá-las?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setPendingNavigation(null); setShowLeaveConfirm(false); }}>Ficar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeave} className="bg-destructive hover:bg-destructive/90 text-white">
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}