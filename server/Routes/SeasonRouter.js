import express from "express";
import { protect, admin } from "../middlewares/Auth.js";
import {
  getSeason,
  updateSeason,
  deleteSeason,
  listSeasonsOfSeries, 
} from "../Controllers/SeasonController.js";
import { listEpisodesOfSeason, createEpisode } from "../Controllers/EpisodeController.js";

const router = express.Router();

router.get("/:id", getSeason);
router.put("/:id", protect, admin, updateSeason);
router.delete("/:id", protect, admin, deleteSeason);

// Episodes under a Season
router.get("/:seasonId/episodes", listEpisodesOfSeason);
router.post("/:seasonId/episodes", protect, admin, createEpisode);

export default router;
