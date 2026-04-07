import { useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';
import { XIcon } from '../shared/CustomIcons';
import { Save, AlertTriangle } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from '../ui/alert-dialog';
import { Appointment } from '../../types';
import { marcacoesApi } from '../../services/api';
import { armazemApi, StockCheckResult } from '../../services/api/armazem/armazemApi';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge } from '../shared/status-badge';
import { useTranslation } from 'react-i18next';

interface BalnearioAppointmentDetailsDialogProps {
    open: boolean;
    onClose: () => void;
    appointment: Appointment;
    onUpdate: (id: string, updates: Partial<Appointment>) => void;
    onCancel: (id: string, reason: string) => void;
}

const HYGIENE_OPTIONS = [
    { value: 'Champô', labelKey: 'balnearioAppointment.options.shampoo' },
    { value: 'Gel de Banho', labelKey: 'balnearioAppointment.options.showerGel' },
    { value: 'Toalha', labelKey: 'balnearioAppointment.options.towel' },
    { value: 'Sabonete/Creme', labelKey: 'balnearioAppointment.options.soapCream' },
];
const LAUNDRY_OPTIONS = [
    { value: 'Lavar Roupa Seca', labelKey: 'balnearioAppointment.options.washDryClothes' },
    { value: 'Lavar Roupa Molhada', labelKey: 'balnearioAppointment.options.washWetClothes' },
];
const CLOTHING_OPTIONS = [
    { value: 'T-shirt/Camisola', labelKey: 'balnearioAppointment.options.shirtSweater' },
    { value: 'Calças', labelKey: 'balnearioAppointment.options.pants' },
    { value: 'Sapatos/Sapatilhas', labelKey: 'balnearioAppointment.options.shoesSneakers' },
    { value: 'Roupa Interior', labelKey: 'balnearioAppointment.options.underwear' },
    { value: 'Meias', labelKey: 'balnearioAppointment.options.socks' },
    { value: 'Agasalho/Casaco', labelKey: 'balnearioAppointment.options.coatJacket' },
];

