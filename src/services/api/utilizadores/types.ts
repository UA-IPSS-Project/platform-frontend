export interface UtilizadorInfo {
    id: number;
    nome: string;
    nif: string;
    telefone: string;
    email: string;
    dataNascimento?: string;
    active: boolean;
    funcao?: string;
    morada?: string;
    codigoPostal?: string;
    freguesia?: string;
    profissao?: string;
    localEmprego?: string;
    moradaEmprego?: string;
    telefoneEmprego?: string;
}

export interface UtilizadorResponseDTO extends UtilizadorInfo { }

export interface AtualizarUtilizadorRequest {
    nome?: string;
    telefone?: string;
    email?: string;
    morada?: string;
    codigoPostal?: string;
    freguesia?: string;
    profissao?: string;
    localEmprego?: string;
    moradaEmprego?: string;
    telefoneEmprego?: string;
    dataNasc?: string;
}
