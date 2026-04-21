// WebSocket protocol selection utility
export function getWebSocketProtocol(): string {
  // TEMPORARILY: Force WebSocket for local development
  // Real HTTPS/WSS setup needed for production deployment
  return 'ws';

  // Use secure protocol only if the page is served via HTTPS
  // return window.location.protocol === 'https:' ? 'wss' : 'ws';
}
