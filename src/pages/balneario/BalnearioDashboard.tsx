import { DashboardLayout } from '../../components/layout/DashboardLayout';

export function BalnearioDashboard({ isDarkMode, onToggleDarkMode, onLogout }: any) {
    return (
        <DashboardLayout
            isDarkMode={isDarkMode}
            onToggleDarkMode={onToggleDarkMode}
            onLogout={onLogout}
            roleTitle="Balneário"
            navigationContent={<div className="text-gray-500 p-4">Menu Em Desenvolvimento</div>}
            onMenuToggle={() => { }}
        >
            <div className="flex items-center justify-center h-[500px]">
                <div className="text-center">
                    <h2 className="text-2xl text-gray-600 dark:text-gray-300 mb-2">Painel de Balneário</h2>
                    <p className="text-gray-500">Em desenvolvimento</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
