import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Package, Truck, Wrench, Settings2, Save, ShieldCheck, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { GlassCard } from '../../components/ui/glass-card';
import { RequisitionsCatalogManagement } from '../../components/admin/RequisitionsCatalogManagement';
import { calendarioApi, requisicoesApi } from '../../services/api';

const slotTypes = [
    {
        tipo: 'SECRETARIA' as const,
        tituloKey: 'admin.slotsManagement.secretaryScheduleTitle',
        descricaoKey: 'admin.slotsManagement.secretaryScheduleDescription',
    },
    {
        tipo: 'BALNEARIO' as const,
        tituloKey: 'admin.slotsManagement.balnearioScheduleTitle',
        descricaoKey: 'admin.slotsManagement.balnearioScheduleDescription',
    },
];

function AdminOverview({
    summaryCards,
}: Readonly<{
    summaryCards: Array<{ titleKey: string; value: number | string; descriptionKey: string; icon: LucideIcon; iconClassName: string }>;
    onOpenSlots: () => void;
    onOpenCatalogs: () => void;
}>) {
    const { t } = useTranslation();
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
                <GlassCard key={card.titleKey} className="p-6 flex items-start justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.08em] font-medium text-gray-500 dark:text-gray-400">{t(card.titleKey)}</p>
                        <p className="mt-3 text-5xl leading-none font-semibold text-gray-900 dark:text-white">{card.value}</p>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t(card.descriptionKey)}</p>
                    </div>
                    <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${card.iconClassName}`}>
                        <card.icon className="w-6 h-6" />
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
                        {t('admin.slotsManagement.operationalConfiguration')}
                    </div>
                    <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">{t('admin.slotsManagement.title')}</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
                        {t('admin.slotsManagement.description')}
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {slotTypes.map((slotType) => (
                        <div
                            key={slotType.tipo}
                            className="rounded-2xl border border-gray-200/80 bg-white/70 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950/50"
                        >
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t(slotType.tituloKey)}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t(slotType.descricaoKey)}</p>
                            </div>

                            <div className="mt-5 space-y-2">
                                <Label htmlFor={`slot-${slotType.tipo}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('admin.slotsManagement.maxPerSlot')}
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
                        {isSavingSlots ? t('admin.slotsManagement.saving') : t('admin.slotsManagement.saveConfiguration')}
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
                toast.error('Erro ao carregar métricas de catálogos');
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
            toast.error('Não foi possível guardar a configuração de slots');
        } finally {
            setIsSavingSlots(false);
        }
    };

    const summaryCards = useMemo(() => [
        {
            titleKey: 'admin.cards.slots.title',
            value: `${slotCapacities.SECRETARIA} / ${slotCapacities.BALNEARIO}`,
            descriptionKey: 'admin.cards.slots.description',
            icon: CalendarDays,
            iconClassName: 'bg-violet-500/20 text-violet-300',
        },
        {
            titleKey: 'admin.cards.materials.title',
            value: catalogCounts.materiais,
            descriptionKey: 'admin.cards.materials.description',
            icon: Package,
            iconClassName: 'bg-blue-500/20 text-blue-300',
        },
        {
            titleKey: 'admin.cards.transports.title',
            value: catalogCounts.transportes,
            descriptionKey: 'admin.cards.transports.description',
            icon: Truck,
            iconClassName: 'bg-emerald-500/20 text-emerald-300',
        },
        {
            titleKey: 'admin.cards.maintenanceTypes.title',
            value: catalogCounts.tiposManutencao,
            descriptionKey: 'admin.cards.maintenanceTypes.description',
            icon: Wrench,
            iconClassName: 'bg-fuchsia-500/20 text-fuchsia-300',
        },
    ], [slotCapacities, catalogCounts]);

    return (
        <div className="space-y-10 max-w-6xl mx-auto">
            <div className="flex flex-col gap-1">
                <p className="inline-flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300">
                    <ShieldCheck className="w-4 h-4" />
                    {t('admin.administrationOnlyArea', 'Área reservada à administração')}
                </p>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('admin.title', 'Gestão Administrativa')}</h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                    {t('admin.areaDescription', 'Área de gestão de slots, catálogos e capacidades operacionais da secretaria.')}
                </p>
            </div>
            <AdminOverview
                summaryCards={summaryCards}
                onOpenSlots={() => {}}
                onOpenCatalogs={() => {}}
            />
            <SlotsManagement
                isLoadingSlots={isLoadingSlots}
                isSavingSlots={isSavingSlots}
                slotCapacities={slotCapacities}
                onChange={handleSlotCapacityChange}
                onSave={handleSaveSlotCapacities}
            />
            <RequisitionsCatalogManagement />
        </div>
    );
}
