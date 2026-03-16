import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck, Settings2, Save, Package2, CalendarDays, Package, Truck, Wrench, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { GlassCard } from '../../components/ui/glass-card';
import { RequisitionsCatalogManagement } from '../../components/admin/RequisitionsCatalogManagement';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { calendarioApi, requisicoesApi } from '../../services/api';
import { useTranslation } from 'react-i18next';

type AdminView = 'overview' | 'slots' | 'catalogs';

interface AdminDashboardProps {
    onLogout: () => void;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
}

const slotTypes = [
    {
        tipo: 'SECRETARIA' as const,
    },
    {
        tipo: 'BALNEARIO' as const,
    },
];

function AdminOverview({
    summaryCards,
    onOpenSlots,
    onOpenCatalogs,
}: Readonly<{
    summaryCards: Array<{ title: string; value: number | string; description: string; icon: LucideIcon; iconClassName: string }>;
    onOpenSlots: () => void;
    onOpenCatalogs: () => void;
}>) {
    const { t } = useTranslation();
    const managementAreas = [
        {
            title: t('dashboard.admin.overview.managementAreas.slots.title'),
            description: t('dashboard.admin.overview.managementAreas.slots.description'),
            icon: Settings2,
            action: onOpenSlots,
            actionLabel: t('dashboard.admin.overview.managementAreas.slots.actionLabel'),
        },
        {
            title: t('dashboard.admin.overview.managementAreas.catalogs.title'),
            description: t('dashboard.admin.overview.managementAreas.catalogs.description'),
            icon: Package2,
            action: onOpenCatalogs,
            actionLabel: t('dashboard.admin.overview.managementAreas.catalogs.actionLabel'),
        },
    ];

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => (
                    <GlassCard key={card.title} className="p-6 flex items-start justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.08em] font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
                            <p className="mt-3 text-5xl leading-none font-semibold text-gray-900 dark:text-white">{card.value}</p>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{card.description}</p>
                        </div>
                        <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${card.iconClassName}`}>
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
                                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{area.title}</h2>
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{area.description}</p>
                                </div>
                            </div>
                            <div className="mt-6">
                                <Button onClick={area.action} className="bg-purple-600 text-white hover:bg-purple-700">
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
    const { t } = useTranslation();
    return (
        <GlassCard className="p-6">
            <div className="flex flex-col gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                        <Settings2 className="w-4 h-4" />
                        {t('dashboard.admin.slots.operationalConfiguration')}
                    </div>
                    <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">{t('dashboard.admin.slots.title')}</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
                        {t('dashboard.admin.slots.description')}
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {slotTypes.map((slotType) => (
                        <div
                            key={slotType.tipo}
                            className="rounded-2xl border border-gray-200/80 bg-white/70 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950/50"
                        >
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{slotType.tipo === 'SECRETARIA' ? t('dashboard.admin.slots.secretaryScheduleTitle') : t('dashboard.admin.slots.balnearioScheduleTitle')}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{slotType.tipo === 'SECRETARIA'
                                    ? t('dashboard.admin.slots.secretaryScheduleDescription')
                                    : t('dashboard.admin.slots.balnearioScheduleDescription')}</p>
                            </div>

                            <div className="mt-5 space-y-2">
                                <Label htmlFor={`slot-${slotType.tipo}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('dashboard.admin.slots.maxPerSlot')}
                                </Label>
                                <Input
                                    id={`slot-${slotType.tipo}`}
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={slotCapacities[slotType.tipo]}
                                    onChange={(event) => onChange(slotType.tipo, event.target.value)}
                                    className="bg-white dark:bg-gray-900"
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
                        className="gap-2 bg-purple-600 text-white hover:bg-purple-700"
                    >
                        <Save className="w-4 h-4" />
                        {isSavingSlots ? t('dashboard.admin.slots.saving') : t('dashboard.admin.slots.saveConfiguration')}
                    </Button>
                </div>
            </div>
        </GlassCard>
    );
}

