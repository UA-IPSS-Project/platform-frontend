import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface EmailReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (email: string) => void;
  isLoading?: boolean;
}

export function EmailReportDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: EmailReportDialogProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleConfirm = () => {
    if (!validateEmail(email)) {
      setError(t('dashboard.admin.reportDialog.invalidEmail'));
      return;
    }
    setError('');
    onConfirm(email);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] border-border bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl font-bold text-foreground">
            {t('dashboard.admin.reportDialog.title')}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2">
            {t('dashboard.admin.reportDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-6">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              {t('dashboard.admin.reportDialog.emailLabel')}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t('dashboard.admin.reportDialog.emailPlaceholder')}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              className={`bg-background/50 border-border focus:ring-primary ${
                error ? 'border-destructive ring-destructive/20' : ''
              }`}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            />
            {error && (
              <p className="text-xs font-medium text-destructive mt-1 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-destructive" />
                {error}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 border-border hover:bg-accent text-foreground"
          >
            {t('dashboard.admin.reportDialog.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || !email}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                {t('common.saving', 'A enviar...')}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                {t('dashboard.admin.reportDialog.send')}
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
