// Controllers/WatchController.js
import asyncHandler from "express-async-handler";
import PlaybackState from "../Models/PlaybackStateModel.js";
import WatchHistory from "../Models/WatchModel.js";
import Movies from "../Models/MoviesModel.js";
import Series from "../Models/SeriesModel.js";
import Episode from "../Models/EpisodeModel.js";
import Season from "../Models/SeasonModel.js";

const FINISH_THRESHOLD = 0.9;   
const MIN_PING_SECONDS = 0;     

const clampProgress = (position, duration) => {
    const d = Math.max(1, duration || 1);
    const p = Math.max(0, Math.min(1, (position || 0) / d));
    return Math.round(p * 100);
};

async function resolveEpisodeId(seriesId, seasonNumber, episodeNumber) {
    // Trường hợp Episode có sẵn seasonNumber/episodeNumber:
    const byFlat = await Episode.findOne({
        seriesId,
        seasonNumber: Number(seasonNumber),
        episodeNumber: Number(episodeNumber),
    }).select("_id");
    if (byFlat?._id) return byFlat._id;

    // Nếu không có, map qua Season:
    const season = await Season.findOne({
        seriesId,
        seasonNumber: Number(seasonNumber),
    }).select("_id");

    if (!season?._id) return null;

    const ep = await Episode.findOne({
        seriesId,
        seasonId: season._id,
        episodeNumber: Number(episodeNumber),
    }).select("_id");

    return ep?._id || null;

}

// @desc   Ghi nhận tiến độ xem (start/progress/complete) & upsert trạng thái
// @route  POST /api/watch
// @access Private
export const upsertWatch = asyncHandler(async (req, res) => {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
        res.status(401);
        throw new Error("Unauthorized");
    }

    let {
        movieId,
        seasonNumber = null,
        episodeNumber = null,
        episodeId = null,
        position = 0,
        duration = 0,
        event = "progress",
        sessionId = null,
        playedSeconds = 0,
    } = req.body;

    if (!movieId) {
        res.status(400);
        throw new Error("movieId is required");
    }

    if (episodeId && (seasonNumber == null || episodeNumber == null)) {
        const ep = await Episode.findById(episodeId).lean();
        if (ep) {
            seasonNumber = seasonNumber ?? ep.seasonNumber ?? null;
            episodeNumber = episodeNumber ?? ep.episodeNumber ?? null;
        }
    }

    if (!episodeId && seasonNumber != null && episodeNumber != null) {
        episodeId = await resolveEpisodeId(movieId, seasonNumber, episodeNumber);
    }

    if (event !== "progress" || playedSeconds >= MIN_PING_SECONDS) {
        await WatchHistory.create({
            userId,
            movieId,
            seasonNumber,
            episodeNumber,
            episodeId: episodeId ?? null,
            action: event,
            position,
            duration,
            playedSeconds,
            client: {
                deviceId: req.headers["x-device-id"] || null,
                ua: req.headers["user-agent"] || null,
                ip: req.ip || null,
            },
            ts: new Date(),
        });
    }

    const key = { userId, movieId, seasonNumber, episodeNumber };
    const exist = await PlaybackState.findOne(key).lean();

    // ===== DENORMALIZE =====
    let denorm = {};
    const pickDenorm = (m) => ({
        title: m?.name || m?.title || null,
        posterPath: m?.titleImage || m?.posterPath || m?.poster || m?.poster_path || m?.image || null,
        backdropPath: m?.image || m?.backdropPath || m?.backdrop || m?.backdrop_path || null,
        isPremium: !!m?.isPremium,
        releaseDate: m?.year ? String(m.year) : (m?.releaseDate || m?.release_date || null),
    });

    let mediaDoc = null;
    if (!exist) {
        mediaDoc = await Movies.findById(movieId).lean();
        if (!mediaDoc && Series?.findById) {
            mediaDoc = await Series.findById(movieId).lean();
        }
        if (mediaDoc) denorm = pickDenorm(mediaDoc);
    } else {
        if (!exist.title || !exist.posterPath || !exist.backdropPath) {
            mediaDoc = await Movies.findById(movieId).lean();
            if (!mediaDoc && Series?.findById) {
                mediaDoc = await Series.findById(movieId).lean();
            }
            if (mediaDoc) {
                const d = pickDenorm(mediaDoc);
                denorm = {
                    ...(exist.title ? {} : { title: d.title }),
                    ...(exist.posterPath ? {} : { posterPath: d.posterPath }),
                    ...(exist.backdropPath ? {} : { backdropPath: d.backdropPath }),
                    ...(exist.releaseDate ? {} : { releaseDate: d.releaseDate }),
                    ...(exist.isPremium === undefined ? { isPremium: d.isPremium } : {}),
                };
            }
        }
    }

    const progressPct = clampProgress(position, duration);
    const finished =
        progressPct >= Math.round(FINISH_THRESHOLD * 100) || event === "complete";

    const baseSet = {
        lastPosition: Math.floor(position),
        duration: Math.floor(duration),
        progressPct,
        finished,
        lastActionAt: new Date(),
        lastAction: event,
        lastSessionId: sessionId || null,
        episodeId: episodeId ?? (exist?.episodeId ?? null),
    };

    const update = {
        $set: { ...baseSet, ...denorm, episodeId: episodeId ?? (exist?.episodeId ?? null), },
        $setOnInsert: { createdAt: new Date() },
    };

    const state = await PlaybackState.findOneAndUpdate(key, update, {
        upsert: true,
        new: true,
    });

    res.json({ ok: true, data: state });
});

