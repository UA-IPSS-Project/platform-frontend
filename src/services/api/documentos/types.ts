export interface DocumentoDTO {
    id: number;
    marcacaoId: number;
    nomeOriginal: string;
    tipoMime: string;
    tamanho: number;
    uploadedEm: string; // Backend envia como "uploadedEm"
    utenteNome?: string | null;
    utenteNif?: string | null;
}

export interface PesquisaDocumentosParams {
    nomeOriginal?: string;
    nomeArmazenado?: string;
    tipo?: string;
    utenteNome?: string;
    utenteNif?: string;
    desde?: string;
    ate?: string;
}
