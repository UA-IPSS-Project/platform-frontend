import type { CandidaturaResponse, FormularioResponse } from '../../services/api';

type CandidaturaMockSeed = {
  id: string;
  formId: string;
  estado: CandidaturaResponse['estado'];
  criadoEm: string;
  criadoPor?: number;
  respostas: Record<string, unknown>;
};

const mockFormularioBase = (id: string, name: string): FormularioResponse => ({
  id,
  name,
  schema: {
    type: 'object',
    properties: {
      childName: { type: 'string', title: 'Nome da criança do utente' },
      birthDate: { type: 'string', title: 'Data de nascimento', format: 'date' },
      guardianName: { type: 'string', title: 'Nome do encarregado de educação' },
      guardianEmail: { type: 'string', title: 'Email do encarregado de educação', format: 'email' },
      guardianPhone: { type: 'string', title: 'Contacto do encarregado de educação' },
      guardianNif: { type: 'string', title: 'NIF do encarregado de educação' },
      agreeToTerms: { type: 'boolean', title: 'Aceito os termos de utilização' },
    },
    required: ['childName', 'birthDate', 'guardianName', 'guardianEmail', 'agreeToTerms'],
  },
  uiSchema: {
    childName: { 'ui:placeholder': 'Ex.: João Pedro Silva' },
    birthDate: { 'ui:widget': 'DateWidget' },
    guardianName: { 'ui:placeholder': 'Ex.: Ana Maria Costa' },
    guardianEmail: { 'ui:widget': 'EmailWidget', 'ui:placeholder': 'Ex.: encarregado@email.com' },
    guardianPhone: { 'ui:placeholder': 'Ex.: 912345678' },
    guardianNif: { 'ui:placeholder': '9 dígitos' },
    agreeToTerms: { 'ui:widget': 'CheckboxWidget' },
  },
});

const createMockCandidatura = (seed: CandidaturaMockSeed, criadoPor: number): CandidaturaResponse => ({
  id: seed.id,
  formId: seed.formId,
  estado: seed.estado,
  criadoPor,
  criadoEm: seed.criadoEm,
  respostas: seed.respostas,
});

const mockStateByType: Record<string, { form: FormularioResponse; candidaturas: CandidaturaMockSeed[] }> = {
  CRECHE: {
    form: mockFormularioBase('mock-creche-form', 'Candidatura - Creche'),
    candidaturas: [
      {
        id: 'mock-creche-1',
        formId: 'mock-creche-form',
        estado: 'PENDENTE',
        criadoEm: '2026-03-28T10:15:00.000Z',
        respostas: {
          childName: 'Leonor Silva',
          birthDate: '2022-11-04',
          guardianName: 'Ana Maria Costa',
          guardianEmail: 'ana.costa@example.com',
          guardianPhone: '912345678',
          guardianNif: '123456789',
          agreeToTerms: true,
        },
      },
      {
        id: 'mock-creche-2',
        formId: 'mock-creche-form',
        estado: 'APROVADA',
        criadoEm: '2026-02-14T15:30:00.000Z',
        respostas: {
          childName: 'Tomás Pereira',
          birthDate: '2021-08-19',
          guardianName: 'João Pereira',
          guardianEmail: 'joao.pereira@example.com',
          guardianPhone: '987654321',
          guardianNif: '987654321',
          agreeToTerms: true,
        },
      },
    ],
  },
  CATL: {
    form: mockFormularioBase('mock-catl-form', 'Candidatura - CATL'),
    candidaturas: [
      {
        id: 'mock-catl-1',
        formId: 'mock-catl-form',
        estado: 'REJEITADA',
        criadoEm: '2026-03-03T09:00:00.000Z',
        respostas: {
          childName: 'Beatriz Rocha',
          birthDate: '2019-05-22',
          guardianName: 'Marta Rocha',
          guardianEmail: 'marta.rocha@example.com',
          guardianPhone: '934567890',
          guardianNif: '234567890',
          agreeToTerms: true,
        },
      },
    ],
  },
  ERPI: {
    form: mockFormularioBase('mock-erpi-form', 'Candidatura - ERPI'),
    candidaturas: [
      {
        id: 'mock-erpi-1',
        formId: 'mock-erpi-form',
        estado: 'PENDENTE',
        criadoEm: '2026-04-01T12:20:00.000Z',
        respostas: {
          childName: 'Rita Almeida',
          birthDate: '2020-01-11',
          guardianName: 'Carlos Almeida',
          guardianEmail: 'carlos.almeida@example.com',
          guardianPhone: '923456789',
          guardianNif: '345678901',
          agreeToTerms: true,
        },
      },
    ],
  },
  ESCOLA: {
    form: mockFormularioBase('mock-escola-form', 'Candidatura - Escola'),
    candidaturas: [
      {
        id: 'mock-escola-1',
        formId: 'mock-escola-form',
        estado: 'REJEITADA',
        criadoEm: '2026-03-03T09:00:00.000Z',
        respostas: {
          childName: 'Beatriz Rocha',
          birthDate: '2019-05-22',
          guardianName: 'Marta Rocha',
          guardianEmail: 'marta.rocha@example.com',
          guardianPhone: '934567890',
          guardianNif: '234567890',
          agreeToTerms: true,
        },
      },
    ],
  },
  BALNEARIO: {
    form: mockFormularioBase('mock-balneario-form', 'Candidatura - Balneário'),
    candidaturas: [
      {
        id: 'mock-balneario-1',
        formId: 'mock-balneario-form',
        estado: 'PENDENTE',
        criadoEm: '2026-04-01T12:20:00.000Z',
        respostas: {
          childName: 'Rita Almeida',
          birthDate: '2020-01-11',
          guardianName: 'Carlos Almeida',
          guardianEmail: 'carlos.almeida@example.com',
          guardianPhone: '923456789',
          guardianNif: '345678901',
          agreeToTerms: true,
        },
      },
    ],
  },
  INTERNO: {
    form: mockFormularioBase('mock-interno-form', 'Candidatura - Interno'),
    candidaturas: [
      {
        id: 'mock-interno-1',
        formId: 'mock-interno-form',
        estado: 'APROVADA',
        criadoEm: '2026-01-18T08:45:00.000Z',
        respostas: {
          childName: 'Guilherme Santos',
          birthDate: '2022-03-08',
          guardianName: 'Sofia Santos',
          guardianEmail: 'sofia.santos@example.com',
          guardianPhone: '913579246',
          guardianNif: '456789012',
          agreeToTerms: true,
        },
      },
    ],
  },
};

