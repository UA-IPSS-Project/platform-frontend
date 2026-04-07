import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Sidebar } from '../../components/layout/Sidebar';
import { NavDropdown } from '../../components/layout/NavDropdown';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { NotificationsPage } from '../NotificationsPage';
import { ProfilePage, getProfileDraftStorageKey } from '../ProfilePage';
import BalnearioHome from '../../components/balneario/BalnearioHome';
import { WeeklySchedule } from '../../components/secretary/WeeklySchedule';
import { TodayAppointments } from '../../components/secretary/TodayAppointments';
import { DayScheduleDialog } from '../../components/secretary/DayScheduleDialog';
import { BlockedScheduleDialog } from '../../components/dialogs/BlockedScheduleDialog';
import { BalnearioAppointmentDialog } from '../../components/balneario/BalnearioAppointmentDialog';
import { BalnearioAppointmentDetailsDialog } from '../../components/balneario/BalnearioAppointmentDetailsDialog';
import { ClockIcon } from '../../components/shared/CustomIcons';
import { Loader2 } from 'lucide-react';
import { HistoryPage } from '../HistoryPage';
import { BalnearioRequisitionsPage } from './BalnearioRequisitionsPage';
import { BalnearioConsumosPage } from '../../components/balneario/BalnearioConsumosPage';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { marcacoesApi } from '../../services/api';
import { Appointment, ViewType } from '../../types';
import { mapApiToAppointment, getCurrentActivity } from '../../utils/appointmentUtils';
import { useNotifications } from '../../hooks/useNotifications';
import { useSlidingWindowAppointments } from '../../hooks/useSlidingWindowAppointments';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useTranslation } from 'react-i18next';
import { QuickAttendanceModal } from '../../components/balneario/QuickAttendanceModal';
import { armazemApi, ConsumoEstatisticaDTO } from '../../services/api/armazem/armazemApi';
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

interface BalnearioDashboardProps {
    onLogout: () => void;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
}

