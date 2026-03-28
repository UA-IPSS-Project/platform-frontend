import i18n from '../../i18n';
import { formatDateInput, parseDateInput } from '../../components/ui/date-picker-field';
import {
  ManutencaoCategoria,
  MaterialCategoria,
  MaterialCatalogo,
  RequisicaoEstado,
  RequisicaoPrioridade,
  RequisicaoResponse,
  RequisicaoTipo,
  TransporteCatalogo,
  TransporteCategoria,
} from '../../services/api';


export const ESTADO_OPTIONS: Array<{ value: RequisicaoEstado | ''; label: string }> = [
  { value: '', label: 'requisitions.labels.allStatuses' },
  { value: 'ABERTO', label: 'requisitions.labels.open' },
  { value: 'EM_PROGRESSO', label: 'requisitions.labels.inProgress' },
  { value: 'FECHADO', label: 'requisitions.labels.closed' },
];

export const ESTADO_SECRETARIA_OPTIONS: Array<{ value: RequisicaoEstado; label: string }> = [
  { value: 'ABERTO', label: 'requisitions.labels.open' },
  { value: 'EM_PROGRESSO', label: 'requisitions.labels.inProgress' },
  { value: 'FECHADO', label: 'requisitions.labels.closed' },
];

export const getEstadosPermitidosTransicao = (estadoAtual?: RequisicaoEstado): RequisicaoEstado[] => {
  if (estadoAtual === 'ABERTO') {
    return ['EM_PROGRESSO', 'FECHADO'];
  }
  if (estadoAtual === 'EM_PROGRESSO') {
    return ['FECHADO'];
  }
  return [];
};

export const getEstadosVisiveisNoSeletor = (estadoAtual?: RequisicaoEstado): RequisicaoEstado[] => {
  if (estadoAtual === 'ABERTO') {
    return ['ABERTO', 'EM_PROGRESSO', 'FECHADO'];
  }
  if (estadoAtual === 'EM_PROGRESSO') {
    return ['FECHADO'];
  }
  if (estadoAtual) {
    return [estadoAtual];
  }
  return ['ABERTO', 'EM_PROGRESSO', 'FECHADO'];
};

export const PRIORIDADE_OPTIONS: Array<{ value: RequisicaoPrioridade; label: string }> = [
  { value: 'BAIXA', label: 'requisitions.labels.low' },
  { value: 'MEDIA', label: 'requisitions.labels.medium' },
  { value: 'ALTA', label: 'requisitions.labels.high' },
  { value: 'URGENTE', label: 'requisitions.labels.urgent' },
];

export const TIPO_OPTIONS: Array<{ value: RequisicaoTipo; label: string }> = [
  { value: 'MATERIAL', label: 'requisitions.labels.material' },
  { value: 'TRANSPORTE', label: 'requisitions.labels.transport' },
  { value: 'MANUTENCAO', label: 'requisitions.labels.maintenance' },
];

export type RequisicoesTab = 'GERAL' | RequisicaoTipo | 'URGENTE';

export type RequisicaoConflito = {
  id: number;
  criadoPorNome: string;
  criadoEm?: string;
};

export type ConflitoDialogMode = 'warning' | 'blocked';

export const REQUISICOES_TABS: Array<{ value: RequisicoesTab; label: string }> = [
  { value: 'GERAL', label: 'requisitions.labels.general' },
  { value: 'MATERIAL', label: 'requisitions.labels.material' },
  { value: 'MANUTENCAO', label: 'requisitions.labels.maintenance' },
  { value: 'TRANSPORTE', label: 'requisitions.labels.transport' },
  { value: 'URGENTE', label: 'requisitions.labels.urgent' },
];

export const TRANSPORTE_CATEGORIA_OPTIONS: Array<{ value: TransporteCategoria; label: string }> = [
  { value: 'PESADO_DE_PASSAGEIROS', label: 'requisitions.labels.transportCategoryHeavyPassengers' },
  { value: 'LIGEIRO_DE_PASSAGEIROS', label: 'requisitions.labels.transportCategoryLightPassengers' },
  { value: 'LIGEIRO_DE_MERCADORIAS', label: 'requisitions.labels.transportCategoryLightGoods' },
  { value: 'LIGEIRO_ESPECIAL', label: 'requisitions.labels.transportCategoryLightSpecial' },
  { value: 'ADAPTADO', label: 'requisitions.labels.transportCategoryAdapted' },
  { value: 'LIGEIRO', label: 'requisitions.labels.transportCategoryLight' },
  { value: 'PESADO', label: 'requisitions.labels.transportCategoryHeavy' },
  { value: 'PASSAGEIROS', label: 'requisitions.labels.passengers' },
];

