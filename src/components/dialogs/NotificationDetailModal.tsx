import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { CalendarIcon, ClipboardListIcon, AlertCircleIcon } from '../shared/CustomIcons';
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
        return 'bg-[color:var(--status-info-soft)] text-[color:var(--status-info)]';
      case 'document':
        return 'bg-[color:var(--status-success-soft)] text-[color:var(--status-success)]';
      case 'alert':
        return 'bg-[color:var(--status-error-soft)] text-[color:var(--status-error)]';
      default:
        return 'bg-[color:var(--status-neutral-soft)] text-[color:var(--status-neutral)]';
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
              <DialogTitle className="text-xl font-semibold text-foreground">
                {notification.title}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDateTime(notification.timestamp)}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Mensagem da Notificação */}
        <DialogDescription className="text-base text-foreground leading-relaxed py-4 border-t border-border">
          {notification.message}
        </DialogDescription>

        {/* Botões de Ação */}
        <DialogFooter className="flex flex-row gap-2 sm:gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 sm:flex-none"
          >
            Voltar
          </Button>
          {hasAction && label !== 'Fechar' && (
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
