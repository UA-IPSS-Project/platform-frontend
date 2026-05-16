import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import type { RJSFSchema } from '@rjsf/utils';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { rjsfWidgets } from '../../components/rjsf/widgets/RjsfWidgets';
import { RjsfFieldTemplate } from '../../components/rjsf/templates/RjsfFieldTemplate';
import { CandidaturasCard } from '../../components/candidaturas/CandidaturasCard';
import { CandidaturaStatusChangeDialog } from '../../components/candidaturas/CandidaturaStatusChangeDialog';
import { CandidaturasStatusBadge } from '../../components/candidaturas/CandidaturasStatusBadge';
import { candidaturasApi, type CandidaturaEstado, type FormPage, type SecretaryDraftResponse, type CandidaturaDocumentoDTO } from '../../services/api';
import { buildPageSchemas } from '../../utils/formAdapter';
import { FileUpload } from '../../components/shared/FileUpload';
import { Download, Trash2 } from 'lucide-react';

const toStatusLabel = (estado: string, t: (key: string) => string): string => {
  if (estado === 'APROVADA') return t('applications.flow.status.approved');
  if (estado === 'REJEITADA') return t('applications.flow.status.rejected');
  if (estado === 'LISTA_ESPERA') return t('applications.flow.status.waiting_list');
  return t('applications.flow.status.pending');
};

const templates = {
  FieldTemplate: RjsfFieldTemplate,
};

