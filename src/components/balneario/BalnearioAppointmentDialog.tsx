import { useState, useEffect, useRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { calendarioApi, apiRequest } from '../../services/api';

interface BalnearioAppointmentDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    date: Date;
    time: string;
    funcionarioId: number;
}

const HYGIENE_OPTIONS = ['Shampoo', 'Gel de Banho', 'Toalha', 'Sabonete/Creme'];
const LAUNDRY_OPTIONS = ['Lavar Roupa Seca', 'Lavar Roupa Molhada'];
const CLOTHING_OPTIONS = ['T-shirt/Camisola', 'Calças', 'Sapatos/Sapatilhas', 'Roupa Interior', 'Meias', 'Agasalho/Casaco'];

export function BalnearioAppointmentDialog({ open, onClose, onSuccess, date, time, funcionarioId }: BalnearioAppointmentDialogProps) {
    const [name, setName] = useState('');
    const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({});
    const [notes, setNotes] = useState('');

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [tempReservaId, setTempReservaId] = useState<number | null>(null);
    const tempReservaRef = useRef<number | null>(null);

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
                toast.error('Não é possível marcar para uma data/hora no passado');
                onClose();
                return;
            }

            const dateStr = date.toISOString().split('T')[0];
            const isBlocked = await calendarioApi.verificarSlot(dateStr, time);
            if (isBlocked) {
                toast.error('Horário indisponível');
                onClose();
                return;
            }

            const localDateTime = dateTime.toISOString().slice(0, 19);
            const data = await apiRequest<{ tempId: number }>('/api/marcacoes/reservar-slot', {
                method: 'POST',
                body: JSON.stringify({
                    data: localDateTime,
                    criadoPorId: funcionarioId,
                }),
            });

            setTempReservaId(data.tempId);
            tempReservaRef.current = data.tempId;
        } catch (error: any) {
            console.error('Erro ao reservar slot:', error);
            toast.error(error.message || 'Este horário já está ocupado');
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

    const toggleOption = (option: string) => {
        setSelectedOptions((prev) => ({
            ...prev,
            [option]: !prev[option]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();



        setIsLoading(true);

        try {
            if (tempReservaId) {
                await apiRequest(`/api/marcacoes/libertar-slot/${tempReservaId}`, { method: 'DELETE' });
                setTempReservaId(null);
            }

            const dataHora = new Date(date);
            const [hours, minutes] = time.split(':');
            dataHora.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            // Map checklist options to specific booleans and clothing array
            let hasHygiene = false;
            let hasLaundry = false;
            const roupasVal: { categoria: string, quantidade: number }[] = [];

            Object.entries(selectedOptions).forEach(([option, isSelected]) => {
                if (!isSelected) return;

                if (option === 'Produtos de higiene' || option === 'Gel de banho' || option === 'Shampoo/Amaciador') {
                    hasHygiene = true;
                } else if (option === 'Lavar a roupa') {
                    hasLaundry = true;
                } else if (option === 'Peças de vestuário' || option === 'Roupa interior') {
                    // This is grouped, but for tracking let's record the category
                    roupasVal.push({ categoria: option, quantidade: 1 });
                } else if (option === 'Calças' || option === 'Sapatos' || option === 'T-shirts/Casacos') {
                    roupasVal.push({ categoria: option, quantidade: 1 });
                }
            });

            const payload = {
                data: dataHora.toISOString().slice(0, 19),
                nomeUtente: name.trim() || 'Anónimo',
                produtosHigiene: hasHygiene,
                lavagemRoupa: hasLaundry,
                responsavelId: funcionarioId,
                roupas: roupasVal
            };

            await apiRequest<{ id: number }>('/api/marcacoes/balneario', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            toast.success('Marcação de balneário registada!');

            // Esperar que o backend processe a transação
            await new Promise(resolve => setTimeout(resolve, 500));
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Erro ao registar marcação de balneário:', error);
            toast.error(`Erro: ${error.message || 'Falha na criação'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
                <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-gray-100">Registar Banho</DialogTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {date.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} às {time}
                    </p>
                </DialogHeader>
                <DialogPrimitive.Description className="sr-only">
                    Formulário para agendamento de banhos rápidos.
                </DialogPrimitive.Description>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-900 dark:text-gray-100 font-bold text-base">Nome do Utente</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Ex: João da Silva"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (errors.name) setErrors({});
                            }}
                            className={`text-lg py-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${errors.name ? 'border-red-500' : ''}`}
                        />
                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-purple-700 dark:text-purple-400 border-b border-purple-100 dark:border-purple-900/40 pb-2">Necessidades do Utente</h3>

                        <div className="space-y-4">
                            {/* Hygiene */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                                <Label className="font-medium text-gray-700 dark:text-gray-300 block mb-3">Higiene</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {HYGIENE_OPTIONS.map((opt) => (
                                        <div key={opt} className="flex items-center space-x-3">
                                            <Checkbox
                                                id={`opt-${opt}`}
                                                checked={selectedOptions[opt] || false}
                                                onCheckedChange={() => toggleOption(opt)}
                                                className="data-[state=checked]:bg-purple-600 border-gray-300 dark:border-gray-600 flex-shrink-0"
                                            />
                                            <label htmlFor={`opt-${opt}`} className="text-sm cursor-pointer select-none leading-tight">{opt}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Laundry */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                                <Label className="font-medium text-gray-700 dark:text-gray-300 block mb-3">Lavandaria</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {LAUNDRY_OPTIONS.map((opt) => (
                                        <div key={opt} className="flex items-center space-x-3">
                                            <Checkbox
                                                id={`opt-${opt}`}
                                                checked={selectedOptions[opt] || false}
                                                onCheckedChange={() => toggleOption(opt)}
                                                className="data-[state=checked]:bg-purple-600 border-gray-300 dark:border-gray-600 flex-shrink-0"
                                            />
                                            <label htmlFor={`opt-${opt}`} className="text-sm cursor-pointer select-none leading-tight">{opt}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Clothing */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                                <Label className="font-medium text-gray-700 dark:text-gray-300 block mb-3">Vestuário</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {CLOTHING_OPTIONS.map((opt) => (
                                        <div key={opt} className="flex items-center space-x-3">
                                            <Checkbox
                                                id={`opt-${opt}`}
                                                checked={selectedOptions[opt] || false}
                                                onCheckedChange={() => toggleOption(opt)}
                                                className="data-[state=checked]:bg-purple-600 border-gray-300 dark:border-gray-600 flex-shrink-0"
                                            />
                                            <label htmlFor={`opt-${opt}`} className="text-sm cursor-pointer select-none leading-tight">{opt}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-gray-900 dark:text-gray-100">Notas Adicionais</Label>
                        <Textarea
                            id="notes"
                            placeholder="Ex: Alergias, cuidados especiais, tamanho de roupa..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                        <Button type="button" variant="outline" onClick={handleClose} className="flex-1" disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" disabled={isLoading}>
                            {isLoading ? 'A Guardar...' : 'Confirmar e Marcar'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