// NOTE: 'OUTROS' exclusivamente para retrocompatibilidade com dados históricos.
// Novos materiais devem usar apenas as categorias abaixo. A criação de novos materiais não oferece 'OUTROS' como opção.
export const MATERIAL_CATEGORIA_OPTIONS: Array<{ value: MaterialCategoria; label: string }> = [
  { value: 'ESCRITA', label: 'requisitions.labels.materialCategoryWriting' },
  { value: 'PAPEL_E_ARQUIVO', label: 'requisitions.labels.materialCategoryPaperFiling' },
  { value: 'HIGIENE_E_LIMPEZA', label: 'requisitions.labels.materialCategoryHygieneCleaning' },
  { value: 'TECNOLOGIA', label: 'requisitions.labels.materialCategoryTechnology' },
];

export const MANUTENCAO_CATEGORIA_OPTIONS: Array<{ value: ManutencaoCategoria; label: string }> = [
  { value: 'CATL', label: 'requisitions.labels.maintenanceCategoryCATL' },
  { value: 'RC', label: 'requisitions.labels.maintenanceCategoryRC' },
  { value: 'PRE_ESCOLAR', label: 'requisitions.labels.maintenanceCategoryPreschool' },
  { value: 'CRECHE', label: 'requisitions.labels.maintenanceCategoryDaycare' },
];

export const MANUTENCAO_CATEGORIA_ORDER: ManutencaoCategoria[] = ['CATL', 'RC', 'PRE_ESCOLAR', 'CRECHE'];

export const MANUTENCAO_CATEGORIA_DISPLAY_LABELS: Record<ManutencaoCategoria, string> = {
  CATL: 'CATL',
  RC: 'R/C',
  PRE_ESCOLAR: 'Pré Escolar',
  CRECHE: 'Crech',
};

export const MANUTENCAO_ESPACOS_POR_CATEGORIA: Record<ManutencaoCategoria, string[]> = {
  CATL: [
    'WC masculino',
    'WC feminino',
    'Salão',
    'Salão (palco)',
  ],
  RC: [
    'Parque exterior',
    'Relvado',
    'Acolhimento pré',
    'Acolhimento creche',
    'Gabinete',
    'WC deficientes',
    'WC Rosa',
    'WC azul',
    'Gabinete médico',
    'Oficina',
    'Corredor + WC',
    'Biblioteca',
    'Refeitório',
    'Lavatórios + Hall',
    'Elevador',
    'Escadas acesso 1º',
  ],
  PRE_ESCOLAR: [
    'Sala acolhimento',
    'Sala de educadoras',
    'WC deficientes',
    'WC azul',
    'WC cor de rosa',
    'Hall',
    'Escadas acesso 2º',
    'Corredor',
    'Sala Amarela',
    'Sala Azul',
    'Sala Verde',
    'Sala Arco-Íris',
    'WC',
    'Parque exterior',
  ],
  CRECHE: [
    'Parque ext. 3º andar',
    'S. Acolhimento grande',
    'S. Acollhimento peq.',
    'WC',
    'WC azul',
    'Corredor e hall',
    'Escadas acesso sotão',
    'Sala Amarela limão',
    'Sala Verde Alface',
    'Sala Vermelha',
    'Refeitório',
    'Copa',
    'Fraldário',
    'Sala azul turquesa',
    'Berçário',
  ],
};

export const MANUTENCAO_VERIFICACOES_ORDEM = [
  'Alumínios',
  'Blackouts',
  'Madeiras',
  'Armários',
  'Aquecedores',
  'Torneiras',
  'Eletricidade',
  'Cabides',
  'Paredes',
  'Tetos',
  'Chão',
] as const;

