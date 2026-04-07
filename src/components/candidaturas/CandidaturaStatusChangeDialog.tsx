import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import type { CandidaturaEstado } from '../../services/api';

interface CandidaturaStatusChangeDialogProps {
  open: boolean;
  candidaturaCode: string;
  currentStatus: CandidaturaEstado;
  onOpenChange: (open: boolean) => void;
  onConfirm: (newStatus: CandidaturaEstado) => Promise<void>;
}

export function CandidaturaStatusChangeDialog({
  open,
  candidaturaCode,
  currentStatus,
  onOpenChange,
  onConfirm,
}: Readonly<CandidaturaStatusChangeDialogProps>) {
  const { t } = useTranslation();
  const [nextStatus, setNextStatus] = useState<CandidaturaEstado>(currentStatus);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNextStatus(currentStatus);
      setShowConfirm(false);
    }
  }, [open, currentStatus]);

  const handleStartConfirm = () => {
    if (nextStatus === currentStatus) {
      onOpenChange(false);
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    try {
      setSaving(true);
      await onConfirm(nextStatus);
      setShowConfirm(false);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('applications.flow.statusDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('applications.flow.statusDialog.description', { candidaturaCode })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t('applications.flow.statusDialog.newStatus')}
            </label>
            <select
              value={nextStatus}
              onChange={(event) => setNextStatus(event.target.value as CandidaturaEstado)}
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="PENDENTE">{t('applications.flow.status.pending')}</option>
              <option value="APROVADA">{t('applications.flow.status.approved')}</option>
              <option value="REJEITADA">{t('applications.flow.status.rejected')}</option>
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('applications.flow.actions.cancel')}</Button>
            <Button type="button" onClick={handleStartConfirm}>
              {t('applications.flow.actions.continue')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('applications.flow.statusDialog.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('applications.flow.statusDialog.confirmDescription', {
                status: t(`applications.flow.status.${nextStatus === 'PENDENTE' ? 'pending' : nextStatus === 'APROVADA' ? 'approved' : 'rejected'}`).toLowerCase(),
                candidaturaCode,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('applications.flow.actions.no')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleConfirm()}
              disabled={saving}
            >
              {saving ? t('applications.flow.actions.updating') : t('applications.flow.actions.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
