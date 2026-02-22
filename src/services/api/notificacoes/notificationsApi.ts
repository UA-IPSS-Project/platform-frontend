import { apiRequest } from '../core/client';
import { Notificacao } from './types';

export const notificationsApi = {
    listar: async (): Promise<Notificacao[]> => {
        return apiRequest<Notificacao[]>('/api/notificacoes', { method: 'GET' });
    },

    contarNaoLidas: async (): Promise<number> => {
        return apiRequest<number>('/api/notificacoes/unread-count', { method: 'GET' });
    },

    marcarComoLida: async (id: number): Promise<void> => {
        return apiRequest<void>(`/api/notificacoes/${id}/ler`, { method: 'PUT' });
    },

    marcarTodasComoLidas: async (): Promise<void> => {
        return apiRequest<void>('/api/notificacoes/ler-todas', { method: 'PUT' });
    },

    eliminar: async (id: number): Promise<void> => {
        return apiRequest<void>(`/api/notificacoes/${id}`, { method: 'DELETE' });
    },

    eliminarTodas: async (): Promise<void> => {
        return apiRequest<void>('/api/notificacoes', { method: 'DELETE' });
    }
};
