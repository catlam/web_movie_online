import express from "express";
import { getPlans } from "../Controllers/PlanController.js";
import { protect } from "../middlewares/Auth.js";
import Plan from "../Models/Plan.js";

const router = express.Router();

// If you want only logged-in user:
router.use(protect);

// Return only active plans
router.get("/", async (req, res) => {
    try {
        const plans = await Plan.find({ isActive: true }).sort({
            "price.monthly": 1,
        });
        res.json(plans);
    } catch (err) {
        console.error("getActivePlans error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
