import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ProfilePage } from '../ProfilePage';
import { useAuth } from '../../contexts/AuthContext';
import { usePersistentState } from '../../hooks/usePersistentState';

interface EscolaDashboardProps {
    onLogout: () => void;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
}

type EscolaView = 'home' | 'profile' | 'settings';

export function EscolaDashboard({ isDarkMode, onToggleDarkMode, onLogout }: EscolaDashboardProps) {
    const { user: authUser } = useAuth();
    const [currentView, setCurrentView] = usePersistentState<EscolaView>('escolaDashboardView', 'home');
    const [userData, setUserData] = useState({
        name: authUser?.nome || '',
        nif: authUser?.nif || '',
        contact: authUser?.telefone || '',
        email: authUser?.email || '',
    });

    useEffect(() => {
        setUserData({
            name: authUser?.nome || '',
            nif: authUser?.nif || '',
            contact: authUser?.telefone || '',
            email: authUser?.email || '',
        });
    }, [authUser?.email, authUser?.nif, authUser?.nome, authUser?.telefone]);

    const handleUpdateUser = (updatedUser: { name: string; nif: string; contact: string; email: string }) => {
        setUserData(updatedUser);
    };

    const renderContent = () => {
        if (currentView === 'profile') {
            return (
                <ProfilePage
                    user={{ id: authUser?.id || 0, ...userData }}
                    onBack={() => setCurrentView('home')}
                    onUpdateUser={handleUpdateUser}
                    isDarkMode={isDarkMode}
                />
            );
        }

        if (currentView === 'settings') {
            return (
                <div className="flex items-center justify-center h-[500px]">
                    <div className="text-center">
                        <h2 className="text-2xl text-gray-600 dark:text-gray-300 mb-2">
                            Definições
                        </h2>
                        <p className="text-gray-500">Em desenvolvimento</p>
                    </div>
                </div>
            );
        }
        return (
            <div className="flex items-center justify-center h-[500px]">
                <div className="text-center">
                    <h2 className="text-2xl text-gray-600 dark:text-gray-300 mb-2">Painel Escola</h2>
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
            roleTitle="Escola"
            navigationContent={<div className="text-gray-500 p-4">Menu Em Desenvolvimento</div>}
            onMenuToggle={() => { }}
            onNavigateToProfile={() => setCurrentView('profile')}
            onNavigateToSettings={() => setCurrentView('settings')}
        >
            {renderContent()}
        </DashboardLayout>
    );
}
