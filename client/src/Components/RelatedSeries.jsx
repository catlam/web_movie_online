import React, { useMemo, useState } from "react";
import Titles from "./Titles";
import { BsCollectionFill } from "react-icons/bs";
import { TbPlayerTrackNext, TbPlayerTrackPrev } from "react-icons/tb";
import SeriesCard from "./SeriesCard";
import { Empty } from "./Notifications/empty";
import Loader from "./Notifications/Loader";
import { AnimatePresence, motion } from "framer-motion";

function normalizeStr(v) {
    return (v ?? "").toString().toLowerCase().trim();
}
function asArray(v) {
    return Array.isArray(v) ? v : v ? [v] : [];
}
function scoreSeries(base, cand) {
    let score = 0;

    // category / genre
    const baseCat = normalizeStr(base.category || base.genre);
    const candCat = normalizeStr(cand.category || cand.genre);
    if (baseCat && candCat && baseCat === candCat) score += 100;

    // tags / genres overlap
    const baseTags = new Set(
        asArray(base.tags || base.genres).map((t) => normalizeStr(t))
    );
    const candTags = new Set(
        asArray(cand.tags || cand.genres).map((t) => normalizeStr(t))
    );
    let tagBonus = 0;
    baseTags.forEach((t) => {
        if (t && candTags.has(t)) tagBonus += 5;
    });
    score += tagBonus;

    // language
    const baseLang = normalizeStr(base.language);
    const candLang = normalizeStr(cand.language);
    if (baseLang && candLang && baseLang === candLang) score += 2;

    // quality bonus
    const rate =
        typeof cand.rate === "number"
            ? cand.rate
            : typeof cand.rating === "number"
                ? cand.rating
                : 0;
    const nrev =
        typeof cand.numberOfReviews === "number"
            ? cand.numberOfReviews
            : Array.isArray(cand.reviews)
                ? cand.reviews.length
                : 0;
    score += rate * 1.5 + Math.min(nrev, 10) * 0.5;

    return score;
}

function RelatedSeries({ baseSeries, allSeries = [], isLoading, pageSize = 8, title = "Related Series" }) {
    const [page, setPage] = useState(1);

    const baseId = baseSeries?._id;

    const related = useMemo(() => {
        if (!baseSeries || !Array.isArray(allSeries) || allSeries.length === 0)
            return [];

        // loại chính nó + object null
        const pool = allSeries.filter((s) => s && s._id && s._id !== baseId);

        // Tính điểm ưu tiên
        const scored = pool
            .map((s) => ({ s, score: scoreSeries(baseSeries, s) }))
            .filter((x) => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .map((x) => x.s);

        // Fallback 1: nếu rỗng → cố gắng lấy cùng category
        if (scored.length === 0) {
            const baseCat = normalizeStr(baseSeries.category || baseSeries.genre);
            const sameCat = pool
                .filter((s) => normalizeStr(s.category || s.genre) === baseCat)
                .sort((a, b) => {
                    const ra =
                        typeof a.rate === "number"
                            ? a.rate
                            : Array.isArray(a.reviews)
                                ? a.reviews.length
                                : 0;
                    const rb =
                        typeof b.rate === "number"
                            ? b.rate
                            : Array.isArray(b.reviews)
                                ? b.reviews.length
                                : 0;
                    return rb - ra;
                });
            if (sameCat.length > 0) return sameCat;
        }

        // Fallback 2: top theo rate toàn bộ (đảm bảo có gì đó để hiển thị)
        if (scored.length === 0) {
            const topAll = [...pool].sort((a, b) => {
                const ra =
                    typeof a.rate === "number"
                        ? a.rate
                        : Array.isArray(a.reviews)
                            ? a.reviews.length
                            : 0;
                const rb =
                    typeof b.rate === "number"
                        ? b.rate
                        : Array.isArray(b.reviews)
                            ? b.reviews.length
                            : 0;
                return rb - ra;
            });
            return topAll;
        }

        return scored;
    }, [allSeries, baseSeries, baseId]);

    // Debug giúp bạn thấy lý do rỗng
    if (process.env.NODE_ENV !== "production") {
        console.debug("[RelatedSeries] baseSeries=", {
            id: baseSeries?._id,
            name: baseSeries?.name || baseSeries?.title,
            category: baseSeries?.category || baseSeries?.genre,
            tags: baseSeries?.tags || baseSeries?.genres,
            language: baseSeries?.language,
        });
        console.debug("[RelatedSeries] pool size=", allSeries?.length || 0, "related size=", related.length);
    }

    const totalPages = Math.max(1, Math.ceil(related.length / pageSize));
    const start = (page - 1) * pageSize;
    const current = related.slice(start, start + pageSize);

    const sameClass =
        "text-white py-2 px-4 rounded font-semibold border-2 border-subMain hover:bg-subMain disabled:opacity-40 disabled:cursor-not-allowed";

    const nextPage = () => setPage((p) => Math.min(p + 1, totalPages));
    const prevPage = () => setPage((p) => Math.max(p - 1, 1));

    const variants = {
        enter: { opacity: 0, y: 20 },
        center: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
    };

    return (
        <div className="my-16 relative">
            <Titles title={title} Icon={BsCollectionFill} />

            {isLoading ? (
                <Loader />
            ) : related.length > 0 ? (
                <>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={page}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.25 }}
                            className="grid sm:mt-12 mt-6 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-10"
                        >
                            {current.map((s, idx) => (
                                <SeriesCard key={s._id || idx} series={s} />
                            ))}
                        </motion.div>
                    </AnimatePresence>

                    <div className="flex justify-center items-center gap-6 mt-10">
                        <button onClick={prevPage} disabled={page === 1} className={sameClass}>
                            <TbPlayerTrackPrev className="text-xl" />
                        </button>
                        <span className="text-white text-sm">
                            Page <b>{page}</b> / {totalPages}
                        </span>
                        <button
                            onClick={nextPage}
                            disabled={page === totalPages}
                            className={sameClass}
                        >
                            <TbPlayerTrackNext className="text-xl" />
                        </button>
                    </div>
                </>
            ) : (
                <div className="mt-6">
                    <Empty message="We couldn't find related series for this title." />
                </div>
            )}
        </div>
    );
}

export default RelatedSeries;
