/**
 * Configuração centralizada de status de marcações
 * Define mapeamento de cores, estilos e labels para todos os estados
 */

import { Appointment } from '../types';

export type AppointmentStatusType = Appointment['status'];

export interface StatusConfig {
  label: string; // Chave i18n relativa a statusBadge.{status}
  color: {
    light: {
      bg: string;
      text: string;
    };
    dark: {
      bg: string;
      text: string;
    };
  };
  variant?: 'default' | 'outline';
  icon?: 'alert' | 'none';
}

/**
 * Mapa de configuração para cada estado de marcação
 * Garante consistência visual em toda a aplicação
 */
export const APPOINTMENT_STATUS_CONFIG: Record<AppointmentStatusType, StatusConfig> = {
  scheduled: {
    label: 'statusBadge.scheduled',
    color: {
      light: { bg: 'bg-pink-100', text: 'text-pink-700' },
      dark: { bg: 'dark:bg-pink-900/40', text: 'dark:text-pink-200' },
    },
    variant: 'default',
  },
  'in-progress': {
    label: 'statusBadge.inProgress',
    color: {
      light: { bg: 'bg-[#ede9fe]', text: 'text-[#5b21b6]' },
      dark: { bg: 'dark:bg-[#4c1d95]', text: 'dark:text-[#c4b5fd]' },
    },
    variant: 'default',
  },
  completed: {
    label: 'statusBadge.completed',
    color: {
      light: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
      dark: { bg: 'dark:bg-emerald-900/40', text: 'dark:text-emerald-200' },
    },
    variant: 'default',
  },
  'no-show': {
    label: 'statusBadge.noShow',
    color: {
      light: { bg: 'bg-transparent', text: 'text-amber-700' },
      dark: { bg: 'dark:bg-transparent', text: 'dark:text-amber-400' },
    },
    variant: 'outline',
    icon: 'none',
  },
  cancelled: {
    label: 'statusBadge.cancelled',
    color: {
      light: { bg: 'bg-transparent', text: 'text-red-600' },
      dark: { bg: 'dark:bg-transparent', text: 'dark:text-red-500' },
    },
    variant: 'outline',
  },
  warning: {
    label: 'statusBadge.warning',
    color: {
      light: { bg: 'bg-transparent', text: 'text-amber-700' },
      dark: { bg: 'dark:bg-transparent', text: 'dark:text-amber-400' },
    },
    variant: 'outline',
    icon: 'alert',
  },
  reserved: {
    label: 'statusBadge.reserved',
    color: {
      light: { bg: 'bg-slate-100', text: 'text-slate-700' },
      dark: { bg: 'dark:bg-slate-700', text: 'dark:text-slate-200' },
    },
    variant: 'default',
  },
};

/**
 * Lista de status válidos extraída do config
 * Mantém sincronização automática: se novos status forem adicionados ao config, aparecem aqui
 */
export const VALID_APPOINTMENT_STATUSES = Object.keys(APPOINTMENT_STATUS_CONFIG) as AppointmentStatusType[];

/**
 * Obtém a configuração de um status específico
 * NOTE: Returns config for given status, or undefined if status is invalid.
 * Callers should handle invalid status explicitly rather than defaulting silently.
 */
export function getStatusConfig(status: AppointmentStatusType): StatusConfig {
  const config = APPOINTMENT_STATUS_CONFIG[status];
  if (!config) {
    console.warn(
      `[StatusBadge] Unknown appointment status received: "${status}". ` +
      `Valid statuses are: ${Object.keys(APPOINTMENT_STATUS_CONFIG).join(', ')}. ` +
      `This may indicate a backend change or data inconsistency.`
    );
  }
  return config || APPOINTMENT_STATUS_CONFIG.scheduled;
}

/**
 * Classe utilitária para construir strings de className Tailwind para status
 */
export class StatusStyleBuilder {
  static buildBgClass(status: AppointmentStatusType): string {
    const config = getStatusConfig(status);
    return `${config.color.light.bg} ${config.color.dark.bg}`;
  }

  static buildTextClass(status: AppointmentStatusType): string {
    const config = getStatusConfig(status);
    return `${config.color.light.text} ${config.color.dark.text}`;
  }

  static buildFullClass(status: AppointmentStatusType): string {
    const config = getStatusConfig(status);
    const bg = this.buildBgClass(status);
    const text = this.buildTextClass(status);
    return `${bg} ${text}`;
  }

  /**
   * Constrói a classe com bordas para variante 'outline'
   */
  static buildBorderClass(status: AppointmentStatusType): string {
    const statusToColor = {
      'no-show': 'border-amber-300 dark:border-amber-500',
      cancelled: 'border-red-300 dark:border-red-500',
      warning: 'border-amber-300 dark:border-amber-500',
    } as const;

    return statusToColor[status as keyof typeof statusToColor] || 'border-gray-300 dark:border-gray-600';
  }
}
