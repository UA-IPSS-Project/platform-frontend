import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { notificationsApi, Notificacao } from '../services/api';
import { toast } from 'sonner';

export function useNotifications(userEmail: string | undefined) {
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
    const onNotificationReceived = useCallback((notificacao: Notificacao) => {
        console.log('Nova notificação recebida via WS:', notificacao);

        setNotifications(prev => [notificacao, ...prev]);
        setUnreadCount(prev => prev + 1);

        toast(notificacao.titulo, {
            description: notificacao.mensagem,
            duration: 5000,
            action: {
                label: 'Ver',
                onClick: () => {
                    console.log('Toast Action Clicked:', notificacao.id);
                }
            }
        });
    }, []);

    const topic = userEmail ? `/user/${userEmail}/queue/notifications` : null;
    useWebSocket('ws://localhost:8080/ws', topic, onNotificationReceived);

    useEffect(() => {
        carregarNotificacoes();
    }, [carregarNotificacoes]);

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
