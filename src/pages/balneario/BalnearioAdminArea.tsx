import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Settings2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { GlassCard } from '../../components/ui/glass-card';
import { calendarioApi } from '../../services/api';
import { WarehouseManagement } from '../../components/balneario/WarehouseManagement';
import { Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function SlotsManagement({
    isLoadingSlots,
    isSavingSlots,
    slotCapacities,
    savedCapacities,
    onChange,
    onSave,
    t,
}: Readonly<{
    isLoadingSlots: boolean;
    isSavingSlots: boolean;
    slotCapacities: { BALNEARIO: number };
    savedCapacities: { BALNEARIO: number };
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
                    <h2 className="mt-2 text-xl font-semibold text-foreground">{t('dashboard.admin.slots.balnearioTitle')}</h2>
                    <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                        {t('dashboard.admin.slots.balnearioDescription')}
                    </p>
                </div>

                {/* Single slot — horizontal card with prominent value display */}
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-stretch">
                        {/* Left: icon + label + description */}
                        <div className="flex items-center gap-4 p-6 sm:flex-1">
                            <div className="flex-shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                                <CalendarDays className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-foreground">{t('dashboard.admin.slots.balnearioScheduleTitle')}</h3>
                                <p className="text-sm text-muted-foreground mt-0.5">{t('dashboard.admin.slots.balnearioScheduleDescription')}</p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="hidden sm:block w-px bg-border my-4" />
                        <div className="block sm:hidden h-px bg-border mx-6" />

                        {/* Right: current value display + input */}
                        <div className="flex items-center gap-6 p-6 sm:w-72">
                            <div className="text-center min-w-[3rem]">
                                <p className="text-5xl font-bold text-primary leading-none">{savedCapacities.BALNEARIO}</p>
                                <p className="text-xs text-muted-foreground mt-1.5">atual</p>
                            </div>
                            <div className="flex-1 space-y-1.5">
                                <Label htmlFor="slot-BALNEARIO" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    {t('dashboard.admin.slots.maxPerSlot')}
                                </Label>
                                <Input
                                    id="slot-BALNEARIO"
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={slotCapacities.BALNEARIO}
                                    onChange={(event) => onChange(event.target.value)}
                                    className="bg-background text-center text-lg font-semibold"
                                />
                            </div>
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

export function BalnearioAdminArea({ mode = 'slots' }: { mode?: 'slots' | 'inventory' }) {
    const { t } = useTranslation();
    const [slotCapacities, setSlotCapacities] = useState({
        BALNEARIO: 2,
    });
    const [savedCapacities, setSavedCapacities] = useState({
        BALNEARIO: 2,
    });
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isSavingSlots, setIsSavingSlots] = useState(false);

    const loadSlotCapacities = async () => {
        setIsLoadingSlots(true);
        try {
            const config = await calendarioApi.listarConfiguracaoSlots();
            const value = config.find(item => item.tipo === 'BALNEARIO')?.capacidadePorSlot ?? 2;
            setSlotCapacities({ BALNEARIO: value });
            setSavedCapacities({ BALNEARIO: value });
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
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/40 pb-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-foreground">
                        {mode === 'slots' ? t('sidebar.slots') : t('sidebar.inventory')}
                    </h1>
                    <p className="text-muted-foreground max-w-2xl">
                        {mode === 'slots' 
                            ? t('dashboard.admin.slots.balnearioDescription') 
                            : t('dashboard.admin.inventoryDescription')}
                    </p>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={mode}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {mode === 'slots' ? (
                        <SlotsManagement
                            isLoadingSlots={isLoadingSlots}
                            isSavingSlots={isSavingSlots}
                            slotCapacities={slotCapacities}
                            savedCapacities={savedCapacities}
                            onChange={handleSlotCapacityChange}
                            onSave={handleSaveSlotCapacities}
                            t={t}
                        />
                    ) : (
                        <WarehouseManagement />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
