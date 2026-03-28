import { apiRequest } from '../core/client';
import { Bloqueio } from '../calendario/types';
import { format } from 'date-fns';

export const bloqueiosApi = {
    criar: async (data: { dataInicio: string; dataFim: string; horaInicio: string; horaFim: string; motivo?: string }, funcionarioId: number, tipo: string = 'SECRETARIA') => {
        // Handle date range iteration
        const start = new Date(data.dataInicio);
        const end = new Date(data.dataFim);
        const promises = [];

        // Loop through days from start to end (inclusive)
        const current = new Date(start);
        while (current <= end) {
            const dateStr = format(current, 'yyyy-MM-dd');

            const payload = {
                data: dateStr,
                horaInicio: data.horaInicio,
                horaFim: data.horaFim,
                motivo: data.motivo || "Bloqueio Manual",
                funcionarioId: funcionarioId,
                tipo: tipo
            };

            promises.push(
                apiRequest('/api/calendario/bloquear', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                })
            );

            // Next day
            current.setDate(current.getDate() + 1);
        }

        return Promise.all(promises);
    },

    listar: (tipo?: string) =>
        apiRequest<Bloqueio[]>(`/api/calendario/bloqueios${tipo ? `?tipo=${tipo}` : ''}`, {
            method: 'GET',
        }),

    remover: (id: number) =>
        apiRequest(`/api/calendario/${id}`, {
            method: 'DELETE',
        }),
};