export const getMockCandidaturasForType = (candidaturaType: string, currentUserId?: number): CandidaturaResponse[] => {
  const typeKey = candidaturaType.trim().toUpperCase();
  const entry = mockStateByType[typeKey];

  if (!entry) {
    return [];
  }

  return entry.candidaturas.map((seed) => createMockCandidatura(seed, currentUserId ?? 0));
};

export const getMockFormularioForType = (candidaturaType: string): FormularioResponse | null => {
  const typeKey = candidaturaType.trim().toUpperCase();
  return mockStateByType[typeKey]?.form ?? null;
};

export const getMockCandidaturaById = (candidaturaId: string): CandidaturaResponse | null => {
  for (const entry of Object.values(mockStateByType)) {
    const found = entry.candidaturas.find((item) => item.id === candidaturaId);
    if (found) {
      return createMockCandidatura(found, found.criadoPor ?? 0);
    }
  }

  return null;
};

export const getMockFormularioById = (formId: string): FormularioResponse | null => {
  for (const entry of Object.values(mockStateByType)) {
    if (entry.form.id === formId) {
      return entry.form;
    }
  }

  return null;
};

export const updateMockCandidatura = (
  candidaturaId: string,
  updates: Partial<Pick<CandidaturaResponse, 'estado' | 'respostas' | 'formId'>>,
): CandidaturaResponse | null => {
  for (const entry of Object.values(mockStateByType)) {
    const index = entry.candidaturas.findIndex((item) => item.id === candidaturaId);
    if (index === -1) {
      continue;
    }

    entry.candidaturas[index] = {
      ...entry.candidaturas[index],
      ...updates,
    };

    return createMockCandidatura(entry.candidaturas[index], entry.candidaturas[index].criadoPor ?? 0);
  }

  return null;
};

export const createMockCandidaturaForType = (
  candidaturaType: string,
  respostas: Record<string, unknown>,
  criadoPor?: number,
): CandidaturaResponse | null => {
  const typeKey = candidaturaType.trim().toUpperCase();
  const entry = mockStateByType[typeKey];

  if (!entry) {
    return null;
  }

  const newId = `mock-${typeKey.toLowerCase()}-${entry.candidaturas.length + 1}`;
  const nextSeed: CandidaturaMockSeed = {
    id: newId,
    formId: entry.form.id,
    estado: 'PENDENTE',
    criadoEm: new Date().toISOString(),
    criadoPor,
    respostas,
  };

  entry.candidaturas.unshift(nextSeed);
  return createMockCandidatura(nextSeed, criadoPor ?? 0);
};