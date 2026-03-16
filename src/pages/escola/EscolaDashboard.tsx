import { DashboardLayout } from '../../components/layout/DashboardLayout';

interface EscolaDashboardProps {
    onLogout: () => void;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
}

export function EscolaDashboard({ isDarkMode, onToggleDarkMode, onLogout }: EscolaDashboardProps) {
    return (
        <DashboardLayout
            isDarkMode={isDarkMode}
            onToggleDarkMode={onToggleDarkMode}
            onLogout={onLogout}
            roleTitle="Escola"
            navigationContent={<div className="text-gray-500 p-4">Menu Em Desenvolvimento</div>}
            onMenuToggle={() => { }}
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
