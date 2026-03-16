export interface BloqueioAgenda {
    id: number;
    data: string;
    horaInicio: string;
    horaFim: string;
    motivo: string;
    tipo?: string;
}

export interface ConfiguracaoSlot {
    tipo: 'SECRETARIA' | 'BALNEARIO';
    capacidadePorSlot: number;
}

// Re-export BloqueioAgenda as Bloqueio type for compatibility
export type Bloqueio = BloqueioAgenda;
