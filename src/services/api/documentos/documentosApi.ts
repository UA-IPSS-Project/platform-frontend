import { apiRequest, API_BASE_URL, getCookie } from '../core/client';
import { DocumentoDTO, PesquisaDocumentosParams } from './types';
export const documentosApi = {
    // Preview inline de documento (abre em nova aba)
    previewDocumento: (documentoId: number) => {
        const url = `${API_BASE_URL}/api/documentos/${documentoId}/preview`;
        // Abre em nova aba para visualização inline
        window.open(url, '_blank', 'noopener');
    },
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

    // Upload de múltiplos documentos para uma marcação em um único request
    uploadDocumentosBulk: async (marcacaoId: number, files: File[]): Promise<void> => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        return apiRequest<void>(`/api/documentos/upload/${marcacaoId}`, {
            method: 'POST',
            body: formData,
        });
    },

        // Notificar utente sobre documentos inválidos
    notificarDocumentoInvalido: async (marcacaoId: number, documentoId: number, observacoes: string) => {
        const xsrfToken = getCookie('XSRF-TOKEN');
        const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
        if (xsrfToken) {
            headers['X-XSRF-TOKEN'] = xsrfToken;
        }
        const body = new URLSearchParams({ documentoId: documentoId.toString(), observacoes });
        const response = await fetch(`${API_BASE_URL}/api/documentos/marcacao/${marcacaoId}/notificar-invalidos`, {
            method: 'POST',
            credentials: 'include',
            headers,
            body,
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao notificar utente: ${errorText}`);
        }
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

    // Pesquisar documentos por metadados
    pesquisarDocumentos: (params: PesquisaDocumentosParams = {}) => {
        const searchParams = new URLSearchParams();

        if (params.nomeOriginal?.trim()) searchParams.append('nomeOriginal', params.nomeOriginal.trim());
        if (params.nomeArmazenado?.trim()) searchParams.append('nomeArmazenado', params.nomeArmazenado.trim());
        if (params.tipo?.trim()) searchParams.append('tipo', params.tipo.trim());
        if (params.utenteNome?.trim()) searchParams.append('utenteNome', params.utenteNome.trim());
        if (params.utenteNif?.trim()) searchParams.append('utenteNif', params.utenteNif.trim());
        if (params.marcacaoDesde?.trim()) searchParams.append('marcacaoDesde', params.marcacaoDesde.trim());
        if (params.marcacaoAte?.trim()) searchParams.append('marcacaoAte', params.marcacaoAte.trim());

        const query = searchParams.toString();
        const endpoint = query ? `/api/documentos/pesquisar?${query}` : '/api/documentos/pesquisar';

        return apiRequest<DocumentoDTO[]>(endpoint, {
            method: 'GET',
        });
    },
};
