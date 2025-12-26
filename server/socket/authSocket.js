// server/socket/authSocket.js
import jwt from "jsonwebtoken";

export const authSocketMiddleware = (socket, next) => {
    try {
        const token =
            socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization?.replace("Bearer ", "");

        if (!token) return next(new Error("No token provided"));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id; // nếu bạn ký khác thì đổi ở đây

        next();
    } catch (err) {
        console.error("SocketAuth:", err.message);
        next(new Error("Authentication error"));
    }
};
