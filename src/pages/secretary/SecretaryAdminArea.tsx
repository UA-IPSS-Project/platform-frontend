import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Package, Truck, Wrench, Settings2, Save, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { GlassCard } from '../../components/ui/glass-card';
import { RequisitionsCatalogManagement } from '../../components/admin/RequisitionsCatalogManagement';
import { calendarioApi, requisicoesApi } from '../../services/api';


function getSlotTypes(t: (k: string) => string) {
    return [
        {
            tipo: 'SECRETARIA' as const,
            titulo: t('dashboard.admin.slots.secretaryScheduleTitle'),
            descricao: t('dashboard.admin.slots.secretaryScheduleDescription'),
        },
    ];
}

function AdminOverview({ summaryCards }: Readonly<{
    summaryCards: Array<{ title: string; value: number | string; description: string; icon: LucideIcon; iconClassName: string }>;
    onOpenSlots: () => void;
    onOpenCatalogs: () => void;
}>) {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
                <GlassCard key={card.title} className="p-6 flex items-start justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.08em] font-medium text-muted-foreground">{card.title}</p>
                        <p className="mt-2 text-4xl leading-none font-semibold text-foreground">{card.value}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
                    </div>
                    <div className={`flex-shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-2xl ${card.iconClassName}`}>
                        <card.icon className="w-5 h-5" />
                    </div>
                </GlassCard>
            ))}
        </div>
    );
}

function SlotsManagement({
    isLoadingSlots,
    isSavingSlots,
    slotCapacities,
    onChange,
    onSave,
    t,
}: Readonly<{
    isLoadingSlots: boolean;
    isSavingSlots: boolean;
    slotCapacities: { SECRETARIA: number };
    onChange: (tipo: 'SECRETARIA', value: string) => void;
    onSave: () => void;
    t: (k: string) => string;
}>) {
    const slotTypes = getSlotTypes(t);
    return (
        <GlassCard className="p-6">
            <div className="flex flex-col gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Settings2 className="w-4 h-4" />
                        {t('dashboard.admin.slots.operationalConfiguration')}
                    </div>
                    <h2 className="mt-2 text-xl font-semibold text-foreground">{t('dashboard.admin.slots.title')}</h2>
                    <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                        {t('dashboard.admin.slots.description')}
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
                                    {t('dashboard.admin.slots.maxPerSlot')}
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
                        {isSavingSlots ? t('dashboard.admin.slots.saving') : t('dashboard.admin.slots.saveConfiguration')}
                    </Button>
                </div>
            </div>
        </GlassCard>
    );
}

export function SecretaryAdminArea() {
    const { t } = useTranslation();
    const [slotCapacities, setSlotCapacities] = useState({
        SECRETARIA: 1,
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
            });
        } catch (error) {
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
                toast.error(t('dashboard.admin.errors.loadCatalogCounts', 'Erro ao carregar métricas de catálogos'));
            }
        };

        loadCatalogCounts();
    }, [t]);

    const handleSlotCapacityChange = (tipo: 'SECRETARIA', value: string) => {
        const parsed = Number.parseInt(value, 10);
        const safeValue = Number.isFinite(parsed) ? Math.min(20, Math.max(1, parsed)) : 1;
        setSlotCapacities(prev => ({ ...prev, [tipo]: safeValue }));
    };

    const handleSaveSlotCapacities = async () => {
        setIsSavingSlots(true);
        try {
            await calendarioApi.atualizarConfiguracaoSlot('SECRETARIA', slotCapacities.SECRETARIA);
            toast.success(t('dashboard.admin.messages.slotConfigUpdated'));
            await loadSlotCapacities();
        } catch (error) {
            toast.error(t('dashboard.admin.errors.saveSlotConfig'));
        } finally {
            setIsSavingSlots(false);
        }
    };

    const summaryCards = useMemo(() => [
        {
            title: t('dashboard.admin.summary.slots.title'),
            value: slotCapacities.SECRETARIA,
            description: t('dashboard.admin.summary.slots.description'),
            icon: CalendarDays,
            iconClassName: 'bg-primary/15 text-primary',
        },
        {
            title: t('dashboard.admin.summary.materials.title'),
            value: catalogCounts.materiais,
            description: t('dashboard.admin.summary.materials.description'),
            icon: Package,
            iconClassName: 'bg-primary/15 text-primary',
        },
        {
            title: t('dashboard.admin.summary.transports.title'),
            value: catalogCounts.transportes,
            description: t('dashboard.admin.summary.transports.description'),
            icon: Truck,
            iconClassName: 'bg-primary/15 text-primary',
        },
        {
            title: t('dashboard.admin.summary.maintenanceTypes.title'),
            value: catalogCounts.tiposManutencao,
            description: t('dashboard.admin.summary.maintenanceTypes.description'),
            icon: Wrench,
            iconClassName: 'bg-primary/15 text-primary',
        },
    ], [slotCapacities, catalogCounts, t]);

    return (
        <div className="space-y-10 max-w-6xl mx-auto">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-foreground">{t('dashboard.admin.mainTitle')}</h1>
                <p className="text-muted-foreground max-w-2xl">
                    {t('dashboard.admin.mainDescription')}
                </p>
            </div>
            <GlassCard className="p-6">
                <AdminOverview
                    summaryCards={summaryCards}
                    onOpenSlots={() => { }}
                    onOpenCatalogs={() => { }}
                />
            </GlassCard>
            <SlotsManagement
                isLoadingSlots={isLoadingSlots}
                isSavingSlots={isSavingSlots}
                slotCapacities={slotCapacities}
                onChange={handleSlotCapacityChange}
                onSave={handleSaveSlotCapacities}
                t={t}
            />
            <GlassCard className="p-6 mt-6">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                    <Settings2 className="w-4 h-4" />
                    {t('dashboard.admin.catalogs.title')}
                </div>
                <p className="mt-1 text-sm text-muted-foreground max-w-2xl mb-4">
                    {t('dashboard.admin.catalogs.description')}
                </p>
                
                <h2 className="text-xl font-semibold text-foreground mb-6">
                    {t('dashboard.admin.catalogs.managementTitle')}
                </h2>

                <RequisitionsCatalogManagement />
            </GlassCard>
        </div>
    );
}
