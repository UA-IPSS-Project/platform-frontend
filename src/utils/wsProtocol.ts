export function getWebSocketProtocol(): string {
  return window.location.protocol === 'https:' ? 'wss' : 'ws';
}
