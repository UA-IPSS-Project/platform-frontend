import { apiRequest } from '../core/client';
import {
    UtilizadorInfo,
    UtilizadorResponseDTO,
    AtualizarUtilizadorRequest
} from './types';

export const utilizadoresApi = {
    // Contar utentes ativos
    contarUtentesAtivos: () =>
        apiRequest<number>('/api/utilizadores/utentes/count', {
            method: 'GET',
        }),

    // Contar funcionários
    contarFuncionarios: () =>
        apiRequest<number>('/api/utilizadores/funcionarios/count', {
            method: 'GET',
        }),

    // Obter utilizador por ID
    obterPorId: (id: number) =>
        apiRequest<UtilizadorInfo>(`/api/utilizadores/${id}`, {
            method: 'GET',
        }),

    // Atualizar utilizador
    atualizar: (id: number, data: AtualizarUtilizadorRequest) =>
        apiRequest<UtilizadorInfo>(`/api/utilizadores/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    buscarPorNif: (nif: string) =>
        apiRequest<UtilizadorInfo>(`/api/utilizadores/nif/${nif}`, {
            method: 'GET',
        }),

    // Listar todos os funcionários (ativos e pendentes) -> Using the generic endpoint if it exists or special one
    // Assuming the backend has a general list endpoint, but let's using the new specific ones or the general findAll filter
    // Based on previous steps, I added `listarFuncionariosPendentes`.
    // I likely need to add `listarFuncionarios` (all) in backend or user existing.
    // Let's add the pending one first as it is confirmed.

    listarFuncionariosPendentes: () =>
        apiRequest<UtilizadorResponseDTO[]>('/api/utilizadores/funcionarios/pendentes', {
            method: 'GET',
        }),

    listarFuncionarios: () =>
        apiRequest<UtilizadorResponseDTO[]>('/api/utilizadores/funcionarios', {
            method: 'GET',
        }),

    aprovarFuncionario: (id: number) =>
        apiRequest<void>(`/api/utilizadores/${id}/aprovar`, {
            method: 'PUT',
        }),

    // Novos endpoints para Gestão da Secretaria
    searchByNifForRecovery: (nif: string) =>
        apiRequest<UtilizadorInfo>(`/api/utilizadores/recovery/search/${nif}`, {
            method: 'GET',
        }),

    createBySecretary: (data: {
        name: string;
        nif: string;
        contact?: string;
        email: string;
        birthDate: string; // YYYY-MM-DD
        isEmployee: boolean;
        role?: string;
    }) =>
        apiRequest<UtilizadorInfo>('/api/utilizadores/create-by-secretary', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    recoverAccount: (data: {
        nif: string;
        updatedEmail?: string;
        updatedContact?: string;
    }) =>
        apiRequest<void>('/api/utilizadores/recover', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};
