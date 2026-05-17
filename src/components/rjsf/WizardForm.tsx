import { useState, useMemo } from 'react';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { RJSFSchema } from '@rjsf/utils';
import { FormResponse } from '@/services/api/candidaturas/types';
import { StepIndicator } from './StepIndicator';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { rjsfWidgets } from './widgets/RjsfWidgets';
import { RjsfFieldTemplate } from './templates/RjsfFieldTemplate';
import { buildPageSchemas } from '@/utils/formAdapter';

interface WizardFormProps {
  form: FormResponse;
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  onSaveDraft?: (data: Record<string, unknown>) => void;
  isSubmitting?: boolean;
  includeInternalPages?: boolean;
}

const templates = {
  FieldTemplate: RjsfFieldTemplate,
};

export function WizardForm({
  form,
  initialData,
  onSubmit,
  onSaveDraft,
  isSubmitting = false,
  includeInternalPages = false,
}: WizardFormProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData ?? {});

  const pageSchemas = useMemo(
    () => buildPageSchemas(form.pages ?? [], { includeInternalPages }),
    [form.pages, includeInternalPages],
  );

  const hasNoVisibleFields =
    pageSchemas.length === 1 && Object.keys(pageSchemas[0].schema.properties ?? {}).length === 0;

  const isLast = currentPage === pageSchemas.length - 1;
  const page = form.pages?.[currentPage] || { title: form.name, description: undefined, fields: [] };
  const { schema, uiSchema } = pageSchemas[currentPage];

  const handleNextPage = () => {
    if (onSaveDraft) {
      onSaveDraft(formData);
    }
    setCurrentPage((p) => p + 1);
  };

  const handleFinalSubmit = (data: { formData?: any }) => {
    const merged = { ...formData, ...(data.formData || {}) };
    setFormData(merged);
    onSubmit(merged);
  };

  const handleBack = () => {
    setCurrentPage((p) => p - 1);
  };

  if (hasNoVisibleFields) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Este formulário não está disponível para o seu perfil.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {form.pages && form.pages.length > 1 && (
        <StepIndicator pages={form.pages} current={currentPage} />
      )}

      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">{page.title}</h2>
        {page.description && (
          <p className="text-sm text-muted-foreground">{page.description}</p>
        )}
      </div>

      <Form<any, RJSFSchema, any>
        schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        validator={validator}
        widgets={rjsfWidgets}
        templates={templates}
        showErrorList={false}
        noHtml5Validate
        transformErrors={(errors) =>
          errors.map((e) => {
            if (e.name === 'required') return { ...e, message: 'Este campo é obrigatório' };
            if (e.name === 'format' && e.params?.format === 'email') return { ...e, message: 'E-mail inválido' };
            if (e.name === 'format' && e.params?.format === 'date') return { ...e, message: 'Data inválida' };
            if (e.name === 'minLength') return { ...e, message: `Mínimo ${(e.params as any)?.limit} caracteres` };
            if (e.name === 'maxLength') return { ...e, message: `Máximo ${(e.params as any)?.limit} caracteres` };
            if (e.name === 'minimum') return { ...e, message: `Valor mínimo: ${(e.params as any)?.limit}` };
            if (e.name === 'maximum') return { ...e, message: `Valor máximo: ${(e.params as any)?.limit}` };
            return e;
          })
        }
        onChange={(e) => setFormData(e.formData)}
        onSubmit={handleFinalSubmit}
      >
        <div className="pt-6 flex justify-between border-t border-muted">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentPage === 0 || isSubmitting}
            className={currentPage === 0 ? 'invisible' : ''}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          {isLast ? (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'A submeter...' : 'Submeter Candidatura'}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handleNextPage} disabled={isSubmitting}>
              Seguinte
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
}
