export type CandidaturaEstado = 'PENDENTE' | 'APROVADA' | 'REJEITADA';

export interface FormularioResponse {
  id: string;
  name: string;
  schema: Record<string, unknown>;
  uiSchema?: Record<string, unknown>;
  criadoPor?: number;
  criadoEm?: string;
  atualizadoPor?: number;
  atualizadoEm?: string;
}

export interface CandidaturaResponse {
  id: string;
  formId: string;
  respostas: Record<string, unknown>;
  estado: CandidaturaEstado;
  criadoPor?: number;
  criadoEm?: string;
  atualizadoPor?: number;
  atualizadoEm?: string;
}

export interface ListarCandidaturasFilters {
  nome?: string;
  estado?: CandidaturaEstado;
  dataInicio?: string;
  dataFim?: string;
  formId?: string;
  criadoPor?: number;
}

export interface CriarFormularioRequest {
  name: string;
  schema: Record<string, unknown>;
  uiSchema?: Record<string, unknown>;
  criadoPor?: number;
}

export interface AtualizarFormularioRequest extends CriarFormularioRequest {
  atualizadoPor?: number;
}

export interface CriarCandidaturaRequest {
  formId: string;
  respostas: Record<string, unknown>;
  criadoPor?: number;
}

export interface AtualizarCandidaturaRequest {
  formId: string;
  respostas: Record<string, unknown>;
  atualizadoPor?: number;
}

export interface AtualizarEstadoCandidaturaRequest {
  estado: CandidaturaEstado;
}
