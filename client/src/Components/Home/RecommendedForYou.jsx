// src/Components/Home/RecommendedForYou.jsx
import React, { useEffect, useMemo, useState } from "react";
import Titles from "../Titles";
import { BsCollectionFill } from "react-icons/bs";
import { TbPlayerTrackNext, TbPlayerTrackPrev, TbX } from "react-icons/tb";
import Movie from "../Movie";
import SeriesCard from "../SeriesCard";
import { Empty } from "../Notifications/empty";
import Loader from "../Notifications/Loader";
import { AnimatePresence, motion } from "framer-motion";
import AxiosReco from "../../Redux/APIs/AxiosReco";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";

import { FaHeart } from "react-icons/fa";
import { IfMovieLiked, LikeMovie } from "../../Context/Functionalities";

/* -------------------- Helpers -------------------- */
function readUserId() {
    try {
        const raw = localStorage.getItem("userInfo");
        if (!raw) return null;
        const u = JSON.parse(raw);
        return u?._id || u?.id || u?.userId || null;
    } catch {
        return null;
    }
}

function normalizeReco(it) {
    const kind = it.kind === "series" ? "series" : "movie";
    const cats = Array.isArray(it.category) ? it.category : it.category ? [it.category] : [];

    return {
        _id: it.movieId,
        kind,
        __kind: kind, // ✅ để LikeMovie nhận ra series/movie
        title: it.title || it.name || "Untitled",
        image: it.posterUrl || it.image || it.titleImage || "",
        posterUrl: it.posterUrl || "",
        titleImage: it.titleImage || "",
        year: it.year,
        rate: typeof it.rate === "number" ? it.rate : undefined,
        category: cats[0] || (kind === "series" ? "SERIES" : "MOVIE"),
        genres: cats.map((x) => String(x || "")),
    };
}

function rerankByRecentGenres(cards, recentGenres = []) {
    if (!recentGenres.length) return cards;

    const pref = new Set(recentGenres.map((g) => (g || "").toLowerCase().trim()));

    return [...cards]
        .map((c) => {
            const gs = (c.genres || []).map((x) => (x || "").toLowerCase().trim());
            let overlap = 0;
            gs.forEach((g) => {
                if (g && pref.has(g)) overlap++;
            });
            return { c, boost: overlap * 10 };
        })
        .sort((a, b) => b.boost - a.boost)
        .map((x) => x.c);
}

/* ====================================================== */
/* =============   MAIN COMPONENT START   =============== */
/* ====================================================== */

