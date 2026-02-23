import { useState, useRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Upload, X, File, Loader2 } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB em bytes
      
      // Validar tamanho de cada ficheiro
      const oversizedFiles = newFiles.filter(file => file.size > MAX_FILE_SIZE);
      
      if (oversizedFiles.length > 0) {
        const fileNames = oversizedFiles.map(f => f.name).join(', ');
        toast.error(`Ficheiro(s) excede(m) 10MB: ${fileNames}`);
        return;
      }
      
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Selecione pelo menos um ficheiro');
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
          {/* Área de seleção de ficheiros */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-sm text-gray-600 dark:text-gray-300 hover:border-purple-600 cursor-pointer transition-colors"
          >
            <Upload className="w-8 h-8 mb-2 text-purple-600" />
            <p className="font-medium">Clique para selecionar ficheiros</p>
            <p className="text-xs text-gray-500 mt-1">
              Suporta múltiplos ficheiros (PDF, imagens, documentos)
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
          />

          {/* Lista de ficheiros selecionados */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                Ficheiros selecionados ({selectedFiles.length})
              </h3>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <File className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex-shrink-0"
                      aria-label="Remover ficheiro"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