export function BalnearioAppointmentDetailsDialog({
    open,
    onClose,
    appointment,
    onUpdate,
    onCancel
}: BalnearioAppointmentDetailsDialogProps) {
    const { user: authUser } = useAuth();
    const { t, i18n } = useTranslation();

    // Editable state for the checklist
    const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({});
    const [shoeSize, setShoeSize] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [stockLevels, setStockLevels] = useState<Record<string, StockCheckResult>>({});
    const [shoeSizeStock, setShoeSizeStock] = useState<StockCheckResult | null>(null);
    const [showStockWarning, setShowStockWarning] = useState(false);

    // Initialize editable state from appointment data whenever dialog opens or appointment changes
    useEffect(() => {
        if (!open) return;

        const initial: Record<string, boolean> = {};
        const details = appointment.balnearioDetails;

        // Restore individual items from roupas array (all items stored there)
        if (details?.roupas) {
            details.roupas.forEach(roupa => {
                const allOptions = [...HYGIENE_OPTIONS, ...LAUNDRY_OPTIONS, ...CLOTHING_OPTIONS];
                if (allOptions.some(opt => opt.value === roupa.categoria)) {
                    initial[roupa.categoria] = true;
                }
            });
        }

        // Fallback: if booleans are set but no matching roupas found (old data),
        // don't auto-check all options — leave them unchecked so the user can pick

        setSelectedOptions(initial);
        setHasChanges(false);

        // Restore shoe size from roupas
        const shoeItem = details?.roupas?.find(r => r.categoria === 'Sapatos/Sapatilhas');
        setShoeSize(shoeItem?.tamanho || '');

        // Fetch stock levels
        const allItems = [...HYGIENE_OPTIONS, ...LAUNDRY_OPTIONS, ...CLOTHING_OPTIONS].map(o => o.value);
        armazemApi.verificarStock(allItems).then(setStockLevels).catch(() => {});
    }, [open, appointment]);

    const toggleOption = (option: string) => {
        setSelectedOptions(prev => {
            const updated = { ...prev, [option]: !prev[option] };
            setHasChanges(true);
            // Clear shoe size when unchecking shoes
            if (option === 'Sapatos/Sapatilhas' && prev[option]) {
                setShoeSize('');
                setShoeSizeStock(null);
            }
            return updated;
        });
    };

    // Check shoe size stock
    useEffect(() => {
        if (shoeSize && shoeSize.length >= 2) {
            armazemApi.verificarStockCalcado([shoeSize]).then(result => {
                setShoeSizeStock(result[shoeSize] || null);
            }).catch(() => {});
        } else {
            setShoeSizeStock(null);
        }
    }, [shoeSize]);

    const getStockWarning = (optionValue: string): string | null => {
        const stock = stockLevels[optionValue];
        if (!stock || !stock.tracked) return null;
        if (stock.esgotado) return t('consumos.outOfStock', 'Esgotado no armazém');
        if (stock.estado === 'BAIXO') return t('consumos.lowStock', 'Baixo no armazém');
        return null;
    };

    // Check if any selected items have stock issues
    const hasStockWarnings = (): boolean => {
        for (const [option, isSelected] of Object.entries(selectedOptions)) {
            if (!isSelected) continue;
            if (option === 'Sapatos/Sapatilhas') {
                if (shoeSizeStock && shoeSizeStock.tracked && (shoeSizeStock.esgotado || shoeSizeStock.estado === 'BAIXO')) return true;
            } else {
                const warning = getStockWarning(option);
                if (warning) return true;
            }
        }
        return false;
    };

    // Handle shoe size input - only digits, max 2 chars
    const handleShoeSizeChange = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 2);
        setShoeSize(digits);
        setHasChanges(true);
    };

    const handleSaveDetails = async () => {
        setIsSaving(true);
        try {
            const hasHygiene = HYGIENE_OPTIONS.some(opt => selectedOptions[opt.value]);
            const hasLaundry = LAUNDRY_OPTIONS.some(opt => selectedOptions[opt.value]);

            // Store ALL selected items (hygiene + laundry + clothing) in roupas
            const allOptions = [...HYGIENE_OPTIONS, ...LAUNDRY_OPTIONS, ...CLOTHING_OPTIONS].map(opt => opt.value);
            const roupasVal = allOptions
                .filter(opt => selectedOptions[opt])
                .map(opt => {
                    if (opt === 'Sapatos/Sapatilhas' && shoeSize) {
                        return { categoria: opt, tamanho: shoeSize, quantidade: 1 };
                    }
                    return { categoria: opt, quantidade: 1 };
                });

            await marcacoesApi.atualizarDetalhesBalneario(parseInt(appointment.id), {
                produtosHigiene: hasHygiene,
                lavagemRoupa: hasLaundry,
                roupas: roupasVal,
            });

            // Update local state
            onUpdate(appointment.id, {
                balnearioDetails: {
                    produtosHigiene: hasHygiene,
                    lavagemRoupa: hasLaundry,
                    roupas: roupasVal.map((r, i) => ({ id: i, categoria: r.categoria, tamanho: r.tamanho || '', quantidade: r.quantidade })),
                }
            });

            toast.success(t('balnearioAppointmentDetails.detailsUpdated'));
            setHasChanges(false);
        } catch (error: any) {
            const msg = error.message || t('balnearioAppointmentDetails.saveError');
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelAppointment = async () => {
        const reason = t('balnearioAppointmentDetails.cancelledByStaff');

        if (!authUser?.id) return;

        try {
            await marcacoesApi.atualizarEstado(
                parseInt(appointment.id),
                'CANCELADO',
                authUser.id,
                appointment.version,
                reason
            );

            onCancel(appointment.id, reason);
            onUpdate(appointment.id, { status: 'cancelled', cancellationReason: reason });
            toast.success(t('balnearioAppointmentDetails.cancelledSuccess'));
            onClose();
        } catch (error: any) {
            const mensagemErro = error.response?.data?.message || error.message || t('balnearioAppointmentDetails.cancelError');
            toast.error(mensagemErro);
        }
    };

    const handleCompleteAppointment = async () => {
        if (!authUser?.id) return;

        try {
            await marcacoesApi.atualizarEstado(
                parseInt(appointment.id),
                'CONCLUIDO',
                authUser.id,
                appointment.version
            );

            onUpdate(appointment.id, { status: 'completed' });
            toast.success(t('balnearioAppointmentDetails.completeSuccess'));
            onClose();
        } catch (error: any) {
            const mensagemErro = error.response?.data?.message || error.message || t('balnearioAppointmentDetails.completeError');
            toast.error(mensagemErro);
        }
    };

    const handleNoShowAppointment = async () => {
        if (!authUser?.id) return;

        try {
            await marcacoesApi.atualizarEstado(
                parseInt(appointment.id),
                'NAO_COMPARECIDO',
                authUser.id,
                appointment.version
            );

            onUpdate(appointment.id, { status: 'no-show' });
            toast.success(t('appointmentDetails.markedNoShow'));
            onClose();
        } catch (error: any) {
            const mensagemErro = error.response?.data?.message || error.message || t('appointmentDetails.statusUpdateFailed');
            toast.error(mensagemErro);
        }
    };

    const handleStartAppointment = () => {
        if (!authUser?.id) return;
        if (hasStockWarnings()) {
            setShowStockWarning(true);
            return;
        }
        doStartAppointment();
    };

    const doStartAppointment = async () => {
        if (!authUser?.id) return;

        try {
            await marcacoesApi.atualizarEstado(
                parseInt(appointment.id),
                'EM_PROGRESSO',
                authUser.id,
                appointment.version
            );

            onUpdate(appointment.id, { status: 'in-progress' });
            toast.success(t('balnearioAppointmentDetails.startedSuccess'));
            onClose();
        } catch (error: any) {
            const mensagemErro = error.response?.data?.message || error.message || t('appointmentDetails.startFailed');
            toast.error(mensagemErro);
        }
    };

    const getOptionLabel = (value: string) => {
        const option = [...HYGIENE_OPTIONS, ...LAUNDRY_OPTIONS, ...CLOTHING_OPTIONS].find(item => item.value === value);
        return option ? t(option.labelKey) : value;
    };

    const isEditable = appointment.status === 'scheduled' || appointment.status === 'warning' || appointment.status === 'in-progress';

    const dateObj = new Date(appointment.date);
    const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-GB' : 'pt-PT';
    const dayName = dateObj.toLocaleDateString(locale, { weekday: 'long' });
    const day = dateObj.getDate();
    const month = dateObj.toLocaleDateString(locale, { month: 'long' });
    const year = dateObj.getFullYear();
    const dateString = t('balnearioAppointmentDetails.dateString', { dayName, day, month, year, time: appointment.time });

    return (
        <>
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent hideCloseButton className="max-w-xl p-0 bg-card border-border flex flex-col max-h-[90vh]">
                <DialogTitle className="sr-only">{t('balnearioAppointmentDetails.dialogTitle')}</DialogTitle>
                <DialogPrimitive.Description className="sr-only">
                    {t('balnearioAppointmentDetails.dialogDescription')}
                </DialogPrimitive.Description>

                {/* Header - Fixed */}
                <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-lg font-bold text-foreground">{t('balnearioAppointmentDetails.title')}</h2>
                            <StatusBadge status={appointment.status} size="md" />
                        </div>
                        <p className="text-sm text-muted-foreground">{dateString}</p>
                        {/* Duração da marcação balneário */}
                        <div className="mt-2 flex items-center gap-2">
                            <Label className="text-xs font-medium text-foreground/80">
                                {t('appointmentDialog.durationLabel', 'Duração da marcação')}
                            </Label>
                            <Badge className="text-xs bg-primary/10 text-primary border-primary/30">
                                {t('appointmentDialog.durationBalneario', '30 minutos')}
                            </Badge>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        aria-label={t('appointmentDetails.closeDetails')}
                    >
                        <XIcon className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    {/* Patient Name */}
                    <div className="bg-muted/50 rounded-xl p-5 border border-border">
                        <Label className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2 mb-2">
                            {t('balnearioAppointmentDetails.patientName')}
                        </Label>
                        <p className="text-2xl font-bold text-foreground">{appointment.patientName}</p>
                    </div>

                    {/* Cancellation info */}
                    {appointment.status === 'cancelled' && appointment.cancellationReason && (
                        <div className="bg-[color:var(--status-error-soft)]/50 border border-[color:var(--status-error)]/40 rounded-xl p-4">
                            <p className="text-sm font-bold text-status-error mb-1">
                                {t('appointmentDetails.cancelledAppointment')}
                            </p>
                            <p className="text-sm text-status-error">
                                {t('appointmentDetails.reason')}: {appointment.cancellationReason}
                            </p>
                        </div>
                    )}

                    {/* Editable Checklist */}
                    <div>
                        <Label className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
                            {t('balnearioAppointmentDetails.markedNeeds')}
                            {isEditable && <span className="text-xs font-normal text-muted-foreground">({t('balnearioAppointmentDetails.editable')})</span>}
                        </Label>

                        {isEditable ? (
                            <div className="space-y-4">
                                {/* Hygiene */}
                                <div className="bg-muted/40 p-4 rounded-lg border border-border/60">
                                    <Label className="font-medium text-foreground/80 block mb-3">{t('balnearioAppointment.hygiene')}</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {HYGIENE_OPTIONS.map((opt) => (
                                            <div key={opt.value} className="flex items-center space-x-3">
                                                <Checkbox
                                                    id={`detail-${opt.value}`}
                                                    checked={selectedOptions[opt.value] || false}
                                                    onCheckedChange={() => toggleOption(opt.value)}
                                                    className="data-[state=checked]:bg-primary border-border flex-shrink-0"
                                                />
                                                <label htmlFor={`detail-${opt.value}`} className="text-sm cursor-pointer select-none text-foreground/80">{t(opt.labelKey)}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Laundry */}
                                <div className="bg-muted/40 p-4 rounded-lg border border-border/60">
                                    <Label className="font-medium text-foreground/80 block mb-3">{t('balnearioAppointment.laundry')}</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {LAUNDRY_OPTIONS.map((opt) => (
                                            <div key={opt.value} className="flex items-center space-x-3">
                                                <Checkbox
                                                    id={`detail-${opt.value}`}
                                                    checked={selectedOptions[opt.value] || false}
                                                    onCheckedChange={() => toggleOption(opt.value)}
                                                    className="data-[state=checked]:bg-primary border-border flex-shrink-0"
                                                />
                                                <label htmlFor={`detail-${opt.value}`} className="text-sm cursor-pointer select-none text-foreground/80">{t(opt.labelKey)}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Clothing */}
                                <div className="bg-muted/40 p-4 rounded-lg border border-border/60">
                                    <Label className="font-medium text-foreground/80 block mb-3">{t('balnearioAppointment.clothing')}</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {CLOTHING_OPTIONS.map((opt) => (
                                            <div key={opt.value} className="flex flex-col">
                                                <div className="flex items-center space-x-3">
                                                    <Checkbox
                                                        id={`detail-${opt.value}`}
                                                        checked={selectedOptions[opt.value] || false}
                                                        onCheckedChange={() => toggleOption(opt.value)}
                                                        className="data-[state=checked]:bg-primary border-border flex-shrink-0"
                                                    />
                                                    <label htmlFor={`detail-${opt.value}`} className="text-sm cursor-pointer select-none text-foreground/80">{t(opt.labelKey)}</label>
                                                </div>
                                                {/* Shoe size input */}
                                                {opt.value === 'Sapatos/Sapatilhas' && selectedOptions[opt.value] && (
                                                    <div className="ml-8 mt-2 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <Label className="text-xs text-muted-foreground">{t('consumos.shoeSize', 'Nº calçado')}:</Label>
                                                            <Input
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={shoeSize}
                                                                onChange={(e) => handleShoeSizeChange(e.target.value)}
                                                                placeholder="35-46"
                                                                className="w-20 h-7 text-sm text-center border-border bg-background"
                                                                maxLength={2}
                                                            />
                                                        </div>
                                                        {shoeSizeStock && shoeSizeStock.tracked && shoeSizeStock.esgotado && (
                                                            <p className="text-xs text-status-error flex items-center gap-1">
                                                                <AlertTriangle className="w-3 h-3" />
                                                                {t('consumos.outOfStock', 'Esgotado no armazém')}
                                                            </p>
                                                        )}
                                                        {shoeSizeStock && shoeSizeStock.tracked && !shoeSizeStock.esgotado && shoeSizeStock.estado === 'BAIXO' && (
                                                            <p className="text-xs text-status-warning flex items-center gap-1">
                                                                <AlertTriangle className="w-3 h-3" />
                                                                {t('consumos.lowStock', 'Baixo no armazém')} ({shoeSizeStock.quantidade} {t('consumos.pairs', 'pares')})
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                                {/* Stock warning for non-shoe items */}
                                                {opt.value !== 'Sapatos/Sapatilhas' && selectedOptions[opt.value] && getStockWarning(opt.value) && (
                                                    <p className="ml-8 mt-1 text-xs text-status-error flex items-center gap-1">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        {getStockWarning(opt.value)}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Save Button */}
                                {hasChanges && (
                                    <Button
                                        onClick={handleSaveDetails}
                                        disabled={isSaving}
                                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {isSaving ? t('balnearioAppointment.saving') : t('balnearioAppointmentDetails.saveChanges')}
                                    </Button>
                                )}
                            </div>
                        ) : (
                            /* Read-only view for completed/cancelled/no-show */
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('balnearioAppointmentDetails.requestedServices')}</h4>
                                {(!appointment.balnearioDetails?.produtosHigiene &&
                                    !appointment.balnearioDetails?.lavagemRoupa &&
                                    (!appointment.balnearioDetails?.roupas || appointment.balnearioDetails.roupas.length === 0)) ? (
                                    <p className="text-sm text-muted-foreground italic">{t('balnearioAppointmentDetails.noSpecificServices')}</p>
                                ) : (
                                    <>
                                        {appointment.balnearioDetails?.produtosHigiene && (
                                            <div className="flex items-center gap-2 text-sm text-foreground/80 bg-muted/40 p-2 rounded-md">
                                                <div className="w-1.5 h-1.5 rounded-full bg-status-info"></div>
                                                {t('balnearioAppointmentDetails.hygieneProducts')}
                                            </div>
                                        )}

                                        {appointment.balnearioDetails?.lavagemRoupa && (
                                            <div className="flex items-center gap-2 text-sm text-foreground/80 bg-muted/40 p-2 rounded-md">
                                                <div className="w-1.5 h-1.5 rounded-full bg-status-info"></div>
                                                {t('balnearioAppointmentDetails.laundryService')}
                                            </div>
                                        )}

                                        {appointment.balnearioDetails?.roupas && appointment.balnearioDetails.roupas.map((roupa, index) => (
                                            <div key={index} className="flex items-center gap-2 text-sm text-foreground/80 bg-muted/40 p-2 rounded-md">
                                                <div className="w-1.5 h-1.5 rounded-full bg-status-info"></div>
                                                {t('balnearioAppointmentDetails.supplyItem', {
                                                    category: getOptionLabel(roupa.categoria),
                                                    sizePart: roupa.tamanho ? ` (${t('balnearioAppointmentDetails.size')}: ${roupa.tamanho})` : '',
                                                    quantity: roupa.quantidade
                                                })}
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Additional Notes */}
                    {appointment.description && appointment.description !== 'Serviços Logísticos' && (
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('balnearioAppointment.additionalNotes')}:</h4>
                            <p className="text-sm text-foreground/80 bg-[color:var(--status-warning-soft)]/40 p-3 rounded-md whitespace-pre-wrap border border-[color:var(--status-warning)]/30">
                                {appointment.description}
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 pt-4 pb-2 border-t border-border/60">
                        {(appointment.status === 'scheduled' || appointment.status === 'warning') && (
                            <div className="space-y-3 mb-2">
                                <Button
                                    onClick={handleStartAppointment}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm transition-all py-6 h-auto"
                                >
                                    {t('balnearioAppointmentDetails.markPresent')}
                                </Button>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="destructive"
                                        onClick={handleCancelAppointment}
                                        className="w-full h-11"
                                    >
                                        {t('balnearioAppointmentDetails.cancelAppointment')}
                                    </Button>
                                    <Button
                                        onClick={handleNoShowAppointment}
                                        variant="warning"
                                        className="w-full h-11 font-medium"
                                    >
                                        {t('balnearioAppointmentDetails.missedAppointment')}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {appointment.status === 'in-progress' && (
                            <Button
                                onClick={handleCompleteAppointment}
                                className="bg-[color:var(--status-success)] hover:bg-[color:var(--status-success)]/90 text-primary-foreground font-medium w-full py-6 h-auto mb-2"
                            >
                                {t('balnearioAppointmentDetails.completeService')}
                            </Button>
                        )}

                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* Stock warning confirmation popup */}
        <AlertDialog open={showStockWarning} onOpenChange={setShowStockWarning}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-status-warning" />
                        {t('consumos.stockWarningTitle', 'Aviso de Stock')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('consumos.stockWarningDescription', 'Alguns itens selecionados estão com stock baixo ou esgotados no armazém. Deseja continuar mesmo assim?')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('appointmentDialog.actions.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => { setShowStockWarning(false); doStartAppointment(); }}
                        className="bg-[color:var(--status-warning)] hover:bg-[color:var(--status-warning)]/90 text-primary-foreground"
                    >
                        {t('consumos.stockWarningContinue', 'Sim, continuar')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