// @desc   Danh sách “Tiếp tục xem” (chưa hoàn tất)
// @route  GET /api/watch/me/continue
// @access Private
export const getContinueWatching = asyncHandler(async (req, res) => {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
        res.status(401);
        throw new Error("Unauthorized");
    }

    const rows = await PlaybackState.find({ userId, finished: { $ne: true } })
        .sort({ lastActionAt: -1 })
        .limit(30)
        .lean();

    const needLookup = rows.filter(r => r.episodeId == null && r.seasonNumber != null && r.episodeNumber != null);
    if (needLookup.length) {
        for (const r of needLookup) {
            const ep = await Episode.findOne({
                seriesId: r.movieId,
                seasonNumber: r.seasonNumber,
                episodeNumber: r.episodeNumber,
            }).select("_id").lean();
            if (ep?._id) r.episodeId = String(ep._id);
        }
    }

    res.json({ ok: true, data: rows });
});

// @desc   “Đã xem gần đây” (mọi trạng thái, sort theo thời gian)
// @route  GET /api/watch/me/recent
// @access Private
export const getRecentlyWatched = asyncHandler(async (req, res) => {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
        res.status(401);
        throw new Error("Unauthorized");
    }

    const rows = await PlaybackState.find({ userId })
        .sort({ lastActionAt: -1 })
        .limit(50)
        .lean();

    res.json({ ok: true, data: rows });
});

// @desc   Lấy trạng thái phát 1 phim/episode để resume
// @route  GET /api/watch/me/state?movieId=...&seasonNumber=...&episodeNumber=...
// @access Private
export const getPlaybackState = asyncHandler(async (req, res) => {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
        res.status(401);
        throw new Error("Unauthorized");
    }

    const { movieId, seasonNumber = null, episodeNumber = null } = req.query;
    if (!movieId) {
        res.status(400);
        throw new Error("movieId is required");
    }

    const state = await PlaybackState.findOne({ userId, movieId, seasonNumber, episodeNumber }).lean();
    res.json({ ok: true, data: state || null });
});

// @desc   Xoá 1 mục lịch sử xem theo movieId
// @route  DELETE /api/watch/me/:movieId
// @access Private
// export const deleteOnePlayback = asyncHandler(async (req, res) => {
//     const userId = req.user?._id || req.user?.id;
//     if (!userId) {
//         res.status(401);
//         throw new Error("Unauthorized");
//     }

//     const { movieId } = req.params;
//     await PlaybackState.deleteMany({ userId, movieId });
//     res.json({ ok: true });
// });

// @desc   Xoá toàn bộ lịch sử xem của tôi
// @route  DELETE /api/watch/me
// @access Private
export const clearAllPlayback = asyncHandler(async (req, res) => {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
        res.status(401);
        throw new Error("Unauthorized");
    }

    await PlaybackState.deleteMany({ userId });
    res.json({ ok: true });
});

