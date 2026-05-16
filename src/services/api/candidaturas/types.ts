export type CandidaturaEstado = 'PENDENTE' | 'LISTA_ESPERA' | 'APROVADA' | 'REJEITADA' | 'RASCUNHO';

export type FieldAudience = 'PUBLIC' | 'INTERNAL';
export type FormStatus = 'RASCUNHO' | 'ATIVO' | 'INATIVO';

export interface FieldDefinition {
  key: string;
  componentType: string;
  order: number;
  config: Record<string, any>;
  audience: FieldAudience;
}

export interface FormPage {
  id?: string;
  title: string;
  description?: string;
  order: number;
  fields: FieldDefinition[];
  audience?: FieldAudience;
}

export interface FormResponse {
  id: string;
  name: string;
  version?: number;
  status: FormStatus;
  pages?: FormPage[];
  criadoPor?: number;
  criadoPorNome?: string;
  criadoEm?: string;
  atualizadoPor?: number;
  atualizadoPorNome?: string;
  atualizadoEm?: string;
}

export interface FormDraftResponse {
  id: string;
  formId: string;
  name: string;
  pages?: FormPage[];
  atualizadoPor?: number;
  atualizadoPorNome?: string;
  atualizadoEm?: string;
}

export interface FormDraftSave {
  name: string;
  pages?: FormPage[];
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
  status?: FormStatus;
  pages?: FormPage[];
}

export interface FormUpdate {
  name: string;
  status?: FormStatus;
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
