import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { NavDropdown } from '../../components/layout/NavDropdown';
import { ProfilePage, getProfileDraftStorageKey } from '../ProfilePage';
import { useAuth } from '../../contexts/AuthContext';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { EscolaRequisitionsPage } from './EscolaRequisitionsPage';
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

interface EscolaDashboardProps {
    onLogout: () => void;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
}

type EscolaView = 'home' | 'requisitions' | 'requisitions-create' | 'profile' | 'settings';

export function EscolaDashboard({ isDarkMode, onToggleDarkMode, onLogout }: EscolaDashboardProps) {
    const { user: authUser } = useAuth();
    const { t } = useTranslation();
    const [currentView, setCurrentView] = usePersistentState<EscolaView>('escolaDashboardView', 'home');
    const [profileIsDirty, setProfileIsDirty] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<EscolaView | null>(null);

    const handleProfileDirtyChange = (isDirty: boolean) => {
        setProfileIsDirty(isDirty);
    };

    const [requisitionsIsDirty, setRequisitionsIsDirty] = useState(false);
    const handleRequisitionsDirtyChange = (isDirty: boolean) => {
        setRequisitionsIsDirty(isDirty);
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

    const safeSetView = (view: EscolaView) => {
        const isProfileDirty = currentView === 'profile' && profileIsDirty;
        const isRequisitionsDirty = (currentView === 'requisitions' || currentView === 'requisitions-create') && requisitionsIsDirty;

        if ((isProfileDirty || isRequisitionsDirty) && view !== currentView) {
            setPendingNavigation(view);
            setShowLeaveConfirm(true);
        } else {
            setCurrentView(view);
        }
    };

    const confirmLeave = () => {
        if (currentView === 'profile') {
            sessionStorage.removeItem(getProfileDraftStorageKey(authUser?.id || 0));
            setProfileIsDirty(false);
        } else {
            setRequisitionsIsDirty(false);
        }

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
                        <h2 className="text-2xl text-muted-foreground mb-2">
                            Definições
                        </h2>
                        <p className="text-muted-foreground">Em desenvolvimento</p>
                    </div>
                </div>
            );
        }

        if (currentView === 'requisitions' || currentView === 'requisitions-create') {
            return (
                <EscolaRequisitionsPage
                    isDarkMode={isDarkMode}
                    currentUserId={authUser?.id || 0}
                    initialSection={currentView === 'requisitions-create' ? 'create' : 'list'}
                    onDirtyChange={handleRequisitionsDirtyChange}
                />
            );
        }

        return (
            <div className="flex items-center justify-center h-[500px]">
                <div className="text-center">
                    <h2 className="text-2xl text-muted-foreground mb-2">Painel Escola</h2>
                    <p className="text-muted-foreground">Em desenvolvimento</p>
                </div>
            </div>
        );
    };

    const navigationContent = (
        <>
            <Button
                variant={currentView === 'home' ? 'default' : 'ghost'}
                onClick={() => safeSetView('home')}
                className={`text-sm ${currentView === 'home' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'text-foreground/80'}`}
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
                onSelect={(id) => safeSetView(id as EscolaView)}
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
            roleTitle={t('dashboard.school')}
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
                    <AlertDialogAction onClick={confirmLeave} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        Descartar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
