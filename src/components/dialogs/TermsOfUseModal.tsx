import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { utilizadoresApi } from '../../services/api/utilizadores/utilizadoresApi';

interface TermsOfUseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

interface TermsSection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export function TermsOfUseModal({ open, onOpenChange, onAccept }: Readonly<TermsOfUseModalProps>) {
  const { t, i18n } = useTranslation();
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [backendContent, setBackendContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const sections = t('termsModal.sections', { returnObjects: true }) as TermsSection[];

  useEffect(() => {
    if (!open) {
      setHasReachedEnd(false);
      setBackendContent(null);
      return;
    }

    setBackendContent(null);

    const loadContent = async () => {
      setIsLoading(true);
      try {
        const data = await utilizadoresApi.getPublicTermsContent(i18n.language);
        if (data.content && data.content.trim().length > 0) {
          setBackendContent(data.content);
        }
      } catch {
        // Fallback to i18n
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();

    const element = scrollContainerRef.current;
    if (!element) return;

    const fitsWithoutScroll = element.scrollHeight <= element.clientHeight + 1;
    if (fitsWithoutScroll) {
      setHasReachedEnd(true);
    }
  }, [open, i18n.language]);

  const handleTermsScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (hasReachedEnd) return;

    const element = event.currentTarget;
    const distanceToBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    if (distanceToBottom <= 8) {
      setHasReachedEnd(true);
    }
  };

  const handleAccept = () => {
    onAccept();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-accent/40">
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/15 rounded-lg">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            {t('termsModal.title')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            {t('termsModal.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-background via-background/80 to-transparent pointer-events-none z-10" />
          
          <div
            ref={scrollContainerRef}
            className="h-[60vh] px-6 py-4 overflow-y-auto"
            onScroll={handleTermsScroll}
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
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
                  sections.map((section, index) => (
                    <section key={section.title} className="bg-card rounded-lg p-4 border border-border">
                      <h3 className="font-semibold text-base text-primary mb-3 flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold">{index + 1}</span>
                        {' '}
                        {section.title}
                      </h3>

                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph} className="leading-relaxed mt-2 first:mt-0">
                          {paragraph}
                        </p>
                      ))}

                      {section.bullets && section.bullets.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                          {section.bullets.map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                          ))}
                        </ul>
                      )}
                    </section>
                  ))
                )}

                <section className="bg-accent/50 rounded-lg p-4 border border-border">
                  <p className="leading-relaxed">
                    {t('termsModal.officialLink.label')}
                  </p>
                  <a
                    href={t('termsModal.officialLink.url')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-primary hover:opacity-80 hover:underline break-all"
                  >
                    {t('termsModal.officialLink.url')}
                  </a>
                </section>
              </div>
            )}
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-10" />
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30 gap-3 justify-end">
          {hasReachedEnd && (
            <Button
              onClick={handleAccept}
              className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200"
            >
              {t('termsModal.acceptButton')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
