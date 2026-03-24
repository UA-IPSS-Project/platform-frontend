// WebSocket protocol selection utility
export function getWebSocketProtocol(): string {
  // Use secure protocol in production, plain in development
  if (window.location.protocol === 'https:') return 'wss';
  if (import.meta.env.MODE === 'production') return 'wss';
  return 'ws';
}
