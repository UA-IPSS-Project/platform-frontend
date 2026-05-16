import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollText, Eye, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { utilizadoresApi } from '../../services/api/utilizadores/utilizadoresApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentVersion: number;
  onPublished: (newVersion: number) => void;
}

/**
 * Modal de edição e publicação dos Termos de Uso.
 * Carrega conteúdo atual (PT+EN), permite editar, e ao publicar:
 * - guarda conteúdo PT+EN
 * - incrementa versão automaticamente
 * - notifica todos os utilizadores por email
 */
export function TermsEditorModal({ isOpen, onClose, currentVersion, onPublished }: Readonly<Props>) {
  const [contentPt, setContentPt] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [changeDescription, setChangeDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    Promise.all([
      utilizadoresApi.getTermsContent('pt'),
      utilizadoresApi.getTermsContent('en'),
    ]).then(([pt, en]) => {
      setContentPt(pt.content || '');
      setContentEn(en.content || '');
    }).catch(() => {
      toast.error('Erro ao carregar conteúdo dos termos');
    }).finally(() => setIsLoading(false));
  }, [isOpen]);

  const handlePublish = async () => {
    if (!contentPt.trim() || !contentEn.trim()) {
      toast.error('O conteúdo em PT e EN não pode estar vazio');
      return;
    }
    setIsPublishing(true);
    try {
      const { version } = await utilizadoresApi.publishTerms(contentPt, contentEn, changeDescription);
      toast.success(`Termos publicados como v${version}. Utilizadores notificados por email.`);
      onPublished(version);
      setChangeDescription('');
      onClose();
    } catch {
      toast.error('Erro ao publicar os termos');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-accent/40">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="p-2 bg-primary/15 rounded-lg">
              <ScrollText className="w-5 h-5 text-primary" />
            </div>
            Editar Termos de Uso
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1">
            Versão atual: <strong>v{currentVersion}</strong> — ao publicar será criada a <strong>v{currentVersion + 1}</strong> e todos os utilizadores serão notificados.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-48 gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>A carregar conteúdo...</span>
            </div>
          ) : (
            <>
              {/* Toggle edit/preview */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm" variant={previewTab === 'edit' ? 'default' : 'outline'}
                  onClick={() => setPreviewTab('edit')}
                  className="gap-1"
                >
                  <Pencil className="w-3 h-3" /> Editar
                </Button>
                <Button
                  size="sm" variant={previewTab === 'preview' ? 'default' : 'outline'}
                  onClick={() => setPreviewTab('preview')}
                  className="gap-1"
                >
                  <Eye className="w-3 h-3" /> Pré-visualizar
                </Button>
              </div>

              <Tabs defaultValue="pt">
                <TabsList>
                  <TabsTrigger value="pt">🇵🇹 Português</TabsTrigger>
                  <TabsTrigger value="en">🇬🇧 English</TabsTrigger>
                </TabsList>

                <TabsContent value="pt" className="mt-3">
                  {previewTab === 'edit' ? (
                    <Textarea
                      value={contentPt}
                      onChange={(e) => setContentPt(e.target.value)}
                      rows={18}
                      className="font-mono text-sm resize-none"
                      placeholder="Conteúdo dos termos em português..."
                    />
                  ) : (
                    <div className="min-h-[18rem] max-h-[18rem] overflow-y-auto rounded-md border border-input bg-background p-4 text-sm whitespace-pre-wrap leading-relaxed">
                      {contentPt || <span className="text-muted-foreground italic">Sem conteúdo</span>}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="en" className="mt-3">
                  {previewTab === 'edit' ? (
                    <Textarea
                      value={contentEn}
                      onChange={(e) => setContentEn(e.target.value)}
                      rows={18}
                      className="font-mono text-sm resize-none"
                      placeholder="Terms content in English..."
                    />
                  ) : (
                    <div className="min-h-[18rem] max-h-[18rem] overflow-y-auto rounded-md border border-input bg-background p-4 text-sm whitespace-pre-wrap leading-relaxed">
                      {contentEn || <span className="text-muted-foreground italic">No content</span>}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Descrição das alterações <span className="text-muted-foreground font-normal">(enviada no email aos utilizadores)</span>
                </label>
                <Textarea
                  value={changeDescription}
                  onChange={(e) => setChangeDescription(e.target.value)}
                  rows={2}
                  placeholder="Ex: Adicionada cláusula sobre cookies. Atualizada política de retenção de dados."
                  className="resize-none"
                />
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-xs text-amber-900 dark:text-amber-100">
                  <strong>Atenção:</strong> Ao publicar, a versão é incrementada automaticamente para v{currentVersion + 1} e todos os utilizadores ativos recebem um email. Esta ação é irreversível.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPublishing}>
            Cancelar
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing || isLoading || !contentPt.trim() || !contentEn.trim()}
            variant="destructive"
            className="gap-2"
          >
            {isPublishing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> A publicar...</>
            ) : (
              <><ScrollText className="w-4 h-4" /> Publicar v{currentVersion + 1}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
