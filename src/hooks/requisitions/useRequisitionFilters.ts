import { useState, useCallback, useMemo } from 'react';
import { RequisicaoEstado, RequisicaoPrioridade, RequisicaoTipo } from '../../services/api';
import type { RequisicoesTab } from '../../pages/requisitions/sharedRequisitions.helpers';

export function useRequisitionFilters(
  initialTipo?: RequisicaoTipo,
  initialPrioridade?: RequisicaoPrioridade,
) {
  const [filterEstado, setFilterEstado] = useState<RequisicaoEstado | ''>('');
  const [filterTipo, setFilterTipo] = useState<RequisicaoTipo | ''>(initialTipo ?? '');
  const [filterPrioridade, setFilterPrioridade] = useState<RequisicaoPrioridade | ''>(initialPrioridade ?? '');
  const [filterCriadoPorNome, setFilterCriadoPorNome] = useState('');
  const [filterGeridoPorNome, setFilterGeridoPorNome] = useState('');
  const [filterCriadoPorTipo, setFilterCriadoPorTipo] = useState<'' | 'SECRETARIA' | 'ESCOLA' | 'BALNEARIO' | 'INTERNO'>('');
  const [activeTab, setActiveTab] = useState<RequisicoesTab>(() => {
    if (initialPrioridade === 'URGENTE') return 'URGENTE';
    if (initialTipo) return initialTipo;
    return 'GERAL';
  });

  const resetFilters = useCallback(() => {
    setFilterEstado('');
    setFilterTipo(initialTipo ?? '');
    setFilterPrioridade(initialPrioridade ?? '');
    setFilterCriadoPorNome('');
    setFilterGeridoPorNome('');
    setFilterCriadoPorTipo('');
    if (initialPrioridade === 'URGENTE') {
      setActiveTab('URGENTE');
    } else if (initialTipo) {
      setActiveTab(initialTipo);
    } else {
      setActiveTab('GERAL');
    }
  }, [initialTipo, initialPrioridade]);

  return useMemo(() => ({
    filterEstado,
    setFilterEstado,
    filterTipo,
    setFilterTipo,
    filterPrioridade,
    setFilterPrioridade,
    filterCriadoPorNome,
    setFilterCriadoPorNome,
    filterGeridoPorNome,
    setFilterGeridoPorNome,
    filterCriadoPorTipo,
    setFilterCriadoPorTipo,
    activeTab,
    setActiveTab,
    resetFilters,
  }), [filterEstado, filterTipo, filterPrioridade, filterCriadoPorNome, filterGeridoPorNome, filterCriadoPorTipo, activeTab, resetFilters]);
}
