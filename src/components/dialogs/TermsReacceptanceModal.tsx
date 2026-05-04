import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { FileText, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { utilizadoresApi } from '../../services/api/utilizadores/utilizadoresApi';

interface Props {
  isOpen: boolean;
  version: number;
  onAccept: (version: number) => Promise<void>;
}

interface TermsSection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

/**
 * Modal de re-aceitação obrigatória dos Termos de Uso.
 * Não pode ser fechado sem aceitar — sem botão de fechar, sem onOpenChange funcional.
 */
export function TermsReacceptanceModal({ isOpen, version, onAccept }: Readonly<Props>) {
  const { t, i18n } = useTranslation();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [backendContent, setBackendContent] = useState<string | null>(null);
  const [isContentLoading, setIsContentLoading] = useState(false);
  
  const sections = t('termsModal.sections', { returnObjects: true }) as TermsSection[];

  useEffect(() => {
    if (!isOpen) {
      setBackendContent(null);
      return;
    }

    setBackendContent(null);

    const loadContent = async () => {
      setIsContentLoading(true);
      try {
        const data = await utilizadoresApi.getPublicTermsContent(i18n.language);
        if (data.content && data.content.trim().length > 0) {
          setBackendContent(data.content);
        }
      } catch {
        // Fallback to i18n
      } finally {
        setIsContentLoading(false);
      }
    };

    loadContent();
  }, [isOpen, i18n.language]);

  const handleAccept = async () => {
    if (!accepted) {
      toast.error(t('termsReacceptance.mustAccept'));
      return;
    }
    setLoading(true);
    try {
      await onAccept(version);
      toast.success(t('termsReacceptance.accepted'));
    } catch {
      toast.error(t('termsReacceptance.acceptError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { /* bloqueado intencionalmente */ }}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden" hideCloseButton>
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-accent/40">
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/15 rounded-lg">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            {t('termsReacceptance.title')} (v{version})
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            {t('termsReacceptance.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 max-h-[55vh]">
          {isContentLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p>{t('common.loading')}</p>
            </div>
          ) : (
            <div className="space-y-5 text-sm text-foreground pr-4">
              {backendContent ? (
                <div className="whitespace-pre-wrap leading-relaxed text-base bg-card rounded-xl p-8 border border-border shadow-sm">
                  {backendContent}
                </div>
              ) : (
                Array.isArray(sections) && sections.map((section, index) => (
                  <section key={section.title} className="bg-card rounded-lg p-4 border border-border">
                    <h3 className="font-semibold text-base text-primary mb-3 flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold">
                        {index + 1}
                      </span>
                      {section.title}
                    </h3>
                    {section.paragraphs.map((p) => (
                      <p key={p} className="leading-relaxed mt-2 first:mt-0">{p}</p>
                    ))}
                    {section.bullets && section.bullets.length > 0 && (
                      <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                        {section.bullets.map((b) => <li key={b}>{b}</li>)}
                      </ul>
                    )}
                  </section>
                ))
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="reaccept"
              checked={accepted}
              onCheckedChange={(v) => setAccepted(Boolean(v))}
            />
            <label htmlFor="reaccept" className="text-sm cursor-pointer">
              {t('termsReacceptance.acceptCheckbox')}
            </label>
          </div>
          <Button
            onClick={handleAccept}
            disabled={!accepted || loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {loading ? t('common.loading') : t('termsReacceptance.acceptButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
