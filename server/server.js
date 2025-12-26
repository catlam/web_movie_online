// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

import { connectDB } from "./config/db.js";
import { errorHandler } from "./middlewares/errorMiddleware.js";

import userRouter from "./Routes/UserRouter.js";
import moviesRouter from "./Routes/MoviesRouter.js";
import categoriesRouter from "./Routes/CategoriesRouter.js";
import Uploadrouter from "./Controllers/UploadFile.js";
import watchRouter from "./Routes/WatchRouter.js";
import seriesRoutes from "./Routes/SeriesRouter.js";
import seasonRoutes from "./Routes/SeasonRouter.js";
import episodeRoutes from "./Routes/EpisodeRouter.js";
import momoRouter from "./Routes/MomoRouter.js";
import membershipRouter from "./Routes/MembershipRouter.js";
import notificationRouter from "./Routes/NotificationRouter.js";
import recoRoutes from "./Routes/recoRoutes.js";
import PlanRouter from "./Routes/PlanRouter.js";
import PlanPublicRoutes from "./Routes/PlanPublicRoutes.js";



import { authSocketMiddleware } from "./socket/authSocket.js";
import SocketRegistry from "./socket/registry.js";

import axios from "axios";   
import crypto from "crypto"; 

dotenv.config();

const app = express();
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        credentials: true,
    })
);
app.use(express.json());

// connect DB
connectDB();

// Main route
app.get("/", (req, res) => {
    res.send("API is running...");
});

// other routes
app.use("/api/users", userRouter);
app.use("/api/movies", moviesRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/upload", Uploadrouter);
app.use("/api/watch", watchRouter);
app.use("/api/series", seriesRoutes);
app.use("/api/seasons", seasonRoutes);
app.use("/api/episodes", episodeRoutes);
app.use("/api/momo", momoRouter);
app.use("/api/user", membershipRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/reco", recoRoutes);
app.use("/api/admin/plans", PlanRouter);
app.use("/api/plans", PlanPublicRoutes);


// error handling middleware
app.use(errorHandler);

// ===== Static for production (giữ nguyên như bạn) =====
const __dirname = path.resolve();
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../client/build")));
    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "../client", "build", "index.html"));
    });
}

// ===== Socket.IO setup =====
const PORT = process.env.PORT || 5000;

// 1. tạo httpServer từ app
const httpServer = http.createServer(app);

// 2. tạo instance socket.io
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        credentials: true,
    },
});

// 3. auth middleware cho socket
io.use(authSocketMiddleware);

// 4. lắng connection
io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id, "user:", socket.userId);

    SocketRegistry.add(socket.userId, socket.id);

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
        SocketRegistry.remove(socket.userId, socket.id);
    });
});

SocketRegistry.bind(io);

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export { io };
