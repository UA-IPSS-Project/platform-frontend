import { useEffect, useMemo, useState } from 'react';
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
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck, Settings2, Save, Package2, CalendarDays, Package, Truck, Wrench, ClipboardList, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { GlassCard } from '../../components/ui/glass-card';
import { RequisitionsCatalogManagement } from '../../components/admin/RequisitionsCatalogManagement';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ProfilePage, getProfileDraftStorageKey } from '../ProfilePage';
import { calendarioApi, requisicoesApi } from '../../services/api';
import { candidaturasApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useTranslation } from 'react-i18next';
import { AdminFormsManagementPage } from './AdminFormsManagementPage';

type AdminView = 'overview' | 'slots' | 'catalogs' | 'forms' | 'profile' | 'settings';

interface AdminDashboardProps {
    onLogout: () => void;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
}

const slotTypes = [
    {
        tipo: 'SECRETARIA' as const,
        titulo: 'Agenda da Secretaria (15 min)',
        descricao: 'Define quantas marcações da secretaria podem coexistir no mesmo horário.',
    },
    {
        tipo: 'BALNEARIO' as const,
        titulo: 'Agenda do Balneário (30 min)',
        descricao: 'Controla a lotação operacional dos slots de marcação do balneário.',
    },
];

function AdminOverview({
    summaryCards,
    onOpenSlots,
    onOpenCatalogs,
    onOpenForms,
}: Readonly<{
    summaryCards: Array<{ title: string; value: number | string; description: string; icon: LucideIcon; iconClassName: string }>;
    onOpenSlots: () => void;
    onOpenCatalogs: () => void;
    onOpenForms: () => void;
}>) {
    const managementAreas = [
        {
            title: 'Slots por marcação',
            description: 'Define a capacidade de cada agenda por horário e controla a lotação operacional.',
            icon: Settings2,
            action: onOpenSlots,
            actionLabel: 'Gerir slots',
        },
        {
            title: 'Catálogos administrativos',
            description: 'Cria, edita e remove materiais, transportes e tipos de manutenção sem acesso às requisições.',
            icon: Package2,
            action: onOpenCatalogs,
            actionLabel: 'Abrir catálogo',
        },
        {
            title: 'Gestão de formulários',
            description: 'Gere os formulários RJSF disponíveis para cada tipo de candidatura.',
            icon: ClipboardList,
            action: onOpenForms,
            actionLabel: 'Gerir formulários',
        },
    ];

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => (
                    <GlassCard key={card.title} className="p-6 flex items-start justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.08em] font-medium text-muted-foreground">{card.title}</p>
                            <p className="mt-3 text-5xl leading-none font-semibold text-foreground">{card.value}</p>
                            <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
                        </div>
                        <div className={`flex-shrink-0 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${card.iconClassName}`}>
                            <card.icon className="w-6 h-6" />
                        </div>
                    </GlassCard>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {managementAreas.map((area) => {
                    const Icon = area.icon;
                    return (
                        <GlassCard key={area.title} className="p-6 flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-foreground">{area.title}</h2>
                                    <p className="mt-2 text-sm text-muted-foreground">{area.description}</p>
                                </div>
                            </div>
                            <div className="mt-6">
                                <Button onClick={area.action} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                    {area.actionLabel}
                                </Button>
                            </div>
                        </GlassCard>
                    );
                })}
            </div>
        </>
    );
}

