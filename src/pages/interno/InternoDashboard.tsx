import { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

interface InternoDashboardProps {
    onLogout: () => void;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
}

type InternoView = 'home' | 'profile' | 'settings';

export function InternoDashboard({ isDarkMode, onToggleDarkMode, onLogout }: InternoDashboardProps) {
    const [currentView, setCurrentView] = useState<InternoView>('home');

    const renderContent = () => {
        if (currentView === 'profile' || currentView === 'settings') {
            return (
                <div className="flex items-center justify-center h-[500px]">
                    <div className="text-center">
                        <h2 className="text-2xl text-gray-600 dark:text-gray-300 mb-2">
                            {currentView === 'profile' ? 'Perfil' : 'Definições'}
                        </h2>
                        <p className="text-gray-500">Em desenvolvimento</p>
                    </div>
                </div>
            );
        }
        return (
            <div className="flex items-center justify-center h-[500px]">
                <div className="text-center">
                    <h2 className="text-2xl text-gray-600 dark:text-gray-300 mb-2">Painel Interno</h2>
                    <p className="text-gray-500">Em desenvolvimento</p>
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout
            isDarkMode={isDarkMode}
            onToggleDarkMode={onToggleDarkMode}
            onLogout={onLogout}
            roleTitle="Equipa Interna"
            navigationContent={<div className="text-gray-500 p-4">Menu Em Desenvolvimento</div>}
            onMenuToggle={() => { }}
            onNavigateToProfile={() => setCurrentView('profile')}
            onNavigateToSettings={() => setCurrentView('settings')}
        >
            {renderContent()}
        </DashboardLayout>
    );
}
