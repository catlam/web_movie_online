// server/Routes/NotificationRouter.js
import express from "express";
import { getNotifications } from "../Controllers/notificationController.js";
import { protect } from "../middlewares/Auth.js";

const router = express.Router();

router.get("/", protect, getNotifications);

export default router;
