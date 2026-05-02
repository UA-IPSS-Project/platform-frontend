import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, Pencil, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { GlassCard } from '../../components/ui/glass-card';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
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
import {
  candidaturasApi,
  type FormResponse,
  type FormPage,
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

type FieldKind = 'string' | 'number' | 'boolean' | 'date' | 'email' | 'textarea' | 'select';

interface FieldEditorState {
  key: string;
  title: string;
  kind: FieldKind;
  placeholder: string;
  required: boolean;
  options: string;
}

interface FieldSummary {
  key: string;
  title: string;
  kind: FieldKind;
  required: boolean;
  placeholder: string;
  options: string[];
}


interface FormLayoutState {
  title: string;
  pages: FormPage[];
}

const EMPTY_FIELD_EDITOR: FieldEditorState = {
  key: '',
  title: '',
  kind: 'string',
  placeholder: '',
  required: false,
  options: '',
};

const DEFAULT_FORM_LAYOUT: FormLayoutState = {
  title: 'Nova candidatura',
  pages: [
    {
      title: 'Página 1',
      description: '',
      fields: [],
    },
  ],
};


const splitFieldOptions = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map(option => option.trim())
    .filter(Boolean);

const inferFieldKind = (property: Record<string, unknown>, uiSchema?: Record<string, unknown>): FieldKind => {
  const widget = typeof uiSchema?.['ui:widget'] === 'string' ? uiSchema['ui:widget'] : undefined;

  if (widget === 'TextareaWidget') return 'textarea';
  if (widget === 'DateWidget') return 'date';
  if (widget === 'EmailWidget') return 'email';
  if (widget === 'CheckboxWidget') return 'boolean';
  if (Array.isArray(property.enum) && property.enum.length > 0) return 'select';
  if (property.type === 'boolean') return 'boolean';
  if (property.format === 'date') return 'date';
  if (property.format === 'email') return 'email';
  if (property.type === 'number' || property.type === 'integer') return 'number';

  return 'string';
};

const buildPropertyForField = (field: FieldEditorState) => {
  const property: Record<string, unknown> = {
    title: field.title.trim(),
  };

  switch (field.kind) {
    case 'number':
      property.type = 'number';
      break;
    case 'boolean':
      property.type = 'boolean';
      property.default = false;
      break;
    case 'date':
      property.type = 'string';
      property.format = 'date';
      break;
    case 'email':
      property.type = 'string';
      property.format = 'email';
      break;
    case 'textarea':
      property.type = 'string';
      break;
    case 'select': {
      const options = splitFieldOptions(field.options);
      property.type = 'string';
      property.enum = options;
      break;
    }
    default:
      property.type = 'string';
  }

  return property;
};

const buildUiSchemaForField = (field: FieldEditorState) => {
  const uiSchema: Record<string, unknown> = {};

  if (field.placeholder.trim() && field.kind !== 'boolean' && field.kind !== 'select') {
    uiSchema['ui:placeholder'] = field.placeholder.trim();
  }

  switch (field.kind) {
    case 'boolean':
      uiSchema['ui:widget'] = 'CheckboxWidget';
      break;
    case 'date':
      uiSchema['ui:widget'] = 'DateWidget';
      break;
    case 'email':
      uiSchema['ui:widget'] = 'EmailWidget';
      break;
    case 'textarea':
      uiSchema['ui:widget'] = 'TextareaWidget';
      uiSchema['ui:options'] = { rows: 4 };
      if (field.placeholder.trim()) {
        uiSchema['ui:placeholder'] = field.placeholder.trim();
      }
      break;
    default:
      break;
  }

  return uiSchema;
};

interface AdminFormsManagementPageProps {
  candidaturaType?: string;
  onFormsChanged?: () => Promise<void> | void;
}

export function AdminFormsManagementPage({ candidaturaType = '', onFormsChanged }: AdminFormsManagementPageProps) {
  const { t } = useTranslation();
  const [forms, setForms] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [schemaText, setSchemaText] = useState(toPrettyJson(BASE_FORM_SCHEMA));
  const [uiSchemaText, setUiSchemaText] = useState(toPrettyJson(BASE_FORM_UI_SCHEMA));
  const [layoutState, setLayoutState] = useState<FormLayoutState>(DEFAULT_FORM_LAYOUT);
  const [fieldEditor, setFieldEditor] = useState<FieldEditorState & { pageIndex: number }>({ ...EMPTY_FIELD_EDITOR, pageIndex: 0 });
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const [formToDelete, setFormToDelete] = useState<FormResponse | null>(null);

  const isEditing = Boolean(editingFormId);

  const sortedForms = useMemo(
    () => [...forms].sort((a, b) => a.name.localeCompare(b.name, 'pt-PT')),
    [forms]
  );

  const parsedSchema = useMemo(() => parseJson(schemaText), [schemaText]);
  const parsedUiSchema = useMemo(() => parseJson(uiSchemaText), [uiSchemaText]);


  const fields = useMemo<FieldSummary[]>(() => {
    if (!parsedSchema || parsedSchema.type !== 'object') {
      return [];
    }

    const properties = parsedSchema.properties;
    if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
      return [];
    }

    const requiredFields = new Set(
      Array.isArray(parsedSchema.required)
        ? parsedSchema.required.filter((item): item is string => typeof item === 'string')
        : []
    );

    return Object.entries(properties).map(([key, value]) => {
      const property = value as Record<string, unknown>;
      const uiSchema = parsedUiSchema?.[key] as Record<string, unknown> | undefined;

      return {
        key,
        title: typeof property.title === 'string' ? property.title : key,
        kind: inferFieldKind(property, uiSchema),
        required: requiredFields.has(key),
        placeholder: typeof uiSchema?.['ui:placeholder'] === 'string' ? String(uiSchema['ui:placeholder']) : '',
        options: Array.isArray(property.enum) ? property.enum.map((option) => String(option)) : [],
      };
    });
  }, [parsedSchema, parsedUiSchema]);

  const resetFieldEditor = () => {
    setFieldEditor({ ...EMPTY_FIELD_EDITOR, pageIndex: 0 });
    setEditingFieldKey(null);
  };

  const resetLayoutState = () => {
    setLayoutState(DEFAULT_FORM_LAYOUT);
  };


  const buildPreviewFieldsBySection = () => {
    return layoutState.pages.map((page) => ({
      ...page,
      id: page.title,
      fieldDetails: page.fields.map(key => fields.find(f => f.key === key)).filter(Boolean) as FieldSummary[]
    }));
  };

  const persistSchemaUpdate = (nextSchema: Record<string, unknown>, nextUiSchema: Record<string, unknown>) => {
    setSchemaText(toPrettyJson(nextSchema));
    setUiSchemaText(toPrettyJson(nextUiSchema));
  };

  const startEditingField = (field: FieldSummary) => {
    const pageIndex = layoutState.pages.findIndex(p => p.fields.includes(field.key));
    setEditingFieldKey(field.key);
    setFieldEditor({
      key: field.key,
      title: field.title,
      kind: field.kind,
      placeholder: field.placeholder,
      required: field.required,
      options: field.options.join('\n'),
      pageIndex: pageIndex >= 0 ? pageIndex : 0,
    });
  };

  const generateUniqueKey = (title: string, currentProperties: Record<string, unknown>, excludeKey?: string) => {
    let baseKey = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    
    if (!baseKey) baseKey = 'campo';
    
    let finalKey = baseKey;
    let counter = 1;
    
    while (finalKey in currentProperties && finalKey !== excludeKey) {
      finalKey = `${baseKey}_${counter}`;
      counter++;
    }
    
    return finalKey;
  };

  const handleSaveField = () => {
    if (!parsedSchema || parsedSchema.type !== 'object') {
      toast.error('Schema base inválido.');
      return;
    }

    const fieldTitle = fieldEditor.title.trim();
    if (!fieldTitle) {
      toast.error('O título do campo é obrigatório.');
      return;
    }

    const currentProperties = (parsedSchema.properties as Record<string, unknown>) || {};
    const fieldKey = editingFieldKey || generateUniqueKey(fieldTitle, currentProperties, editingFieldKey || undefined);

    if (fieldEditor.kind === 'select' && splitFieldOptions(fieldEditor.options).length === 0) {
      toast.error('Adicione pelo menos uma opção para o campo de escolha.');
      return;
    }

    const nextSchema: Record<string, unknown> = {
      ...parsedSchema,
      properties: { ...currentProperties },
    };
    const nextUiSchema: Record<string, unknown> = { ...(parsedUiSchema || {}) };
    const nextProperties = nextSchema.properties as Record<string, unknown>;
    const nextRequired = new Set(
      Array.isArray(parsedSchema.required)
        ? parsedSchema.required.filter((item): item is string => typeof item === 'string')
        : []
    );

    if (editingFieldKey && editingFieldKey !== fieldKey) {
      delete nextProperties[editingFieldKey];
      delete nextUiSchema[editingFieldKey];
      nextRequired.delete(editingFieldKey);
    }

    nextProperties[fieldKey] = buildPropertyForField({
      ...fieldEditor,
      key: fieldKey,
      title: fieldTitle,
    });

    const uiSchemaForField = buildUiSchemaForField({
      ...fieldEditor,
      key: fieldKey,
      title: fieldTitle,
    });

    if (Object.keys(uiSchemaForField).length > 0) {
      nextUiSchema[fieldKey] = uiSchemaForField;
    } else {
      delete nextUiSchema[fieldKey];
    }

    if (fieldEditor.required) {
      nextRequired.add(fieldKey);
    } else {
      nextRequired.delete(fieldKey);
    }

    nextSchema.required = Array.from(nextRequired);

    // Update pages
    const nextPages = [...layoutState.pages];
    // Remove field from all pages first
    nextPages.forEach(p => {
      p.fields = p.fields.filter(f => f !== editingFieldKey && f !== fieldKey);
    });
    // Add to selected page
    if (nextPages[fieldEditor.pageIndex]) {
      nextPages[fieldEditor.pageIndex].fields.push(fieldKey);
    }

    setLayoutState(prev => ({ ...prev, pages: nextPages }));
    persistSchemaUpdate(nextSchema, nextUiSchema);
    resetFieldEditor();
    toast.success(editingFieldKey ? 'Campo atualizado com sucesso.' : 'Campo adicionado com sucesso.');
  };

  const handleDeleteField = (fieldKey: string) => {
    if (!parsedSchema || parsedSchema.type !== 'object') {
      return;
    }

    const properties = parsedSchema.properties as Record<string, unknown> | undefined;
    if (!properties || !(fieldKey in properties)) {
      return;
    }

    const nextSchema: Record<string, unknown> = {
      ...parsedSchema,
      properties: { ...properties },
    };
    const nextUiSchema: Record<string, unknown> = { ...(parsedUiSchema || {}) };
    const nextProperties = nextSchema.properties as Record<string, unknown>;
    const nextRequired = new Set(
      Array.isArray(parsedSchema.required)
        ? parsedSchema.required.filter((item): item is string => typeof item === 'string')
        : []
    );

    delete nextProperties[fieldKey];
    delete nextUiSchema[fieldKey];
    nextRequired.delete(fieldKey);
    nextSchema.required = Array.from(nextRequired);

    persistSchemaUpdate(nextSchema, nextUiSchema);

    if (editingFieldKey === fieldKey) {
      resetFieldEditor();
    }

    toast.success('Campo removido com sucesso.');
  };

  const handleMoveField = (fieldKey: string, direction: -1 | 1) => {
    if (!parsedSchema || parsedSchema.type !== 'object') {
      return;
    }

    const properties = parsedSchema.properties as Record<string, unknown> | undefined;
    if (!properties || !(fieldKey in properties)) {
      return;
    }

    const entries = Object.entries(properties);
    const index = entries.findIndex(([key]) => key === fieldKey);
    const targetIndex = index + direction;

    if (index === -1 || targetIndex < 0 || targetIndex >= entries.length) {
      return;
    }

    [entries[index], entries[targetIndex]] = [entries[targetIndex], entries[index]];

    const nextSchema: Record<string, unknown> = {
      ...parsedSchema,
      properties: Object.fromEntries(entries),
    };

    persistSchemaUpdate(nextSchema, parsedUiSchema || {});
  };

  const addLayoutSection = () => {
    setLayoutState((current) => ({
      ...current,
      pages: [
        ...current.pages,
        {
          title: `Página ${current.pages.length + 1}`,
          description: '',
          fields: [],
        },
      ],
    }));
  };

  const updateLayoutSection = (index: number, updates: Partial<FormPage>) => {
    setLayoutState((current) => ({
      ...current,
      pages: current.pages.map((page, i) => (
        i === index ? { ...page, ...updates } : page
      )),
    }));
  };

  const removeLayoutSection = (index: number) => {
    setLayoutState((current) => ({
      ...current,
      pages: current.pages.length > 1
        ? current.pages.filter((_, i) => i !== index)
        : current.pages,
    }));
  };

  const moveLayoutSection = (index: number, direction: -1 | 1) => {
    setLayoutState((current) => {
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= current.pages.length) {
        return current;
      }

      const nextPages = [...current.pages];
      [nextPages[index], nextPages[targetIndex]] = [nextPages[targetIndex], nextPages[index]];

      return {
        ...current,
        pages: nextPages,
      };
    });
  };

  const beginNewForm = () => {
    resetEditor();
    resetFieldEditor();
    resetLayoutState();
  };

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
    resetLayoutState();
    resetFieldEditor();
  };


  const handleEdit = (form: FormResponse) => {
    setEditingFormId(form.id);
    setName(form.name);
    setSchemaText(toPrettyJson(form.schema));
    setUiSchemaText(toPrettyJson(form.uiSchema || BASE_FORM_UI_SCHEMA));
    setLayoutState({
      title: typeof form.schema.title === 'string' ? form.schema.title : DEFAULT_FORM_LAYOUT.title,
      pages: Array.isArray(form.pages) && form.pages.length > 0
        ? form.pages
        : DEFAULT_FORM_LAYOUT.pages,
    });
    resetFieldEditor();
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
          schema: schema,
          uiSchema,
          pages: layoutState.pages,
        });
        toast.success('Formulário atualizado com sucesso.');
      } else {
        await candidaturasApi.criarFormulario({
          name: normalizedName,
          schema: schema,
          uiSchema,
          pages: layoutState.pages,
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

  const previewSections = buildPreviewFieldsBySection();

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
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">{t('applications.flow.messages.unavailableForms')}</p>
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
              <Button type="button" variant="outline" size="sm" onClick={beginNewForm}>
              <Plus className="w-4 h-4" />
              Novo
              </Button>
          </div>
        </div>

        <Tabs defaultValue="layout" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="fields">Campos</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="advanced">JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="layout" className="space-y-4 mt-0">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Título do formulário</label>
                <Input
                  value={layoutState.title}
                  onChange={(event) => setLayoutState((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Ex: Candidatura à Creche"
                  className="mt-1"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Resumo</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{fields.length} campo(s)</p>
                  <p className="text-sm text-gray-900 dark:text-white">{layoutState.pages.length} página(s)</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Páginas do formulário</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Organize o formulário em múltiplas páginas.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addLayoutSection}>
                  <Plus className="w-4 h-4" />
                  Adicionar página
                </Button>
              </div>

              <div className="space-y-3">
                {layoutState.pages.map((page, index) => (
                  <div key={index} className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40 p-3 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Título da página</label>
                          <Input
                            value={page.title}
                            onChange={(event) => updateLayoutSection(index, { title: event.target.value })}
                            className="mt-1"
                            placeholder="Ex: Dados do encarregado"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Descrição</label>
                          <Input
                            value={page.description}
                            onChange={(event) => updateLayoutSection(index, { description: event.target.value })}
                            className="mt-1"
                            placeholder="Breve explicação da página"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button type="button" size="sm" variant="ghost" onClick={() => moveLayoutSection(index, -1)} disabled={index === 0}>
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => moveLayoutSection(index, 1)} disabled={index === layoutState.pages.length - 1}>
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => removeLayoutSection(index)} disabled={layoutState.pages.length === 1}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          </TabsContent>

          <TabsContent value="fields" className="space-y-4 mt-0">
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Campos do formulário</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Adicione, edite, remova ou reorganize os campos antes de guardar o formulário.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => resetFieldEditor()}>
                  <X className="w-4 h-4" />
                  Limpar edição
                </Button>
              </div>

              <div className="space-y-2">
                {fields.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ainda não existem campos definidos.</p>
                ) : (
                  fields.map((field, index) => (
                    <div key={field.key} className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-white">{field.title}</p>
                            <span className="text-[11px] rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-gray-600 dark:text-gray-300">{field.kind}</span>
                            {field.required ? <span className="text-[11px] rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-red-700 dark:text-red-200">Obrigatório</span> : null}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Chave: {field.key}</p>
                          {field.placeholder ? <p className="text-xs text-gray-500 dark:text-gray-400">Placeholder: {field.placeholder}</p> : null}
                          {field.options.length > 0 ? <p className="text-xs text-gray-500 dark:text-gray-400">Opções: {field.options.join(' · ')}</p> : null}
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-1">
                          <Button type="button" size="sm" variant="ghost" onClick={() => handleMoveField(field.key, -1)} disabled={index === 0} aria-label={`Mover ${field.title} para cima`}>
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => handleMoveField(field.key, 1)} disabled={index === fields.length - 1} aria-label={`Mover ${field.title} para baixo`}>
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => startEditingField(field)} aria-label={`Editar ${field.title}`}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => handleDeleteField(field.key)} aria-label={`Remover ${field.title}`}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Página / Secção</label>
                  <Select value={String(fieldEditor.pageIndex)} onValueChange={(value) => setFieldEditor((prev) => ({ ...prev, pageIndex: parseInt(value) }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione a página" />
                    </SelectTrigger>
                    <SelectContent>
                      {layoutState.pages.map((page, i) => (
                        <SelectItem key={i} value={String(i)}>{page.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Título visível</label>
                  <Input
                    value={fieldEditor.title}
                    onChange={(event) => setFieldEditor((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Ex: Número de telefone"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                  <Select value={fieldEditor.kind} onValueChange={(value) => setFieldEditor((prev) => ({ ...prev, kind: value as FieldKind }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">Texto</SelectItem>
                      <SelectItem value="number">Número</SelectItem>
                      <SelectItem value="boolean">Checkbox</SelectItem>
                      <SelectItem value="date">Data</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="textarea">Área de texto</SelectItem>
                      <SelectItem value="select">Lista de opções</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Placeholder</label>
                  <Input
                    value={fieldEditor.placeholder}
                    onChange={(event) => setFieldEditor((prev) => ({ ...prev, placeholder: event.target.value }))}
                    placeholder="Ex: Introduza um valor"
                    className="mt-1"
                  />
                </div>

                {fieldEditor.kind === 'select' ? (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Opções</label>
                    <Textarea
                      value={fieldEditor.options}
                      onChange={(event) => setFieldEditor((prev) => ({ ...prev, options: event.target.value }))}
                      className="mt-1 min-h-[110px] font-mono text-xs"
                      placeholder={['Opção 1', 'Opção 2'].join('\n')}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Uma opção por linha, ou separadas por vírgulas.</p>
                  </div>
                ) : null}

                <div className="md:col-span-2 flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Checkbox
                      checked={fieldEditor.required}
                      onCheckedChange={(checked) => setFieldEditor((prev) => ({ ...prev, required: checked === true }))}
                    />
                    Campo obrigatório
                  </label>

                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => resetFieldEditor()}>
                      Cancelar
                    </Button>
                    <Button type="button" onClick={handleSaveField} className="bg-purple-600 text-white hover:bg-purple-700">
                      <Save className="w-4 h-4" />
                      {editingFieldKey ? 'Atualizar campo' : 'Adicionar campo'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4 mt-0">
            <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/50 p-4 md:p-6 shadow-sm">
              <div
                className="rounded-2xl p-5 text-white bg-purple-600"
              >
                <p className="text-xs uppercase tracking-[0.25em] opacity-70">Pré-visualização</p>
                <h3 className="mt-2 text-2xl font-semibold">{layoutState.title}</h3>
              </div>

              <div className="mt-5 space-y-4">
                {previewSections.map((section, index) => (
                  <div key={section.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-background p-4 md:p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white bg-purple-600">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-foreground">{section.title}</h4>
                        {section.description ? <p className="text-sm text-muted-foreground">{section.description}</p> : null}
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {section.fieldDetails.map((field) => (
                        <div key={field.key} className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">{field.title}{field.required ? ' *' : ''}</p>
                              <p className="text-xs text-muted-foreground">{field.kind}{field.placeholder ? ` · ${field.placeholder}` : ''}</p>
                            </div>
                            <div className="h-3 w-20 rounded-full bg-gray-200 dark:bg-gray-800" />
                          </div>
                        </div>
                      ))}
                      {section.fieldDetails.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Ainda não existem campos nesta página.</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-0">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Formulário</label>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex: CRECHE"
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Este nome é único e identifica o tipo de candidatura.</p>
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
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={resetEditor}>Cancelar</Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving} className="bg-purple-600 text-white hover:bg-purple-700">
            {saving ? 'A guardar...' : isEditing ? 'Guardar Alterações' : 'Criar Formulário'}
          </Button>
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
