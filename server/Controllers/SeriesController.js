import asyncHandler from "express-async-handler";
import Series from "../Models/SeriesModel.js";
import Season from "../Models/SeasonModel.js";
import Episode from "../Models/EpisodeModel.js";
import {
    searchSeries,
    upsertSeries,
    deleteSeries as esDeleteSeries,
    syncAllSeriesToES,
} from "../config/elastic.js";
import { createSeriesNotification } from "./notificationController.js";


function normalizeCasts(casts) {
    if (!Array.isArray(casts)) return [];
    return casts
        .map((c) => {
            if (!c) return null;
            if (typeof c === "string") {
                const name = c.trim();
                return name ? { name } : null;
            }
            if (typeof c === "object") {
                const name = (c.name || "").toString().trim();
                const image = c.image ? String(c.image).trim() : undefined;
                const role = c.role ? String(c.role).trim() : undefined;
                if (!name) return null;
                const obj = { name };
                if (image) obj.image = image;
                if (role) obj.role = role;
                return obj;
            }
            return null;
        })
        .filter(Boolean);
}

function pickSeriesPayload(body = {}) {
    const {
        name,
        desc,
        image,
        titleImage,
        rate,
        numberOfReviews,
        category,
        time,
        language,
        year,
        casts,
    } = body;

    const payload = {
        ...(name !== undefined && { name }),
        ...(desc !== undefined && { desc }),
        ...(image !== undefined && { image }),
        ...(titleImage !== undefined && { titleImage }),
        ...(rate !== undefined && { rate }),
        ...(numberOfReviews !== undefined && { numberOfReviews }),
        ...(category !== undefined && { category }),
        ...(time !== undefined && { time }),
        ...(language !== undefined && { language }),
        ...(year !== undefined && { year }),
    };

    if (casts !== undefined) {
        payload.casts = normalizeCasts(casts);
    }

    return payload;
}

// GET /api/series
export const listSeries = asyncHandler(async (req, res) => {
    const { category, language, year, rate, search, sort = "az" } = req.query;
    const page = Math.max(1, Number(req.query.pageNumber) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 12);

    // ===================== ELASTICSEARCH (ưu tiên) =====================
    try {
        const esParams = {
            q: search || "",
            category: category || undefined,
            language: language || undefined,
            year: year ? Number(year) : undefined,
            minRate: rate ? Number(rate) : undefined,
            page,
            limit,
            sort: ["az", "za", "newest", "oldest", "rate_desc", "rate_asc"].includes(String(sort)) ? sort : "az",
        };

        const esResp = await searchSeries(esParams);
        if (esResp && !esResp.error && Array.isArray(esResp.hits)) {
            return res.json({
                items: esResp.hits,     // [{ _id, name, desc, casts[], ...}]
                page: esResp.page,
                pages: esResp.pages,
                total: esResp.total,
                limit: esResp.limit,
                sort: esParams.sort,
                source: "es",
            });
        }
    } catch (_) {
        // ES lỗi => bỏ qua, dùng Mongo
    }

    // ===================== FALLBACK MONGODB =====================
    const baseFilters = {
        ...(category && { category }),
        ...(language && { language }),
        ...(year && { year: Number(year) }),
        ...(rate && { rate: { $gte: Number(rate) } }),
    };

    const textFilter = search
        ? {
            $or: [
                { name: { $regex: search, $options: "i" } },
                { desc: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } },
                { language: { $regex: search, $options: "i" } },
                { "casts.name": { $regex: search, $options: "i" } }, // 🔎 tìm theo cast
            ],
        }
        : {};

    const query = { ...baseFilters, ...textFilter };

    let sortSpec = { name: 1 };
    if (sort === "za") sortSpec = { name: -1 };
    if (sort === "newest") sortSpec = { createdAt: -1 };
    if (sort === "oldest") sortSpec = { createdAt: 1 };
    if (sort === "rate_desc") sortSpec = { rate: -1 };
    if (sort === "rate_asc") sortSpec = { rate: 1 };

    const [items, count] = await Promise.all([
        Series.find(query).sort(sortSpec).skip((page - 1) * limit).limit(limit),
        Series.countDocuments(query),
    ]);

    res.json({
        items,
        page,
        pages: Math.ceil(count / limit),
        total: count,
        limit,
        sort,
        source: "mongo",
    });
});

