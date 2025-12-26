import express from "express";
import {
    getPlans,
    getPlanById,
    createPlan,
    updatePlan,
    deletePlan,
    togglePlanStatus,
} from "../Controllers/PlanController.js";
import { protect, admin } from "../middlewares/Auth.js";

const router = express.Router();

router.use(protect, admin);

router.get("/", getPlans);
router.get("/:id", getPlanById);
router.post("/", createPlan);
router.put("/:id", updatePlan);
router.delete("/:id", deletePlan);
router.patch("/:id/toggle", togglePlanStatus);

export default router;
