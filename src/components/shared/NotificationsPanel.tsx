import { BellIcon, CalendarIcon, ClipboardListIcon, AlertCircleIcon, TrashIcon } from './CustomIcons';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  icon: 'calendar' | 'document' | 'alert';
}

interface NotificationsPanelProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
  onClose: () => void;
  onNavigateToPage?: () => void;
  onNotificationClick?: (id: string) => void;
  isDarkMode?: boolean;
}



export function NotificationsPanel({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onDeleteAll,
  onClose,
  onNavigateToPage,
  onNotificationClick,
  isDarkMode = false
}: NotificationsPanelProps) {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIconComponent = (type: string) => {
    switch (type) {
      case 'calendar':
        return <CalendarIcon className="w-4 h-4" />;
      case 'document':
        return <ClipboardListIcon className="w-4 h-4" />;
      case 'alert':
        return <AlertCircleIcon className="w-4 h-4" />;
      default:
        return <BellIcon className="w-4 h-4" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now.getTime() - notifTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) {
      return `Há ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="fixed top-20 right-6 w-80 bg-card/95 backdrop-blur-xl rounded-lg shadow-2xl border border-border z-[9999] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">
            Notificações
          </h3>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-primary hover:text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors"
              >
                Marcar lidas
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onDeleteAll}
                className="text-xs text-status-error hover:text-status-error hover:bg-status-error-soft px-2 py-1 rounded transition-colors"
                title="Eliminar todas"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-80">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <BellIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sem notificações</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-border/70 hover:bg-accent transition-colors cursor-pointer ${!notification.isRead ? 'bg-primary/10' : ''
                  }`}
                onClick={() => {
                  onMarkAsRead(notification.id);
                  if (onNotificationClick) {
                    onNotificationClick(notification.id);
                    onClose();
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${!notification.isRead
                    ? 'bg-primary/15'
                    : 'bg-muted'
                    }`}>
                    <div className={!notification.isRead ? 'text-primary' : 'text-muted-foreground'}>
                      {getIconComponent(notification.icon)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${!notification.isRead
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground'
                      }`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground/80 mt-0.5">
                      {getTimeAgo(notification.timestamp)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    // Reintroduzido mt-2 para alinhar visualmente com o texto do título/hora
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(notification.id);
                    }}
                    className="text-status-error hover:text-status-error/90 hover:bg-status-error-soft p-1 rounded transition-colors"
                    aria-label="Eliminar notificação"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-border text-center">
            <button
              onClick={() => {
                onClose();
                onNavigateToPage?.();
              }}
              className="text-sm text-primary hover:text-primary/90 font-medium"
            >
              Ver todas as notificações
            </button>
          </div>
        )}
      </div>
    </div>
  );
}