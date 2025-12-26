import asyncHandler from "express-async-handler";
import Series from "../Models/SeriesModel.js";
import Season from "../Models/SeasonModel.js";
import Episode from "../Models/EpisodeModel.js";

// GET /api/series/:seriesId/seasons
export const listSeasonsOfSeries = asyncHandler(async (req, res) => {
    const { seriesId } = req.params;
    const seasons = await Season.find({ seriesId }).sort({ seasonNumber: 1 });
    res.json(seasons);
});

// POST /api/series/:seriesId/seasons  (admin)
export const createSeason = asyncHandler(async (req, res) => {
    const  seriesId = req.params.seriesId || req.params.id;
    const { seasonNumber, name, desc } = req.body;

    const s = await Series.findById(seriesId);
    if (!s) return res.status(404).json({ message: "Series not found" });

    const season = await Season.create({ seriesId, seasonNumber, name, desc });
    await Series.findByIdAndUpdate(seriesId, { $addToSet: { seasons: season._id } });

    res.status(201).json(season);
});

// GET /api/seasons/:id
export const getSeason = asyncHandler(async (req, res) => {
    const season = await Season.findById(req.params.id);
    if (!season) return res.status(404).json({ message: "Season not found" });
    res.json(season);
});

// PUT /api/seasons/:id  (admin)
export const updateSeason = asyncHandler(async (req, res) => {
    const season = await Season.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!season) return res.status(404).json({ message: "Season not found" });
    res.json(season);
});

// DELETE /api/seasons/:id  (admin)
// xoá season → xoá luôn episodes của season đó
export const deleteSeason = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const season = await Season.findById(id);
    if (!season) return res.status(404).json({ message: "Season not found" });

    await Episode.deleteMany({ seasonId: id });
    await season.deleteOne();

    res.json({ message: "Season deleted" });
});

// GET /api/seasons/:seasonId/episodes
export const listEpisodesOfSeason = asyncHandler(async (req, res) => {
    const { seasonId } = req.params;
    const episodes = await Episode.find({ seasonId }).sort({ episodeNumber: 1 });
    res.json({ data: episodes });
});