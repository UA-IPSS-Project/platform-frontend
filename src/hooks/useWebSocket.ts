import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { getWebSocketProtocol } from '../utils/wsProtocol';

export function useWebSocket(
    url: string,
    topic: string | null,
    onMessage: (message: any) => void,
    onConnect?: () => void,
    onError?: (frame: any) => void,
    authToken?: string
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

        // Pass JWT as query parameter (httpOnly cookies are not accessible via JS)
        // Also pass in STOMP connectHeaders as a backup
        const connectHeaders: Record<string, string> = {};
        if (authToken) {
            connectHeaders['Authorization'] = `Bearer ${authToken}`;
            const sep = wsUrl.includes('?') ? '&' : '?';
            wsUrl = `${wsUrl}${sep}token=${encodeURIComponent(authToken)}`;
        }

        stompClient.current = new Client({
            brokerURL: wsUrl,
            connectHeaders,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                if (onConnect) onConnect();

                stompClient.current?.subscribe(topic!, (message) => {
                    try {
                        const parsedMessage = JSON.parse(message.body);
                        onMessage(parsedMessage);
                    } catch (error) {
                        onMessage(message.body);
                    }
                });
            },
            onStompError: (frame) => {
                if (onError) onError(frame);
            },
            onWebSocketClose: () => {
            },
            onDisconnect: () => {
            }
        });

        stompClient.current.activate();

        return () => {
            if (stompClient.current?.active) {
                stompClient.current.deactivate();
            }
        };
    }, [url, topic, onMessage, onConnect, onError, authToken]);

    return stompClient;
}
