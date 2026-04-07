import { useEffect, useMemo, useState } from 'react';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import type { RJSFSchema } from '@rjsf/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { candidaturaMockupSchema } from './schemas/candidaturaMockup.schema';
import { candidaturaMockupUiSchema } from './ui/candidaturaMockup.uiSchema';
import { rjsfWidgets } from './widgets/RjsfWidgets';
import { RjsfFieldTemplate } from './templates/RjsfFieldTemplate';
import { FormularioResponse } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { createMockCandidaturaForType, getMockFormularioForType } from '../../pages/candidaturas/candidaturaMockData';

const templates = {
  FieldTemplate: RjsfFieldTemplate,
};

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
  const { user } = useAuth();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [formularioAtivo, setFormularioAtivo] = useState<FormularioResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadFormulario = async () => {
      try {
        const mockForm = candidaturaType ? getMockFormularioForType(candidaturaType) : null;
        setFormularioAtivo(mockForm);

        // API lookup kept here for reference only while the candidaturas area uses local mocks.
        // const forms = await candidaturasApi.listarFormularios(candidaturaType);
        // if (forms.length > 0) {
        //   setFormularioAtivo(forms[0]);
        // } else {
        //   setFormularioAtivo(null);
        // }
      } catch (error) {
        toast.error('Não foi possível carregar o formulário, será usado o mock local.');
      }
    };

    loadFormulario();
  }, [candidaturaType]);

  const schema = useMemo<RJSFSchema>(
    () => (formularioAtivo?.schema as RJSFSchema) || candidaturaMockupSchema,
    [formularioAtivo]
  );

  const uiSchema = useMemo(
    () => formularioAtivo?.uiSchema || candidaturaMockupUiSchema,
    [formularioAtivo]
  );

  const handleSubmit = async (data: { formData?: Record<string, unknown> }) => {
    const submittedData = data.formData || {};

    if (!formularioAtivo?.id) {
      toast.error('Não existe um formulário ativo para este tipo de candidatura.');
      return;
    }

    try {
      setIsSubmitting(true);

      createMockCandidaturaForType(candidaturaType || '', submittedData, user?.id);

      // API submission kept here for reference only while the candidaturas area uses local mocks.
      // await candidaturasApi.criarCandidatura({
      //   formId: formularioAtivo.id,
      //   respostas: submittedData,
      //   criadoPor: user?.id,
      // });

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

      <Form<any, RJSFSchema, any>
        schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        validator={validator as any}
        widgets={rjsfWidgets}
        templates={templates}
        showErrorList={false}
        onChange={(event: { formData?: Record<string, unknown> }) =>
          setFormData(event.formData || {})
        }
        onSubmit={handleSubmit}
      >
        <div className="pt-2 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'A submeter...' : 'Submeter Candidatura'}
          </Button>
        </div>
      </Form>

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
