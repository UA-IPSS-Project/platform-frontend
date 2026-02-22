export interface DocumentoDTO {
    id: number;
    marcacaoId: number;
    nomeOriginal: string;
    tipoMime: string;
    tamanho: number;
    uploadedEm: string; // Backend envia como "uploadedEm"
}
