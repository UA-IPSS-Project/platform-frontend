import { apiRequest } from '../core/client';
import {
  CandidaturaStatusUpdate,
  CandidaturaUpdate,
  FormUpdate,
  CandidaturaResponse,
  CandidaturaCreate,
  FormCreate,
  FormResponse,
  FormDraftResponse,
  FormDraftSave,
  FormTypeResponse,
  ListarCandidaturasFilters,
} from './types';

const toQueryString = (filters: ListarCandidaturasFilters = {}): string => {
  const params = new URLSearchParams();

  if (filters.formId) params.append('formId', filters.formId);
  if (typeof filters.utenteId === 'number') params.append('utenteId', String(filters.utenteId));
  if (filters.nif) params.append('nif', filters.nif);
  if (filters.nome) params.append('nome', filters.nome);
  if (filters.estado) params.append('estado', filters.estado);
  if (typeof filters.assinado === 'boolean') params.append('assinado', String(filters.assinado));
  if (typeof filters.idade === 'number') params.append('idade', String(filters.idade));

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
    return apiRequest<FormResponse[]>(`/api/forms${query}`);
  },

  listarTiposFormularios: () => apiRequest<FormTypeResponse[]>('/api/forms/types'),

  obterFormularioPorId: (id: string) => apiRequest<FormResponse>(`/api/forms/${id}`),

  criarFormulario: (payload: FormCreate) =>
    apiRequest<FormResponse>('/api/forms', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  atualizarFormulario: (id: string, payload: FormUpdate) =>
    apiRequest<FormResponse>(`/api/forms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  apagarFormulario: (id: string) =>
    apiRequest<void>(`/api/forms/${id}`, {
      method: 'DELETE',
    }),

  obterRascunhoFormulario: (id: string) =>
    apiRequest<FormDraftResponse | null>(`/api/forms/${id}/draft`),

  guardarRascunhoFormulario: (id: string, payload: FormDraftSave) =>
    apiRequest<FormDraftResponse>(`/api/forms/${id}/draft`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  apagarRascunhoFormulario: (id: string) =>
    apiRequest<void>(`/api/forms/${id}/draft`, {
      method: 'DELETE',
    }),

  listarCandidaturas: (filters: ListarCandidaturasFilters = {}) =>
    apiRequest<CandidaturaResponse[]>(`/api/candidaturas${toQueryString(filters)}`),

  listarCandidaturasPorUser: (userId: number) =>
    apiRequest<CandidaturaResponse[]>(`/api/candidaturas/user/${userId}`),

  listarCandidaturasPorForm: (formId: string) =>
    apiRequest<CandidaturaResponse[]>(`/api/candidaturas/form/${formId}`),

  obterCandidaturaPorId: (id: string) => apiRequest<CandidaturaResponse>(`/api/candidaturas/${id}`),

  criarCandidatura: (payload: CandidaturaCreate) =>
    apiRequest<CandidaturaResponse>('/api/candidaturas', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  atualizarCandidatura: (id: string, payload: CandidaturaUpdate) =>
    apiRequest<CandidaturaResponse>(`/api/candidaturas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  atualizarEstado: (id: string, payload: CandidaturaStatusUpdate) =>
    apiRequest<CandidaturaResponse>(`/api/candidaturas/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  apagarCandidatura: (id: string) =>
    apiRequest<void>(`/api/candidaturas/${id}`, {
      method: 'DELETE',
    }),
};