export default function RecommendedForYou({
    pageSize = 5,
    limit = 24,
    titleWhenPersonalized = "Recommended for you",
    titleWhenCold = "Trending for you",
    className = "",
    userId: userIdProp,
    hideWhenNoUser = true,
    hideWhenColdStart = true,
    hideWhenEmpty = true,
}) {
    const [items, setItems] = useState([]);
    const [cold, setCold] = useState(false);
    const [loading, setLoading] = useState(false);

    const dispatch = useDispatch();
    const { isLoading: likeLoading } = useSelector((s) => s.userLikeMovie);
    const { userInfo } = useSelector((s) => s.userLogin);

    /* Redux states */
    const favState = useSelector((s) => s.userGetFavoriteMovies || {});
    const favorites = Array.isArray(favState.favorites)
        ? favState.favorites
        : Array.isArray(favState.likedMovies)
            ? favState.likedMovies
            : [];

    const historyState = useSelector((s) => s.userWatchHistory || {});
    const recentHistory = Array.isArray(historyState.items) ? historyState.items : [];

    const recentGenres = useMemo(() => {
        const arr = [];
        for (const h of recentHistory.slice(0, 10)) {
            if (Array.isArray(h.category)) arr.push(...h.category);
            else if (h.category) arr.push(h.category);

            if (Array.isArray(h.genres)) arr.push(...h.genres);
        }
        return arr;
    }, [recentHistory]);

    const userId = userIdProp || readUserId();

    /* ---------------- Slider logic ---------------- */
    const itemsPerView = pageSize;
    const [offset, setOffset] = useState(0);
    const [direction, setDirection] = useState(1);

    useEffect(() => {
        setOffset(0);
    }, [items.length]);

    const maxOffset = Math.max(0, items.length - itemsPerView);
    const visibleItems = items.slice(offset, offset + itemsPerView);

    const handlePrevRow = () => {
        if (offset === 0) return;
        setDirection(-1);
        setOffset((prev) => Math.max(prev - 1, 0));
    };

    const handleNextRow = () => {
        if (offset === maxOffset) return;
        setDirection(1);
        setOffset((prev) => Math.min(prev + 1, maxOffset));
    };

    /* ---------------- Modal ---------------- */
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (isModalOpen) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = prev;
            };
        }
    }, [isModalOpen]);

    /* ---------------- Fetch Data ---------------- */
    useEffect(() => {
        let mounted = true;

        if (!userId) {
            setItems([]);
            setCold(false);
            return;
        }

        (async () => {
            setLoading(true);
            try {
                const res = await AxiosReco.get(`/recommend/user/${userId}`, {
                    params: { n: limit },
                });

                if (!mounted) return;

                const data = res?.data || {};
                const list = Array.isArray(data.items) ? data.items : [];

                const normalized = list.map(normalizeReco);
                const ranked = rerankByRecentGenres(normalized, recentGenres);

                setItems(ranked);
                setCold(!!(data.cold_start || data.fallback));
                setOffset(0);
            } catch (e) {
                if (mounted) {
                    setItems([]);
                    setCold(false);
                }
            } finally {
                mounted && setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [userId, limit, recentGenres.join("|"), favorites.length]);

    /* ---------------- Should Hide ---------------- */
    const shouldHide =
        (hideWhenNoUser && !userId) ||
        (hideWhenColdStart && !loading && cold) ||
        (hideWhenEmpty && !loading && items.length === 0);

    if (shouldHide) return null;

    const title = cold ? titleWhenCold : titleWhenPersonalized;

    const isLiked = (card) => IfMovieLiked({ ...card, __kind: card.kind });

    const handleLike = (e, card) => {
        e.preventDefault();
        e.stopPropagation();
        LikeMovie({ ...card, __kind: card.kind }, dispatch, userInfo);
    };

    return (
        <div className={`my-16 relative ${className}`}>
            {/* Title + More */}
            <div className="flex items-center justify-between gap-4">
                <Titles title={title} Icon={BsCollectionFill} />

                {items.length > 0 && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-sm md:text-base text-subMain hover:text-white border border-subMain px-4 py-1.5 rounded-full font-semibold transitions"
                    >
                        More
                    </button>
                )}
            </div>

            {loading ? (
                <Loader />
            ) : items.length > 0 ? (
                <>
                    {/* ROW */}
                    <div className="mt-10 flex items-center justify-center gap-6">
                        {/* Prev */}
                        <button
                            onClick={handlePrevRow}
                            disabled={offset === 0}
                            className="
                hidden md:flex
                w-11 h-11 rounded-full flex-colo
                bg-black/40 hover:bg-black/70 text-white
                disabled:opacity-40 disabled:cursor-not-allowed
              "
                        >
                            <TbPlayerTrackPrev className="text-2xl" />
                        </button>

                        {/* Slide Row */}
                        <div className="overflow-hidden max-w-6xl">
                            <motion.div
                                key={offset}
                                initial={{ x: direction > 0 ? 40 : -40, opacity: 0.9 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="flex flex-nowrap gap-8"
                            >
                                {visibleItems.map((card, index) => {
                                    const realIndex = offset + index;
                                    const rank = realIndex + 1;

                                    const linkTo =
                                        card.kind === "series" ? `/series/${card._id}` : `/movie/${card._id}`;

                                    return (
                                        <div
                                            key={card._id || realIndex}
                                            className="relative flex-shrink-0 flex flex-col items-center justify-start"
                                        >
                                            <span
                                                className="
                          absolute
                          -left-4
                          bottom-0 translate-y-1/3
                          text-[80px] sm:text-[100px] md:text-[120px]
                          font-black text-white/10
                          select-none pointer-events-none
                        "
                                            >
                                                {rank}
                                            </span>

                                            <div className="relative z-10 w-32 sm:w-40 md:w-48">
                                                {/* Poster wrapper */}
                                                <div className="relative rounded-xl overflow-hidden shadow-lg">
                                                    <Link to={linkTo}>
                                                        <img
                                                            src={card.image || card.posterUrl || card.titleImage || "/images/user.png"}
                                                            alt={card.title}
                                                            className="w-full h-48 sm:h-56 md:h-64 object-cover
                                transition-transform duration-300 hover:scale-105"
                                                        />
                                                    </Link>

                                                    {/* Heart */}
                                                    <button
                                                        onClick={(e) => handleLike(e, card)}
                                                        disabled={isLiked(card) || likeLoading}
                                                        className={`
                              absolute top-2 right-2
                              w-8 h-8 flex-colo rounded-full text-xs
                              transition
                              ${isLiked(card)
                                                                ? "bg-subMain text-white"
                                                                : "bg-black/60 hover:bg-subMain text-white"
                                                            }
                            `}
                                                        title={isLiked(card) ? "Liked" : "Like"}
                                                    >
                                                        <FaHeart />
                                                    </button>
                                                </div>

                                                {/* Info */}
                                                <div className="mt-3 text-center space-y-1">
                                                    <Link
                                                        to={linkTo}
                                                        className="block text-sm md:text-base font-semibold truncate max-w-[180px]"
                                                        title={card.title}
                                                    >
                                                        {card.title}
                                                    </Link>

                                                    <div className="flex items-center justify-center gap-1 text-star text-xs md:text-sm">
                                                        {typeof card.rate === "number" && (
                                                            <>
                                                                <span>⭐</span>
                                                                <span>{card.rate.toFixed(1)}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </motion.div>
                        </div>

                        {/* Next */}
                        <button
                            onClick={handleNextRow}
                            disabled={offset === maxOffset}
                            className="
                hidden md:flex
                w-11 h-11 rounded-full flex-colo
                bg-black/40 hover:bg-black/70 text-white
                disabled:opacity-40 disabled:cursor-not-allowed
              "
                        >
                            <TbPlayerTrackNext className="text-2xl" />
                        </button>
                    </div>

                    {/* MODAL */}
                    <AnimatePresence>
                        {isModalOpen && (
                            <motion.div
                                className="
                  fixed inset-0
                  z-[9999]
                  bg-black/70
                  flex items-start justify-center
                  pt-10
                "
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsModalOpen(false)}
                            >
                                <motion.div
                                    className="
                    bg-main
                    w-full max-w-6xl
                    max-h-[80vh]
                    rounded-xl
                    overflow-hidden
                    flex flex-col
                    border border-border
                  "
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                        <h3 className="text-base md:text-lg font-semibold text-white">
                                            All Recommendations
                                        </h3>
                                        <button
                                            onClick={() => setIsModalOpen(false)}
                                            className="w-8 h-8 flex-colo rounded-full hover:bg-white/10 text-white"
                                        >
                                            <TbX className="text-xl" />
                                        </button>
                                    </div>

                                    <div className="p-4 overflow-y-auto overflow-x-hidden">
                                        {items.length > 0 ? (
                                            <div className="grid xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">
                                                {items.map((card, index) =>
                                                    card.kind === "series" ? (
                                                        <SeriesCard key={card._id || index} series={card} />
                                                    ) : (
                                                        <Movie key={card._id || index} movie={card} />
                                                    )
                                                )}
                                            </div>
                                        ) : (
                                            <Empty message="It seems like we don’t have any recommendations yet." />
                                        )}
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            ) : (
                <div className="mt-6">
                    <Empty message="It seems like we don't have any recommendations yet." />
                </div>
            )}
        </div>
    );
}




