import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import type { RJSFSchema } from '@rjsf/utils';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { candidaturaMockupSchema } from '../../components/rjsf/schemas/candidaturaMockup.schema';
import { candidaturaMockupUiSchema } from '../../components/rjsf/ui/candidaturaMockup.uiSchema';
import { rjsfWidgets } from '../../components/rjsf/widgets/RjsfWidgets';
import { RjsfFieldTemplate } from '../../components/rjsf/templates/RjsfFieldTemplate';
import { CandidaturasCard } from '../../components/candidaturas/CandidaturasCard';
import { CandidaturaStatusChangeDialog } from '../../components/candidaturas/CandidaturaStatusChangeDialog';
import { CandidaturasStatusBadge } from '../../components/candidaturas/CandidaturasStatusBadge';
import { getMockCandidaturaById, getMockFormularioById, updateMockCandidatura } from './candidaturaMockData';

const toStatusLabel = (estado: string, t: (key: string) => string): string => {
  if (estado === 'APROVADA') return t('applications.flow.status.approved');
  if (estado === 'REJEITADA') return t('applications.flow.status.rejected');
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
    const match = location.pathname.match(/^\/dashboard\/(?:creche|catl|erpi)\/([^/]+)$/i);
    return match?.[1] || '';
  }, [routeCandidaturaId, location.pathname]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [estado, setEstado] = useState<string>('PENDENTE');
  const [formId, setFormId] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [schemaFromApi, setSchemaFromApi] = useState<RJSFSchema | null>(null);
  const [uiSchemaFromApi, setUiSchemaFromApi] = useState<Record<string, unknown> | null>(null);

  const canEdit = estado === 'PENDENTE' && user?.role !== 'SECRETARIA';
  const canChangeStatus = user?.role === 'SECRETARIA';

  const schema = useMemo<RJSFSchema>(() => schemaFromApi || candidaturaMockupSchema, [schemaFromApi]);
  const uiSchema = useMemo(() => uiSchemaFromApi || candidaturaMockupUiSchema, [uiSchemaFromApi]);

  useEffect(() => {
    const loadData = async () => {
      if (!candidaturaId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const candidatura = getMockCandidaturaById(candidaturaId);

        // API lookup kept here for reference only while the candidaturas area uses local mocks.
        // const candidatura = await candidaturasApi.obterCandidaturaPorId(candidaturaId);

        if (!candidatura) {
          throw new Error('Candidatura mock não encontrada');
        }

        setEstado(candidatura.estado);
        setFormId(candidatura.formId);
        setFormData(candidatura.respostas || {});

        const form = getMockFormularioById(candidatura.formId);

        // API lookup kept here for reference only while the candidaturas area uses local mocks.
        // const form = await candidaturasApi.obterFormularioPorId(candidatura.formId);

        setSchemaFromApi((form?.schema as RJSFSchema) || candidaturaMockupSchema);
        setUiSchemaFromApi(form?.uiSchema || candidaturaMockupUiSchema);
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

      const updated = updateMockCandidatura(candidaturaId, {
        formId,
        respostas: formData,
      });

      // API update kept here for reference only while the candidaturas area uses local mocks.
      // await candidaturasApi.atualizarCandidatura(candidaturaId, {
      //   formId,
      //   respostas: formData,
      //   atualizadoPor: user?.id,
      // });

      if (!updated) {
        throw new Error('Candidatura mock não encontrada');
      }

      toast.success(t('applications.detail.messages.saveSuccess'));
      setEditing(false);
    } catch (error: any) {
      toast.error(error?.message || t('applications.detail.messages.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangeStatus = async (newStatus: 'PENDENTE' | 'APROVADA' | 'REJEITADA') => {
    if (!candidaturaId) return;

    try {
      const updated = updateMockCandidatura(candidaturaId, { estado: newStatus });

      // API update kept here for reference only while the candidaturas area uses local mocks.
      // await candidaturasApi.atualizarEstado(candidaturaId, { estado: newStatus });

      if (!updated) {
        throw new Error('Candidatura mock não encontrada');
      }

      setEstado(newStatus);
      setEditing(false);
      toast.success(t('applications.flow.messages.statusUpdatedSuccess'));
    } catch (error: any) {
      toast.error(error?.message || t('applications.flow.messages.statusUpdateError'));
    }
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
            <Button type="button" variant="outline" onClick={() => setEditing(true)}>
              {t('applications.detail.actions.edit')}
            </Button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('applications.detail.labels.status')}:</span>
          <CandidaturasStatusBadge status={estado as 'PENDENTE' | 'APROVADA' | 'REJEITADA'} label={toStatusLabel(estado, t)} />
        </div>
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
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? t('applications.detail.actions.saving') : t('applications.detail.actions.save')}
          </Button>
        </div>
      ) : null}

      {canChangeStatus ? (
        <CandidaturaStatusChangeDialog
          open={statusDialogOpen}
          candidaturaCode={candidaturaId}
          currentStatus={estado as 'PENDENTE' | 'APROVADA' | 'REJEITADA'}
          onOpenChange={setStatusDialogOpen}
          onConfirm={handleChangeStatus}
        />
      ) : null}
    </CandidaturasCard>
  );
}
