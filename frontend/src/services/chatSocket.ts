import { getAccessToken, API_BASE_URL } from './http';

export interface ChatSocketEvent {
  event: string;
  data: Record<string, any>;
}

type EventHandler = (event: ChatSocketEvent) => void;

function resolveWsBaseUrl(): string {
  const explicit = import.meta.env.VITE_WS_URL as string | undefined;
  if (explicit) return explicit;
  return API_BASE_URL.replace(/^http/, 'ws').replace(/\/api\/v1\/?$/, '');
}

const MAX_RECONNECT_DELAY = 30_000;
const BASE_RECONNECT_DELAY = 1_000;

export class ChatSocket {
  private ws: WebSocket | null = null;
  private closed = false;
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;

  constructor(
    private readonly onEvent: EventHandler,
    private readonly onStatusChange?: (connected: boolean) => void,
  ) {}

  connect(): void {
    if (this.closed) return;

    const token = getAccessToken();
    if (!token) {
      this.scheduleReconnect();
      return;
    }

    const url = `${resolveWsBaseUrl()}?token=${encodeURIComponent(token)}`;
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.onStatusChange?.(true);
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(event.data) as ChatSocketEvent;
        if (parsed && parsed.event) this.onEvent(parsed);
      } catch {
        // Ignore malformed frames
      }
    };

    ws.onclose = () => {
      this.onStatusChange?.(false);
      this.scheduleReconnect();
    };

    ws.onerror = () => {
      ws.close();
    };
  }

  private scheduleReconnect(): void {
    if (this.closed) return;
    const delay = Math.min(MAX_RECONNECT_DELAY, BASE_RECONNECT_DELAY * 2 ** this.reconnectAttempts);
    this.reconnectAttempts += 1;
    if (this.reconnectTimer !== null) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  close(): void {
    this.closed = true;
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }
}

export function createChatSocket(
  onEvent: EventHandler,
  onStatusChange?: (connected: boolean) => void,
): ChatSocket {
  const socket = new ChatSocket(onEvent, onStatusChange);
  socket.connect();
  return socket;
}