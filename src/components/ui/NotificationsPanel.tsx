import { useState } from 'react';
import { Button } from '../ui/button';
import { BellIcon, XIcon, CheckCircleIcon, CalendarIcon, ClipboardListIcon, AlertCircleIcon } from '../CustomIcons';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  icon: 'calendar' | 'document' | 'alert';
}

import { TrashIcon } from '../CustomIcons';

interface NotificationsPanelProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
  onClose: () => void;
  onNavigateToPage?: () => void;
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
      <div className="fixed top-20 right-6 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-lg shadow-2xl border border-pink-100 dark:border-gray-700 z-[9999] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-pink-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">
            Notificações
          </h3>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-2 py-1 rounded transition-colors"
              >
                Marcar lidas
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onDeleteAll}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded transition-colors"
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
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <BellIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sem notificações</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-pink-50 dark:border-gray-700/50 hover:bg-pink-50/50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${!notification.isRead ? 'bg-purple-50/30 dark:bg-gray-800/50' : ''
                  }`}
                onClick={() => onMarkAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${!notification.isRead
                    ? 'bg-purple-100 dark:bg-purple-900/30'
                    : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                    <div className={!notification.isRead ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}>
                      {getIconComponent(notification.icon)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${!notification.isRead
                      ? 'font-medium text-gray-800 dark:text-gray-100'
                      : 'text-gray-600 dark:text-gray-400'
                      }`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {getTimeAgo(notification.timestamp)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    // Reintroduzido mt-2 para alinhar visualmente com o texto do título/hora
                    <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-2" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-pink-100 dark:border-gray-700 text-center">
            <button
              onClick={() => {
                onClose();
                onNavigateToPage?.();
              }}
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
            >
              Ver todas as notificações
            </button>
          </div>
        )}
      </div>
    </div>
  );
}