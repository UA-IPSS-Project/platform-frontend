import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { getCookie } from '../services/api/core/client';

export function useWebSocket(
    url: string,
    topic: string | null,
    onMessage: (message: any) => void,
    onConnect?: () => void,
    onError?: (frame: any) => void
) {
    const stompClient = useRef<Client | null>(null);

    useEffect(() => {
        if (!topic) return;

        // Read JWT from cookie so the STOMP CONNECT frame is authenticated
        const jwt = getCookie('jwt');
        const connectHeaders: Record<string, string> = {};
        if (jwt) {
            connectHeaders['Authorization'] = `Bearer ${jwt}`;
        }

        stompClient.current = new Client({
            brokerURL: url,
            connectHeaders,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        stompClient.current.onConnect = () => {
            console.log('Conectado ao WebSocket (autenticado)');
            if (onConnect) onConnect();

            stompClient.current?.subscribe(topic, (message) => {
                try {
                    const parsedMessage = JSON.parse(message.body);
                    onMessage(parsedMessage);
                } catch (error) {
                    console.error('Erro ao processar mensagem WS:', error);
                    onMessage(message.body);
                }
            });
        };

        stompClient.current.onStompError = (frame) => {
            console.error('Erro STOMP:', frame.headers['message']);
            console.error('Detalhes:', frame.body);
            if (onError) onError(frame);
        };

        stompClient.current.activate();

        return () => {
            if (stompClient.current?.active) {
                stompClient.current.deactivate();
            }
        };
    }, [url, topic, onMessage, onConnect, onError]);

    return stompClient;
}
