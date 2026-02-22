import { apiRequest, API_BASE_URL, getCookie } from '../core/client';
import { DocumentoDTO } from './types';

export const documentosApi = {
    // Upload de documento(s) para uma marcação
    uploadDocumentos: async (marcacaoId: number, files: File[]): Promise<DocumentoDTO[]> => {
        const uploadedDocs: DocumentoDTO[] = [];

        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);

            const xsrfToken = getCookie('XSRF-TOKEN');
            const headers: Record<string, string> = {};
            if (xsrfToken) {
                headers['X-XSRF-TOKEN'] = xsrfToken;
            }

            const response = await fetch(`${API_BASE_URL}/api/documentos/marcacao/${marcacaoId}/upload`, {
                method: 'POST',
                credentials: 'include',
                headers,
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro ao enviar ${file.name}: ${errorText}`);
            }

            const documento = await response.json();
            uploadedDocs.push(documento);
        }

        return uploadedDocs;
    },

    // Listar documentos de uma marcação
    listarDocumentos: (marcacaoId: number) =>
        apiRequest<DocumentoDTO[]>(`/api/documentos/marcacao/${marcacaoId}`, {
            method: 'GET',
        }),

    // Download de documento
    downloadDocumento: async (documentoId: number, nomeOriginal: string): Promise<void> => {
        const xsrfToken = getCookie('XSRF-TOKEN');
        const headers: Record<string, string> = {};
        if (xsrfToken) {
            headers['X-XSRF-TOKEN'] = xsrfToken;
        }

        const response = await fetch(`${API_BASE_URL}/api/documentos/${documentoId}/download`, {
            method: 'GET',
            credentials: 'include',
            headers,
        });

        if (!response.ok) {
            throw new Error('Erro ao fazer download do documento');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nomeOriginal;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },

    // Remover documento
    removerDocumento: (documentoId: number) =>
        apiRequest<void>(`/api/documentos/${documentoId}`, {
            method: 'DELETE',
        }),
};
