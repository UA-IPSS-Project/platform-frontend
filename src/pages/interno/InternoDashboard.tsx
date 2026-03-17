import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useTranslation } from 'react-i18next';

export function InternoDashboard({ isDarkMode, onToggleDarkMode, onLogout }: any) {
    const { t } = useTranslation();
    return (
        <DashboardLayout
            isDarkMode={isDarkMode}
            onToggleDarkMode={onToggleDarkMode}
            onLogout={onLogout}
            roleTitle={t('dashboard.internalTeam')}
            navigationContent={<div className="text-gray-500 p-4">{t('dashboard.menuInDevelopment')}</div>}
            onMenuToggle={() => { }}
            notifications={[]}
            unreadCount={0}
            showNotifications={false}
            onToggleNotifications={() => { }}
            onMarkAsRead={() => { }}
            onMarkAllAsRead={() => { }}
            onDeleteNotification={() => { }}
            onDeleteAllNotifications={() => { }}
            onNavigateToNotifications={() => { }}
        >
            <div className="flex items-center justify-center h-[500px]">
                <div className="text-center">
                    <h2 className="text-2xl text-gray-600 dark:text-gray-300 mb-2">{t('dashboard.internalPanel')}</h2>
                    <p className="text-gray-500">{t('dashboard.inDevelopment')}</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
