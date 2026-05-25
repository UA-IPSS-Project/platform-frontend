import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Send, Plus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface EmailReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (email: string) => void;
  isLoading?: boolean;
}

export function EmailReportDialog({ isOpen, onClose, onConfirm, isLoading = false }: EmailReportDialogProps) {
  const { t } = useTranslation();
  const [emails, setEmails] = useState<string[]>(['']);
  const [errors, setErrors] = useState<string[]>([]);

  const validateEmail = (email: string) => /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,63}$/.test(email);

  const handleConfirm = () => {
    const newErrors = emails.map(e => e.trim() && !validateEmail(e.trim()) ? 'Email inválido' : '');
    const validEmails = emails.filter(e => e.trim()).map(e => e.trim());
    if (validEmails.length === 0) { newErrors[0] = 'Introduza pelo menos um email'; setErrors(newErrors); return; }
    if (newErrors.some(e => e)) { setErrors(newErrors); return; }
    setErrors([]);
    onConfirm(validEmails.join(','));
  };

  const addEmail = () => setEmails([...emails, '']);
  const removeEmail = (i: number) => { const n = [...emails]; n.splice(i, 1); setEmails(n); };
  const updateEmail = (i: number, v: string) => { const n = [...emails]; n[i] = v; setEmails(n); if (errors[i]) { const e = [...errors]; e[i] = ''; setErrors(e); } };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); setEmails(['']); setErrors([]); } }}>
      <DialogContent className="sm:max-w-[425px] border-border bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl font-bold text-foreground">{t('dashboard.admin.reportDialog.title')}</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2">{t('dashboard.admin.reportDialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          <Label className="text-sm font-medium text-foreground">{t('dashboard.admin.reportDialog.emailLabel')}</Label>
          {emails.map((email, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder={t('dashboard.admin.reportDialog.emailPlaceholder')}
                  value={email}
                  onChange={(e) => updateEmail(i, e.target.value)}
                  className={`bg-background/50 border-border ${errors[i] ? 'border-destructive' : ''}`}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                />
                {errors[i] && <p className="text-xs text-destructive mt-1">{errors[i]}</p>}
              </div>
              {emails.length > 1 && (
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => removeEmail(i)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-fit text-xs" onClick={addEmail}>
            <Plus className="w-3 h-3 mr-1" /> Adicionar destinatário
          </Button>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => { onClose(); setEmails(['']); setErrors([]); }} className="flex-1 border-border">{t('dashboard.admin.reportDialog.cancel')}</Button>
          <Button onClick={handleConfirm} disabled={isLoading} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
            {isLoading ? 'A enviar...' : <><Send className="w-4 h-4 mr-2" />{t('dashboard.admin.reportDialog.send')}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
