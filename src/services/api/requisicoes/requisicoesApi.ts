import { apiRequest } from '../core/client';
import {
  AtualizarEstadoRequisicaoRequest,
  CriarMaterialCatalogoRequest,
  CriarRequisicaoManutencaoRequest,
  CriarRequisicaoMaterialRequest,
  CriarRequisicaoTransporteRequest,
  CriarTipoManutencaoCatalogoRequest,
  CriarTransporteCatalogoRequest,
  ManutencaoItem,
  MaterialCatalogo,
  RequisicaoEstado,
  RequisicaoFilters,
  RequisicaoResponse,
  TipoManutencaoCatalogo,
  TransporteCatalogo,
  CriarManutencaoItemCatalogoRequest,
} from './types';

const toQueryString = (filters: RequisicaoFilters = {}): string => {
  const params = new URLSearchParams();
  if (filters.estado) params.append('estado', filters.estado);
  if (filters.tipo) params.append('tipo', filters.tipo);
  if (filters.prioridade) params.append('prioridade', filters.prioridade);
  if (filters.criadoPorNome) params.append('criadoPorNome', filters.criadoPorNome);
  if (filters.dataInicio) params.append('dataInicio', filters.dataInicio);
  if (filters.dataFim) params.append('dataFim', filters.dataFim);
  const query = params.toString();
  return query ? `?${query}` : '';
};

export const requisicoesApi = {
  listar: (estado?: RequisicaoEstado) => {
    const query = toQueryString(estado ? { estado } : {});
    return apiRequest<RequisicaoResponse[]>(`/api/requisicoes${query}`);
  },

  procurar: (filters: RequisicaoFilters = {}) =>
    apiRequest<RequisicaoResponse[]>(`/api/requisicoes/procurar${toQueryString(filters)}`),

  obterPorId: (id: number) => apiRequest<RequisicaoResponse>(`/api/requisicoes/${id}`),

  listarMateriais: () => apiRequest<MaterialCatalogo[]>('/api/requisicoes/materiais'),

  criarMaterialCatalogo: (payload: CriarMaterialCatalogoRequest) =>
    apiRequest<MaterialCatalogo>('/api/requisicoes/materiais', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  atualizarMaterialCatalogo: (id: number, payload: CriarMaterialCatalogoRequest) =>
    apiRequest<MaterialCatalogo>(`/api/requisicoes/materiais/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  apagarMaterialCatalogo: (id: number) =>
    apiRequest<void>(`/api/requisicoes/materiais/${id}`, {
      method: 'DELETE',
    }),

  listarTransportes: () => apiRequest<TransporteCatalogo[]>('/api/requisicoes/transportes'),

  listarManutencaoItems: () => apiRequest<ManutencaoItem[]>('/api/requisicoes/manutencao-items'),

  listarTiposManutencao: () => apiRequest<TipoManutencaoCatalogo[]>('/api/requisicoes/tipos-manutencao'),

  criarTransporteCatalogo: (payload: CriarTransporteCatalogoRequest) =>
    apiRequest<TransporteCatalogo>('/api/requisicoes/transportes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  atualizarTransporteCatalogo: (id: number, payload: CriarTransporteCatalogoRequest) =>
    apiRequest<TransporteCatalogo>(`/api/requisicoes/transportes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  atualizarCategoriaTransporte: (id: number, categoria: string) =>
    apiRequest<TransporteCatalogo>(`/api/requisicoes/transportes/${id}/categoria`, {
      method: 'PATCH',
      body: JSON.stringify({ categoria }),
    }),

  moverCategoriaPara: (origem: string, destino: string) =>
    apiRequest<void>(`/api/requisicoes/transportes/mover-categoria`, {
      method: 'PATCH',
      body: JSON.stringify({ origem, destino }),
    }),

  criarTipoManutencao: (payload: CriarTipoManutencaoCatalogoRequest) =>
    apiRequest<TipoManutencaoCatalogo>('/api/requisicoes/tipos-manutencao', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  atualizarTipoManutencao: (id: number, payload: CriarTipoManutencaoCatalogoRequest) =>
    apiRequest<TipoManutencaoCatalogo>(`/api/requisicoes/tipos-manutencao/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  apagarTipoManutencao: (id: number) =>
    apiRequest<void>(`/api/requisicoes/tipos-manutencao/${id}`, {
      method: 'DELETE',
    }),

  criarManutencaoItem: (payload: CriarManutencaoItemCatalogoRequest) =>
    apiRequest<ManutencaoItem>('/api/requisicoes/manutencao-items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  atualizarManutencaoItem: (id: number, payload: CriarManutencaoItemCatalogoRequest) =>
    apiRequest<ManutencaoItem>(`/api/requisicoes/manutencao-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  apagarManutencaoItem: (id: number) =>
    apiRequest<void>(`/api/requisicoes/manutencao-items/${id}`, {
      method: 'DELETE',
    }),

  criarMaterial: (payload: CriarRequisicaoMaterialRequest) =>
    apiRequest<RequisicaoResponse>('/api/requisicoes/material', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  criarTransporte: (payload: CriarRequisicaoTransporteRequest) =>
    apiRequest<RequisicaoResponse>('/api/requisicoes/transporte', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  criarManutencao: (payload: CriarRequisicaoManutencaoRequest) =>
    apiRequest<RequisicaoResponse>('/api/requisicoes/manutencao', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  atualizarEstado: (id: number, payload: AtualizarEstadoRequisicaoRequest) =>
    apiRequest<RequisicaoResponse>(`/api/requisicoes/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};
