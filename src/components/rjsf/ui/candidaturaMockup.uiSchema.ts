import type { UiSchema } from '@rjsf/utils';

export const candidaturaMockupUiSchema = {
  applicationType: {
    'ui:widget': 'SelectWidget',
    'ui:placeholder': 'Selecione o tipo',
  },
  childName: {
    'ui:placeholder': 'Ex.: Jo\u00e3o Pedro Silva',
    'ui:autocomplete': 'name',
  },
  birthDate: {
    'ui:widget': 'date',
  },
  guardianName: {
    'ui:placeholder': 'Ex.: Ana Maria Costa',
    'ui:autocomplete': 'name',
  },
  guardianEmail: {
    'ui:placeholder': 'Ex.: encarregado@email.com',
    'ui:autocomplete': 'email',
  },
  guardianPhone: {
    'ui:placeholder': '9 d\u00edgitos',
    'ui:help': 'Formato esperado: 912345678',
  },
  guardianNif: {
    'ui:placeholder': '9 d\u00edgitos',
  },
  householdIncomeBracket: {
    'ui:widget': 'SelectWidget',
    'ui:placeholder': 'Selecione o escal\u00e3o',
  },
  hasSpecialNeeds: {
    'ui:widget': 'CheckboxWidget',
  },
  notes: {
    'ui:widget': 'TextareaWidget',
    'ui:options': {
      rows: 4,
    },
    'ui:placeholder': 'Descreva informa\u00e7\u00f5es relevantes para a candidatura',
  },
  agreeToTerms: {
    'ui:widget': 'CheckboxWidget',
  },
} satisfies UiSchema;