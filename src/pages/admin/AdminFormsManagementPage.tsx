import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { GlassCard } from '../../components/ui/glass-card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { candidaturaMockupSchema } from '../../components/rjsf/schemas/candidaturaMockup.schema';
import { candidaturaMockupUiSchema } from '../../components/rjsf/ui/candidaturaMockup.uiSchema';
import {
  candidaturasApi,
  type FormularioResponse,
} from '../../services/api';

const BASE_FORM_SCHEMA: Record<string, unknown> = {
  title: 'Formulário Base de Candidatura',
  type: 'object',
  required: ['nome', 'dataNascimento'],
  properties: {
    nome: {
      type: 'string',
      title: 'Nome',
      minLength: 2,
    },
    dataNascimento: {
      type: 'string',
      title: 'Data de Nascimento',
      format: 'date',
    },
    descricao: {
      type: 'string',
      title: 'Descrição',
      maxLength: 1000,
    },
  },
};

const BASE_FORM_UI_SCHEMA: Record<string, unknown> = {
  nome: {
    'ui:placeholder': 'Nome completo',
  },
  dataNascimento: {
    'ui:widget': 'date',
  },
  descricao: {
    'ui:widget': 'TextareaWidget',
    'ui:options': {
      rows: 4,
    },
    'ui:placeholder': 'Descrição da candidatura',
  },
};

const toPrettyJson = (value: unknown): string => JSON.stringify(value, null, 2);

const parseJson = (value: string): Record<string, unknown> | null => {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
};

interface AdminFormsManagementPageProps {
  onFormsChanged?: () => Promise<void> | void;
}

export function AdminFormsManagementPage({ onFormsChanged }: Readonly<AdminFormsManagementPageProps>) {
  const [forms, setForms] = useState<FormularioResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [schemaText, setSchemaText] = useState(toPrettyJson(BASE_FORM_SCHEMA));
  const [uiSchemaText, setUiSchemaText] = useState(toPrettyJson(BASE_FORM_UI_SCHEMA));
  const [formToDelete, setFormToDelete] = useState<FormularioResponse | null>(null);

  const isEditing = Boolean(editingFormId);

  const sortedForms = useMemo(
    () => [...forms].sort((a, b) => a.name.localeCompare(b.name, 'pt-PT')),
    [forms]
  );

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await candidaturasApi.listarFormularios();
      setForms(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Não foi possível carregar os formulários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadForms();
  }, []);

  const resetEditor = () => {
    setEditingFormId(null);
    setName('');
    setSchemaText(toPrettyJson(BASE_FORM_SCHEMA));
    setUiSchemaText(toPrettyJson(BASE_FORM_UI_SCHEMA));
  };

  const fillWithMockup = () => {
    setSchemaText(toPrettyJson(candidaturaMockupSchema));
    setUiSchemaText(toPrettyJson(candidaturaMockupUiSchema));
  };

  const handleEdit = (form: FormularioResponse) => {
    setEditingFormId(form.id);
    setName(form.name);
    setSchemaText(toPrettyJson(form.schema));
    setUiSchemaText(toPrettyJson(form.uiSchema || BASE_FORM_UI_SCHEMA));
  };

  const handleSave = async () => {
    const normalizedName = name.trim().toUpperCase();
    if (!normalizedName) {
      toast.error('O nome do formulário é obrigatório.');
      return;
    }

    const schema = parseJson(schemaText);
    const uiSchema = parseJson(uiSchemaText);

    if (!schema) {
      toast.error('Schema inválido. Verifique o JSON.');
      return;
    }

    if (!uiSchema) {
      toast.error('uiSchema inválido. Verifique o JSON.');
      return;
    }

    try {
      setSaving(true);
      if (editingFormId) {
        await candidaturasApi.atualizarFormulario(editingFormId, {
          name: normalizedName,
          schema,
          uiSchema,
        });
        toast.success('Formulário atualizado com sucesso.');
      } else {
        await candidaturasApi.criarFormulario({
          name: normalizedName,
          schema,
          uiSchema,
        });
        toast.success('Formulário criado com sucesso.');
      }

      resetEditor();
      await loadForms();
      await onFormsChanged?.();
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível guardar o formulário.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!formToDelete) return;

    try {
      await candidaturasApi.apagarFormulario(formToDelete.id);
      toast.success('Formulário removido com sucesso.');
      if (editingFormId === formToDelete.id) {
        resetEditor();
      }
      setFormToDelete(null);
      await loadForms();
      await onFormsChanged?.();
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível remover o formulário.');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <GlassCard className="p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Formulários Disponíveis</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => void loadForms()} disabled={loading}>
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>

        <div className="space-y-3">
          {sortedForms.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Ainda não existem formulários.</p>
          ) : (
            sortedForms.map((form) => (
              <div
                key={form.id}
                className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{form.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ID: {form.id}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button type="button" size="sm" variant="ghost" onClick={() => handleEdit(form)} aria-label={`Editar ${form.name}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setFormToDelete(form)} aria-label={`Remover ${form.name}`}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Editar Formulário' : 'Criar Formulário'}
          </h2>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={fillWithMockup}>
              Usar Mockup Completo
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={resetEditor}>
              <Plus className="w-4 h-4" />
              Novo
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Formulário</label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex: CRECHE"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Este nome é único e identifica o tipo de candidatura.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Schema (JSON)</label>
            <Textarea
              value={schemaText}
              onChange={(event) => setSchemaText(event.target.value)}
              className="mt-1 min-h-[220px] font-mono text-xs"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">uiSchema (JSON)</label>
            <Textarea
              value={uiSchemaText}
              onChange={(event) => setUiSchemaText(event.target.value)}
              className="mt-1 min-h-[220px] font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={resetEditor}>Cancelar</Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving} className="bg-purple-600 text-white hover:bg-purple-700">
              {saving ? 'A guardar...' : isEditing ? 'Guardar Alterações' : 'Criar Formulário'}
            </Button>
          </div>
        </div>
      </GlassCard>

      <AlertDialog open={Boolean(formToDelete)} onOpenChange={(open) => !open && setFormToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover formulário</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação vai remover o formulário {formToDelete?.name}. Pretende continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => void handleDelete()}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
