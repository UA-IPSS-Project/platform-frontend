import { ReactNode, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { NotificationsPanel } from '../shared/NotificationsPanel';
import { BellIcon, MenuIcon, MoonIcon, SunIcon, LogOutIcon } from '../shared/CustomIcons';
import { Notificacao } from '../../services/api';

interface DashboardLayoutProps {
    children: ReactNode;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
    onLogout: () => void;
    onMenuToggle: () => void;
    roleTitle: string;
    // Navigation
    navigationContent?: ReactNode;
    // Notifications
    notifications: Notificacao[];
    unreadCount: number;
    showNotifications: boolean;
    onToggleNotifications: (show: boolean) => void;
    onMarkAsRead: (id: number) => void;
    onMarkAllAsRead: () => void;
    onDeleteNotification: (id: number) => void;
    onDeleteAllNotifications: () => void;
    onNavigateToNotifications: () => void;
}

export function DashboardLayout({
    children,
    isDarkMode,
    onToggleDarkMode,
    onLogout,
    onMenuToggle,
    roleTitle,
    navigationContent,
    notifications,
    unreadCount,
    showNotifications,
    onToggleNotifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onDeleteNotification,
    onDeleteAllNotifications,
    onNavigateToNotifications,
}: DashboardLayoutProps) {
    const notificationsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                onToggleNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onToggleNotifications]);

    return (
        <div className={isDarkMode ? 'dark' : ''}>
            <div className="min-h-screen relative bg-transparent transition-colors duration-200">
                <div className="relative">
                    {/* Header - Full Width */}
                    <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 relative z-10 sticky top-0">
                        <div className="px-6 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <img
                                    src={isDarkMode ? '/assets/LogoModoEscuro1.png' : '/assets/LogoSemTextoUltimo.png'}
                                    alt="Logo Florinhas do Vouga"
                                    className="h-10 w-auto object-contain"
                                />
                                <Button variant="ghost" size="icon" onClick={onMenuToggle} className="text-gray-700 dark:text-gray-200">
                                    <MenuIcon className="w-5 h-5" />
                                </Button>
                                <span className="text-gray-700 dark:text-gray-200 font-medium hidden sm:inline-block">
                                    {roleTitle}
                                </span>
                            </div>

                            {/* Central Navigation Area - Injected depending on role */}
                            <nav className="hidden md:flex items-center gap-1">
                                {navigationContent}
                            </nav>

                            <div className="flex items-center gap-2">
                                <div className="relative z-[10000]" ref={notificationsRef}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="relative text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        onClick={() => onToggleNotifications(!showNotifications)}
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
                                            onMarkAsRead={(id) => onMarkAsRead(parseInt(id))}
                                            onMarkAllAsRead={onMarkAllAsRead}
                                            onDelete={(id) => onDeleteNotification(parseInt(id))}
                                            onDeleteAll={onDeleteAllNotifications}
                                            onClose={() => onToggleNotifications(false)}
                                            onNavigateToPage={onNavigateToNotifications}
                                            onNotificationClick={() => {
                                                onNavigateToNotifications();
                                            }}
                                            isDarkMode={isDarkMode}
                                        />
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onToggleDarkMode}
                                    className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    aria-label="Alternar Tema"
                                >
                                    {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onLogout}
                                    className="text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                    aria-label="Terminar Sessão"
                                >
                                    <LogOutIcon className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </header>

                    {/* Main Content Area */}
                    <main className="w-full px-4 sm:px-6 py-6 pb-20 md:pb-6">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
