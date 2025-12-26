// src/Components/Home/ViewHistory.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    getContinueWatchingAction,
    deletePlaybackAction,
    clearAllPlaybackAction,
} from "../../Redux/Actions/watchActions";
import { listSeriesAction } from "../../Redux/Actions/seriesActions";
import Titles from "../Titles";
import Loader from "../Notifications/Loader";
import { FaHistory } from "react-icons/fa";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import {
    listSeasonsBySeriesService,
} from "../../Redux/APIs/seriesServices";
import {
    listEpisodesBySeasonService,
} from "../../Redux/APIs/seasonServices";
import {
    getSeriesHistoryService,
} from "../../Redux/APIs/watchAPI";
import {
    getEpisodeBySeriesSEService
} from "../../Redux/APIs/episodeServices";

import { motion, AnimatePresence } from "framer-motion";

if (typeof window !== "undefined") window.__CW_DEBUG__ = true;

function adaptPlayback(p) {
    return {
        _id: p.movieId,
        name: p.title || "Untitled",
        titleImage: p.posterPath || p.image,
        image: p.backdropPath || p.posterPath || p.image,
        year: p.releaseDate ? Number(p.releaseDate) : undefined,
        isPremium: p.isPremium,
        _progressPct: p.progressPct,
        _resumeSeconds: p.lastPosition,
        _duration: p.duration,
        _season: p.seasonNumber ?? null,
        _episode: p.episodeNumber ?? null,
        _episodeId: p.episodeId ?? null,
        _isSeriesFromPayload: p.seasonNumber != null,
        _lastActionAt: p.lastActionAt ? new Date(p.lastActionAt).getTime() : 0,
    };
}

