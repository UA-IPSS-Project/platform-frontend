export interface LoginFuncionarioRequest {
    email: string;
    password: string;
}

export interface LoginUtenteRequest {
    nif: string;
    password: string;
}

export interface UtenteRegisterRequest {
    nome: string;
    email: string;
    password: string;
    nif: string;
    telefone: string;
    dataNasc: string; // ISO format: YYYY-MM-DD
    termsAccepted: boolean;
}

export interface FuncionarioRegisterRequest {
    nome: string;
    email: string;
    password: string;
    nif: string;
    contacto: string;
    funcao: string;
    dataNasc: string; // ISO format: YYYY-MM-DD
    termsAccepted: boolean;
}

export interface AuthResponse {
    // Token is now in HttpOnly Cookie
    id: number;
    email: string;
    nome: string;
    role: 'UTENTE' | 'SECRETARIA' | 'BALNEARIO' | 'ESCOLA' | 'INTERNO';
    active: boolean;
    requiresPasswordSetup: boolean;
}
