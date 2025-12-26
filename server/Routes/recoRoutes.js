// routes/recoRoutes.js (hoặc searchRoutes)
import express from "express";
import { moodSearch } from "../Controllers/recoController.js";

const router = express.Router();

router.get("/smart-search", moodSearch); 

export default router;
