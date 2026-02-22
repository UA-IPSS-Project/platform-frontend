export interface Notificacao {
    id: number;
    utilizadorId: number;
    titulo: string;
    mensagem: string;
    tipo: 'LEMBRETE' | 'CANCELAMENTO' | 'FICHEIRO' | 'SISTEMA';
    lida: boolean;
    dataCriacao: string;
    metadata?: Record<string, any>;
}