export const formatTipo = (tipo: RequisicaoTipo) => {
  const key = TIPO_OPTIONS.find((option) => option.value === tipo)?.label;
  return key ? i18n.t(key) : tipo;
};
export const formatPrioridade = (prioridade: RequisicaoPrioridade) => {
  const key = PRIORIDADE_OPTIONS.find((option) => option.value === prioridade)?.label;
  return key ? i18n.t(key) : prioridade;
};
export const formatEstado = (estado: RequisicaoEstado) => {
  const key = ESTADO_OPTIONS.find((option) => option.value === estado)?.label;
  return key ? i18n.t(key) : estado;
};
export const formatMaterialCategoria = (categoria?: MaterialCategoria | string) => {
  if (!categoria) return i18n.t('requisitions.labels.noCategory');
  const option = MATERIAL_CATEGORIA_OPTIONS.find((opt) => opt.value === categoria);
  if (option) return i18n.t(option.label);
  return categoria.replace(/_/g, ' ').toUpperCase();
};

export const formatManutencaoCategoria = (categoria?: ManutencaoCategoria | string) => {
  if (!categoria) return i18n.t('requisitions.labels.noCategory');
  const option = MANUTENCAO_CATEGORIA_OPTIONS.find((opt) => opt.value === categoria);
  if (option) return i18n.t(option.label);
  return categoria.replace(/_/g, ' ').toUpperCase();
};

export const formatManutencaoCategoriaDisplay = (categoria?: ManutencaoCategoria | string) => {
  if (!categoria) return i18n.t('requisitions.labels.noCategory');
  const typed = categoria as ManutencaoCategoria;
  return MANUTENCAO_CATEGORIA_DISPLAY_LABELS[typed] ?? categoria;
};
export const formatTransporteCategoria = (categoria?: TransporteCategoria | string) => {
  if (!categoria) return i18n.t('requisitions.labels.noCategory');
  const option = TRANSPORTE_CATEGORIA_OPTIONS.find((opt) => opt.value === categoria);
  if (option) return i18n.t(option.label);
  return categoria.replace(/_/g, ' ').toUpperCase();
};

export const toIsoFromDateOnly = (date?: Date): string | undefined => {
  if (!date) return undefined;
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)).toISOString();
};

export const formatMaterialItemLabel = (
  material?: { id: number; nome?: string; categoria?: MaterialCategoria; atributo?: string; valorAtributo?: string },
  quantidade?: number,
): string => {
  const materialLabel = material?.nome ?? (material?.id ? `#${material.id}` : i18n.t('requisitions.labels.material'));
  const detalhe = material?.atributo && material?.valorAtributo
    ? ` - ${material.atributo}: ${material.valorAtributo}`
    : '';
  const categoria = material?.categoria ? ` [${formatMaterialCategoria(material.categoria)}]` : '';
  return `${materialLabel}${categoria}${detalhe} (x${quantidade ?? 0})`;
};

export type RequisicaoItem = NonNullable<RequisicaoResponse['itens']>[number];
export type RequisicaoTransporteItem = NonNullable<RequisicaoResponse['transportes']>[number];
export type TransporteResumo = RequisicaoTransporteItem['transporte'];
export type TransporteLike = RequisicaoResponse['transporte'] | TransporteResumo | TransporteCatalogo | null | undefined;
export type TransporteSelectionMode = 'auto' | 'manual';
export type CreateField =
  | 'descricao'
  | 'tempoLimite'
  | 'materialItens'
  | 'destino'
  | 'dataSaida'
  | 'horaSaida'
  | 'dataRegresso'
  | 'horaRegresso'
  | 'numeroPassageiros'
  | 'transporteIds'
  | 'manutencaoItens';

export const createEmptyMaterialLinha = () => ({
  rowId:
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? `material-row-${crypto.randomUUID()}`
      : `material-row-${Math.random().toString(36).slice(2)}`,
  materialId: '',
  quantidade: '1',
});

export const normalizarTexto = (valor?: string | null) => (valor ?? '').trim().toLowerCase();

export const getPassengerCapacity = (lotacao?: number): number => {
  if (!lotacao || lotacao <= 0) return 0;
  return Math.max(0, lotacao - 1);
};

