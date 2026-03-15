import { apiRequest } from '../core/client';

export type RequisicaoEstado = 'ENVIADA' | 'EM_ANALISE' | 'CONCLUIDA' | 'CANCELADA';
export type RequisicaoPrioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
export type RequisicaoTipo = 'MATERIAL' | 'TRANSPORTE' | 'MANUTENCAO';
export type MaterialCategoria = 'ESCRITA' | 'PAPEL_E_ARQUIVO' | 'HIGIENE_E_LIMPEZA' | 'TECNOLOGIA' | 'OUTROS';
export type TransporteCategoria = 'LIGEIRO' | 'PESADO' | 'PASSAGEIROS' | 'ADAPTADO';

export interface MaterialCatalogo {
  id: number;
  nome: string;
  categoria: MaterialCategoria;
  atributo?: string;
  valorAtributo?: string;
  descricao?: string;
}

export interface TransporteCatalogo {
  id: number;
  tipo?: string;
  categoria?: TransporteCategoria;
  matricula?: string;
  marca?: string;
  modelo?: string;
  lotacao?: number;
  dataMatricula?: string;
}

export interface RequisicaoResponse {
  id: number;
  tipo: RequisicaoTipo;
  prioridade: RequisicaoPrioridade;
  estado: RequisicaoEstado;
  descricao: string;
  criadoEm?: string;
  ultimaAlteracaoEstadoEm?: string;
  tempoLimite?: string;
  criadoPor?: { id?: number; nome?: string };
  geridoPor?: { id?: number; nome?: string };
  itens?: Array<{ material?: MaterialCatalogo; quantidade?: number }>;
  material?: { id?: number; nome?: string };
  quantidade?: number;
  transporte?: { id?: number; nome?: string };
  assunto?: string;
}

interface ProcurarParams {
  estado?: RequisicaoEstado;
  tipo?: RequisicaoTipo;
  prioridade?: RequisicaoPrioridade;
  criadoPorNome?: string;
  geridoPorNome?: string;
}

interface CriarRequisicaoBase {
  descricao: string;
  prioridade: RequisicaoPrioridade;
  tempoLimite?: string;
  criadoPorId: number;
}

interface CriarRequisicaoMaterial extends CriarRequisicaoBase {
  itens: Array<{ materialId: number; quantidade: number }>;
}

interface CriarRequisicaoTransporte extends CriarRequisicaoBase {
  transporteId: number;
}

interface CriarRequisicaoManutencao extends CriarRequisicaoBase {
  assunto?: string;
}

export const requisicoesApi = {
  procurar: async (params: ProcurarParams): Promise<RequisicaoResponse[]> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, String(value));
      }
    });

    const suffix = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<RequisicaoResponse[]>(`/api/requisicoes/procurar${suffix}`, { method: 'GET' });
  },

  listarMateriais: async (): Promise<MaterialCatalogo[]> => {
    return apiRequest<MaterialCatalogo[]>('/api/requisicoes/materiais', { method: 'GET' });
  },

  criarMaterialCatalogo: async (payload: {
    nome: string;
    descricao?: string;
    categoria: MaterialCategoria;
    atributo: string;
    valorAtributo: string;
  }): Promise<MaterialCatalogo> => {
    return apiRequest<MaterialCatalogo>('/api/requisicoes/materiais', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  listarTransportes: async (): Promise<TransporteCatalogo[]> => {
    return apiRequest<TransporteCatalogo[]>('/api/requisicoes/transportes', { method: 'GET' });
  },

  criarTransporteCatalogo: async (payload: {
    tipo: string;
    categoria: TransporteCategoria;
    matricula: string;
    marca?: string;
    modelo?: string;
    lotacao?: number;
    dataMatricula?: string;
  }): Promise<TransporteCatalogo> => {
    return apiRequest<TransporteCatalogo>('/api/requisicoes/transportes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  criarMaterial: async (payload: CriarRequisicaoMaterial): Promise<RequisicaoResponse> => {
    return apiRequest<RequisicaoResponse>('/api/requisicoes/material', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  criarTransporte: async (payload: CriarRequisicaoTransporte): Promise<RequisicaoResponse> => {
    return apiRequest<RequisicaoResponse>('/api/requisicoes/transporte', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  criarManutencao: async (payload: CriarRequisicaoManutencao): Promise<RequisicaoResponse> => {
    return apiRequest<RequisicaoResponse>('/api/requisicoes/manutencao', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  atualizarEstado: async (id: number, payload: { estado: RequisicaoEstado }): Promise<RequisicaoResponse> => {
    return apiRequest<RequisicaoResponse>(`/api/requisicoes/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};
