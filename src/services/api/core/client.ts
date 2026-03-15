// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Helper to get cookie by name
export const getCookie = (name: string): string | null => {
    if (!document.cookie) {
        console.debug(`[CSRF] No cookies found in document.cookie`);
        return null;
    }

    // Log all cookies for debugging (be careful with sensitive info in prod, but ok for dev/debugging now)
    // console.debug('[CSRF] Cookies present:', document.cookie);

    const xsrfCookies = document.cookie.split(';')
        .map(c => c.trim())
        .filter(c => c.startsWith(name + '='));

    if (xsrfCookies.length === 0) {
        console.warn(`[CSRF] Cookie ${name} not found in:`, document.cookie);
        return null;
    }
    const value = decodeURIComponent(xsrfCookies[0].substring(name.length + 1));
    console.debug(`[CSRF] Found cookie ${name}:`, value ? 'present' : 'empty');
    return value;
};

// Helper function to build headers
export const buildHeaders = (): HeadersInit => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    const xsrfToken = getCookie('XSRF-TOKEN');
    if (xsrfToken) {
        headers['X-XSRF-TOKEN'] = xsrfToken;
        console.debug('[CSRF] Added header X-XSRF-TOKEN');
    } else {
        console.warn('[CSRF] XSRF-TOKEN cookie missing, header not added');
    }

    return headers;
};

// Generic API request function
export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
        ...options,
        credentials: 'include', // IMPORTANT: Send cookies with request
        headers: {
            ...buildHeaders(),
            ...options.headers,
        },
    };

    try {


        const response = await fetch(url, config);

        // Check if response is ok
        if (!response.ok) {
            const isAuthError = response.status === 401 || response.status === 403;
            let errorMessage = 'Ocorreu um erro ao comunicar com o servidor.';

            if (response.status === 401) {
                errorMessage = 'Sessão expirada ou inválida. Inicie sessão novamente.';
            } else if (response.status === 403) {
                errorMessage = 'Acesso negado ou token de segurança inválido. Atualize a sessão.';
            }

            try {
                const text = await response.text();

                try {
                    // Try to parse as JSON
                    const errorData = JSON.parse(text);

                    if (errorData.message && !isAuthError) {
                        errorMessage = errorData.message;

                        // Handle validation errors specifically
                        if (errorData.errors && typeof errorData.errors === 'object') {
                            const details = Object.values(errorData.errors).join('; ');
                            if (details) {
                                errorMessage += `: ${details}`;
                            }
                        }
                    }
                    else if (errorData.error && !isAuthError) {
                        // Legacy/Fallback error field
                        errorMessage = errorData.error;
                    }
                } catch {
                    // If not JSON, try to use text content if it's short
                    if (text && text.length < 200 && !isAuthError) {
                        errorMessage = text;
                    } else if (!isAuthError) {
                        errorMessage = `Erro ${response.status}: Não foi possível processar a resposta do servidor.`;
                    }
                }
            } catch {
                if (!isAuthError) {
                    errorMessage = `Erro de conexão (${response.status})`;
                }
            }

            console.error(`API Error: ${config.method || 'GET'} ${url} - ${errorMessage}`);
            throw new Error(errorMessage);
        }

        // Get response text first to check if it's empty or invalid
        const text = await response.text();

        // If response is empty, return empty object
        if (!text || text.trim().length === 0) {
            return {} as T;
        }

        // Try to parse JSON
        try {
            const data = JSON.parse(text);
            return data as T;
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Response text:', text.substring(0, 500)); // Log first 500 chars
            throw new Error('Invalid JSON response from server');
        }
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

export interface Page<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    empty: boolean;
}
