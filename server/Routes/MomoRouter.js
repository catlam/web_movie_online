import express from "express";
import { createPayment, getPaymentByOrderId, momoIpn, momoReturn, updatePaymentStatus } from "../Controllers/MomoController.js";
import { protect, admin } from "../middlewares/Auth.js";

const router = express.Router();

// POST /api/membership
// router.post("/membership", createPayment);

// POST /api/momo/create
router.post("/create", protect, createPayment);

// POST /api/momo/ipn  <-- MoMo gọi về
router.post("/ipn", momoIpn);

router.get("/return", momoReturn); 

router.get("/payment/:orderId", protect, admin, getPaymentByOrderId);
router.put("/payment/:orderId", protect, admin, updatePaymentStatus);



export default router;
