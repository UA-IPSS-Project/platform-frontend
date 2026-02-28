export interface Appointment {
    id: string;
    version?: number;
    date: Date;
    time: string;
    duration: number;
    patientNIF: string;
    patientName: string;
    patientContact: string;
    patientEmail: string;
    subject: string;
    description: string;
    status: 'scheduled' | 'in-progress' | 'warning' | 'completed' | 'cancelled' | 'reserved' | 'no-show';
    cancellationReason?: string;
    documents?: { name: string; invalid?: boolean; reason?: string }[];
    attendantName?: string;
    balnearioDetails?: {
        produtosHigiene: boolean;
        lavagemRoupa: boolean;
        roupas: {
            id: number;
            categoria: string;
            tamanho: string;
            quantidade: number;
        }[];
    };
}

export type ViewType = 'home' | 'requisitions' | 'sections' | 'appointments' | 'management' | 'more' | 'profile' | 'history' | 'settings' | 'administrative' | 'material' | 'manutencao' | 'transportes' | 'urgente' | 'balneario' | 'escola' | 'valencias' | 'candidaturas' | 'creche' | 'catl' | 'erpi' | 'reports' | 'consumos' | string;
