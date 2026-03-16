import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangleIcon, ChevronDown, ChevronLeft, ChevronUp, ClipboardListIcon, PackageIcon, TruckIcon, WrenchIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { GlassCard } from '../../components/ui/glass-card';
import { DatePickerField, formatDateInput, parseDateInput } from '../../components/ui/date-picker-field';
import { ApiRequestError } from '../../services/api/core/client';
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
  { value: 'ACEITE', label: 'Aceite' },
  { value: 'NEGADA', label: 'Negada' },
  { value: 'CONCLUIDA', label: 'Concluída' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

const ESTADO_SECRETARIA_OPTIONS: Array<{ value: RequisicaoEstado; label: string }> = [
  { value: 'EM_ANALISE', label: 'Em análise' },
  { value: 'ACEITE', label: 'Aceite' },
  { value: 'NEGADA', label: 'Negada' },
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

type RequisicoesTab = 'GERAL' | RequisicaoTipo | 'URGENTE';

const REQUISICOES_TABS: Array<{ value: RequisicoesTab; label: string }> = [
  { value: 'GERAL', label: 'Geral' },
  { value: 'MATERIAL', label: 'Material' },
  { value: 'MANUTENCAO', label: 'Manutenção' },
  { value: 'TRANSPORTE', label: 'Transporte' },
  { value: 'URGENTE', label: 'Urgente' },
];

const TRANSPORTE_CATEGORIA_OPTIONS: Array<{ value: TransporteCategoria; label: string }> = [
  { value: 'PESADO_DE_PASSAGEIROS', label: 'Pesado de passageiros' },
  { value: 'LIGEIRO_DE_PASSAGEIROS', label: 'Ligeiro de passageiros' },
  { value: 'LIGEIRO_DE_MERCADORIAS', label: 'Ligeiro de mercadorias' },
  { value: 'LIGEIRO_ESPECIAL', label: 'Ligeiro especial' },
  { value: 'ADAPTADO', label: 'Adaptado' },
  { value: 'LIGEIRO', label: 'Ligeiro' },
  { value: 'PESADO', label: 'Pesado' },
  { value: 'PASSAGEIROS', label: 'Passageiros' },
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
const formatTransporteCategoria = (categoria?: TransporteCategoria) =>
  TRANSPORTE_CATEGORIA_OPTIONS.find((option) => option.value === categoria)?.label ?? categoria ?? 'Sem categoria';

const toIsoFromDateOnly = (date?: Date): string | undefined => {
  if (!date) return undefined;
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)).toISOString();
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
type RequisicaoTransporteItem = NonNullable<RequisicaoResponse['transportes']>[number];
type TransporteResumo = RequisicaoTransporteItem['transporte'];
type TransporteLike = RequisicaoResponse['transporte'] | TransporteResumo | TransporteCatalogo | null | undefined;
type TransporteSelectionMode = 'auto' | 'manual';
type CreateField =
  | 'descricao'
  | 'materialItens'
  | 'destino'
  | 'dataSaida'
  | 'horaSaida'
  | 'dataRegresso'
  | 'horaRegresso'
  | 'numeroPassageiros'
  | 'transporteIds';

const createEmptyMaterialLinha = () => ({
  rowId:
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? `material-row-${crypto.randomUUID()}`
      : `material-row-${Math.random().toString(36).slice(2)}`,
  materialId: '',
  quantidade: '1',
});

const normalizarTexto = (valor?: string | null) => (valor ?? '').trim().toLowerCase();

const getPassengerCapacity = (lotacao?: number): number => {
  if (!lotacao || lotacao <= 0) return 0;
  return Math.max(0, lotacao - 1);
};

const composeDateTime = (date?: string, time?: string): string | undefined => {
  if (!date || !time) return undefined;
  return `${date}T${time}`;
};

const previousDateInput = (dateInput?: string): string | undefined => {
  const parsed = parseDateInput(dateInput);
  if (!parsed) return undefined;
  const prev = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate() - 1);
  return formatDateInput(prev);
};

const formatLotacao = (lotacao?: number): string => {
  if (!lotacao || lotacao <= 0) return 'Lotação não definida';
  return `${lotacao} ${lotacao === 1 ? 'lugar' : 'lugares'}`;
};

const formatVehicleTitle = (transporte?: TransporteLike): string => {
  const nome = transporte && 'nome' in transporte ? transporte.nome : undefined;
  return (nome || transporte?.tipo || 'Viatura').trim();
};

const formatTransporteDisplay = (transporte?: TransporteLike): string => {
  if (!transporte) return 'Sem transporte associado';

  const parts = [
    transporte.codigo ?? (transporte.id ? `#${transporte.id}` : undefined),
    formatVehicleTitle(transporte),
    transporte.matricula,
  ].filter(Boolean);

  return parts.join(' · ');
};

const formatTransporteMeta = (transporte?: TransporteLike): string => {
  if (!transporte) return 'Sem detalhes';

  const dataMatricula = transporte.dataMatricula
    ? new Date(transporte.dataMatricula).toLocaleDateString('pt-PT')
    : undefined;

  return [
    transporte.categoria ? formatTransporteCategoria(transporte.categoria) : undefined,
    formatLotacao(transporte.lotacao),
    dataMatricula ? `Matriculado em ${dataMatricula}` : undefined,
  ].filter(Boolean).join(' · ');
};

const getRequisicaoTransportes = (requisicao?: RequisicaoResponse | null): TransporteResumo[] => {
  if (!requisicao) return [];
  if (requisicao.transportes && requisicao.transportes.length > 0) {
    return requisicao.transportes.map((item) => item.transporte).filter(Boolean);
  }
  return requisicao.transporte ? [requisicao.transporte] : [];
};

const formatTransporteCollection = (requisicao?: RequisicaoResponse | null): string => {
  const transportesRequisicao = getRequisicaoTransportes(requisicao);
  if (transportesRequisicao.length === 0) return '—';
  return transportesRequisicao.map((transporte) => formatTransporteDisplay(transporte)).join(', ');
};

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
  const [monthlyRequisicoes, setMonthlyRequisicoes] = useState<RequisicaoResponse[]>([]);
  const [activeSection, setActiveSection] = useState<'create' | 'list' | null>('list');
  const sectionSwitchTimeoutRef = useRef<number | null>(null);
  const [openedRequisicaoId, setOpenedRequisicaoId] = useState<number | null>(null);
  const [estadoEdicao, setEstadoEdicao] = useState<RequisicaoEstado>('EM_ANALISE');
  const [updatingEstadoId, setUpdatingEstadoId] = useState<number | null>(null);
  const [createMaterialDialogOpen, setCreateMaterialDialogOpen] = useState(false);
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);
  const [submittingMaterial, setSubmittingMaterial] = useState(false);

  const [filterEstado, setFilterEstado] = useState<RequisicaoEstado | ''>('');
  const [filterTipo, setFilterTipo] = useState<RequisicaoTipo | ''>(initialTipo ?? '');
  const [filterPrioridade, setFilterPrioridade] = useState<RequisicaoPrioridade | ''>(initialPrioridade ?? '');
  const [filterCriadoPorNome, setFilterCriadoPorNome] = useState('');
  const [filterGeridoPorNome, setFilterGeridoPorNome] = useState('');
  const [activeTab, setActiveTab] = useState<RequisicoesTab>(() => {
    if (initialPrioridade === 'URGENTE') return 'URGENTE';
    if (initialTipo) return initialTipo;
    return 'GERAL';
  });

  const [tipo, setTipo] = useState<RequisicaoTipo>(initialTipo ?? 'MANUTENCAO');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<RequisicaoPrioridade>(initialPrioridade ?? 'MEDIA');
  const [tempoLimite, setTempoLimite] = useState<Date | undefined>();
  const [materiais, setMateriais] = useState<MaterialCatalogo[]>([]);
  const [transportes, setTransportes] = useState<TransporteCatalogo[]>([]);
  const [materialLinhas, setMaterialLinhas] = useState<Array<{ rowId: string; materialId: string; quantidade: string }>>([]);
  const [expandedMaterialItems, setExpandedMaterialItems] = useState<Record<string, boolean>>({});
  const [expandedMaterialCategorias, setExpandedMaterialCategorias] = useState<Partial<Record<MaterialCategoria, boolean>>>({});
  const [expandedTransporteCategorias, setExpandedTransporteCategorias] = useState<Partial<Record<TransporteCategoria, boolean>>>({});
  const [expandedTransporteDetalhes, setExpandedTransporteDetalhes] = useState<Record<number, boolean>>({});
  const [destinoTransporte, setDestinoTransporte] = useState('');
  const [dataSaida, setDataSaida] = useState('');
  const [horaSaida, setHoraSaida] = useState('');
  const [dataRegresso, setDataRegresso] = useState('');
  const [horaRegresso, setHoraRegresso] = useState('');
  const [numeroPassageiros, setNumeroPassageiros] = useState('');
  const [condutorTransporte, setCondutorTransporte] = useState('');
  const [selectedTransportIds, setSelectedTransportIds] = useState<string[]>([]);
  const [transportSelectionMode, setTransportSelectionMode] = useState<TransporteSelectionMode>('auto');
  const [tempoLimiteManuallyEdited, setTempoLimiteManuallyEdited] = useState(false);
  const [createErrors, setCreateErrors] = useState<Partial<Record<CreateField, string>>>({});
  const [createTouched, setCreateTouched] = useState<Partial<Record<CreateField, boolean>>>({});
  const [assunto, setAssunto] = useState('');
  const [novoMaterialNome, setNovoMaterialNome] = useState('');
  const [novoMaterialDescricao, setNovoMaterialDescricao] = useState('');
  const [novoMaterialCategoria, setNovoMaterialCategoria] = useState<MaterialCategoria>('OUTROS');
  const [novoMaterialAtributo, setNovoMaterialAtributo] = useState('');
  const [novoMaterialValorAtributo, setNovoMaterialValorAtributo] = useState('');

  useEffect(() => {
    setFilterTipo(initialTipo ?? '');
    setFilterPrioridade(initialPrioridade ?? '');
    if (initialPrioridade === 'URGENTE') {
      setActiveTab('URGENTE');
    } else if (initialTipo) {
      setActiveTab(initialTipo);
    } else {
      setActiveTab('GERAL');
    }
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

  const fetchMonthlyOverview = async () => {
    try {
      const data = await requisicoesApi.procurar({});
      setMonthlyRequisicoes(Array.isArray(data) ? data : []);
    } catch {
      // Keep cards resilient; list fetch already reports errors.
      setMonthlyRequisicoes([]);
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
    fetchMonthlyOverview();
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
    setCreateErrors({});
    setCreateTouched({});
  }, [tipo]);

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

  const transportesOrdenados = useMemo(
    () => [...transportes].sort((a, b) => {
      const codigoA = a.codigo ?? '';
      const codigoB = b.codigo ?? '';
      if (codigoA && codigoB && codigoA !== codigoB) {
        return codigoA.localeCompare(codigoB, 'pt-PT', { numeric: true });
      }
      if (codigoA && !codigoB) return -1;
      if (!codigoA && codigoB) return 1;

      const tipoDiff = (a.tipo ?? '').localeCompare(b.tipo ?? '', 'pt-PT');
      if (tipoDiff !== 0) return tipoDiff;

      return (a.matricula ?? '').localeCompare(b.matricula ?? '', 'pt-PT');
    }),
    [transportes],
  );

  const transportesPorCategoria = useMemo(
    () => TRANSPORTE_CATEGORIA_OPTIONS.map((categoria) => ({
      categoria: categoria.value,
      label: categoria.label,
      items: transportesOrdenados.filter((transporte) => transporte.categoria === categoria.value),
    })).filter((grupo) => grupo.items.length > 0),
    [transportesOrdenados],
  );

  const passageirosSolicitados = useMemo(() => {
    const value = Number(numeroPassageiros || 0);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }, [numeroPassageiros]);

  const recommendedTransportIds = useMemo(() => {
    if (passageirosSolicitados <= 0) return [] as number[];

    const viaturasComLotacao = transportesOrdenados
      .filter((transporte) => transporte.id && getPassengerCapacity(transporte.lotacao) > 0)
      .map((transporte) => ({
        id: transporte.id as number,
        capacidade: getPassengerCapacity(transporte.lotacao),
      }));
    if (viaturasComLotacao.length === 0) return [] as number[];

    const capacidadeMaxima = viaturasComLotacao.reduce((sum, item) => sum + item.capacidade, 0);
    if (capacidadeMaxima < passageirosSolicitados) return [] as number[];

    // Custo combinado: nº_viaturas × K + lugares_vazios
    // K ≈ 25% dos passageiros — cada viatura extra custa tanto como desperdiçar 1/4 da ocupação.
    // Exemplos: 9 pass (K=3): 2 carros (1 vazio) = 7 < bus (20 vazios) = 23 → carros ganham
    //           27 pass (K=7): bus (3 vazios) = 10 < 5 carros (0 vazios) = 35 → bus ganha
    const penalizacaoViatura = Math.max(2, Math.ceil(passageirosSolicitados / 4));

    // 0/1 knapsack: para cada capacidade alcançável guarda o menor custo de viaturas
    const dp: Array<{ ids: number[]; custoViaturas: number } | undefined> =
      new Array(capacidadeMaxima + 1).fill(undefined);
    dp[0] = { ids: [], custoViaturas: 0 };

    for (const viatura of viaturasComLotacao) {
      for (let cap = capacidadeMaxima - viatura.capacidade; cap >= 0; cap -= 1) {
        const base = dp[cap];
        if (!base) continue;

        const novaCap = cap + viatura.capacidade;
        const novoCusto = base.custoViaturas + penalizacaoViatura;
        const existente = dp[novaCap];

        if (!existente || novoCusto < existente.custoViaturas) {
          dp[novaCap] = { ids: [...base.ids, viatura.id], custoViaturas: novoCusto };
        }
      }
    }

    // Escolhe a capacidade cujo custo total (viaturas + lugares vazios) é mínimo
    let melhor: { ids: number[]; custoTotal: number } | undefined;

    for (let cap = passageirosSolicitados; cap <= capacidadeMaxima; cap += 1) {
      const entrada = dp[cap];
      if (!entrada) continue;

      const custoTotal = entrada.custoViaturas + (cap - passageirosSolicitados);
      if (!melhor || custoTotal < melhor.custoTotal) {
        melhor = { ids: entrada.ids, custoTotal };
      }
    }

    return melhor?.ids ?? [];
  }, [passageirosSolicitados, transportesOrdenados]);

  useEffect(() => {
    if (tipo !== 'TRANSPORTE' || transportSelectionMode !== 'auto') {
      return;
    }
    setSelectedTransportIds(recommendedTransportIds.map(String));
  }, [recommendedTransportIds, transportSelectionMode, tipo]);

  const selectedTransportes = useMemo(
    () => transportesOrdenados.filter((item) => selectedTransportIds.includes(String(item.id))),
    [selectedTransportIds, transportesOrdenados],
  );

  const selectedTransportesCapacidade = useMemo(
    () => selectedTransportes.reduce((sum, transporte) => sum + getPassengerCapacity(transporte.lotacao), 0),
    [selectedTransportes],
  );

  const lugaresEmFalta = useMemo(
    () => Math.max(0, passageirosSolicitados - selectedTransportesCapacidade),
    [passageirosSolicitados, selectedTransportesCapacidade],
  );

  useEffect(() => {
    if (tipo !== 'TRANSPORTE' || !dataSaida) return;

    if (!dataRegresso) {
      setDataRegresso(dataSaida);
    }

    if (!tempoLimiteManuallyEdited) {
      const previousDate = previousDateInput(dataSaida);
      setTempoLimite(previousDate ? parseDateInput(previousDate) : undefined);
    }
  }, [tipo, dataSaida, dataRegresso, tempoLimiteManuallyEdited]);

  useEffect(() => {
    if (createTouched.materialItens) {
      validateAndSetField('materialItens');
    }
  }, [materialLinhas, createTouched.materialItens]);

  const setFieldTouched = (field: CreateField) => {
    setCreateTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validateCreateField = (field: CreateField): string | undefined => {
    if (field === 'descricao') {
      if (!descricao.trim()) return 'Campo obrigatório.';
      return undefined;
    }

    if (tipo === 'MATERIAL' && field === 'materialItens') {
      const linhasValidas = materialLinhas.filter((linha) => linha.materialId && Number(linha.quantidade) > 0);
      if (linhasValidas.length === 0) return 'Adicione pelo menos um material com quantidade válida.';
      return undefined;
    }

    if (tipo !== 'TRANSPORTE') return undefined;

    if (field === 'destino' && !destinoTransporte.trim()) return 'Campo obrigatório.';
    if (field === 'dataSaida' && !dataSaida) return 'Campo obrigatório.';
    if (field === 'horaSaida' && !horaSaida) return 'Campo obrigatório.';
    if (field === 'dataRegresso' && !dataRegresso) return 'Campo obrigatório.';
    if (field === 'horaRegresso' && !horaRegresso) return 'Campo obrigatório.';

    if (field === 'numeroPassageiros') {
      if (!numeroPassageiros) return 'Campo obrigatório.';
      if (passageirosSolicitados < 1) return 'Indique um número de passageiros válido.';
      return undefined;
    }

    if (field === 'transporteIds' && selectedTransportIds.length === 0) {
      return 'Selecione pelo menos uma viatura.';
    }

    const saida = composeDateTime(dataSaida, horaSaida);
    const regresso = composeDateTime(dataRegresso, horaRegresso);
    if ((field === 'horaRegresso' || field === 'dataRegresso') && saida && regresso) {
      const saidaDate = new Date(saida);
      const regressoDate = new Date(regresso);
      if (!Number.isNaN(saidaDate.getTime()) && !Number.isNaN(regressoDate.getTime()) && regressoDate <= saidaDate) {
        return 'A data/hora de regresso deve ser posterior à data/hora de saída.';
      }
    }

    return undefined;
  };

  const validateAndSetField = (field: CreateField, markTouched = false): string | undefined => {
    const error = validateCreateField(field);
    if (markTouched) {
      setFieldTouched(field);
    }
    setCreateErrors((prev) => {
      if (error) return { ...prev, [field]: error };
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    return error;
  };

  const toCreateFieldErrors = (error: ApiRequestError): Partial<Record<CreateField, string>> => {
    if (!error.fieldErrors) return {};

    const mapped: Partial<Record<CreateField, string>> = {};
    Object.entries(error.fieldErrors).forEach(([key, value]) => {
      if (key === 'descricao') mapped.descricao = value;
      if (key === 'itens') mapped.materialItens = value;
      if (key === 'destino') mapped.destino = value;
      if (key === 'dataHoraSaida') {
        mapped.dataSaida = value;
        mapped.horaSaida = value;
      }
      if (key === 'dataHoraRegresso') {
        mapped.dataRegresso = value;
        mapped.horaRegresso = value;
      }
      if (key === 'numeroPassageiros') mapped.numeroPassageiros = value;
      if (key === 'transporteIds') mapped.transporteIds = value;
    });

    return mapped;
  };

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

  const handleRemoveMaterialLinha = (rowId: string) => {
    setMaterialLinhas((prev) => prev.filter((item) => item.rowId !== rowId));
  };

  const toggleItemAttributesVisibility = (itemKey: string) => {
    setExpandedMaterialItems((prev) => ({ ...prev, [itemKey]: prev[itemKey] === false }));
  };

  const toggleCategoriaExpansion = (categoria: MaterialCategoria) => {
    setExpandedMaterialCategorias((prev) => ({ ...prev, [categoria]: !prev[categoria] }));
  };

  const toggleTransporteCategoriaExpansion = (categoria: TransporteCategoria) => {
    setExpandedTransporteCategorias((prev) => ({ ...prev, [categoria]: !prev[categoria] }));
  };

  const toggleTransporteDetalhes = (transporteId: number) => {
    setExpandedTransporteDetalhes((prev) => ({ ...prev, [transporteId]: !prev[transporteId] }));
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
    setTempoLimiteManuallyEdited(false);
    setMaterialLinhas([]);
    setDestinoTransporte('');
    setDataSaida('');
    setHoraSaida('');
    setDataRegresso('');
    setHoraRegresso('');
    setNumeroPassageiros('');
    setCondutorTransporte('');
    setSelectedTransportIds([]);
    setTransportSelectionMode('auto');
    setAssunto('');
    setExpandedMaterialItems({});
    setExpandedTransporteCategorias({});
    setExpandedTransporteDetalhes({});
    setCreateErrors({});
    setCreateTouched({});
    setTipo(initialTipo ?? 'MANUTENCAO');
    setPrioridade(initialPrioridade ?? 'MEDIA');
  };

  const toggleSelectedTransport = (transporteId: number, checked: boolean) => {
    const transporteIdStr = String(transporteId);
    setTransportSelectionMode('manual');
    setSelectedTransportIds((prev) => {
      if (checked) {
        return prev.includes(transporteIdStr) ? prev : [...prev, transporteIdStr];
      }
      return prev.filter((item) => item !== transporteIdStr);
    });
    if (createTouched.transporteIds) {
      setTimeout(() => validateAndSetField('transporteIds'), 0);
    }
  };

  const handleAplicarSugestaoTransporte = () => {
    setTransportSelectionMode('auto');
    setSelectedTransportIds(recommendedTransportIds.map(String));
    if (createTouched.transporteIds) {
      setTimeout(() => validateAndSetField('transporteIds'), 0);
    }
  };

  const handleCreate = async () => {
    if (!currentUserId) {
      toast.error('Não foi possível identificar o utilizador autenticado.');
      return;
    }

    const fieldsToValidate: CreateField[] = ['descricao'];
    if (tipo === 'MATERIAL') {
      fieldsToValidate.push('materialItens');
    }
    if (tipo === 'TRANSPORTE') {
      fieldsToValidate.push(
        'destino',
        'dataSaida',
        'horaSaida',
        'dataRegresso',
        'horaRegresso',
        'numeroPassageiros',
        'transporteIds',
      );
    }

    const validationErrors = fieldsToValidate
      .map((field) => ({ field, error: validateAndSetField(field, true) }))
      .filter((item) => Boolean(item.error));

    if (validationErrors.length > 0) {
      return;
    }

    const dataHoraSaida = composeDateTime(dataSaida, horaSaida);
    const dataHoraRegresso = composeDateTime(dataRegresso, horaRegresso);

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
        await requisicoesApi.criarTransporte({
          ...payloadBase,
          destino: destinoTransporte.trim(),
          dataHoraSaida: dataHoraSaida!,
          dataHoraRegresso: dataHoraRegresso!,
          numeroPassageiros: passageirosSolicitados,
          condutor: condutorTransporte.trim() || undefined,
          transporteIds: selectedTransportIds.map(Number),
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
      await fetchMonthlyOverview();
    } catch (error: any) {
      const apiError = error as ApiRequestError;
      const mappedErrors = toCreateFieldErrors(apiError);
      if (Object.keys(mappedErrors).length > 0) {
        setCreateErrors((prev) => ({ ...prev, ...mappedErrors }));
        setCreateTouched((prev) => {
          const next = { ...prev };
          Object.keys(mappedErrors).forEach((field) => {
            next[field as CreateField] = true;
          });
          return next;
        });
      } else {
        toast.error(error?.message || 'Erro ao criar requisição.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearFilters = () => {
    setFilterEstado('');
    if (activeTab === 'URGENTE') {
      setFilterTipo('');
      setFilterPrioridade('URGENTE');
    } else if (activeTab === 'GERAL') {
      setFilterTipo('');
      setFilterPrioridade('');
    } else {
      setFilterTipo(activeTab);
      setFilterPrioridade('');
    }
    setFilterCriadoPorNome('');
    setFilterGeridoPorNome('');
  };

  const handleSelectTab = async (tab: RequisicoesTab) => {
    setActiveTab(tab);

    const nextTipo: RequisicaoTipo | '' = tab === 'GERAL' || tab === 'URGENTE' ? '' : tab;
    const nextPrioridade: RequisicaoPrioridade | '' = tab === 'URGENTE' ? 'URGENTE' : '';

    setFilterTipo(nextTipo);
    setFilterPrioridade(nextPrioridade);

    await fetchRequisicoes({
      estado: filterEstado,
      tipo: nextTipo,
      prioridade: nextPrioridade,
      criadoPorNome: filterCriadoPorNome,
      geridoPorNome: filterGeridoPorNome,
    });
  };

  const handleCardShortcut = (tab: RequisicoesTab) => {
    setActiveSection('list');
    void handleSelectTab(tab);
  };

  const handleOpenRequisicao = (req: RequisicaoResponse) => {
    setOpenedRequisicaoId(req.id);
    // Pré-seleciona o estado atual se for um dos estados geridos pela secretaria, caso contrário EM_ANALISE
    const estadoSecretaria = ESTADO_SECRETARIA_OPTIONS.some((opt) => opt.value === req.estado)
      ? req.estado
      : 'EM_ANALISE';
    setEstadoEdicao(estadoSecretaria);
  };

  const handleAtualizarEstado = async () => {
    if (!openedRequisicaoId) return;

    try {
      setUpdatingEstadoId(openedRequisicaoId);
      await requisicoesApi.atualizarEstado(openedRequisicaoId, { estado: estadoEdicao });
      toast.success('Estado da requisição atualizado com sucesso.');
      await fetchRequisicoes();
      await fetchMonthlyOverview();
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

  const monthlyRequisicoesAtual = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return monthlyRequisicoes.filter((item) => {
      if (!item.criadoEm) return false;
      const createdAt = new Date(item.criadoEm);
      if (Number.isNaN(createdAt.getTime())) return false;
      return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
    });
  }, [monthlyRequisicoes]);

  const stats = useMemo(() => {
    const total = monthlyRequisicoesAtual.length;
    const urgentes = monthlyRequisicoesAtual.filter((item) => item.prioridade === 'URGENTE').length;
    const emAnalise = monthlyRequisicoesAtual.filter((item) => item.estado === 'EM_ANALISE').length;
    const concluidas = monthlyRequisicoesAtual.filter((item) => item.estado === 'CONCLUIDA').length;
    const material = monthlyRequisicoesAtual.filter((item) => item.tipo === 'MATERIAL').length;
    const manutencao = monthlyRequisicoesAtual.filter((item) => item.tipo === 'MANUTENCAO').length;
    const transporte = monthlyRequisicoesAtual.filter((item) => item.tipo === 'TRANSPORTE').length;

    return { total, urgentes, emAnalise, concluidas, material, manutencao, transporte };
  }, [monthlyRequisicoesAtual]);

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
  const selectFieldClassName = 'w-full mt-1 h-10 rounded-md border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/90 px-3 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 outline-none';
  const inputFieldClassName = 'mt-1 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/90 shadow-sm focus-visible:border-purple-500 focus-visible:ring-purple-500/30';
  const textareaFieldClassName = 'mt-1 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/90 shadow-sm focus-visible:border-purple-500 focus-visible:ring-purple-500/30';
  const quantityFieldClassName = 'mt-1 h-9 border-2 border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus-visible:border-purple-500 focus-visible:ring-purple-500/30';
  const getFieldClassName = (baseClass: string, field: CreateField) => (
    createErrors[field]
      ? `${baseClass} border-red-500 focus-visible:border-red-500 focus-visible:ring-red-200`
      : baseClass
  );

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
      <div className="rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white/95 dark:bg-gray-900/85 p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Dados principais</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label htmlFor="req-create-tipo" className="text-sm text-gray-600 dark:text-gray-300">Tipo</label>
            <select
              id="req-create-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as RequisicaoTipo)}
              className={selectFieldClassName}
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
              className={selectFieldClassName}
            >
              {PRIORIDADE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="req-create-tempo-limite" className="text-sm text-gray-600 dark:text-gray-300">Data limite</label>
            <DatePickerField
              id="req-create-tempo-limite"
              value={formatDateInput(tempoLimite)}
              onChange={(value) => {
                setTempoLimite(parseDateInput(value));
                setTempoLimiteManuallyEdited(true);
              }}
              placeholder="Selecionar data"
              buttonClassName="mt-1"
            />
            {tipo === 'TRANSPORTE' && !tempoLimiteManuallyEdited && dataSaida && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Preenchida automaticamente para o dia anterior a saida.</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="req-create-descricao" className="text-sm text-gray-600 dark:text-gray-300">Descrição</label>
          <Textarea
            id="req-create-descricao"
            className={getFieldClassName(textareaFieldClassName, 'descricao')}
            value={descricao}
            onChange={(e) => {
              setDescricao(e.target.value);
              if (createTouched.descricao) {
                validateAndSetField('descricao');
              }
            }}
            onBlur={() => validateAndSetField('descricao', true)}
            placeholder="Descreva a requisição"
          />
          {createErrors.descricao && <p className="text-red-500 text-xs mt-1">{createErrors.descricao}</p>}
        </div>
      </div>

      <div className="rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white/95 dark:bg-gray-900/85 p-4 space-y-4">
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
                          <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                            {itemsCategoria.map((item) => {
                              const hasPendingSelection = expandedMaterialItems[item.itemKey] === true;
                              const selectedCount = item.variantes.filter((variante) =>
                                materialLinhas.some((linha) => linha.materialId === String(variante.id)),
                              ).length;
                              const itemChecked = selectedCount > 0 || hasPendingSelection;
                              const isExpanded = itemChecked && expandedMaterialItems[item.itemKey] !== false;
                              const safeItemKey = encodeURIComponent(item.itemKey);

                              return (
                                <div key={item.itemKey} className="space-y-2 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                      <div className="flex flex-1 min-w-0 items-center gap-2 rounded-md px-1 py-1 -mx-1">
                                        <Checkbox
                                          id={`item-toggle-${safeItemKey}`}
                                          checked={itemChecked}
                                          onCheckedChange={(checked) => handleItemToggle(item, !!checked)}
                                        />
                                        <label
                                          htmlFor={`item-toggle-${safeItemKey}`}
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
                                                <label htmlFor={`qtd-variante-${variante.id}`} className="text-xs text-gray-500 dark:text-gray-400">Qtd</label>
                                                <Input
                                                  id={`qtd-variante-${variante.id}`}
                                                  type="number"
                                                  min="1"
                                                  className={quantityFieldClassName}
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

              {createErrors.materialItens && (
                <p className="text-red-500 text-xs">{createErrors.materialItens}</p>
              )}
            </div>
          )}

          {tipo === 'TRANSPORTE' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 p-4 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Planeamento da deslocação</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Preenche o percurso e a ocupação prevista para sugerir automaticamente a frota mais adequada.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="req-create-transporte-destino" className="text-sm text-gray-600 dark:text-gray-300">Destino</label>
                    <Input
                      id="req-create-transporte-destino"
                      className={getFieldClassName(inputFieldClassName, 'destino')}
                      value={destinoTransporte}
                      onChange={(e) => {
                        setDestinoTransporte(e.target.value);
                        if (createTouched.destino) {
                          validateAndSetField('destino');
                        }
                      }}
                      onBlur={() => validateAndSetField('destino', true)}
                      placeholder="Ex: Porto, Casa da Música"
                    />
                    {createErrors.destino && <p className="text-red-500 text-xs mt-1">{createErrors.destino}</p>}
                  </div>

                  <div>
                    <label htmlFor="req-create-transporte-condutor" className="text-sm text-gray-600 dark:text-gray-300">Condutor (opcional)</label>
                    <Input
                      id="req-create-transporte-condutor"
                      className={inputFieldClassName}
                      value={condutorTransporte}
                      onChange={(e) => setCondutorTransporte(e.target.value)}
                      placeholder="Ex: Motorista interno ou a definir"
                    />
                  </div>

                  <div onBlurCapture={() => validateAndSetField('dataSaida', true)}>
                    <label htmlFor="req-create-transporte-data-saida" className="text-sm text-gray-600 dark:text-gray-300">Data de saida</label>
                    <DatePickerField
                      id="req-create-transporte-data-saida"
                      value={dataSaida}
                      onChange={(value) => {
                        setDataSaida(value);
                        if (!dataRegresso) {
                          setDataRegresso(value);
                        }
                        if (createTouched.dataSaida) {
                          validateAndSetField('dataSaida');
                        }
                        if (createTouched.dataRegresso) {
                          validateAndSetField('dataRegresso');
                        }
                      }}
                      buttonClassName={`mt-1 ${createErrors.dataSaida ? 'border-red-500' : ''}`}
                    />
                    {createErrors.dataSaida && <p className="text-red-500 text-xs mt-1">{createErrors.dataSaida}</p>}
                  </div>

                  <div>
                    <label htmlFor="req-create-transporte-hora-saida" className="text-sm text-gray-600 dark:text-gray-300">Hora de saida</label>
                    <Input
                      id="req-create-transporte-hora-saida"
                      type="time"
                      className={getFieldClassName(inputFieldClassName, 'horaSaida')}
                      value={horaSaida}
                      onChange={(e) => {
                        setHoraSaida(e.target.value);
                        if (createTouched.horaSaida) {
                          validateAndSetField('horaSaida');
                        }
                      }}
                      onBlur={() => validateAndSetField('horaSaida', true)}
                    />
                    {createErrors.horaSaida && <p className="text-red-500 text-xs mt-1">{createErrors.horaSaida}</p>}
                  </div>

                  <div onBlurCapture={() => validateAndSetField('dataRegresso', true)}>
                    <label htmlFor="req-create-transporte-data-regresso" className="text-sm text-gray-600 dark:text-gray-300">Data de regresso</label>
                    <DatePickerField
                      id="req-create-transporte-data-regresso"
                      value={dataRegresso}
                      onChange={(value) => {
                        setDataRegresso(value);
                        if (createTouched.dataRegresso) {
                          validateAndSetField('dataRegresso');
                        }
                        if (createTouched.horaRegresso) {
                          validateAndSetField('horaRegresso');
                        }
                      }}
                      buttonClassName={`mt-1 ${createErrors.dataRegresso ? 'border-red-500' : ''}`}
                    />
                    {createErrors.dataRegresso && <p className="text-red-500 text-xs mt-1">{createErrors.dataRegresso}</p>}
                  </div>

                  <div>
                    <label htmlFor="req-create-transporte-hora-regresso" className="text-sm text-gray-600 dark:text-gray-300">Hora de regresso</label>
                    <Input
                      id="req-create-transporte-hora-regresso"
                      type="time"
                      className={getFieldClassName(inputFieldClassName, 'horaRegresso')}
                      value={horaRegresso}
                      onChange={(e) => {
                        setHoraRegresso(e.target.value);
                        if (createTouched.horaRegresso) {
                          validateAndSetField('horaRegresso');
                        }
                      }}
                      onBlur={() => validateAndSetField('horaRegresso', true)}
                    />
                    {createErrors.horaRegresso && <p className="text-red-500 text-xs mt-1">{createErrors.horaRegresso}</p>}
                  </div>

                  <div>
                    <label htmlFor="req-create-transporte-passageiros" className="text-sm text-gray-600 dark:text-gray-300">Número de passageiros</label>
                    <Input
                      id="req-create-transporte-passageiros"
                      type="number"
                      min="1"
                      className={getFieldClassName(inputFieldClassName, 'numeroPassageiros')}
                      value={numeroPassageiros}
                      onChange={(e) => {
                        setNumeroPassageiros(e.target.value);
                        if (createTouched.numeroPassageiros) {
                          validateAndSetField('numeroPassageiros');
                        }
                      }}
                      onBlur={() => validateAndSetField('numeroPassageiros', true)}
                      placeholder="Ex: 14"
                    />
                    {createErrors.numeroPassageiros && <p className="text-red-500 text-xs mt-1">{createErrors.numeroPassageiros}</p>}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Viaturas sugeridas e selecionadas</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Podes manter a sugestão automática ou ajustar manualmente a combinação de viaturas.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={handleAplicarSugestaoTransporte}>
                      Aplicar sugestão
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-3 bg-gray-50/80 dark:bg-gray-800/50">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Modo de seleção</p>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">{transportSelectionMode === 'auto' ? 'Automático' : 'Manual'}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-3 bg-gray-50/80 dark:bg-gray-800/50">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Capacidade para passageiros</p>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">{selectedTransportesCapacidade} lugares</p>
                  </div>
                  <div className={`rounded-lg border px-3 py-3 ${lugaresEmFalta > 0
                    ? 'border-amber-300 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/20'
                    : 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                    }`}>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Cobertura</p>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
                      {passageirosSolicitados > 0
                        ? lugaresEmFalta > 0
                          ? `Faltam ${lugaresEmFalta} lugar(es)`
                          : 'Lotação suficiente'
                        : 'Indica os passageiros'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">A lotacao util considera 1 lugar para o condutor em cada viatura.</p>

                {createErrors.transporteIds && (
                  <p className="text-red-500 text-xs">{createErrors.transporteIds}</p>
                )}

                {selectedTransportIds.length > 0 && (
                  <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/20 p-4 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Seleção atual</p>
                    <div className="space-y-2">
                      {selectedTransportes.map((transporte) => (
                        <div key={transporte.id} className="flex items-center justify-between gap-3 text-sm">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{formatVehicleTitle(transporte)}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Lotacao: {formatLotacao(transporte.lotacao)}</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 px-3"
                            onClick={() => toggleSelectedTransport(transporte.id, false)}
                          >
                            Remover
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {loadingCatalogo ? (
                  <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-6 text-sm text-gray-500 dark:text-gray-400">
                    A carregar viaturas disponíveis...
                  </div>
                ) : transportesPorCategoria.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-6 text-sm text-gray-500 dark:text-gray-400">
                    Ainda não existem viaturas em catálogo.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transportesPorCategoria.map((grupo) => (
                      <div key={grupo.categoria} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                        <button
                          type="button"
                          onClick={() => toggleTransporteCategoriaExpansion(grupo.categoria)}
                          className="w-full px-4 py-3 flex items-center justify-between text-left"
                        >
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            {grupo.label}
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{grupo.items.length} viatura(s)</span>
                          </p>
                          {expandedTransporteCategorias[grupo.categoria] ? (
                            <ChevronUp className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          )}
                        </button>

                        {expandedTransporteCategorias[grupo.categoria] && (
                          <div className="px-3 pb-3 grid grid-cols-1 xl:grid-cols-2 gap-3">
                            {grupo.items.map((transporte) => {
                              const isSelected = selectedTransportIds.includes(String(transporte.id));
                              const isRecommended = recommendedTransportIds.includes(transporte.id);
                              const detailsOpen = expandedTransporteDetalhes[transporte.id] === true;

                              return (
                                <div
                                  key={transporte.id}
                                  className={`rounded-xl border p-4 transition-all ${isSelected
                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 shadow-sm'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                                    }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${isSelected
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                          }`}>
                                          {transporte.codigo ?? `#${transporte.id}`}
                                        </span>
                                        {isRecommended && (
                                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                            Sugerida
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatVehicleTitle(transporte)}</p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">Lotacao: {formatLotacao(transporte.lotacao)}</p>
                                    </div>
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => {
                                        toggleSelectedTransport(transporte.id, !!checked);
                                        validateAndSetField('transporteIds', true);
                                      }}
                                    />
                                  </div>

                                  <div className="mt-3">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="h-8 px-3 text-xs"
                                      onClick={() => toggleTransporteDetalhes(transporte.id)}
                                    >
                                      {detailsOpen ? 'Ocultar detalhes' : 'Detalhes'}
                                    </Button>
                                  </div>

                                  {detailsOpen && (
                                    <div className="mt-3 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                      <p>{formatTransporteCategoria(transporte.categoria)}</p>
                                      <p>Matricula: {transporte.matricula ?? 'Sem matricula'}</p>
                                      <p>Marca/Modelo: {[transporte.marca, transporte.modelo].filter(Boolean).join(' ') || 'Nao definido'}</p>
                                      <p>Data matricula: {transporte.dataMatricula ? new Date(transporte.dataMatricula).toLocaleDateString('pt-PT') : 'Nao definida'}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tipo === 'MANUTENCAO' && (
            <div>
              <label htmlFor="req-create-assunto" className="text-sm text-gray-600 dark:text-gray-300">Assunto (opcional)</label>
              <Input id="req-create-assunto" className={inputFieldClassName} type="text" value={assunto} onChange={(e) => setAssunto(e.target.value)} placeholder="Ex: Torneira com fuga" />
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
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <GlassCard className="hidden md:block p-0 overflow-hidden">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleCardShortcut('GERAL')}
            className="w-full h-full p-4 justify-between rounded-none hover:bg-gray-50 dark:hover:bg-gray-800"
            aria-label="Ir para requisições gerais"
          >
            <div className="text-left">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Requisições</p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <ClipboardListIcon className="w-5 h-5 text-blue-700 dark:text-blue-300" />
            </div>
          </Button>
        </GlassCard>

        <GlassCard className="hidden md:block p-0 overflow-hidden">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleCardShortcut('URGENTE')}
            className="w-full h-full p-4 justify-between rounded-none hover:bg-gray-50 dark:hover:bg-gray-800"
            aria-label="Ir para requisições urgentes"
          >
            <div className="text-left">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Urgentes</p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">{stats.urgentes}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangleIcon className="w-5 h-5 text-red-700 dark:text-red-300" />
            </div>
          </Button>
        </GlassCard>

        <GlassCard className="hidden xl:block p-0 overflow-hidden">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleCardShortcut('MATERIAL')}
            className="w-full h-full p-4 justify-between rounded-none hover:bg-gray-50 dark:hover:bg-gray-800"
            aria-label="Ir para requisições de material"
          >
            <div className="text-left">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Material</p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">{stats.material}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <PackageIcon className="w-5 h-5 text-indigo-700 dark:text-indigo-300" />
            </div>
          </Button>
        </GlassCard>

        <GlassCard className="hidden xl:block p-0 overflow-hidden">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleCardShortcut('MANUTENCAO')}
            className="w-full h-full p-4 justify-between rounded-none hover:bg-gray-50 dark:hover:bg-gray-800"
            aria-label="Ir para requisições de manutenção"
          >
            <div className="text-left">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Manutenção</p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">{stats.manutencao}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <WrenchIcon className="w-5 h-5 text-amber-700 dark:text-amber-300" />
            </div>
          </Button>
        </GlassCard>

        <GlassCard className="p-0 overflow-hidden">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleCardShortcut('TRANSPORTE')}
            className="w-full h-full p-4 justify-between rounded-none hover:bg-gray-50 dark:hover:bg-gray-800"
            aria-label="Ir para requisições de transporte"
          >
            <div className="text-left">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Transportes</p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">{stats.transporte}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <TruckIcon className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
            </div>
          </Button>
        </GlassCard>
      </div>

      <div className="lg:hidden space-y-6">
        <GlassCard className="w-full p-0 overflow-hidden border border-gray-300 dark:border-gray-700">
          <button
            type="button"
            onClick={() => toggleSection('create')}
            className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
            aria-label="Alternar secção Nova requisição"
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

        <GlassCard className="w-full p-0 overflow-hidden border border-gray-300 dark:border-gray-700">
          <button
            type="button"
            onClick={() => toggleSection('list')}
            className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
            aria-label="Alternar secção Requisições"
          >
            <div className="text-left">
              <h2 className={`text-xl font-semibold ${headingClass}`}>Requisições</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{summaryText}</p>
            </div>
            {activeSection === 'list' ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
          </button>

          {activeSection === 'list' && (
            <div className="px-5 pb-5 space-y-4">

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de listagem</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/60 p-2" role="tablist" aria-label="Separadores de tipo de requisição">
            {REQUISICOES_TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <Button
                  key={tab.value}
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    void handleSelectTab(tab.value);
                  }}
                  className={`h-10 w-full justify-center rounded-lg border transition-all duration-200 ${isActive
                    ? 'border-purple-500 bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 shadow-sm'
                    : 'border-transparent bg-transparent text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-white/80 dark:hover:bg-gray-800/70'
                    }`}
                  aria-pressed={isActive}
                  aria-label={`Selecionar ${tab.label}`}
                >
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label htmlFor="req-filter-estado" className="text-sm text-gray-600 dark:text-gray-300">Estado</label>
            <select
              id="req-filter-estado"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value as RequisicaoEstado | '')}
              className={selectFieldClassName}
            >
              {ESTADO_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="req-filter-prioridade" className="text-sm text-gray-600 dark:text-gray-300">Prioridade</label>
            <select
              id="req-filter-prioridade"
              value={filterPrioridade}
              onChange={(e) => setFilterPrioridade(e.target.value as RequisicaoPrioridade | '')}
              className={selectFieldClassName}
            >
              <option value="">Todas as prioridades</option>
              {PRIORIDADE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="req-filter-criado-por" className="text-sm text-gray-600 dark:text-gray-300">Criado por nome</label>
            <Input id="req-filter-criado-por" className={inputFieldClassName} type="text" value={filterCriadoPorNome} onChange={(e) => setFilterCriadoPorNome(e.target.value)} placeholder="Ex: Maria" />
          </div>

          <div>
            <label htmlFor="req-filter-gerido-por" className="text-sm text-gray-600 dark:text-gray-300">Gerido por nome</label>
            <Input id="req-filter-gerido-por" className={inputFieldClassName} type="text" value={filterGeridoPorNome} onChange={(e) => setFilterGeridoPorNome(e.target.value)} placeholder="Ex: João" />
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
              <div key={req.id} className="rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 p-4 space-y-2">
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
                  {req.tipo === 'TRANSPORTE' && (
                    <>
                      <p>Destino: {req.destino || '—'}</p>
                      <p>Passageiros: {req.numeroPassageiros || '—'}</p>
                      <p>Viaturas: {formatTransporteCollection(req)}</p>
                    </>
                  )}
                  {req.tipo === 'MANUTENCAO' && <p>Assunto: {req.assunto || '—'}</p>}
                </div>

              </div>
            ))}
          </div>
        )}
            </div>
          )}
        </GlassCard>
      </div>

      <div className="hidden lg:flex gap-6 items-stretch">
        <GlassCard className={`p-0 overflow-hidden border border-gray-300 dark:border-gray-700 transition-all duration-300 ${activeSection === 'create' ? 'w-3/5' : 'w-full'}`}>
          <div className="px-5 py-5 border-b border-gray-200 dark:border-gray-800">
            <h2 className={`text-xl font-semibold ${headingClass}`}>Requisições</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{summaryText}</p>
          </div>

          <div className="px-5 pb-5 pt-4 space-y-4">

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de listagem</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/60 p-2" role="tablist" aria-label="Separadores de tipo de requisição">
            {REQUISICOES_TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <Button
                  key={tab.value}
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    void handleSelectTab(tab.value);
                  }}
                  className={`h-10 w-full justify-center rounded-lg border transition-all duration-200 ${isActive
                    ? 'border-purple-500 bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 shadow-sm'
                    : 'border-transparent bg-transparent text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-white/80 dark:hover:bg-gray-800/70'
                    }`}
                  aria-pressed={isActive}
                  aria-label={`Selecionar ${tab.label}`}
                >
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label htmlFor="req-filter-estado-desktop" className="text-sm text-gray-600 dark:text-gray-300">Estado</label>
            <select
              id="req-filter-estado-desktop"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value as RequisicaoEstado | '')}
              className={selectFieldClassName}
            >
              {ESTADO_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="req-filter-prioridade-desktop" className="text-sm text-gray-600 dark:text-gray-300">Prioridade</label>
            <select
              id="req-filter-prioridade-desktop"
              value={filterPrioridade}
              onChange={(e) => setFilterPrioridade(e.target.value as RequisicaoPrioridade | '')}
              className={selectFieldClassName}
            >
              <option value="">Todas as prioridades</option>
              {PRIORIDADE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="req-filter-criado-por-desktop" className="text-sm text-gray-600 dark:text-gray-300">Criado por nome</label>
            <Input id="req-filter-criado-por-desktop" className={inputFieldClassName} type="text" value={filterCriadoPorNome} onChange={(e) => setFilterCriadoPorNome(e.target.value)} placeholder="Ex: Maria" />
          </div>

          <div>
            <label htmlFor="req-filter-gerido-por-desktop" className="text-sm text-gray-600 dark:text-gray-300">Gerido por nome</label>
            <Input id="req-filter-gerido-por-desktop" className={inputFieldClassName} type="text" value={filterGeridoPorNome} onChange={(e) => setFilterGeridoPorNome(e.target.value)} placeholder="Ex: João" />
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {requisicoes.map((req) => (
              <div key={req.id} className="rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 p-4 space-y-2">
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
                  {req.tipo === 'TRANSPORTE' && (
                    <>
                      <p>Destino: {req.destino || '—'}</p>
                      <p>Passageiros: {req.numeroPassageiros || '—'}</p>
                      <p>Viaturas: {formatTransporteCollection(req)}</p>
                    </>
                  )}
                  {req.tipo === 'MANUTENCAO' && <p>Assunto: {req.assunto || '—'}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

          </div>
        </GlassCard>

        <GlassCard className={`p-0 overflow-hidden border border-gray-300 dark:border-gray-700 transition-all duration-300 ${activeSection === 'create' ? 'w-2/5 opacity-100' : 'w-[160px] opacity-100'}`}>
          <button
            type="button"
            onClick={() => toggleSection('create')}
            className={`w-full transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/50 ${activeSection === 'create'
              ? 'flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800'
              : 'h-full min-h-[560px] px-3 py-6 flex flex-col items-center justify-center gap-3'
              }`}
            aria-label="Alternar secção Nova requisição"
          >
            {activeSection === 'create' ? (
              <>
                <div className="text-left">
                  <h2 className={`text-lg font-semibold ${headingClass}`}>Nova requisição</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Painel de criação</p>
                </div>
                <ChevronUp className="w-5 h-5 text-gray-500" />
              </>
            ) : (
              <>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Criar</span>
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              </>
            )}
          </button>

          {activeSection === 'create' && (
            <div className="px-4 pb-4 pt-3">
              {createFormContent}
            </div>
          )}
        </GlassCard>
      </div>

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
                      <p className="text-gray-500 dark:text-gray-400">Destino</p>
                      <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.destino || '—'}</p>

                      <p className="text-gray-500 dark:text-gray-400">Saída</p>
                      <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.dataHoraSaida ? new Date(selectedRequisicao.dataHoraSaida).toLocaleString('pt-PT') : '—'}</p>

                      <p className="text-gray-500 dark:text-gray-400">Regresso</p>
                      <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.dataHoraRegresso ? new Date(selectedRequisicao.dataHoraRegresso).toLocaleString('pt-PT') : '—'}</p>

                      <p className="text-gray-500 dark:text-gray-400">Passageiros</p>
                      <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.numeroPassageiros || '—'}</p>

                      <p className="text-gray-500 dark:text-gray-400">Condutor</p>
                      <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.condutor || 'A definir'}</p>

                      <p className="text-gray-500 dark:text-gray-400">Viaturas</p>
                      <div className="space-y-2">
                        {getRequisicaoTransportes(selectedRequisicao).length > 0 ? getRequisicaoTransportes(selectedRequisicao).map((transporte) => (
                          <div key={`${transporte.id}-${transporte.codigo ?? 'sem-codigo'}`} className="space-y-1">
                            <p className="text-gray-900 dark:text-gray-100">{formatTransporteDisplay(transporte)}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatTransporteMeta(transporte)}</p>
                          </div>
                        )) : (
                          <p className="text-gray-900 dark:text-gray-100">—</p>
                        )}
                      </div>
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
                  className={selectFieldClassName}
                >
                  {ESTADO_SECRETARIA_OPTIONS.map((option) => (
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
              <Input id="novo-material-nome" className={inputFieldClassName} value={novoMaterialNome} onChange={(e) => setNovoMaterialNome(e.target.value)} placeholder="Ex: Luvas" />
            </div>
            <div>
              <label htmlFor="novo-material-descricao" className="text-sm text-gray-600 dark:text-gray-300">Descrição (opcional)</label>
              <Textarea id="novo-material-descricao" className={textareaFieldClassName} value={novoMaterialDescricao} onChange={(e) => setNovoMaterialDescricao(e.target.value)} placeholder="Descrição do material" />
            </div>
            <div>
              <label htmlFor="novo-material-categoria" className="text-sm text-gray-600 dark:text-gray-300">Categoria</label>
              <select
                id="novo-material-categoria"
                value={novoMaterialCategoria}
                onChange={(e) => setNovoMaterialCategoria(e.target.value as MaterialCategoria)}
                className={selectFieldClassName}
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
                  className={inputFieldClassName}
                  value={novoMaterialAtributo}
                  onChange={(e) => setNovoMaterialAtributo(e.target.value)}
                  placeholder="Ex: Cor, Tipo, Tamanho"
                />
              </div>
              <div>
                <label htmlFor="novo-material-valor-atributo" className="text-sm text-gray-600 dark:text-gray-300">Valor do atributo</label>
                <Input
                  id="novo-material-valor-atributo"
                  className={inputFieldClassName}
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
    </div>
  );
}
