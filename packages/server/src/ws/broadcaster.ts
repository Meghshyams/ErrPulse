import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { WebSocketMessage } from "@errpulse/core";

let wss: WebSocketServer | null = null;

export function initWebSocket(server: Server): WebSocketServer {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    ws.on("error", (err) => {
      console.warn("[ErrPulse] WebSocket client error:", err.message);
    });
  });

  return wss;
}

export function broadcast(message: WebSocketMessage): void {
  if (!wss) return;

  const data = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

export function getWebSocketServer(): WebSocketServer | null {
  return wss;
}
