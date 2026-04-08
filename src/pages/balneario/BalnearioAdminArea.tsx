import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Settings2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { GlassCard } from '../../components/ui/glass-card';
import { calendarioApi } from '../../services/api';

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
    slotCapacities: { BALNEARIO: number };
    onChange: (value: string) => void;
    onSave: () => void;
    t: (k: string) => string;
}>) {
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
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-foreground">{t('dashboard.admin.slots.balnearioScheduleTitle')}</h3>
                            <p className="text-sm text-muted-foreground">{t('dashboard.admin.slots.balnearioScheduleDescription')}</p>
                        </div>

                        <div className="mt-5 space-y-2">
                            <Label htmlFor="slot-BALNEARIO" className="text-sm font-medium text-foreground">
                                {t('dashboard.admin.slots.maxPerSlot')}
                            </Label>
                            <Input
                                id="slot-BALNEARIO"
                                type="number"
                                min={1}
                                max={20}
                                value={slotCapacities.BALNEARIO}
                                onChange={(event) => onChange(event.target.value)}
                                className="bg-background"
                            />
                        </div>
                    </div>
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

export function BalnearioAdminArea() {
    const { t } = useTranslation();
    const [slotCapacities, setSlotCapacities] = useState({
        BALNEARIO: 2,
    });
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isSavingSlots, setIsSavingSlots] = useState(false);

    const loadSlotCapacities = async () => {
        setIsLoadingSlots(true);
        try {
            const config = await calendarioApi.listarConfiguracaoSlots();
            setSlotCapacities({
                BALNEARIO: config.find(item => item.tipo === 'BALNEARIO')?.capacidadePorSlot ?? 2,
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

    const handleSlotCapacityChange = (value: string) => {
        const parsed = Number.parseInt(value, 10);
        const safeValue = Number.isFinite(parsed) ? Math.min(20, Math.max(1, parsed)) : 1;
        setSlotCapacities(prev => ({ ...prev, BALNEARIO: safeValue }));
    };

    const handleSaveSlotCapacities = async () => {
        setIsSavingSlots(true);
        try {
            await calendarioApi.atualizarConfiguracaoSlot('BALNEARIO', slotCapacities.BALNEARIO);
            toast.success(t('dashboard.admin.messages.slotConfigUpdated'));
            await loadSlotCapacities();
        } catch (error) {
            toast.error(t('dashboard.admin.errors.saveSlotConfig'));
        } finally {
            setIsSavingSlots(false);
        }
    };

    return (
        <div className="space-y-10 max-w-6xl mx-auto">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-foreground">Gestão da Plataforma</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Configure os parâmetros operacionais do Balneário.
                </p>
            </div>
            <SlotsManagement
                isLoadingSlots={isLoadingSlots}
                isSavingSlots={isSavingSlots}
                slotCapacities={slotCapacities}
                onChange={handleSlotCapacityChange}
                onSave={handleSaveSlotCapacities}
                t={t}
            />
        </div>
    );
}
