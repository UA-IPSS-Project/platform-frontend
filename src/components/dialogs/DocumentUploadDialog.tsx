import { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';
import { FileUpload } from '../shared/FileUpload';
import { toast } from 'sonner';
import { documentosApi, DocumentoDTO } from '../../services/api';

interface DocumentUploadDialogProps {
  open: boolean;
  onClose: () => void;
  marcacaoId: number;
  onSuccess?: (documentos: DocumentoDTO[]) => void;
}

export function DocumentUploadDialog({
  open,
  onClose,
  marcacaoId,
  onSuccess
}: DocumentUploadDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const MAX_FILES = 10;
  const MAX_TOTAL_SIZE_MB = 20;
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Selecione pelo menos um ficheiro');
      return;
    }

    if (selectedFiles.length > MAX_FILES) {
      toast.error(`Só pode enviar no máximo ${MAX_FILES} ficheiros por marcação.`);
      return;
    }

    const totalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE_MB * 1024 * 1024) {
      toast.error(`O tamanho total dos ficheiros não pode exceder ${MAX_TOTAL_SIZE_MB}MB.`);
      return;
    }

    setIsUploading(true);
    try {
      const uploadedDocs = await documentosApi.uploadDocumentos(marcacaoId, selectedFiles);
      toast.success(`${uploadedDocs.length} documento(s) enviado(s) com sucesso!`);
      onSuccess?.(uploadedDocs);
      setSelectedFiles([]);
      onClose();
    } catch (error) {
      console.error('Erro ao enviar documentos:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar documentos');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkip = () => {
    setSelectedFiles([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">
            Upload de Documentos
          </DialogTitle>
          <DialogPrimitive.Description className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Anexe documentos relevantes para esta marcação (opcional)
          </DialogPrimitive.Description>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <FileUpload
            selectedFiles={selectedFiles}
            onChange={setSelectedFiles}
            isUploading={isUploading}
          />

          {/* Botões de ação */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
              disabled={isUploading}
            >
              {selectedFiles.length > 0 ? 'Saltar' : 'Fechar'}
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              disabled={isUploading || selectedFiles.length === 0}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  A enviar...
                </>
              ) : (
                `Enviar ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