// GET /api/series/:id
export const getSeries = async (req, res) => {
    try {
        const series = await Series.findById(req.params.id)
            .populate({
                path: "seasons",
                populate: { path: "episodes" },
            })
            .populate("episodes");

        if (!series) {
            return res.status(404).json({ message: "Series not found" });
        }

        res.json(series);
    } catch (error) {
        console.error("[getSeries] error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc get random series
// @route GET /api/series/random/all
// @access Public
export const getRandomSeries = asyncHandler(async (req, res) => {
    try {
        const size = Math.max(1, Number(req.query.size) || 8);
        const items = await Series.aggregate([{ $sample: { size } }]);
        res.json(items);
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
});

// POST /api/series  (admin)
export const createSeries = asyncHandler(async (req, res) => {
    const data = pickSeriesPayload(req.body);
    const s = await Series.create({
        ...data,
        createdBy: req.user?._id,
    });

    try {
        if (typeof upsertSeries === "function") {
            await upsertSeries(s._id.toString(), s);
        }
    } catch (e) {
        console.warn("[ES] upsertSeries failed:", e?.message || e);
    }

    await createSeriesNotification(s);
    res.status(201).json(s);
});

// PUT /api/series/:id  (admin)
export const updateSeries = asyncHandler(async (req, res) => {
    const payload = pickSeriesPayload(req.body);

    const s = await Series.findById(req.params.id);
    if (!s) return res.status(404).json({ message: "Series not found" });

    Object.assign(s, payload);

    const updated = await s.save();

    try {
        if (typeof upsertSeries === "function") {
            await upsertSeries(updated._id.toString(), updated);
        }
    } catch (e) {
        console.warn("[ES] upsertSeries failed:", e?.message || e);
    }

    res.json(updated);
});

// DELETE /api/series/:id  (admin)
// Xoá series → xoá luôn seasons + episodes liên quan
export const deleteSeries = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const s = await Series.findById(id);
    if (!s) return res.status(404).json({ message: "Series not found" });

    const seasons = await Season.find({ seriesId: id }).select("_id");
    const seasonIds = seasons.map((x) => x._id);

    await Episode.deleteMany({ seriesId: id });
    await Season.deleteMany({ seriesId: id });
    await s.deleteOne();

    try {
        if (typeof esDeleteSeries === "function") {
            await esDeleteSeries(id);
        }
    } catch (e) {
        console.warn("[ES] deleteSeries failed:", e?.message || e);
    }

    res.json({ message: "Series deleted", deletedSeasons: seasonIds.length });
});

// GET /api/series/:id/summary  (tuỳ chọn)
// trả tổng số season & episode
export const seriesSummary = asyncHandler(async (req, res) => {
    const seriesId = req.params.id;
    const [seasonCount, episodeCount] = await Promise.all([
        Season.countDocuments({ seriesId }),
        Episode.countDocuments({ seriesId }),
    ]);
    res.json({ seriesId, seasonCount, episodeCount });
});

//GET /api/series/:seriesId/resolve-episode?seasonNumber=1&episodeNumber=3
// Trả về episodeId khi biết số season & số tập.
// -> Frontend gọi 1 lần là đủ.
export const resolveEpisodeByNumber = asyncHandler(async (req, res) => {
    const { seriesId } = req.params;
    const seasonNumber = Number(req.query.seasonNumber);
    const episodeNumber = Number(req.query.episodeNumber);

    if (!seriesId || !Number.isFinite(seasonNumber) || !Number.isFinite(episodeNumber)) {
        return res.status(400).json({ message: "Missing or invalid parameters" });
    }

    const season = await Season.findOne({ seriesId, seasonNumber }).select("_id");
    if (!season) {
        return res.json({ data: { episodeId: null } });
    }

    const ep = await Episode.findOne({ seasonId: season._id, episodeNumber }).select("_id");
    res.json({ data: { episodeId: ep?._id || null } });
});

// @desc    Create series review
// @route   POST /api/series/:id/reviews
// @access  Private
export const createSeriesReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;

    const series = await Series.findById(req.params.id);
    if (!series) {
        res.status(404);
        throw new Error("Series not found");
    }

    // 1 user chỉ được review 1 lần
    const alreadyReviewed = series.reviews.find(
        (r) => r.userId.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
        res.status(400);
        throw new Error("You already reviewed this series");
    }

    const review = {
        userName: req.user.fullName,
        userId: req.user._id,
        userImage: req.user.image,
        rating: Number(rating),
        comment,
    };

    series.reviews.push(review);
    series.numberOfReviews = series.reviews.length;
    series.rate =
        series.reviews.reduce((acc, item) => acc + (item.rating || 0), 0) /
        series.reviews.length;

    await series.save();

    res.status(201).json({ message: "Review added" });
});

// @desc    Delete my review on series
// @route   DELETE /api/series/:id/reviews
// @access  Private
export const deleteSeriesReview = asyncHandler(async (req, res) => {
    const series = await Series.findById(req.params.id);
    if (!series) {
        res.status(404);
        throw new Error("Series not found");
    }

    const myIndex = series.reviews.findIndex(
        (r) => r.userId.toString() === req.user._id.toString()
    );
    if (myIndex === -1) {
        res.status(404);
        throw new Error("You haven't reviewed this series");
    }

    series.reviews.splice(myIndex, 1);
    series.numberOfReviews = series.reviews.length;
    series.rate =
        series.reviews.length === 0
            ? 0
            : series.reviews.reduce((acc, item) => acc + (item.rating || 0), 0) /
            series.reviews.length;

    await series.save();

    res.json({ message: "Review deleted successfully" });
});

export const syncSeriesToES = asyncHandler(async (req, res) => {
    const r = await syncAllSeriesToES(500);
    if (r.ok) return res.json({ message: "Synced series to ES", total: r.total });
    return res.status(500).json({ message: r.error || "Sync series failed" });
});