import { apiRequest } from '../core/client';

export interface SendReportRequest {
  to: string;
  pdfBase64?: string;
  fileName?: string;
  periodoInicio: string;
  periodoFim: string;
  seccoes: string[];
}

export interface RelatorioPeriodico {
  id?: number;
  destinatarios: string;
  frequencia: string;
  dataInicio: string;
  seccoes: string;
  activo?: boolean;
}

export const reportsApi = {
  sendByEmail: (payload: SendReportRequest) =>
    apiRequest<void>('/api/reports/email', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listarPeriodicos: () =>
    apiRequest<RelatorioPeriodico[]>('/api/reports/periodicos'),

  criarPeriodico: (payload: RelatorioPeriodico) =>
    apiRequest<RelatorioPeriodico>('/api/reports/periodicos', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  atualizarPeriodico: (id: number, payload: RelatorioPeriodico) =>
    apiRequest<RelatorioPeriodico>(`/api/reports/periodicos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  apagarPeriodico: (id: number) =>
    apiRequest<void>(`/api/reports/periodicos/${id}`, {
      method: 'DELETE',
    }),
};
