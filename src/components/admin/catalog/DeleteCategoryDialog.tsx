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
import { type TransporteCategoria, requisicoesApi } from '../../../services/api';

interface DeleteCategoryDialogProps {
  isOpen: boolean;
  category: TransporteCategoria | null;
  itemCount: number;
  categoryName: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export function DeleteCategoryDialog({
  isOpen,
  category,
  itemCount,
  categoryName,
  onClose,
  onSuccess,
}: DeleteCategoryDialogProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!category) return;

    try {
      setIsLoading(true);
      // API call to move all vehicles in this category to ABATIDO_VENDIDO_DESCONTINUADO
      await requisicoesApi.moverCategoriaPara(category, 'ABATIDO_VENDIDO_DESCONTINUADO');
      await onSuccess();
      toast.success(t('dashboard.admin.catalogs.success.categoryRemoved'));
      onClose();
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
            <AlertTriangle className="h-6 w-6 text-primary" />
            <AlertDialogTitle>{t('dashboard.admin.catalogs.confirm.deleteCategory', { name: categoryName })}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {category && (
              <div className="space-y-3">
                <p>
                  {t('dashboard.admin.catalogs.confirm.deleteCategoryMovesVehicles', {
                    defaultValue: `Esta ação vai mover todos os ${itemCount} veículo(s) desta categoria para "Abatido / Vendido / Descontinuado". Os dados dos veículos serão preservados.`,
                    count: itemCount,
                  })}
                </p>
                {itemCount > 0 && (
                  <div className="mt-3 p-3 bg-muted rounded-lg border border-border/50">
                    <p className="text-sm font-semibold text-primary">
                      {itemCount} {itemCount === 1 ? t('common.vehicle') : t('common.vehicles')} será(ão) movido(s)
                    </p>
                  </div>
                )}
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
          >
            {isLoading ? '...' : t('common.confirm')}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
