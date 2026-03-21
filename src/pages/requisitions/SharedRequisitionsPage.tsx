import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { GlassCard } from '../../components/ui/glass-card';
import { DatePickerField, formatDateInput, parseDateInput } from '../../components/ui/date-picker-field';
import { ApiRequestError } from '../../services/api/core/client';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import {
  ManutencaoCategoria,
  MaterialCategoria,
  MaterialCatalogo,
  ManutencaoItem,
  RequisicaoEstado,
  RequisicaoPrioridade,
  RequisicaoResponse,
  RequisicaoTipo,
  TransporteCatalogo,
  TransporteCategoria,
  requisicoesApi,
} from '../../services/api';
import {
  ConflitoDialogMode,
  CreateField,
  MANUTENCAO_CATEGORIA_OPTIONS,
  MATERIAL_CATEGORIA_OPTIONS,
  MaterialItemGroup,
  PRIORIDADE_OPTIONS,
  RequisicaoConflito,
  RequisicoesTab,
  TRANSPORTE_CATEGORIA_OPTIONS,
  TIPO_OPTIONS,
  TransporteSelectionMode,
  composeDateTime,
  createEmptyMaterialLinha,
  formatManutencaoCategoria,
  formatLotacao,
  formatTransporteCategoria,
  formatTransporteDisplay,
  formatVehicleTitle,
  getCoberturaMensagem,
  getEstadosPermitidosTransicao,
  getEstadosVisiveisNoSeletor,
  getPassengerCapacity,
  getRequisicaoTransportes,
  isDateInputInPast,
  normalizarTexto,
  periodsOverlap,
  previousDateInput,
  toIsoFromDateOnly,
} from './sharedRequisitions.helpers';
import { RequisitionsStatsCards } from '../../components/shared/requisitions/RequisitionsStatsCards';
import { RequisitionsConflictDialog } from '../../components/shared/requisitions/RequisitionsConflictDialog';
import { RequisitionsCreateMaterialDialog } from '../../components/shared/requisitions/RequisitionsCreateMaterialDialog';
import { RequisitionDetailsDialog } from '../../components/shared/requisitions/RequisitionDetailsDialog';
import { RequisitionsListFiltersContent } from '../../components/shared/requisitions/RequisitionsListFiltersContent';
import { RequisitionsCreateManutencaoForm } from '../../components/shared/requisitions/RequisitionsCreateManutencaoForm';

/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable sonarjs/no-nested-functions */

export interface SharedRequisitionsPageProps {
  isDarkMode: boolean;
  currentUserId: number;
  initialTipo?: RequisicaoTipo;
  initialPrioridade?: RequisicaoPrioridade;
  scopeRole?: 'ALL' | 'BALNEARIO' | 'ESCOLA' | 'INTERNO';
  canManageRequests?: boolean;
}

