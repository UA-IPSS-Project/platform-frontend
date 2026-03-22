/**
 * Hook centralizado para lógica de status de marcações
 * Fornece acesso consistente a labels, cores e estilos em toda a aplicação
 */

import { useTranslation } from 'react-i18next';
import { Appointment } from '../types';
import { getStatusConfig, AppointmentStatusType, StatusStyleBuilder } from '../config/appointmentStatusConfig';

interface UseAppointmentStatusReturn {
  /**
   * Obtém o label traduzido para um status
   */
  getStatusLabel: (status: AppointmentStatusType) => string;

  /**
   * Obtém a chave i18n completa para um status
   */
  getStatusI18nKey: (status: AppointmentStatusType) => string;

  /**
   * Obtém as classes Tailwind para background + text
   */
  getStatusClasses: (status: AppointmentStatusType) => string;

  /**
   * Verifica se um status é uma variante 'outline'
   */
  isOutlineVariant: (status: AppointmentStatusType) => boolean;

  /**
   * Obtém as classes de borda para status outline
   */
  getBorderClasses: (status: AppointmentStatusType) => string;

  /**
   * Verifica se o status deve mostrar um ícone de alerta
   */
  shouldShowAlertIcon: (status: AppointmentStatusType) => boolean;
}

export function useAppointmentStatus(): UseAppointmentStatusReturn {
  const { t } = useTranslation();

  return {
    getStatusLabel: (status: AppointmentStatusType) => {
      const config = getStatusConfig(status);
      return t(config.label);
    },

    getStatusI18nKey: (status: AppointmentStatusType) => {
      const config = getStatusConfig(status);
      return config.label;
    },

    getStatusClasses: (status: AppointmentStatusType) => {
      return StatusStyleBuilder.buildFullClass(status);
    },

    isOutlineVariant: (status: AppointmentStatusType) => {
      const config = getStatusConfig(status);
      return config.variant === 'outline';
    },

    getBorderClasses: (status: AppointmentStatusType) => {
      return StatusStyleBuilder.buildBorderClass(status);
    },

    shouldShowAlertIcon: (status: AppointmentStatusType) => {
      const config = getStatusConfig(status);
      return config.icon === 'alert';
    },
  };
}
