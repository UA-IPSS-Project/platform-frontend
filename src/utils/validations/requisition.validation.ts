import { parseDateInput } from '../../components/ui/date-picker-field';
import i18n from '../../i18n';

export const TRANSPORTE_DESTINOS_PERMITIDOS = [
  'Visita Domiciliário',
  'Visita de Estudo',
  'Escola',
  'Centro de Saúde',
  'Hospital',
  'Segurança social',
] as const;

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
  if (!valor.trim()) return i18n.t('requisitions.errors.requiredField', { defaultValue: 'Campo obrigatório' });
  if (valor.length < 5) {
    return i18n.t('requisitions.errors.descriptionMinLength', {
      defaultValue: 'A descrição deve ter pelo menos 5 caracteres.',
    });
  }
  return undefined;
};

export const validateMaterialLinhas = (linhas: Array<{ materialId: string; quantidade: string }>): string | undefined => {
  if (linhas.length === 0) return i18n.t('requisitions.errors.addOneMaterial', { defaultValue: 'Selecione pelo menos um material.' });
  return undefined;
};

export const validateManutencaoItens = (items: Array<{ itemId: number; transporteId?: number }>): string | undefined => {
  if (items.length === 0) return i18n.t('requisitions.errors.addOneMaintenanceItem');
  return undefined;
};

export const validateTransporteDestino = (valor: string): string | undefined => {
  const normalized = valor.trim();
  if (!normalized) return i18n.t('requisitions.errors.requiredField');
  return undefined;
};

export const validateQuilometros = (valor: string | number): string | undefined => {
  const valStr = String(valor ?? '').trim();
  if (!valStr) return i18n.t('requisitions.errors.requiredField');

  const normalized = valStr.replace(',', '.');

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return i18n.t('requisitions.errors.invalidKilometers', {
      defaultValue: 'Os quilómetros devem ser um número positivo.',
    });
  }

  const km = Number(normalized);
  if (Number.isNaN(km) || km <= 0) {
    return i18n.t('requisitions.errors.invalidKilometers', {
      defaultValue: 'Os quilómetros devem ser um número positivo.',
    });
  }

  return undefined;
};

export const validateCondutor = (condutor: string): string | undefined => {
  if (!condutor.trim()) return i18n.t('requisitions.errors.requiredField');
  return undefined;
};

export const validateNumeroPassageiros = (valor: string | number): string | undefined => {
  const valStr = String(valor).trim();
  if (!valStr && valStr !== '0') return i18n.t('requisitions.errors.requiredField');
  const num = Number(valStr);
  if (isNaN(num) || num < 0) return i18n.t('requisitions.errors.invalidPassengers');
  return undefined;
};

export const validateTransporteIds = (selectedIds: string[]): string | undefined => {
  if (selectedIds.length === 0) return i18n.t('requisitions.errors.selectOneVehicle');
  return undefined;
};

/**
 * Date/Time Utils
 */
export const isDateInPast = (dateInput?: string): boolean => {
  const parsed = parseDateInput(dateInput);
  if (!parsed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed < today;
};

export const validateDataPassada = (dataInput?: string): string | undefined => {
  if (!dataInput) return i18n.t('requisitions.errors.requiredField');
  if (isDateInPast(dataInput)) return i18n.t('requisitions.errors.dateCannotBePast');
  return undefined;
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

export const validateCruzamentoDatas = (dataSaida?: string, horaSaida?: string, dataRegresso?: string, horaRegresso?: string): string | undefined => {
  const saidaStr = composeDateTimeStr(dataSaida, horaSaida);
  const regressoStr = composeDateTimeStr(dataRegresso, horaRegresso);
  
  if (saidaStr && regressoStr && new Date(regressoStr) <= new Date(saidaStr)) {
    return i18n.t('requisitions.errors.returnAfterDeparture');
  }
  return undefined;
};
