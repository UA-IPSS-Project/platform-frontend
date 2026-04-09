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

export interface AttendanceData {
    data: string;
    quantidade: number;
}

export interface BalnearioAttendanceStats {
    periodo: string;
    totalPresencas: number;
    totalMarcacoes: number;
    totalFaltou: number;
    totalAgendadas: number;
    presencasPorDia: AttendanceData[];
    presencasPorHora: Record<number, number>;
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

export interface Assunto {
    id: number;
    nome: string;
    ativo: boolean;
}
