import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';

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

        stompClient.current = new Client({
            brokerURL: url,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        stompClient.current.onConnect = () => {
            console.log('Conectado ao WebSocket');
            if (onConnect) onConnect();

            stompClient.current?.subscribe(topic, (message) => {
                try {
                    const parsedMessage = JSON.parse(message.body);
                    onMessage(parsedMessage);
                } catch (error) {
                    console.error('Erro ao processar mensagem WS:', error);
                    // Retornar a mensagem não formatada se não for JSON
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
