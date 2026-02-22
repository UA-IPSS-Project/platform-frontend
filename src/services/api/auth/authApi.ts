import { apiRequest } from '../core/client';
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

    loginUtente: (data: LoginUtenteRequest) =>
        apiRequest<AuthResponse>('/api/auth/login/utente', {
            method: 'POST',
            body: JSON.stringify(data),
        }, false),

    registerUtente: (data: UtenteRegisterRequest) =>
        apiRequest<AuthResponse>('/api/auth/register/utente', {
            method: 'POST',
            body: JSON.stringify(data),
        }, false),

    registerFuncionario: (data: FuncionarioRegisterRequest) =>
        apiRequest<AuthResponse>('/api/auth/register/funcionario', {
            method: 'POST',
            body: JSON.stringify(data),
        }, false),

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
