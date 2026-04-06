import type { RJSFSchema } from '@rjsf/utils';

export const candidaturaMockupSchema = {
  title: 'Nova Candidatura',
  description: 'Mockup para validar a estrutura do formul\u00e1rio de candidaturas em RJSF.',
  type: 'object',
  // O que é obrigatório
  required: ['applicationType', 'childName', 'birthDate', 'guardianName', 'guardianEmail', 'agreeToTerms'],
  // Diferentes campos, dizendo o seu tipo, título e outros atributos
  properties: {
    applicationType: {
      type: 'string',
      title: 'Tipo de candidatura',
      enum: ['CRECHE', 'CATL', 'ERPI'],
      enumNames: ['Creche', 'CATL', 'ERPI'],
      default: 'CRECHE',
    },
    childName: {
      type: 'string',
      title: 'Nome da crian\u00e7a/utente',
      minLength: 3,
    },
    birthDate: {
      type: 'string',
      title: 'Data de nascimento',
      format: 'date',
    },
    guardianName: {
      type: 'string',
      title: 'Nome do encarregado',
      minLength: 3,
    },
    guardianEmail: {
      type: 'string',
      title: 'Email do encarregado',
      format: 'email',
    },
    guardianPhone: {
      type: 'string',
      title: 'Contacto do encarregado',
      pattern: '^\\d{9}$',
    },
    guardianNif: {
      type: 'string',
      title: 'NIF do encarregado',
      pattern: '^\\d{9}$',
    },
    householdIncomeBracket: {
      type: 'string',
      title: 'Escal\u00e3o de rendimento',
      enum: ['A', 'B', 'C', 'D'],
      enumNames: ['Escal\u00e3o A', 'Escal\u00e3o B', 'Escal\u00e3o C', 'Escal\u00e3o D'],
    },
    hasSpecialNeeds: {
      type: 'boolean',
      title: 'Necessidades especiais',
      default: false,
    },
    notes: {
      type: 'string',
      title: 'Observa\u00e7\u00f5es',
      maxLength: 500,
    },
    agreeToTerms: {
      type: 'boolean',
      title: 'Aceito os termos de utiliza\u00e7\u00e3o',
      default: false,
    },
  },
} satisfies RJSFSchema;