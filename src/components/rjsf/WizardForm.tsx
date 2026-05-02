import { useState, useMemo } from 'react';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import { FormResponse } from '@/services/api/candidaturas/types';
import { StepIndicator } from './StepIndicator';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { rjsfWidgets } from './widgets/RjsfWidgets';
import { RjsfFieldTemplate } from './templates/RjsfFieldTemplate';

interface WizardFormProps {
  form: FormResponse;
  onSubmit: (data: Record<string, unknown>) => void;
  onSaveDraft?: (data: Record<string, unknown>) => void;
  isSubmitting?: boolean;
}

const templates = {
  FieldTemplate: RjsfFieldTemplate,
};

function buildPageSchemas(form: FormResponse) {
  if (!form.pages || form.pages.length === 0) {
    return [{
      schema: form.schema as RJSFSchema,
      uiSchema: (form.uiSchema || {}) as UiSchema,
    }];
  }

  return form.pages.map((page) => {
    const properties: Record<string, any> = {};
    const schema = form.schema as any;

    page.fields.forEach((key) => {
      if (schema.properties && schema.properties[key]) {
        properties[key] = schema.properties[key];
      }
    });

    const required = (schema.required ?? []).filter((key: string) =>
      page.fields.includes(key)
    );

    const uiSchema: Record<string, any> = {};
    const originalUiSchema = (form.uiSchema || {}) as Record<string, any>;

    page.fields.forEach((key) => {
      if (key in originalUiSchema) {
        uiSchema[key] = originalUiSchema[key];
      }
    });

    return {
      schema: {
        type: 'object',
        title: page.title,
        properties,
        ...(required.length ? { required } : {}),
      } as RJSFSchema,
      uiSchema: uiSchema as UiSchema,
    };
  });
}

export function WizardForm({ form, onSubmit, onSaveDraft, isSubmitting = false }: WizardFormProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const pageSchemas = useMemo(() => buildPageSchemas(form), [form]);
  const isLast = currentPage === pageSchemas.length - 1;
  const page = form.pages?.[currentPage] || { title: form.name, description: undefined, fields: [] };
  const { schema, uiSchema } = pageSchemas[currentPage];

  const handleNext = (data: { formData?: any }) => {
    const pageData = data.formData || {};
    const merged = { ...formData, ...pageData };
    setFormData(merged);

    if (isLast) {
      onSubmit(merged);
    } else {
      // Auto-save draft on page change
      if (onSaveDraft) {
        onSaveDraft(merged);
      }
      setCurrentPage((p) => p + 1);
    }
  };

  const handleBack = () => {
    setCurrentPage((p) => p - 1);
  };

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
        onChange={(e) => setFormData(e.formData)}
        onSubmit={handleNext}
      >
        <div className="pt-6 flex justify-between border-t border-muted">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentPage === 0 || isSubmitting}
            className={currentPage === 0 ? "invisible" : ""}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          {onSaveDraft && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSaveDraft(formData)}
              disabled={isSubmitting}
              className="text-muted-foreground hover:text-foreground"
            >
              Guardar rascunho
            </Button>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isLast ? (
              <>
                {isSubmitting ? 'A submeter...' : 'Submeter Candidatura'}
                <Send className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Seguinte
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
}
