import { useState, useEffect, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { calendarioApi, apiRequest } from '../../services/api';
import { armazemApi, StockCheckResult } from '../../services/api/armazem/armazemApi';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
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
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning';
import { UnsavedChangesModal } from '../shared/UnsavedChangesModal';

interface BalnearioAppointmentDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    date: Date;
    time: string;
    funcionarioId: number;
}

// Will be fetched from armazemApi
interface DynamicOption {
    id: number;
    value: string;
    label: string;
    category: string;
}

export function BalnearioAppointmentDialog({ open, onClose, onSuccess, date, time, funcionarioId }: BalnearioAppointmentDialogProps) {
    const { t, i18n } = useTranslation();
    const [name, setName] = useState('');
    const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({});
    const [shoeSize, setShoeSize] = useState('');
    const [notes, setNotes] = useState('');
    const [stockLevels, setStockLevels] = useState<Record<string, StockCheckResult>>({});
    const [shoeSizeStock, setShoeSizeStock] = useState<StockCheckResult | null>(null);
    const [showStockWarning, setShowStockWarning] = useState(false);
    const [pendingClose, setPendingClose] = useState(false);

    const [dynamicOptions, setDynamicOptions] = useState<DynamicOption[]>([]);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [tempReservaId, setTempReservaId] = useState<number | null>(null);
    const tempReservaRef = useRef<number | null>(null);

    const isDirty = useMemo(() => {
        return name.trim() !== '' || Object.values(selectedOptions).some(Boolean) || notes.trim() !== '' || shoeSize !== '';
    }, [name, selectedOptions, notes, shoeSize]);

    const blocker = useUnsavedChangesWarning(isDirty);

    // Reservar slot ao abrir o dialog
    useEffect(() => {
        if (open) {
            reservarSlot();
        }
        // Cleanup: liberar reserva ao fechar ou desmontar
        return () => {
            if (tempReservaRef.current) {
                liberarSlotRef(tempReservaRef.current);
            }
        };
    }, [open]);

    const reservarSlot = async () => {
        try {
            const [hours, minutes] = time.split(':');
            const dateTime = new Date(date);
            dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const now = new Date();
            if (dateTime <= now) {
                toast.error(t('balnearioAppointment.errors.pastDate'));
                onClose();
                return;
            }

            const dateStr = format(date, 'yyyy-MM-dd');
            const isBlocked = await calendarioApi.verificarSlot(dateStr, time, 'BALNEARIO');
            if (isBlocked) {
                toast.error(t('balnearioAppointment.errors.slotUnavailable'));
                onClose();
                return;
            }

            const localDateTime = format(dateTime, "yyyy-MM-dd'T'HH:mm:ss");
            const data = await apiRequest<{ tempId: number }>('/api/marcacoes/reservar-slot', {
                method: 'POST',
                body: JSON.stringify({
                    data: localDateTime,
                    criadoPorId: funcionarioId,
                    tipoAgenda: 'BALNEARIO',
                }),
            });

            setTempReservaId(data.tempId);
            tempReservaRef.current = data.tempId;
        } catch (error: any) {
            console.error('Erro ao reservar slot:', error);
            toast.error(error.message || t('balnearioAppointment.errors.slotOccupied'));
            onClose();
        }
    };

    const liberarSlotRef = async (id: number) => {
        try {
            await apiRequest(`/api/marcacoes/libertar-slot/${id}`, { method: 'DELETE' });
        } catch (error) {
            console.error('Erro ao liberar slot:', error);
        }
    };

    const handleClose = async () => {
        if (tempReservaId) {
            await liberarSlotRef(tempReservaId);
            setTempReservaId(null);
            tempReservaRef.current = null;
        }
        onClose();
    };

    const requestClose = () => {
        if (isDirty) {
            setPendingClose(true);
        } else {
            handleClose();
        }
    };

    const toggleOption = (option: string) => {
        setSelectedOptions((prev) => ({
            ...prev,
            [option]: !prev[option]
        }));
        // If unchecking shoes, clear shoe size
        if (option === 'Sapatos/Sapatilhas' && selectedOptions[option]) {
            setShoeSize('');
            setShoeSizeStock(null);
        }
    };

    // Fetch inventory items to build dynamic options
    useEffect(() => {
        if (open) {
            armazemApi.listarTodos().then(items => {
                const options = items
                    .filter(i => i.categoria !== 'CALCADO') // Special handling for shoes
                    .map(i => ({
                        id: i.id!,
                        value: i.nome,
                        label: t(`consumos.products.${i.nome}`, i.nome),
                        category: i.categoria
                    }));
                
                // Add generic Shoe option if any shoe item exist
                if (items.some(i => i.categoria === 'CALCADO')) {
                    options.push({
                        value: 'Sapatos/Sapatilhas',
                        label: t('balnearioAppointment.options.shoesSneakers'),
                        category: 'VESTUARIO' // Map to clothing group
                    });
                }
                
                setDynamicOptions(options);

                // Initialize stock levels
                const allNames = items.map(i => i.nome);
                allNames.push('Sapatos/Sapatilhas'); // Track generic shoe if needed
                armazemApi.verificarStock(allNames).then(setStockLevels).catch(() => {});
            }).catch(err => {
                console.error('Erro ao carregar itens do armazém:', err);
                toast.error('Não foi possível carregar os itens do armazém.');
            });
        }
    }, [open, t]);

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
        if (stock.estado === 'BAIXO') return t('consumos.lowStock', 'Stock baixo no armazém');
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
    };

    const optionId = (group: string, option: string) =>
        `${group}-${option.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        let newErrors: Record<string, string> = {};
        
        if (selectedOptions['Sapatos/Sapatilhas'] && !shoeSize) {
            newErrors.shoeSize = t('balneario.appointmentDetailsDialog.shoeSizeRequired');
        }

        setErrors(newErrors);
        
        if (Object.keys(newErrors).length > 0) {
            return;
        }

        if (hasStockWarnings()) {
            setShowStockWarning(true);
            return;
        }
        await doSubmit();
    };

    const doSubmit = async () => {
        setIsLoading(true);

        try {
            const dataHora = new Date(date);
            const [hours, minutes] = time.split(':');
            dataHora.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            // Map checklist options to specific booleans and clothing/items array
            let hasHygiene = false;
            let hasLaundry = false;
            const roupasVal: { categoria: string; tamanho?: string; quantidade: number }[] = [];

            Object.entries(selectedOptions).forEach(([option, isSelected]) => {
                if (!isSelected) return;

                const optDetail = dynamicOptions.find(o => o.value === option);
                const category = optDetail?.category || (option === 'Sapatos/Sapatilhas' ? 'VESTUARIO' : 'UNKNOWN');

                if (category === 'HIGIENE') {
                    hasHygiene = true;
                    roupasVal.push({ categoria: option, quantidade: 1, itemId: optDetail?.id });
                } else if (category === 'DETERGENTES') {
                    if (option.startsWith('Lavar Roupa')) {
                        hasLaundry = true;
                    }
                    roupasVal.push({ categoria: option, quantidade: 1, itemId: optDetail?.id });
                } else if (category === 'VESTUARIO' || category === 'CALCADO') {
                    if (option === 'Sapatos/Sapatilhas' && shoeSize) {
                        roupasVal.push({ categoria: option, tamanho: shoeSize, quantidade: 1, itemId: optDetail?.id });
                    } else {
                        roupasVal.push({ categoria: option, quantidade: 1, itemId: optDetail?.id });
                    }
                }
            });

            const payload = {
                data: format(dataHora, "yyyy-MM-dd'T'HH:mm:ss"),
                nomeUtente: name.trim() || t('balnearioAppointment.anonymousName'),
                produtosHigiene: hasHygiene,
                lavagemRoupa: hasLaundry,
                responsavelId: funcionarioId,
                roupas: roupasVal,
                observacoes: notes,
                reservaId: tempReservaId
            };

            await apiRequest<{ id: number }>('/api/marcacoes/balneario', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            
            // Garantir que não chamamos libertar-slot ao desmontar agora que a reserva foi efetivada
            setTempReservaId(null);
            tempReservaRef.current = null;

            toast.success(t('balnearioAppointment.createdSuccess'));

            // Esperar que o backend processe a transação
            await new Promise(resolve => setTimeout(resolve, 500));
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Erro ao registar marcação de balneário:', error);
            toast.error(t('balnearioAppointment.creationFailed', { message: error.message || t('balnearioAppointment.creationFailedFallback') }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && requestClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border text-foreground">
                <DialogHeader>
                    <DialogTitle className="text-foreground">{t('balnearioAppointment.title')}</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        {date.toLocaleDateString(i18n.resolvedLanguage?.startsWith('en') ? 'en-GB' : 'pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} {t('appointmentDialog.at')} {time}
                    </p>
                </DialogHeader>
                <DialogPrimitive.Description className="sr-only">
                    {t('balnearioAppointment.description')}
                </DialogPrimitive.Description>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-foreground font-bold text-base">{t('balnearioAppointment.patientName')}</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder={t('balnearioAppointment.patientNamePlaceholder')}
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (errors.name) setErrors({});
                            }}
                            aria-invalid={!!errors.name}
                            aria-describedby={errors.name ? 'balneario-name-error' : undefined}
                            className={`text-lg py-6 bg-background border-border text-foreground ${errors.name ? 'border-status-error' : ''}`}
                        />
                        {errors.name && <p id="balneario-name-error" className="text-sm text-status-error">{errors.name}</p>}
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-primary border-b border-primary/20 pb-2">{t('balnearioAppointment.patientNeeds')}</h3>

                        <div className="space-y-4">
                            {/* Hygiene */}
                            <div className="bg-muted/40 p-4 rounded-lg border border-border/60">
                                <Label className="font-medium text-foreground/80 block mb-3">{t('balnearioAppointment.hygiene')}</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {dynamicOptions.filter(o => o.category === 'HIGIENE').map((opt) => (
                                        <div key={opt.value} className="flex flex-col">
                                            <div className="flex items-center space-x-3">
                                                <Checkbox
                                                    id={optionId('higiene', opt.value)}
                                                    checked={selectedOptions[opt.value] || false}
                                                    onCheckedChange={() => toggleOption(opt.value)}
                                                    className="data-[state=checked]:bg-primary border-border flex-shrink-0"
                                                />
                                                <label htmlFor={optionId('higiene', opt.value)} className="text-sm cursor-pointer select-none leading-tight">{opt.label}</label>
                                            </div>
                                            {selectedOptions[opt.value] && getStockWarning(opt.value) && (
                                                <p className="ml-8 mt-1 text-xs text-status-error flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    {getStockWarning(opt.value)}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Detergents & Laundry */}
                            <div className="bg-muted/40 p-4 rounded-lg border border-border/60">
                                <Label className="font-medium text-foreground/80 block mb-3">{t('balnearioAppointment.laundry')}</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {dynamicOptions.filter(o => o.category === 'DETERGENTES').map((opt) => (
                                        <div key={opt.value} className="flex flex-col">
                                            <div className="flex items-center space-x-3">
                                                <Checkbox
                                                    id={optionId('detergentes', opt.value)}
                                                    checked={selectedOptions[opt.value] || false}
                                                    onCheckedChange={() => toggleOption(opt.value)}
                                                    className="data-[state=checked]:bg-primary border-border flex-shrink-0"
                                                />
                                                <label htmlFor={optionId('detergentes', opt.value)} className="text-sm cursor-pointer select-none leading-tight">{opt.label}</label>
                                            </div>
                                            {selectedOptions[opt.value] && getStockWarning(opt.value) && (
                                                <p className="ml-8 mt-1 text-xs text-status-error flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    {getStockWarning(opt.value)}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Clothing */}
                            <div className="bg-muted/40 p-4 rounded-lg border border-border/60">
                                <Label className="font-medium text-foreground/80 block mb-3">{t('balnearioAppointment.clothing')}</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {dynamicOptions.filter(o => o.category === 'VESTUARIO').map((opt) => (
                                        <div key={opt.value} className="flex flex-col">
                                            <div className="flex items-center space-x-3">
                                                <Checkbox
                                                    id={optionId('vestuario', opt.value)}
                                                    checked={selectedOptions[opt.value] || false}
                                                    onCheckedChange={() => toggleOption(opt.value)}
                                                    className="data-[state=checked]:bg-primary border-border flex-shrink-0"
                                                />
                                                <label htmlFor={optionId('vestuario', opt.value)} className="text-sm cursor-pointer select-none leading-tight">{opt.label}</label>
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
                                                            onChange={(e) => {
                                                                handleShoeSizeChange(e.target.value);
                                                                if (errors.shoeSize) setErrors({ ...errors, shoeSize: '' });
                                                            }}
                                                            placeholder="35-46"
                                                            className={`w-20 h-7 text-sm text-center bg-background ${errors.shoeSize ? 'border-status-error' : 'border-border'}`}
                                                            maxLength={2}
                                                        />
                                                    </div>
                                                    {errors.shoeSize && (
                                                        <p className="text-xs text-status-error">{errors.shoeSize}</p>
                                                    )}
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
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-foreground">{t('balnearioAppointment.additionalNotes')}</Label>
                        <Textarea
                            id="notes"
                            placeholder={t('balnearioAppointment.notesPlaceholder')}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="bg-background border-border text-foreground"
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={requestClose} className="flex-1" disabled={isLoading}>
                            {t('appointmentDialog.actions.cancel')}
                        </Button>
                        <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                            {isLoading ? t('balnearioAppointment.saving') : t('balnearioAppointment.confirmBook')}
                        </Button>
                    </div>
                </form>
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
                        onClick={() => { setShowStockWarning(false); doSubmit(); }}
                        className="bg-[color:var(--status-warning)] hover:bg-[color:var(--status-warning)]/90 text-primary-foreground"
                    >
                        {t('consumos.stockWarningContinue', 'Sim, continuar')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <UnsavedChangesModal 
            isOpen={blocker.state === 'blocked' || pendingClose}
            onConfirm={() => {
                if (blocker.state === 'blocked') blocker.proceed?.();
                if (pendingClose) {
                    setPendingClose(false);
                    setTimeout(() => {
                        handleClose();
                    }, 100);
                }
            }}
            onCancel={() => {
                if (blocker.state === 'blocked') blocker.reset?.();
                if (pendingClose) setPendingClose(false);
            }}
        />
        </>
    );
}
