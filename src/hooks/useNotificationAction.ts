import { useMemo } from 'react';

export interface NotificationWithType {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  icon: 'calendar' | 'document' | 'alert';
  type?: string; // Ex: 'LEMBRETE', 'CANCELAMENTO', 'FICHEIRO', 'SISTEMA'
  metadata?: Record<string, any>; // Dados adicionais (appointmentId, documentId, etc.)
}

export interface NotificationAction {
  label: string;
  variant: 'default' | 'outline' | 'destructive';
  execute: () => void;
}

export interface NotificationActionCallbacks {
  onNavigateToAppointment?: (appointmentId: string) => void;
  onNavigateToDocument?: (documentId: string) => void;
  onNavigateToHistory?: (appointmentId: string) => void;
  onNavigateToCancelledSlot?: (date: string, time: string) => void;
}

/**
 * Hook centralizado para determinar a ação de cada tipo de notificação
 * 
 * @param notification - A notificação para a qual queremos determinar a ação
 * @param callbacks - Funções de callback para navegação
 * @returns Um objeto com o label do botão e a função de ação
 * 
 * @example
 * const { label, variant, execute } = useNotificationAction(notification, {
 *   onNavigateToAppointment: (id) => { handleOpenAppointment(id); }
 * });
 * <Button variant={variant} onClick={execute}>{label}</Button>
 */
export function useNotificationAction(
  notification: NotificationWithType | null,
  callbacks?: NotificationActionCallbacks
): NotificationAction {
  return useMemo(() => {
    if (!notification?.type) {
      return {
        label: 'Fechar',
        variant: 'outline',
        execute: () => console.log('Nenhuma ação definida'),
      };
    }

    // Mapa de ações baseado no tipo de notificação do backend
    switch (notification.type) {
      case 'LEMBRETE':
        // Notificação de marcação criada: abrir calendário no slot da marcação.
        if (notification.metadata?.notificationSubtype === 'CREATED') {
          return {
            label: 'Ver no Calendário',
            variant: 'default',
            execute: () => {
              const createdDate = notification.metadata?.createdDate;
              const createdTime = notification.metadata?.createdTime;

              if (createdDate && createdTime && callbacks?.onNavigateToCancelledSlot) {
                callbacks.onNavigateToCancelledSlot(createdDate, createdTime);
                return;
              }

              // Fallback para abrir detalhe da marcação quando metadata de slot não existe.
              const appointmentId = notification.metadata?.appointmentId;
              if (appointmentId && callbacks?.onNavigateToAppointment) {
                callbacks.onNavigateToAppointment(appointmentId);
              } else {
                console.log('TODO: Abrir calendário para marcação criada:', { createdDate, createdTime, appointmentId });
              }
            },
          };
        }

        return {
          label: 'Ver Marcação',
          variant: 'default',
          execute: () => {
            const appointmentId = notification.metadata?.appointmentId;
            if (appointmentId && callbacks?.onNavigateToAppointment) {
              callbacks.onNavigateToAppointment(appointmentId);
            } else {
              console.log('TODO: Abrir marcação específica com ID:', appointmentId);
            }
          },
        };

      case 'CANCELAMENTO':
        return {
          label: 'Ver Histórico',
          variant: 'default',
          execute: () => {
            if (callbacks?.onNavigateToHistory) {
              callbacks.onNavigateToHistory(notification.metadata?.appointmentId ?? '');
            } else {
              console.log('TODO: Redirecionar para histórico de marcações');
            }
          },
        };

      case 'FICHEIRO':
        return {
          label: 'Ver Documento',
          variant: 'default',
          execute: () => {
            const documentId = notification.metadata?.documentId;
            if (documentId && callbacks?.onNavigateToDocument) {
              callbacks.onNavigateToDocument(documentId);
            } else {
              console.log('TODO: Abrir visualizador de documento:', documentId);
            }
          },
        };

      case 'SISTEMA':
        return {
          label: 'Entendi',
          variant: 'outline',
          execute: () => {
            console.log('Alerta do sistema reconhecido');
            // Apenas fecha o modal, sem navegação
          },
        };

      // Caso genérico para tipos desconhecidos
      default:
        return {
          label: 'Ver Detalhes',
          variant: 'outline',
          execute: () => {
            console.log('Ação não mapeada para tipo:', notification.type);
            // Comportamento padrão (pode ser redirecionar para uma página genérica)
          },
        };
    }
  }, [notification, callbacks]);
}
