import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import type { RJSFSchema } from '@rjsf/utils';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { candidaturasApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { candidaturaMockupSchema } from '../../components/rjsf/schemas/candidaturaMockup.schema';
import { candidaturaMockupUiSchema } from '../../components/rjsf/ui/candidaturaMockup.uiSchema';
import { rjsfWidgets } from '../../components/rjsf/widgets/RjsfWidgets';
import { RjsfFieldTemplate } from '../../components/rjsf/templates/RjsfFieldTemplate';

const templates = {
  FieldTemplate: RjsfFieldTemplate,
};

export function CandidaturaDetailPage() {
  const navigate = useNavigate();
  const { candidaturaId } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [estado, setEstado] = useState<string>('PENDENTE');
  const [formId, setFormId] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [schemaFromApi, setSchemaFromApi] = useState<RJSFSchema | null>(null);
  const [uiSchemaFromApi, setUiSchemaFromApi] = useState<Record<string, unknown> | null>(null);

  const canEdit = estado === 'PENDENTE';

  const schema = useMemo<RJSFSchema>(() => schemaFromApi || candidaturaMockupSchema, [schemaFromApi]);
  const uiSchema = useMemo(() => uiSchemaFromApi || candidaturaMockupUiSchema, [uiSchemaFromApi]);

  useEffect(() => {
    const loadData = async () => {
      if (!candidaturaId) return;

      try {
        setLoading(true);
        const candidatura = await candidaturasApi.obterCandidaturaPorId(candidaturaId);
        setEstado(candidatura.estado);
        setFormId(candidatura.formId);
        setFormData(candidatura.respostas || {});

        const form = await candidaturasApi.obterFormularioPorId(candidatura.formId);
        setSchemaFromApi((form.schema as RJSFSchema) || candidaturaMockupSchema);
        setUiSchemaFromApi(form.uiSchema || candidaturaMockupUiSchema);
      } catch (error) {
        toast.error(t('applications.detail.messages.loadError'));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [candidaturaId]);

  const handleSave = async () => {
    if (!candidaturaId || !formId) return;

    try {
      setSaving(true);
      await candidaturasApi.atualizarCandidatura(candidaturaId, {
        formId,
        respostas: formData,
        atualizadoPor: user?.id,
      });
      toast.success(t('applications.detail.messages.saveSuccess'));
      setEditing(false);
    } catch (error: any) {
      toast.error(error?.message || t('applications.detail.messages.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto mt-4 p-6 sm:p-8 bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-lg border border-purple-200 dark:border-purple-800">
        <p className="text-sm text-gray-600 dark:text-gray-300">{t('applications.detail.messages.loading')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-4 p-6 sm:p-8 bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-lg border border-purple-200 dark:border-purple-800">
      <div className="flex items-center justify-between mb-5 gap-3">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            {t('applications.detail.actions.back')}
          </Button>
          {canEdit && !editing ? (
            <Button type="button" variant="outline" onClick={() => setEditing(true)}>
              {t('applications.detail.actions.edit')}
            </Button>
          ) : null}
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">{t('applications.detail.labels.status')}: {estado}</span>
      </div>

      <Form<any, RJSFSchema, any>
        schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        validator={validator as any}
        widgets={rjsfWidgets}
        templates={templates}
        showErrorList={false}
        liveValidate
        readonly={!editing}
        onChange={(event: { formData?: Record<string, unknown> }) =>
          setFormData(event.formData || {})
        }
      >
        <div />
      </Form>

      {editing ? (
        <div className="pt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setEditing(false)}>
            {t('applications.detail.actions.cancel')}
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white">
            {saving ? t('applications.detail.actions.saving') : t('applications.detail.actions.save')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
