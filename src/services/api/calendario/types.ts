export interface BloqueioAgenda {
    id: number;
    data: string;
    horaInicio: string;
    horaFim: string;
    motivo: string;
}

// Re-export BloqueioAgenda as Bloqueio type for compatibility
export type Bloqueio = BloqueioAgenda;
