// API Base URL
const API_BASE_URL = 'http://localhost:8080';

// Helper function to get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper function to build headers
const buildHeaders = (includeAuth: boolean = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = true
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...buildHeaders(requiresAuth),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    // Check if response is ok
    if (!response.ok) {
      // Try to parse error message
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If can't parse JSON, use default message
      }
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

// ===================
// Auth API
// ===================

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
}

export interface FuncionarioRegisterRequest {
  nome: string;
  email: string;
  password: string;
  nif: string;
  contacto: string;
  funcao: string;
  dataNasc: string; // ISO format: YYYY-MM-DD
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  nome: string;
  role: 'FUNCIONARIO' | 'UTENTE';
}

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
};

// ===================
// Marcações API
// ===================

export interface MarcacaoPresencialRequest {
  utenteId: number;
  funcionarioId: number;
  assunto: string;
  observacoes?: string;
  dataHora: string; // ISO format
}

export interface MarcacaoRemotaRequest {
  utenteId: number;
  funcionarioId: number;
  assunto: string;
  observacoes?: string;
  dataHora: string; // ISO format
  linkReuniao: string;
}

export interface MarcacaoResponse {
  id: number;
  data: string;
  estado: string;
  marcacaoSecretaria?: {
    assunto: string;
    descricao?: string;
    tipoAtendimento: 'PRESENCIAL' | 'REMOTO';
    utente?: {
      id: number;
      nome: string;
      email?: string;
      nif: string;
      telefone?: string;
    };
  };
}

export const marcacoesApi = {
  criarPresencial: (data: MarcacaoPresencialRequest) =>
    apiRequest<MarcacaoResponse>('/api/marcacoes/presencial', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  criarRemota: (data: MarcacaoRemotaRequest) =>
    apiRequest<MarcacaoResponse>('/api/marcacoes/remota', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Consultar agenda geral (sem filtros ou com filtros de data)
  consultarAgenda: (dataInicio?: string, dataFim?: string) => {
    const params = new URLSearchParams();
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<MarcacaoResponse[]>(`/api/marcacoes/agenda${query}`, {
      method: 'GET',
    });
  },

  // Procurar agenda com mais filtros
  procurarAgenda: (params: {
    dataInicio?: string;
    dataFim?: string;
    criadoPorId?: number;
    utenteId?: number;
    estado?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.dataInicio) searchParams.append('dataInicio', params.dataInicio);
    if (params.dataFim) searchParams.append('dataFim', params.dataFim);
    if (params.criadoPorId) searchParams.append('criadoPorId', params.criadoPorId.toString());
    if (params.utenteId) searchParams.append('utenteId', params.utenteId.toString());
    if (params.estado) searchParams.append('estado', params.estado);
    return apiRequest<MarcacaoResponse[]>(
      `/api/marcacoes/agenda/procurar?${searchParams.toString()}`,
      { method: 'GET' }
    );
  },

  obterPassadas: () =>
    apiRequest<MarcacaoResponse[]>(
      `/api/marcacoes/passadas`,
      { method: 'GET' }
    ),

  obterPorUtente: (utenteId: number) =>
    apiRequest<MarcacaoResponse[]>(`/api/marcacoes/utente/${utenteId}`, {
      method: 'GET',
    }),

  obterMarcacoesBloqueadas: (utenteId: number) =>
    apiRequest<{ id: number; data: string }[]>(`/api/marcacoes/utente/${utenteId}/bloqueadas`, {
      method: 'GET',
    }),

  obterPorFuncionario: (funcionarioId: number) =>
    apiRequest<MarcacaoResponse[]>(`/api/marcacoes/funcionario/${funcionarioId}`, {
      method: 'GET',
    }),

  obterPorId: (id: number) =>
    apiRequest<MarcacaoResponse>(`/api/marcacoes/${id}`, {
      method: 'GET',
    }),

  obterTodas: () =>
    apiRequest<MarcacaoResponse[]>('/api/marcacoes', {
      method: 'GET',
    }),

  // Atualizar estado da marcação
  atualizarEstado: (marcacaoId: number, novoEstado: string, funcionarioId: number) =>
    apiRequest<MarcacaoResponse>(`/api/marcacoes/${marcacaoId}/estado`, {
      method: 'PUT',
      body: JSON.stringify({
        novoEstado,
        funcionarioId,
      }),
    }),

  // Contar marcações de hoje
  contarHoje: () =>
    apiRequest<number>('/api/marcacoes/count/hoje', {
      method: 'GET',
    }),
};

// ===================
// Utilizadores API
// ===================

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
};

// Export API base URL for other uses
export { API_BASE_URL };