export function BalnearioDashboard({ onLogout, isDarkMode, onToggleDarkMode }: BalnearioDashboardProps) {
    const { user: authUser } = useAuth();
    const { t } = useTranslation();
    const [userData, setUserData] = useState({
        name: authUser?.nome || '',
        nif: authUser?.nif || '',
        contact: authUser?.telefone || '',
        email: authUser?.email || ''
    });

    const {
        appointments,
        loadingWeeks,
        loadWeekAppointments,
        refreshCurrentWeek,
        updateAppointmentOptimistically,
        getWeekKeyByDate
    } = useSlidingWindowAppointments('BALNEARIO');

    // Stable wrapper for refreshCurrentWeek
    const handleRefreshFromNotification = useCallback(() => {
        refreshCurrentWeek(new Date());
    }, [refreshCurrentWeek]);

    const {
        notifications,
        unreadCount,
        carregarNotificacoes,
        handleMarkAsRead,
        handleMarkAllAsRead,
        handleDeleteNotification,
        handleDeleteAllNotifications
    } = useNotifications(authUser?.email, handleRefreshFromNotification);

    const [historyAppointments, setHistoryAppointments] = useState<Appointment[]>([]);
    const [historyStartDate, setHistoryStartDate] = useState<Date | null>(null);
    const [historyEndDate, setHistoryEndDate] = useState<Date>(() => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        return futureDate;
    });

    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [showBlockedDialog, setShowBlockedDialog] = useState(false);
    const [showDaySchedule, setShowDaySchedule] = useState<Date | null>(null);
    const [editingAppointment, setEditingAppointment] = useState<{ date: Date; time: string } | null>(null);
    const [currentDate, setCurrentDate] = useState(() => {
        const saved = sessionStorage.getItem('balneario_currentDate');
        return saved ? new Date(saved) : new Date();
    });

    // Persist current week view across reloads
    useEffect(() => {
        sessionStorage.setItem('balneario_currentDate', currentDate.toISOString());
    }, [currentDate]);

    const [viewHistory, setViewHistory] = usePersistentState<ViewType[]>(
        'balnearioDashboardViewHistory',
        () => {
            const legacySaved = localStorage.getItem('balnearioDashboardView');
            return legacySaved ? [legacySaved as ViewType] : ['home'];
        }
    );

    const currentView = viewHistory[viewHistory.length - 1] || 'home';
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [highlightedNotificationId, setHighlightedNotificationId] = useState<string | null>(null);
    const [highlightedSlot, setHighlightedSlot] = useState<{ date: Date; time: string } | null>(null);
    const [profileIsDirty, setProfileIsDirty] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<ViewType | null>(null);
    const [showQuickAttendance, setShowQuickAttendance] = useState(false);
    const [statsData, setStatsData] = useState<ConsumoEstatisticaDTO | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    const handleProfileDirtyChange = useCallback((isDirty: boolean) => {
        setProfileIsDirty(isDirty);
    }, []);

    const [requisitionsIsDirty, setRequisitionsIsDirty] = useState(false);
    const handleRequisitionsDirtyChange = useCallback((isDirty: boolean) => {
        setRequisitionsIsDirty(isDirty);
    }, []);
    const [blockRefreshTrigger, setBlockRefreshTrigger] = useState(0);

    const currentWeekKey = getWeekKeyByDate(currentDate);
    const isCurrentWeekLoading = loadingWeeks[currentWeekKey] || false;

    const navigateTo = (view: ViewType) => {
        const isProfileDirty = currentView === 'profile' && profileIsDirty;
        const isRequisitionsDirty = (currentView === 'requisitions' || currentView === 'requisitions-create') && requisitionsIsDirty;

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

    const carregarHistorico = async () => {
        try {
            const end = historyEndDate;
            const endOfDay = new Date(end);
            endOfDay.setHours(23, 59, 59, 999);
            const startOfDay = historyStartDate ? new Date(historyStartDate) : new Date('2000-01-01');
            startOfDay.setHours(0, 0, 0, 0);

            const data = await marcacoesApi.obterPassadas(
                format(startOfDay, "yyyy-MM-dd'T'HH:mm:ss"),
                format(endOfDay, "yyyy-MM-dd'T'HH:mm:ss")
            );
            const mapped = (Array.isArray(data) ? data : []).map(mapApiToAppointment);
            setHistoryAppointments(mapped.filter(a => a.balnearioDetails !== undefined));
        } catch {
            toast.error('Erro ao carregar histórico');
        }
    };

    const carregarEstatisticas = async () => {
        setLoadingStats(true);
        try {
            const data = await armazemApi.obterEstatisticas('MES');
            setStatsData(data);
        } catch {
            toast.error('Erro ao carregar estatísticas');
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        if (currentView === 'history') carregarHistorico();
        if (currentView === 'reports') carregarEstatisticas();
    }, [currentView, historyStartDate, historyEndDate]);

    useEffect(() => {
        if (!authUser?.id) return;
        loadWeekAppointments(currentDate, { setCurrent: true });

        const preDate = new Date(currentDate);
        const nextDate = new Date(currentDate);
        preDate.setDate(preDate.getDate() - 7);
        nextDate.setDate(nextDate.getDate() + 7);
        loadWeekAppointments(preDate);
        loadWeekAppointments(nextDate);
    }, [authUser?.id, currentDate, loadWeekAppointments]);

    useEffect(() => {
        if (currentView === 'appointments') refreshCurrentWeek(currentDate);
    }, [currentView, refreshCurrentWeek, currentDate]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (currentView === 'appointments') refreshCurrentWeek(currentDate);
        }, 60000);
        return () => clearInterval(interval);
    }, [currentView, refreshCurrentWeek, currentDate]);

    const handleUpdateUser = (updatedUser: { name: string; nif: string; contact: string; email: string }) => {
        setUserData(updatedUser);
    };

    const handleRefreshCurrentWeek = useCallback(async () => {
        await refreshCurrentWeek(currentDate);
    }, [refreshCurrentWeek, currentDate]);

    const handleCreateAppointment = async (date: Date, time: string) => {
        await refreshCurrentWeek(currentDate);
        setEditingAppointment({ date, time });
        setShowAppointmentDialog(true);
    };

    const handleViewAppointment = async (appointment: Appointment) => {
        console.log('[DEBUG-BALNEARIO] handleViewAppointment triggered for appointment:', appointment);
        if (appointment.status === 'reserved') {
            console.warn('[DEBUG-BALNEARIO] Appointment is reserved, returning early! Is this intended? Status is:', appointment.status);
            return;
        }

        try {
            console.log('[DEBUG-BALNEARIO] Fetching latest data for ID:', appointment.id);
            const latestData = await marcacoesApi.obterPorId(parseInt(appointment.id));
            console.log('[DEBUG-BALNEARIO] Latest data received:', latestData);
            const freshAppointment = mapApiToAppointment(latestData);
            console.log('[DEBUG-BALNEARIO] freshAppointment mapping:', freshAppointment);
            
            updateAppointmentOptimistically(freshAppointment.id, freshAppointment);
            setSelectedAppointment(freshAppointment);
            setShowDetailsDialog(true);
            console.log('[DEBUG-BALNEARIO] Details dialog state set to TRUE.');
        } catch (error) {
            console.error('[DEBUG-BALNEARIO] Error fetching latest appointment data:', error);
            toast.error('Não foi possível carregar os dados mais recentes da marcação.');
            refreshCurrentWeek(currentDate);
        }
    };

    const handleCancelAppointment = (id: string, reason: string) => {
        updateAppointmentOptimistically(id, { status: 'cancelled', cancellationReason: reason });
        toast.success('Marcação cancelada com sucesso');
        refreshCurrentWeek(currentDate);
    };

    const renderPlaceholder = (view: ViewType) => (
        <div className="flex items-center justify-center h-[600px]">
            <div className="text-center">
                <h2 className="text-2xl text-muted-foreground mb-2">
                    {view === 'requisitions' && 'Requisições'}
                    {view === 'appointments' && 'Marcações'}
                    {view === 'consumos' && 'Consumos'}
                    {view === 'reports' && 'Relatórios'}
                    {view === 'settings' && 'Definições'}
                    {view === 'administrative' && 'Área Administrativa'}
                    {!['home', 'requisitions', 'appointments', 'consumos', 'settings', 'profile', 'notificacoes', 'reports', 'administrative'].includes(view) && view.charAt(0).toUpperCase() + view.slice(1)}
                </h2>
                <p className="text-muted-foreground">Página em desenvolvimento</p>
            </div>
        </div>
    );

    const BalnearioNavigation = (
        <>
            <Button
                variant={currentView === 'appointments' ? 'default' : 'ghost'}
                onClick={() => navigateTo('appointments')}
                className={`text-sm ${currentView === 'appointments' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'text-foreground hover:bg-primary/10 hover:text-primary'}`}
            >
                {t('sidebar.appointments')}
            </Button>

            <Button
                variant={currentView === 'consumos' ? 'default' : 'ghost'}
                onClick={() => navigateTo('consumos')}
                className={`text-sm ${currentView === 'consumos' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'text-foreground hover:bg-primary/10 hover:text-primary'}`}
            >
                {t('sidebar.consumption')}
            </Button>

            <NavDropdown
                label={t('sidebar.requisitions')}
                items={[
                    { id: 'requisitions', label: t('sidebar.requisitions') },
                    { id: 'requisitions-create', label: t('sidebar.createRequisition') },
                ]}
                isActive={['requisitions', 'requisitions-create'].includes(currentView)}
                onSelect={(id) => navigateTo(id as ViewType)}
                onLabelClick={() => navigateTo('requisitions')}
            />

            <Button
                variant={currentView === 'reports' ? 'default' : 'ghost'}
                onClick={() => navigateTo('reports')}
                className={`text-sm hidden lg:inline-flex ${currentView === 'reports' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'text-foreground hover:bg-primary/10 hover:text-primary'}`}
            >
                {t('sidebar.reports')}
            </Button>
        </>
    );

    return (
        <>
            <DashboardLayout
                isDarkMode={isDarkMode}
                onToggleDarkMode={onToggleDarkMode}
                onLogout={onLogout}
                onMenuToggle={() => setSidebarOpen(true)}
                roleTitle={t('dashboard.balneario')}
                navigationContent={BalnearioNavigation}
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
                        {currentView === 'home' ? (
                            <BalnearioHome
                                isDarkMode={isDarkMode}
                                onNavigate={navigateTo}
                                onQuickAttendance={() => setShowQuickAttendance(true)}
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
                                            onDateChange={setCurrentDate}
                                            currentDate={currentDate}
                                            isLoading={isCurrentWeekLoading}
                                            appointmentType="BALNEARIO"
                                            highlightedSlot={highlightedSlot}
                                            onBlockSchedule={() => setShowBlockedDialog(true)}
                                            refreshTrigger={blockRefreshTrigger}
                                        />
                                    </div>
                                    <div className="space-y-6 lg:sticky lg:top-24">
                                        <TodayAppointments
                                            appointments={appointments}
                                            onViewAppointment={handleViewAppointment}
                                            onShowHistory={() => navigateTo('history')}
                                            isDarkMode={isDarkMode}
                                            isBalneario={true}
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
                                notifications={notifications.map((n: any) => ({
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
                                    onNavigateToAppointment: async () => {
                                        navigateTo('appointments');
                                        setShowNotifications(false);
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
                        ) : currentView === 'requisitions' || currentView === 'requisitions-create' ? (
                            <BalnearioRequisitionsPage
                                isDarkMode={isDarkMode}
                                currentUserId={authUser?.id || 0}
                                initialSection={currentView === 'requisitions-create' ? 'create' : 'list'}
                                onDirtyChange={handleRequisitionsDirtyChange}
                            />
                        ) : currentView === 'consumos' ? (
                            <BalnearioConsumosPage isDarkMode={isDarkMode} />
                        ) : currentView === 'reports' ? (
                            <div className="max-w-[1200px] mx-auto flex items-center justify-center h-64 text-center">
                                <p className="text-xl text-muted-foreground">Página de relatórios vazia por enquanto.</p>
                            </div>
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
                mode="balneario"
            />

            {showAppointmentDialog && editingAppointment && authUser?.id && (
                <BalnearioAppointmentDialog
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
                <BalnearioAppointmentDetailsDialog
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
                    appointmentType="BALNEARIO"
                />
            )}

            {showBlockedDialog && (
                <BlockedScheduleDialog
                    open={showBlockedDialog}
                    onOpenChange={setShowBlockedDialog}
                    appointments={appointments}
                    tipo="BALNEARIO"
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

            {showQuickAttendance && authUser?.id && (
                <QuickAttendanceModal
                    isOpen={showQuickAttendance}
                    onClose={() => setShowQuickAttendance(false)}
                    onSuccess={() => {
                        refreshCurrentWeek(currentDate);
                        if (currentView === 'reports') carregarEstatisticas();
                    }}
                    funcionarioId={authUser.id}
                    isDarkMode={isDarkMode}
                />
            )}
        </>
    );
}
