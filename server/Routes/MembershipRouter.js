import express from "express";
import { getMembershipStatus } from "../Controllers/UserMembershipController.js";
import { protect } from "../middlewares/Auth.js";

const router = express.Router();

// GET /api/user/subscription
router.get("/subscription", protect, getMembershipStatus);

export default router;
