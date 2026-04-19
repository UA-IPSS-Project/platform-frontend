import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog';
import { Button } from '../../ui/button';
import { type TransporteCatalogo, type TransporteCategoria, requisicoesApi } from '../../../services/api';

interface ScrapTransportDialogProps {
  isOpen: boolean;
  transport: TransporteCatalogo | null;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export function ScrapTransportDialog({
  isOpen,
  transport,
  onClose,
  onSuccess,
}: ScrapTransportDialogProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TransporteCategoria>('ABATE_VENDIDO');

  const handleConfirm = async () => {
    if (!transport?.id) return;

    try {
      setIsLoading(true);
      await requisicoesApi.atualizarCategoriaTransporte(transport.id, selectedCategory);
      await onSuccess();
      toast.success(t('dashboard.admin.catalogs.success.transportScrapSold'));
      onClose();
      setSelectedCategory('ABATE_VENDIDO'); // Reset para próxima vez
    } catch (error: any) {
      toast.error(error?.message || t('dashboard.admin.catalogs.errors.loadTransports'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <AlertDialogTitle>{t('dashboard.admin.catalogs.confirm.scrapTransport')}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {transport && (
              <div className="space-y-2">
                <p>
                  {t('dashboard.admin.catalogs.confirm.scrapTransportDescription', {
                    defaultValue: 'Este veículo será marcado como abatido/vendido e deixará de estar disponível para requisições. Esta ação é irreversível.',
                  })}
                </p>
                <div className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-sm font-semibold">
                    {transport.matricula} - {transport.marca} {transport.modelo}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Código: {transport.codigo}
                  </p>
                </div>
                
                {/* Category Selection */}
                <div className="mt-6 space-y-3 border-t pt-4">
                  <p className="text-sm font-semibold">{t('dashboard.admin.catalogs.selectScrapCategory')}</p>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant={selectedCategory === 'ABATE_VENDIDO' ? 'default' : 'outline'}
                      className="justify-start"
                      onClick={() => setSelectedCategory('ABATE_VENDIDO')}
                    >
                      {t('requisitions.labels.transportCategoryAbateSold')}
                    </Button>
                    <Button
                      variant={selectedCategory === 'ABATE_VENDIDO_DESCONTINUADO' ? 'default' : 'outline'}
                      className="justify-start"
                      onClick={() => setSelectedCategory('ABATE_VENDIDO_DESCONTINUADO')}
                    >
                      {t('requisitions.labels.transportCategoryAbateSoldDiscontinued')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-2 justify-end pt-4">
          <AlertDialogCancel disabled={isLoading}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? '...' : t('dashboard.admin.catalogs.confirm.confirmScrap')}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
