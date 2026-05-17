export function buildUploadFileName(file: File, formName: string, nif: string, fieldName?: string): File {
  const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
  const sanitize = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  const parts = ['Candidatura', sanitize(formName) || 'Form', nif || 'NIF', sanitize(fieldName ?? '') || 'Documento'];
  return new File([file], parts.join('_') + ext, { type: file.type });
}
