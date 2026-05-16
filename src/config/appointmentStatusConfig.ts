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
      light: { bg: 'bg-status-info-soft', text: 'text-status-info' },
      dark: { bg: '', text: '' },
    },
    variant: 'default',
  },
  'in-progress': {
    label: 'statusBadge.inProgress',
    color: {
      light: { bg: 'bg-status-info-soft', text: 'text-status-info' },
      dark: { bg: '', text: '' },
    },
    variant: 'default',
  },
  completed: {
    label: 'statusBadge.completed',
    color: {
      light: { bg: 'bg-status-success-soft', text: 'text-status-success' },
      dark: { bg: '', text: '' },
    },
    variant: 'default',
  },
  'no-show': {
    label: 'statusBadge.noShow',
    color: {
      light: { bg: 'bg-transparent', text: 'text-status-warning' },
      dark: { bg: '', text: '' },
    },
    variant: 'outline',
    icon: 'none',
  },
  cancelled: {
    label: 'statusBadge.cancelled',
    color: {
      light: { bg: 'bg-transparent', text: 'text-status-error' },
      dark: { bg: '', text: '' },
    },
    variant: 'outline',
  },
  warning: {
    label: 'statusBadge.warning',
    color: {
      light: { bg: 'bg-transparent', text: 'text-status-warning' },
      dark: { bg: '', text: '' },
    },
    variant: 'outline',
    icon: 'alert',
  },
  reserved: {
    label: 'statusBadge.reserved',
    color: {
      light: { bg: 'bg-status-neutral-soft', text: 'text-status-neutral' },
      dark: { bg: '', text: '' },
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
    return `${config.color.light.bg} ${config.color.dark.bg}`.trim();
  }

  static buildTextClass(status: AppointmentStatusType): string {
    const config = getStatusConfig(status);
    return `${config.color.light.text} ${config.color.dark.text}`.trim();
  }

  static buildFullClass(status: AppointmentStatusType): string {
    const bg = this.buildBgClass(status);
    const text = this.buildTextClass(status);
    return `${bg} ${text}`;
  }

  /**
   * Constrói a classe com bordas para variante 'outline'
   */
  static buildBorderClass(status: AppointmentStatusType): string {
    const statusToColor = {
      'no-show': 'border-status-warning/60',
      cancelled: 'border-status-error/60',
      warning: 'border-status-warning/60',
    } as const;

    return statusToColor[status as keyof typeof statusToColor] || 'border-status-neutral/60';
  }
}
