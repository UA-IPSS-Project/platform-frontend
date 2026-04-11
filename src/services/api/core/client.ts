// API Base URL
import i18n from '../../../i18n';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface ApiRequestError extends Error {
    status?: number;
    fieldErrors?: Record<string, string>;
}

const getFriendlyHttpErrorMessage = (status: number): string => {
    if (status >= 500) return i18n.t('api.errors.serviceUnavailable');
    if (status === 404) return i18n.t('api.errors.notFound');
    if (status >= 400) return i18n.t('api.errors.requestFailed');
    return i18n.t('api.errors.communicationError');
};

const isLikelyHtmlResponse = (text: string, contentType: string | null): boolean => {
    if (contentType?.toLowerCase().includes('text/html')) return true;
    const trimmed = text.trim().toLowerCase();
    return trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html') || trimmed.includes('<body');
};

// Helper to get cookie by name
export const getCookie = (name: string): string | null => {
    if (!document.cookie) {
        return null;
    }


    const xsrfCookies = document.cookie.split(';')
        .map(c => c.trim())
        .filter(c => c.startsWith(name + '='));

    if (xsrfCookies.length === 0) {
        return null;
    }
    const value = decodeURIComponent(xsrfCookies[0].substring(name.length + 1));
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
    }

    return headers;
};

// Generic API request function
export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
        ...buildHeaders(),
        ...options.headers,
    } as Record<string, string>;

    // If body is FormData, let the browser set the Content-Type with boundary
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    const config: RequestInit = {
        ...options,
        credentials: 'include', // IMPORTANT: Send cookies with request
        headers,
    };

    try {


        const response = await fetch(url, config);

        // Check if response is ok
        if (!response.ok) {
            const isAuthError = response.status === 401 || response.status === 403;
            let errorMessage = i18n.t('api.errors.communicationError');
            let parsedErrorData: any = null;

            if (response.status === 401) {
                errorMessage = i18n.t('api.errors.sessionExpired');
            } else if (response.status === 403) {
                errorMessage = i18n.t('api.errors.accessDenied');
            }

            try {
                const text = await response.text();
                const contentType = response.headers.get('content-type');

                if (isLikelyHtmlResponse(text, contentType) && !isAuthError) {
                    errorMessage = getFriendlyHttpErrorMessage(response.status);
                } else {
                    try {
                        // Try to parse as JSON
                        const errorData = JSON.parse(text);
                        parsedErrorData = errorData;

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
                        // If not JSON, try to use text content if it's short and plain text
                        if (text && text.length < 200 && !isAuthError) {
                            errorMessage = text;
                        } else if (!isAuthError) {
                            errorMessage = getFriendlyHttpErrorMessage(response.status);
                        }
                    }
                }
            } catch {
                if (!isAuthError) {
                    errorMessage = getFriendlyHttpErrorMessage(response.status);
                }
            }

            console.error(`API Error: ${config.method || 'GET'} ${url} - ${errorMessage}`);
            const error = new Error(errorMessage) as ApiRequestError;
            error.status = response.status;

            if (parsedErrorData?.errors && typeof parsedErrorData.errors === 'object') {
                error.fieldErrors = parsedErrorData.errors as Record<string, string>;
            }

            throw error;
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
            throw new Error(i18n.t('api.errors.invalidJson'));
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
