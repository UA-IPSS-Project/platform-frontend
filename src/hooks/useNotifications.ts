import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWebSocket } from './useWebSocket';
import { notificationsApi, Notificacao } from '../services/api';
import { toast } from 'sonner';
import { playNotificationSound } from '../utils/notificationSound';
import { useTranslation } from 'react-i18next';

export function useNotifications(userEmail: string | undefined, onRefreshNeeded?: () => void) {
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState<Notificacao[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const carregarNotificacoes = useCallback(async () => {
        if (!userEmail) return;
        try {
            const data = await notificationsApi.listar();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.lida).length);
        } catch (error) {
            console.error('[Notifications] Error loading notifications:', error);
        }
    }, [userEmail]);

    useEffect(() => {
        carregarNotificacoes();
    }, [carregarNotificacoes]);

    const onNotificationReceived = useCallback((payload: any) => {
        const items = Array.isArray(payload) ? payload : [payload];
        
        items.forEach(notificacao => {
            let data = notificacao;
            if (typeof notificacao === 'string') {
                try {
                    data = JSON.parse(notificacao);
                } catch (e) {
                    data = { mensagem: notificacao };
                }
            }

            const normalized: Notificacao = {
                id: data.id || Date.now(),
                utilizadorId: data.utilizadorId || 0,
                titulo: data.titulo || data.title || t('notifications.new_notification', 'Nova Notificação'),
                mensagem: data.mensagem || data.message || '',
                lida: false,
                dataCriacao: data.dataCriacao || data.createdAt || new Date().toISOString(),
                tipo: (['LEMBRETE', 'CANCELAMENTO', 'FICHEIRO', 'SISTEMA'].includes(data.tipo) ? data.tipo : 'SISTEMA') as Notificacao['tipo'],
                metadata: data.metadata || {}
            };

            // 1. Play sound
            playNotificationSound().catch(err => console.error('[Notifications] Sound failed:', err));

            // 2. Display toast
            try {
                const toastTitle = normalized.tipo === 'LEMBRETE' && normalized.metadata?.notificationSubtype === 'REMINDER_1_DAY'
                    ? t('dashboard.admin.messages.appointmentReminder', 'Lembrete de Marcação')
                    : normalized.titulo;
                
                const toastDesc = normalized.tipo === 'LEMBRETE' && normalized.metadata?.notificationSubtype === 'REMINDER_1_DAY'
                    ? t('dashboard.admin.messages.appointmentReminderDesc', { count: 1, defaultValue: `Tem uma marcação em 1 dia. ${normalized.mensagem}` })
                    : normalized.mensagem;

                toast.info(toastTitle, {
                    description: toastDesc,
                    duration: 8000,
                });
            } catch (err) {
                console.error('[Notifications] Toast failed:', err);
            }

            // 3. Update local state
            setNotifications(prev => {
                if (prev.some(n => n.id === normalized.id)) return prev;
                return [normalized, ...prev];
            });
            setUnreadCount(prev => prev + 1);
        });

        if (onRefreshNeeded) {
            onRefreshNeeded();
        }
    }, [onRefreshNeeded, t]);

    const wsUrl = '/ws-notificacoes';
    const topic = useMemo(() => userEmail ? `/user/queue/notifications` : null, [userEmail]);

    useWebSocket(wsUrl, topic, onNotificationReceived, () => {
        console.log('[Notifications] WebSocket Connected');
    });

    const handleMarkAsRead = async (id: number) => {
        try {
            await notificationsApi.marcarComoLida(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('[Notifications] Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsApi.marcarTodasComoLidas();
            setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('[Notifications] Error marking all as read:', error);
        }
    };

    const handleDeleteNotification = async (id: number) => {
        try {
            await notificationsApi.eliminar(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            const wasUnread = notifications.find(n => n.id === id && !n.lida);
            if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('[Notifications] Error deleting notification:', error);
        }
    };

    const handleDeleteAllNotifications = async () => {
        try {
            await notificationsApi.eliminarTodas();
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error('[Notifications] Error deleting all notifications:', error);
        }
    };

    return {
        notifications,
        unreadCount,
        carregarNotificacoes,
        handleMarkAsRead,
        handleMarkAllAsRead,
        handleDeleteNotification,
        handleDeleteAllNotifications
    };
}
