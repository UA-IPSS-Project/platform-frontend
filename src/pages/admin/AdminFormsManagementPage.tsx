import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlignLeft,
  Check,
  ArrowLeft,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Eye,
  GripVertical,
  Hash,
  LayoutGrid,
  List,
  Mail,
  MoreVertical,
  Paperclip,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Save,
  ScrollText,
  Send,
  Table2,
  TableProperties,
  Trash2,
  Type,
  Wand2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { GlassCard } from '../../components/ui/glass-card';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
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
  type FieldAudience,
  type FormDraftResponse,
  type FormPage,
  type FormResponse,
  type FormStatus,
} from '../../services/api';
import { FORM_FIELD_REGISTRY } from '../../components/form-fields';
import { useAutoSave, type SaveStatus } from '../../hooks/useAutoSave';

// ─── Types ────────────────────────────────────────────────────────────────────

type ComponentType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'number'
  | 'date'
  | 'radio'
  | 'multiselect'
  | 'select'
  | 'table'
  | 'grid_table'
  | 'ledger_table'
  | 'structured_table'
  | 'file';

interface EditorField {
  key: string;
  componentType: ComponentType;
  label: string;
  placeholder: string;
  required: boolean;
  options: string[];
  extraConfig: Record<string, unknown>;
}

interface EditorPage {
  id?: string;
  title: string;
  audience: FieldAudience;
  fields: EditorField[];
}

type Selection =
  | { type: 'field'; pageIndex: number; fieldKey: string }
  | { type: 'page'; pageIndex: number }
  | null;

type ViewMode = 'list' | 'editor' | 'preview';

interface ComponentDef {
  type: ComponentType;
  label: string;
  Icon: LucideIcon;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<FormStatus, { label: string; className: string; bannerClassName: string; bannerText: string }> = {
  RASCUNHO: {
    label: 'Rascunho',
    className: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
    bannerClassName: 'bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300',
    bannerText: 'Este formulário está em rascunho e não está disponível para candidaturas.',
  },
  ATIVO: {
    label: 'Ativo',
    className: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
    bannerClassName: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
    bannerText: 'Este formulário está ativo e disponível para candidaturas. As alterações são guardadas como rascunho até serem publicadas.',
  },
  INATIVO: {
    label: 'Inativo',
    className: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
    bannerClassName: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
    bannerText: 'Este formulário está inativo e não recebe candidaturas.',
  },
};

// ─── Constants ────────────────────────────────────────────────────────────────

const COMPONENT_CATEGORIES: { label: string; items: ComponentDef[] }[] = [
  {
    label: 'TEXTO',
    items: [
      { type: 'text', label: 'Texto curto', Icon: Type },
      { type: 'textarea', label: 'Texto longo', Icon: AlignLeft },
      { type: 'email', label: 'E-mail', Icon: Mail },
      { type: 'number', label: 'Número', Icon: Hash },
    ],
  },
  {
    label: 'DATA / HORA',
    items: [{ type: 'date', label: 'Data', Icon: CalendarDays }],
  },
  {
    label: 'SELEÇÃO',
    items: [
      { type: 'radio', label: 'Escolha única', Icon: CircleDot },
      { type: 'multiselect', label: 'Caixas de seleção', Icon: CheckSquare },
      { type: 'select', label: 'Lista dropdown', Icon: List },
    ],
  },
  {
    label: 'TABELAS',
    items: [
      { type: 'table' as ComponentType, label: 'Tabela simples', Icon: Table2 },
      { type: 'grid_table' as ComponentType, label: 'Agregado Familiar', Icon: LayoutGrid },
      { type: 'ledger_table' as ComponentType, label: 'Rendimento Mensal', Icon: ScrollText },
      { type: 'structured_table' as ComponentType, label: 'Caracterização Individual', Icon: TableProperties },
    ],
  },
  {
    label: 'AVANÇADO',
    items: [
      { type: 'file' as ComponentType, label: 'Ficheiro', Icon: Paperclip },
    ],
  },
];

const COMPONENT_LABELS: Record<ComponentType, string> = {
  text: 'Texto curto',
  textarea: 'Texto longo',
  email: 'E-mail',
  number: 'Número',
  date: 'Data',
  radio: 'Escolha única',
  multiselect: 'Caixas de seleção',
  select: 'Lista dropdown',
  table: 'Tabela simples',
  grid_table: 'Agregado Familiar',
  ledger_table: 'Rendimento Mensal',
  structured_table: 'Caracterização Individual',
  file: 'Ficheiro',
};

const COMPONENT_ICONS: Record<ComponentType, LucideIcon> = {
  text: Type,
  textarea: AlignLeft,
  email: Mail,
  number: Hash,
  date: CalendarDays,
  radio: CircleDot,
  multiselect: CheckSquare,
  select: List,
  table: Table2,
  grid_table: LayoutGrid,
  ledger_table: ScrollText,
  structured_table: TableProperties,
  file: Paperclip,
};

// ─── Utils ────────────────────────────────────────────────────────────────────

const isSelectLike = (type: ComponentType) =>
  type === 'radio' || type === 'multiselect' || type === 'select';

const isTableLike = (type: ComponentType) =>
  type === 'table' || type === 'grid_table' || type === 'ledger_table' || type === 'structured_table';

const hasPlaceholder = (type: ComponentType) =>
  !isTableLike(type) && type !== 'file' && !isSelectLike(type);

const generateKey = (label: string, existing: Set<string>): string => {
  const base =
    [...label.toLowerCase().normalize('NFD')]
      .filter(ch => { const c = ch.codePointAt(0)!; return c < 0x0300 || c > 0x036f; })
      .join('')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '') || 'campo';
  let key = base;
  let n = 1;
  while (existing.has(key)) key = `${base}_${n++}`;
  return key;
};

const createDefaultPage = (index: number): EditorPage => ({
  title: `Página ${index + 1}`,
  audience: 'PUBLIC',
  fields: [],
});

const toEditorPages = (pages: FormPage[]): EditorPage[] =>
  pages.map(page => ({
    id: page.id,
    title: page.title,
    audience: page.audience ?? 'PUBLIC',
    fields: (page.fields ?? []).map(field => {
      const { label, placeholder, required, options, ...extraConfig } =
        (field.config ?? {}) as Record<string, unknown>;
      return {
        key: field.key,
        componentType: (field.componentType as ComponentType) ?? 'text',
        label: String(label ?? field.key),
        placeholder: String(placeholder ?? ''),
        required: Boolean(required),
        options: Array.isArray(options) ? (options as string[]) : [],
        extraConfig,
      };
    }),
  }));

