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

    listarFuncionarios: (nome?: string, tipo?: string, page = 0, size = 20) => {
        const params = new URLSearchParams({ page: String(page), size: String(size) });
        if (nome) params.append('nome', nome);
        if (tipo) params.append('tipo', tipo);
        return apiRequest<import('../core/client').Page<UtilizadorResponseDTO>>(`/api/utilizadores/funcionarios?${params}`);
    },

    listarUtentes: (nome?: string, page = 0, size = 20) => {
        const params = new URLSearchParams({ page: String(page), size: String(size) });
        if (nome) params.append('nome', nome);
        return apiRequest<import('../core/client').Page<UtilizadorResponseDTO>>(`/api/utilizadores/utentes?${params}`);
    },

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
        email?: string;
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

    generatePresentialCode: (nif: string) =>
        apiRequest<{ code: string }>('/api/utilizadores/generate-presential-code', {
            method: 'POST',
            body: JSON.stringify({ nif }),
        }),

    // Direito ao Esquecimento (RGPD Art.º 17)
    solicitarEliminacao: () =>
        apiRequest<void>('/api/utilizadores/me/delete-request', {
            method: 'POST',
        }),

    anonimizarUtilizador: (id: number) =>
        apiRequest<void>(`/api/utilizadores/${id}/anonimizar`, {
            method: 'POST',
        }),

    anonimizarEEliminarUtilizador: (id: number) =>
        apiRequest<void>(`/api/utilizadores/${id}/anonimizar-eliminar`, {
            method: 'DELETE',
        }),

    // Direito de Portabilidade (RGPD Art.º 20)
    exportarDados: () =>
        apiRequest<any>('/api/utilizadores/me/export', {
            method: 'GET',
        }),

    // Termos de Uso — Versionamento (RGPD)
    checkTermsStatus: () =>
        apiRequest<{ currentVersion: number; userVersion: number | null; needsAcceptance: boolean }>(
            '/api/utilizadores/me/terms-status',
            { method: 'GET' }
        ),

    acceptTerms: (version: number) =>
        apiRequest<void>(`/api/utilizadores/me/accept-terms?version=${version}`, {
            method: 'POST',
        }),

    updateTermsVersion: (newVersion: number, changeDescription?: string) => {
        const params = new URLSearchParams({ newVersion: String(newVersion) });
        if (changeDescription) params.set('changeDescription', changeDescription);
        return apiRequest<void>(`/api/utilizadores/admin/terms-version?${params}`, {
            method: 'POST',
        });
    },
    
    getPublicTermsContent: (lang: string) =>
        apiRequest<{ content: string }>(`/api/utilizadores/terms-content?lang=${lang}`, {
            method: 'GET',
        }),

    getTermsContent: (lang: string) =>
        apiRequest<{ content: string }>(`/api/utilizadores/admin/terms-content?lang=${lang}`, {
            method: 'GET',
        }),

    updateTermsContent: (lang: string, content: string) =>
        apiRequest<void>(`/api/utilizadores/admin/terms-content?lang=${lang}`, {
            method: 'PUT',
            body: JSON.stringify({ content }),
        }),

    // Publicar nova versão: guarda PT+EN + incrementa versão atomicamente
    publishTerms: (contentPt: string, contentEn: string, changeDescription?: string) =>
        apiRequest<{ version: number }>('/api/utilizadores/admin/terms-publish', {
            method: 'POST',
            body: JSON.stringify({ contentPt, contentEn, changeDescription }),
        }),

    // Contas especiais (DPO/Auditor)
    createSpecialAccount: (email: string, tipo: string) =>
        apiRequest<void>('/api/utilizadores/special-account', {
            method: 'POST',
            body: JSON.stringify({ email, tipo }),
        }),

    recoverSpecialAccount: (email: string) =>
        apiRequest<void>('/api/utilizadores/special-account/recover', {
            method: 'POST',
            body: JSON.stringify({ email }),
        }),
};