// @desc   Toàn bộ tập đã xem trong 1 series (group theo season/tập)
// @route  GET /api/watch/me/series/:movieId/history
// @access Private
export const getSeriesHistory = asyncHandler(async (req, res) => {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
        res.status(401);
        throw new Error("Unauthorized");
    }

    const { movieId } = req.params;
    if (!movieId) {
        res.status(400);
        throw new Error("movieId is required");
    }

    // Lấy state mới nhất mỗi tập
    const rows = await PlaybackState.find({ userId, movieId })
        .sort({ seasonNumber: 1, episodeNumber: 1 })
        .lean();

    // Group theo season cho client dễ render
    const seasons = {};
    for (const r of rows) {
        const s = r.seasonNumber ?? 0;
        if (!seasons[s]) seasons[s] = [];
        seasons[s].push(r);
    }

    res.json({
        ok: true,
        data: Object.keys(seasons)
            .sort((a, b) => Number(a) - Number(b))
            .map((s) => ({ seasonNumber: Number(s), episodes: seasons[s] })),
    });
});

// @desc   Lịch sử 1 season trong series
// @route  GET /api/watch/me/series/:movieId/season/:seasonNumber
// @access Private
export const getSeasonHistory = asyncHandler(async (req, res) => {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
        res.status(401);
        throw new Error("Unauthorized");
    }

    const { movieId, seasonNumber } = req.params;
    if (!movieId) {
        res.status(400);
        throw new Error("movieId is required");
    }

    const rows = await PlaybackState.find({
        userId,
        movieId,
        seasonNumber: Number(seasonNumber),
    })
        .sort({ episodeNumber: 1 })
        .lean();

    res.json({ ok: true, data: rows });
});

// @desc   Lấy lịch sử thô (append logs) của 1 tập — tiện debug/analytics
// @route  GET /api/watch/me/series/:movieId/season/:seasonNumber/episode/:episodeNumber/logs
// @access Private
export const getEpisodeLogs = asyncHandler(async (req, res) => {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
        res.status(401);
        throw new Error("Unauthorized");
    }

    const { movieId, seasonNumber, episodeNumber } = req.params;
    const rows = await WatchHistory.find({
        userId,
        movieId,
        seasonNumber: Number(seasonNumber),
        episodeNumber: Number(episodeNumber),
    })
        .sort({ ts: -1 })
        .limit(200)
        .lean();

    res.json({ ok: true, data: rows });
});

// @desc   Xoá 1 mục lịch sử xem (toàn bộ series hoặc 1 tập nếu có season/episode)
// @route  DELETE /api/watch/me/:movieId
// @access Private
export const deleteOnePlayback = asyncHandler(async (req, res) => {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
        res.status(401);
        throw new Error("Unauthorized");
    }

    const { movieId } = req.params;
    const { seasonNumber, episodeNumber } = req.query;

    const filter = { userId, movieId };

    // Nếu có season/episode -> chỉ xoá đúng tập
    if (seasonNumber !== undefined) filter.seasonNumber = Number(seasonNumber);
    if (episodeNumber !== undefined) filter.episodeNumber = Number(episodeNumber);

    await PlaybackState.deleteMany(filter);
    await WatchHistory.deleteMany(filter);

    res.json({ ok: true });
});


/* =========================
   (Tuỳ chọn) ADMIN ANALYTICS
   ========================= */

// @desc   Top phim theo thời gian xem 7 ngày gần nhất
// @route  GET /api/watch/admin/top
// @access Private/Admin
export const adminTopWatched = asyncHandler(async (req, res) => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await WatchHistory.aggregate([
        { $match: { ts: { $gte: since }, action: "progress" } },
        { $group: { _id: "$movieId", seconds: { $sum: "$playedSeconds" }, users: { $addToSet: "$userId" } } },
        { $project: { seconds: 1, viewers: { $size: "$users" } } },
        { $sort: { seconds: -1 } },
        { $limit: 10 },
    ]);
    res.json({ ok: true, data: rows });
});
