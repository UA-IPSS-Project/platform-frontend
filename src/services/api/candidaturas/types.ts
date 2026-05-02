export type CandidaturaEstado = 'PENDENTE' | 'LISTA_ESPERA' | 'APROVADA' | 'REJEITADA' | 'RASCUNHO';

export interface FormPage {
  title: string;
  description?: string;
  fields: string[];
}

export interface FormResponse {
  id: string;
  name: string;
  schema: Record<string, unknown>;
  uiSchema?: Record<string, unknown>;
  pages?: FormPage[];
  criadoPor?: number;
  criadoEm?: string;
  atualizadoPor?: number;
  atualizadoEm?: string;
}

export interface FormTypeResponse {
  id: string;
  name: string;
}

export interface CandidaturaResponse {
  id: string;
  formId: string;
  nif: string;
  nome: string;
  respostas: Record<string, unknown>;
  estado: CandidaturaEstado;
  criadoPor?: number;
  criadoEm?: string;
  assinado?: boolean;
  ranking?: number;
  atualizadoPor?: number;
  atualizadoEm?: string;
}

export interface ListarCandidaturasFilters {
  nif?: string;
  nome?: string;
  estado?: CandidaturaEstado;
  assinado?: boolean;
  idade?: number;
}


export interface FormCreate {
  name: string;
  schema: Record<string, unknown>;
  uiSchema?: Record<string, unknown>;
  pages?: FormPage[];
}

export interface FormUpdate {
  name: string;
  schema: Record<string, unknown>;
  uiSchema?: Record<string, unknown>;
  pages?: FormPage[];
}

export interface CandidaturaCreate {
  formId: string;
  nif: string;
  nome: string;
  respostas: Record<string, unknown>;
  estado?: CandidaturaEstado;
}

export interface CandidaturaUpdate {
  formId?: string;
  respostas: Record<string, unknown>;
  estado?: CandidaturaEstado;
}

export interface CandidaturaStatusUpdate {
  estado: CandidaturaEstado;
  assinado?: boolean;
}
