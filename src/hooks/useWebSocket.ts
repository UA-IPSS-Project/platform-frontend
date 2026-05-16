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

    // Keep callbacks in refs so the effect doesn't re-run when they change
    const onMessageRef = useRef(onMessage);
    const onConnectRef = useRef(onConnect);
    const onErrorRef = useRef(onError);
    useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
    useEffect(() => { onConnectRef.current = onConnect; }, [onConnect]);
    useEffect(() => { onErrorRef.current = onError; }, [onError]);

    useEffect(() => {
        if (!topic) return;

        let wsUrl = url;
        if (!/^wss?:\/\//.test(url)) {
            const proto = getWebSocketProtocol();
            if (/^https?:\/\//.test(url)) {
                wsUrl = url.replace(/^http(s?):\/\//, proto + '://');
            } else if (url.startsWith('/')) {
                wsUrl = `${proto}://${window.location.host}${url}`;
            }
        }

        const connectHeaders: Record<string, string> = {};
        if (authToken) {
            connectHeaders['Authorization'] = `Bearer ${authToken}`;
        }

        const client = new Client({
            brokerURL: wsUrl,
            connectHeaders,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                onConnectRef.current?.();
                client.subscribe(topic!, (message) => {
                    try {
                        onMessageRef.current(JSON.parse(message.body));
                    } catch {
                        onMessageRef.current(message.body);
                    }
                });
            },
            onStompError: (frame) => {
                onErrorRef.current?.(frame);
            },
        });

        stompClient.current = client;
        client.activate();

        return () => {
            client.deactivate();
        };
    }, [url, topic, authToken]); // callbacks removidos das dependências

    return stompClient;
}
