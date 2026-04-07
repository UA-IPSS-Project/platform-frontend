import type { RJSFSchema } from '@rjsf/utils';

export const candidaturaMockupSchema = {
  type: 'object',
  // O que é obrigatório
  required: ['applicationType', 'childName', 'birthDate', 'guardianName', 'guardianEmail', 'agreeToTerms'],
  // Diferentes campos, dizendo o seu tipo, título e outros atributos
  properties: {
    childName: {
      type: 'string',
      title: 'Nome da criança do utente',
      minLength: 3,
    },
    birthDate: {
      type: 'string',
      title: 'Data de nascimento',
      format: 'date',
    },
    guardianName: {
      type: 'string',
      title: 'Nome do encarregado de educação',
      minLength: 3,
    },
    guardianEmail: {
      type: 'string',
      title: 'Email do encarregado de educação',
      format: 'email',
    },
    guardianPhone: {
      type: 'string',
      title: 'Contacto do encarregado de educação',
      pattern: '^\\d{9}$',
    },
    guardianNif: {
      type: 'string',
      title: 'NIF do encarregado de educação',
      pattern: '^\\d{9}$',
    },
    agreeToTerms: {
      type: 'boolean',
      title: 'Aceito os termos de utilização',
      default: false,
    },
  },
} satisfies RJSFSchema;