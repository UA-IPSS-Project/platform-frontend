import { useState } from 'react';
import { Button } from './ui/button';
import { ArrowLeftIcon, BellIcon, CheckCircleIcon, CalendarIcon, ClipboardListIcon, AlertCircleIcon } from './CustomIcons';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  icon: 'calendar' | 'document' | 'alert';
}

interface NotificationsPageProps {
  notifications: Notification[];
  onBack: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  isDarkMode: boolean;
}

export function NotificationsPage({
  notifications,
  onBack,
  onMarkAsRead,
  onMarkAllAsRead,
  isDarkMode
}: NotificationsPageProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

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
      return `Há ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 text-gray-700 dark:text-gray-200"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Voltar
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Notificações
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {unreadCount} notificação{unreadCount !== 1 ? 'ões' : ''} não lida{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={onMarkAllAsRead}
              className="flex items-center gap-2"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setFilter('all')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${filter === 'all'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
        >
          Todas ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${filter === 'unread'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
        >
          Não lidas ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-md rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <BellIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">
              {filter === 'unread' ? 'Sem notificações não lidas' : 'Sem notificações'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification, index) => (
            <div
              key={notification.id}
              className={`p-5 ${index !== filteredNotifications.length - 1
                  ? 'border-b border-gray-200 dark:border-gray-800'
                  : ''
                } hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${!notification.isRead ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''
                }`}
              onClick={() => onMarkAsRead(notification.id)}
            >
              <div className="flex gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${!notification.isRead
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                  {getIconComponent(notification.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className={`font-semibold ${!notification.isRead
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-700 dark:text-gray-300'
                      }`}>
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <span className="w-2.5 h-2.5 bg-purple-600 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    {getTimeAgo(notification.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
