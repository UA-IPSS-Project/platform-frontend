import type { UiSchema } from '@rjsf/utils';

export const candidaturaMockupUiSchema = {
  childName: {
    'ui:placeholder': 'Ex.: João Pedro Silva',
    'ui:autocomplete': 'name',
  },
  birthDate: {
    'ui:widget': 'DateWidget',
  },
  guardianName: {
    'ui:placeholder': 'Ex.: Ana Maria Costa',
    'ui:autocomplete': 'name',
  },
  guardianEmail: {
    'ui:widget': 'EmailWidget',
    'ui:placeholder': 'Ex.: encarregado@email.com',
    'ui:autocomplete': 'email',
  },
  guardianPhone: {
    'ui:placeholder': 'Ex.: 912345678',
  },
  guardianNif: {
    'ui:placeholder': '',
  },
  agreeToTerms: {
    'ui:widget': 'CheckboxWidget',
  },
} satisfies UiSchema;