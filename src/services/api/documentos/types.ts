export interface DocumentoDTO {
    id: number;
    marcacaoId: number;
    nomeOriginal: string;
    tipo: string;       // backend field name
    tipoMime?: string;  // alias kept for compatibility
    tamanho: number;
    uploadedEm: string;
    utenteNome?: string | null;
    utenteNif?: string | null;
    sequencia: number;
    finalidade?: string | null;
}

export interface PesquisaDocumentosParams {
    nomeOriginal?: string;
    nomeArmazenado?: string;
    tipo?: string;
    utenteNome?: string;
    utenteNif?: string;
    marcacaoDesde?: string;
    marcacaoAte?: string;
}
