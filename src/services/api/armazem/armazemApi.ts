import { apiRequest } from '../core/client';

export interface ItemArmazemDTO {
    id: number;
    categoria: string;
    nome: string;
    quantidade: number;
    quantidadeMinima: number;
    unidade: string;
    estado: 'OK' | 'BAIXO';
    marca?: string;
    tamanho?: string;
    volume?: number;
    descricao?: string;
}

export interface ConsumoEstatisticaDTO {
    periodo: string;
    itens: {
        categoria: string;
        nome: string;
        quantidade: number;
        data: string;
    }[];
    totaisPorCategoria: Record<string, number>;
    totalGeral: number;
}

export interface StockCheckResult {
    tracked: boolean;
    quantidade?: number;
    quantidadeMinima?: number;
    estado?: string;
    esgotado?: boolean;
}

export const armazemApi = {
    /** Lista todos os itens do armazém */
    listarTodos: () =>
        apiRequest<ItemArmazemDTO[]>('/api/armazem', { method: 'GET' }),

    /** Lista itens de uma categoria */
    listarPorCategoria: (categoria: string) =>
        apiRequest<ItemArmazemDTO[]>(`/api/armazem/categoria/${categoria}`, { method: 'GET' }),

    /** Cria um novo item no armazém */
    criarItem: (data: Partial<ItemArmazemDTO>) =>
        apiRequest<ItemArmazemDTO>('/api/armazem', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /** Atualiza um item do armazém (quantidade, mínimios, nome, etc) */
    atualizarItem: (id: number, data: Partial<ItemArmazemDTO>) =>
        apiRequest<ItemArmazemDTO>(`/api/armazem/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    /** Elimina um item do armazém */
    eliminarItem: (id: number) =>
        apiRequest<void>(`/api/armazem/${id}`, { method: 'DELETE' }),

    /** Verifica stock para itens do formulário */
    verificarStock: (formItems: string[]) =>
        apiRequest<Record<string, StockCheckResult>>('/api/armazem/stock-check', {
            method: 'POST',
            body: JSON.stringify(formItems),
        }),

    /** Verifica stock de calçado por tamanhos */
    verificarStockCalcado: (tamanhos: string[]) =>
        apiRequest<Record<string, StockCheckResult>>('/api/armazem/stock-check/calcado', {
            method: 'POST',
            body: JSON.stringify(tamanhos),
        }),

    /** Obtém estatísticas de consumo por período */
    obterEstatisticas: (periodo: 'DIA' | 'SEMANA' | 'MES' = 'MES') =>
        apiRequest<ConsumoEstatisticaDTO>(`/api/armazem/estatisticas?periodo=${periodo}`, {
            method: 'GET',
        }),
};
