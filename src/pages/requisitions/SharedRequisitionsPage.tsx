import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { GlassCard } from '../../components/ui/glass-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { parseDateInput } from '../../components/ui/date-picker-field';
import { ApiRequestError } from '../../services/api/core/client';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { useRequisitionFilters } from '../../hooks/requisitions/useRequisitionFilters';
import { useRequisitionCreateForm } from '../../hooks/requisitions/useRequisitionCreateForm';
import { useRequisitionCatalog } from '../../hooks/requisitions/useRequisitionCatalog';
import {
  ManutencaoCategoria,
  MaterialCategoria,
  MaterialCatalogo,
  RequisicaoEstado,
  RequisicaoPrioridade,
  RequisicaoResponse,
  RequisicaoTipo,
  TransporteCategoria,
  requisicoesApi,
} from '../../services/api';
import {
  ConflitoDialogMode,
  CreateField,
  MATERIAL_CATEGORIA_OPTIONS,
  MaterialItemGroup,
  RequisicaoConflito,
  RequisicoesTab,
  TRANSPORTE_CATEGORIA_OPTIONS,
  composeDateTime,
  createEmptyMaterialLinha,
  formatTransporteDisplay,
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
import { RequisitionsCreateCommonFields } from '../../components/shared/requisitions/RequisitionsCreateCommonFields';
import { RequisitionsCreateMaterialForm } from '../../components/shared/requisitions/RequisitionsCreateMaterialForm';
import { RequisitionsCreateTransportForm } from '../../components/shared/requisitions/RequisitionsCreateTransportForm';

/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable sonarjs/no-nested-functions */

export interface SharedRequisitionsPageProps {
  isDarkMode: boolean;
  currentUserId: number;
  initialTipo?: RequisicaoTipo;
  initialPrioridade?: RequisicaoPrioridade;
  scopeRole?: 'ALL' | 'BALNEARIO' | 'ESCOLA' | 'INTERNO';
  canManageRequests?: boolean;
  initialSection?: 'create' | 'list';
  onDirtyChange?: (isDirty: boolean) => void;
}

export function SharedRequisitionsPage({
  isDarkMode,
  currentUserId,
  initialTipo,
  initialPrioridade,
  scopeRole = 'ALL',
  canManageRequests = true,
  initialSection = 'list',
  onDirtyChange,
}: Readonly<SharedRequisitionsPageProps>) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialParams = useMemo(() => ({
    mode: searchParams.get('mode') as 'list' | 'create' | null,
    tab: searchParams.get('tab') as string | null,
    type: searchParams.get('type') as RequisicaoTipo | null,
    priority: searchParams.get('priority') as RequisicaoPrioridade | null,
  }), []); // Capture once on mount

  const locale = i18n.language.startsWith('en') ? 'en-GB' : 'pt-PT';
  const formatDateTimeOrDash = (value?: string | null) => {
    if (!value) return '—';
    return new Date(value).toLocaleString(locale);
  };

  // Use custom hooks for state management
  const filters = useRequisitionFilters(initialParams.type ?? initialTipo, initialParams.priority ?? initialPrioridade);
  const createForm = useRequisitionCreateForm(initialParams.type ?? initialTipo, initialParams.priority ?? initialPrioridade);
  const catalog = useRequisitionCatalog(t);

  // List and dialog state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requisicoes, setRequisicoes] = useState<RequisicaoResponse[]>([]);
  const [monthlyRequisicoes, setMonthlyRequisicoes] = useState<RequisicaoResponse[]>([]);
  const [todasRequisicoesTransporteAceites, setTodasRequisicoesTransporteAceites] = useState<RequisicaoResponse[]>([]);
  const [activeSection, setActiveSection] = useState<'list' | 'create'>(() => {
    if (initialParams.mode === 'list' || initialParams.mode === 'create') return initialParams.mode;
    return initialSection;
  });
  const [openedRequisicaoId, setOpenedRequisicaoId] = useState<number | null>(null);
  const [estadoEdicao, setEstadoEdicao] = useState<RequisicaoEstado>('EM_PROGRESSO');
  const [updatingEstadoId, setUpdatingEstadoId] = useState<number | null>(null);
  const [conflitoDialogOpen, setConflitoDialogOpen] = useState(false);
  const [conflitosPendentes, setConflitosPendentes] = useState<RequisicaoConflito[]>([]);
  const [conflitoTransportesNomes, setConflitoTransportesNomes] = useState<string[]>([]);
  const [conflitoDialogMode, setConflitoDialogMode] = useState<ConflitoDialogMode>('warning');
  const [submittingMaterial, setSubmittingMaterial] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const isRequestVisibleForScope = useCallback((requisicao?: RequisicaoResponse | null): boolean => {
    if (!requisicao) return false;
    if (scopeRole === 'ALL') return true;
    return requisicao.criadoPor?.tipo === scopeRole;
  }, [scopeRole]);

  const applyScopeFilter = useCallback((lista: RequisicaoResponse[]): RequisicaoResponse[] => {
    if (scopeRole === 'ALL') return lista;
    return lista.filter((item) => isRequestVisibleForScope(item));
  }, [scopeRole, isRequestVisibleForScope]);

  const isSecretaryView = scopeRole === 'ALL' && canManageRequests;

  // Sync URL from state with comparison to avoid loops
  useEffect(() => {
    if (initialParams.tab) {
      filters.setActiveTab(initialParams.tab as any);
    }
  }, [initialParams.tab]);

  /* 
  useEffect(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('mode', activeSection);
      next.set('tab', filters.activeTab);
      if (filters.filterTipo) next.set('type', filters.filterTipo);
      else next.delete('type');
      if (filters.filterPrioridade) next.set('priority', filters.filterPrioridade);
      else next.delete('priority');
      
      if (next.toString() === prev.toString()) return prev;
      return next;
    }, { replace: true });
  }, [activeSection, filters.activeTab, filters.filterTipo, filters.filterPrioridade, setSearchParams]);
  */

  // Dirty state and navigation guards
  useEffect(() => {
    onDirtyChange?.(createForm.isDirty);
  }, [createForm.isDirty, onDirtyChange]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeSection === 'create' && createForm.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeSection, createForm.isDirty]);

  const fetchRequisicoes = useCallback(async (overrides?: {
    estado?: RequisicaoEstado | '';
    tipo?: RequisicaoTipo | '';
    prioridade?: RequisicaoPrioridade | '';
    criadoPorNome?: string;
    geridoPorNome?: string;
    criadoPorTipo?: '' | 'SECRETARIA' | 'ESCOLA' | 'BALNEARIO' | 'INTERNO';
  }) => {
    const estado = overrides?.estado ?? filters.filterEstado;
    const tipoFiltro = overrides?.tipo ?? filters.filterTipo;
    const prioridadeFiltro = overrides?.prioridade ?? filters.filterPrioridade;
    const criadoPor = overrides?.criadoPorNome ?? filters.filterCriadoPorNome;
    const geridoPor = overrides?.geridoPorNome ?? filters.filterGeridoPorNome;
    const criadoPorTipo = overrides?.criadoPorTipo ?? filters.filterCriadoPorTipo;

    try {
      setLoading(true);
      const data = await requisicoesApi.procurar({
        estado: estado || undefined,
        tipo: tipoFiltro || undefined,
        prioridade: prioridadeFiltro || undefined,
        criadoPorNome: criadoPor || undefined,
        geridoPorNome: geridoPor || undefined,
      });
      const listaScope = applyScopeFilter(Array.isArray(data) ? data : []);
      const lista = isSecretaryView && criadoPorTipo
        ? listaScope.filter((item) => item.criadoPor?.tipo === criadoPorTipo)
        : listaScope;
      setRequisicoes(lista);
    } catch (error: any) {
      toast.error(error?.message || t('requisitions.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [filters, t, isSecretaryView, applyScopeFilter, activeSection]);

  const fetchMonthlyRequisicoes = useCallback(async () => {
    if (activeSection !== 'list') return;
    try {
      const data = await requisicoesApi.procurar({});
      const lista = applyScopeFilter(Array.isArray(data) ? data : []);
      setMonthlyRequisicoes(lista);
    } catch (error: any) {
      console.error('Failed to fetch monthly requisitions:', error);
    }
  }, [applyScopeFilter, activeSection]);

  useEffect(() => {
    if (activeSection !== 'list') return;
    fetchMonthlyRequisicoes();
    fetchRequisicoes({
      estado: '',
      tipo: initialTipo ?? '',
      prioridade: initialPrioridade ?? '',
      criadoPorNome: '',
      geridoPorNome: '',
    });
  }, [initialTipo, initialPrioridade, filters.filterCriadoPorTipo, scopeRole, canManageRequests, fetchRequisicoes, fetchMonthlyRequisicoes, activeSection]);

  useEffect(() => {
    createForm.setCreateErrors({});
    createForm.setCreateTouched({});
  }, [createForm.tipo]);

  // Fetch all accepted transport requisitions (without role filter) for conflict detection
  useEffect(() => {
    if (createForm.tipo !== 'TRANSPORTE') return;

    const fetchAcceptedTransports = async () => {
      try {
        const todasRequisicoes = await requisicoesApi.procurar({
          tipo: 'TRANSPORTE',
          estado: 'EM_PROGRESSO'
        });
        setTodasRequisicoesTransporteAceites(Array.isArray(todasRequisicoes) ? todasRequisicoes : []);
      } catch (error: any) {
        console.error('Failed to fetch accepted transport requisitions:', error);
      }
    };

    fetchAcceptedTransports();
  }, [createForm.tipo]);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const materiaisPorCategoria = useMemo(() => {
    const map = new Map<string, MaterialItemGroup[]>();
    const uniqueCategories = Array.from(new Set(catalog.materiais.map(m => m.categoria).filter((c): c is string => !!c)));

    uniqueCategories.forEach((catValue) => {
      const materiaisCategoria = catalog.materiais.filter((material) => material.categoria === catValue);
      const byNome = new Map<string, MaterialCatalogo[]>();

      materiaisCategoria.forEach((material) => {
        const nomeKey = normalizarTexto(material.nome) || String(material.id);
        const existentes = byNome.get(nomeKey) ?? [];
        byNome.set(nomeKey, [...existentes, material]);
      });

      const grupos = Array.from(byNome.entries()).map(([nomeKey, variantes]) => ({
        itemKey: `${catValue}:${nomeKey}`,
        nome: variantes[0]?.nome ?? 'Material',
        categoria: catValue as MaterialCategoria,
        variantes,
      }));

      map.set(catValue, grupos);
    });

    return map;
  }, [catalog.materiais]);

  const transportesOrdenados = useMemo(
    () => [...catalog.transportes].sort((a, b) => {
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
    [catalog.transportes],
  );

  const dataHoraSaidaSelecionada = useMemo(
    () => composeDateTime(createForm.dataSaida, createForm.horaSaida),
    [createForm.dataSaida, createForm.horaSaida],
  );

  const dataHoraRegressoSelecionada = useMemo(
    () => composeDateTime(createForm.dataRegresso, createForm.horaRegresso),
    [createForm.dataRegresso, createForm.horaRegresso],
  );

  const transportesIndisponiveis = useMemo(() => {
    if (createForm.tipo !== 'TRANSPORTE') return new Set<number>();

    const ids = new Set<number>();

    // Check against ALL accepted transport requisitions from all roles
    // This ensures vehicles blocked by any role are shown as unavailable
    const todasRequisicoes = todasRequisicoesTransporteAceites.length > 0
      ? todasRequisicoesTransporteAceites
      : monthlyRequisicoes;

    todasRequisicoes.forEach((requisicao) => {
      if (requisicao.tipo !== 'TRANSPORTE' || requisicao.estado !== 'EM_PROGRESSO') return;
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
  }, [dataHoraRegressoSelecionada, dataHoraSaidaSelecionada, monthlyRequisicoes, todasRequisicoesTransporteAceites, createForm.tipo]);

  const transportesOrdenadosDisponiveis = useMemo(
    () => transportesOrdenados.filter((transporte) => !transportesIndisponiveis.has(transporte.id)),
    [transportesIndisponiveis, transportesOrdenados],
  );

  const transportesPorCategoria = useMemo(() => {
    const uniqueCategories = Array.from(new Set(catalog.transportes.map(t => t.categoria).filter((c): c is string => !!c)));
    
    return uniqueCategories.map((catValue) => {
      const standardOption = TRANSPORTE_CATEGORIA_OPTIONS.find(opt => opt.value === catValue);
      return {
        categoria: catValue,
        label: standardOption?.label ?? catValue,
        items: transportesOrdenados.filter((transporte) => transporte.categoria === catValue),
      };
    }).filter((grupo) => grupo.items.length > 0);
  }, [catalog.transportes, transportesOrdenados]);

  const passageirosSolicitados = useMemo(() => {
    const value = Number(createForm.numeroPassageiros || 0);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }, [createForm.numeroPassageiros]);

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
    // K (Peso/Penalização de usar 1 viatura extra)
    // Para 17 passageiros, usar 3 carrinhas (3 lugares vazios totais) vs 1 autocarro (12 lugares vazios):
    // Se K for pequeno, o DP escolhe as 3 carrinhas para evitar levar 12 lugares vazios às costas.
    // Usando K = ceil(passageiros / 2.5) e min de 3:
    // Ex 1: 5 pass (K=3) -> 2 carros (custo=2×3+3vazios=9) vs 1 bus (custo=1×3+24vazios=27). Traz 2 carros.
    // Ex 2: 17 pass (K=7) -> 3 carrinhas (custo=3×7+3vazios=24) vs 1 bus (custo=1×7+12vazios=19). Traz o minibus!
    const penalizacaoViatura = Math.max(3, Math.ceil(passageirosSolicitados / 2.5));

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
    if (createForm.tipo !== 'TRANSPORTE' || createForm.transportSelectionMode !== 'auto') {
      return;
    }
    createForm.setSelectedTransportIds(recommendedTransportIds.map(String));
  }, [recommendedTransportIds, createForm.transportSelectionMode, createForm.tipo]);

  useEffect(() => {
    if (createForm.tipo !== 'TRANSPORTE' || createForm.selectedTransportIds.length === 0) {
      return;
    }

    const selectedDisponiveis = createForm.selectedTransportIds.filter((id) => !transportesIndisponiveis.has(Number(id)));
    if (selectedDisponiveis.length === createForm.selectedTransportIds.length) {
      return;
    }

    createForm.setSelectedTransportIds(selectedDisponiveis);
    if (createForm.createTouched.transporteIds) {
      setTimeout(() => validateAndSetField('transporteIds'), 0);
    }
  }, [createForm.createTouched.transporteIds, createForm.selectedTransportIds, createForm.tipo, transportesIndisponiveis]);

  const selectedTransportes = useMemo(
    () => transportesOrdenados.filter((item) => createForm.selectedTransportIds.includes(String(item.id))),
    [createForm.selectedTransportIds, transportesOrdenados],
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
    if (createForm.tipo !== 'TRANSPORTE' || !createForm.dataSaida) return;

    if (!createForm.dataRegresso) {
      createForm.setDataRegresso(createForm.dataSaida);
    }

    if (!createForm.tempoLimiteManuallyEdited) {
      const previousDate = previousDateInput(createForm.dataSaida);
      createForm.setTempoLimite(previousDate ? parseDateInput(previousDate) : undefined);
    }
  }, [createForm.tipo, createForm.dataSaida, createForm.dataRegresso, createForm.tempoLimiteManuallyEdited]);

  useEffect(() => {
    if (createForm.createTouched.materialItens) {
      validateAndSetField('materialItens');
    }
  }, [createForm.materialLinhas, createForm.createTouched.materialItens]);

  useEffect(() => {
    if (createForm.tipo !== 'TRANSPORTE') return;

    const temAlgumValorDataHora = Boolean(createForm.dataSaida || createForm.horaSaida || createForm.dataRegresso || createForm.horaRegresso);
    if (!temAlgumValorDataHora) return;

    // Revalida após atualização de estado para evitar checks com valores antigos no onChange.
    validateAndSetField('dataSaida');
    validateAndSetField('horaSaida');
    validateAndSetField('dataRegresso');
    validateAndSetField('horaRegresso');
  }, [createForm.tipo, createForm.dataSaida, createForm.horaSaida, createForm.dataRegresso, createForm.horaRegresso]);




  // eslint-disable-next-line sonarjs/cognitive-complexity
  const validateCreateField = useCallback((field: CreateField): string | undefined => {
    if (field === 'descricao') {
      return undefined;
    }

    if (field === 'tempoLimite') {
      if (!createForm.tempoLimite) return undefined;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const limite = new Date(createForm.tempoLimite);
      limite.setHours(0, 0, 0, 0);

      if (limite < today) return t('requisitions.errors.deadlineCannotBePast');

      if (createForm.tipo === 'TRANSPORTE' && createForm.dataSaida) {
        const saidaMatch = parseDateInput(createForm.dataSaida);
        if (saidaMatch && limite >= saidaMatch) return t('requisitions.errors.deadlineBeforeDeparture');
      }

      return undefined;
    }

    if (createForm.tipo === 'MATERIAL' && field === 'materialItens') {
      const linhasValidas = createForm.materialLinhas.filter((linha) => linha.materialId && Number(linha.quantidade) > 0);
      if (linhasValidas.length === 0) return t('requisitions.errors.addOneMaterial');
      return undefined;
    }

    if (createForm.tipo === 'MANUTENCAO' && field === 'manutencaoItens') {
      if (createForm.selectedManutencaoItemIds.length === 0) return t('requisitions.errors.addOneMaintenanceItem');
      return undefined;
    }

    if (createForm.tipo !== 'TRANSPORTE') return undefined;

    if (field === 'destino' && !createForm.destinoTransporte.trim()) return t('requisitions.errors.requiredField');
    if (field === 'dataSaida' && !createForm.dataSaida) return t('requisitions.errors.requiredField');
    if (field === 'horaSaida' && !createForm.horaSaida) return t('requisitions.errors.requiredField');
    if (field === 'dataRegresso' && !createForm.dataRegresso) return t('requisitions.errors.requiredField');
    if (field === 'horaRegresso' && !createForm.horaRegresso) return t('requisitions.errors.requiredField');

    if ((field === 'dataSaida' || field === 'horaSaida') && createForm.dataSaida && isDateInputInPast(createForm.dataSaida)) {
      return t('requisitions.errors.dateCannotBePast');
    }

    if ((field === 'dataRegresso' || field === 'horaRegresso') && createForm.dataRegresso && isDateInputInPast(createForm.dataRegresso)) {
      return t('requisitions.errors.dateCannotBePast');
    }

    if (field === 'numeroPassageiros') {
      if (!createForm.numeroPassageiros) return t('requisitions.errors.requiredField');
      if (passageirosSolicitados < 1) return t('requisitions.errors.invalidPassengers');
      return undefined;
    }

    if (field === 'transporteIds' && createForm.selectedTransportIds.length === 0) {
      return t('requisitions.errors.selectOneVehicle');
    }

    const saida = composeDateTime(createForm.dataSaida, createForm.horaSaida);
    const regresso = composeDateTime(createForm.dataRegresso, createForm.horaRegresso);
    if ((field === 'horaRegresso' || field === 'dataRegresso') && saida && regresso) {
      const saidaDate = new Date(saida);
      const regressoDate = new Date(regresso);
      if (!Number.isNaN(saidaDate.getTime()) && !Number.isNaN(regressoDate.getTime()) && regressoDate <= saidaDate) {
        return t('requisitions.errors.returnAfterDeparture');
      }
    }

    return undefined;
  }, [createForm, passageirosSolicitados, t]);

  const validateAndSetField = useCallback((field: CreateField, markTouched = false): string | undefined => {
    const error = validateCreateField(field);
    if (markTouched) {
      createForm.setFieldTouched(field);
    }
    createForm.setFieldError(field, error);
    return error;
  }, [validateCreateField, createForm]);

  useEffect(() => {
    if (createForm.createTouched.tempoLimite) {
      validateAndSetField('tempoLimite');
    }
  }, [createForm.tempoLimite, createForm.dataSaida, createForm.createTouched.tempoLimite, validateAndSetField]);

  const toCreateFieldErrors = (error: ApiRequestError): Partial<Record<CreateField, string>> => {
    if (!error.fieldErrors) return {};

    const mapped: Partial<Record<CreateField, string>> = {};
    Object.entries(error.fieldErrors).forEach(([key, value]) => {
      if (key === 'descricao') mapped.descricao = value;
      if (key === 'itens' && createForm.tipo === 'MATERIAL') mapped.materialItens = value;
      if (key === 'manutencaoItens') mapped.manutencaoItens = value;
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

  const handleCriarMaterialCatalogo = useCallback(async () => {
    if (!createForm.novoMaterialNome.trim()) {
      toast.error(t('requisitions.material.errors.nameRequired'));
      return;
    }
    if (!createForm.novoMaterialAtributo.trim() || !createForm.novoMaterialValorAtributo.trim()) {
      toast.error(t('requisitions.material.errors.attributeRequired'));
      return;
    }

    try {
      setSubmittingMaterial(true);
      await requisicoesApi.criarMaterialCatalogo({
        nome: createForm.novoMaterialNome.trim(),
        descricao: createForm.novoMaterialDescricao.trim() || undefined,
        categoria: createForm.novoMaterialCategoria as MaterialCategoria,
        atributo: createForm.novoMaterialAtributo.trim(),
        valorAtributo: createForm.novoMaterialValorAtributo.trim(),
      });
      toast.success(t('requisitions.material.messages.created'));

      // Update catalog
      catalog.fetchCatalogo();
      createForm.resetMaterialDialog();
      createForm.setCreateMaterialDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.message || t('requisitions.material.errors.createFailed'));
    } finally {
      setSubmittingMaterial(false);
    }
  }, [createForm, catalog, t]);

  const handleRemoveMaterialLinha = useCallback((rowId: string) => {
    createForm.setMaterialLinhas((prev) => prev.filter((item) => item.rowId !== rowId));
  }, [createForm]);

  const toggleItemAttributesVisibility = useCallback((itemKey: string) => {
    createForm.setExpandedMaterialItems((prev) => ({ ...prev, [itemKey]: prev[itemKey] === false }));
  }, [createForm]);

  const toggleCategoriaExpansion = useCallback((categoria: MaterialCategoria) => {
    createForm.setExpandedMaterialCategorias((prev) => ({ ...prev, [categoria]: !prev[categoria] }));
  }, [createForm]);

  const toggleTransporteCategoriaExpansion = useCallback((categoria: TransporteCategoria) => {
    createForm.setExpandedTransporteCategorias((prev) => ({ ...prev, [categoria]: !prev[categoria] }));
  }, [createForm]);

  const toggleTransporteDetalhes = useCallback((transporteId: number) => {
    createForm.setExpandedTransporteDetalhes((prev) => ({ ...prev, [transporteId]: !prev[transporteId] }));
  }, [createForm]);

  const toggleManutencaoCategoriaExpansion = useCallback((categoria: ManutencaoCategoria) => {
    createForm.setExpandedManutencaoCategorias((prev) => ({ ...prev, [categoria]: !prev[categoria] }));
  }, [createForm]);

  const toggleManutencaoItem = useCallback((itemId: number, checked: boolean) => {
    if (checked) {
      createForm.setSelectedManutencaoItemIds((prev) => [...new Set([...prev, itemId])]);
    } else {
      createForm.setSelectedManutencaoItemIds((prev) => prev.filter((id) => id !== itemId));
    }
  }, [createForm]);

  const updateManutencaoObservacaoCategoria = useCallback((categoria: string, observacao: string) => {
    createForm.setManutencaoObservacoesPorCategoria((prev) => ({
      ...prev,
      [categoria]: observacao,
    }));
  }, [createForm]);

  const toggleVariante = useCallback((materialId: number, checked: boolean) => {
    createForm.setMaterialLinhas((prev) => {
      const materialIdStr = String(materialId);
      const existing = prev.find((item) => item.materialId === materialIdStr);

      if (checked) {
        if (existing) return prev;
        return [...prev, { ...createEmptyMaterialLinha(), materialId: materialIdStr, quantidade: '1' }];
      }

      return prev.filter((item) => item.materialId !== materialIdStr);
    });
  }, [createForm]);

  const handleItemToggle = useCallback((item: MaterialItemGroup, checked: boolean) => {
    if (checked) {
      createForm.setExpandedMaterialItems((prev) => ({ ...prev, [item.itemKey]: true }));
      if (item.variantes.length === 1) {
        toggleVariante(item.variantes[0].id, true);
      }
      return;
    }

    createForm.setExpandedMaterialItems((prev) => {
      const next = { ...prev };
      delete next[item.itemKey];
      return next;
    });

    createForm.setMaterialLinhas((prev) => {
      const ids = new Set(item.variantes.map((variante) => String(variante.id)));
      return prev.filter((linha) => !ids.has(linha.materialId));
    });
  }, [createForm, toggleVariante]);

  const updateVarianteQuantidade = useCallback((materialId: number, quantidade: string) => {
    let finalValue = quantidade;

    if (finalValue !== '') {
      const valor = Number(finalValue);
      if (Number.isNaN(valor)) return;
      if (valor < 1) {
        finalValue = '1';
      } else {
        finalValue = String(Math.floor(valor));
      }
    }

    createForm.setMaterialLinhas((prev) =>
      prev.map((linha) =>
        linha.materialId === String(materialId)
          ? { ...linha, quantidade: finalValue }
          : linha,
      ),
    );
  }, [createForm]);

  const handleResetCreateForm = useCallback(() => {
    createForm.resetForm();
  }, [createForm]);

  const toggleSelectedTransport = useCallback((transporteId: number, checked: boolean) => {
    if (checked && transportesIndisponiveis.has(transporteId)) {
      return;
    }

    const transporteIdStr = String(transporteId);
    createForm.setTransportSelectionMode('manual');
    createForm.setSelectedTransportIds((prev) => {
      if (checked) {
        return prev.includes(transporteIdStr) ? prev : [...prev, transporteIdStr];
      }
      return prev.filter((item) => item !== transporteIdStr);
    });
    if (createForm.createTouched.transporteIds) {
      setTimeout(() => validateAndSetField('transporteIds'), 0);
    }
  }, [transportesIndisponiveis, createForm, validateAndSetField]);

  const handleAplicarSugestaoTransporte = useCallback(() => {
    createForm.setTransportSelectionMode('auto');
    createForm.setSelectedTransportIds(recommendedTransportIds.map(String));
    if (createForm.createTouched.transporteIds) {
      setTimeout(() => validateAndSetField('transporteIds'), 0);
    }
  }, [recommendedTransportIds, createForm, validateAndSetField]);

  const handlePreSubmit = useCallback(() => {
    if (!currentUserId) {
      toast.error(t('requisitions.errors.missingAuthenticatedUser'));
      return;
    }

    const fieldsToValidate: CreateField[] = [];
    fieldsToValidate.push('tempoLimite');

    if (createForm.tipo === 'MATERIAL') {
      fieldsToValidate.push('materialItens');
    }
    if (createForm.tipo === 'TRANSPORTE') {
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
    if (createForm.tipo === 'MANUTENCAO') {
      fieldsToValidate.push('manutencaoItens');
    }

    const validationErrors = fieldsToValidate
      .map((field) => ({ field, error: validateAndSetField(field, true) }))
      .filter((item) => Boolean(item.error));

    if (validationErrors.length > 0) {
      return;
    }

    setIsConfirmModalOpen(true);
  }, [currentUserId, createForm, validateAndSetField, t]);

  const confirmAndSubmit = useCallback(async () => {
    setSubmitting(true);
    const dataHoraSaida = composeDateTime(createForm.dataSaida, createForm.horaSaida);
    const dataHoraRegresso = composeDateTime(createForm.dataRegresso, createForm.horaRegresso);

    try {

      const payloadBase = {
        descricao: createForm.descricao.trim() || undefined,
        prioridade: createForm.prioridade,
        tempoLimite: toIsoFromDateOnly(createForm.tempoLimite),
        criadoPorId: currentUserId,
      };

      if (createForm.tipo === 'MATERIAL') {
        const linhasValidas = createForm.materialLinhas.filter((linha) => linha.materialId && Number(linha.quantidade) > 0);

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
        catalog.fetchCatalogo();
        toast.success(t('requisitions.messages.materialCreated'));
      } else if (createForm.tipo === 'TRANSPORTE') {
        await requisicoesApi.criarTransporte({
          ...payloadBase,
          destino: createForm.destinoTransporte.trim(),
          dataHoraSaida: dataHoraSaida!,
          dataHoraRegresso: dataHoraRegresso!,
          numeroPassageiros: passageirosSolicitados,
          condutor: createForm.condutorTransporte.trim() || undefined,
          transporteIds: createForm.selectedTransportIds.map(Number),
        });
      } else {
        const manutencaoItensPayload = createForm.selectedManutencaoItemIds.map((itemId) => {
          const item = catalog.manutencaoItems.find((m) => m.id === itemId);
          const observacaoCategoria = item ? item.categoria : '';
          return {
            itemId,
            observacoes: createForm.manutencaoObservacoesPorCategoria[observacaoCategoria] || undefined,
          };
        });

        await requisicoesApi.criarManutencao({
          ...payloadBase,
          manutencaoItens: manutencaoItensPayload.length > 0 ? manutencaoItensPayload : undefined,
        });
      }

      if (createForm.tipo !== 'MATERIAL') {
        toast.success(t('requisitions.messages.created'));
      }
      handleResetCreateForm();
      setIsConfirmModalOpen(false);
      setActiveSection('list');
      await fetchRequisicoes();
    } catch (error: any) {
      const apiError = error as ApiRequestError;
      const mappedErrors = toCreateFieldErrors(apiError);
      if (Object.keys(mappedErrors).length > 0) {
        createForm.setCreateErrors((prev) => ({ ...prev, ...mappedErrors }));
        createForm.setCreateTouched((prev) => {
          const next = { ...prev };
          Object.keys(mappedErrors).forEach((field) => {
            next[field as CreateField] = true;
          });
          return next;
        });
        setIsConfirmModalOpen(false); // Close if form error mapping fails
      } else {
        toast.error(error?.message || t('requisitions.errors.createFailed'));
      }
    } finally {
      setSubmitting(false);
    }
  }, [currentUserId, createForm, passageirosSolicitados, catalog, t, handleResetCreateForm, fetchRequisicoes]);

  const requisicoesRequestChainRef = useRef<Promise<void>>(Promise.resolve());

  const handleClearFilters = () => {
    filters.setFilterEstado('');
    if (filters.activeTab === 'URGENTE') {
      filters.setFilterTipo('');
      filters.setFilterPrioridade('URGENTE');
    } else if (filters.activeTab === 'GERAL') {
      filters.setFilterTipo('');
      filters.setFilterPrioridade('');
    } else {
      filters.setFilterTipo(filters.activeTab);
      filters.setFilterPrioridade('');
    }
    filters.setFilterCriadoPorNome('');
    filters.setFilterGeridoPorNome('');
    filters.setFilterCriadoPorTipo('');
  };

  const handleSelectTab = (tab: RequisicoesTab) => {
    filters.setActiveTab(tab);

    const nextTipo: RequisicaoTipo | '' = tab === 'GERAL' || tab === 'URGENTE' ? '' : tab;
    const nextPrioridade: RequisicaoPrioridade | '' = tab === 'URGENTE' ? 'URGENTE' : '';

    filters.setFilterTipo(nextTipo);
    filters.setFilterPrioridade(nextPrioridade);

    requisicoesRequestChainRef.current = requisicoesRequestChainRef.current
      .catch(() => {
        // Swallow errors from previous requests to keep the chain alive
      })
      .then(() =>
        fetchRequisicoes({
          estado: filters.filterEstado,
          tipo: nextTipo,
          prioridade: nextPrioridade,
          criadoPorNome: filters.filterCriadoPorNome,
          geridoPorNome: filters.filterGeridoPorNome,
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
      .filter((outra) => outra.estado !== 'FECHADO')
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

    const conflitosBloqueantes = conflitos.filter((conflito) => conflito.estado === 'FECHADO');
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
    // regardless of their state (except FECHADO), for automatic closure
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
      .filter((outra) => outra.estado !== 'FECHADO') // Don't reject closed requests
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

    if (req.estado === 'ABERTO') {
      try {
        setUpdatingEstadoId(req.id);
        const updatedReq = await requisicoesApi.atualizarEstado(req.id, { estado: 'EM_PROGRESSO' });
        
        // Update local state immediately for snappy UI
        setRequisicoes(prev => prev.map(r => r.id === req.id ? updatedReq : r));
        setEstadoEdicao('FECHADO');
        
        // Background refresh to keep everything in sync
        fetchRequisicoes();
      } catch (error: any) {
        toast.error(error?.message || t('requisitions.errors.updateStatusFailed'));
        setEstadoEdicao('ABERTO');
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

    if (selectedRequisicao.tipo === 'TRANSPORTE' && (estadoEdicao === 'EM_PROGRESSO' || estadoEdicao === 'FECHADO')) {
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
    const grupos = new Map<string, Array<{
      rowId: string;
      materialId: number;
      descricao: string;
      quantidade: string;
    }>>();

    createForm.materialLinhas.forEach((linha) => {
      const material = catalog.materiais.find((item) => String(item.id) === linha.materialId);
      // NOTE: Materials with 'OUTROS' category are preserved for backward compatibility.
      const categoria = material?.categoria ?? 'OUTROS';
      const descricao = [material?.nome ?? 'Material removido', material?.valorAtributo].filter(Boolean).join(' ');
      const grupoAtual = grupos.get(categoria) ?? [];

      grupoAtual.push({
        rowId: linha.rowId,
        materialId: Number(linha.materialId),
        descricao,
        quantidade: linha.quantidade,
      });

      grupos.set(categoria, grupoAtual);
    });

    return Array.from(grupos.entries()).map(([catValue, itens]) => {
      const standardOption = MATERIAL_CATEGORIA_OPTIONS.find(opt => opt.value === catValue);
      return {
        categoria: catValue,
        label: standardOption?.label ?? catValue,
        itens,
      };
    });
  }, [catalog.materiais, createForm.materialLinhas]);

  const materiaisAdicionadosTotal = useMemo(
    () => createForm.materialLinhas.reduce((sum, linha) => sum + Number(linha.quantidade || 0), 0),
    [createForm.materialLinhas],
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

      // First, move to the intended state (EM_PROGRESSO or FECHADO)
      await requisicoesApi.atualizarEstado(openedRequisicaoId, { estado: estadoEdicao });

      // Then, automatically close ALL conflicting transport requests
      if (selectedRequisicao?.tipo === 'TRANSPORTE') {
        try {
          const outrasRequisicoes = await requisicoesApi.procurar({ tipo: 'TRANSPORTE' });
          const requisicoesList = Array.isArray(outrasRequisicoes) ? outrasRequisicoes : [];

          // Get ALL conflicting requests
          const todosOsConflitos = calcularTodosOsConflitosTransporte(
            selectedRequisicao,
            requisicoesList,
          );

          if (todosOsConflitos.length > 0) {
            const fecharConflito = async (conflito: RequisicaoResponse) => {
              if (conflito.estado === 'FECHADO' || conflito.estado === 'RECUSADO') {
                return;
              }

              await requisicoesApi.atualizarEstado(conflito.id, { estado: 'RECUSADO' });
            };

            await Promise.all(todosOsConflitos.map((conflito) => fecharConflito(conflito)));
          }
        } catch (error: any) {
          console.error('Failed to close conflicting requisitions:', error);
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
  const inputFieldClassName = 'mt-1 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/90 shadow-sm focus-visible:border-purple-500 focus-visible:ring-purple-500/30 cursor-text';
  const textareaFieldClassName = 'mt-1 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/90 shadow-sm focus-visible:border-purple-500 focus-visible:ring-purple-500/30';
  const quantityFieldClassName = 'mt-1 h-9 border-2 border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus-visible:border-purple-500 focus-visible:ring-purple-500/30';

  const createFormContent = (
    <div className="space-y-5">
      <div className="rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white/95 dark:bg-gray-900/85 p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('requisitions.ui.mainData')}</h3>

        <RequisitionsCreateCommonFields
          tipo={createForm.tipo}
          descricao={createForm.descricao}
          onChangeDescricao={createForm.setDescricao}
          onChangeTipo={createForm.setTipo}
          prioridade={createForm.prioridade}
          onChangePrioridade={createForm.setPrioridade}
          tempoLimite={createForm.tempoLimite}
          onChangeTempoLimite={(value) => {
            createForm.setTempoLimite(value);
            createForm.setTempoLimiteManuallyEdited(true);
            createForm.setFieldTouched('tempoLimite');
          }}
          descricaoError={createForm.createErrors.descricao}
          tempoLimiteError={createForm.createErrors.tempoLimite}
          inputFieldClassName={inputFieldClassName}
          textareaFieldClassName={textareaFieldClassName}
          selectFieldClassName={selectFieldClassName}
          t={t}
        />

        {createForm.tipo === 'TRANSPORTE' && !createForm.tempoLimiteManuallyEdited && createForm.dataSaida && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('requisitions.ui.transportAutoDeadlineHint')}</p>
        )}
      </div>

      <div className="rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white/95 dark:bg-gray-900/85 p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('requisitions.ui.detailsByType')}</h3>

        <div>
          {createForm.tipo === 'MATERIAL' && (
            <div className="space-y-3">
              <RequisitionsCreateMaterialForm
                materialLinhas={createForm.materialLinhas}
                expandedMaterialItems={createForm.expandedMaterialItems}
                expandedMaterialCategorias={createForm.expandedMaterialCategorias as Partial<Record<string, boolean>>}
                materiaisPorCategoria={Array.from(materiaisPorCategoria.entries()).map(([catValue, itens]) => {
                  const standardOption = MATERIAL_CATEGORIA_OPTIONS.find(opt => opt.value === catValue);
                  return {
                    categoria: catValue,
                    label: standardOption?.label ?? catValue,
                    itens,
                  };
                })}
                materiaisAdicionados={[]}
                materiaisAdicionadosTotal={materiaisAdicionadosTotal}
                materiaisAdicionadosAgrupados={materiaisAdicionadosAgrupados}
                onToggleCategoriaExpansion={(categoria) => toggleCategoriaExpansion(categoria as MaterialCategoria)}
                onToggleItemVisibility={toggleItemAttributesVisibility}
                onToggleItem={handleItemToggle}
                onToggleVariante={toggleVariante}
                onUpdateVarianteQuantidade={updateVarianteQuantidade}
                onRemoveMaterialLinha={handleRemoveMaterialLinha}
                quantityFieldClassName={quantityFieldClassName}
                materiaisError={createForm.createErrors.materialItens}
                t={t}
              />
            </div>
          )}

          {createForm.tipo === 'TRANSPORTE' && (
            <div className="space-y-3">
              <RequisitionsCreateTransportForm
                destinoTransporte={createForm.destinoTransporte}
                onChangeDestino={(value) => {
                  createForm.setDestinoTransporte(value);
                  if (createForm.createTouched.destino) validateAndSetField('destino');
                }}
                dataSaida={createForm.dataSaida}
                onChangeDataSaida={(value) => {
                  createForm.setDataSaida(value);
                  validateAndSetField('dataSaida');
                  validateAndSetField('horaSaida');
                  validateAndSetField('dataRegresso');
                  validateAndSetField('horaRegresso');
                }}
                horaSaida={createForm.horaSaida}
                onChangeHoraSaida={(value) => {
                  createForm.setHoraSaida(value);
                  validateAndSetField('horaSaida');
                  validateAndSetField('dataSaida');
                  validateAndSetField('dataRegresso');
                  validateAndSetField('horaRegresso');
                }}
                dataRegresso={createForm.dataRegresso}
                onChangeDataRegresso={(value) => {
                  createForm.setDataRegresso(value);
                  validateAndSetField('dataRegresso');
                  validateAndSetField('horaRegresso');
                  validateAndSetField('dataSaida');
                  validateAndSetField('horaSaida');
                }}
                horaRegresso={createForm.horaRegresso}
                onChangeHoraRegresso={(value) => {
                  createForm.setHoraRegresso(value);
                  validateAndSetField('horaRegresso');
                  validateAndSetField('dataRegresso');
                  validateAndSetField('dataSaida');
                  validateAndSetField('horaSaida');
                }}
                numeroPassageiros={createForm.numeroPassageiros}
                onChangeNumeroPassageiros={(value) => {
                  createForm.setNumeroPassageiros(value);
                  if (createForm.createTouched.numeroPassageiros) validateAndSetField('numeroPassageiros');
                }}
                condutorTransporte={createForm.condutorTransporte}
                onChangeCondutor={createForm.setCondutorTransporte}
                selectedTransportIds={createForm.selectedTransportIds}
                onToggleTransport={(transporteId, checked) => {
                  toggleSelectedTransport(transporteId, checked);
                  validateAndSetField('transporteIds', true);
                }}
                onRemoveTransport={(transporteId) => toggleSelectedTransport(transporteId, false)}
                expandedTransporteCategorias={createForm.expandedTransporteCategorias as Partial<Record<string, boolean>>}
                onToggleTransporteCategoriaExpansion={toggleTransporteCategoriaExpansion}
                expandedTransporteDetalhes={createForm.expandedTransporteDetalhes}
                onToggleTransporteDetalhes={toggleTransporteDetalhes}
                transportesPorCategoria={transportesPorCategoria}
                selectedTransportes={selectedTransportes}
                transportesIndisponiveis={transportesIndisponiveis}
                recommendedTransportIds={recommendedTransportIds}
                selectedTransportesCapacidade={selectedTransportesCapacidade}
                passageirosSolicitados={passageirosSolicitados}
                lugaresEmFalta={lugaresEmFalta}
                loadingCatalogo={catalog.loadingCatalogo}
                createErrors={createForm.createErrors}
                inputFieldClassName={inputFieldClassName}
                selectFieldClassName={selectFieldClassName}
                onApplySuggestion={handleAplicarSugestaoTransporte}
                t={t}
              />
            </div>
          )}

          {createForm.tipo === 'MANUTENCAO' && (
            <div className="space-y-4">
              <RequisitionsCreateManutencaoForm
                manutencaoItems={catalog.manutencaoItems}
                expandedManutencaoCategorias={createForm.expandedManutencaoCategorias}
                selectedManutencaoItemIds={createForm.selectedManutencaoItemIds}
                manutencaoObservacoesPorCategoria={createForm.manutencaoObservacoesPorCategoria}
                onToggleCategoriaExpansion={toggleManutencaoCategoriaExpansion}
                onToggleItem={(id, checked) => {
                  toggleManutencaoItem(id, checked);
                  if (createForm.createTouched.manutencaoItens) validateAndSetField('manutencaoItens');
                }}
                onUpdateObservacaoCategoria={updateManutencaoObservacaoCategoria}
                t={t}
                manutencaoError={createForm.createErrors.manutencaoItens}
                onClearSelection={() => {
                  createForm.setSelectedManutencaoItemIds([]);
                  if (createForm.createTouched.manutencaoItens) validateAndSetField('manutencaoItens');
                }}
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
        <Button onClick={handlePreSubmit} disabled={submitting} className="bg-purple-600 hover:bg-purple-700 text-white">
          {submitting ? t('requisitions.ui.creatingRequest') : t('requisitions.ui.createRequest')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      {activeSection === 'list' ? (
        <div className="space-y-6">
          <RequisitionsStatsCards
            stats={stats}
            onCardShortcut={handleCardShortcut}
            t={t}
          />

          <GlassCard className="w-full p-0 overflow-hidden border border-gray-300 dark:border-gray-700">
            <div className="px-5 py-5 border-b border-gray-200 dark:border-gray-800">
              <h2 className={`text-xl font-semibold ${headingClass}`}>{t('requisitions.ui.requests')}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{summaryText}</p>
            </div>

            <div className="px-5 pb-5 pt-4 space-y-4">
              <RequisitionsListFiltersContent
                desktop={true}
                activeTab={filters.activeTab}
                onSelectTab={handleSelectTab}
                filterEstado={filters.filterEstado}
                setFilterEstado={filters.setFilterEstado}
                filterPrioridade={filters.filterPrioridade}
                setFilterPrioridade={filters.setFilterPrioridade}
                filterCriadoPorNome={filters.filterCriadoPorNome}
                setFilterCriadoPorNome={filters.setFilterCriadoPorNome}
                filterGeridoPorNome={filters.filterGeridoPorNome}
                setFilterGeridoPorNome={filters.setFilterGeridoPorNome}
                showCreatedByRoleFilter={isSecretaryView}
                filterCriadoPorTipo={filters.filterCriadoPorTipo}
                setFilterCriadoPorTipo={filters.setFilterCriadoPorTipo}
                onSearch={() => fetchRequisicoes()}
                onClearFilters={handleClearFilters}
                loading={loading}
                requisicoes={requisicoes.filter(req => {
                  if (filters.activeTab === 'GERAL') return true;
                  if (filters.activeTab === 'URGENTE') return req.prioridade === 'URGENTE';
                  return req.tipo === filters.activeTab;
                })}
                onOpenRequisicao={handleOpenRequisicao}
                selectFieldClassName={selectFieldClassName}
                inputFieldClassName={inputFieldClassName}
                formatDateTimeOrDash={formatDateTimeOrDash}
                t={t}
              />
            </div>
          </GlassCard>
        </div>
      ) : (
        <div className="space-y-6">
          <GlassCard className="w-full p-0 overflow-hidden border border-gray-300 dark:border-gray-700">
            <div className="px-5 py-5 border-b border-gray-200 dark:border-gray-800">
              <h2 className={`text-xl font-semibold ${headingClass}`}>{t('requisitions.ui.newRequest')}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('requisitions.ui.fillToCreate')}</p>
            </div>
            <div className="p-5">
              {createFormContent}
            </div>
          </GlassCard>
        </div>
      )}

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
        open={createForm.createMaterialDialogOpen}
        onOpenChange={createForm.setCreateMaterialDialogOpen}
        inputFieldClassName={inputFieldClassName}
        textareaFieldClassName={textareaFieldClassName}
        novoMaterialNome={createForm.novoMaterialNome}
        novoMaterialDescricao={createForm.novoMaterialDescricao}
        novoMaterialCategoria={createForm.novoMaterialCategoria as MaterialCategoria}
        novoMaterialAtributo={createForm.novoMaterialAtributo}
        novoMaterialValorAtributo={createForm.novoMaterialValorAtributo}
        submittingMaterial={submittingMaterial}
        onChangeNome={createForm.setNovoMaterialNome}
        onChangeDescricao={createForm.setNovoMaterialDescricao}
        onChangeCategoria={createForm.setNovoMaterialCategoria}
        onChangeAtributo={createForm.setNovoMaterialAtributo}
        onChangeValorAtributo={createForm.setNovoMaterialValorAtributo}
        onCancel={() => createForm.setCreateMaterialDialogOpen(false)}
        onCreate={handleCriarMaterialCatalogo}
        t={t}
      />

      {/* Confirmation Modal */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{t('requisitions.ui.confirmTitle')}</DialogTitle>
            <DialogDescription>
              {t('requisitions.ui.confirmMessage')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md text-sm border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between border-b pb-2 border-gray-200 dark:border-gray-800">
              <span className="text-gray-500 font-medium">{t('requisitions.ui.type')}:</span>
              <span className="text-gray-900 dark:text-gray-100 font-semibold">
                {t(`requisitions.labels.${{ MATERIAL: 'material', TRANSPORTE: 'transport', MANUTENCAO: 'maintenance' }[createForm.tipo]}`)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-2 border-gray-200 dark:border-gray-800">
              <span className="text-gray-500 font-medium">{t('requisitions.ui.priority')}:</span>
              <span className="text-gray-900 dark:text-gray-100 font-semibold">
                {t(`requisitions.labels.${{ BAIXA: 'low', MEDIA: 'medium', ALTA: 'high', URGENTE: 'urgent' }[createForm.prioridade]}`)}
              </span>
            </div>
            {createForm.tempoLimite && (
              <div className="flex items-center justify-between border-b pb-2 border-gray-200 dark:border-gray-800">
                <span className="text-gray-500 font-medium">{t('requisitions.ui.deadlineDate')}:</span>
                <span className="text-gray-900 dark:text-gray-100">{new Date(createForm.tempoLimite).toLocaleDateString('pt-PT')}</span>
              </div>
            )}
            
            {createForm.tipo === 'MATERIAL' && (
              <div>
                <span className="text-gray-500 font-medium mb-1 block">{t('requisitions.ui.materials')}:</span>
                <ul className="list-disc pl-5 text-gray-800 dark:text-gray-200">
                  {createForm.materialLinhas.filter(l => l.materialId && Number(l.quantidade) > 0).map((l, idx) => {
                    const itemName = catalog.materiais.find(m => m.id === Number(l.materialId))?.nome || `#${l.materialId}`;
                    return <li key={idx}>{itemName} x {l.quantidade}</li>;
                  })}
                </ul>
              </div>
            )}

            {createForm.tipo === 'TRANSPORTE' && (
              <>
                <div className="flex flex-col border-b pb-2 border-gray-200 dark:border-gray-800">
                  <span className="text-gray-500 font-medium">{t('requisitions.ui.destination')}:</span>
                  <span className="text-gray-900 dark:text-gray-100">{createForm.destinoTransporte}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2 border-gray-200 dark:border-gray-800">
                  <span className="text-gray-500 font-medium">{t('requisitions.ui.passengersCount')}:</span>
                  <span className="text-gray-900 dark:text-gray-100">{passageirosSolicitados}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 font-medium mb-1 block">{t('requisitions.ui.suggestedAndSelectedVehicles')}:</span>
                  <ul className="list-disc pl-5 text-gray-800 dark:text-gray-200">
                    {createForm.selectedTransportIds.map((id, idx) => {
                      const tInfo = catalog.transportes.find(x => x.id === Number(id));
                      return <li key={idx}>{tInfo ? formatTransporteDisplay(tInfo) : `#${id}`}</li>;
                    })}
                  </ul>
                </div>
              </>
            )}

            {createForm.tipo === 'MANUTENCAO' && createForm.selectedManutencaoItemIds.length > 0 && (
              <div>
                <span className="text-gray-500 font-medium mb-2 block">{t('requisitions.ui.maintenance')}:</span>
                {(() => {
                  const grouped = createForm.selectedManutencaoItemIds.reduce((acc, id) => {
                    const mInfo = catalog.manutencaoItems.find((m) => m.id === id);
                    if (mInfo) {
                      if (!acc[mInfo.categoria]) acc[mInfo.categoria] = [];
                      acc[mInfo.categoria].push(mInfo);
                    }
                    return acc;
                  }, {} as Record<string, typeof catalog.manutencaoItems>);
                  
                  const labelMap: Record<string, string> = {
                    CATL: t('requisitions.labels.maintenanceCategoryCATL'),
                    RC: t('requisitions.labels.maintenanceCategoryRC'),
                    PRE_ESCOLAR: t('requisitions.labels.maintenanceCategoryPreschool'),
                    CRECHE: t('requisitions.labels.maintenanceCategoryDaycare')
                  };

                  return Object.entries(grouped).map(([categoria, items]) => (
                    <div key={categoria} className="mb-2 last:mb-0 ml-2">
                      <p className="font-medium text-sm text-gray-800 dark:text-gray-200">
                        {labelMap[categoria] || categoria}:
                      </p>
                      {createForm.manutencaoObservacoesPorCategoria[categoria as ManutencaoCategoria] && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-1 italic">
                          Obs: {createForm.manutencaoObservacoesPorCategoria[categoria as ManutencaoCategoria]}
                        </p>
                      )}
                      <ul className="list-disc pl-5 mt-1 text-gray-700 dark:text-gray-300">
                        {items.map((item, idx) => (
                          <li key={idx} className="text-sm">{item.espaco} - {item.itemVerificacao}</li>
                        ))}
                      </ul>
                    </div>
                  ));
                })()}
              </div>
            )}

            {createForm.descricao && (
              <div className="flex flex-col mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                <span className="text-gray-500 font-medium">{t('requisitions.ui.description')}:</span>
                <span className="text-gray-900 dark:text-gray-100 truncate">{createForm.descricao}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)} disabled={submitting}>
              {t('requisitions.ui.confirmCancelBtn')}
            </Button>
            <Button onClick={() => void confirmAndSubmit()} disabled={submitting} className="bg-purple-600 hover:bg-purple-700 text-white">
              {submitting ? t('requisitions.ui.creating') : t('requisitions.ui.confirmSubmitBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
