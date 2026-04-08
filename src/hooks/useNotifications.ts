import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { notificationsApi, Notificacao } from '../services/api';
import { toast } from 'sonner';

export function useNotifications(userEmail: string | undefined, onRefreshNeeded?: () => void) {
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

        const isOneDayReminder = notificacao.tipo === 'LEMBRETE'
            && notificacao.metadata?.notificationSubtype === 'REMINDER_1_DAY';

        // Play notification sound
        const soundEnabled = localStorage.getItem('notifications_sound') !== 'false';
        if (soundEnabled) {
            try {
                const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
                if (AudioContextClass) {
                    const audioCtx = new AudioContextClass();
                    const oscillator = audioCtx.createOscillator();
                    const gainNode = audioCtx.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioCtx.destination);

                    oscillator.type = 'sine';
                    // Pleasant high-pitched "ding" (A5 followed by C6-like frequency)
                    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.1);

                    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.02);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

                    oscillator.start(audioCtx.currentTime);
                    oscillator.stop(audioCtx.currentTime + 0.3);
                    
                    // Close context after playing
                    setTimeout(() => {
                        if (audioCtx.state !== 'closed') audioCtx.close();
                    }, 400);
                }
            } catch (error) {
                console.warn('Could not play notification sound:', error);
            }
        }

        toast.info(
            isOneDayReminder ? 'Lembrete de Marcação' : notificacao.titulo,
            {
                description: isOneDayReminder
                    ? `Tem uma marcação em 1 dia. ${notificacao.mensagem}`
                    : notificacao.mensagem,
                duration: isOneDayReminder ? 7000 : 5000,
            }
        );

        // Refresh appointments after a small delay to allow backend transaction to commit
        if (onRefreshNeeded) {
            setTimeout(() => onRefreshNeeded(), 500);
        }
    }, [onRefreshNeeded]);

    // In Spring, the client should always subscribe to /user/queue/... 
    // and Spring will automatically route it using the authenticated Principal.
    const topic = userEmail ? `/user/queue/notifications` : null;
    const wsUrl = import.meta.env.VITE_WS_URL
        || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
    useWebSocket(wsUrl, topic, onNotificationReceived);

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
