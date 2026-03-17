export const SUBJECTS = [
  'Pagar mensalidade',
  'Entregar documentos',
  'Reunião presencial',
  'Outro',
];

const SUBJECT_TRANSLATION_KEYS: Record<string, string> = {
  'Pagar mensalidade': 'appointmentDialog.subjects.payMonthlyFee',
  'Pay monthly fee': 'appointmentDialog.subjects.payMonthlyFee',
  'Entregar documentos': 'appointmentDialog.subjects.submitDocuments',
  'Submit documents': 'appointmentDialog.subjects.submitDocuments',
  'Reunião presencial': 'appointmentDialog.subjects.inPersonMeeting',
  'In-person meeting': 'appointmentDialog.subjects.inPersonMeeting',
  'Outro': 'appointmentDialog.subjects.other',
  'Other': 'appointmentDialog.subjects.other',
};

export const getSubjectLabel = (
  subject: string,
  t: (key: string, options?: Record<string, unknown>) => string,
) => {
  const labelKey = SUBJECT_TRANSLATION_KEYS[subject];
  if (!labelKey) return subject;
  return t(labelKey, { defaultValue: subject });
};

export default SUBJECTS;
