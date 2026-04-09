import { apiRequest, Page } from '../core/client';
import {
    MarcacaoPresencialRequest,
    MarcacaoRemotaRequest,
    MarcacaoResponse,
    BalnearioAttendanceStats
} from './types';

export const marcacoesApi = {
    criarPresencial: (data: MarcacaoPresencialRequest) =>
        apiRequest<MarcacaoResponse>('/api/marcacoes/presencial', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    criarRemota: (data: MarcacaoRemotaRequest) =>
        apiRequest<MarcacaoResponse>('/api/marcacoes/remota', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    // Consultar agenda geral (sem filtros ou com filtros de data)
    consultarAgenda: (dataInicio?: string, dataFim?: string, tipo?: string) => {
        const params = new URLSearchParams();
        if (dataInicio) params.append('dataInicio', dataInicio);
        if (dataFim) params.append('dataFim', dataFim);
        if (tipo) params.append('tipo', tipo);
        const query = params.toString() ? `?${params.toString()}` : '';
        return apiRequest<MarcacaoResponse[]>(`/api/marcacoes/agenda${query}`, {
            method: 'GET',
        });
    },

    // Procurar agenda com mais filtros
    procurarAgenda: (params: {
        dataInicio?: string;
        dataFim?: string;
        criadoPorId?: number;
        utenteId?: number;
        estado?: string;
    }) => {
        const searchParams = new URLSearchParams();
        if (params.dataInicio) searchParams.append('dataInicio', params.dataInicio);
        if (params.dataFim) searchParams.append('dataFim', params.dataFim);
        if (params.criadoPorId) searchParams.append('criadoPorId', params.criadoPorId.toString());
        if (params.utenteId) searchParams.append('utenteId', params.utenteId.toString());
        if (params.estado) searchParams.append('estado', params.estado);
        return apiRequest<MarcacaoResponse[]>(
            `/api/marcacoes/agenda/procurar?${searchParams.toString()}`,
            { method: 'GET' }
        );
    },

    obterPassadas: (dataInicio?: string, dataFim?: string, utenteId?: number, estado?: string) => {
        const params = new URLSearchParams();
        if (dataInicio) params.append('dataInicio', dataInicio);
        if (dataFim) params.append('dataFim', dataFim);
        if (utenteId) params.append('utenteId', utenteId.toString());
        if (estado) params.append('estado', estado);
        const query = params.toString() ? `?${params.toString()}` : '';
        return apiRequest<MarcacaoResponse[]>(`/api/marcacoes/passadas${query}`, {
            method: 'GET',
        });
    },

    obterPorUtente: (utenteId: number) =>
        apiRequest<MarcacaoResponse[]>(`/api/marcacoes/utente/${utenteId}`, {
            method: 'GET',
        }),

    obterMarcacoesBloqueadas: (utenteId: number) =>
        apiRequest<{ id: number; data: string }[]>(`/api/marcacoes/utente/${utenteId}/bloqueadas`, {
            method: 'GET',
        }),

    obterPorFuncionario: (funcionarioId: number) =>
        apiRequest<MarcacaoResponse[]>(`/api/marcacoes/funcionario/${funcionarioId}`, {
            method: 'GET',
        }),

    obterPorId: (id: number) =>
        apiRequest<MarcacaoResponse>(`/api/marcacoes/${id}`, {
            method: 'GET',
        }),

    obterTodas: (page = 0, size = 1000) =>
        apiRequest<Page<MarcacaoResponse>>(`/api/marcacoes?page=${page}&size=${size}`, {
            method: 'GET',
        }),

    // Atualizar estado da marcação
    // Atualizar estado da marcação
    atualizarEstado: (marcacaoId: number, novoEstado: string, funcionarioId: number, version?: number, motivoCancelamento?: string) =>
        apiRequest<MarcacaoResponse>(`/api/marcacoes/${marcacaoId}/estado`, {
            method: 'PUT',
            body: JSON.stringify({
                novoEstado,
                funcionarioId,
                version,
                motivoCancelamento,
            }),
        }),

    // Contar marcações de hoje
    contarHoje: () =>
        apiRequest<number>('/api/marcacoes/count/hoje', {
            method: 'GET',
        }),

    // Reagendar marcação (alterar data)
    reagendar: (id: number, novaDataHora: string) =>
        apiRequest<MarcacaoResponse>(`/api/marcacoes/${id}/reagendar`, {
            method: 'PUT',
            body: JSON.stringify({ novaDataHora }),
        }),

    // Reservar slot temporário
    reservarSlot: (data: { data: string; utenteId?: number; criadoPorId?: number; tipoAgenda?: 'SECRETARIA' | 'BALNEARIO' }) =>
        apiRequest<{ tempId: number }>('/api/marcacoes/reservar-slot', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    // Libertar slot temporário
    libertarSlot: (id: number) =>
        apiRequest<void>(`/api/marcacoes/libertar-slot/${id}`, {
            method: 'DELETE',
        }),

    // Atualizar detalhes de uma marcação de balneário (serviços, roupa)
    atualizarDetalhesBalneario: (marcacaoId: number, data: {
        produtosHigiene: boolean;
        lavagemRoupa: boolean;
        roupas: { categoria: string; quantidade: number }[];
    }) =>
        apiRequest<MarcacaoResponse>(`/api/marcacoes/balneario/${marcacaoId}/detalhes`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    // Registo de presença rápida para balneário (Walk-in)
    registarPresencaRapidaBalneario: (data: {
        nomeUtente: string;
        produtosHigiene: boolean;
        lavagemRoupa: boolean;
        observacoes?: string;
        data: string;
        responsavelId: number;
    }) =>
        apiRequest<MarcacaoResponse>('/api/marcacoes/balneario/presenca-rapida', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    // Obter presenças e estatísticas do balneário
    obterEstatisticasFrequenciaBalneario: (periodo: 'DIA' | 'SEMANA' | 'MES' = 'MES') =>
        apiRequest<BalnearioAttendanceStats>(`/api/marcacoes/balneario/estatisticas?periodo=${periodo}`, {
            method: 'GET',
        }),

    // --- Gestão de Assuntos ---
    listarAssuntos: () =>
        apiRequest<any[]>('/api/assuntos', { method: 'GET' }),

    listarAssuntosAdmin: () =>
        apiRequest<any[]>('/api/assuntos/admin', { method: 'GET' }),

    criarAssunto: (assunto: any) =>
        apiRequest<any>('/api/assuntos', {
            method: 'POST',
            body: JSON.stringify(assunto),
        }),

    atualizarAssunto: (id: number, assunto: any) =>
        apiRequest<any>(`/api/assuntos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(assunto),
        }),

    apagarAssunto: (id: number) =>
        apiRequest<void>(`/api/assuntos/${id}`, {
            method: 'DELETE',
        }),
};
