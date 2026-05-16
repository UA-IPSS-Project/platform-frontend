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
  SecretaryDraftResponse,
  SecretaryDraftSave,
  CandidaturaDocumentoDTO,
} from './types';
import { API_BASE_URL, getCookie } from '../core/client';

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
  listarFormularios: (name?: string, status?: string) => {
    const params = new URLSearchParams();
    const formName = normalizeName(name);
    if (formName) params.append('name', formName);
    if (status) params.append('status', status);
    const query = params.toString();
    return apiRequest<FormResponse[]>(`/api/forms${query ? `?${query}` : ''}`);
  },

  listarTiposFormularios: (utenteId?: number) => {
    const params = new URLSearchParams();
    if (utenteId !== undefined) params.append('utenteId', String(utenteId));
    const query = params.toString();
    return apiRequest<FormTypeResponse[]>(`/api/forms/types${query ? `?${query}` : ''}`);
  },

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

  obterRascunhoSecretaria: (id: string) =>
    apiRequest<SecretaryDraftResponse | null>(`/api/candidaturas/${id}/secretary-draft`),

  guardarRascunhoSecretaria: (id: string, payload: SecretaryDraftSave) =>
    apiRequest<SecretaryDraftResponse>(`/api/candidaturas/${id}/secretary-draft`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  apagarRascunhoSecretaria: (id: string) =>
    apiRequest<void>(`/api/candidaturas/${id}/secretary-draft`, {
      method: 'DELETE',
    }),

  publicarRascunhoSecretaria: (id: string) =>
    apiRequest<CandidaturaResponse>(`/api/candidaturas/${id}/secretary-draft/publish`, {
      method: 'POST',
    }),

  listarDocumentosCandidatura: (candidaturaId: string) =>
    apiRequest<CandidaturaDocumentoDTO[]>(`/api/candidaturas/${candidaturaId}/documentos`),

  uploadDocumentoCandidatura: async (candidaturaId: string, file: File): Promise<CandidaturaDocumentoDTO> => {
    const formData = new FormData();
    formData.append('file', file);
    const xsrfToken = getCookie('XSRF-TOKEN');
    const headers: Record<string, string> = {};
    if (xsrfToken) headers['X-XSRF-TOKEN'] = xsrfToken;
    const response = await fetch(`${API_BASE_URL}/api/candidaturas/${candidaturaId}/documentos`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao enviar ${file.name}: ${errorText}`);
    }
    return response.json();
  },

  downloadDocumentoCandidatura: async (docId: string, nomeOriginal: string): Promise<void> => {
    const xsrfToken = getCookie('XSRF-TOKEN');
    const headers: Record<string, string> = {};
    if (xsrfToken) headers['X-XSRF-TOKEN'] = xsrfToken;
    const response = await fetch(`${API_BASE_URL}/api/candidaturas/documentos/${docId}/download`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });
    if (!response.ok) throw new Error('Erro ao fazer download do documento');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeOriginal;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  removerDocumentoCandidatura: (docId: string) =>
    apiRequest<void>(`/api/candidaturas/documentos/${docId}`, { method: 'DELETE' }),
};
