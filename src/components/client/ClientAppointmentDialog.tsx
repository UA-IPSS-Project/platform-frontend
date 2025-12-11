import { useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface ClientAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  date: Date;
  time: string;
  utenteId: number;
  onSuccess?: () => void;
}

import SUBJECTS from '../../lib/subjects';
import { calendarioApi } from '../../services/api';

export function ClientAppointmentDialog({ open, onClose, date, time, utenteId, onSuccess }: ClientAppointmentDialogProps) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [documents, setDocuments] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [tempReservaId, setTempReservaId] = useState<number | null>(null);

  // Reservar slot ao abrir o dialog
  useEffect(() => {
    if (open) {
      reservarSlot();
    }
    
    // Cleanup: liberar reserva ao fechar ou desmontar
    return () => {
      if (tempReservaId) {
        liberarSlot();
      }
    };
  }, [open]);

  const reservarSlot = async () => {
    try {
      const [hours, minutes] = time.split(':');
      const dateTime = new Date(date);
      dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // Validar se a data/hora não é no passado
      const now = new Date();
      if (dateTime <= now) {
        toast.error('Não é possível marcar para uma data/hora no passado');
        onClose();
        return;
      }

      // Verificar se o slot está bloqueado
      const dateStr = date.toISOString().split('T')[0];
      const isBlocked = await calendarioApi.verificarSlot(dateStr, time);
      if (isBlocked) {
        toast.error('Este horário está bloqueado (fim de semana ou feriado)');
        onClose();
        return;
      }
      
      const localDateTime = dateTime.toISOString().slice(0, 19);

      const response = await fetch('http://localhost:8080/api/marcacoes/reservar-slot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          data: localDateTime,
          utenteId: utenteId,
          criadoPorId: utenteId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTempReservaId(data.tempId);
        console.log('Slot reservado temporariamente:', data.tempId);
      } else {
        const error = await response.text();
        toast.error('Este horário já está ocupado');
        onClose();
      }
    } catch (error) {
      console.error('Erro ao reservar slot:', error);
      toast.error('Erro ao verificar disponibilidade');
      onClose();
    }
  };

  const liberarSlot = async () => {
    if (!tempReservaId) return;
    
    try {
      await fetch(`http://localhost:8080/api/marcacoes/libertar-slot/${tempReservaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Slot liberado:', tempReservaId);
      setTempReservaId(null);
    } catch (error) {
      console.error('Erro ao liberar slot:', error);
    }
  };

  const handleClose = async () => {
    // Liberar slot antes de fechar
    await liberarSlot();
    onClose();
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!subject) newErrors.subject = 'Selecione um assunto';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Preencha o assunto da marcação');
      return;
    }

    setIsLoading(true);
    try {
      // 1. PRIMEIRO: Liberar slot temporário
      if (tempReservaId) {
        await fetch(`http://localhost:8080/api/marcacoes/libertar-slot/${tempReservaId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        console.log('Slot temporário liberado antes de criar marcação real');
        setTempReservaId(null);
      }

      // 2. DEPOIS: Criar marcação real
      const [hours, minutes] = time.split(':');
      const dateTime = new Date(date);
      dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const localDateTime = dateTime.toISOString().slice(0, 19);

      const response = await fetch('http://localhost:8080/api/marcacoes/remota', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          data: localDateTime,
          assunto: subject,
          utenteId: utenteId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Erro ao criar marcação');
      }

      toast.success('Marcação criada com sucesso!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao criar marcação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar marcação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = () => {
    const fileName = `Documento_${Date.now()}.pdf`;
    setDocuments([...documents, fileName]);
    toast.success('Ficheiro adicionado');
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">Novo Agendamento</DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {date.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} às {time}
          </p>
        </DialogHeader>
        <DialogPrimitive.Description className="sr-only">
          Preencha os dados do agendamento
        </DialogPrimitive.Description>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-gray-900 dark:text-gray-100">Assunto *</Label>
            <Select value={subject} onValueChange={(value) => setSubject(value)}>
              <SelectTrigger className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${errors.subject ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Selecione o assunto" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                {SUBJECTS.map((option) => (
                  <SelectItem key={option} value={option} className="text-gray-900 dark:text-gray-100">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-900 dark:text-gray-100">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva brevemente o motivo da marcação"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-900 dark:text-gray-100">Documentos</Label>
            <button
              type="button"
              onClick={handleFileSelect}
              className="w-full border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-sm text-gray-600 dark:text-gray-300 hover:border-purple-600"
            >
              <Upload className="w-5 h-5 mb-2" />
              Carregar documento
            </button>
            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((doc, index) => (
                  <div key={doc} className="flex items-center justify-between p-2 rounded border bg-white dark:bg-gray-800">
                    <span className="text-sm text-gray-800 dark:text-gray-200">{doc}</span>
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      aria-label="Remover documento"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" disabled={isLoading}>
              {isLoading ? 'A processar...' : 'Marcar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
