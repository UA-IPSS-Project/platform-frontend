export interface MarcacaoPresencialRequest {
    utenteId: number;
    funcionarioId: number;
    assunto: string;
    observacoes?: string;
    dataHora: string; // ISO format
}

export interface MarcacaoRemotaRequest {
    utenteId: number;
    funcionarioId: number;
    assunto: string;
    observacoes?: string;
    dataHora: string; // ISO format
    linkReuniao: string;
}

export interface MarcacaoResponse {
    id: number;
    version: number;
    data: string;
    estado: string;
    atendenteNome?: string;
    motivoCancelamento?: string;
    marcacaoSecretaria?: {
        assunto: string;
        descricao?: string;
        tipoAtendimento: 'PRESENCIAL' | 'REMOTO';
        utente?: {
            id: number;
            nome: string;
            email?: string;
            nif: string;
            telefone?: string;
        };
    };
}
