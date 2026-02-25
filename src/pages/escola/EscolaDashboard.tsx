import { DashboardLayout } from '../../components/layout/DashboardLayout';

export function EscolaDashboard({ isDarkMode, onToggleDarkMode, onLogout }: any) {
    return (
        <DashboardLayout
            isDarkMode={isDarkMode}
            onToggleDarkMode={onToggleDarkMode}
            onLogout={onLogout}
            roleTitle="Escola"
            navigationContent={<div className="text-gray-500 p-4">Menu Em Desenvolvimento</div>}
            onMenuToggle={() => { }}
            notifications={[]}
            unreadCount={0}
            showNotifications={false}
            onToggleNotifications={() => { }}
            onMarkAsRead={() => { }}
        >
            <div className="flex items-center justify-center h-[500px]">
                <div className="text-center">
                    <h2 className="text-2xl text-gray-600 dark:text-gray-300 mb-2">Painel Escola</h2>
                    <p className="text-gray-500">Em desenvolvimento</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