export function SharedRequisitionsPage({
  isDarkMode,
  currentUserId,
  initialTipo,
  initialPrioridade,
  scopeRole = 'ALL',
  canManageRequests = true,
}: Readonly<SharedRequisitionsPageProps>) {
  const { t } = useTranslation();
  const locale = i18n.language.startsWith('en') ? 'en-GB' : 'pt-PT';
  const formatDateTimeOrDash = (value?: string | null) => {
    if (!value) return '—';
    return new Date(value).toLocaleString(locale);
  };
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requisicoes, setRequisicoes] = useState<RequisicaoResponse[]>([]);
  const [monthlyRequisicoes, setMonthlyRequisicoes] = useState<RequisicaoResponse[]>([]);
  const [todasRequisicoesTransporteAceites, setTodasRequisicoesTransporteAceites] = useState<RequisicaoResponse[]>([]);
  const [activeSection, setActiveSection] = useState<'create' | 'list' | null>('list');
  const sectionSwitchTimeoutRef = useRef<number | null>(null);
  const [openedRequisicaoId, setOpenedRequisicaoId] = useState<number | null>(null);
  const [estadoEdicao, setEstadoEdicao] = useState<RequisicaoEstado>('EM_ANALISE');
  const [updatingEstadoId, setUpdatingEstadoId] = useState<number | null>(null);
  const [conflitoDialogOpen, setConflitoDialogOpen] = useState(false);
  const [conflitosPendentes, setConflitosPendentes] = useState<RequisicaoConflito[]>([]);
  const [conflitoTransportesNomes, setConflitoTransportesNomes] = useState<string[]>([]);
  const [conflitoDialogMode, setConflitoDialogMode] = useState<ConflitoDialogMode>('warning');
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

  const [tipo, setTipo] = useState<RequisicaoTipo>(initialTipo ?? 'MATERIAL');
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
  const [manutencaoItems, setManutencaoItems] = useState<ManutencaoItem[]>([]);
  const [expandedManutencaoCategorias, setExpandedManutencaoCategorias] = useState<Record<string, boolean>>({});
  const [expandedManutencaoItems, setExpandedManutencaoItems] = useState<Record<string, boolean>>({});
  const [selectedManutencaoItemIds, setSelectedManutencaoItemIds] = useState<number[]>([]);
  const [novoMaterialNome, setNovoMaterialNome] = useState('');
  const [novoMaterialDescricao, setNovoMaterialDescricao] = useState('');
  const [novoMaterialCategoria, setNovoMaterialCategoria] = useState<MaterialCategoria>('OUTROS');
  const [novoMaterialAtributo, setNovoMaterialAtributo] = useState('');
  const [novoMaterialValorAtributo, setNovoMaterialValorAtributo] = useState('');

  const isRequestVisibleForScope = (requisicao?: RequisicaoResponse | null): boolean => {
    if (!requisicao) return false;
    if (scopeRole === 'ALL') return true;
    return requisicao.criadoPor?.tipo === scopeRole;
  };

  const applyScopeFilter = (lista: RequisicaoResponse[]): RequisicaoResponse[] => {
    if (scopeRole === 'ALL') return lista;
    return lista.filter((item) => isRequestVisibleForScope(item));
  };

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
      const lista = applyScopeFilter(Array.isArray(data) ? data : []);
      setRequisicoes(lista);
      // Reutiliza o resultado já carregado para alimentar o overview mensal,
      // evitando uma segunda chamada não filtrada a requisicoesApi.procurar({}).
      setMonthlyRequisicoes(lista);
    } catch (error: any) {
      toast.error(error?.message || t('requisitions.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Nota: o overview mensal agora reutiliza os dados já carregados em
  // fetchRequisicoes (via setMonthlyRequisicoes(lista)), evitando uma
  // chamada adicional não filtrada a requisicoesApi.procurar({}).

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
      const [materiaisData, transportesData, manutencaoData] = await Promise.all([
        requisicoesApi.listarMateriais(),
        requisicoesApi.listarTransportes(),
        requisicoesApi.listarManutencaoItems(),
      ]);
      setMateriais(Array.isArray(materiaisData) ? materiaisData : []);
      setTransportes(Array.isArray(transportesData) ? transportesData : []);
      setManutencaoItems(Array.isArray(manutencaoData) ? manutencaoData : []);
    } catch (error: any) {
      toast.error(error?.message || t('requisitions.errors.loadCatalogFailed'));
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

  // Fetch all accepted transport requisitions (without role filter) for conflict detection
  useEffect(() => {
    if (tipo !== 'TRANSPORTE') return;

    const fetchAcceptedTransports = async () => {
      try {
        const todasRequisicoes = await requisicoesApi.procurar({ 
          tipo: 'TRANSPORTE',
          estado: 'ACEITE' 
        });
        setTodasRequisicoesTransporteAceites(Array.isArray(todasRequisicoes) ? todasRequisicoes : []);
      } catch (error: any) {
        console.error('Failed to fetch accepted transport requisitions:', error);
      }
    };

    fetchAcceptedTransports();
  }, [tipo]);

  useEffect(() => {
    return () => {
      if (sectionSwitchTimeoutRef.current) {
        globalThis.clearTimeout(sectionSwitchTimeoutRef.current);
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

  const dataHoraSaidaSelecionada = useMemo(
    () => composeDateTime(dataSaida, horaSaida),
    [dataSaida, horaSaida],
  );

  const dataHoraRegressoSelecionada = useMemo(
    () => composeDateTime(dataRegresso, horaRegresso),
    [dataRegresso, horaRegresso],
  );

  const transportesIndisponiveis = useMemo(() => {
    if (tipo !== 'TRANSPORTE') return new Set<number>();

    const ids = new Set<number>();
    
    // Check against ALL accepted transport requisitions from all roles
    // This ensures vehicles blocked by any role are shown as unavailable
    const todasRequisicoes = todasRequisicoesTransporteAceites.length > 0 
      ? todasRequisicoesTransporteAceites 
      : monthlyRequisicoes;
    
    todasRequisicoes.forEach((requisicao) => {
      if (requisicao.tipo !== 'TRANSPORTE' || requisicao.estado !== 'ACEITE') return;
      if (!periodsOverlap(
        dataHoraSaidaSelecionada,
        dataHoraRegressoSelecionada,
        requisicao.dataHoraSaida,
        requisicao.dataHoraRegresso,
      )) {
        return;
      }

      getRequisicaoTransportes(requisicao).forEach((transporte) => {
        if (typeof transporte.id === 'number') {
          ids.add(transporte.id);
        }
      });
    });

    return ids;
  }, [dataHoraRegressoSelecionada, dataHoraSaidaSelecionada, monthlyRequisicoes, todasRequisicoesTransporteAceites, tipo]);

  const transportesOrdenadosDisponiveis = useMemo(
    () => transportesOrdenados.filter((transporte) => !transportesIndisponiveis.has(transporte.id)),
    [transportesIndisponiveis, transportesOrdenados],
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

  // Keep this in one place because selection quality depends on this exact knapsack scoring strategy.
  // eslint-disable-next-line sonarjs/cognitive-complexity
  const recommendedTransportIds = useMemo(() => {
    if (passageirosSolicitados <= 0) return [] as number[];

    const viaturasComLotacao = transportesOrdenadosDisponiveis
      .filter((transporte) => transporte.id && getPassengerCapacity(transporte.lotacao) > 0)
      .map((transporte) => ({
        id: transporte.id,
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
  }, [passageirosSolicitados, transportesOrdenadosDisponiveis]);

  useEffect(() => {
    if (tipo !== 'TRANSPORTE' || transportSelectionMode !== 'auto') {
      return;
    }
    setSelectedTransportIds(recommendedTransportIds.map(String));
  }, [recommendedTransportIds, transportSelectionMode, tipo]);

  useEffect(() => {
    if (tipo !== 'TRANSPORTE' || selectedTransportIds.length === 0) {
      return;
    }

    const selectedDisponiveis = selectedTransportIds.filter((id) => !transportesIndisponiveis.has(Number(id)));
    if (selectedDisponiveis.length === selectedTransportIds.length) {
      return;
    }

    setSelectedTransportIds(selectedDisponiveis);
    if (createTouched.transporteIds) {
      setTimeout(() => validateAndSetField('transporteIds'), 0);
    }
  }, [createTouched.transporteIds, selectedTransportIds, tipo, transportesIndisponiveis]);

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

  useEffect(() => {
    if (tipo !== 'TRANSPORTE') return;

    const temAlgumValorDataHora = Boolean(dataSaida || horaSaida || dataRegresso || horaRegresso);
    if (!temAlgumValorDataHora) return;

    // Revalida após atualização de estado para evitar checks com valores antigos no onChange.
    validateAndSetField('dataSaida');
    validateAndSetField('horaSaida');
    validateAndSetField('dataRegresso');
    validateAndSetField('horaRegresso');
  }, [tipo, dataSaida, horaSaida, dataRegresso, horaRegresso]);

  const setFieldTouched = (field: CreateField) => {
    setCreateTouched((prev) => ({ ...prev, [field]: true }));
  };

  // eslint-disable-next-line sonarjs/cognitive-complexity
  const validateCreateField = (field: CreateField): string | undefined => {
    if (field === 'descricao') {
      if (!descricao.trim()) return t('requisitions.errors.requiredField');
      return undefined;
    }

    if (tipo === 'MATERIAL' && field === 'materialItens') {
      const linhasValidas = materialLinhas.filter((linha) => linha.materialId && Number(linha.quantidade) > 0);
      if (linhasValidas.length === 0) return t('requisitions.errors.addOneMaterial');
      return undefined;
    }

    if (tipo !== 'TRANSPORTE') return undefined;

    if (field === 'destino' && !destinoTransporte.trim()) return t('requisitions.errors.requiredField');
    if (field === 'dataSaida' && !dataSaida) return t('requisitions.errors.requiredField');
    if (field === 'horaSaida' && !horaSaida) return t('requisitions.errors.requiredField');
    if (field === 'dataRegresso' && !dataRegresso) return t('requisitions.errors.requiredField');
    if (field === 'horaRegresso' && !horaRegresso) return t('requisitions.errors.requiredField');

    if ((field === 'dataSaida' || field === 'horaSaida') && dataSaida && isDateInputInPast(dataSaida)) {
      return t('requisitions.errors.dateCannotBePast');
    }

    if ((field === 'dataRegresso' || field === 'horaRegresso') && dataRegresso && isDateInputInPast(dataRegresso)) {
      return t('requisitions.errors.dateCannotBePast');
    }

    if (field === 'numeroPassageiros') {
      if (!numeroPassageiros) return t('requisitions.errors.requiredField');
      if (passageirosSolicitados < 1) return t('requisitions.errors.invalidPassengers');
      return undefined;
    }

    if (field === 'transporteIds' && selectedTransportIds.length === 0) {
      return t('requisitions.errors.selectOneVehicle');
    }

    const saida = composeDateTime(dataSaida, horaSaida);
    const regresso = composeDateTime(dataRegresso, horaRegresso);
    if ((field === 'horaRegresso' || field === 'dataRegresso') && saida && regresso) {
      const saidaDate = new Date(saida);
      const regressoDate = new Date(regresso);
      if (!Number.isNaN(saidaDate.getTime()) && !Number.isNaN(regressoDate.getTime()) && regressoDate <= saidaDate) {
        return t('requisitions.errors.returnAfterDeparture');
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
      if (key === 'transporteId') mapped.transporteIds = value;
    });

    return mapped;
  };

  const handleCriarMaterialCatalogo = async () => {
    if (!novoMaterialNome.trim()) {
      toast.error(t('requisitions.material.errors.nameRequired'));
      return;
    }
    if (!novoMaterialAtributo.trim() || !novoMaterialValorAtributo.trim()) {
      toast.error(t('requisitions.material.errors.attributeRequired'));
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
      toast.success(t('requisitions.material.messages.created'));
      setMateriais((prev) => [...prev, novoMaterial]);
      setNovoMaterialNome('');
      setNovoMaterialDescricao('');
      setNovoMaterialCategoria('OUTROS');
      setNovoMaterialAtributo('');
      setNovoMaterialValorAtributo('');
      setCreateMaterialDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.message || t('requisitions.material.errors.createFailed'));
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

  const toggleManutencaoCategoriaExpansion = (categoria: ManutencaoCategoria) => {
    setExpandedManutencaoCategorias((prev) => ({ ...prev, [categoria]: !prev[categoria] }));
  };

  const toggleManutencaoItemVisibility = (itemKey: string) => {
    setExpandedManutencaoItems((prev) => ({ ...prev, [itemKey]: prev[itemKey] === false }));
  };

  const toggleManutencaoItem = (itemId: number, checked: boolean) => {
    if (checked) {
      setSelectedManutencaoItemIds((prev) => [...new Set([...prev, itemId])]);
    } else {
      setSelectedManutencaoItemIds((prev) => prev.filter((id) => id !== itemId));
    }
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
    setTipo(initialTipo ?? 'MATERIAL');
    setPrioridade(initialPrioridade ?? 'MEDIA');
  };

  const toggleSelectedTransport = (transporteId: number, checked: boolean) => {
    if (checked && transportesIndisponiveis.has(transporteId)) {
      return;
    }

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
      toast.error(t('requisitions.errors.missingAuthenticatedUser'));
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
        toast.success(t('requisitions.messages.materialCreated'));
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
          manutencaoItemIds: selectedManutencaoItemIds.length > 0 ? selectedManutencaoItemIds : undefined,
        });
      }

      if (tipo !== 'MATERIAL') {
        toast.success(t('requisitions.messages.created'));
      }
      handleResetCreateForm();
      setActiveSection('list');
      await fetchRequisicoes();
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
        toast.error(error?.message || t('requisitions.errors.createFailed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const requisicoesRequestChainRef = useRef<Promise<void>>(Promise.resolve());

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

  const handleSelectTab = (tab: RequisicoesTab) => {
    setActiveTab(tab);

    const nextTipo: RequisicaoTipo | '' = tab === 'GERAL' || tab === 'URGENTE' ? '' : tab;
    const nextPrioridade: RequisicaoPrioridade | '' = tab === 'URGENTE' ? 'URGENTE' : '';

    setFilterTipo(nextTipo);
    setFilterPrioridade(nextPrioridade);

    requisicoesRequestChainRef.current = requisicoesRequestChainRef.current
      .catch(() => {
        // Swallow errors from previous requests to keep the chain alive
      })
      .then(() =>
        fetchRequisicoes({
          estado: filterEstado,
          tipo: nextTipo,
          prioridade: nextPrioridade,
          criadoPorNome: filterCriadoPorNome,
          geridoPorNome: filterGeridoPorNome,
        }),
      );
  };

  const handleCardShortcut = (tab: RequisicoesTab) => {
    setActiveSection('list');
    handleSelectTab(tab);
  };

  const limparEstadoConflito = () => {
    setConflitoDialogOpen(false);
    setConflitosPendentes([]);
    setConflitoTransportesNomes([]);
    setConflitoDialogMode('warning');
  };

  const mapearConflitosParaResumo = (lista: RequisicaoResponse[]): RequisicaoConflito[] => (
    lista.map((conflito) => ({
      id: conflito.id,
      criadoPorNome: conflito.criadoPor?.nome || 'Utilizador sem nome',
      criadoEm: conflito.criadoEm,
    }))
  );

  const calcularConflitosTransporte = (
    requisicaoAtual: RequisicaoResponse,
    outrasRequisicoes: RequisicaoResponse[],
  ): {
    conflitosParaMostrar: RequisicaoResponse[];
    nomesTransportesConflito: string[];
    modo: ConflitoDialogMode;
  } | null => {
    const transportesSelecionados = getRequisicaoTransportes(requisicaoAtual);
    const idsSelecionados = new Set(
      transportesSelecionados
        .map((transporte) => transporte.id)
        .filter((id): id is number => typeof id === 'number'),
    );

    if (idsSelecionados.size === 0) {
      return null;
    }

    const conflitos = outrasRequisicoes
      .filter((outra) => outra.id !== requisicaoAtual.id)
      .filter((outra) => outra.estado !== 'RECUSADA' && outra.estado !== 'CANCELADA')
      .filter((outra) => {
        const transportesOutra = getRequisicaoTransportes(outra);
        const partilhaTransporte = transportesOutra.some(
          (transporte) => typeof transporte.id === 'number' && idsSelecionados.has(transporte.id),
        );

        if (!partilhaTransporte) {
          return false;
        }

        if (!requisicaoAtual.dataHoraSaida
          || !requisicaoAtual.dataHoraRegresso
          || !outra.dataHoraSaida
          || !outra.dataHoraRegresso) {
          return true;
        }

        return periodsOverlap(
          requisicaoAtual.dataHoraSaida,
          requisicaoAtual.dataHoraRegresso,
          outra.dataHoraSaida,
          outra.dataHoraRegresso,
        );
      });

    if (conflitos.length === 0) {
      return null;
    }

    const conflitosBloqueantes = conflitos.filter((conflito) => conflito.estado === 'ACEITE');
    const conflitosParaMostrar = conflitosBloqueantes.length > 0 ? conflitosBloqueantes : conflitos;
    const nomesTransportesConflito = Array.from(new Set(
      transportesSelecionados
        .filter((transporte) => typeof transporte.id === 'number' && idsSelecionados.has(transporte.id))
        .map((transporte) => formatTransporteDisplay(transporte)),
    ));

    return {
      conflitosParaMostrar,
      nomesTransportesConflito,
      modo: conflitosBloqueantes.length > 0 ? 'blocked' : 'warning',
    };
  };

  const calcularTodosOsConflitosTransporte = (
    requisicaoAtual: RequisicaoResponse,
    outrasRequisicoes: RequisicaoResponse[],
  ): RequisicaoResponse[] => {
    // Similar to calcularConflitosTransporte, but includes ALL conflicting requisitions
    // regardless of their state (except CANCELADA), for automatic rejection
    const transportesSelecionados = getRequisicaoTransportes(requisicaoAtual);
    const idsSelecionados = new Set(
      transportesSelecionados
        .map((transporte) => transporte.id)
        .filter((id): id is number => typeof id === 'number'),
    );

    if (idsSelecionados.size === 0) {
      return [];
    }

    return outrasRequisicoes
      .filter((outra) => outra.id !== requisicaoAtual.id)
      .filter((outra) => outra.estado !== 'CANCELADA') // Don't reject cancelled requests
      .filter((outra) => {
        const transportesOutra = getRequisicaoTransportes(outra);
        const partilhaTransporte = transportesOutra.some(
          (transporte) => typeof transporte.id === 'number' && idsSelecionados.has(transporte.id),
        );

        if (!partilhaTransporte) {
          return false;
        }

        if (!requisicaoAtual.dataHoraSaida
          || !requisicaoAtual.dataHoraRegresso
          || !outra.dataHoraSaida
          || !outra.dataHoraRegresso) {
          return true;
        }

        return periodsOverlap(
          requisicaoAtual.dataHoraSaida,
          requisicaoAtual.dataHoraRegresso,
          outra.dataHoraSaida,
          outra.dataHoraRegresso,
        );
      });
  };

  const abrirRequisicaoPorId = async (requisicaoId: number): Promise<void> => {
    const requisicaoExistente = requisicoes.find((req) => req.id === requisicaoId);
    if (requisicaoExistente) {
      await handleOpenRequisicao(requisicaoExistente);
      return;
    }

    try {
      const requisicaoDetalhe = await requisicoesApi.obterPorId(requisicaoId);
      if (!isRequestVisibleForScope(requisicaoDetalhe)) {
        toast.error(t('requisitions.errors.loadFailed'));
        return;
      }
      setRequisicoes((prev) => {
        if (prev.some((item) => item.id === requisicaoDetalhe.id)) {
          return prev;
        }
        return [requisicaoDetalhe, ...prev];
      });
      await handleOpenRequisicao(requisicaoDetalhe);
    } catch (error: any) {
      toast.error(error?.message || t('requisitions.errors.loadFailed'));
    }
  };

  const handleOpenRequisicao = async (req: RequisicaoResponse) => {
    limparEstadoConflito();
    setOpenedRequisicaoId(req.id);

    if (!canManageRequests) {
      return;
    }

    // Ao visualizar uma requisição ENVIADA na secretaria, a requisição entra automaticamente em análise.
    if (req.estado === 'ENVIADA') {
      try {
        setUpdatingEstadoId(req.id);
        await requisicoesApi.atualizarEstado(req.id, { estado: 'EM_ANALISE' });
        await fetchRequisicoes();
        setEstadoEdicao('EM_ANALISE');
      } catch (error: any) {
        toast.error(error?.message || t('requisitions.errors.updateStatusFailed'));
        setEstadoEdicao('EM_ANALISE');
      } finally {
        setUpdatingEstadoId(null);
      }
      return;
    }

    const estadosPermitidos = getEstadosPermitidosTransicao(req.estado);
    setEstadoEdicao(estadosPermitidos[0] ?? req.estado);
  };

  const handleAtualizarEstado = async () => {
    if (!openedRequisicaoId || !selectedRequisicao) return;

    const estadosPermitidos = getEstadosPermitidosTransicao(selectedRequisicao.estado);
    if (estadosPermitidos.length === 0) {
      toast.error(t('requisitions.errors.onlyPendingDecision'));
      return;
    }

    if (estadoEdicao === selectedRequisicao.estado) {
      toast.error(t('requisitions.errors.chooseFinalState'));
      return;
    }

    if (!estadosPermitidos.includes(estadoEdicao)) {
      toast.error(t('requisitions.errors.invalidFinalState'));
      return;
    }

    if (selectedRequisicao.tipo === 'TRANSPORTE' && estadoEdicao === 'ACEITE') {
      try {
        const outrasRequisicoes = await requisicoesApi.procurar({ tipo: 'TRANSPORTE' });
        const resultadoConflitos = calcularConflitosTransporte(
          selectedRequisicao,
          Array.isArray(outrasRequisicoes) ? outrasRequisicoes : [],
        );

        if (resultadoConflitos) {
          setConflitosPendentes(mapearConflitosParaResumo(resultadoConflitos.conflitosParaMostrar));
          setConflitoTransportesNomes(resultadoConflitos.nomesTransportesConflito);
          setConflitoDialogMode(resultadoConflitos.modo);
          setConflitoDialogOpen(true);
          return;
        }
      } catch (error: any) {
        toast.error(error?.message || t('requisitions.errors.updateStatusFailed'));
        return;
      }
    }

    try {
      setUpdatingEstadoId(openedRequisicaoId);
      await requisicoesApi.atualizarEstado(openedRequisicaoId, { estado: estadoEdicao });
      toast.success(t('requisitions.messages.statusUpdated'));
      await fetchRequisicoes();
      setOpenedRequisicaoId(null);
    } catch (error: any) {
      toast.error(error?.message || t('requisitions.errors.updateStatusFailed'));
    } finally {
      setUpdatingEstadoId(null);
    }
  };

  const summaryText = useMemo(() => {
    const total = requisicoes.length;
    const urgentes = requisicoes.filter((item) => item.prioridade === 'URGENTE').length;
    return t('requisitions.summary', { total, urgent: urgentes });
  }, [requisicoes, t]);

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
    return monthlyRequisicoesAtual.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.prioridade === 'URGENTE') {
          acc.urgentes += 1;
        }
        if (item.tipo === 'MATERIAL') {
          acc.material += 1;
        } else if (item.tipo === 'MANUTENCAO') {
          acc.manutencao += 1;
        } else if (item.tipo === 'TRANSPORTE') {
          acc.transporte += 1;
        }
        return acc;
      },
      {
        total: 0,
        urgentes: 0,
        material: 0,
        manutencao: 0,
        transporte: 0,
      }
    );
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

  const estadosPermitidosSelecionados = useMemo(
    () => getEstadosPermitidosTransicao(selectedRequisicao?.estado),
    [selectedRequisicao?.estado],
  );

  const estadosVisiveisSelecionados = useMemo(
    () => getEstadosVisiveisNoSeletor(selectedRequisicao?.estado),
    [selectedRequisicao?.estado],
  );

  const handleContinuarAceitacaoComConflitos = async () => {
    if (!openedRequisicaoId) return;

    try {
      setUpdatingEstadoId(openedRequisicaoId);
      
      // First, accept the current request
      await requisicoesApi.atualizarEstado(openedRequisicaoId, { estado: 'ACEITE' });
      
      // Then, automatically reject ALL conflicting transport requests regardless of their state
      if (selectedRequisicao?.tipo === 'TRANSPORTE') {
        try {
          const outrasRequisicoes = await requisicoesApi.procurar({ tipo: 'TRANSPORTE' });
          const requisicoesList = Array.isArray(outrasRequisicoes) ? outrasRequisicoes : [];
          
          // Get ALL conflicting requests (including ENVIADA, EM_ANALISE, etc)
          const todosOsConflitos = calcularTodosOsConflitosTransporte(
            selectedRequisicao,
            requisicoesList,
          );

          if (todosOsConflitos.length > 0) {
            // Backend only allows ENVIADA -> EM_ANALISE -> RECUSADA.
            // For other pending states, RECUSADA can be applied directly.
            const rejeitarConflito = async (conflito: RequisicaoResponse) => {
              if (conflito.estado === 'RECUSADA') {
                return;
              }

              if (conflito.estado === 'ENVIADA') {
                await requisicoesApi.atualizarEstado(conflito.id, { estado: 'EM_ANALISE' });
              }

              await requisicoesApi.atualizarEstado(conflito.id, { estado: 'RECUSADA' });
            };

            await Promise.all(todosOsConflitos.map((conflito) => rejeitarConflito(conflito)));
          }
        } catch (error: any) {
          // Log rejection errors but don't block the main acceptance
          console.error('Failed to reject conflicting requisitions:', error);
        }
      }
      
      toast.success(t('requisitions.messages.statusUpdated'));
      limparEstadoConflito();
      await fetchRequisicoes();
      setOpenedRequisicaoId(null);
    } catch (error: any) {
      toast.error(error?.message || t('requisitions.errors.updateStatusFailed'));
    } finally {
      setUpdatingEstadoId(null);
    }
  };

  const podeAtualizarEstado = useMemo(
    () => estadosPermitidosSelecionados.length > 0,
    [estadosPermitidosSelecionados],
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
      globalThis.clearTimeout(sectionSwitchTimeoutRef.current);
      sectionSwitchTimeoutRef.current = null;
    }

    if (activeSection === targetSection) {
      const oppositeSection = targetSection === 'create' ? 'list' : 'create';
      setActiveSection(null);
      sectionSwitchTimeoutRef.current = globalThis.setTimeout(() => {
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
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('requisitions.ui.mainData')}</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label htmlFor="req-create-tipo" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.type')}</label>
            <select
              id="req-create-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as RequisicaoTipo)}
              className={selectFieldClassName}
            >
              {TIPO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{t(option.label)}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="req-create-prioridade" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.priority')}</label>
            <select
              id="req-create-prioridade"
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value as RequisicaoPrioridade)}
              className={selectFieldClassName}
            >
              {PRIORIDADE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{t(option.label)}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="req-create-tempo-limite" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.deadlineDate')}</label>
            <DatePickerField
              id="req-create-tempo-limite"
              value={formatDateInput(tempoLimite)}
              onChange={(value) => {
                setTempoLimite(parseDateInput(value));
                setTempoLimiteManuallyEdited(true);
              }}
              placeholder={t('requisitions.ui.selectDate')}
              buttonClassName="mt-1"
            />
            {tipo === 'TRANSPORTE' && !tempoLimiteManuallyEdited && dataSaida && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('requisitions.ui.transportAutoDeadlineHint')}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="req-create-descricao" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.description')}</label>
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
            placeholder={t('requisitions.ui.describeRequest')}
          />
          {createErrors.descricao && <p className="text-red-500 text-xs mt-1">{createErrors.descricao}</p>}
        </div>
      </div>

      <div className="rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white/95 dark:bg-gray-900/85 p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('requisitions.ui.detailsByType')}</h3>

        <div>
          {tipo === 'MATERIAL' && (
            <div className="space-y-3">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('requisitions.ui.selectMaterials')}</p>
                  <Button type="button" variant="outline" className="h-7 px-2 text-xs" onClick={() => setCreateMaterialDialogOpen(true)}>
                    {t('requisitions.ui.newMaterial')}
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
                            {t(categoria.label)}
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
                            {t('requisitions.ui.noItemsInCategory')}
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
                                        {isExpanded ? t('requisitions.ui.hideAttributes') : t('requisitions.ui.showAttributes')}
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
                                                <label htmlFor={`qtd-variante-${variante.id}`} className="text-xs text-gray-500 dark:text-gray-400">{t('requisitions.ui.quantityShort')}</label>
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
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('requisitions.ui.addedMaterials')}</p>

                {materialLinhas.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('requisitions.ui.noMaterialsYet')}</p>
                ) : (
                  <div className="space-y-4">
                    {materiaisAdicionadosAgrupados.map((grupo) => (
                      <div key={grupo.categoria} className="space-y-2">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t(grupo.label)}</p>

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
                                {t('requisitions.ui.remove')}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-3 text-sm text-gray-600 dark:text-gray-400">
                      <span>{t('requisitions.ui.totalRows', { count: materialLinhas.length })}</span>
                      <span>{t('requisitions.ui.totalUnits', { count: materiaisAdicionadosTotal })}</span>
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('requisitions.ui.transportPlanningHint')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="req-create-transporte-destino" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.destination')}</label>
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
                      placeholder={t('requisitions.ui.destinationPlaceholder')}
                    />
                    {createErrors.destino && <p className="text-red-500 text-xs mt-1">{createErrors.destino}</p>}
                  </div>

                  <div>
                    <label htmlFor="req-create-transporte-condutor" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.driverOptional')}</label>
                    <Input
                      id="req-create-transporte-condutor"
                      className={inputFieldClassName}
                      value={condutorTransporte}
                      onChange={(e) => setCondutorTransporte(e.target.value)}
                      placeholder={t('requisitions.ui.driverPlaceholder')}
                    />
                  </div>

                  <div>
                    <label htmlFor="req-create-transporte-passageiros" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.passengersCount')}</label>
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
                      placeholder={t('requisitions.ui.passengersPlaceholder')}
                    />
                    {createErrors.numeroPassageiros && <p className="text-red-500 text-xs mt-1">{createErrors.numeroPassageiros}</p>}
                  </div>

                  <div className="md:col-span-2 xl:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    <div onBlurCapture={() => {
                      validateAndSetField('dataSaida', true);
                      validateAndSetField('horaSaida', true);
                    }}>
                      <label htmlFor="req-create-transporte-data-saida" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.departureDate')}</label>
                      <DatePickerField
                        id="req-create-transporte-data-saida"
                        value={dataSaida}
                        onChange={(value) => {
                          setDataSaida(value);
                          if (!dataRegresso) {
                            setDataRegresso(value);
                          }
                          validateAndSetField('dataSaida');
                          validateAndSetField('horaSaida');
                          validateAndSetField('dataRegresso');
                          validateAndSetField('horaRegresso');
                        }}
                        buttonClassName={`mt-1 ${createErrors.dataSaida ? 'border-red-500' : ''}`}
                      />
                      {createErrors.dataSaida && <p className="text-red-500 text-xs mt-1">{createErrors.dataSaida}</p>}
                    </div>

                    <div>
                      <label htmlFor="req-create-transporte-hora-saida" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.departureTime')}</label>
                      <Input
                        id="req-create-transporte-hora-saida"
                        type="time"
                        className={getFieldClassName(inputFieldClassName, 'horaSaida')}
                        value={horaSaida}
                        onChange={(e) => {
                          setHoraSaida(e.target.value);
                          validateAndSetField('horaSaida');
                          validateAndSetField('dataSaida');
                          validateAndSetField('dataRegresso');
                          validateAndSetField('horaRegresso');
                        }}
                        onBlur={() => validateAndSetField('horaSaida', true)}
                        onBlurCapture={() => validateAndSetField('dataSaida', true)}
                      />
                      {createErrors.horaSaida && <p className="text-red-500 text-xs mt-1">{createErrors.horaSaida}</p>}
                    </div>

                    <div onBlurCapture={() => {
                      validateAndSetField('dataRegresso', true);
                      validateAndSetField('horaRegresso', true);
                    }}>
                      <label htmlFor="req-create-transporte-data-regresso" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.returnDate')}</label>
                      <DatePickerField
                        id="req-create-transporte-data-regresso"
                        value={dataRegresso}
                        onChange={(value) => {
                          setDataRegresso(value);
                          validateAndSetField('dataRegresso');
                          validateAndSetField('horaRegresso');
                          validateAndSetField('dataSaida');
                          validateAndSetField('horaSaida');
                        }}
                        buttonClassName={`mt-1 ${createErrors.dataRegresso ? 'border-red-500' : ''}`}
                      />
                      {createErrors.dataRegresso && <p className="text-red-500 text-xs mt-1">{createErrors.dataRegresso}</p>}
                    </div>

                    <div>
                      <label htmlFor="req-create-transporte-hora-regresso" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.returnTime')}</label>
                      <Input
                        id="req-create-transporte-hora-regresso"
                        type="time"
                        className={getFieldClassName(inputFieldClassName, 'horaRegresso')}
                        value={horaRegresso}
                        onChange={(e) => {
                          setHoraRegresso(e.target.value);
                          validateAndSetField('horaRegresso');
                          validateAndSetField('dataRegresso');
                          validateAndSetField('dataSaida');
                          validateAndSetField('horaSaida');
                        }}
                        onBlur={() => validateAndSetField('horaRegresso', true)}
                        onBlurCapture={() => validateAndSetField('dataRegresso', true)}
                      />
                      {createErrors.horaRegresso && <p className="text-red-500 text-xs mt-1">{createErrors.horaRegresso}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('requisitions.ui.suggestedAndSelectedVehicles')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('requisitions.ui.suggestionHint')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={handleAplicarSugestaoTransporte}>
                      {t('requisitions.ui.applySuggestion')}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-3 bg-gray-50/80 dark:bg-gray-800/50">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('requisitions.ui.selectionMode')}</p>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">{transportSelectionMode === 'auto' ? t('requisitions.ui.automatic') : t('requisitions.ui.manual')}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-3 bg-gray-50/80 dark:bg-gray-800/50">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('requisitions.ui.passengerCapacity')}</p>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">{t('requisitions.ui.seatsCount', { count: selectedTransportesCapacidade })}</p>
                  </div>
                  <div className={`rounded-lg border px-3 py-3 ${lugaresEmFalta > 0
                    ? 'border-amber-300 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/20'
                    : 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                    }`}>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('requisitions.ui.coverage')}</p>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
                      {getCoberturaMensagem(passageirosSolicitados, lugaresEmFalta)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('requisitions.ui.capacityHint')}</p>

                {createErrors.transporteIds && (
                  <p className="text-red-500 text-xs">{createErrors.transporteIds}</p>
                )}

                {transportesIndisponiveis.size > 0 && dataHoraSaidaSelecionada && dataHoraRegressoSelecionada && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {t('requisitions.ui.unavailableVehiclesCount', { count: transportesIndisponiveis.size })}
                  </p>
                )}

                {selectedTransportIds.length > 0 && (
                  <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/20 p-4 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{t('requisitions.ui.currentSelection')}</p>
                    <div className="space-y-2">
                      {selectedTransportes.map((transporte) => (
                        <div key={transporte.id} className="flex items-center justify-between gap-3 text-sm">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{formatVehicleTitle(transporte)}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{t('requisitions.ui.capacityLabel')}: {formatLotacao(transporte.lotacao)}</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 px-3"
                            onClick={() => toggleSelectedTransport(transporte.id, false)}
                          >
                            {t('requisitions.ui.remove')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {loadingCatalogo && (
                  <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-6 text-sm text-gray-500 dark:text-gray-400">
                    {t('requisitions.ui.loadingVehicles')}
                  </div>
                )}

                {!loadingCatalogo && transportesPorCategoria.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-6 text-sm text-gray-500 dark:text-gray-400">
                    {t('requisitions.ui.noVehiclesInCatalog')}
                  </div>
                )}

                {!loadingCatalogo && transportesPorCategoria.length > 0 && (
                  <div className="space-y-4">
                    {transportesPorCategoria.map((grupo) => (
                      <div key={grupo.categoria} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                        <button
                          type="button"
                          onClick={() => toggleTransporteCategoriaExpansion(grupo.categoria)}
                          className="w-full px-4 py-3 flex items-center justify-between text-left"
                        >
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            {t(grupo.label)}
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{t('requisitions.ui.vehiclesCount', { count: grupo.items.length })}</span>
                          </p>
                          {expandedTransporteCategorias[grupo.categoria] ? (
                            <ChevronUp className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          )}
                        </button>

                        {expandedTransporteCategorias[grupo.categoria] && (
                          <div className="px-3 pb-3 grid grid-cols-1 xl:grid-cols-3 gap-3">
                            {grupo.items.map((transporte) => {
                              const isSelected = selectedTransportIds.includes(String(transporte.id));
                              const isRecommended = recommendedTransportIds.includes(transporte.id);
                              const detailsOpen = expandedTransporteDetalhes[transporte.id] === true;
                              const isUnavailable = transportesIndisponiveis.has(transporte.id);
                                let transporteCardClass = 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900';
                                if (isSelected) {
                                  transporteCardClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 shadow-sm';
                                } else if (isUnavailable) {
                                  transporteCardClass = 'border-amber-300 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/10';
                                }

                              return (
                                <div
                                  key={transporte.id}
                                  className={`rounded-xl border p-4 transition-all ${transporteCardClass}`}
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
                                            {t('requisitions.ui.suggested')}
                                          </span>
                                        )}
                                        {isUnavailable && (
                                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                            {t('requisitions.ui.unavailable')}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatVehicleTitle(transporte)}</p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">{t('requisitions.ui.capacityLabel')}: {formatLotacao(transporte.lotacao)}</p>
                                      {isUnavailable && (
                                        <p className="text-xs text-amber-700 dark:text-amber-300">{t('requisitions.ui.overlapWarning')}</p>
                                      )}
                                    </div>
                                    <Checkbox
                                      checked={isSelected}
                                      disabled={isUnavailable}
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
                                      {detailsOpen ? t('requisitions.ui.hideDetails') : t('requisitions.ui.details')}
                                    </Button>
                                  </div>

                                  {detailsOpen && (
                                    <div className="mt-3 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                      <p>{formatTransporteCategoria(transporte.categoria)}</p>
                                      <p>{t('requisitions.ui.licensePlate')}: {transporte.matricula ?? t('requisitions.ui.noLicensePlate')}</p>
                                      <p>{t('requisitions.ui.brandModel')}: {[transporte.marca, transporte.modelo].filter(Boolean).join(' ') || t('requisitions.ui.notDefined')}</p>
                                      <p>{t('requisitions.ui.licenseDate')}: {transporte.dataMatricula ? new Date(transporte.dataMatricula).toLocaleDateString('pt-PT') : t('requisitions.ui.notDefined')}</p>
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
            <div className="space-y-4">
              <div>
                <label htmlFor="req-create-assunto" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.subjectOptional')}</label>
                <Input id="req-create-assunto" className={inputFieldClassName} type="text" value={assunto} onChange={(e) => setAssunto(e.target.value)} placeholder={t('requisitions.ui.subjectPlaceholder')} />
              </div>
              <RequisitionsCreateManutencaoForm
                manutencaoItems={manutencaoItems}
                expandedManutencaoCategorias={expandedManutencaoCategorias}
                expandedManutencaoItems={expandedManutencaoItems}
                selectedManutencaoItemIds={selectedManutencaoItemIds}
                onToggleCategoriaExpansion={toggleManutencaoCategoriaExpansion}
                onToggleItemVisibility={toggleManutencaoItemVisibility}
                onToggleItem={toggleManutencaoItem}
                t={t}
              />
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
          {t('requisitions.ui.close')}
        </Button>
        <Button onClick={handleCreate} disabled={submitting} className="bg-purple-600 hover:bg-purple-700 text-white">
          {submitting ? t('requisitions.ui.creatingRequest') : t('requisitions.ui.createRequest')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <RequisitionsStatsCards
        stats={stats}
        onCardShortcut={handleCardShortcut}
        t={t}
      />

      <div className="lg:hidden space-y-6">
        <GlassCard className="w-full p-0 overflow-hidden border border-gray-300 dark:border-gray-700">
          <button
            type="button"
            onClick={() => toggleSection('create')}
            className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
            aria-label={t('requisitions.ui.toggleNewRequestSection')}
          >
            <div className="text-left">
              <h2 className={`text-xl font-semibold ${headingClass}`}>{t('requisitions.ui.newRequest')}</h2>
              {activeSection !== 'create' && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('requisitions.ui.clickToOpenForm')}</p>}
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
            aria-label={t('requisitions.ui.toggleRequestsSection')}
          >
            <div className="text-left">
              <h2 className={`text-xl font-semibold ${headingClass}`}>{t('requisitions.ui.requests')}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{summaryText}</p>
            </div>
            {activeSection === 'list' ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
          </button>

          {activeSection === 'list' && (
            <div className="px-5 pb-5 space-y-4">
              <RequisitionsListFiltersContent
                desktop={false}
                activeTab={activeTab}
                onSelectTab={handleSelectTab}
                filterEstado={filterEstado}
                setFilterEstado={setFilterEstado}
                filterPrioridade={filterPrioridade}
                setFilterPrioridade={setFilterPrioridade}
                filterCriadoPorNome={filterCriadoPorNome}
                setFilterCriadoPorNome={setFilterCriadoPorNome}
                filterGeridoPorNome={filterGeridoPorNome}
                setFilterGeridoPorNome={setFilterGeridoPorNome}
                onSearch={() => fetchRequisicoes()}
                onClearFilters={handleClearFilters}
                loading={loading}
                requisicoes={requisicoes}
                onOpenRequisicao={handleOpenRequisicao}
                selectFieldClassName={selectFieldClassName}
                inputFieldClassName={inputFieldClassName}
                formatDateTimeOrDash={formatDateTimeOrDash}
                t={t}
              />
            </div>
          )}
        </GlassCard>
      </div>

      <div className="hidden lg:flex gap-6 items-stretch">
        <GlassCard className={`p-0 overflow-hidden border border-gray-300 dark:border-gray-700 transition-all duration-300 ${activeSection === 'create' ? 'w-1/5 min-w-[180px]' : 'w-full'}`}>
          {activeSection === 'create' ? (
            <button
              type="button"
              onClick={() => toggleSection('list')}
              className="h-full w-full min-h-[560px] px-3 py-6 flex flex-col items-center justify-center gap-3 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
              aria-label={t('requisitions.ui.toggleRequestsSection')}
            >
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('requisitions.ui.requests')}</span>
              <ChevronLeft className="w-5 h-5 text-gray-500 rotate-180" />
            </button>
          ) : (
            <>
              <div className="px-5 py-5 border-b border-gray-200 dark:border-gray-800">
                <h2 className={`text-xl font-semibold ${headingClass}`}>{t('requisitions.ui.requests')}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{summaryText}</p>
              </div>

              <div className="px-5 pb-5 pt-4 space-y-4">
                <RequisitionsListFiltersContent
                  desktop
                  activeTab={activeTab}
                  onSelectTab={handleSelectTab}
                  filterEstado={filterEstado}
                  setFilterEstado={setFilterEstado}
                  filterPrioridade={filterPrioridade}
                  setFilterPrioridade={setFilterPrioridade}
                  filterCriadoPorNome={filterCriadoPorNome}
                  setFilterCriadoPorNome={setFilterCriadoPorNome}
                  filterGeridoPorNome={filterGeridoPorNome}
                  setFilterGeridoPorNome={setFilterGeridoPorNome}
                  onSearch={() => fetchRequisicoes()}
                  onClearFilters={handleClearFilters}
                  loading={loading}
                  requisicoes={requisicoes}
                  onOpenRequisicao={handleOpenRequisicao}
                  selectFieldClassName={selectFieldClassName}
                  inputFieldClassName={inputFieldClassName}
                  formatDateTimeOrDash={formatDateTimeOrDash}
                  t={t}
                />

              </div>
            </>
          )}
        </GlassCard>

        <GlassCard className={`p-0 overflow-hidden border border-gray-300 dark:border-gray-700 transition-all duration-300 ${activeSection === 'create' ? 'w-4/5 opacity-100' : 'w-[160px] opacity-100'}`}>
          <button
            type="button"
            onClick={() => toggleSection('create')}
            className={`w-full transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/50 ${activeSection === 'create'
              ? 'flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800'
              : 'h-full min-h-[560px] px-3 py-6 flex flex-col items-center justify-center gap-3'
              }`}
            aria-label={t('requisitions.ui.toggleNewRequestSection')}
          >
            {activeSection === 'create' ? (
              <>
                <div className="text-left">
                  <h2 className={`text-lg font-semibold ${headingClass}`}>{t('requisitions.ui.newRequest')}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('requisitions.ui.creationPanel')}</p>
                </div>
                <ChevronUp className="w-5 h-5 text-gray-500" />
              </>
            ) : (
              <>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('requisitions.ui.create')}</span>
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

      <RequisitionDetailsDialog
        open={openedRequisicaoId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setOpenedRequisicaoId(null);
            limparEstadoConflito();
          }
        }}
        selectedRequisicao={selectedRequisicao}
        canManageRequests={canManageRequests}
        estadoEdicao={estadoEdicao}
        onChangeEstadoEdicao={setEstadoEdicao}
        podeAtualizarEstado={podeAtualizarEstado}
        estadosVisiveisSelecionados={estadosVisiveisSelecionados}
        updatingEstadoId={updatingEstadoId}
        onClose={() => setOpenedRequisicaoId(null)}
        onSaveStatus={handleAtualizarEstado}
        locale={locale}
        t={t}
      />

      {canManageRequests && (
        <RequisitionsConflictDialog
          open={conflitoDialogOpen}
          onOpenChange={setConflitoDialogOpen}
          conflitosPendentes={conflitosPendentes}
          conflitoTransportesNomes={conflitoTransportesNomes}
          conflitoDialogMode={conflitoDialogMode}
          locale={locale}
          updatingEstadoId={updatingEstadoId}
          openedRequisicaoId={openedRequisicaoId}
          onOpenRequisicao={abrirRequisicaoPorId}
          onCloseRequisicao={() => {
            limparEstadoConflito();
            setOpenedRequisicaoId(null);
          }}
          onCancel={() => setConflitoDialogOpen(false)}
          onContinueAccept={handleContinuarAceitacaoComConflitos}
          savingLabel={t('common.saving')}
        />
      )}

      <RequisitionsCreateMaterialDialog
        open={createMaterialDialogOpen}
        onOpenChange={setCreateMaterialDialogOpen}
        inputFieldClassName={inputFieldClassName}
        textareaFieldClassName={textareaFieldClassName}
        novoMaterialNome={novoMaterialNome}
        novoMaterialDescricao={novoMaterialDescricao}
        novoMaterialCategoria={novoMaterialCategoria}
        novoMaterialAtributo={novoMaterialAtributo}
        novoMaterialValorAtributo={novoMaterialValorAtributo}
        submittingMaterial={submittingMaterial}
        onChangeNome={setNovoMaterialNome}
        onChangeDescricao={setNovoMaterialDescricao}
        onChangeCategoria={setNovoMaterialCategoria}
        onChangeAtributo={setNovoMaterialAtributo}
        onChangeValorAtributo={setNovoMaterialValorAtributo}
        onCancel={() => setCreateMaterialDialogOpen(false)}
        onCreate={handleCriarMaterialCatalogo}
        t={t}
      />
    </div>
  );
}
