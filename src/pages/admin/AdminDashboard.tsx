import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck, Settings2, Save, Package2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { GlassCard } from '../../components/ui/glass-card';
import { RequisitionsCatalogManagement } from '../../components/admin/RequisitionsCatalogManagement';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { calendarioApi } from '../../services/api';

type AdminView = 'overview' | 'slots' | 'catalogs';

interface AdminDashboardProps {
    onLogout: () => void;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
}

const slotTypes = [
    {
        tipo: 'SECRETARIA' as const,
        titulo: 'Agenda da Secretaria',
        descricao: 'Define quantas marcações da secretaria podem coexistir no mesmo horário.',
    },
    {
        tipo: 'BALNEARIO' as const,
        titulo: 'Agenda do Balneário',
        descricao: 'Controla a lotação operacional dos slots de marcação do balneário.',
    },
];

function AdminOverview({
    summaryCards,
    onOpenSlots,
    onOpenCatalogs,
}: Readonly<{
    summaryCards: Array<{ title: string; value: number; description: string }>;
    onOpenSlots: () => void;
    onOpenCatalogs: () => void;
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
    ];

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2">
                {summaryCards.map((card) => (
                    <GlassCard key={card.title} className="p-6">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
                        <p className="mt-3 text-4xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{card.description}</p>
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
    return (
        <GlassCard className="p-6">
            <div className="flex flex-col gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                        <Settings2 className="w-4 h-4" />
                        Configuração operacional
                    </div>
                    <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">Capacidade de marcações por slot</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
                        Ajuste o número máximo de marcações que cada agenda suporta por horário. As alterações são aplicadas de imediato após gravação.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {slotTypes.map((slotType) => (
                        <div
                            key={slotType.tipo}
                            className="rounded-2xl border border-gray-200/80 bg-white/70 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950/50"
                        >
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{slotType.titulo}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{slotType.descricao}</p>
                            </div>

                            <div className="mt-5 space-y-2">
                                <Label htmlFor={`slot-${slotType.tipo}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Máximo por slot
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
                        {isSavingSlots ? 'A guardar...' : 'Guardar configuração'}
                    </Button>
                </div>
            </div>
        </GlassCard>
    );
}

export function AdminDashboard({ isDarkMode, onToggleDarkMode, onLogout }: Readonly<AdminDashboardProps>) {
    const [currentView, setCurrentView] = useState<AdminView>('overview');
    const [slotCapacities, setSlotCapacities] = useState({
        SECRETARIA: 1,
        BALNEARIO: 2,
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
            toast.error('Não foi possível carregar a configuração de slots');
        } finally {
            setIsLoadingSlots(false);
        }
    };

    useEffect(() => {
        loadSlotCapacities();
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

    const summaryCards = useMemo(() => [
        {
            title: 'Slots Secretaria',
            value: slotCapacities.SECRETARIA,
            description: 'marcações por horário',
        },
        {
            title: 'Slots Balneário',
            value: slotCapacities.BALNEARIO,
            description: 'marcações por horário',
        },
    ], [slotCapacities]);

    const AdminNavigation = (
        <>
            <Button
                variant={currentView === 'overview' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('overview')}
                className={`text-sm ${currentView === 'overview' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-gray-700 dark:text-gray-200'}`}
            >
                Dashboard
            </Button>
            <Button
                variant={currentView === 'slots' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('slots')}
                className={`text-sm ${currentView === 'slots' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-gray-700 dark:text-gray-200'}`}
            >
                Slots
            </Button>
            <Button
                variant={currentView === 'catalogs' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('catalogs')}
                className={`text-sm ${currentView === 'catalogs' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-gray-700 dark:text-gray-200'}`}
            >
                Catálogos
            </Button>
        </>
    );

    const viewDescriptions: Record<AdminView, string> = {
        overview: 'Este painel serve apenas para administração operacional. O admin gere slots, materiais, transportes e tipos de manutenção.',
        slots: 'Ajuste o número máximo de marcações que cada agenda suporta por horário. As alterações são aplicadas de imediato após gravação.',
        catalogs: 'Cria, edita e remove materiais, transportes e tipos de manutenção usados nas requisições.',
    };

    const renderAdminContent = () => {
        return (
            <div className="space-y-6 max-w-6xl mx-auto">
                <div className="flex flex-col gap-1">
                    <p className="inline-flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300">
                        <ShieldCheck className="w-4 h-4" />
                        Área reservada à administração
                    </p>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Painel de Administração</h1>
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
            roleTitle="Administrador"
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
