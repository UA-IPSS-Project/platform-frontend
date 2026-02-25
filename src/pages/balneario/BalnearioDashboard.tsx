import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Sidebar } from '../../components/layout/Sidebar';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { NotificationsPage } from '../NotificationsPage';
import { ProfilePage } from '../ProfilePage';
import BalnearioHome from '../../components/balneario/BalnearioHome';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { ViewType } from '../../types';
import { useNotifications } from '../../hooks/useNotifications';

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
        notifications,
        unreadCount,
        carregarNotificacoes,
        handleMarkAsRead,
        handleMarkAllAsRead,
        handleDeleteNotification,
        handleDeleteAllNotifications
    } = useNotifications(authUser?.email);

    const [viewHistory, setViewHistory] = useState<ViewType[]>(() => {
        const saved = localStorage.getItem('balnearioDashboardView');
        return saved ? [saved as ViewType] : ['home'];
    });

    const currentView = viewHistory[viewHistory.length - 1] || 'home';
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [highlightedNotificationId, setHighlightedNotificationId] = useState<string | null>(null);

    const navigateTo = (view: ViewType) => {
        setViewHistory(prev => [...prev, view]);
    };

    const navigateBack = () => {
        setViewHistory(prev => (prev.length > 1 ? prev.slice(0, -1) : ['home']));
    };

    useEffect(() => {
        localStorage.setItem('balnearioDashboardView', currentView);
    }, [currentView]);

    const handleUpdateUser = (updatedUser: { name: string; nif: string; contact: string; email: string }) => {
        setUserData(updatedUser);
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
                                        navigateTo('reports'); // ou um de histórico
                                        setShowNotifications(false);
                                    },
                                    onNavigateToDocument: () => toast.info('A funcionalidade de visualização de documentos está em desenvolvimento.'),
                                    onNavigateToCancelledSlot: () => {
                                        navigateTo('appointments');
                                        setShowNotifications(false);
                                    },
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
        </>
    );
}
