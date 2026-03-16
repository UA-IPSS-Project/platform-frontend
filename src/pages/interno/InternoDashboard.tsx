import { DashboardLayout } from '../../components/layout/DashboardLayout';

interface InternoDashboardProps {
    onLogout: () => void;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
}

export function InternoDashboard({ isDarkMode, onToggleDarkMode, onLogout }: InternoDashboardProps) {
    return (
        <DashboardLayout
            isDarkMode={isDarkMode}
            onToggleDarkMode={onToggleDarkMode}
            onLogout={onLogout}
            roleTitle="Equipa Interna"
            navigationContent={<div className="text-gray-500 p-4">Menu Em Desenvolvimento</div>}
            onMenuToggle={() => { }}
        >
            <div className="flex items-center justify-center h-[500px]">
                <div className="text-center">
                    <h2 className="text-2xl text-gray-600 dark:text-gray-300 mb-2">Painel Interno</h2>
                    <p className="text-gray-500">Em desenvolvimento</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