export function CandidaturaDetailPage() {
  const navigate = useNavigate();
  const { candidaturaId: routeCandidaturaId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  const candidaturaId = useMemo(() => {
    if (routeCandidaturaId) return routeCandidaturaId;
    const match = location.pathname.match(/^\/dashboard\/([^/]+)\/([^/]+)$/i);
    return match?.[2] || '';
  }, [routeCandidaturaId, location.pathname]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [estado, setEstado] = useState<string>('PENDENTE');
  const [formId, setFormId] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [publishedRespostas, setPublishedRespostas] = useState<Record<string, unknown>>({});
  const [secretaryDraft, setSecretaryDraft] = useState<SecretaryDraftResponse | null>(null);
  const [visiblePages, setVisiblePages] = useState<FormPage[]>([]);
  const [pageSchemas, setPageSchemas] = useState<{ schema: RJSFSchema; uiSchema: Record<string, unknown> }[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [documentos, setDocumentos] = useState<CandidaturaDocumentoDTO[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  const isSecretary = user?.role === 'SECRETARIA';
  const canEdit = isSecretary || estado === 'PENDENTE';
  const canChangeStatus = isSecretary;

  const currentSchema = useMemo<RJSFSchema>(
    () => pageSchemas[currentPageIndex]?.schema ?? ({ type: 'object', properties: {} } as RJSFSchema),
    [pageSchemas, currentPageIndex],
  );
  const currentUiSchema = useMemo(
    () => pageSchemas[currentPageIndex]?.uiSchema ?? {},
    [pageSchemas, currentPageIndex],
  );

  useEffect(() => {
    const loadData = async () => {
      if (!candidaturaId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const candidatura = await candidaturasApi.obterCandidaturaPorId(candidaturaId);

        if (!candidatura) {
          throw new Error('Candidatura não encontrada');
        }

        setEstado(candidatura.estado);
        setFormId(candidatura.formId);
        setFormData(candidatura.respostas || {});
        setPublishedRespostas(candidatura.respostas || {});

        if (user?.role === 'SECRETARIA') {
          try {
            const draft = await candidaturasApi.obterRascunhoSecretaria(candidaturaId);
            setSecretaryDraft(draft ?? null);
          } catch {
            // no draft — that's fine
          }
        }

        try {
          const docs = await candidaturasApi.listarDocumentosCandidatura(candidaturaId);
          setDocumentos(docs ?? []);
        } catch {
          // documents are optional
        }

        const form = await candidaturasApi.obterFormularioPorId(candidatura.formId);

        if (form?.pages) {
          const includeInternal = user?.role === 'SECRETARIA';
          const isInternal = (p: FormPage) => p.audience?.toUpperCase() === 'INTERNAL';
          const visible = form.pages.filter(p => includeInternal || !isInternal(p));
          const schemas = buildPageSchemas(form.pages, { includeInternalPages: includeInternal });
          setVisiblePages(visible);
          setPageSchemas(schemas as { schema: RJSFSchema; uiSchema: Record<string, unknown> }[]);
        } else {
          setVisiblePages([]);
          setPageSchemas([{ schema: { type: 'object', properties: {} } as RJSFSchema, uiSchema: {} }]);
        }
        setCurrentPageIndex(0);
      } catch (error) {
        toast.error(t('applications.detail.messages.loadError'));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [candidaturaId, user?.role]);

  const handleSave = async () => {
    if (!candidaturaId || !formId) return;

    try {
      setSaving(true);

      await candidaturasApi.atualizarCandidatura(candidaturaId, {
        formId,
        respostas: formData,
      });

      toast.success(t('applications.detail.messages.saveSuccess'));
      setEditing(false);
    } catch (error: any) {
      toast.error(error?.message || t('applications.detail.messages.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangeStatus = async (newStatus: CandidaturaEstado) => {
    if (!candidaturaId) return;

    try {
      await candidaturasApi.atualizarEstado(candidaturaId, { estado: newStatus as any });

      setEstado(newStatus);
      setEditing(false);
      toast.success(t('applications.flow.messages.statusUpdatedSuccess'));
    } catch (error: any) {
      toast.error(error?.message || t('applications.flow.messages.statusUpdateError'));
    }
  };

  const handleSaveDraft = async () => {
    if (!candidaturaId) return;
    try {
      setSavingDraft(true);
      const saved = await candidaturasApi.guardarRascunhoSecretaria(candidaturaId, { respostas: formData });
      setSecretaryDraft(saved);
      toast.success('Rascunho guardado');
    } catch {
      toast.error('Não foi possível guardar o rascunho.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleDiscardDraft = async () => {
    if (!candidaturaId) return;
    try {
      await candidaturasApi.apagarRascunhoSecretaria(candidaturaId);
      setSecretaryDraft(null);
      setFormData(publishedRespostas);
    } catch {
      toast.error('Não foi possível descartar o rascunho.');
    }
  };

  const handlePublish = async () => {
    if (!candidaturaId) return;
    try {
      setPublishing(true);
      await candidaturasApi.guardarRascunhoSecretaria(candidaturaId, { respostas: formData });
      const updated = await candidaturasApi.publicarRascunhoSecretaria(candidaturaId);
      setPublishedRespostas(updated.respostas || {});
      setFormData(updated.respostas || {});
      setSecretaryDraft(null);
      setEditing(false);
      toast.success('Alterações publicadas com sucesso');
    } catch {
      toast.error('Não foi possível publicar as alterações.');
    } finally {
      setPublishing(false);
    }
  };

  const handleUploadDocumentos = async () => {
    if (!candidaturaId || selectedFiles.length === 0) return;
    try {
      setUploadingDocs(true);
      const uploaded: CandidaturaDocumentoDTO[] = [];
      for (const file of selectedFiles) {
        const doc = await candidaturasApi.uploadDocumentoCandidatura(candidaturaId, file);
        uploaded.push(doc);
      }
      setDocumentos(prev => [...prev, ...uploaded]);
      setSelectedFiles([]);
      toast.success(`${uploaded.length} ficheiro(s) enviado(s) com sucesso`);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar ficheiros.');
    } finally {
      setUploadingDocs(false);
    }
  };

  const handleRemoverDocumento = async (docId: string) => {
    try {
      await candidaturasApi.removerDocumentoCandidatura(docId);
      setDocumentos(prev => prev.filter(d => d.id !== docId));
    } catch {
      toast.error('Não foi possível remover o documento.');
    }
  };

  const canDeleteDoc = isSecretary || estado === 'PENDENTE' || estado === 'RASCUNHO';

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <CandidaturasCard className="mx-auto mt-4 max-w-5xl p-6 sm:p-8">
        <p className="text-sm text-muted-foreground">{t('applications.detail.messages.loading')}</p>
      </CandidaturasCard>
    );
  }

  return (
    <CandidaturasCard className="mx-auto mt-4 max-w-5xl p-6 sm:p-8">
      <div className="flex items-center justify-between mb-5 gap-3">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            {t('applications.detail.actions.back')}
          </Button>
          {canChangeStatus ? (
            <Button type="button" variant="outline" onClick={() => setStatusDialogOpen(true)}>
              {t('applications.flow.actions.changeStatus')}
            </Button>
          ) : null}
          {canEdit && !editing ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (isSecretary && secretaryDraft) {
                  setFormData(secretaryDraft.respostas);
                }
                setEditing(true);
              }}
            >
              {t('applications.detail.actions.edit')}
              {isSecretary && secretaryDraft ? ' (rascunho)' : ''}
            </Button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('applications.detail.labels.status')}:</span>
          <CandidaturasStatusBadge status={estado as any} label={toStatusLabel(estado, t)} />
        </div>
      </div>

      {isSecretary && secretaryDraft && !editing && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm text-amber-800 dark:text-amber-300 flex-1">
            Existe um rascunho guardado
            {secretaryDraft.atualizadoPorNome ? ` por ${secretaryDraft.atualizadoPorNome}` : ''}
            {secretaryDraft.atualizadoEm
              ? ` em ${new Date(secretaryDraft.atualizadoEm).toLocaleString('pt-PT')}`
              : ''}
            . Pretende carregar?
          </p>
          <div className="flex gap-2 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-amber-400 text-amber-800 hover:bg-amber-100 dark:text-amber-300 dark:border-amber-600"
              onClick={() => {
                setFormData(secretaryDraft.respostas);
                setEditing(true);
              }}
            >
              Carregar rascunho
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-amber-700 dark:text-amber-400"
              onClick={() => void handleDiscardDraft()}
            >
              Descartar
            </Button>
          </div>
        </div>
      )}

      {visiblePages.length > 1 && (
        <div className="flex gap-0 border-b border-border mb-2 overflow-x-auto">
          {visiblePages.map((page, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentPageIndex(i)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                i === currentPageIndex
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
            >
              {page.title}
            </button>
          ))}
        </div>
      )}

      <Form<any, RJSFSchema, any>
        schema={currentSchema}
        uiSchema={currentUiSchema}
        formData={formData}
        validator={validator as any}
        widgets={rjsfWidgets}
        templates={templates}
        showErrorList={false}
        liveValidate
        readonly={!editing}
        onChange={(event: { formData?: Record<string, unknown> }) =>
          setFormData(prev => ({ ...prev, ...(event.formData || {}) }))
        }
      >
        <div />
      </Form>

      {editing ? (
        <div className="pt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => { setEditing(false); setFormData(publishedRespostas); }}>
            {t('applications.detail.actions.cancel')}
          </Button>
          {isSecretary ? (
            <>
              <Button type="button" variant="outline" onClick={() => void handleSaveDraft()} disabled={savingDraft}>
                {savingDraft ? 'A guardar...' : 'Guardar rascunho'}
              </Button>
              <Button type="button" onClick={() => void handlePublish()} disabled={publishing}>
                {publishing ? 'A publicar...' : 'Publicar alterações'}
              </Button>
            </>
          ) : (
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? t('applications.detail.actions.saving') : t('applications.detail.actions.save')}
            </Button>
          )}
        </div>
      ) : null}

      {canChangeStatus ? (
        <CandidaturaStatusChangeDialog
          open={statusDialogOpen}
          candidaturaCode={candidaturaId}
          currentStatus={estado as any}
          onOpenChange={setStatusDialogOpen}
          onConfirm={handleChangeStatus}
        />
      ) : null}

      <div className="mt-8 border-t border-border pt-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Documentos</h2>

        {documentos.length > 0 ? (
          <ul className="mb-4 space-y-2">
            {documentos.map(doc => (
              <li key={doc.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{doc.nomeOriginal}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(doc.tamanho)} · {new Date(doc.uploadedEm).toLocaleDateString('pt-PT')}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    title="Descarregar"
                    onClick={() => void candidaturasApi.downloadDocumentoCandidatura(doc.id, doc.nomeOriginal)}
                    className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {canDeleteDoc && (
                    <button
                      type="button"
                      title="Remover"
                      onClick={() => void handleRemoverDocumento(doc.id)}
                      className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic mb-4">Sem documentos anexados.</p>
        )}

        <FileUpload
          selectedFiles={selectedFiles}
          onChange={setSelectedFiles}
          isUploading={uploadingDocs}
        />
        {selectedFiles.length > 0 && (
          <div className="mt-3 flex justify-end">
            <Button type="button" onClick={() => void handleUploadDocumentos()} disabled={uploadingDocs}>
              {uploadingDocs ? 'A enviar...' : `Enviar ${selectedFiles.length} ficheiro(s)`}
            </Button>
          </div>
        )}
      </div>
    </CandidaturasCard>
  );
}