export default function ViewHistory() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { userInfo } = useSelector((s) => s.userLogin);
    const { loading, items, error } = useSelector((s) => s.continueWatching);
    const { items: seriesItems = [] } = useSelector((s) => s.seriesList || {});
    const deleting = useSelector((s) => s.deletePlayback?.loading);
    const clearing = useSelector((s) => s.clearAllPlayback?.loading);

    const seriesIdSet = useMemo(
        () => new Set(seriesItems.map((x) => String(x._id))),
        [seriesItems]
    );

    const [offset, setOffset] = useState(0);
    const itemsPerView = 5;

    useEffect(() => {
        if (userInfo?.token) {
            dispatch(getContinueWatchingAction());
            dispatch(listSeriesAction({ limit: 200 }));
        }
    }, [dispatch, userInfo]);

    const list = useMemo(() => {
        if (!items?.length) return [];
        const series = [];
        const movies = [];

        for (const p of items) {
            if (p.seasonNumber != null) series.push(p);
            else movies.push(p);
        }

        const latestSeriesMap = new Map();
        for (const p of series) {
            const key = String(p.movieId);
            const old = latestSeriesMap.get(key);
            const tOld = old?.lastActionAt ? new Date(old.lastActionAt).getTime() : -1;
            const tNew = p.lastActionAt ? new Date(p.lastActionAt).getTime() : -1;
            if (!old || tNew > tOld) latestSeriesMap.set(key, p);
        }

        return [
            ...Array.from(latestSeriesMap.values()).map(adaptPlayback),
            ...movies.map(adaptPlayback),
        ].sort((a, b) => b._lastActionAt - a._lastActionAt);
    }, [items]);

    const maxOffset = Math.max(0, list.length - itemsPerView);
    const visible = list.slice(offset, offset + itemsPerView);

    const safeError =
        error && !/not authorized|no token/i.test(String(error))
            ? String(error)
            : null;

    // =====================
    // ⭐ Navigation logic giữ nguyên
    // =====================
    const resolveEpisodeIdBySE = async (sid, season, ep) => {
        try {
            const res = await getEpisodeBySeriesSEService(sid, season, ep);
            return res?._id || null;
        } catch {
            return null;
        }
    };

    const resolveEpisodeIdFromHistory = async (seriesId) => {
        try {
            const rows = await getSeriesHistoryService(seriesId);
            const filtered = (rows || [])
                .filter((x) => x.episodeId && x.lastPosition > 0)
                .sort((a, b) =>
                    new Date(b.lastActionAt).getTime() -
                    new Date(a.lastActionAt).getTime()
                );
            if (!filtered.length) return null;
            return filtered[0].episodeId;
        } catch {
            return null;
        }
    };

    const onOpen = async (m) => {
        const isSeries =
            m._isSeriesFromPayload || seriesIdSet.has(String(m._id));

        if (!isSeries) {
            navigate(`/watch/${m._id}`, {
                state: { resumeSeconds: m._resumeSeconds ?? 0 },
            });
            return;
        }

        if (m._episodeId) {
            navigate(`/watch/episode/${m._episodeId}`, {
                state: { resumeSeconds: m._resumeSeconds ?? 0 },
            });
            return;
        }

        if (m._episode != null) {
            const seasons = await listSeasonsBySeriesService(m._id);
            if (seasons?.length) {
                const seasonNumber = m._season ?? seasons[0].seasonNumber;
                const eid = await resolveEpisodeIdBySE(m._id, seasonNumber, m._episode);
                if (eid) {
                    navigate(`/watch/episode/${eid}`, {
                        state: { resumeSeconds: m._resumeSeconds ?? 0 },
                    });
                    return;
                }
            }
        }

        const eid = await resolveEpisodeIdFromHistory(m._id);
        if (eid) {
            navigate(`/watch/episode/${eid}`, {
                state: { resumeSeconds: m._resumeSeconds ?? 0 },
            });
            return;
        }

        const seasons = await listSeasonsBySeriesService(m._id);
        if (seasons?.length) {
            const firstSeason = seasons[0];
            const eps = await listEpisodesBySeasonService(firstSeason._id);
            if (eps?.length) {
                navigate(`/watch/episode/${eps[0]._id}`, {
                    state: { resumeSeconds: m._resumeSeconds ?? 0 },
                });
                return;
            }
        }

        navigate(`/series/${m._id}`);
    };

    const onDelete = (m) => {
        if (deleting) return;
        dispatch(
            deletePlaybackAction({
                movieId: m._id,
                seasonNumber: m._season,
                episodeNumber: m._episode,
            })
        )
            .then(() => toast.success("Removed from Continue Watching"))
            .catch(() => toast.error("Failed to remove"));
    };

    const onClearAll = () => {
        if (clearing) return;
        dispatch(clearAllPlaybackAction())
            .then(() => toast.success("Viewing history cleared"))
            .catch(() => toast.error("Failed to clear history"));
    };

    if (!userInfo?.token) return null;

    return (
        <div className="my-16 relative">
            <div className="flex items-center justify-between">
                <Titles title="Continue Watching" Icon={FaHistory} />

                <button
                    onClick={onClearAll}
                    disabled={clearing}
                    className={`text-xs md:text-sm px-3 py-1 rounded border ${clearing
                            ? "opacity-60 cursor-not-allowed border-gray-500 text-gray-300"
                            : "border-white/40 text-white hover:bg-white hover:text-black transition"
                        }`}
                >
                    {clearing ? "Clearing..." : "Clear all"}
                </button>
            </div>

            {loading ? (
                <Loader />
            ) : safeError ? (
                <div className="text-red-400 mt-4">{safeError}</div>
            ) : list.length === 0 ? null : (
                <>
                    <div className="mt-10 flex items-center justify-center gap-6">
                        {/* Prev */}
                        <button
                            onClick={() => setOffset((o) => Math.max(o - 1, 0))}
                            disabled={offset === 0}
                            className="hidden md:flex w-11 h-11 rounded-full flex-colo bg-black/50 hover:bg-black/70 text-white disabled:opacity-40"
                        >
                            ◀
                        </button>

                        {/* Row */}
                        <div className="overflow-hidden max-w-6xl">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={offset}
                                    initial={{ x: 40, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -40, opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="flex flex-nowrap gap-8"
                                >
                                    {visible.map((m, idx) => (
                                        <div
                                            key={idx}
                                            className="relative flex-shrink-0 flex flex-col items-center"
                                        >
                                            {/* Poster */}
                                            <div
                                                className="relative z-10 w-32 sm:w-40 md:w-48 cursor-pointer group"
                                                onClick={() => onOpen(m)}
                                            >
                                                <img
                                                    src={m.image || m.titleImage || "/images/user.png"}
                                                    alt={m.name}
                                                    className="rounded-xl w-full h-48 sm:h-56 md:h-64 object-cover shadow-lg transition-transform duration-300 group-hover:scale-105"
                                                />

                                                {/* Delete button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDelete(m);
                                                    }}
                                                    className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                                >
                                                    ✕
                                                </button>

                                                {/* Progress bar */}
                                                {m._progressPct != null && (
                                                    <div className="w-full mt-2 h-1 bg-white/20 rounded">
                                                        <div
                                                            className="h-full bg-subMain rounded"
                                                            style={{ width: `${m._progressPct}%` }}
                                                        ></div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Title */}
                                            <div
                                                className="mt-3 text-center truncate max-w-[160px]"
                                                title={m.name}
                                            >
                                                {m.name}
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Next */}
                        <button
                            onClick={() => setOffset((o) => Math.min(o + 1, maxOffset))}
                            disabled={offset === maxOffset}
                            className="hidden md:flex w-11 h-11 rounded-full flex-colo bg-black/50 hover:bg-black/70 text-white disabled:opacity-40"
                        >
                            ▶
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
