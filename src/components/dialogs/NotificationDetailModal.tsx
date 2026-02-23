import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { CalendarIcon, ClipboardListIcon, AlertCircleIcon, XIcon } from '../shared/CustomIcons';
import { NotificationWithType, useNotificationAction, NotificationActionCallbacks } from '../../hooks/useNotificationAction';

interface NotificationDetailModalProps {
  notification: NotificationWithType | null;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete?: () => void; // Callback opcional após executar a ação principal
  actionCallbacks?: NotificationActionCallbacks; // Callbacks para navegação
}

/**
 * Modal para exibir detalhes de uma notificação
 * 
 * Características:
 * - Mostra título, mensagem completa e data/hora formatada
 * - Botão de ação dinâmico baseado no tipo da notificação
 * - Ícone visual correspondente ao tipo
 * - Suporte a tema claro/escuro
 */
export function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
  onActionComplete,
  actionCallbacks,
}: NotificationDetailModalProps) {
  const { label, variant, execute } = useNotificationAction(notification, actionCallbacks);

  if (!notification) return null;

  const handlePrimaryAction = () => {
    execute();
    if (onActionComplete) {
      onActionComplete();
    }
    onClose();
  };

  // Só mostrar botão de ação se houver um propósito definido
  const hasAction = label && !label.includes('Ver Detalhes') && notification.type !== 'SISTEMA';

  const getIconComponent = (icon: string) => {
    switch (icon) {
      case 'calendar':
        return <CalendarIcon className="w-6 h-6" />;
      case 'document':
        return <ClipboardListIcon className="w-6 h-6" />;
      case 'alert':
        return <AlertCircleIcon className="w-6 h-6" />;
      default:
        return <AlertCircleIcon className="w-6 h-6" />;
    }
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('pt-PT', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(date);
  };

  const getIconColorClasses = (icon: string) => {
    switch (icon) {
      case 'calendar':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'document':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'alert':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          {/* Ícone e Título */}
          <div className="flex items-start gap-4 mb-2">
            <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center ${getIconColorClasses(notification.icon)}`}>
              {getIconComponent(notification.icon)}
            </div>
            <div className="flex-1 pt-1">
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {notification.title}
              </DialogTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formatDateTime(notification.timestamp)}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Mensagem da Notificação */}
        <DialogDescription className="text-base text-gray-700 dark:text-gray-300 leading-relaxed py-4 border-t border-gray-200 dark:border-gray-700">
          {notification.message}
        </DialogDescription>

        {/* Botões de Ação */}
        <DialogFooter className="flex flex-row gap-2 sm:gap-3 pt-4">
          <Button
            variant="destructive"
            onClick={onClose}
            className="flex-1 sm:flex-none"
          >
            Fechar
          </Button>
          {hasAction && (
            <Button
              variant={variant}
              onClick={handlePrimaryAction}
              className="flex-1 sm:flex-none"
            >
              {label}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