function SlotsManagement({
    isLoadingSlots,
    isSavingSlots,
    slotCapacities,
    onChange,
    onSave,
}: Readonly<{
    isLoadingSlots: boolean;
    isSavingSlots: boolean;
    slotCapacities: { SECRETARIA: number; BALNEARIO: number };
    onChange: (tipo: 'SECRETARIA' | 'BALNEARIO', value: string) => void;
    onSave: () => void;
}>) {
    return (
        <GlassCard className="p-6">
            <div className="flex flex-col gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Settings2 className="w-4 h-4" />
                        Configuração operacional
                    </div>
                    <h2 className="mt-2 text-xl font-semibold text-foreground">Capacidade de marcações por slot</h2>
                    <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                        Ajuste o número máximo de marcações que cada agenda suporta por horário. As alterações são aplicadas de imediato após gravação.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {slotTypes.map((slotType) => (
                        <div
                            key={slotType.tipo}
                            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                        >
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-foreground">{slotType.titulo}</h3>
                                <p className="text-sm text-muted-foreground">{slotType.descricao}</p>
                            </div>

                            <div className="mt-5 space-y-2">
                                <Label htmlFor={`slot-${slotType.tipo}`} className="text-sm font-medium text-foreground">
                                    Máximo por slot
                                </Label>
                                <Input
                                    id={`slot-${slotType.tipo}`}
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={slotCapacities[slotType.tipo]}
                                    onChange={(event) => onChange(slotType.tipo, event.target.value)}
                                    className="bg-background"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end">
                    <Button
                        type="button"
                        onClick={onSave}
                        disabled={isSavingSlots || isLoadingSlots}
                        className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        <Save className="w-4 h-4" />
                        {isSavingSlots ? 'A guardar...' : 'Guardar configuração'}
                    </Button>
                </div>
            </div>
        </GlassCard>
    );
}

export function AdminDashboard({ isDarkMode, onToggleDarkMode, onLogout }: Readonly<AdminDashboardProps>) {
    const { user: authUser } = useAuth();
    const { t } = useTranslation();
    const [currentView, setCurrentView] = usePersistentState<AdminView>('adminDashboardView', 'overview');
    const [userData, setUserData] = useState({
        name: authUser?.nome || '',
        nif: authUser?.nif || '',
        contact: authUser?.telefone || '',
        email: authUser?.email || '',
    });
    const [profileIsDirty, setProfileIsDirty] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<AdminView | null>(null);

    const handleProfileDirtyChange = (isDirty: boolean) => {
        setProfileIsDirty(isDirty);
    };

    const safeSetView = (view: AdminView) => {
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
    const [slotCapacities, setSlotCapacities] = useState({
        SECRETARIA: 1,
        BALNEARIO: 2,
    });
    const [catalogCounts, setCatalogCounts] = useState({
        materiais: 0,
        transportes: 0,
        tiposManutencao: 0,
    });
    const [formsCount, setFormsCount] = useState(0);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isSavingSlots, setIsSavingSlots] = useState(false);

    const loadSlotCapacities = async () => {
        setIsLoadingSlots(true);
        try {
            const config = await calendarioApi.listarConfiguracaoSlots();
            setSlotCapacities({
                SECRETARIA: config.find(item => item.tipo === 'SECRETARIA')?.capacidadePorSlot ?? 1,
                BALNEARIO: config.find(item => item.tipo === 'BALNEARIO')?.capacidadePorSlot ?? 2,
            });
        } catch (error) {
            console.error('Erro ao carregar configuração de slots:', error);
            toast.error('Não foi possível carregar a configuração de slots');
        } finally {
            setIsLoadingSlots(false);
        }
    };

    useEffect(() => {
        loadSlotCapacities();
    }, []);

    useEffect(() => {
        const loadCatalogCounts = async () => {
            try {
                const [materiais, transportes, tiposManutencao, forms] = await Promise.all([
                    requisicoesApi.listarMateriais(),
                    requisicoesApi.listarTransportes(),
                    requisicoesApi.listarTiposManutencao(),
                    candidaturasApi.listarFormularios(),
                ]);

                setCatalogCounts({
                    materiais: Array.isArray(materiais) ? materiais.length : 0,
                    transportes: Array.isArray(transportes) ? transportes.length : 0,
                    tiposManutencao: Array.isArray(tiposManutencao) ? tiposManutencao.length : 0,
                });
                setFormsCount(Array.isArray(forms) ? forms.length : 0);
            } catch (error) {
                console.error('Erro ao carregar métricas de catálogos:', error);
            }
        };

        loadCatalogCounts();
    }, []);

    const handleSlotCapacityChange = (tipo: 'SECRETARIA' | 'BALNEARIO', value: string) => {
        const parsed = Number.parseInt(value, 10);
        const safeValue = Number.isFinite(parsed) ? Math.min(20, Math.max(1, parsed)) : 1;
        setSlotCapacities(prev => ({ ...prev, [tipo]: safeValue }));
    };

    const handleSaveSlotCapacities = async () => {
        setIsSavingSlots(true);
        try {
            await Promise.all([
                calendarioApi.atualizarConfiguracaoSlot('SECRETARIA', slotCapacities.SECRETARIA),
                calendarioApi.atualizarConfiguracaoSlot('BALNEARIO', slotCapacities.BALNEARIO),
            ]);
            toast.success('Configuração de slots atualizada com sucesso');
            await loadSlotCapacities();
        } catch (error) {
            console.error('Erro ao guardar configuração de slots:', error);
            toast.error('Não foi possível guardar a configuração de slots');
        } finally {
            setIsSavingSlots(false);
        }
    };

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

    const summaryCards = useMemo(() => [
        {
            title: 'Slots (Secretaria/Balneário)',
            value: `${slotCapacities.SECRETARIA} / ${slotCapacities.BALNEARIO}`,
            description: 'capacidade por horário',
            icon: CalendarDays,
            iconClassName: 'bg-primary/15 text-primary',
        },
        {
            title: 'Materiais',
            value: catalogCounts.materiais,
            description: 'itens no catálogo',
            icon: Package,
            iconClassName: 'bg-primary/15 text-primary',
        },
        {
            title: 'Transportes',
            value: catalogCounts.transportes,
            description: 'transportes no catálogo',
            icon: Truck,
            iconClassName: 'bg-primary/15 text-primary',
        },
        {
            title: 'Tipos de manutenção',
            value: catalogCounts.tiposManutencao,
            description: 'tipos disponíveis',
            icon: Wrench,
            iconClassName: 'bg-primary/15 text-primary',
        },
        {
            title: 'Formulários candidatura',
            value: formsCount,
            description: 'formulários ativos',
            icon: ClipboardList,
            iconClassName: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
        },
    ], [slotCapacities, catalogCounts, formsCount]);

    const AdminNavigation = (
        <>
            <Button
                variant={currentView === 'overview' ? 'default' : 'ghost'}
                onClick={() => safeSetView('overview')}
                aria-label="Ir para Dashboard"
                aria-current={currentView === 'overview' ? 'page' : undefined}
                className={`text-sm ${currentView === 'overview' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'text-foreground hover:bg-primary/10 hover:text-primary'}`}
            >
                {t('dashboard.admin.navigation.dashboard')}
            </Button>
            <Button
                variant={currentView === 'slots' ? 'default' : 'ghost'}
                onClick={() => safeSetView('slots')}
                aria-label="Ir para Slots"
                aria-current={currentView === 'slots' ? 'page' : undefined}
                className={`text-sm ${currentView === 'slots' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'text-foreground hover:bg-primary/10 hover:text-primary'}`}
            >
                {t('dashboard.admin.navigation.slots')}
            </Button>
            <Button
                variant={currentView === 'catalogs' ? 'default' : 'ghost'}
                onClick={() => safeSetView('catalogs')}
                aria-label="Ir para Catálogos"
                aria-current={currentView === 'catalogs' ? 'page' : undefined}
                className={`text-sm ${currentView === 'catalogs' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'text-foreground hover:bg-primary/10 hover:text-primary'}`}
            >
                {t('dashboard.admin.navigation.catalogs')}
            </Button>
            <Button
                variant={currentView === 'forms' ? 'default' : 'ghost'}
                onClick={() => safeSetView('forms')}
                aria-label="Ir para Formulários"
                aria-current={currentView === 'forms' ? 'page' : undefined}
                className={`text-sm ${currentView === 'forms' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-gray-700 dark:text-gray-200'}`}
            >
                Formulários
            </Button>
        </>
    );

    const viewDescriptions: Record<AdminView, string> = {
        overview: 'Este painel serve apenas para administração operacional. O admin gere slots, materiais, transportes e tipos de manutenção.',
        slots: 'Ajuste o número máximo de marcações que cada agenda suporta por horário. As alterações são aplicadas de imediato após gravação.',
        catalogs: 'Cria, edita e remove materiais, transportes e tipos de manutenção usados nas requisições.',
        forms: 'Gere os formulários RJSF disponíveis para candidaturas e prepara os tipos para o portal do utente.',
        profile: '',
        settings: '',
    };

    const renderAdminContent = () => {
        return (
            <div className="space-y-6 max-w-6xl mx-auto">
                <div className="flex flex-col gap-1">
                    <p className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                        <ShieldCheck className="w-4 h-4" />
                        Área reservada à administração
                    </p>
                    <h1 className="text-3xl font-bold text-foreground">Painel de Administração</h1>
                    <p className="text-muted-foreground max-w-2xl">
                        {viewDescriptions[currentView]}
                    </p>
                </div>

                {currentView === 'overview' ? (
                    <AdminOverview
                        summaryCards={summaryCards}
                        onOpenSlots={() => safeSetView('slots')}
                        onOpenCatalogs={() => safeSetView('catalogs')}
                        onOpenForms={() => safeSetView('forms')}
                    />
                ) : null}

                {currentView === 'slots' ? (
                    <SlotsManagement
                        isLoadingSlots={isLoadingSlots}
                        isSavingSlots={isSavingSlots}
                        slotCapacities={slotCapacities}
                        onChange={handleSlotCapacityChange}
                        onSave={() => void handleSaveSlotCapacities()}
                    />
                ) : null}

                {currentView === 'profile' ? (
                    <ProfilePage
                        user={{ id: authUser?.id || 0, ...userData }}
                        onBack={() => setCurrentView('overview')}
                        onUpdateUser={handleUpdateUser}
                        isDarkMode={isDarkMode}
                        onDirtyChange={handleProfileDirtyChange}
                    />
                ) : null}

                {currentView === 'settings' ? (
                    <div className="flex items-center justify-center h-[400px]">
                        <div className="text-center">
                            <h2 className="text-2xl text-muted-foreground mb-2">Definições</h2>
                            <p className="text-muted-foreground">Em desenvolvimento</p>
                        </div>
                    </div>
                ) : null}

                {currentView === 'catalogs' ? (
                    <RequisitionsCatalogManagement />
                ) : null}

                {currentView === 'forms' ? (
                    <AdminFormsManagementPage
                        onFormsChanged={async () => {
                            const forms = await candidaturasApi.listarFormularios();
                            setFormsCount(Array.isArray(forms) ? forms.length : 0);
                        }}
                    />
                ) : null}
            </div>
        );
    };

    return (
        <>
            <DashboardLayout
                isDarkMode={isDarkMode}
                onToggleDarkMode={onToggleDarkMode}
                onLogout={onLogout}
                onMenuToggle={() => { }}
                roleTitle={t('dashboard.admin.roleTitle')}
                navigationContent={AdminNavigation}
                onNavigateToProfile={() => setCurrentView('profile')}
                onNavigateToSettings={() => safeSetView('settings')}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentView}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                        {renderAdminContent()}
                    </motion.div>
                </AnimatePresence>
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
                        <AlertDialogAction onClick={confirmLeaveProfile} className="bg-destructive hover:bg-destructive/90 text-white">
                            Descartar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
