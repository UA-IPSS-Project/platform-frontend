import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Loader2, AlertTriangle } from 'lucide-react';
import { FileUpload } from '../shared/FileUpload';
import { PrivacyNotice } from '../shared/PrivacyNotice';
import { toast } from 'sonner';
import { documentosApi, DocumentoDTO } from '../../services/api';

interface DocumentUploadDialogProps {
  open: boolean;
  onClose: () => void;
  marcacaoId: number;
  onSuccess?: (documentos: DocumentoDTO[]) => void;
  isClient?: boolean;
}

const FINALIDADES_PREDEFINIDAS = [
  { code: 'residence_proof',       translationKey: 'documentUpload.purposes.residenceProof' },
  { code: 'medical_certificate',   translationKey: 'documentUpload.purposes.medicalCertificate' },
  { code: 'id_document',           translationKey: 'documentUpload.purposes.idDocument' },
  { code: 'income_proof',          translationKey: 'documentUpload.purposes.incomeProof' },
  { code: 'parental_authorization',translationKey: 'documentUpload.purposes.parentalAuthorization' },
  { code: 'other',                 translationKey: 'documentUpload.purposes.other' },
];

// Finalidades que contêm dados de categorias especiais (art.º 9.º RGPD)
const CLINICAL_PURPOSES = new Set(['medical_certificate']);

export function DocumentUploadDialog({
  open,
  onClose,
  marcacaoId,
  onSuccess,
  isClient = false
}: DocumentUploadDialogProps) {
  const { t } = useTranslation();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [finalidades, setFinalidades] = useState<Record<string, string>>({});
  const [clinicalConsent, setClinicalConsent] = useState(false);

  const setFinalidade = (fileName: string, value: string) => {
    setFinalidades(prev => {
      const next = { ...prev, [fileName]: value };
      const hasClinical = Object.values(next).some(f => CLINICAL_PURPOSES.has(f));
      if (!hasClinical) setClinicalConsent(false);
      return next;
    });
  };

  const hasClinicalDocument = Object.values(finalidades).some(f => CLINICAL_PURPOSES.has(f));

  const MAX_FILES = 10;
  const MAX_TOTAL_SIZE_MB = 20;

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      if (isClient) toast.error('Selecione pelo menos um ficheiro');
      return;
    }

    if (selectedFiles.length > MAX_FILES) {
      if (isClient) toast.error(`Só pode enviar no máximo ${MAX_FILES} ficheiros por marcação.`);
      return;
    }

    const totalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE_MB * 1024 * 1024) {
      if (isClient) toast.error(`O tamanho total dos ficheiros não pode exceder ${MAX_TOTAL_SIZE_MB}MB.`);
      return;
    }

    if (hasClinicalDocument && !clinicalConsent) {
      toast.error(t('documentUpload.clinicalConsent.required'));
      return;
    }

    setIsUploading(true);
    try {
      const uploadedDocs = await documentosApi.uploadDocumentos(marcacaoId, selectedFiles, finalidades);
      if (isClient) toast.success(`${uploadedDocs.length} documento(s) enviado(s) com sucesso!`);
      onSuccess?.(uploadedDocs);
      setSelectedFiles([]);
      setFinalidades({});
      setClinicalConsent(false);
      onClose();
    } catch (error) {
      console.error('Erro ao enviar documentos:', error);
      if (isClient) toast.error(error instanceof Error ? error.message : 'Erro ao enviar documentos');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkip = () => {
    setSelectedFiles([]);
    setFinalidades({});
    setClinicalConsent(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Upload de Documentos
          </DialogTitle>
          <DialogPrimitive.Description className="text-sm text-muted-foreground mt-2">
            Anexe documentos relevantes para esta marcação (opcional)
          </DialogPrimitive.Description>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <FileUpload
            selectedFiles={selectedFiles}
            onChange={setSelectedFiles}
            isUploading={isUploading}
          />

          {/* Finalidade por documento */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Finalidade por documento (opcional)</p>
              {selectedFiles.map((file) => (
                <div key={file.name} className="space-y-1">
                  <label className="text-xs text-muted-foreground truncate block">{file.name}</label>
                  <select
                    value={finalidades[file.name] || ''}
                    onChange={(e) => setFinalidade(file.name, e.target.value)}
                    disabled={isUploading}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecione a finalidade...</option>
                    {FINALIDADES_PREDEFINIDAS.map((opt) => (
                      <option key={opt.code} value={opt.code}>{t(opt.translationKey)}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Consentimento explícito para dados clínicos (RGPD art.º 9.º) */}
          {hasClinicalDocument && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-900 dark:text-amber-100 font-medium">
                  {t('documentUpload.clinicalConsent.warning')}
                </p>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                {t('documentUpload.clinicalConsent.description')}
              </p>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="clinical-consent"
                  checked={clinicalConsent}
                  onCheckedChange={(v) => setClinicalConsent(Boolean(v))}
                  disabled={isUploading}
                />
                <label htmlFor="clinical-consent" className="text-sm text-amber-900 dark:text-amber-100 cursor-pointer leading-snug">
                  {t('documentUpload.clinicalConsent.checkbox')}
                </label>
              </div>
            </div>
          )}

          {/* Aviso de Privacidade - apenas para clientes */}
          {isClient && <PrivacyNotice context="document" />}

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
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isUploading || selectedFiles.length === 0 || (hasClinicalDocument && !clinicalConsent)}
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