const toApiPages = (pages: EditorPage[]): FormPage[] =>
  pages.map((page, pi) => ({
    id: page.id,
    title: page.title,
    description: undefined,
    order: pi,
    audience: page.audience,
    fields: page.fields.map((field, fi) => ({
      key: field.key,
      componentType: field.componentType,
      order: fi,
      audience: page.audience,
      config: {
        label: field.label,
        placeholder: field.placeholder,
        required: field.required,
        options: field.options,
        ...field.extraConfig,
      },
    })),
  }));

// ─── Component ────────────────────────────────────────────────────────────────

interface AdminFormsManagementPageProps {
  candidaturaType?: string;
  onFormsChanged?: () => Promise<void> | void;
}

export function AdminFormsManagementPage({ onFormsChanged }: AdminFormsManagementPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [forms, setForms] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formStatus, setFormStatus] = useState<FormStatus>('RASCUNHO');
  const [pages, setPages] = useState<EditorPage[]>([createDefaultPage(0)]);
  const [selection, setSelection] = useState<Selection>(null);
  const [expandedPages, setExpandedPages] = useState<Set<number>>(new Set([0]));
  const [formToDelete, setFormToDelete] = useState<FormResponse | null>(null);
  const [drag, setDrag] = useState<
    | { kind: 'palette'; componentType: ComponentType }
    | { kind: 'field'; pageIndex: number; fieldKey: string }
    | null
  >(null);
  const [dropTarget, setDropTarget] = useState<{ pageIndex: number; insertAt: number } | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<SaveStatus>('idle');
  const [draftBanner, setDraftBanner] = useState<FormDraftResponse | null>(null);
  const [originalForm, setOriginalForm] = useState<FormResponse | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deleteFromEditorOpen, setDeleteFromEditorOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const initializedRef = useRef(false);

  // Derived
  const sortedForms = [...forms].sort((a, b) => a.name.localeCompare(b.name, 'pt-PT'));

  const selectedPageData =
    selection?.type === 'page' ? (pages[selection.pageIndex] ?? null) : null;

  const selectedFieldData =
    selection?.type === 'field'
      ? (pages[selection.pageIndex]?.fields.find(f => f.key === selection.fieldKey) ?? null)
      : null;

  const getTargetPageIndex = (): number => {
    if (selection?.type === 'field') return selection.pageIndex;
    if (selection?.type === 'page') return selection.pageIndex;
    if (expandedPages.size > 0) return [...expandedPages][0];
    return 0;
  };

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await candidaturasApi.listarFormularios();
      setForms(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Não foi possível carregar os formulários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadForms(); }, []);

  // ── Editor lifecycle ──────────────────────────────────────────────────────

  const openEditor = async (form?: FormResponse) => {
    initializedRef.current = false;
    setDraftBanner(null);
    setAutoSaveStatus('idle');
    setOriginalForm(form ?? null);
    setPublishDialogOpen(false);
    setDeactivateDialogOpen(false);
    setDeleteFromEditorOpen(false);
    if (form) {
      setEditingFormId(form.id);
      setFormName(form.name);
      setFormStatus(form.status ?? 'RASCUNHO');
      const editorPages =
        form.pages && form.pages.length > 0
          ? toEditorPages(form.pages)
          : [createDefaultPage(0)];
      setPages(editorPages);
      if (form.status === 'ATIVO') {
        try {
          const draft = await candidaturasApi.obterRascunhoFormulario(form.id);
          if (draft && draft.id) setDraftBanner(draft);
        } catch { /* ignore */ }
      }
    } else {
      setEditingFormId(null);
      setFormName('');
      setFormStatus('RASCUNHO');
      setPages([createDefaultPage(0)]);
    }
    setSelection(null);
    setExpandedPages(new Set([0]));
    setViewMode('editor');
  };

  const closeEditor = () => {
    setEditingFormId(null);
    setDraftBanner(null);
    setOriginalForm(null);
    setAutoSaveStatus('idle');
    setPublishDialogOpen(false);
    setDeactivateDialogOpen(false);
    setDeleteFromEditorOpen(false);
    setViewMode('list');
    setSelection(null);
  };

  // ── Auto-save ─────────────────────────────────────────────────────────────

  const performAutoSave = useCallback(async () => {
    if (!editingFormId) return;
    const name = formName.trim() || 'SEM NOME';
    const apiPages = toApiPages(pages);
    if (formStatus === 'ATIVO') {
      await candidaturasApi.guardarRascunhoFormulario(editingFormId, { name, pages: apiPages });
    } else {
      await candidaturasApi.atualizarFormulario(editingFormId, { name, status: formStatus, pages: apiPages });
    }
  }, [editingFormId, formName, formStatus, pages]);

  const { touch } = useAutoSave({
    enabled: editingFormId !== null && viewMode === 'editor',
    onSave: performAutoSave,
    onStatusChange: setAutoSaveStatus,
  });

  // Fire auto-save whenever editor content changes (skip first render after openEditor)
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    touch();
  }, [pages, formName, formStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDraftContent = () => {
    if (!draftBanner) return;
    setFormName(draftBanner.name ?? '');
    if (draftBanner.pages && draftBanner.pages.length > 0) {
      setPages(toEditorPages(draftBanner.pages));
    }
    setDraftBanner(null);
  };

  const discardDraft = async () => {
    if (!editingFormId) return;
    try {
      await candidaturasApi.apagarRascunhoFormulario(editingFormId);
    } catch { /* ignore */ }
    setDraftBanner(null);
  };

  // ── Page actions ──────────────────────────────────────────────────────────

  const addPage = () => {
    setPages(prev => {
      const next = [...prev, createDefaultPage(prev.length)];
      setExpandedPages(prevExp => new Set([...prevExp, next.length - 1]));
      return next;
    });
  };

  const removePage = (pageIndex: number) => {
    if (pages.length === 1) return;
    setPages(prev => prev.filter((_, i) => i !== pageIndex));
    setExpandedPages(prev => {
      const next = new Set<number>();
      prev.forEach(i => { if (i !== pageIndex) next.add(i > pageIndex ? i - 1 : i); });
      return next;
    });
    if (selection?.pageIndex === pageIndex) setSelection(null);
  };

  const togglePageExpanded = (pageIndex: number) => {
    setExpandedPages(prev => {
      const next = new Set(prev);
      if (next.has(pageIndex)) next.delete(pageIndex);
      else next.add(pageIndex);
      return next;
    });
  };

  const updatePage = (pageIndex: number, updates: Partial<EditorPage>) => {
    setPages(prev => prev.map((p, i) => (i === pageIndex ? { ...p, ...updates } : p)));
  };

  // ── Field actions ─────────────────────────────────────────────────────────

  const addComponent = (componentType: ComponentType) => {
    const targetPageIndex = getTargetPageIndex();
    const existingKeys = new Set(pages.flatMap(p => p.fields.map(f => f.key)));
    const label = COMPONENT_LABELS[componentType];
    const key = generateKey(label, existingKeys);
    const newField: EditorField = {
      key,
      componentType,
      label,
      placeholder: '',
      required: false,
      options: [],
      extraConfig: FORM_FIELD_REGISTRY[componentType]?.defaultConfig ?? {},
    };
    setPages(prev =>
      prev.map((p, i) =>
        i !== targetPageIndex ? p : { ...p, fields: [...p.fields, newField] },
      ),
    );
    setExpandedPages(prev => new Set([...prev, targetPageIndex]));
    setSelection({ type: 'field', pageIndex: targetPageIndex, fieldKey: key });
  };

  const addComponentAt = (componentType: ComponentType, targetPageIndex: number, insertAt: number) => {
    const existingKeys = new Set(pages.flatMap(p => p.fields.map(f => f.key)));
    const label = COMPONENT_LABELS[componentType];
    const key = generateKey(label, existingKeys);
    const newField: EditorField = {
      key,
      componentType,
      label,
      placeholder: '',
      required: false,
      options: [],
      extraConfig: FORM_FIELD_REGISTRY[componentType]?.defaultConfig ?? {},
    };
    setPages(prev =>
      prev.map((p, i) => {
        if (i !== targetPageIndex) return p;
        const next = [...p.fields];
        next.splice(insertAt, 0, newField);
        return { ...p, fields: next };
      }),
    );
    setExpandedPages(prev => new Set([...prev, targetPageIndex]));
    setSelection({ type: 'field', pageIndex: targetPageIndex, fieldKey: key });
  };

  const moveFieldTo = (fromPageIndex: number, fieldKey: string, toPageIndex: number, insertAt: number) => {
    setPages(prev => {
      const next = prev.map(p => ({ ...p, fields: [...p.fields] }));
      const fromFields = next[fromPageIndex].fields;
      const fieldIdx = fromFields.findIndex(f => f.key === fieldKey);
      if (fieldIdx === -1) return prev;
      const [moved] = fromFields.splice(fieldIdx, 1);
      const toFields = next[toPageIndex].fields;
      let at = insertAt;
      if (fromPageIndex === toPageIndex && fieldIdx < insertAt) at--;
      at = Math.max(0, Math.min(at, toFields.length));
      toFields.splice(at, 0, moved);
      return next;
    });
    setExpandedPages(prev => new Set([...prev, toPageIndex]));
    setSelection({ type: 'field', pageIndex: toPageIndex, fieldKey });
  };

  const applyDrop = (targetPageIndex: number, insertAt: number) => {
    if (!drag) return;
    if (drag.kind === 'palette') {
      addComponentAt(drag.componentType, targetPageIndex, insertAt);
    } else {
      moveFieldTo(drag.pageIndex, drag.fieldKey, targetPageIndex, insertAt);
    }
    setDrag(null);
    setDropTarget(null);
  };

  const removeField = (pageIndex: number, fieldKey: string) => {
    setPages(prev =>
      prev.map((p, i) =>
        i !== pageIndex ? p : { ...p, fields: p.fields.filter(f => f.key !== fieldKey) },
      ),
    );
    if (selection?.type === 'field' && selection.fieldKey === fieldKey) {
      setSelection(null);
    }
  };

  const updateField = (updates: Partial<EditorField>) => {
    if (selection?.type !== 'field') return;
    const { pageIndex, fieldKey } = selection;
    setPages(prev =>
      prev.map((p, pi) =>
        pi !== pageIndex
          ? p
          : { ...p, fields: p.fields.map(f => (f.key === fieldKey ? { ...f, ...updates } : f)) },
      ),
    );
  };

  const updateFieldConfig = (newConfig: Record<string, unknown>) => {
    if (selection?.type !== 'field') return;
    const { pageIndex, fieldKey } = selection;
    setPages(prev =>
      prev.map((p, pi) =>
        pi !== pageIndex
          ? p
          : {
              ...p,
              fields: p.fields.map(f =>
                f.key === fieldKey ? { ...f, extraConfig: newConfig } : f,
              ),
            },
      ),
    );
  };

  // ── Diff helper ───────────────────────────────────────────────────────────

  const computeDiff = () => {
    type OrigField = { key: string; label: string; page: string; type: string; required: boolean; placeholder: string; options: string[]; extraConfig: Record<string, unknown> };
    type CurrField = { key: string; label: string; page: string; type: string; required: boolean; placeholder: string; options: string[]; extraConfig: Record<string, unknown> };
    type FieldChange = { prop: string; from: string; to: string };
    type ModifiedField = { key: string; label: string; page: string; type: string; changes: FieldChange[] };

    const origFields: OrigField[] = (originalForm?.pages ?? []).flatMap(p =>
      (p.fields ?? []).map(f => {
        const cfg = (f.config ?? {}) as Record<string, unknown>;
        return {
          key: f.key,
          label: String(cfg.label ?? f.key),
          page: p.title,
          type: f.componentType,
          required: Boolean(cfg.required),
          placeholder: String(cfg.placeholder ?? ''),
          options: Array.isArray(cfg.options) ? (cfg.options as string[]) : [],
          extraConfig: Object.fromEntries(Object.entries(cfg).filter(([k]) => !['label','placeholder','required','options'].includes(k))),
        };
      })
    );
    const currFields: CurrField[] = pages.flatMap(p =>
      p.fields.map(f => ({
        key: f.key,
        label: f.label,
        page: p.title,
        type: f.componentType,
        required: f.required,
        placeholder: f.placeholder,
        options: f.options,
        extraConfig: f.extraConfig,
      }))
    );

    const origByKey = new Map(origFields.map(f => [f.key, f]));
    const currByKey = new Map(currFields.map(f => [f.key, f]));

    const added = currFields.filter(f => !origByKey.has(f.key));
    const removed = origFields.filter(f => !currByKey.has(f.key));

    const modified: ModifiedField[] = [];
    for (const curr of currFields) {
      const orig = origByKey.get(curr.key);
      if (!orig) continue;
      const changes: FieldChange[] = [];
      if (orig.label !== curr.label)
        changes.push({ prop: 'Nome', from: orig.label, to: curr.label });
      if (orig.type !== curr.type)
        changes.push({ prop: 'Tipo', from: COMPONENT_LABELS[orig.type as ComponentType] ?? orig.type, to: COMPONENT_LABELS[curr.type as ComponentType] ?? curr.type });
      if (orig.required !== curr.required)
        changes.push({ prop: 'Obrigatório', from: orig.required ? 'Sim' : 'Não', to: curr.required ? 'Sim' : 'Não' });
      if (orig.placeholder !== curr.placeholder && (orig.placeholder || curr.placeholder))
        changes.push({ prop: 'Placeholder', from: orig.placeholder || '(vazio)', to: curr.placeholder || '(vazio)' });
      if (JSON.stringify(orig.options) !== JSON.stringify(curr.options))
        changes.push({ prop: 'Opções', from: orig.options.join(', ') || '(nenhuma)', to: curr.options.join(', ') || '(nenhuma)' });
      if (JSON.stringify(orig.extraConfig) !== JSON.stringify(curr.extraConfig))
        changes.push({ prop: 'Configuração', from: '', to: '' });
      if (changes.length > 0)
        modified.push({ key: curr.key, label: curr.label, page: curr.page, type: curr.type, changes });
    }

    const nameChanged = originalForm != null && originalForm.name !== formName.trim();
    const hasChanges = added.length > 0 || removed.length > 0 || modified.length > 0 || nameChanged;
    return { added, removed, modified, nameChanged, hasChanges };
  };

  // ── Publish / Deactivate ──────────────────────────────────────────────────

  const handlePublish = async () => {
    const normalizedName = formName.trim();
    if (!normalizedName) { toast.error('O nome do formulário é obrigatório.'); return; }
    try {
      setPublishing(true);
      const apiPages = toApiPages(pages);
      if (editingFormId) {
        await candidaturasApi.atualizarFormulario(editingFormId, { name: normalizedName, status: 'ATIVO', pages: apiPages });
        if (formStatus === 'ATIVO') {
          try { await candidaturasApi.apagarRascunhoFormulario(editingFormId); } catch { /* ignore */ }
        }
        toast.success(formStatus === 'ATIVO' ? 'Alterações publicadas com sucesso.' : formStatus === 'INATIVO' ? 'Formulário reativado com sucesso.' : 'Formulário publicado com sucesso.');
      } else {
        await candidaturasApi.criarFormulario({ name: normalizedName, status: 'ATIVO', pages: apiPages });
        toast.success('Formulário publicado com sucesso.');
      }
      setPublishDialogOpen(false);
      closeEditor();
      await loadForms();
      await onFormsChanged?.();
    } catch (error: unknown) {
      toast.error((error as { message?: string })?.message ?? 'Não foi possível publicar o formulário.');
    } finally {
      setPublishing(false);
    }
  };

  const handleDeactivate = async () => {
    if (!editingFormId) return;
    try {
      await candidaturasApi.atualizarFormulario(editingFormId, { name: formName.trim(), status: 'INATIVO', pages: toApiPages(pages) });
      toast.success('Formulário desativado com sucesso.');
      setDeactivateDialogOpen(false);
      closeEditor();
      await loadForms();
      await onFormsChanged?.();
    } catch (error: unknown) {
      toast.error((error as { message?: string })?.message ?? 'Não foi possível desativar o formulário.');
    }
  };

  const handleDeleteFromEditor = async () => {
    if (!editingFormId) return;
    try {
      await candidaturasApi.apagarFormulario(editingFormId);
      toast.success('Formulário eliminado com sucesso.');
      setDeleteFromEditorOpen(false);
      closeEditor();
      await loadForms();
      await onFormsChanged?.();
    } catch (error: unknown) {
      toast.error((error as { message?: string })?.message ?? 'Não foi possível eliminar o formulário.');
    }
  };

  // ── Save / Delete ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    const normalizedName = formName.trim();
    if (!normalizedName) {
      toast.error('O nome do formulário é obrigatório.');
      return;
    }
    try {
      setSaving(true);
      const apiPages = toApiPages(pages);
      if (editingFormId && formStatus === 'ATIVO') {
        await candidaturasApi.guardarRascunhoFormulario(editingFormId, { name: normalizedName, pages: apiPages });
        toast.success('Rascunho guardado com sucesso.');
        setAutoSaveStatus('saved');
      } else if (editingFormId) {
        await candidaturasApi.atualizarFormulario(editingFormId, { name: normalizedName, status: formStatus, pages: apiPages });
        toast.success('Formulário atualizado com sucesso.');
        closeEditor();
        await loadForms();
        await onFormsChanged?.();
      } else {
        await candidaturasApi.criarFormulario({ name: normalizedName, status: formStatus, pages: apiPages });
        toast.success('Formulário criado com sucesso.');
        closeEditor();
        await loadForms();
        await onFormsChanged?.();
      }
    } catch (error: unknown) {
      toast.error((error as { message?: string })?.message ?? 'Não foi possível guardar o formulário.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!formToDelete) return;
    try {
      await candidaturasApi.apagarFormulario(formToDelete.id);
      toast.success('Formulário removido com sucesso.');
      setFormToDelete(null);
      await loadForms();
      await onFormsChanged?.();
    } catch (error: unknown) {
      toast.error((error as { message?: string })?.message ?? 'Não foi possível remover o formulário.');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  if (viewMode === 'list') {
    return (
      <>
        <GlassCard className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Formulários</h2>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadForms()}
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void openEditor()}
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
                Novo formulário
              </Button>
            </div>
          </div>

          {sortedForms.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              Ainda não existem formulários.
            </p>
          ) : (
            <div className="space-y-2">
              {sortedForms.map(form => (
                <div
                  key={form.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 dark:text-white">{form.name}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CONFIG[form.status].className}`}>
                        {STATUS_CONFIG[form.status].label}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400 dark:text-gray-500">
                      {form.criadoEm && (
                        <span>
                          Criado{form.criadoPorNome ? ` por ${form.criadoPorNome}` : ''}{' '}
                          em {new Date(form.criadoEm).toLocaleString('pt-PT')}
                        </span>
                      )}
                      {form.atualizadoEm && (
                        <span>
                          Atualizado{form.atualizadoPorNome ? ` por ${form.atualizadoPorNome}` : ''}{' '}
                          em {new Date(form.atualizadoEm).toLocaleString('pt-PT')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" onClick={() => void openEditor(form)}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setFormToDelete(form)}
                      aria-label={`Remover ${form.name}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <AlertDialog
          open={Boolean(formToDelete)}
          onOpenChange={open => !open && setFormToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover formulário</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação vai remover o formulário <strong>{formToDelete?.name}</strong>. Pretende
                continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => void handleDelete()}
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PREVIEW VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  if (viewMode === 'preview') {
    const previewInputCls =
      'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400 placeholder:text-gray-400 dark:placeholder:text-gray-500 cursor-default outline-none pointer-events-none';

    return (
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button type="button" variant="ghost" size="sm" onClick={() => setViewMode('editor')}>
            <ArrowLeft className="w-4 h-4" />
            Editor
          </Button>
          <h2 className="flex-1 font-semibold text-gray-900 dark:text-white truncate">
            {formName || 'Formulário sem nome'}
          </h2>
          <span className="text-xs font-semibold tracking-widest text-purple-600 dark:text-purple-400 uppercase bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-full">
            Pré-visualização
          </span>
        </div>

        {/* Form content */}
        <GlassCard className="p-6 sm:p-8 max-w-2xl w-full mx-auto">
          <div className="space-y-10">
            {pages.map((page, pi) => (
              <div key={pi}>
                <div className="flex items-center gap-2 mb-5">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {pi + 1}. {page.title}
                  </h3>
                  {page.audience === 'INTERNAL' && (
                    <span className="text-[10px] rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 shrink-0">
                      Interna
                    </span>
                  )}
                </div>

                {page.fields.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Sem campos.</p>
                ) : (
                  <div className="space-y-5">
                    {page.fields.map(field => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-0.5">*</span>}
                        </label>

                        {(field.componentType === 'text' ||
                          field.componentType === 'email' ||
                          field.componentType === 'number') && (
                          <input
                            type={field.componentType}
                            readOnly
                            placeholder={field.placeholder || undefined}
                            className={previewInputCls}
                          />
                        )}

                        {field.componentType === 'textarea' && (
                          <textarea
                            readOnly
                            placeholder={field.placeholder || undefined}
                            rows={3}
                            className={`${previewInputCls} resize-none`}
                          />
                        )}

                        {field.componentType === 'date' && (
                          <input
                            type="date"
                            readOnly
                            className={`${previewInputCls} w-48`}
                          />
                        )}

                        {(field.componentType === 'radio' ||
                          field.componentType === 'multiselect') && (
                          <div className="space-y-2 pointer-events-none">
                            {field.options.length === 0 ? (
                              <p className="text-xs text-gray-400 italic">Sem opções definidas.</p>
                            ) : (
                              field.options.map(opt => (
                                <label
                                  key={opt}
                                  className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300"
                                >
                                  <input
                                    type={field.componentType === 'radio' ? 'radio' : 'checkbox'}
                                    readOnly
                                    className="shrink-0 w-4 h-4 accent-purple-600"
                                  />
                                  {opt}
                                </label>
                              ))
                            )}
                          </div>
                        )}

                        {field.componentType === 'select' && (
                          <div className={`${previewInputCls} flex items-center justify-between`}>
                            <span className="text-gray-400">
                              {field.options.length > 0 ? field.options[0] : 'Selecionar…'}
                            </span>
                            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        )}

                        {field.componentType === 'file' && (
                          <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 pointer-events-none">
                            <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-400">Escolher ficheiro…</span>
                          </div>
                        )}

                        {isTableLike(field.componentType) && (() => {
                          const descriptor = FORM_FIELD_REGISTRY[field.componentType];
                          if (!descriptor) return null;
                          const { Field } = descriptor;
                          return <Field config={field.extraConfig} />;
                        })()}
                      </div>
                    ))}
                  </div>
                )}

                {pi < pages.length - 1 && (
                  <hr className="mt-8 border-gray-200 dark:border-gray-700" />
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EDITOR VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button type="button" variant="ghost" size="sm" onClick={closeEditor}>
          <ArrowLeft className="w-4 h-4" />
          Formulários
        </Button>

        <div className="flex flex-1 items-center gap-3 min-w-0">
          <Input
            value={formName}
            onChange={e => setFormName(e.target.value)}
            placeholder="Nome do formulário (ex: CRECHE)"
            className="max-w-xs"
          />
          {editingFormId && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_CONFIG[formStatus].className}`}>
              {STATUS_CONFIG[formStatus].label}
            </span>
          )}
        </div>

        {autoSaveStatus === 'saving' && (
          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 shrink-0">
            <RefreshCw className="w-3 h-3 animate-spin" />
            A guardar…
          </span>
        )}
        {autoSaveStatus === 'saved' && (
          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 shrink-0">
            <Check className="w-3 h-3" />
            Guardado
          </span>
        )}
        {autoSaveStatus === 'error' && (
          <span className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400 shrink-0">
            <AlertCircle className="w-3 h-3" />
            Erro ao guardar
          </span>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={() => setViewMode('preview')}
        >
          <Eye className="w-4 h-4" />
          Pré-visualizar
        </Button>

        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          variant="outline"
        >
          <Save className="w-4 h-4" />
          {saving ? 'A guardar…' : editingFormId ? 'Guardar' : 'Criar'}
        </Button>

        {/* Publish button — label varies by state */}
        {(() => {
          if (formStatus === 'ATIVO') {
            return (
              <Button
                type="button"
                onClick={() => setPublishDialogOpen(true)}
                disabled={publishing}
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                <Send className="w-4 h-4" />
                {publishing ? 'A publicar…' : 'Publicar alterações'}
              </Button>
            );
          }
          if (formStatus === 'INATIVO') {
            return (
              <Button
                type="button"
                onClick={() => setPublishDialogOpen(true)}
                disabled={publishing}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <Power className="w-4 h-4" />
                {publishing ? 'A reativar…' : 'Reativar'}
              </Button>
            );
          }
          // RASCUNHO
          return (
            <Button
              type="button"
              onClick={() => setPublishDialogOpen(true)}
              disabled={publishing}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              <Send className="w-4 h-4" />
              {publishing ? 'A publicar…' : editingFormId ? 'Publicar' : 'Criar e publicar'}
            </Button>
          );
        })()}

        {/* Actions dropdown */}
        {editingFormId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="px-2">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {formStatus === 'ATIVO' && (
                <DropdownMenuItem onClick={() => setDeactivateDialogOpen(true)}>
                  <PowerOff className="w-4 h-4" />
                  Desativar formulário
                </DropdownMenuItem>
              )}
              {formStatus === 'ATIVO' && <DropdownMenuSeparator />}
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteFromEditorOpen(true)}
              >
                <Trash2 className="w-4 h-4" />
                Eliminar formulário
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* ── Status banner ──────────────────────────────────────────────────── */}
      {editingFormId && (
        <div className={`rounded-lg border px-4 py-2.5 flex items-center gap-2 text-sm ${STATUS_CONFIG[formStatus].bannerClassName}`}>
          {formStatus === 'ATIVO' && <Power className="w-4 h-4 shrink-0" />}
          {formStatus === 'INATIVO' && <PowerOff className="w-4 h-4 shrink-0" />}
          {formStatus === 'RASCUNHO' && <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{STATUS_CONFIG[formStatus].bannerText}</span>
        </div>
      )}

      {/* ── Draft banner ───────────────────────────────────────────────────── */}
      {draftBanner && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 flex items-center gap-3 flex-wrap">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="flex-1 text-sm text-amber-800 dark:text-amber-200 min-w-0">
            Existe um rascunho não publicado guardado em{' '}
            {draftBanner.atualizadoEm
              ? new Date(draftBanner.atualizadoEm).toLocaleString('pt-PT')
              : '—'}
            {draftBanner.atualizadoPorNome ? ` por ${draftBanner.atualizadoPorNome}` : ''}
            . Pretende carregar o rascunho?
          </span>
          <Button type="button" size="sm" variant="outline" onClick={loadDraftContent}>
            Carregar
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => void discardDraft()}>
            Descartar
          </Button>
        </div>
      )}

      {/* ── 3-panel builder ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[240px_1fr_280px] min-h-[600px] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-950">

        {/* ── LEFT: Component palette ───────────────────────────────────────── */}
        <aside className="border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <p className="text-xs font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase">
              Componentes
            </p>
          </div>

          <div className="flex-1 p-3 space-y-5">
            {COMPONENT_CATEGORIES.map(category => (
              <div key={category.label}>
                <p className="text-[10px] font-medium tracking-widest text-gray-400 uppercase mb-1 px-1">
                  {category.label}
                </p>
                <div className="space-y-0.5">
                  {category.items.map(item => {
                    const Icon = item.Icon;
                    const isDraggingThis = drag?.kind === 'palette' && drag.componentType === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        draggable
                        onClick={() => addComponent(item.type)}
                        onDragStart={e => {
                          e.dataTransfer.effectAllowed = 'copy';
                          const ghost = document.createElement('div');
                          ghost.style.cssText = 'position:fixed;top:-9999px;background:#7c3aed;color:#fff;font-size:12px;padding:4px 10px;border-radius:6px;white-space:nowrap;';
                          ghost.textContent = item.label;
                          document.body.appendChild(ghost);
                          e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, 14);
                          setTimeout(() => document.body.removeChild(ghost), 0);
                          setDrag({ kind: 'palette', componentType: item.type });
                        }}
                        onDragEnd={() => { setDrag(null); setDropTarget(null); }}
                        className={`flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 group transition-colors text-left ${isDraggingThis ? 'opacity-50' : ''}`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── MIDDLE: Pages canvas ──────────────────────────────────────────── */}
        <main
          className="overflow-y-auto p-4 space-y-3 bg-gray-50/60 dark:bg-gray-900/40"
          onDragLeave={e => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null);
          }}
        >
          {pages.map((page, pageIndex) => {
            const isExpanded = expandedPages.has(pageIndex);
            const isPageSelected =
              selection?.type === 'page' && selection.pageIndex === pageIndex;

            return (
              <div
                key={pageIndex}
                className={`rounded-xl border bg-white dark:bg-gray-950 overflow-hidden transition-shadow ${
                  isPageSelected
                    ? 'border-purple-400 dark:border-purple-600 shadow-sm'
                    : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                {/* Page header */}
                <div
                  className="flex items-center gap-2 px-4 py-3"
                  onDragOver={drag ? (e => { e.preventDefault(); setDropTarget({ pageIndex, insertAt: page.fields.length }); }) : undefined}
                  onDrop={drag ? (e => {
                    e.preventDefault();
                    if (!isExpanded) togglePageExpanded(pageIndex);
                    applyDrop(pageIndex, page.fields.length);
                  }) : undefined}
                >
                  <button
                    type="button"
                    onClick={() => togglePageExpanded(pageIndex)}
                    className="shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    aria-label={isExpanded ? 'Colapsar página' : 'Expandir página'}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelection({ type: 'page', pageIndex });
                      if (!isExpanded) togglePageExpanded(pageIndex);
                    }}
                    className="flex-1 text-left flex items-center gap-2 min-w-0"
                  >
                    <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {pageIndex + 1} — {page.title}
                    </span>
                    {page.audience === 'INTERNAL' && (
                      <span className="text-[10px] rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 shrink-0">
                        Interna
                      </span>
                    )}
                  </button>

                  <span className="text-xs text-gray-400 shrink-0">
                    {page.fields.length} {page.fields.length === 1 ? 'campo' : 'campos'}
                  </span>

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removePage(pageIndex)}
                    disabled={pages.length === 1}
                    className="shrink-0 h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                    aria-label="Remover página"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Page body */}
                {isExpanded && (
                  <div
                    className="border-t border-gray-100 dark:border-gray-800 px-4 pt-3 pb-4 space-y-1"
                    onDragOver={drag ? (e => { e.preventDefault(); }) : undefined}
                    onDrop={drag ? (e => {
                      e.preventDefault();
                      if (dropTarget?.pageIndex === pageIndex) return; // handled by child
                      applyDrop(pageIndex, page.fields.length);
                    }) : undefined}
                  >
                    <p className="text-xs text-gray-400 mb-2">
                      Clique num campo para editar · Arraste da paleta ou reordene
                    </p>

                    {page.fields.length === 0 ? (
                      <div
                        className={`rounded-lg border-2 border-dashed py-5 flex items-center justify-center transition-colors ${
                          drag && dropTarget?.pageIndex === pageIndex
                            ? 'border-purple-400 bg-purple-50/30 dark:bg-purple-900/10'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                        onDragOver={drag ? (e => { e.preventDefault(); setDropTarget({ pageIndex, insertAt: 0 }); }) : undefined}
                        onDrop={drag ? (e => { e.preventDefault(); applyDrop(pageIndex, 0); }) : undefined}
                      >
                        <p className="text-sm text-gray-400 italic">
                          {drag ? 'Largar aqui para adicionar' : 'Sem campos nesta página.'}
                        </p>
                      </div>
                    ) : (
                      <>
                        {page.fields.map((field, fieldIndex) => {
                          const isFieldSelected =
                            selection?.type === 'field' &&
                            selection.pageIndex === pageIndex &&
                            selection.fieldKey === field.key;
                          const isDraggingThis =
                            drag?.kind === 'field' &&
                            drag.pageIndex === pageIndex &&
                            drag.fieldKey === field.key;
                          const showIndicator =
                            drag !== null &&
                            dropTarget?.pageIndex === pageIndex &&
                            dropTarget.insertAt === fieldIndex;
                          const Icon = COMPONENT_ICONS[field.componentType];

                          return (
                            <Fragment key={field.key}>
                              {showIndicator && (
                                <div className="h-0.5 bg-purple-400 dark:bg-purple-500 rounded-full mx-1" />
                              )}
                              <div
                                draggable
                                onDragStart={e => {
                                  e.dataTransfer.effectAllowed = 'move';
                                  const ghost = document.createElement('div');
                                  ghost.style.cssText = 'position:fixed;top:-9999px;background:#f3f4f6;border:1px solid #d1d5db;font-size:12px;padding:4px 10px;border-radius:6px;white-space:nowrap;color:#374151;';
                                  ghost.textContent = field.label;
                                  document.body.appendChild(ghost);
                                  e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, 14);
                                  setTimeout(() => document.body.removeChild(ghost), 0);
                                  setDrag({ kind: 'field', pageIndex, fieldKey: field.key });
                                }}
                                onDragEnd={() => { setDrag(null); setDropTarget(null); }}
                                onDragOver={drag ? (e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const insertAt = e.clientY < rect.top + rect.height / 2 ? fieldIndex : fieldIndex + 1;
                                  if (dropTarget?.pageIndex !== pageIndex || dropTarget.insertAt !== insertAt) {
                                    setDropTarget({ pageIndex, insertAt });
                                  }
                                }) : undefined}
                                onDrop={drag ? (e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const insertAt = e.clientY < rect.top + rect.height / 2 ? fieldIndex : fieldIndex + 1;
                                  applyDrop(pageIndex, insertAt);
                                }) : undefined}
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelection({ type: 'field', pageIndex, fieldKey: field.key })}
                                onKeyDown={e => e.key === 'Enter' && setSelection({ type: 'field', pageIndex, fieldKey: field.key })}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${isDraggingThis ? 'opacity-40' : ''} ${
                                  isFieldSelected
                                    ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/40 border border-transparent'
                                }`}
                              >
                                <GripVertical
                                  className="w-4 h-4 shrink-0 text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing"
                                  onMouseDown={e => e.stopPropagation()}
                                />
                                <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate">
                                  {field.label}
                                </span>
                                <span className="text-[10px] rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 shrink-0">
                                  {COMPONENT_LABELS[field.componentType]}
                                </span>
                                <button
                                  type="button"
                                  onClick={e => { e.stopPropagation(); removeField(pageIndex, field.key); }}
                                  className="shrink-0 text-gray-300 hover:text-red-500 transition-colors"
                                  aria-label={`Remover ${field.label}`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </Fragment>
                          );
                        })}

                        {/* Drop indicator at end of list */}
                        {drag !== null && dropTarget?.pageIndex === pageIndex && dropTarget.insertAt === page.fields.length && (
                          <div className="h-0.5 bg-purple-400 dark:bg-purple-500 rounded-full mx-1" />
                        )}

                        {/* Invisible append zone when dragging */}
                        {drag && (
                          <div
                            className="h-5"
                            onDragOver={e => { e.preventDefault(); setDropTarget({ pageIndex, insertAt: page.fields.length }); }}
                            onDrop={e => { e.preventDefault(); applyDrop(pageIndex, page.fields.length); }}
                          />
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPage}
            className="w-full"
          >
            <Plus className="w-4 h-4" />
            Adicionar página
          </Button>
        </main>

        {/* ── RIGHT: Properties panel ──────────────────────────────────────── */}
        <aside className="border-l border-gray-200 dark:border-gray-800 flex flex-col overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <p className="text-xs font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase">
              Propriedades
            </p>
          </div>

          {/* Empty state */}
          {selection === null && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <Wand2 className="w-8 h-8 mb-3 opacity-40" />
              <p className="text-sm">Selecione um campo para editar as suas propriedades</p>
            </div>
          )}

          {/* Page properties */}
          {selection?.type === 'page' && selectedPageData && (
            <div className="p-4 space-y-5">
              <div>
                <label className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">
                  Título da página
                </label>
                <Input
                  value={selectedPageData.title}
                  onChange={e => updatePage(selection.pageIndex, { title: e.target.value })}
                  className="mt-1.5"
                  placeholder="Ex: Dados pessoais"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">
                  Visibilidade
                </label>
                <Select
                  value={selectedPageData.audience}
                  onValueChange={v =>
                    updatePage(selection.pageIndex, { audience: v as FieldAudience })
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Pública</SelectItem>
                    <SelectItem value="INTERNAL">Apenas interna</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1.5 text-xs text-gray-400">
                  "Apenas interna" oculta esta página ao candidato.
                </p>
              </div>
            </div>
          )}

          {/* Field properties */}
          {selection?.type === 'field' && selectedFieldData && (
            <div className="p-4 space-y-5">
              {/* Field type badge */}
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = COMPONENT_ICONS[selectedFieldData.componentType];
                  return <Icon className="w-4 h-4 text-purple-500 shrink-0" />;
                })()}
                <span className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">
                  {COMPONENT_LABELS[selectedFieldData.componentType]}
                </span>
              </div>

              {/* Label */}
              <div>
                <label className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">
                  Título visível
                </label>
                <Input
                  value={selectedFieldData.label}
                  onChange={e => updateField({ label: e.target.value })}
                  className="mt-1.5"
                  placeholder="Ex: Nome completo"
                />
              </div>

              {/* Placeholder (not shown for table-like, file, select-like) */}
              {hasPlaceholder(selectedFieldData.componentType) && (
                <div>
                  <label className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">
                    Placeholder
                  </label>
                  <Input
                    value={selectedFieldData.placeholder}
                    onChange={e => updateField({ placeholder: e.target.value })}
                    className="mt-1.5"
                    placeholder="Ex: Introduza um valor"
                  />
                </div>
              )}

              {/* Options (select-like types) */}
              {isSelectLike(selectedFieldData.componentType) && (
                <div>
                  <label className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">
                    Opções
                  </label>
                  <Textarea
                    value={selectedFieldData.options.join('\n')}
                    onChange={e =>
                      updateField({
                        options: e.target.value
                          .split(/\r?\n|,/)
                          .map(o => o.trim())
                          .filter(Boolean),
                      })
                    }
                    className="mt-1.5 min-h-[120px] font-mono text-xs"
                    placeholder={'Opção 1\nOpção 2\nOpção 3'}
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Uma opção por linha ou separadas por vírgulas.
                  </p>
                </div>
              )}

              {/* Table-specific config panel (from registry) */}
              {isTableLike(selectedFieldData.componentType) && (() => {
                const descriptor = FORM_FIELD_REGISTRY[selectedFieldData.componentType];
                if (!descriptor) return null;
                const { ConfigPanel } = descriptor;
                return (
                  <ConfigPanel
                    config={selectedFieldData.extraConfig}
                    onChange={updateFieldConfig}
                  />
                );
              })()}

              {/* Required */}
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2.5">
                <Checkbox
                  id="field-required"
                  checked={selectedFieldData.required}
                  onCheckedChange={v => updateField({ required: v === true })}
                />
                <label
                  htmlFor="field-required"
                  className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none"
                >
                  Campo obrigatório
                </label>
              </div>

              <p className="text-[10px] text-gray-400 font-mono break-all">
                key: {selectedFieldData.key}
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* ── Publish dialog ─────────────────────────────────────────────────── */}
      {(() => {
        const diff = formStatus === 'ATIVO' ? computeDiff() : null;
        const title =
          formStatus === 'ATIVO' ? 'Publicar alterações' :
          formStatus === 'INATIVO' ? 'Reativar formulário' :
          'Publicar formulário';

        return (
          <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
            <AlertDialogContent className="max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    {formStatus === 'RASCUNHO' && (
                      <>
                        <p>Vai publicar o formulário <strong>{formName}</strong>. Ficará disponível para candidaturas.</p>
                        <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3 space-y-2 max-h-48 overflow-y-auto">
                          {pages.map((page, pi) => (
                            <div key={pi}>
                              <p className="font-medium text-gray-800 dark:text-gray-200 text-xs">{page.title} ({page.fields.length} {page.fields.length === 1 ? 'campo' : 'campos'})</p>
                              {page.fields.map(f => (
                                <p key={f.key} className="text-xs text-gray-500 dark:text-gray-400 pl-3">· {f.label} <span className="opacity-60">({COMPONENT_LABELS[f.componentType]})</span></p>
                              ))}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {formStatus === 'ATIVO' && diff && (
                      <>
                        <p>Vai publicar as seguintes alterações em <strong>{formName}</strong>:</p>
                        {!diff.hasChanges && (
                          <p className="text-xs text-gray-400 italic">Sem alterações detetadas face à versão publicada.</p>
                        )}
                        {diff.nameChanged && (
                          <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
                            <p className="text-xs text-amber-700 dark:text-amber-300">· Nome: <em>{originalForm?.name}</em> → <em>{formName}</em></p>
                          </div>
                        )}
                        {diff.added.length > 0 && (
                          <div className="rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-3 space-y-1 max-h-40 overflow-y-auto">
                            <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Adicionados ({diff.added.length})</p>
                            {diff.added.map(f => (
                              <p key={f.key} className="text-xs text-green-700 dark:text-green-300">
                                + {f.label} <span className="opacity-60">({COMPONENT_LABELS[f.type as ComponentType]}) — {f.page}</span>
                              </p>
                            ))}
                          </div>
                        )}
                        {diff.removed.length > 0 && (
                          <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 space-y-1 max-h-40 overflow-y-auto">
                            <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Removidos ({diff.removed.length})</p>
                            {diff.removed.map(f => (
                              <p key={f.key} className="text-xs text-red-700 dark:text-red-300">
                                - {f.label} <span className="opacity-60">({COMPONENT_LABELS[f.type as ComponentType]}) — {f.page}</span>
                              </p>
                            ))}
                          </div>
                        )}
                        {diff.modified.length > 0 && (
                          <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 space-y-2 max-h-48 overflow-y-auto">
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Modificados ({diff.modified.length})</p>
                            {diff.modified.map(f => (
                              <div key={f.key}>
                                <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                                  ~ {f.label} <span className="opacity-60 font-normal">({COMPONENT_LABELS[f.type as ComponentType]}) — {f.page}</span>
                                </p>
                                {f.changes.map(c => (
                                  <p key={c.prop} className="text-xs text-amber-700 dark:text-amber-300 pl-3">
                                    · {c.prop}{c.from ? <>: <em>{c.from}</em> → <em>{c.to}</em></> : ' alterada'}
                                  </p>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    {formStatus === 'INATIVO' && (
                      <p>Vai reativar o formulário <strong>{formName}</strong>. Ficará novamente disponível para candidaturas.</p>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className={formStatus === 'INATIVO' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}
                  onClick={() => void handlePublish()}
                >
                  {formStatus === 'INATIVO' ? 'Reativar' : 'Publicar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );
      })()}

      {/* ── Deactivate dialog ──────────────────────────────────────────────── */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar formulário</AlertDialogTitle>
            <AlertDialogDescription>
              Vai desativar o formulário <strong>{formName}</strong>. Deixará de estar disponível para candidaturas. Pode reativá-lo a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => void handleDeactivate()}
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete from editor dialog ──────────────────────────────────────── */}
      <AlertDialog open={deleteFromEditorOpen} onOpenChange={setDeleteFromEditorOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar formulário</AlertDialogTitle>
            <AlertDialogDescription>
              Vai eliminar permanentemente o formulário <strong>{formName}</strong>. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => void handleDeleteFromEditor()}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
