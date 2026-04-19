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
        try {
            const data = await notificationsApi.listar();
            setNotifications(data);
            setUnreadCount(data.filter((n: Notificacao) => !n.lida).length);
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
        }
    }, []);

    const onNotificationReceived = useCallback((payload: any) => {
        console.log('[Notifications] Received payload:', payload);
        
        if (!payload) return;

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
                id: data.id || Math.random(),
                utilizadorId: data.utilizadorId || 0,
                titulo: data.titulo || data.title || t('notifications.new_notification', 'Nova Notificação'),
                mensagem: data.mensagem || data.message || '',
                tipo: data.tipo || 'SISTEMA',
                lida: !!data.lida,
                dataCriacao: data.dataCriacao || new Date().toISOString(),
                metadata: data.metadata || {}
            };

            console.log('[Notifications] Normalized:', normalized);

            setNotifications(prev => [normalized, ...prev]);
            setUnreadCount(prev => prev + 1);

            const isOneDayReminder = normalized.tipo === 'LEMBRETE'
                && normalized.metadata?.notificationSubtype === 'REMINDER_1_DAY';

            // Usar toast.success para ser mais visível (verde) e garantir que aparece
            console.log('[Notifications] Displaying toast for:', normalized.titulo);
            toast.success(
                isOneDayReminder ? t('dashboard.admin.messages.appointmentReminder', 'Lembrete de Marcação') : normalized.titulo,
                {
                    description: isOneDayReminder
                        ? t('dashboard.admin.messages.appointmentReminderDesc', { count: 1, defaultValue: `Tem uma marcação em 1 dia. ${normalized.mensagem}` })
                        : normalized.mensagem,
                    duration: 10000, // Aumentado para 10s para facilitar o teste
                }
            );

            // Tocar som (silenciosamente falha se o áudio estiver bloqueado)
            playNotificationSound().catch(() => {});
        });

        if (onRefreshNeeded) {
            setTimeout(() => onRefreshNeeded(), 500);
        }
    }, [onRefreshNeeded, t]);

    const topic = useMemo(() => userEmail ? `/user/queue/notifications` : null, [userEmail]);
    const wsUrl = useMemo(() => import.meta.env.VITE_NOTIFICACOES_WS_URL
        || import.meta.env.VITE_WS_URL
        || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws-notificacoes`, []);
    
    useWebSocket(wsUrl, topic, onNotificationReceived);

    useEffect(() => {
        // Notificação de teste para confirmar que o Toaster está a funcionar
        if (userEmail) {
            console.log('[Notifications] Hook initialized for:', userEmail);
            toast.info('Sistema de notificações ligado', { 
                description: 'Irá receber alertas em tempo real.',
                duration: 3000 
            });
        }
        carregarNotificacoes();
    }, [carregarNotificacoes, userEmail]);

    const handleMarkAsRead = async (id: number) => {
        try {
            await notificationsApi.marcarComoLida(id);
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, lida: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Erro ao marcar notificação como lida:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsApi.marcarTodasComoLidas();
            setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Erro ao marcar todas notificações como lidas:', error);
        }
    };

    const handleDeleteNotification = async (id: number) => {
        try {
            await notificationsApi.eliminar(id);
            setNotifications(prev => {
                const notif = prev.find(n => n.id === id);
                if (notif && !notif.lida) {
                    setUnreadCount(count => Math.max(0, count - 1));
                }
                return prev.filter(n => n.id !== id);
            });
        } catch (error) {
            console.error('Erro ao eliminar notificação:', error);
        }
    };

    const handleDeleteAllNotifications = async () => {
        try {
            await notificationsApi.eliminarTodas();
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error('Erro ao eliminar todas as notificações:', error);
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
