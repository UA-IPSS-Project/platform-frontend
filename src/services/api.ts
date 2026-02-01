// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Helper function to get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper to get cookie by name
const getCookie = (name: string): string | null => {
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
const buildHeaders = (): HeadersInit => {
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
  options: RequestInit = {},
  _requiresAuth: boolean = true // Argument kept for compatibility but unused
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
      let errorMessage = 'Ocorreu um erro ao comunicar com o servidor.';

      try {
        const text = await response.text();

        try {
          // Try to parse as JSON
          const errorData = JSON.parse(text);

          if (errorData.message) {
            errorMessage = errorData.message;

            // Handle validation errors specifically
            if (errorData.errors && typeof errorData.errors === 'object') {
              const details = Object.values(errorData.errors).join('; ');
              if (details) {
                errorMessage += `: ${details}`;
              }
            }
          }
          else if (errorData.error) {
            // Legacy/Fallback error field
            errorMessage = errorData.error;
          }
        } catch {
          // If not JSON, try to use text content if it's short
          if (text && text.length < 200) {
            errorMessage = text;
          } else {
            errorMessage = `Erro ${response.status}: Não foi possível processar a resposta do servidor.`;
          }
        }
      } catch {
        errorMessage = `Erro de conexão (${response.status})`;
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
  role: 'FUNCIONARIO' | 'UTENTE';
  active: boolean;
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

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  empty: boolean;
}

export interface MarcacaoResponse {
  id: number;
  version: number;
  data: string;
  estado: string;
  atendenteNome?: string;
  motivoCancelamento?: string;
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

  obterPassadas: (dataInicio?: string, dataFim?: string) => {
    const params = new URLSearchParams();
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<MarcacaoResponse[]>(`/api/marcacoes/passadas${query}`, {
      method: 'GET',
    });
  },

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

  obterTodas: (page = 0, size = 1000) =>
    apiRequest<Page<MarcacaoResponse>>(`/api/marcacoes?page=${page}&size=${size}`, {
      method: 'GET',
    }),

  // Atualizar estado da marcação
  // Atualizar estado da marcação
  atualizarEstado: (marcacaoId: number, novoEstado: string, funcionarioId: number, version?: number, motivoCancelamento?: string) =>
    apiRequest<MarcacaoResponse>(`/api/marcacoes/${marcacaoId}/estado`, {
      method: 'PUT',
      body: JSON.stringify({
        novoEstado,
        funcionarioId,
        version,
        motivoCancelamento,
      }),
    }),

  // Contar marcações de hoje
  contarHoje: () =>
    apiRequest<number>('/api/marcacoes/count/hoje', {
      method: 'GET',
    }),

  // Reagendar marcação (alterar data)
  reagendar: (id: number, novaDataHora: string) =>
    apiRequest<MarcacaoResponse>(`/api/marcacoes/${id}/reagendar`, {
      method: 'PUT',
      body: JSON.stringify({ novaDataHora }),
    }),

  // Reservar slot temporário
  reservarSlot: (data: { data: string; utenteId: number; criadoPorId: number }) =>
    apiRequest<{ tempId: number }>('/api/marcacoes/reservar-slot', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Libertar slot temporário
  libertarSlot: (id: number) =>
    apiRequest<void>(`/api/marcacoes/libertar-slot/${id}`, {
      method: 'DELETE',
    }),
};

// ===================
// Utilizadores API
// ===================

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

  // Obter utilizador por ID
  obterPorId: (id: number) =>
    apiRequest<UtilizadorInfo>(`/api/utilizadores/${id}`, {
      method: 'GET',
    }),

  // Atualizar utilizador
  atualizar: (id: number, data: AtualizarUtilizadorRequest) =>
    apiRequest<UtilizadorInfo>(`/api/utilizadores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  buscarPorNif: (nif: string) =>
    apiRequest<UtilizadorInfo>(`/api/utilizadores/nif/${nif}`, {
      method: 'GET',
    }),

  // Listar todos os funcionários (ativos e pendentes) -> Using the generic endpoint if it exists or special one
  // Assuming the backend has a general list endpoint, but let's using the new specific ones or the general findAll filter
  // Based on previous steps, I added `listarFuncionariosPendentes`.
  // I likely need to add `listarFuncionarios` (all) in backend or user existing.
  // Let's add the pending one first as it is confirmed.

  listarFuncionariosPendentes: () =>
    apiRequest<UtilizadorResponseDTO[]>('/api/utilizadores/funcionarios/pendentes', {
      method: 'GET',
    }),

  listarFuncionarios: () =>
    apiRequest<UtilizadorResponseDTO[]>('/api/utilizadores/funcionarios', {
      method: 'GET',
    }),

  aprovarFuncionario: (id: number) =>
    apiRequest<void>(`/api/utilizadores/${id}/aprovar`, {
      method: 'PUT',
    }),

  // Novos endpoints para Gestão da Secretaria
  searchByNifForRecovery: (nif: string) =>
    apiRequest<UtilizadorInfo>(`/api/utilizadores/recovery/search/${nif}`, {
      method: 'GET',
    }),

  createBySecretary: (data: {
    name: string;
    nif: string;
    contact: string;
    email: string;
    birthDate: string; // YYYY-MM-DD
    isEmployee: boolean;
    role?: string;
  }) =>
    apiRequest<UtilizadorInfo>('/api/utilizadores/create-by-secretary', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  recoverAccount: (data: {
    nif: string;
    updatedEmail?: string;
    updatedContact?: string;
  }) =>
    apiRequest<void>('/api/utilizadores/recover', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ===================
// Calendário API
// ===================

export interface BloqueioAgenda {
  id: number;
  data: string;
  horaInicio: string;
  horaFim: string;
  motivo: string;
}

export const calendarioApi = {
  // Verificar se um slot específico está bloqueado
  verificarSlot: (data: string, hora: string) =>
    apiRequest<boolean>(`/api/calendario/verificar-slot?data=${data}&hora=${hora}`, {
      method: 'GET',
    }),

  // Listar bloqueios de um mês
  listarBloqueios: (ano: number, mes: number) =>
    apiRequest<BloqueioAgenda[]>(`/api/calendario/bloqueios?ano=${ano}&mes=${mes}`, {
      method: 'GET',
    }),
};

// ===================
// Bloqueios API
// ===================

// Re-export BloqueioAgenda as Bloqueio type for compatibility
export type Bloqueio = BloqueioAgenda;

export const bloqueiosApi = {
  criar: async (data: { dataInicio: string; dataFim: string; horaInicio: string; horaFim: string; motivo?: string }, funcionarioId: number) => {
    // Handle date range iteration
    const start = new Date(data.dataInicio);
    const end = new Date(data.dataFim);
    const promises = [];

    // Loop through days from start to end (inclusive)
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];

      const payload = {
        data: dateStr,
        horaInicio: data.horaInicio,
        horaFim: data.horaFim,
        motivo: data.motivo || "Bloqueio Manual",
        funcionarioId: funcionarioId
      };

      promises.push(
        apiRequest('/api/calendario/bloquear', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      );

      // Next day
      current.setDate(current.getDate() + 1);
    }

    return Promise.all(promises);
  },

  listar: () =>
    apiRequest<Bloqueio[]>('/api/calendario/bloqueios', {
      method: 'GET',
    }),

  remover: (id: number) =>
    apiRequest(`/api/calendario/${id}`, {
      method: 'DELETE',
    }),
};
