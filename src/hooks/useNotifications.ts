import { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { notificationsApi, Notificacao } from '../services/api';
import { toast } from 'sonner';

export function useNotifications(userEmail: string | undefined) {
    const [notifications, setNotifications] = useState<Notificacao[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const stompClient = useRef<Client | null>(null);

    const carregarNotificacoes = useCallback(async () => {
        try {
            const data = await notificationsApi.listar();
            setNotifications(data);
            setUnreadCount(data.filter((n: Notificacao) => !n.lida).length);
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
        }
    }, []);

    useEffect(() => {
        carregarNotificacoes();

        if (!userEmail) return;

        // Configuração do WebSocket
        stompClient.current = new Client({
            brokerURL: 'ws://localhost:8080/ws',
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        stompClient.current.onConnect = () => {
            console.log('Conectado ao WebSocket');

            const topic = `/user/${userEmail}/queue/notifications`;
            stompClient.current?.subscribe(topic, (message) => {
                try {
                    const notificacao: Notificacao = JSON.parse(message.body);
                    console.log('Nova notificação recebida via WS:', notificacao);

                    setNotifications(prev => [notificacao, ...prev]);
                    setUnreadCount(prev => prev + 1);

                    toast(notificacao.titulo, {
                        description: notificacao.mensagem,
                        duration: 5000,
                        action: {
                            label: 'Ver',
                            onClick: () => {
                                // Return generic action identifier handled by parent component if needed
                                console.log('Toast Action Clicked:', notificacao.id);
                            }
                        }
                    });
                } catch (error) {
                    console.error('Erro ao processar mensagem WS:', error);
                }
            });
        };

        stompClient.current.onStompError = (frame) => {
            console.error('Erro STOMP:', frame.headers['message']);
            console.error('Detalhes:', frame.body);
        };

        stompClient.current.activate();

        return () => {
            if (stompClient.current?.active) {
                stompClient.current.deactivate();
            }
        };
    }, [userEmail, carregarNotificacoes]);

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
