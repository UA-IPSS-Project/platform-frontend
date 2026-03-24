import { apiRequest } from '../core/client';
import { BloqueioAgenda, ConfiguracaoSlot } from './types';

export const calendarioApi = {
    // Verificar se um slot específico está bloqueado
    verificarSlot: (data: string, hora: string, tipo?: string) =>
        apiRequest<boolean>(`/api/calendario/verificar-slot?data=${data}&hora=${hora}${tipo ? `&tipo=${tipo}` : ''}`, {
            method: 'GET',
        }),

    // Listar bloqueios de um mês, opcionalmente filtrados por tipo
    listarBloqueios: (ano: number, mes: number, tipo?: string) =>
        apiRequest<BloqueioAgenda[]>(`/api/calendario/bloqueios?ano=${ano}&mes=${mes}${tipo ? `&tipo=${tipo}` : ''}`, {
            method: 'GET',
        }),

    // Listar feriados de um ano
    listarFeriados: (ano: number) =>
        apiRequest<string[]>(`/api/calendario/feriados?ano=${ano}`, {
            method: 'GET',
        }),

    listarConfiguracaoSlots: () =>
        apiRequest<ConfiguracaoSlot[]>('/api/calendario/configuracao-slots', {
            method: 'GET',
        }),

    atualizarConfiguracaoSlot: (tipo: 'SECRETARIA' | 'BALNEARIO', capacidadePorSlot: number) =>
        apiRequest<ConfiguracaoSlot>(`/api/calendario/configuracao-slots/${tipo}`, {
            method: 'PUT',
            body: JSON.stringify({ capacidadePorSlot }),
        }),
};
