import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

    socket = io(`${baseUrl}/realtime`, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};