import asyncHandler from "express-async-handler";
import Season from "../Models/SeasonModel.js";
import Episode from "../Models/EpisodeModel.js";
import Series from "../Models/SeriesModel.js";

// GET /api/seasons/:seasonId/episodes
export const listEpisodesOfSeason = asyncHandler(async (req, res) => {
    const { seasonId } = req.params;
    const episodes = await Episode.find({ seasonId }).sort({ episodeNumber: 1 });
    res.json(episodes);
});

// POST /api/seasons/:seasonId/episodes  (admin)
export const createEpisode = asyncHandler(async (req, res) => {
    const { seasonId } = req.params;

    // Lấy season để suy ra seriesId
    const season = await Season.findById(seasonId);
    if (!season) return res.status(404).json({ message: "Season not found" });

    // Chuẩn hóa input
    const epNum = Number(req.body.episodeNumber ?? req.body.number);
    if (!Number.isFinite(epNum)) {
        return res.status(400).json({ message: "episodeNumber is required" });
    }
    const title = (req.body.title || "").trim();
    if (!title) return res.status(400).json({ message: "title is required" });
    const video = req.body.video;
    if (!video) return res.status(400).json({ message: "video is required" });

    const payload = {
        seriesId: season.seriesId,            // bắt buộc theo schema
        seasonId,                             // bắt buộc theo schema
        episodeNumber: epNum,                 // ❗ quan trọng – trước đây bị thiếu
        title,
        desc: req.body.desc || "",
        video,
        duration: Number(req.body.duration ?? req.body.runtime ?? 0),
        releaseDate: req.body.releaseDate ? new Date(req.body.releaseDate) : undefined,
    };

    const ep = await Episode.create(payload);

    await Promise.all([
        Season.findByIdAndUpdate(seasonId, { $addToSet: { episodes: ep._id } }),
        Series.findByIdAndUpdate(season.seriesId, { $addToSet: { episodes: ep._id } }),
    ]);

    res.status(201).json(ep);
});

// GET /api/episodes/:id
export const getEpisode = asyncHandler(async (req, res) => {
    const ep = await Episode.findById(req.params.id);
    if (!ep) return res.status(404).json({ message: "Episode not found" });
    res.json(ep);
});

// PUT /api/episodes/:id  (admin)
export const updateEpisode = asyncHandler(async (req, res) => {
    const ep = await Episode.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ep) return res.status(404).json({ message: "Episode not found" });
    res.json(ep);
});

// DELETE /api/episodes/:id  (admin)
export const deleteEpisode = asyncHandler(async (req, res) => {
    const ep = await Episode.findById(req.params.id);
    if (!ep) return res.status(404).json({ message: "Episode not found" });
    await ep.deleteOne();
    res.json({ message: "Episode deleted" });
});

export const getEpisodeBySeriesSeasonEpisode = asyncHandler(async (req, res) => {
    const { seriesId } = req.params;
    const seasonNumber = Number(req.query.seasonNumber);
    const episodeNumber = Number(req.query.episodeNumber);

    if (!seriesId || Number.isNaN(seasonNumber) || Number.isNaN(episodeNumber)) {
        return res.status(400).json({ message: "Missing seriesId/seasonNumber/episodeNumber" });
    }

    // 1) tìm season theo seriesId + seasonNumber
    const season = await Season.findOne({ seriesId, seasonNumber });
    if (!season) return res.status(404).json({ message: "Season not found" });

    // 2) tìm episode theo seasonId + episodeNumber
    const ep = await Episode.findOne({ seasonId: season._id, episodeNumber });
    if (!ep) return res.status(404).json({ message: "Episode not found" });

    // trả về tối thiểu _id để FE điều hướng
    res.json({ _id: ep._id, episode: ep });
});