export const composeDateTime = (date?: string, time?: string): string | undefined => {
  if (!date || !time) return undefined;
  const parsedDate = parseDateInput(date) ?? (() => {
    const fallback = new Date(date);
    return Number.isNaN(fallback.getTime()) ? undefined : fallback;
  })();

  if (!parsedDate) return undefined;

  const timeParts = time.split(':');
  if (timeParts.length < 2) return undefined;
  const hours = Number(timeParts[0]);
  const minutes = Number(timeParts[1]);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return undefined;
  }

  const normalized = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), hours, minutes, 0, 0);
  const yyyy = normalized.getFullYear();
  const mm = String(normalized.getMonth() + 1).padStart(2, '0');
  const dd = String(normalized.getDate()).padStart(2, '0');
  const hh = String(normalized.getHours()).padStart(2, '0');
  const min = String(normalized.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

export const isDateInputInPast = (dateInput?: string): boolean => {
  const parsed = parseDateInput(dateInput);
  if (!parsed) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed < today;
};

export const toValidDate = (dateTime?: string): Date | undefined => {
  if (!dateTime) return undefined;
  const parsed = new Date(dateTime);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export const periodsOverlap = (
  startA?: string,
  endA?: string,
  startB?: string,
  endB?: string,
): boolean => {
  const startADate = toValidDate(startA);
  const endADate = toValidDate(endA);
  const startBDate = toValidDate(startB);
  const endBDate = toValidDate(endB);

  if (!startADate || !endADate || !startBDate || !endBDate) return false;
  return startADate < endBDate && endADate > startBDate;
};

export const previousDateInput = (dateInput?: string): string | undefined => {
  const parsed = parseDateInput(dateInput);
  if (!parsed) return undefined;
  const prev = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate() - 1);
  return formatDateInput(prev);
};

export const formatLotacao = (lotacao?: number): string => {
  if (!lotacao || lotacao <= 0) return i18n.t('requisitions.labels.capacityNotDefined');
  return `${lotacao} ${lotacao === 1 ? i18n.t('requisitions.labels.seat') : i18n.t('requisitions.labels.seats')}`;
};

export const formatVehicleTitle = (transporte?: TransporteLike): string => {
  const nome = transporte && 'nome' in transporte ? transporte.nome : undefined;
  return (nome || transporte?.tipo || i18n.t('requisitions.labels.vehicle')).trim();
};

export const formatTransporteDisplay = (transporte?: TransporteLike): string => {
  if (!transporte) return i18n.t('requisitions.labels.noAssociatedTransport');

  const parts = [
    transporte.codigo ?? (transporte.id ? `#${transporte.id}` : undefined),
    formatVehicleTitle(transporte),
    transporte.matricula,
  ].filter(Boolean);

  return parts.join(' · ');
};

export const formatTransporteMeta = (transporte?: TransporteLike): string => {
  if (!transporte) return i18n.t('requisitions.labels.noDetails');

  let dataMatricula: string | undefined;
  if (transporte.dataMatricula) {
    let matriculaDate: Date | undefined;
    if (typeof transporte.dataMatricula === 'string') {
      matriculaDate = parseDateInput(transporte.dataMatricula) ?? undefined;
    }

    if (matriculaDate && !Number.isNaN(matriculaDate.getTime())) {
      dataMatricula = matriculaDate.toLocaleDateString('pt-PT');
    }
  }

  return [
    transporte.categoria ? formatTransporteCategoria(transporte.categoria) : undefined,
    formatLotacao(transporte.lotacao),
    dataMatricula ? i18n.t('requisitions.labels.registeredOn', { date: dataMatricula }) : undefined,
  ].filter(Boolean).join(' · ');
};

export const getCoberturaMensagem = (passageirosSolicitados: number, lugaresEmFalta: number): string => {
  if (passageirosSolicitados <= 0) return i18n.t('requisitions.labels.providePassengerCount');
  if (lugaresEmFalta > 0) return i18n.t('requisitions.labels.missingSeats', { count: lugaresEmFalta });
  return i18n.t('requisitions.labels.capacitySufficient');
};

export const getRequisicaoTransportes = (requisicao?: RequisicaoResponse | null): TransporteResumo[] => {
  if (!requisicao) return [];
  if (requisicao.transportes && requisicao.transportes.length > 0) {
    return requisicao.transportes.map((item) => item.transporte).filter(Boolean);
  }
  return requisicao.transporte ? [requisicao.transporte] : [];
};

export const formatTransporteCollection = (requisicao?: RequisicaoResponse | null): string => {
  const transportesRequisicao = getRequisicaoTransportes(requisicao);
  if (transportesRequisicao.length === 0) return '—';
  return transportesRequisicao.map((transporte) => formatTransporteDisplay(transporte)).join(', ');
};

export type MaterialItemGroup = {
  itemKey: string;
  nome: string;
  categoria: MaterialCategoria;
  variantes: MaterialCatalogo[];
};

