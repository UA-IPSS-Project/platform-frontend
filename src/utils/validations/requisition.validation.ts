import { parseDateInput } from '../../components/ui/date-picker-field';

export const MATERIAL_QUANTITY_MIN = 1;
export const MATERIAL_QUANTITY_MAX = 200;

/**
 * Validates and normalizes quantity input.
 */
export const validateMaterialQuantity = (value: string): string => {
  const digitsOnly = value.replace(/\D/g, '');
  if (digitsOnly === '') return '';
  const numValue = parseInt(digitsOnly, 10);
  if (numValue > MATERIAL_QUANTITY_MAX) return String(MATERIAL_QUANTITY_MAX);
  return String(numValue);
};

/**
 * Ensures value is at least 1 when editing is finished.
 */
export const finalizeMaterialQuantity = (value: string): string => {
  const digitsOnly = value.replace(/\D/g, '');
  if (digitsOnly === '' || parseInt(digitsOnly, 10) < MATERIAL_QUANTITY_MIN) {
    return String(MATERIAL_QUANTITY_MIN);
  }
  return digitsOnly;
};

/**
 * Common Requisition Field Validations
 */
export const validateDescricao = (valor: string): string | undefined => {
  if (!valor.trim()) return 'A descrição é obrigatória.';
  if (valor.length < 5) return 'A descrição deve ter pelo menos 5 caracteres.';
  return undefined;
};

export const validateMaterialLinhas = (linhas: Array<{ materialId: string; quantidade: string }>): string | undefined => {
  if (linhas.length === 0) return 'Selecione pelo menos um material.';
  return undefined;
};

export const validateTransporteDestino = (valor: string): string | undefined => {
  if (!valor.trim()) return 'O destino é obrigatório.';
  return undefined;
};

/**
 * Date/Time Utils moved for central validation logic
 */
export const isDateInPast = (dateInput?: string): boolean => {
  const parsed = parseDateInput(dateInput);
  if (!parsed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed < today;
};

export const composeDateTimeStr = (date?: string, time?: string): string | undefined => {
  if (!date || !time) return undefined;
  const parsedDate = parseDateInput(date);
  if (!parsedDate) return undefined;

  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return undefined;

  const normalized = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), hours, minutes, 0, 0);
  return normalized.toISOString().split('.')[0].slice(0, 16); // YYYY-MM-DDTHH:mm
};
