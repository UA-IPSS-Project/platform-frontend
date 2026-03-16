import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Calendar } from '../../components/ui/calendar';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Textarea } from '../../components/ui/textarea';
import { GlassCard } from '../../components/ui/glass-card';
import { DatePickerField } from '../../components/ui/date-picker-field';
import {
  MaterialCategoria,
  MaterialCatalogo,
  RequisicaoEstado,
  RequisicaoPrioridade,
  RequisicaoResponse,
  RequisicaoTipo,
  TransporteCatalogo,
  TransporteCategoria,
  requisicoesApi,
} from '../../services/api';

interface SecretaryRequisitionsPageProps {
  isDarkMode: boolean;
  currentUserId: number;
  initialTipo?: RequisicaoTipo;
  initialPrioridade?: RequisicaoPrioridade;
}

const ESTADO_OPTIONS: Array<{ value: RequisicaoEstado | ''; label: string }> = [
  { value: '', label: 'Todos os estados' },
  { value: 'ENVIADA', label: 'Enviada' },
  { value: 'EM_ANALISE', label: 'Em análise' },
  { value: 'CONCLUIDA', label: 'Concluída' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

const PRIORIDADE_OPTIONS: Array<{ value: RequisicaoPrioridade; label: string }> = [
  { value: 'BAIXA', label: 'Baixa' },
  { value: 'MEDIA', label: 'Média' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
];

const TIPO_OPTIONS: Array<{ value: RequisicaoTipo; label: string }> = [
  { value: 'MATERIAL', label: 'Material' },
  { value: 'TRANSPORTE', label: 'Transporte' },
  { value: 'MANUTENCAO', label: 'Manutenção' },
];

const TRANSPORTE_CATEGORIA_OPTIONS: Array<{ value: TransporteCategoria; label: string }> = [
  { value: 'LIGEIRO', label: 'Ligeiro' },
  { value: 'PESADO', label: 'Pesado' },
  { value: 'PASSAGEIROS', label: 'Passageiros' },
  { value: 'ADAPTADO', label: 'Adaptado' },
];

const MATERIAL_CATEGORIA_OPTIONS: Array<{ value: MaterialCategoria; label: string }> = [
  { value: 'ESCRITA', label: 'Escrita' },
  { value: 'PAPEL_E_ARQUIVO', label: 'Papel e arquivo' },
  { value: 'HIGIENE_E_LIMPEZA', label: 'Higiene e limpeza' },
  { value: 'TECNOLOGIA', label: 'Tecnologia' },
  { value: 'OUTROS', label: 'Outros' },
];

const formatTipo = (tipo: RequisicaoTipo) => TIPO_OPTIONS.find((option) => option.value === tipo)?.label ?? tipo;
const formatPrioridade = (prioridade: RequisicaoPrioridade) => PRIORIDADE_OPTIONS.find((option) => option.value === prioridade)?.label ?? prioridade;
const formatEstado = (estado: RequisicaoEstado) => ESTADO_OPTIONS.find((option) => option.value === estado)?.label ?? estado;
const formatMaterialCategoria = (categoria?: MaterialCategoria) =>
  MATERIAL_CATEGORIA_OPTIONS.find((option) => option.value === categoria)?.label ?? categoria ?? 'Sem categoria';

const toIsoFromDateOnly = (date?: Date): string | undefined => {
  if (!date) return undefined;
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)).toISOString();
};

const formatDatePt = (date?: Date): string => {
  if (!date) return '';
  return new Intl.DateTimeFormat('pt-PT').format(date);
};

const formatMaterialItemLabel = (
  material?: { id: number; nome?: string; categoria?: MaterialCategoria; atributo?: string; valorAtributo?: string },
  quantidade?: number,
): string => {
  const materialLabel = material?.nome ?? (material?.id ? `#${material.id}` : 'Material');
  const detalhe = material?.atributo && material?.valorAtributo
    ? ` - ${material.atributo}: ${material.valorAtributo}`
    : '';
  const categoria = material?.categoria ? ` [${formatMaterialCategoria(material.categoria)}]` : '';
  return `${materialLabel}${categoria}${detalhe} (x${quantidade ?? 0})`;
};

type RequisicaoItem = NonNullable<RequisicaoResponse['itens']>[number];

const createEmptyMaterialLinha = () => ({
  rowId:
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? `material-row-${crypto.randomUUID()}`
      : `material-row-${Math.random().toString(36).slice(2)}`,
  materialId: '',
  quantidade: '1',
});

const normalizarTexto = (valor?: string | null) => (valor ?? '').trim().toLowerCase();

type MaterialItemGroup = {
  itemKey: string;
  nome: string;
  categoria: MaterialCategoria;
  variantes: MaterialCatalogo[];
};

export function SecretaryRequisitionsPage({
  isDarkMode,
  currentUserId,
  initialTipo,
  initialPrioridade,
}: Readonly<SecretaryRequisitionsPageProps>) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requisicoes, setRequisicoes] = useState<RequisicaoResponse[]>([]);
  const [activeSection, setActiveSection] = useState<'create' | 'list' | null>('list');
  const sectionSwitchTimeoutRef = useRef<number | null>(null);
  const [openedRequisicaoId, setOpenedRequisicaoId] = useState<number | null>(null);
  const [estadoEdicao, setEstadoEdicao] = useState<RequisicaoEstado>('ENVIADA');
  const [updatingEstadoId, setUpdatingEstadoId] = useState<number | null>(null);
  const [createMaterialDialogOpen, setCreateMaterialDialogOpen] = useState(false);
  const [createTransporteDialogOpen, setCreateTransporteDialogOpen] = useState(false);
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);
  const [submittingMaterial, setSubmittingMaterial] = useState(false);
  const [submittingTransporte, setSubmittingTransporte] = useState(false);

  const [filterEstado, setFilterEstado] = useState<RequisicaoEstado | ''>('');
  const [filterTipo, setFilterTipo] = useState<RequisicaoTipo | ''>(initialTipo ?? '');
  const [filterPrioridade, setFilterPrioridade] = useState<RequisicaoPrioridade | ''>(initialPrioridade ?? '');
  const [filterCriadoPorNome, setFilterCriadoPorNome] = useState('');
  const [filterGeridoPorNome, setFilterGeridoPorNome] = useState('');

  const [tipo, setTipo] = useState<RequisicaoTipo>(initialTipo ?? 'MANUTENCAO');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<RequisicaoPrioridade>(initialPrioridade ?? 'MEDIA');
  const [tempoLimite, setTempoLimite] = useState<Date | undefined>();
  const [tempoLimitePickerOpen, setTempoLimitePickerOpen] = useState(false);
  const [tempoLimiteMonth, setTempoLimiteMonth] = useState<Date>(new Date());
  const [materiais, setMateriais] = useState<MaterialCatalogo[]>([]);
  const [transportes, setTransportes] = useState<TransporteCatalogo[]>([]);
  const [materialLinhas, setMaterialLinhas] = useState<Array<{ rowId: string; materialId: string; quantidade: string }>>([]);
  const [expandedMaterialItems, setExpandedMaterialItems] = useState<Record<string, boolean>>({});
  const [expandedMaterialCategorias, setExpandedMaterialCategorias] = useState<Partial<Record<MaterialCategoria, boolean>>>({});
  const [transporteId, setTransporteId] = useState('');
  const [assunto, setAssunto] = useState('');
  const [novoMaterialNome, setNovoMaterialNome] = useState('');
  const [novoMaterialDescricao, setNovoMaterialDescricao] = useState('');
  const [novoMaterialCategoria, setNovoMaterialCategoria] = useState<MaterialCategoria>('OUTROS');
  const [novoMaterialAtributo, setNovoMaterialAtributo] = useState('');
  const [novoMaterialValorAtributo, setNovoMaterialValorAtributo] = useState('');
  const [novoTransporteTipo, setNovoTransporteTipo] = useState('');
  const [novoTransporteCategoria, setNovoTransporteCategoria] = useState<TransporteCategoria>('LIGEIRO');
  const [novoTransporteMatricula, setNovoTransporteMatricula] = useState('');
  const [novoTransporteMarca, setNovoTransporteMarca] = useState('');
  const [novoTransporteModelo, setNovoTransporteModelo] = useState('');
  const [novoTransporteLotacao, setNovoTransporteLotacao] = useState('');
  const [novoTransporteDataMatricula, setNovoTransporteDataMatricula] = useState('');

  useEffect(() => {
    setFilterTipo(initialTipo ?? '');
    setFilterPrioridade(initialPrioridade ?? '');
    if (initialTipo) setTipo(initialTipo);
    if (initialPrioridade) setPrioridade(initialPrioridade);
  }, [initialTipo, initialPrioridade]);

  const fetchRequisicoes = async (overrides?: {
    estado?: RequisicaoEstado | '';
    tipo?: RequisicaoTipo | '';
    prioridade?: RequisicaoPrioridade | '';
    criadoPorNome?: string;
    geridoPorNome?: string;
  }) => {
    const estado = overrides?.estado ?? filterEstado;
    const tipoFiltro = overrides?.tipo ?? filterTipo;
    const prioridadeFiltro = overrides?.prioridade ?? filterPrioridade;
    const criadoPor = overrides?.criadoPorNome ?? filterCriadoPorNome;
    const geridoPor = overrides?.geridoPorNome ?? filterGeridoPorNome;

    try {
      setLoading(true);
      const data = await requisicoesApi.procurar({
        estado: estado || undefined,
        tipo: tipoFiltro || undefined,
        prioridade: prioridadeFiltro || undefined,
        criadoPorNome: criadoPor || undefined,
        geridoPorNome: geridoPor || undefined,
      });
      setRequisicoes(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar requisições.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisicoes({
      estado: '',
      tipo: initialTipo ?? '',
      prioridade: initialPrioridade ?? '',
      criadoPorNome: '',
      geridoPorNome: '',
    });
  }, [initialTipo, initialPrioridade]);

  const fetchCatalogo = async () => {
    try {
      setLoadingCatalogo(true);
      const [materiaisData, transportesData] = await Promise.all([
        requisicoesApi.listarMateriais(),
        requisicoesApi.listarTransportes(),
      ]);
      setMateriais(Array.isArray(materiaisData) ? materiaisData : []);
      setTransportes(Array.isArray(transportesData) ? transportesData : []);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar materiais e transportes.');
    } finally {
      setLoadingCatalogo(false);
    }
  };

  useEffect(() => {
    fetchCatalogo();
  }, []);

  useEffect(() => {
    return () => {
      if (sectionSwitchTimeoutRef.current) {
        window.clearTimeout(sectionSwitchTimeoutRef.current);
      }
    };
  }, []);

  const materiaisPorCategoria = useMemo(() => {
    const map = new Map<MaterialCategoria, MaterialItemGroup[]>();

    MATERIAL_CATEGORIA_OPTIONS.forEach((categoria) => {
      const materiaisCategoria = materiais.filter((material) => material.categoria === categoria.value);
      const byNome = new Map<string, MaterialCatalogo[]>();

      materiaisCategoria.forEach((material) => {
        const nomeKey = normalizarTexto(material.nome) || String(material.id);
        const existentes = byNome.get(nomeKey) ?? [];
        byNome.set(nomeKey, [...existentes, material]);
      });

      const grupos = Array.from(byNome.entries()).map(([nomeKey, variantes]) => ({
        itemKey: `${categoria.value}:${nomeKey}`,
        nome: variantes[0]?.nome ?? 'Material',
        categoria: categoria.value,
        variantes,
      }));

      map.set(categoria.value, grupos);
    });

    return map;
  }, [materiais]);

  const handleCriarMaterialCatalogo = async () => {
    if (!novoMaterialNome.trim()) {
      toast.error('O nome do material é obrigatório.');
      return;
    }
    if (!novoMaterialAtributo.trim() || !novoMaterialValorAtributo.trim()) {
      toast.error('Atributo e valor do atributo são obrigatórios.');
      return;
    }

    try {
      setSubmittingMaterial(true);
      const novoMaterial = await requisicoesApi.criarMaterialCatalogo({
        nome: novoMaterialNome.trim(),
        descricao: novoMaterialDescricao.trim() || undefined,
        categoria: novoMaterialCategoria,
        atributo: novoMaterialAtributo.trim(),
        valorAtributo: novoMaterialValorAtributo.trim(),
      });
      toast.success('Material criado com sucesso.');
      setMateriais((prev) => [...prev, novoMaterial]);
      setNovoMaterialNome('');
      setNovoMaterialDescricao('');
      setNovoMaterialCategoria('OUTROS');
      setNovoMaterialAtributo('');
      setNovoMaterialValorAtributo('');
      setCreateMaterialDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao criar material.');
    } finally {
      setSubmittingMaterial(false);
    }
  };

  const handleCriarTransporteCatalogo = async () => {
    if (!novoTransporteTipo.trim() || !novoTransporteMatricula.trim()) {
      toast.error('Tipo e matrícula do transporte são obrigatórios.');
      return;
    }

    try {
      setSubmittingTransporte(true);
      const novoTransporte = await requisicoesApi.criarTransporteCatalogo({
        tipo: novoTransporteTipo.trim(),
        categoria: novoTransporteCategoria,
        matricula: novoTransporteMatricula.trim().toUpperCase(),
        marca: novoTransporteMarca.trim() || undefined,
        modelo: novoTransporteModelo.trim() || undefined,
        lotacao: novoTransporteLotacao ? Number(novoTransporteLotacao) : undefined,
        dataMatricula: novoTransporteDataMatricula || undefined,
      });
      toast.success('Transporte criado com sucesso.');
      setTransportes((prev) => [...prev, novoTransporte]);
      setTransporteId(String(novoTransporte.id));
      setNovoTransporteTipo('');
      setNovoTransporteCategoria('LIGEIRO');
      setNovoTransporteMatricula('');
      setNovoTransporteMarca('');
      setNovoTransporteModelo('');
      setNovoTransporteLotacao('');
      setNovoTransporteDataMatricula('');
      setCreateTransporteDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao criar transporte.');
    } finally {
      setSubmittingTransporte(false);
    }
  };

  const handleRemoveMaterialLinha = (rowId: string) => {
    setMaterialLinhas((prev) => prev.filter((item) => item.rowId !== rowId));
  };

  const toggleItemAttributesVisibility = (itemKey: string) => {
    setExpandedMaterialItems((prev) => ({ ...prev, [itemKey]: prev[itemKey] === false }));
  };

  const toggleCategoriaExpansion = (categoria: MaterialCategoria) => {
    setExpandedMaterialCategorias((prev) => ({ ...prev, [categoria]: !prev[categoria] }));
  };

  const toggleVariante = (materialId: number, checked: boolean) => {
    setMaterialLinhas((prev) => {
      const materialIdStr = String(materialId);
      const existing = prev.find((item) => item.materialId === materialIdStr);

      if (checked) {
        if (existing) return prev;
        return [...prev, { ...createEmptyMaterialLinha(), materialId: materialIdStr, quantidade: '1' }];
      }

      return prev.filter((item) => item.materialId !== materialIdStr);
    });
  };

  const handleItemToggle = (item: MaterialItemGroup, checked: boolean) => {
    if (checked) {
      setExpandedMaterialItems((prev) => ({ ...prev, [item.itemKey]: true }));
      if (item.variantes.length === 1) {
        toggleVariante(item.variantes[0].id, true);
      }
      return;
    }

    setExpandedMaterialItems((prev) => {
      const next = { ...prev };
      delete next[item.itemKey];
      return next;
    });

    setMaterialLinhas((prev) => {
      const ids = new Set(item.variantes.map((variante) => String(variante.id)));
      return prev.filter((linha) => !ids.has(linha.materialId));
    });
  };

  const updateVarianteQuantidade = (materialId: number, quantidade: string) => {
    if (!quantidade) return;

    const valor = Number(quantidade);
    if (!Number.isFinite(valor) || valor < 1) return;

    setMaterialLinhas((prev) =>
      prev.map((linha) =>
        linha.materialId === String(materialId)
          ? { ...linha, quantidade }
          : linha,
      ),
    );
  };

  const handleResetCreateForm = () => {
    setDescricao('');
    setTempoLimite(undefined);
    setMaterialLinhas([]);
    setTransporteId('');
    setAssunto('');
    setExpandedMaterialItems({});
    setTipo(initialTipo ?? 'MANUTENCAO');
    setPrioridade(initialPrioridade ?? 'MEDIA');
  };

  const handleCreate = async () => {
    if (!currentUserId) {
      toast.error('Não foi possível identificar o utilizador autenticado.');
      return;
    }

    if (!descricao.trim()) {
      toast.error('A descrição é obrigatória.');
      return;
    }

    try {
      setSubmitting(true);

      const payloadBase = {
        descricao: descricao.trim(),
        prioridade,
        tempoLimite: toIsoFromDateOnly(tempoLimite),
        criadoPorId: currentUserId,
      };

      if (tipo === 'MATERIAL') {
        const linhasValidas = materialLinhas.filter((linha) => linha.materialId && Number(linha.quantidade) > 0);
        if (linhasValidas.length === 0) {
          toast.error('Adicione pelo menos um material com quantidade válida.');
          return;
        }

        const itensDedupe = Array.from(
          linhasValidas.reduce<Map<number, number>>((acc, linha) => {
            acc.set(Number(linha.materialId), Number(linha.quantidade));
            return acc;
          }, new Map()),
        ).map(([materialId, quantidade]) => ({ materialId, quantidade }));

        await requisicoesApi.criarMaterial({
          ...payloadBase,
          itens: itensDedupe,
        });
        toast.success('Requisição de material criada com sucesso.');
      } else if (tipo === 'TRANSPORTE') {
        if (!transporteId) {
          toast.error('Selecione um transporte.');
          return;
        }
        await requisicoesApi.criarTransporte({
          ...payloadBase,
          transporteId: Number(transporteId),
        });
      } else {
        await requisicoesApi.criarManutencao({
          ...payloadBase,
          assunto: assunto.trim() || undefined,
        });
      }

      if (tipo !== 'MATERIAL') {
        toast.success('Requisição criada com sucesso.');
      }
      handleResetCreateForm();
      setActiveSection('list');
      await fetchRequisicoes();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao criar requisição.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearFilters = () => {
    setFilterEstado('');
    setFilterTipo(initialTipo ?? '');
    setFilterPrioridade(initialPrioridade ?? '');
    setFilterCriadoPorNome('');
    setFilterGeridoPorNome('');
  };

  const handleOpenRequisicao = (req: RequisicaoResponse) => {
    setOpenedRequisicaoId(req.id);
    setEstadoEdicao(req.estado);
  };

  const handleAtualizarEstado = async () => {
    if (!openedRequisicaoId) return;

    try {
      setUpdatingEstadoId(openedRequisicaoId);
      await requisicoesApi.atualizarEstado(openedRequisicaoId, { estado: estadoEdicao });
      toast.success('Estado da requisição atualizado com sucesso.');
      await fetchRequisicoes();
      setOpenedRequisicaoId(null);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao atualizar estado da requisição.');
    } finally {
      setUpdatingEstadoId(null);
    }
  };

  const summaryText = useMemo(() => {
    const total = requisicoes.length;
    const urgentes = requisicoes.filter((item) => item.prioridade === 'URGENTE').length;
    return `${total} requisição(ões) · ${urgentes} urgente(s)`;
  }, [requisicoes]);

  const materiaisAdicionadosAgrupados = useMemo(() => {
    const grupos = new Map<MaterialCategoria, Array<{
      rowId: string;
      descricao: string;
      quantidade: string;
    }>>();

    materialLinhas.forEach((linha) => {
      const material = materiais.find((item) => String(item.id) === linha.materialId);
      const categoria = material?.categoria ?? 'OUTROS';
      const descricao = [material?.nome ?? 'Material removido', material?.valorAtributo].filter(Boolean).join(' ');
      const grupoAtual = grupos.get(categoria) ?? [];

      grupoAtual.push({
        rowId: linha.rowId,
        descricao,
        quantidade: linha.quantidade,
      });

      grupos.set(categoria, grupoAtual);
    });

    return MATERIAL_CATEGORIA_OPTIONS
      .map((categoria) => ({
        categoria: categoria.value,
        label: categoria.label,
        itens: grupos.get(categoria.value) ?? [],
      }))
      .filter((grupo) => grupo.itens.length > 0);
  }, [materiais, materialLinhas]);

  const materiaisAdicionadosTotal = useMemo(
    () => materialLinhas.reduce((sum, linha) => sum + Number(linha.quantidade || 0), 0),
    [materialLinhas],
  );

  const selectedRequisicao = useMemo(
    () => requisicoes.find((item) => item.id === openedRequisicaoId) ?? null,
    [requisicoes, openedRequisicaoId],
  );

  const headingClass = isDarkMode ? 'text-gray-100' : 'text-gray-900';

  const toggleSection = (targetSection: 'create' | 'list') => {
    if (sectionSwitchTimeoutRef.current) {
      window.clearTimeout(sectionSwitchTimeoutRef.current);
      sectionSwitchTimeoutRef.current = null;
    }

    if (activeSection === targetSection) {
      const oppositeSection = targetSection === 'create' ? 'list' : 'create';
      setActiveSection(null);
      sectionSwitchTimeoutRef.current = window.setTimeout(() => {
        setActiveSection(oppositeSection);
        sectionSwitchTimeoutRef.current = null;
      }, 140);
      return;
    }

    setActiveSection(targetSection);
  };

  const createFormContent = (
    <div className="space-y-5">
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Dados principais</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label htmlFor="req-create-tipo" className="text-sm text-gray-600 dark:text-gray-300">Tipo</label>
            <select
              id="req-create-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as RequisicaoTipo)}
              className="w-full mt-1 h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100"
            >
              {TIPO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="req-create-prioridade" className="text-sm text-gray-600 dark:text-gray-300">Prioridade</label>
            <select
              id="req-create-prioridade"
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value as RequisicaoPrioridade)}
              className="w-full mt-1 h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100"
            >
              {PRIORIDADE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Data limite</p>
            <Popover
              open={tempoLimitePickerOpen}
              onOpenChange={(open) => {
                setTempoLimitePickerOpen(open);
                if (open) {
                  setTempoLimiteMonth(tempoLimite ?? new Date());
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-1 justify-between"
                >
                  {tempoLimite ? formatDatePt(tempoLimite) : 'Selecionar data'}
                  <CalendarIcon className="w-4 h-4 opacity-70" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 border-0 bg-transparent shadow-none w-auto" align="start">
                <Calendar
                  mode="single"
                  selected={tempoLimite}
                  month={tempoLimiteMonth}
                  onMonthChange={setTempoLimiteMonth}
                  onSelect={(date) => {
                    setTempoLimite(date);
                    if (date) setTempoLimitePickerOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div>
          <label htmlFor="req-create-descricao" className="text-sm text-gray-600 dark:text-gray-300">Descrição</label>
          <Textarea id="req-create-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva a requisição" />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Detalhes por tipo</h3>

        <div>
          {tipo === 'MATERIAL' && (
            <div className="space-y-3">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Selecionar materiais</p>
                  <Button type="button" variant="outline" className="h-7 px-2 text-xs" onClick={() => setCreateMaterialDialogOpen(true)}>
                    Novo material
                  </Button>
                </div>

                <div className="space-y-2">
                  {MATERIAL_CATEGORIA_OPTIONS.map((categoria) => {
                    const itemsCategoria = materiaisPorCategoria.get(categoria.value) ?? [];
                    const isCategoriaExpanded = expandedMaterialCategorias[categoria.value] ?? false;

                    return (
                      <div
                        key={categoria.value}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60"
                      >
                        <button
                          type="button"
                          onClick={() => toggleCategoriaExpansion(categoria.value)}
                          className="w-full px-3 py-2 flex items-center justify-between text-left"
                        >
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            {categoria.label}
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({itemsCategoria.length})</span>
                          </p>
                          {isCategoriaExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          )}
                        </button>

                        {isCategoriaExpanded && (itemsCategoria.length === 0 ? (
                          <p className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                            Sem itens nesta categoria.
                          </p>
                        ) : (
                          <div className="p-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-3">
                            {itemsCategoria.map((item) => {
                              const hasPendingSelection = expandedMaterialItems[item.itemKey] === true;
                              const selectedCount = item.variantes.filter((variante) =>
                                materialLinhas.some((linha) => linha.materialId === String(variante.id)),
                              ).length;
                              const itemChecked = selectedCount > 0 || hasPendingSelection;
                              const isExpanded = itemChecked && expandedMaterialItems[item.itemKey] !== false;

                              return (
                                <div key={item.itemKey} className="space-y-2 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                      <div className="flex flex-1 min-w-0 items-center gap-2 rounded-md px-1 py-1 -mx-1">
                                        <Checkbox
                                          id={`item-toggle-${item.itemKey}`}
                                          checked={itemChecked}
                                          onCheckedChange={(checked) => handleItemToggle(item, !!checked)}
                                          aria-label={item.nome}
                                        />
                                        <label
                                          htmlFor={`item-toggle-${item.itemKey}`}
                                          className="truncate text-sm text-gray-700 dark:text-gray-200 cursor-pointer select-none"
                                          title={item.nome}
                                        >
                                          {item.nome}
                                        </label>
                                      </div>

                                    {itemChecked && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="h-7 px-2 text-xs"
                                        onClick={() => toggleItemAttributesVisibility(item.itemKey)}
                                      >
                                        {isExpanded ? 'Ocultar atributos' : 'Mostrar atributos'}
                                      </Button>
                                    )}
                                  </div>

                                  {isExpanded && (
                                    <div className="pl-6 space-y-2 rounded-md border border-gray-200/70 dark:border-gray-700/70 bg-gray-50/70 dark:bg-gray-800/40 p-2">
                                      {item.variantes.map((variante) => {
                                        const checked = materialLinhas.some((linha) => linha.materialId === String(variante.id));
                                        const linhaSelecionada = materialLinhas.find((linha) => linha.materialId === String(variante.id));
                                        const atributoLabel = variante.atributo && variante.valorAtributo
                                          ? `${variante.atributo}: ${variante.valorAtributo}`
                                          : `Variante #${variante.id}`;

                                        return (
                                          <div key={variante.id} className="grid grid-cols-1 md:grid-cols-[1fr_120px] gap-2 items-center">
                                            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
                                              <Checkbox
                                                checked={checked}
                                                onCheckedChange={(nextChecked) => toggleVariante(variante.id, !!nextChecked)}
                                              />
                                              <span>{atributoLabel}</span>
                                            </label>

                                            {checked && (
                                              <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400">Qtd</label>
                                                <Input
                                                  type="number"
                                                  min="1"
                                                  value={linhaSelecionada?.quantidade ?? '1'}
                                                  onChange={(event) => updateVarianteQuantidade(variante.id, event.target.value)}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Materiais adicionados</p>

                {materialLinhas.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ainda não adicionaste materiais.</p>
                ) : (
                  <div className="space-y-4">
                    {materiaisAdicionadosAgrupados.map((grupo) => (
                      <div key={grupo.categoria} className="space-y-2">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{grupo.label}</p>

                        <div className="space-y-2">
                          {grupo.itens.map((item) => (
                            <div
                              key={item.rowId}
                              className="grid grid-cols-[minmax(0,1fr)_88px_auto] gap-2 items-center rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900"
                            >
                              <p className="min-w-0 truncate text-sm text-gray-900 dark:text-gray-100" title={item.descricao}>
                                {item.descricao}
                              </p>
                              <p className="text-sm text-center text-gray-700 dark:text-gray-300">{item.quantidade}</p>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-8 px-3"
                                onClick={() => handleRemoveMaterialLinha(item.rowId)}
                              >
                                Remover
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-3 text-sm text-gray-600 dark:text-gray-400">
                      <span>Total de linhas: {materialLinhas.length}</span>
                      <span>Total de unidades: {materiaisAdicionadosTotal}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {tipo === 'TRANSPORTE' && (
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="req-create-transporte-id" className="text-sm text-gray-600 dark:text-gray-300">Transporte</label>
                <Button type="button" variant="outline" className="h-7 px-2 text-xs" onClick={() => setCreateTransporteDialogOpen(true)}>
                  Novo transporte
                </Button>
              </div>
              <select
                id="req-create-transporte-id"
                value={transporteId}
                onChange={(e) => setTransporteId(e.target.value)}
                disabled={loadingCatalogo}
                className="w-full mt-1 h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100"
              >
                <option value="">{loadingCatalogo ? 'A carregar transportes...' : 'Selecionar transporte'}</option>
                {transportes.map((transporte) => (
                  <option key={transporte.id} value={transporte.id}>
                    {(transporte.tipo || 'Transporte')} · {transporte.matricula || 'sem matrícula'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {tipo === 'MANUTENCAO' && (
            <div>
              <label htmlFor="req-create-assunto" className="text-sm text-gray-600 dark:text-gray-300">Assunto (opcional)</label>
              <Input id="req-create-assunto" type="text" value={assunto} onChange={(e) => setAssunto(e.target.value)} placeholder="Ex: Torneira com fuga" />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            handleResetCreateForm();
            setActiveSection('list');
          }}
          disabled={submitting}
        >
          Fechar
        </Button>
        <Button onClick={handleCreate} disabled={submitting} className="bg-purple-600 hover:bg-purple-700 text-white">
          {submitting ? 'A criar...' : 'Criar requisição'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <GlassCard className={`w-full p-0 overflow-hidden transition-all duration-300 ${activeSection === 'create' ? 'ring-2 ring-purple-500/30' : 'opacity-85 hover:opacity-100'}`}>
        <button
          onClick={() => toggleSection('create')}
          className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="text-left">
            <h2 className={`text-xl font-semibold ${headingClass}`}>Nova requisição</h2>
            {activeSection !== 'create' && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Clique para abrir o formulário</p>}
          </div>
          {activeSection === 'create' ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
        </button>

        {activeSection === 'create' && (
          <div className="px-5 pb-5 border-t border-gray-200 dark:border-gray-800">
            {createFormContent}
          </div>
        )}
      </GlassCard>

      <GlassCard className={`w-full p-0 overflow-hidden transition-all duration-300 ${activeSection === 'list' ? 'ring-2 ring-purple-500/30' : 'opacity-85 hover:opacity-100'}`}>
        <button
          onClick={() => toggleSection('list')}
          className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="text-left">
            <h2 className={`text-xl font-semibold ${headingClass}`}>Requisições</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{summaryText}</p>
          </div>
          {activeSection === 'list' ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
        </button>

        {activeSection === 'list' && (
          <div className="px-5 pb-5 space-y-4">

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label htmlFor="req-filter-estado" className="text-sm text-gray-600 dark:text-gray-300">Estado</label>
            <select
              id="req-filter-estado"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value as RequisicaoEstado | '')}
              className="w-full mt-1 h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100"
            >
              {ESTADO_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="req-filter-tipo" className="text-sm text-gray-600 dark:text-gray-300">Tipo</label>
            <select
              id="req-filter-tipo"
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value as RequisicaoTipo | '')}
              className="w-full mt-1 h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="">Todos os tipos</option>
              {TIPO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="req-filter-prioridade" className="text-sm text-gray-600 dark:text-gray-300">Prioridade</label>
            <select
              id="req-filter-prioridade"
              value={filterPrioridade}
              onChange={(e) => setFilterPrioridade(e.target.value as RequisicaoPrioridade | '')}
              className="w-full mt-1 h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="">Todas as prioridades</option>
              {PRIORIDADE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="req-filter-criado-por" className="text-sm text-gray-600 dark:text-gray-300">Criado por nome</label>
            <Input id="req-filter-criado-por" type="text" value={filterCriadoPorNome} onChange={(e) => setFilterCriadoPorNome(e.target.value)} placeholder="Ex: Maria" />
          </div>

          <div>
            <label htmlFor="req-filter-gerido-por" className="text-sm text-gray-600 dark:text-gray-300">Gerido por nome</label>
            <Input id="req-filter-gerido-por" type="text" value={filterGeridoPorNome} onChange={(e) => setFilterGeridoPorNome(e.target.value)} placeholder="Ex: João" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => fetchRequisicoes()} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white">
            {loading ? 'A pesquisar...' : 'Pesquisar'}
          </Button>
          <Button variant="outline" onClick={handleClearFilters} disabled={loading}>Limpar filtros</Button>
        </div>

        {requisicoes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center text-gray-600 dark:text-gray-400">
            Sem requisições para os filtros atuais.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {requisicoes.map((req) => (
              <div key={req.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 p-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">#{req.id} · {formatTipo(req.tipo)}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{formatPrioridade(req.prioridade)}</p>
                    <Button
                      variant="outline"
                      className="h-8 px-3"
                      onClick={() => handleOpenRequisicao(req)}
                    >
                      Abrir
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-300">{req.descricao}</p>

                <div className="text-xs text-gray-500 dark:text-gray-400 grid grid-cols-1 md:grid-cols-2 gap-1">
                  <p>Estado: {formatEstado(req.estado)}</p>
                  <p>Criado por: {req.criadoPor?.nome || req.criadoPor?.id || '—'}</p>
                  <p>Gerido por: {req.geridoPor?.nome || req.geridoPor?.id || '—'}</p>
                  <p>Data: {req.criadoEm ? new Date(req.criadoEm).toLocaleString('pt-PT') : '—'}</p>
                  <p>Última alteração: {req.ultimaAlteracaoEstadoEm ? new Date(req.ultimaAlteracaoEstadoEm).toLocaleString('pt-PT') : '—'}</p>
                  <p>Prazo: {req.tempoLimite ? new Date(req.tempoLimite).toLocaleString('pt-PT') : '—'}</p>
                  {req.tipo === 'MATERIAL' && (
                    <p>
                      Materiais:{' '}
                      {req.itens && req.itens.length > 0
                        ? req.itens
                            .map((item: RequisicaoItem) => formatMaterialItemLabel(item.material, item.quantidade))
                            .join(', ')
                        : `ID ${req.material?.id || '—'} · Qtd ${req.quantidade || '—'}`}
                    </p>
                  )}
                  {req.tipo === 'TRANSPORTE' && <p>Transporte ID: {req.transporte?.id || '—'}</p>}
                  {req.tipo === 'MANUTENCAO' && <p>Assunto: {req.assunto || '—'}</p>}
                </div>

              </div>
            ))}
          </div>
        )}
          </div>
        )}
      </GlassCard>

      <Dialog open={openedRequisicaoId !== null} onOpenChange={(open) => !open && setOpenedRequisicaoId(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle>Detalhes da requisição</DialogTitle>
          </DialogHeader>

          {selectedRequisicao && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                <div className="text-sm grid grid-cols-[130px_1fr] gap-x-3 gap-y-2 items-start">
                  <p className="text-gray-500 dark:text-gray-400">Descrição</p>
                  <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.descricao || '—'}</p>

                  <p className="text-gray-500 dark:text-gray-400">Tipo</p>
                  <p className="text-gray-900 dark:text-gray-100">{formatTipo(selectedRequisicao.tipo)}</p>

                  <p className="text-gray-500 dark:text-gray-400">Prioridade</p>
                  <p className="text-gray-900 dark:text-gray-100">{formatPrioridade(selectedRequisicao.prioridade)}</p>

                  <p className="text-gray-500 dark:text-gray-400">Estado atual</p>
                  <p className="text-gray-900 dark:text-gray-100">{formatEstado(selectedRequisicao.estado)}</p>

                  <p className="text-gray-500 dark:text-gray-400">Criado por</p>
                  <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.criadoPor?.nome || '—'}</p>

                  <p className="text-gray-500 dark:text-gray-400">Gerido por</p>
                  <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.geridoPor?.nome || '—'}</p>

                  <p className="text-gray-500 dark:text-gray-400">Data de criação</p>
                  <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.criadoEm ? new Date(selectedRequisicao.criadoEm).toLocaleString('pt-PT') : '—'}</p>

                  <p className="text-gray-500 dark:text-gray-400">Última alteração</p>
                  <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.ultimaAlteracaoEstadoEm ? new Date(selectedRequisicao.ultimaAlteracaoEstadoEm).toLocaleString('pt-PT') : '—'}</p>

                  <p className="text-gray-500 dark:text-gray-400">Prazo</p>
                  <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.tempoLimite ? new Date(selectedRequisicao.tempoLimite).toLocaleString('pt-PT') : '—'}</p>

                  {selectedRequisicao.tipo === 'MATERIAL' && (
                    <>
                      <p className="text-gray-500 dark:text-gray-400">Material</p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {selectedRequisicao.itens && selectedRequisicao.itens.length > 0
                          ? selectedRequisicao.itens
                            .map((item: RequisicaoItem) => formatMaterialItemLabel(item.material, item.quantidade))
                              .join(', ')
                          : selectedRequisicao.material?.nome || '—'}
                      </p>

                      <p className="text-gray-500 dark:text-gray-400">Quantidade</p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {selectedRequisicao.itens && selectedRequisicao.itens.length > 0
                          ? selectedRequisicao.itens.reduce((sum: number, item: RequisicaoItem) => sum + (item.quantidade || 0), 0)
                          : selectedRequisicao.quantidade || '—'}
                      </p>
                    </>
                  )}
                  {selectedRequisicao.tipo === 'TRANSPORTE' && (
                    <>
                      <p className="text-gray-500 dark:text-gray-400">Transporte</p>
                      <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.transporte?.nome || 'Associado'}</p>
                    </>
                  )}
                  {selectedRequisicao.tipo === 'MANUTENCAO' && (
                    <>
                      <p className="text-gray-500 dark:text-gray-400">Assunto</p>
                      <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.assunto || '—'}</p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="req-estado-modal" className="text-sm text-gray-600 dark:text-gray-300">Novo estado</label>
                <select
                  id="req-estado-modal"
                  value={estadoEdicao}
                  onChange={(e) => setEstadoEdicao(e.target.value as RequisicaoEstado)}
                  className="w-full mt-1 h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100"
                >
                  {ESTADO_OPTIONS.filter((option) => option.value).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOpenedRequisicaoId(null)}
                  disabled={updatingEstadoId === selectedRequisicao.id}
                >
                  Fechar
                </Button>
                <Button
                  onClick={handleAtualizarEstado}
                  disabled={updatingEstadoId === selectedRequisicao.id}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {updatingEstadoId === selectedRequisicao.id ? 'A guardar...' : 'Guardar estado'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createMaterialDialogOpen} onOpenChange={setCreateMaterialDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle>Novo material</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label htmlFor="novo-material-nome" className="text-sm text-gray-600 dark:text-gray-300">Nome</label>
              <Input id="novo-material-nome" value={novoMaterialNome} onChange={(e) => setNovoMaterialNome(e.target.value)} placeholder="Ex: Luvas" />
            </div>
            <div>
              <label htmlFor="novo-material-descricao" className="text-sm text-gray-600 dark:text-gray-300">Descrição (opcional)</label>
              <Textarea id="novo-material-descricao" value={novoMaterialDescricao} onChange={(e) => setNovoMaterialDescricao(e.target.value)} placeholder="Descrição do material" />
            </div>
            <div>
              <label htmlFor="novo-material-categoria" className="text-sm text-gray-600 dark:text-gray-300">Categoria</label>
              <select
                id="novo-material-categoria"
                value={novoMaterialCategoria}
                onChange={(e) => setNovoMaterialCategoria(e.target.value as MaterialCategoria)}
                className="w-full mt-1 h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100"
              >
                {MATERIAL_CATEGORIA_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="novo-material-atributo" className="text-sm text-gray-600 dark:text-gray-300">Atributo</label>
                <Input
                  id="novo-material-atributo"
                  value={novoMaterialAtributo}
                  onChange={(e) => setNovoMaterialAtributo(e.target.value)}
                  placeholder="Ex: Cor, Tipo, Tamanho"
                />
              </div>
              <div>
                <label htmlFor="novo-material-valor-atributo" className="text-sm text-gray-600 dark:text-gray-300">Valor do atributo</label>
                <Input
                  id="novo-material-valor-atributo"
                  value={novoMaterialValorAtributo}
                  onChange={(e) => setNovoMaterialValorAtributo(e.target.value)}
                  placeholder="Ex: Azul, A4, 100ml"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateMaterialDialogOpen(false)} disabled={submittingMaterial}>
                Cancelar
              </Button>
              <Button onClick={handleCriarMaterialCatalogo} disabled={submittingMaterial} className="bg-purple-600 hover:bg-purple-700 text-white">
                {submittingMaterial ? 'A criar...' : 'Criar material'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createTransporteDialogOpen} onOpenChange={setCreateTransporteDialogOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle>Novo transporte</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="novo-transporte-tipo" className="text-sm text-gray-600 dark:text-gray-300">Tipo</label>
                <Input id="novo-transporte-tipo" value={novoTransporteTipo} onChange={(e) => setNovoTransporteTipo(e.target.value)} placeholder="Ex: Carrinha" />
              </div>
              <div>
                <label htmlFor="novo-transporte-categoria" className="text-sm text-gray-600 dark:text-gray-300">Categoria</label>
                <select
                  id="novo-transporte-categoria"
                  value={novoTransporteCategoria}
                  onChange={(e) => setNovoTransporteCategoria(e.target.value as TransporteCategoria)}
                  className="w-full mt-1 h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100"
                >
                  {TRANSPORTE_CATEGORIA_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="novo-transporte-matricula" className="text-sm text-gray-600 dark:text-gray-300">Matrícula</label>
                <Input id="novo-transporte-matricula" value={novoTransporteMatricula} onChange={(e) => setNovoTransporteMatricula(e.target.value)} placeholder="Ex: 00-AA-00" />
              </div>
              <div>
                <label htmlFor="novo-transporte-lotacao" className="text-sm text-gray-600 dark:text-gray-300">Lotação (opcional)</label>
                <Input id="novo-transporte-lotacao" type="number" min="1" value={novoTransporteLotacao} onChange={(e) => setNovoTransporteLotacao(e.target.value)} />
              </div>

              <div>
                <label htmlFor="novo-transporte-marca" className="text-sm text-gray-600 dark:text-gray-300">Marca (opcional)</label>
                <Input id="novo-transporte-marca" value={novoTransporteMarca} onChange={(e) => setNovoTransporteMarca(e.target.value)} placeholder="Ex: Ford" />
              </div>
              <div>
                <label htmlFor="novo-transporte-modelo" className="text-sm text-gray-600 dark:text-gray-300">Modelo (opcional)</label>
                <Input id="novo-transporte-modelo" value={novoTransporteModelo} onChange={(e) => setNovoTransporteModelo(e.target.value)} placeholder="Ex: Transit" />
              </div>

              <div>
                <label htmlFor="novo-transporte-data-matricula" className="text-sm text-gray-600 dark:text-gray-300">Data matrícula (opcional)</label>
                <DatePickerField
                  id="novo-transporte-data-matricula"
                  value={novoTransporteDataMatricula}
                  onChange={setNovoTransporteDataMatricula}
                  buttonClassName="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateTransporteDialogOpen(false)} disabled={submittingTransporte}>
                Cancelar
              </Button>
              <Button onClick={handleCriarTransporteCatalogo} disabled={submittingTransporte} className="bg-purple-600 hover:bg-purple-700 text-white">
                {submittingTransporte ? 'A criar...' : 'Criar transporte'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
