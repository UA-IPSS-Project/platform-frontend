import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { candidaturasApi, FormResponse } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { WizardForm } from './WizardForm';
import { useAutoSave } from '@/hooks/useAutoSave';
import { CandidaturaFileContext } from '@/contexts/CandidaturaFileContext';
import { buildUploadFileName } from '@/utils/candidaturas/fileNaming';

interface RjsfCandidaturaFormProps {
  onSuccess?: () => void;
  showPreview?: boolean;
  showTitle?: boolean;
  candidaturaType?: string;
  formId?: string;
  existingCandidaturaId?: string;
  existingRespostas?: Record<string, unknown>;
  includeInternalPages?: boolean;
  candidaturaNif?: string;
}


export function RjsfCandidaturaForm({
  onSuccess,
  showPreview = true,
  showTitle = true,
  candidaturaType,
  formId,
  existingCandidaturaId,
  existingRespostas,
  includeInternalPages = false,
  candidaturaNif,
}: RjsfCandidaturaFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Record<string, unknown>>(existingRespostas ?? {});
  const [formularioAtivo, setFormularioAtivo] = useState<FormResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentCandidaturaId, setCurrentCandidaturaId] = useState<string | null>(existingCandidaturaId ?? null);
  const latestFormDataRef = useRef<Record<string, unknown>>(existingRespostas ?? {});
  const currentCandidaturaIdRef = useRef<string | null>(existingCandidaturaId ?? null);
  const isDirtyRef = useRef(false);
  const isSavingRef = useRef(false);
  const saveDraftRef = useRef<() => Promise<void>>(async () => {});
  const hasMountedRef = useRef(false);
  const formularioAtivoRef = useRef<FormResponse | null>(null);

  useEffect(() => {
    const loadFormulario = async () => {
      try {
        let form: FormResponse | null = null;
        if (formId) {
          form = await candidaturasApi.obterFormularioPorId(formId);
        } else {
          const forms = await candidaturasApi.listarFormularios(candidaturaType);
          form = forms.length > 0 ? forms[0] : null;
        }
        setFormularioAtivo(form);
        formularioAtivoRef.current = form;
      } catch {
        toast.error('Não foi possível carregar o formulário.');
      }
    };

    loadFormulario();
  }, [formId, candidaturaType]);

  const persistDraft = useCallback(async (submittedData: Record<string, unknown>) => {
    if (!formularioAtivo?.id || isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      if (currentCandidaturaId) {
        await candidaturasApi.atualizarCandidatura(currentCandidaturaId, {
          respostas: submittedData,
          estado: 'RASCUNHO',
        });
        return;
      }

      const nif = (submittedData.nif as string) || (submittedData.guardianNif as string) || user?.nif || '';
      const nome = (submittedData.nome as string) || (submittedData.childName as string) || user?.nome || 'Rascunho';

      const newCand = await candidaturasApi.criarCandidatura({
        formId: formularioAtivo.id,
        nif,
        nome,
        respostas: submittedData,
        estado: 'RASCUNHO',
      });
      setCurrentCandidaturaId(newCand.id);
      currentCandidaturaIdRef.current = newCand.id;
    } finally {
      isSavingRef.current = false;
    }
  }, [currentCandidaturaId, formularioAtivo?.id, user?.nif, user?.nome]);

  const getOrCreateDraftId = useCallback(async (): Promise<string | null> => {
    if (currentCandidaturaIdRef.current) return currentCandidaturaIdRef.current;
    const form = formularioAtivoRef.current;
    if (!form?.id) return null;
    try {
      const nif = (latestFormDataRef.current.nif as string) || (latestFormDataRef.current.guardianNif as string) || user?.nif || '';
      const nome = (latestFormDataRef.current.nome as string) || (latestFormDataRef.current.childName as string) || user?.nome || 'Rascunho';
      const newCand = await candidaturasApi.criarCandidatura({
        formId: form.id,
        nif,
        nome,
        respostas: latestFormDataRef.current,
        estado: 'RASCUNHO',
      });
      setCurrentCandidaturaId(newCand.id);
      currentCandidaturaIdRef.current = newCand.id;
      return newCand.id;
    } catch {
      return null;
    }
  }, [user?.nif, user?.nome]);

  const fileContextValue = useMemo(() => ({
    uploadFile: async (file: File, fieldName?: string) => {
      const candId = await getOrCreateDraftId();
      if (!candId) throw new Error('Não foi possível criar o rascunho para upload.');
      const formTitle = formularioAtivoRef.current?.name ?? '';
      const nif = candidaturaNif
        || (latestFormDataRef.current.nif as string)
        || (latestFormDataRef.current.guardianNif as string)
        || user?.nif
        || '';
      const renamedFile = buildUploadFileName(file, formTitle, nif, fieldName);
      const doc = await candidaturasApi.uploadDocumentoCandidatura(candId, renamedFile);
      return doc;
    },
    downloadFile: (docId: string, nomeOriginal: string) =>
      candidaturasApi.downloadDocumentoCandidatura(docId, nomeOriginal),
    deleteFile: (docId: string) =>
      candidaturasApi.removerDocumentoCandidatura(docId),
  }), [getOrCreateDraftId, candidaturaNif, user?.nif]);

  const handleSubmit = async (data: { formData?: Record<string, unknown> }) => {
    const submittedData = data.formData || {};

    if (!formularioAtivo?.id) {
      toast.error('Não existe um formulário ativo para este tipo de candidatura.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (currentCandidaturaId) {
        await candidaturasApi.atualizarCandidatura(currentCandidaturaId, {
          respostas: submittedData,
          estado: 'PENDENTE',
        });
        toast.success('Candidatura guardada com sucesso');
      } else {
        const created = await candidaturasApi.criarCandidatura({
          formId: formularioAtivo.id,
          nif: (submittedData.nif as string) || (submittedData.guardianNif as string) || user?.nif || '',
          nome: (submittedData.nome as string) || (submittedData.childName as string) || user?.nome || 'Sem nome',
          respostas: submittedData,
          estado: 'PENDENTE',
        });
        setCurrentCandidaturaId(created.id);
        toast.success('Candidatura enviada com sucesso');
      }

      setFormData(submittedData);
      latestFormDataRef.current = submittedData;
      isDirtyRef.current = false;
      onSuccess?.();
    } catch {
      toast.error('Não foi possível submeter a candidatura.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveDraft = useCallback(async () => {
    if (!formularioAtivo?.id) return;
    await persistDraft(latestFormDataRef.current);
    isDirtyRef.current = false;
  }, [formularioAtivo?.id, persistDraft]);

  useEffect(() => { saveDraftRef.current = saveDraft; }, [saveDraft]);

  const { touch } = useAutoSave({
    enabled: Boolean(formularioAtivo?.id),
    debounceMs: 1200,
    intervalMs: 30000,
    onSave: saveDraft,
    onStatusChange: (status) => {
      if (status === 'error') {
        console.error('Erro ao guardar rascunho automaticamente');
      }
    },
  });

  useEffect(() => {
    latestFormDataRef.current = formData;
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    isDirtyRef.current = true;
    touch();
  }, [formData, touch]);

  useEffect(() => {
    return () => {
      if (isDirtyRef.current) {
        void saveDraftRef.current();
      }
    };
  }, []);

  const previewBlock = useMemo(() => JSON.stringify(formData, null, 2), [formData]);

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
            {existingCandidaturaId ? 'Preencher Candidatura' : 'Nova Candidatura'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Preencha o formulário para submeter uma nova candidatura.
          </p>
        </div>
      )}

      {formularioAtivo ? (
        <CandidaturaFileContext.Provider value={fileContextValue}>
          <WizardForm
            form={formularioAtivo}
            initialData={formData}
            onSubmit={(data) => handleSubmit({ formData: data })}
            onSaveDraft={(data) => {
              latestFormDataRef.current = data;
              persistDraft(data).then(() => {
                isDirtyRef.current = false;
              }).catch(() => {
                // isDirtyRef stays true — unmount cleanup will retry
              });
            }}
            isSubmitting={isSubmitting}
            includeInternalPages={includeInternalPages}
          />
        </CandidaturaFileContext.Provider>
      ) : (
        <div className="py-10 text-center space-y-4">
          <p className="text-muted-foreground italic">Formulários indisponíveis para este tipo.</p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Voltar
          </Button>
        </div>
      )}

      {showPreview && (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="mb-2 text-xs text-muted-foreground">Preview do formData:</p>
          <pre className="text-xs overflow-auto whitespace-pre-wrap text-foreground">
            {previewBlock}
          </pre>
        </div>
      )}
    </div>
  );
}
