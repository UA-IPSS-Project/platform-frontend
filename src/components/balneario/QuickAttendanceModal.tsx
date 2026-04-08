import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';
import { marcacoesApi } from '../../services/api';
import { Loader2, UserPlus, ShowerHead, Shirt, Info } from 'lucide-react';

interface QuickAttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    funcionarioId: number;
    isDarkMode: boolean;
}

export function QuickAttendanceModal({ isOpen, onClose, onSuccess, funcionarioId }: QuickAttendanceModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nomeUtente: '',
        produtosHigiene: false,
        lavagemRoupa: false,
        observacoes: '',
        data: new Date().toISOString(),
        responsavelId: funcionarioId
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nomeUtente.trim()) {
            toast.error('O nome do utente é obrigatório');
            return;
        }

        setLoading(true);
        try {
            // Chamada ao novo endpoint de presença rápida
            await marcacoesApi.registarPresencaRapidaBalneario({
                ...formData,
                data: new Date().toISOString() // Garantir hora atual do sistema
            });
            
            toast.success('Presença registada com sucesso!');
            onSuccess();
            onClose();
            // Reset form
            setFormData({
                nomeUtente: '',
                produtosHigiene: false,
                lavagemRoupa: false,
                observacoes: '',
                data: new Date().toISOString(),
                responsavelId: funcionarioId
            });
        } catch (error) {
            console.error('Erro ao registar presença:', error);
            toast.error('Erro ao registar presença rápida');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-purple-600" />
                        Registo de Presença Rápida (Walk-in)
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nomeUtente">Nome do Utente</Label>
                            <Input
                                id="nomeUtente"
                                placeholder="Ex: João Silva"
                                value={formData.nomeUtente}
                                onChange={(e) => setFormData({ ...formData, nomeUtente: e.target.value })}
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer" 
                                 onClick={() => setFormData({ ...formData, produtosHigiene: !formData.produtosHigiene })}>
                                <Checkbox 
                                    id="produtosHigiene" 
                                    checked={formData.produtosHigiene}
                                    onCheckedChange={(checked) => setFormData({ ...formData, produtosHigiene: !!checked })}
                                />
                                <label htmlFor="produtosHigiene" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                    <ShowerHead className="w-4 h-4 text-blue-500" />
                                    Banho
                                </label>
                            </div>

                            <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                 onClick={() => setFormData({ ...formData, lavagemRoupa: !formData.lavagemRoupa })}>
                                <Checkbox 
                                    id="lavagemRoupa" 
                                    checked={formData.lavagemRoupa}
                                    onCheckedChange={(checked) => setFormData({ ...formData, lavagemRoupa: !!checked })}
                                />
                                <label htmlFor="lavagemRoupa" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                    <Shirt className="w-4 h-4 text-green-500" />
                                    Lavagem de Roupa
                                </label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="observacoes">Observações</Label>
                            <Input
                                id="observacoes"
                                placeholder="Opcional..."
                                value={formData.observacoes}
                                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg flex gap-3 text-xs text-purple-700 dark:text-purple-300">
                        <Info className="w-4 h-4 flex-shrink-0" />
                        <p>Este registo criará uma presença imediata com estado "EM PROGRESSO" e descontará os itens base do stock.</p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white">
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    A processar...
                                </>
                            ) : (
                                'Confirmar Presença'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
