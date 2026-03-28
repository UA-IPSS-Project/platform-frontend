import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { NavDropdown } from '../../components/layout/NavDropdown';
import { ProfilePage, getProfileDraftStorageKey } from '../ProfilePage';
import { useAuth } from '../../contexts/AuthContext';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { InternoRequisitionsPage } from './InternoRequisitionsPage';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../../components/ui/alert-dialog';

interface InternoDashboardProps {
    onLogout: () => void;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
}

type InternoView = 'home' | 'requisitions' | 'requisitions-create' | 'profile' | 'settings';

export function InternoDashboard({ isDarkMode, onToggleDarkMode, onLogout }: InternoDashboardProps) {
    const { user: authUser } = useAuth();
    const { t } = useTranslation();
    const [currentView, setCurrentView] = usePersistentState<InternoView>('internoDashboardView', 'home');
    const [profileIsDirty, setProfileIsDirty] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<InternoView | null>(null);

    const handleProfileDirtyChange = (isDirty: boolean) => {
        setProfileIsDirty(isDirty);
    };
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

    const safeSetView = (view: InternoView) => {
        if (currentView === 'profile' && profileIsDirty && view !== 'profile') {
            setPendingNavigation(view);
            setShowLeaveConfirm(true);
        } else {
            setCurrentView(view);
        }
    };

    const confirmLeaveProfile = () => {
        sessionStorage.removeItem(getProfileDraftStorageKey(authUser?.id || 0));
        setProfileIsDirty(false);
        setShowLeaveConfirm(false);
        if (pendingNavigation) {
            setCurrentView(pendingNavigation);
            setPendingNavigation(null);
        }
    };

    const renderContent = () => {
        if (currentView === 'profile') {
            return (
                <ProfilePage
                    user={{ id: authUser?.id || 0, ...userData }}
                    onBack={() => safeSetView('home')}
                    onUpdateUser={handleUpdateUser}
                    isDarkMode={isDarkMode}
                    onDirtyChange={handleProfileDirtyChange}
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

        if (currentView === 'requisitions' || currentView === 'requisitions-create') {
            return (
                <InternoRequisitionsPage
                    isDarkMode={isDarkMode}
                    currentUserId={authUser?.id || 0}
                    initialSection={currentView === 'requisitions-create' ? 'create' : 'list'}
                />
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

    const navigationContent = (
        <>
            <Button
                variant={currentView === 'home' ? 'default' : 'ghost'}
                onClick={() => safeSetView('home')}
                className={`text-sm ${currentView === 'home' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-gray-700 dark:text-gray-200'}`}
            >
                {t('sidebar.home')}
            </Button>
            <NavDropdown
                label={t('sidebar.requisitions')}
                items={[
                    { id: 'requisitions', label: t('sidebar.requisitions') },
                    { id: 'requisitions-create', label: t('sidebar.createRequisition') },
                ]}
                isActive={['requisitions', 'requisitions-create'].includes(currentView)}
                onSelect={(id) => safeSetView(id as InternoView)}
                onLabelClick={() => safeSetView('requisitions')}
            />
        </>
    );

    return (
        <>
        <DashboardLayout
            isDarkMode={isDarkMode}
            onToggleDarkMode={onToggleDarkMode}
            onLogout={onLogout}
            roleTitle={t('dashboard.internalTeam')}
            navigationContent={navigationContent}
            onMenuToggle={() => { }}
            onNavigateToProfile={() => setCurrentView('profile')}
            onNavigateToSettings={() => safeSetView('settings')}
        >
            {renderContent()}
        </DashboardLayout>

        <AlertDialog open={showLeaveConfirm} onOpenChange={(open) => { if (!open) setShowLeaveConfirm(false); }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Alterações por guardar</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tem mudanças por guardar. Deseja descartá-las?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => { setPendingNavigation(null); setShowLeaveConfirm(false); }}>Ficar</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmLeaveProfile} className="bg-red-600 hover:bg-red-700 text-white">
                        Descartar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
