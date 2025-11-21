import { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog@1.1.6';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ClientAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { subject: string; description: string; documents: string[] }) => void;
  date: Date;
  time: string;
}

const SUBJECTS = [
  'Pagar mensalidade',
  'Entregar documentos',
  'Reunião com educadora / assistente social',
  'Pedido de inscrição',
  'Pedido de apoio/informação',
  'Outro',
];

export function ClientAppointmentDialog({ open, onClose, onSave, date, time }: ClientAppointmentDialogProps) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [documents, setDocuments] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!subject) newErrors.subject = 'Selecione um assunto';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Preencha o assunto da marcação');
      return;
    }
    try {
      onSave({ subject, description, documents });
    } catch {
      toast.error('Houve um erro, tente novamente');
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
    <Dialog open={open} onOpenChange={onClose}>
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
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
              Marcar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
