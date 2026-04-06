import { apiRequest } from '../core/client';
import {
  AtualizarCandidaturaRequest,
  AtualizarEstadoCandidaturaRequest,
  AtualizarFormularioRequest,
  CandidaturaResponse,
  CriarCandidaturaRequest,
  CriarFormularioRequest,
  FormularioResponse,
  ListarCandidaturasFilters,
} from './types';

const toQueryString = (filters: ListarCandidaturasFilters = {}): string => {
  const params = new URLSearchParams();

  if (filters.nome) params.append('nome', filters.nome);
  if (filters.estado) params.append('estado', filters.estado);
  if (filters.dataInicio) params.append('dataInicio', filters.dataInicio);
  if (filters.dataFim) params.append('dataFim', filters.dataFim);
  if (filters.formId) params.append('formId', filters.formId);
  if (typeof filters.criadoPor === 'number') params.append('criadoPor', String(filters.criadoPor));

  const query = params.toString();
  return query ? `?${query}` : '';
};

const normalizeName = (name?: string): string | undefined => {
  if (!name) return undefined;
  return name.trim();
};

export const candidaturasApi = {
  listarFormularios: (name?: string) => {
    const formName = normalizeName(name);
    const query = formName ? `?name=${encodeURIComponent(formName)}` : '';
    return apiRequest<FormularioResponse[]>(`/api/forms${query}`);
  },

  obterFormularioPorId: (id: string) => apiRequest<FormularioResponse>(`/api/forms/${id}`),

  criarFormulario: (payload: CriarFormularioRequest) =>
    apiRequest<FormularioResponse>('/api/forms', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  atualizarFormulario: (id: string, payload: AtualizarFormularioRequest) =>
    apiRequest<FormularioResponse>(`/api/forms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  apagarFormulario: (id: string) =>
    apiRequest<void>(`/api/forms/${id}`, {
      method: 'DELETE',
    }),

  listarCandidaturas: (filters: ListarCandidaturasFilters = {}) =>
    apiRequest<CandidaturaResponse[]>(`/api/candidaturas${toQueryString(filters)}`),

  listarCandidaturasPorUser: (userId: number) =>
    apiRequest<CandidaturaResponse[]>(`/api/candidaturas/user/${userId}`),

  listarCandidaturasPorForm: (formId: string) =>
    apiRequest<CandidaturaResponse[]>(`/api/candidaturas/form/${formId}`),

  obterCandidaturaPorId: (id: string) => apiRequest<CandidaturaResponse>(`/api/candidaturas/${id}`),

  criarCandidatura: (payload: CriarCandidaturaRequest) =>
    apiRequest<CandidaturaResponse>('/api/candidaturas', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  atualizarCandidatura: (id: string, payload: AtualizarCandidaturaRequest) =>
    apiRequest<CandidaturaResponse>(`/api/candidaturas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  atualizarEstado: (id: string, payload: AtualizarEstadoCandidaturaRequest) =>
    apiRequest<CandidaturaResponse>(`/api/candidaturas/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  apagarCandidatura: (id: string) =>
    apiRequest<void>(`/api/candidaturas/${id}`, {
      method: 'DELETE',
    }),
};
