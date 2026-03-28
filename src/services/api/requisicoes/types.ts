export type RequisicaoEstado = 'ABERTO' | 'EM_PROGRESSO' | 'FECHADO' | 'RECUSADO';
export type RequisicaoPrioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
export type RequisicaoTipo = 'MATERIAL' | 'TRANSPORTE' | 'MANUTENCAO';

export interface FuncionarioResumo {
  id: number;
  nome?: string;
  email?: string;
  tipo?: string;
}

export type TransporteCategoria = string;
export type MaterialCategoria = string;
export type ManutencaoCategoria = string;

export interface MaterialCatalogo {
  id: number;
  nome: string;
  descricao?: string | null;
  categoria: MaterialCategoria;
  atributo: string;
  valorAtributo: string;
}

export interface TransporteCatalogo {
  id: number;
  codigo?: string;
  tipo?: string;
  categoria?: TransporteCategoria;
  matricula?: string;
  marca?: string;
  modelo?: string;
  lotacao?: number;
  dataMatricula?: string;
}

export interface TipoManutencaoCatalogo {
  id: number;
  nome: string;
  descricao?: string | null;
}

export interface ManutencaoItem {
  id: number;
  categoria: ManutencaoCategoria;
  espaco: string;
  itemVerificacao: string;
}

export interface RequisicaoResponse {
  id: number;
  version?: number;
  descricao?: string;
  estado: RequisicaoEstado;
  prioridade: RequisicaoPrioridade;
  tipo: RequisicaoTipo;
  tempoLimite?: string | null;
  criadoEm?: string;
  ultimaAlteracaoEstadoEm?: string;
  criadoPor?: FuncionarioResumo;
  geridoPor?: FuncionarioResumo | null;
  material?: {
    id: number;
    nome?: string;
    categoria?: MaterialCategoria;
    atributo?: string;
    valorAtributo?: string;
  };
  quantidade?: number;
  itens?: Array<{
    id?: number;
    material?: {
      id: number;
      nome?: string;
      categoria?: MaterialCategoria;
      atributo?: string;
      valorAtributo?: string;
    };
    quantidade?: number;
    manutencaoItem?: {
      id: number;
      categoria?: ManutencaoCategoria;
      espaco?: string;
      itemVerificacao?: string;
    };
    observacoes?: string;
  }>;
  transporte?: {
    id: number;
    codigo?: string;
    tipo?: string;
    categoria?: TransporteCategoria;
    matricula?: string;
    marca?: string;
    modelo?: string;
    lotacao?: number;
    dataMatricula?: string;
    nome?: string;
  };
  transportes?: Array<{
    id?: number;
    transporte: {
      id: number;
      codigo?: string;
      tipo?: string;
      categoria?: TransporteCategoria;
      matricula?: string;
      marca?: string;
      modelo?: string;
      lotacao?: number;
      dataMatricula?: string;
      nome?: string;
    };
  }>;
  destino?: string;
  dataHoraSaida?: string;
  dataHoraRegresso?: string;
  numeroPassageiros?: number;
  condutor?: string | null;
  assunto?: string;
}

export interface RequisicaoFilters {
  estado?: RequisicaoEstado;
  tipo?: RequisicaoTipo;
  prioridade?: RequisicaoPrioridade;
  criadoPorNome?: string;
  geridoPorNome?: string;
}

export interface CriarRequisicaoBaseRequest {
  descricao?: string;
  prioridade: RequisicaoPrioridade;
  tempoLimite?: string;
  criadoPorId: number;
  geridoPorId?: number;
}

export interface CriarRequisicaoMaterialRequest extends CriarRequisicaoBaseRequest {
  itens: Array<{
    materialId: number;
    quantidade: number;
  }>;
}

export interface CriarRequisicaoTransporteRequest extends CriarRequisicaoBaseRequest {
  destino: string;
  dataHoraSaida: string;
  dataHoraRegresso: string;
  numeroPassageiros: number;
  condutor?: string;
  transporteIds: number[];
}

export interface ManutencaoItemRequestPayload {
  itemId: number;
  observacoes?: string;
}

export interface CriarManutencaoItemCatalogoRequest {
  categoria: string;
  espaco: string;
  itemVerificacao: string;
}

export interface CriarRequisicaoManutencaoRequest extends CriarRequisicaoBaseRequest {
  assunto?: string;
  manutencaoItens?: ManutencaoItemRequestPayload[];
}

export interface AtualizarEstadoRequisicaoRequest {
  estado: RequisicaoEstado;
}

export interface CriarMaterialCatalogoRequest {
  nome: string;
  descricao?: string;
  categoria: MaterialCategoria;
  atributo: string;
  valorAtributo: string;
}

export interface CriarTransporteCatalogoRequest {
  codigo?: string;
  tipo: string;
  categoria: TransporteCategoria;
  matricula: string;
  marca?: string;
  modelo?: string;
  lotacao?: number;
  dataMatricula?: string;
}

export interface CriarTipoManutencaoCatalogoRequest {
  nome: string;
  descricao?: string;
}
