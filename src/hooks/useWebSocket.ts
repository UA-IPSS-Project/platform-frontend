import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { getWebSocketProtocol } from '../utils/wsProtocol';

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

        // Dynamically select ws/wss protocol
        let wsUrl = url;
        if (!/^wss?:\/\//.test(url)) {
            const proto = getWebSocketProtocol();
            wsUrl = url.replace(/^http(s?):\/\//, proto + '://');
        }

        // Authentication is handled via HTTP-Only cookies at the handshake level
        // and via the JwtWebSocketInterceptor (Principal) in the backend.
        const connectHeaders: Record<string, string> = {};

        stompClient.current = new Client({
            brokerURL: wsUrl,
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
