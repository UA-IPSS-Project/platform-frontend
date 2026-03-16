import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Sidebar } from '../../components/layout/Sidebar';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { NotificationsPage } from '../NotificationsPage';
import { ProfilePage } from '../ProfilePage';
import BalnearioHome from '../../components/balneario/BalnearioHome';
import { WeeklySchedule } from '../../components/secretary/WeeklySchedule';
import { TodayAppointments } from '../../components/secretary/TodayAppointments';
import { DayScheduleDialog } from '../../components/secretary/DayScheduleDialog';
import { BlockedScheduleDialog } from '../../components/dialogs/BlockedScheduleDialog';
import { BalnearioAppointmentDialog } from '../../components/balneario/BalnearioAppointmentDialog';
import { BalnearioAppointmentDetailsDialog } from '../../components/balneario/BalnearioAppointmentDetailsDialog';
import { ClockIcon } from '../../components/shared/CustomIcons';
import { HistoryPage } from '../HistoryPage';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { marcacoesApi } from '../../services/api';
import { Appointment, ViewType } from '../../types';
import { mapApiToAppointment, getCurrentActivity } from '../../utils/appointmentUtils';
import { useNotifications } from '../../hooks/useNotifications';
import { useSlidingWindowAppointments } from '../../hooks/useSlidingWindowAppointments';

interface BalnearioDashboardProps {
    onLogout: () => void;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
}

export function BalnearioDashboard({ onLogout, isDarkMode, onToggleDarkMode }: BalnearioDashboardProps) {
    const { user: authUser } = useAuth();
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

    const [viewHistory, setViewHistory] = useState<ViewType[]>(() => {
        const saved = localStorage.getItem('balnearioDashboardView');
        return saved ? [saved as ViewType] : ['home'];
    });

    const currentView = viewHistory[viewHistory.length - 1] || 'home';
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [highlightedNotificationId, setHighlightedNotificationId] = useState<string | null>(null);
    const [highlightedSlot, setHighlightedSlot] = useState<{ date: Date; time: string } | null>(null);

    const currentWeekKey = getWeekKeyByDate(currentDate);
    const isCurrentWeekLoading = loadingWeeks[currentWeekKey] || false;

    const navigateTo = (view: ViewType) => {
        setViewHistory(prev => [...prev, view]);
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
                startOfDay.toISOString(),
                endOfDay.toISOString()
            );
            const mapped = (Array.isArray(data) ? data : []).map(mapApiToAppointment);
            setHistoryAppointments(mapped.filter(a => a.balnearioDetails !== undefined));
        } catch {
            toast.error('Erro ao carregar histórico');
        }
    };

    useEffect(() => {
        if (currentView === 'history') carregarHistorico();
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

    useEffect(() => {
        localStorage.setItem('balnearioDashboardView', currentView);
    }, [currentView]);

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
        toast.success('Marcação cancelada com sucesso');
        refreshCurrentWeek(currentDate);
    };

    const renderPlaceholder = (view: ViewType) => (
        <div className="flex items-center justify-center h-[600px]">
            <div className="text-center">
                <h2 className="text-2xl text-gray-600 dark:text-gray-400 mb-2">
                    {view === 'requisitions' && 'Requisições'}
                    {view === 'appointments' && 'Marcações'}
                    {view === 'consumos' && 'Consumos'}
                    {view === 'reports' && 'Relatórios'}
                    {view === 'settings' && 'Definições'}
                    {view === 'administrative' && 'Área Administrativa'}
                    {!['home', 'requisitions', 'appointments', 'consumos', 'settings', 'profile', 'notificacoes', 'reports', 'administrative'].includes(view) && view.charAt(0).toUpperCase() + view.slice(1)}
                </h2>
                <p className="text-gray-500 dark:text-gray-500">Página em desenvolvimento</p>
            </div>
        </div>
    );

    const BalnearioNavigation = (
        <>
            <Button
                variant={currentView === 'appointments' ? 'default' : 'ghost'}
                onClick={() => navigateTo('appointments')}
                className={`text-sm ${currentView === 'appointments' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-gray-700 dark:text-gray-200'}`}
            >
                Marcações
            </Button>

            <Button
                variant={currentView === 'consumos' ? 'default' : 'ghost'}
                onClick={() => navigateTo('consumos')}
                className={`text-sm ${currentView === 'consumos' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-gray-700 dark:text-gray-200'}`}
            >
                Consumos
            </Button>

            <Button
                variant={currentView === 'requisitions' ? 'default' : 'ghost'}
                onClick={() => navigateTo('requisitions')}
                className={`text-sm ${currentView === 'requisitions' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-gray-700 dark:text-gray-200'}`}
            >
                Requisições
            </Button>

            <Button
                variant={currentView === 'reports' ? 'default' : 'ghost'}
                onClick={() => navigateTo('reports')}
                className={`text-sm hidden lg:inline-flex ${currentView === 'reports' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-gray-700 dark:text-gray-200'}`}
            >
                Relatórios
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
                roleTitle="Balneário"
                navigationContent={BalnearioNavigation}
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

                                <div className="mt-6 max-w-[1600px] mx-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border-l-4 border-purple-600">
                                    <div className="flex items-center gap-3">
                                        <ClockIcon className="w-5 h-5 text-purple-600" />
                                        <p className="text-gray-800 dark:text-gray-200">{getCurrentActivity(appointments, true)}</p>
                                    </div>
                                </div>
                            </>
                        ) : currentView === 'profile' ? (
                            <ProfilePage
                                user={{ id: authUser?.id || 0, ...userData }}
                                onBack={navigateBack}
                                onUpdateUser={handleUpdateUser}
                                isDarkMode={isDarkMode}
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
                />
            )}

            {showBlockedDialog && (
                <BlockedScheduleDialog
                    open={showBlockedDialog}
                    onOpenChange={setShowBlockedDialog}
                    appointments={appointments}
                    tipo="BALNEARIO"
                    onSuccess={() => refreshCurrentWeek(currentDate)}
                />
            )}
        </>
    );
}