export function AdminDashboard({ isDarkMode, onToggleDarkMode, onLogout }: Readonly<AdminDashboardProps>) {
    const { t } = useTranslation();
    const [currentView, setCurrentView] = useState<AdminView>('overview');
    const [slotCapacities, setSlotCapacities] = useState({
        SECRETARIA: 1,
        BALNEARIO: 2,
    });
    const [catalogCounts, setCatalogCounts] = useState({
        materiais: 0,
        transportes: 0,
        tiposManutencao: 0,
    });
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
            toast.error(t('dashboard.admin.errors.loadSlotConfig'));
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
                const [materiais, transportes, tiposManutencao] = await Promise.all([
                    requisicoesApi.listarMateriais(),
                    requisicoesApi.listarTransportes(),
                    requisicoesApi.listarTiposManutencao(),
                ]);

                setCatalogCounts({
                    materiais: Array.isArray(materiais) ? materiais.length : 0,
                    transportes: Array.isArray(transportes) ? transportes.length : 0,
                    tiposManutencao: Array.isArray(tiposManutencao) ? tiposManutencao.length : 0,
                });
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
            toast.success(t('dashboard.admin.messages.slotConfigUpdated'));
            await loadSlotCapacities();
        } catch (error) {
            console.error('Erro ao guardar configuração de slots:', error);
            toast.error(t('dashboard.admin.errors.saveSlotConfig'));
        } finally {
            setIsSavingSlots(false);
        }
    };

    const summaryCards = useMemo(() => [
        {
            title: t('dashboard.admin.summary.slots.title'),
            value: `${slotCapacities.SECRETARIA} / ${slotCapacities.BALNEARIO}`,
            description: t('dashboard.admin.summary.slots.description'),
            icon: CalendarDays,
            iconClassName: 'bg-violet-500/20 text-violet-300',
        },
        {
            title: t('dashboard.admin.summary.materials.title'),
            value: catalogCounts.materiais,
            description: t('dashboard.admin.summary.materials.description'),
            icon: Package,
            iconClassName: 'bg-blue-500/20 text-blue-300',
        },
        {
            title: t('dashboard.admin.summary.transports.title'),
            value: catalogCounts.transportes,
            description: t('dashboard.admin.summary.transports.description'),
            icon: Truck,
            iconClassName: 'bg-emerald-500/20 text-emerald-300',
        },
        {
            title: t('dashboard.admin.summary.maintenanceTypes.title'),
            value: catalogCounts.tiposManutencao,
            description: t('dashboard.admin.summary.maintenanceTypes.description'),
            icon: Wrench,
            iconClassName: 'bg-fuchsia-500/20 text-fuchsia-300',
        },
    ], [slotCapacities, catalogCounts, t]);

    const AdminNavigation = (
        <>
            <Button
                variant={currentView === 'overview' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('overview')}
                className={`text-sm ${currentView === 'overview' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-gray-700 dark:text-gray-200'}`}
            >
                {t('dashboard.admin.navigation.dashboard')}
            </Button>
            <Button
                variant={currentView === 'slots' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('slots')}
                className={`text-sm ${currentView === 'slots' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-gray-700 dark:text-gray-200'}`}
            >
                {t('dashboard.admin.navigation.slots')}
            </Button>
            <Button
                variant={currentView === 'catalogs' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('catalogs')}
                className={`text-sm ${currentView === 'catalogs' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-gray-700 dark:text-gray-200'}`}
            >
                {t('dashboard.admin.navigation.catalogs')}
            </Button>
        </>
    );

    const viewDescriptions: Record<AdminView, string> = {
        overview: t('dashboard.admin.viewDescriptions.overview'),
        slots: t('dashboard.admin.viewDescriptions.slots'),
        catalogs: t('dashboard.admin.viewDescriptions.catalogs'),
    };

    const renderAdminContent = () => {
        return (
            <div className="space-y-6 max-w-6xl mx-auto">
                <div className="flex flex-col gap-1">
                    <p className="inline-flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300">
                        <ShieldCheck className="w-4 h-4" />
                        {t('dashboard.admin.administrationOnlyArea')}
                    </p>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard.admin.title')}</h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                        {viewDescriptions[currentView]}
                    </p>
                </div>

                {currentView === 'overview' ? (
                    <AdminOverview
                        summaryCards={summaryCards}
                        onOpenSlots={() => setCurrentView('slots')}
                        onOpenCatalogs={() => setCurrentView('catalogs')}
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

                {currentView === 'catalogs' ? (
                    <RequisitionsCatalogManagement />
                ) : null}
            </div>
        );
    };

    return (
        <DashboardLayout
            isDarkMode={isDarkMode}
            onToggleDarkMode={onToggleDarkMode}
            onLogout={onLogout}
            onMenuToggle={() => {}}
            roleTitle={t('dashboard.admin.roleTitle')}
            navigationContent={AdminNavigation}
            notifications={[]}
            unreadCount={0}
            showNotifications={false}
            onToggleNotifications={() => {}}
            onMarkAsRead={() => {}}
            onMarkAllAsRead={() => {}}
            onDeleteNotification={() => {}}
            onDeleteAllNotifications={() => {}}
            onNavigateToNotifications={() => {}}
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
    );
}
