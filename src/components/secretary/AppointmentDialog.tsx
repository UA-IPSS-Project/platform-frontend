import { useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface AppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  date: Date;
  time: string;
  funcionarioId: number;
}

import SUBJECTS from '../../lib/subjects';

export function AppointmentDialog({ open, onClose, onSuccess, date, time, funcionarioId }: AppointmentDialogProps) {
  const [formData, setFormData] = useState({
    nif: '',
    name: '',
    email: '',
    contact: '',
    subject: '',
    description: '',
  });
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
      
      const localDateTime = dateTime.toISOString().slice(0, 19);

      const response = await fetch('http://localhost:8080/api/marcacoes/reservar-slot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          data: localDateTime,
          criadoPorId: funcionarioId,
          // utenteId não enviado - secretaria ainda não sabe o utente
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nif || !/^\d{9}$/.test(formData.nif)) {
      newErrors.nif = 'NIF deve ter 9 dígitos';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!formData.contact || !/^\d{9}$/.test(formData.contact)) {
      newErrors.contact = 'Contacto deve ter 9 dígitos';
    }
    if (!formData.subject) {
      newErrors.subject = 'Selecione um assunto';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
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
      const dataHora = new Date(date);
      const [hours, minutes] = time.split(':');
      dataHora.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const payload = {
        funcionarioId,
        data: dataHora.toISOString(),
        assunto: formData.subject,
        descricao: formData.description,
        utenteNif: formData.nif,
        utenteNome: formData.name,
        utenteEmail: formData.email,
        utenteTelefone: formData.contact,
      };

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/marcacoes/presencial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar marcação');
      }

      toast.success('Marcação criada com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao criar marcação:', error);
      toast.error('Erro ao criar marcação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = () => {
    // Simulate file upload
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
          Preencha os dados do utente para criar uma nova marcação
        </DialogPrimitive.Description>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="nif" className="text-gray-900 dark:text-gray-100">NIF *</Label>
            <Input
              id="nif"
              type="text"
              placeholder="123456789"
              maxLength={9}
              value={formData.nif}
              onChange={(e) => setFormData({ ...formData, nif: e.target.value.replace(/\D/g, '') })}
              className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${errors.nif ? 'border-red-500' : ''}`}
            />
            {errors.nif && <p className="text-sm text-red-500">{errors.nif}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-900 dark:text-gray-100">Nome *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Nome completo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-900 dark:text-gray-100">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemplo@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact" className="text-gray-900 dark:text-gray-100">Contacto *</Label>
            <Input
              id="contact"
              type="text"
              placeholder="912345678"
              maxLength={9}
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value.replace(/\D/g, '') })}
              className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${errors.contact ? 'border-red-500' : ''}`}
            />
            {errors.contact && <p className="text-sm text-red-500">{errors.contact}</p>}
          </div>


          <div className="space-y-2">
            <Label htmlFor="subject" className="text-gray-900 dark:text-gray-100">Assunto *</Label>
            <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
              <SelectTrigger className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${errors.subject ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Selecione o assunto" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                {SUBJECTS.map((subject) => (
                  <SelectItem key={subject} value={subject} className="text-gray-900 dark:text-gray-100">
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-900 dark:text-gray-100">Descrição curta</Label>
            <Textarea
              id="description"
              placeholder="Descreva brevemente o motivo da marcação..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-900 dark:text-gray-100">Anexar documentos</Label>
            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={handleFileSelect}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Clique para selecionar ficheiros</p>
            </div>
            
            {documents.length > 0 && (
              <div className="space-y-2 mt-2">
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-900 dark:text-gray-100">{doc}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDocument(index)}
                      className="text-gray-600 dark:text-gray-400"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1 border-gray-300 dark:border-gray-700" disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" disabled={isLoading}>
              {isLoading ? 'A marcar...' : 'Marcar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
