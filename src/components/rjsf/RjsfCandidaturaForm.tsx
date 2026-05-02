import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { candidaturasApi, FormResponse } from '@/services/api';
import { WizardForm } from './WizardForm';

interface RjsfCandidaturaFormProps {
  onSuccess?: () => void;
  showPreview?: boolean;
  showTitle?: boolean;
  candidaturaType?: string;
}

export function RjsfCandidaturaForm({
  onSuccess,
  showPreview = true,
  showTitle = true,
  candidaturaType,
}: RjsfCandidaturaFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [formularioAtivo, setFormularioAtivo] = useState<FormResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentCandidaturaId, setCurrentCandidaturaId] = useState<string | null>(null);

  useEffect(() => {
    const loadFormulario = async () => {
      try {
        const forms = await candidaturasApi.listarFormularios(candidaturaType);
        if (forms.length > 0) {
          setFormularioAtivo(forms[0]);
        } else {
          setFormularioAtivo(null);
        }
      } catch (error) {
        toast.error('Não foi possível carregar o formulário, será usado o mock local.');
      }
    };

    loadFormulario();
  }, [candidaturaType]);

  const handleSubmit = async (data: { formData?: Record<string, unknown> }) => {
    const submittedData = data.formData || {};

    if (!formularioAtivo?.id) {
      toast.error('Não existe um formulário ativo para este tipo de candidatura.');
      return;
    }

    try {
      setIsSubmitting(true);

      await candidaturasApi.criarCandidatura({
        formId: formularioAtivo.id,
        nif: (submittedData.guardianNif as string) || (submittedData.nif as string) || '',
        nome: (submittedData.childName as string) || (submittedData.nome as string) || 'Sem nome',
        respostas: submittedData,
      });

      toast.success('Candidatura enviada com sucesso');
      setFormData(submittedData);
      console.info('[RJSF candidatura] Submitted data:', submittedData);
      onSuccess?.();
    } catch (error) {
      toast.error('Não foi possível submeter a candidatura.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (submittedData: Record<string, unknown>) => {
    if (!formularioAtivo?.id) return;

    try {
      if (currentCandidaturaId) {
        await candidaturasApi.atualizarCandidatura(currentCandidaturaId, {
          respostas: submittedData,
          estado: 'RASCUNHO',
        });
        console.info('[Draft] Updated draft:', currentCandidaturaId);
      } else {
        const newCand = await candidaturasApi.criarCandidatura({
          formId: formularioAtivo.id,
          nif: (submittedData.guardianNif as string) || (submittedData.nif as string) || '000000000',
          nome: (submittedData.childName as string) || (submittedData.nome as string) || 'Rascunho',
          respostas: submittedData,
          estado: 'RASCUNHO',
        });
        setCurrentCandidaturaId(newCand.id);
        console.info('[Draft] Created new draft:', newCand.id);
      }
    } catch (error) {
      console.error('Erro ao guardar rascunho:', error);
    }
  };

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
            Nova Candidatura
          </h1>
          <p className="text-sm text-muted-foreground">
            Preencha o formulário para submeter uma nova candidatura.
          </p>
        </div>
      )}


      {formularioAtivo ? (
        <WizardForm
          form={formularioAtivo}
          onSubmit={(data) => handleSubmit({ formData: data })}
          onSaveDraft={handleSaveDraft}
          isSubmitting={isSubmitting}
        />
      ) : (
        <div className="py-10 text-center space-y-4">
          <p className="text-muted-foreground italic">Formulários indisponíveis para este tipo.</p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Voltar
          </Button>
        </div>
      )}

      {showPreview && (
        <GlassCard className="p-4">
          <p className="mb-2 text-xs text-muted-foreground">
            Preview do formData:
          </p>
          <pre className="text-xs overflow-auto whitespace-pre-wrap text-foreground">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </GlassCard>
      )}
    </div>
  );
}
