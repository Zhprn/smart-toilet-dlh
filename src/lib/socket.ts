import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth-token")
        : null;

    const formattedToken = token
      ? token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`
      : "";

    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

    socket = io(`${baseUrl}/realtime`, {
      auth: {
        token: formattedToken,
      },
      transports: ["websocket", "polling"],
      autoConnect: false,
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};