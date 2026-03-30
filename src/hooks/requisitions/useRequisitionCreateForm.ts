import { useState, useCallback, useEffect, useMemo } from 'react';
import { RequisicaoPrioridade, RequisicaoTipo } from '../../services/api';
import { CreateField } from '../../pages/requisitions/sharedRequisitions.helpers';
import { MaterialCategoria } from '../../services/api/requisicoes/types';

export function useRequisitionCreateForm(initialTipo?: RequisicaoTipo, initialPrioridade?: RequisicaoPrioridade) {
  const [tipo, setTipo] = useState<RequisicaoTipo>(initialTipo ?? 'MATERIAL');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<RequisicaoPrioridade>(initialPrioridade ?? 'MEDIA');
  
  const [createErrors, setCreateErrors] = useState<Partial<Record<CreateField, string>>>({});
  const [createTouched, setCreateTouched] = useState<Partial<Record<CreateField, boolean>>>({});

  // Material-specific state
  const [materialLinhas, setMaterialLinhas] = useState<Array<{ rowId: string; materialId: string; quantidade: string }>>([]);
  const [expandedMaterialItems, setExpandedMaterialItems] = useState<Record<string, boolean>>({});
  const [expandedMaterialCategorias, setExpandedMaterialCategorias] = useState<Partial<Record<string, boolean>>>({});

  // Transport-specific state
  const [destinoTransporte, setDestinoTransporte] = useState('');
  const [dataSaida, setDataSaida] = useState('');
  const [horaSaida, setHoraSaida] = useState('');
  const [dataRegresso, setDataRegresso] = useState('');
  const [horaRegresso, setHoraRegresso] = useState('');
  const [numeroPassageiros, setNumeroPassageiros] = useState('');
  const [condutorTransporte, setCondutorTransporte] = useState('');
  const [selectedTransportIds, setSelectedTransportIds] = useState<string[]>([]);
  const [transportSelectionMode, setTransportSelectionMode] = useState<'auto' | 'manual'>('auto');

  // Maintenance-specific state
  const [assunto, setAssunto] = useState('');
  const [selectedManutencaoItemIds, setSelectedManutencaoItemIds] = useState<number[]>([]);
  const [expandedManutencaoCategorias, setExpandedManutencaoCategorias] = useState<Record<string, boolean>>({});
  const [manutencaoObservacoesPorCategoria, setManutencaoObservacoesPorCategoria] = useState<Record<string, string>>({});

  // Material creation dialog state
  // NOTE: 'TECNOLOGIA' is the default for new materials.
  // 'OUTROS' is reserved for backward compatibility with historical data only.
  // Users creating new materials should prefer explicit categorization.
  const [createMaterialDialogOpen, setCreateMaterialDialogOpen] = useState(false);
  const [novoMaterialNome, setNovoMaterialNome] = useState('');
  const [novoMaterialDescricao, setNovoMaterialDescricao] = useState('');
  const [novoMaterialCategoria, setNovoMaterialCategoria] = useState<MaterialCategoria>('TECNOLOGIA');
  const [novoMaterialAtributo, setNovoMaterialAtributo] = useState('');
  const [novoMaterialValorAtributo, setNovoMaterialValorAtributo] = useState('');

  // Clear errors when tipo changes
  useEffect(() => {
    setCreateErrors({});
    setCreateTouched({});
  }, [tipo]);

  const resetForm = useCallback(() => {
    setDescricao('');
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
    setExpandedMaterialItems({});
    setExpandedMaterialCategorias({});
    setAssunto('');
    setSelectedManutencaoItemIds([]);
    setManutencaoObservacoesPorCategoria({});
    setCreateErrors({});
    setCreateTouched({});
    setTipo(initialTipo ?? 'MATERIAL');
    setPrioridade(initialPrioridade ?? 'MEDIA');
  }, [initialTipo, initialPrioridade]);

  const resetMaterialDialog = useCallback(() => {
    setNovoMaterialNome('');
    setNovoMaterialDescricao('');
    setNovoMaterialCategoria('TECNOLOGIA');
    setNovoMaterialAtributo('');
    setNovoMaterialValorAtributo('');
  }, []);

  const setFieldTouched = useCallback((field: CreateField) => {
    setCreateTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const setFieldError = useCallback((field: CreateField, error?: string) => {
    setCreateErrors((prev) => {
      if (error) {
        return { ...prev, [field]: error };
      }
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const isDirty = useMemo(() => {
    return (
      tipo !== (initialTipo ?? 'MATERIAL') ||
      prioridade !== (initialPrioridade ?? 'MEDIA') ||
      descricao !== '' ||
      materialLinhas.length > 0 ||
      destinoTransporte !== '' ||
      dataSaida !== '' ||
      horaSaida !== '' ||
      dataRegresso !== '' ||
      horaRegresso !== '' ||
      numeroPassageiros !== '' ||
      condutorTransporte !== '' ||
      selectedTransportIds.length > 0 ||
      assunto !== '' ||
      selectedManutencaoItemIds.length > 0 ||
      Object.keys(manutencaoObservacoesPorCategoria).length > 0
    );
  }, [
    tipo,
    initialTipo,
    prioridade,
    initialPrioridade,
    descricao,
    materialLinhas,
    destinoTransporte,
    dataSaida,
    horaSaida,
    dataRegresso,
    horaRegresso,
    numeroPassageiros,
    condutorTransporte,
    selectedTransportIds,
    assunto,
    selectedManutencaoItemIds,
    manutencaoObservacoesPorCategoria,
  ]);

  return {
    // General form state
    tipo,
    setTipo,
    descricao,
    setDescricao,
    prioridade,
    setPrioridade,
    isDirty,
    // Validation
    createErrors,
    setCreateErrors,
    createTouched,
    setCreateTouched,
    setFieldTouched,
    setFieldError,
    // Material state
    materialLinhas,
    setMaterialLinhas,
    expandedMaterialItems,
    setExpandedMaterialItems,
    expandedMaterialCategorias,
    setExpandedMaterialCategorias,
    // Transport state
    destinoTransporte,
    setDestinoTransporte,
    dataSaida,
    setDataSaida,
    horaSaida,
    setHoraSaida,
    dataRegresso,
    setDataRegresso,
    horaRegresso,
    setHoraRegresso,
    numeroPassageiros,
    setNumeroPassageiros,
    condutorTransporte,
    setCondutorTransporte,
    selectedTransportIds,
    setSelectedTransportIds,
    transportSelectionMode,
    setTransportSelectionMode,
    // Maintenance state
    assunto,
    setAssunto,
    selectedManutencaoItemIds,
    setSelectedManutencaoItemIds,
    expandedManutencaoCategorias,
    setExpandedManutencaoCategorias,
    manutencaoObservacoesPorCategoria,
    setManutencaoObservacoesPorCategoria,
    // Material dialog state
    createMaterialDialogOpen,
    setCreateMaterialDialogOpen,
    novoMaterialNome,
    setNovoMaterialNome,
    novoMaterialDescricao,
    setNovoMaterialDescricao,
    novoMaterialCategoria,
    setNovoMaterialCategoria,
    novoMaterialAtributo,
    setNovoMaterialAtributo,
    novoMaterialValorAtributo,
    setNovoMaterialValorAtributo,
    // Actions
    resetForm,
    resetMaterialDialog,
    validateAndSetField: (field: CreateField) => {
      setFieldTouched(field);
      if (field === 'descricao' && !descricao.trim()) {
        setFieldError('descricao', 'Campo obrigatório');
      } else if (field === 'descricao') {
        setFieldError('descricao', undefined);
      }

      if (field === 'assunto' && !assunto.trim()) {
        setFieldError('assunto', 'Campo obrigatório');
      } else if (field === 'assunto') {
        setFieldError('assunto', undefined);
      }

      if (field === 'manutencaoItens' && selectedManutencaoItemIds.length === 0) {
        setFieldError('manutencaoItens', 'Selecione pelo menos um item');
      } else if (field === 'manutencaoItens') {
        setFieldError('manutencaoItens', undefined);
      }
    },
    toggleManutencaoCategoriaExpansion: (categoria: string) => {
      setExpandedManutencaoCategorias(prev => ({
        ...prev,
        [categoria]: !prev[categoria]
      }));
    },
    toggleManutencaoItem: (itemId: number, checked: boolean) => {
      setSelectedManutencaoItemIds(prev =>
        checked ? [...prev, itemId] : prev.filter(id => id !== itemId)
      );
    },
    updateManutencaoObservacaoCategoria: (categoria: string, observation: string) => {
      setManutencaoObservacoesPorCategoria(prev => ({
        ...prev,
        [categoria]: observation
      }));
    },
    onClearSelection: () => {
      setSelectedManutencaoItemIds([]);
    },
  };
}
