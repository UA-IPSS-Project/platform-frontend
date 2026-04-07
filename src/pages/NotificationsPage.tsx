import { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { ArrowLeftIcon, BellIcon, CheckCircleIcon, CalendarIcon, ClipboardListIcon, AlertCircleIcon } from '../components/shared/CustomIcons';
import { NotificationDetailModal } from '../components/dialogs/NotificationDetailModal';
import { NotificationWithType, NotificationActionCallbacks } from '../hooks/useNotificationAction';
import { useTranslation } from 'react-i18next';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  icon: 'calendar' | 'document' | 'alert';
  type?: string;
  metadata?: Record<string, any>;
}

import { TrashIcon } from '../components/shared/CustomIcons';

interface NotificationsPageProps {
  notifications: Notification[];
  onBack: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
  isDarkMode: boolean;
  highlightedNotificationId?: string;
  actionCallbacks?: NotificationActionCallbacks; // Callbacks para navegação
}

export function NotificationsPage({
  notifications,
  onBack,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onDeleteAll,
  isDarkMode,
  highlightedNotificationId,
  actionCallbacks,
}: NotificationsPageProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<NotificationWithType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const notificationRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Scroll e animação quando highlightedNotificationId muda
  useEffect(() => {
    if (highlightedNotificationId && notificationRefs.current[highlightedNotificationId]) {
      const element = notificationRefs.current[highlightedNotificationId];
      
      // Delay inicial para permitir a renderização da página
      setTimeout(() => {
        // Scroll suave para o elemento
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      
      // Iniciar animação após o scroll começar
      setTimeout(() => {
        setAnimatingId(highlightedNotificationId);
      }, 800);
      
      // Remover animação após 3 segundos
      setTimeout(() => {
        setAnimatingId(null);
      }, 3800);
    }
  }, [highlightedNotificationId]);

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => !n.isRead);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIconComponent = (type: string) => {
    switch (type) {
      case 'calendar':
        return <CalendarIcon className="w-6 h-6" />;
      case 'document':
        return <ClipboardListIcon className="w-6 h-6" />;
      case 'alert':
        return <AlertCircleIcon className="w-6 h-6" />;
      default:
        return <BellIcon className="w-6 h-6" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now.getTime() - notifTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) {
      return t('notifications.agoMinutes', { count: diffMins });
    } else if (diffHours < 24) {
      return t('notifications.agoHours', { count: diffHours });
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return t('notifications.agoDays', { count: diffDays });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Marcar como lida
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    
    // Abrir modal com os detalhes
    setSelectedNotification(notification as NotificationWithType);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Modal de Detalhes */}
      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        actionCallbacks={actionCallbacks}
        onActionComplete={() => {
          // Callback opcional após a ação - pode ser usado para refresh de dados
        }}
      />

      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 text-foreground"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          {t('common.back')}
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t('notifications.title')}
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {t('notifications.unreadCount', { count: unreadCount })}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={onMarkAllAsRead}
                className="flex items-center gap-2"
              >
                <CheckCircleIcon className="w-4 h-4" />
                {t('notifications.markAllRead')}
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="outline"
                onClick={onDeleteAll}
                className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/40"
              >
                <TrashIcon className="w-4 h-4" />
                {t('notifications.deleteAll')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border">
        <button
          onClick={() => setFilter('all')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${filter === 'all'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          {t('notifications.filterAll', { count: notifications.length })}
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${filter === 'unread'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          {t('notifications.filterUnread', { count: unreadCount })}
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-card/80 backdrop-blur-md rounded-lg border border-border overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <BellIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">
              {filter === 'unread' ? t('notifications.noUnread') : t('notifications.none')}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification, index) => (
            <div
              key={notification.id}
              ref={(el) => {notificationRefs.current[notification.id] = el;}}
              className={`p-5 ${index !== filteredNotifications.length - 1
                ? 'border-b border-border'
                : ''
                } hover:bg-accent/60 transition-all duration-300 group ${
                !notification.isRead ? 'bg-primary/10' : ''
                } ${
                animatingId === notification.id
                  ? 'ring-4 ring-primary/60 bg-primary/20 scale-[1.02] shadow-2xl'
                  : ''
                }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex gap-4">
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer ${!notification.isRead
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground'
                    }`}
                >
                  {getIconComponent(notification.icon)}
                </div>
                <div className="flex-1 min-w-0 cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className={`font-semibold ${!notification.isRead
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                      }`}>
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <span className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {getTimeAgo(notification.timestamp)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notification.id);
                  }}
                  className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all self-center"
                  title={t('notifications.deleteOne')}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
