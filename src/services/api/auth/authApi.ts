import { apiRequest } from '../core/client';
import { hashNif } from '../../../utils/hashNif';
import {
    LoginFuncionarioRequest,
    LoginUtenteRequest,
    UtenteRegisterRequest,
    FuncionarioRegisterRequest,
    AuthResponse
} from './types';

export const authApi = {
    loginFuncionario: (data: LoginFuncionarioRequest) =>
        apiRequest<AuthResponse>('/api/auth/login/funcionario', {
            method: 'POST',
            body: JSON.stringify(data),
        }, false),

    loginUtente: async (data: LoginUtenteRequest) => {
        const nifHash = await hashNif(data.nif);
        return apiRequest<AuthResponse>('/api/auth/login/utente', {
            method: 'POST',
            body: JSON.stringify({ ...data, nif: nifHash }),
        }, false);
    },

    registerUtente: async (data: UtenteRegisterRequest) => {
        const nifHash = await hashNif(data.nif);
        return apiRequest<AuthResponse>('/api/auth/register/utente', {
            method: 'POST',
            body: JSON.stringify({ ...data, nif: nifHash }),
        }, false);
    },

    registerFuncionario: async (data: FuncionarioRegisterRequest) => {
        const nifHash = await hashNif(data.nif);
        return apiRequest<AuthResponse>('/api/auth/register/funcionario', {
            method: 'POST',
            body: JSON.stringify({ ...data, nif: nifHash }),
        }, false);
    },

    updatePassword: (password: string, termsAccepted: boolean) =>
        apiRequest<void>('/api/auth/password', {
            method: 'PUT',
            body: JSON.stringify({ newPassword: password, termsAccepted }),
        }),

    logout: () =>
        apiRequest<void>('/api/auth/logout', {
            method: 'POST',
        }),
};
