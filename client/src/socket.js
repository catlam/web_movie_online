import { io } from "socket.io-client";

const API_URL =
    (typeof import.meta !== "undefined" &&
        import.meta.env &&
        import.meta.env.VITE_API_URL) ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";

let socket = null;

export function connectSocket(token) {
    if (socket) return socket;

    console.log("Connecting Socket.IO to:", API_URL);

    socket = io(API_URL, {
        auth: { token },
        transports: ["websocket"],
    });

    socket.on("connect", () => {
        console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected");
    });

    socket.on("connect_error", (err) => {
        console.error("Socket connect error:", err.message);
    });

    return socket;
}

export function disconnectSocket() {
    if (!socket) return;
    socket.disconnect();
    socket = null;
}
