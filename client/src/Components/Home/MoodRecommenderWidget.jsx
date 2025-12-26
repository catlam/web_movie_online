// src/Components/Home/MoodRecommenderWidget.jsx
import React, { useState } from "react";
import { BsEmojiSmile } from "react-icons/bs";
import { IoMdClose } from "react-icons/io";
import Axios from "../../Redux/APIs/Axios"; 
import { useNavigate } from "react-router-dom";

function normalizeItem(it) {
    const kind =
        it.kind === "Series" || it.kind === "series" ? "series" : "movie";

    const cats = Array.isArray(it.category)
        ? it.category
        : it.category
            ? [it.category]
            : [];

    return {
        _id: it.movieId || it._id,
        kind,
        title: it.title || it.name || "Untitled",
        posterUrl: it.posterUrl || it.image || it.titleImage || "",
        year: it.year,
        rate: typeof it.rate === "number" ? it.rate : undefined,
        category: cats[0] || (kind === "series" ? "SERIES" : "MOVIE"),
        language: it.language || "",
    };
}

export default function MoodRecommenderWidget() {
    const [open, setOpen] = useState(false);
    const [mood, setMood] = useState("");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const toggleOpen = () => {
        setOpen((v) => !v);
        // mỗi lần mở lại, không reset kết quả (cho user xem lại)
        // nếu muốn reset thì uncomment:
        // if (!open) { setItems([]); setMood(""); setError(""); setTouched(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setTouched(true);
        setError("");

        const q = (mood || "").trim();
        if (!q) {
            setItems([]);
            return;
        }

        try {
            setLoading(true);
            // backend Node: /api/reco/smart-search?query=...
            const res = await Axios.get("/reco/smart-search", {
                params: { mood: q },
            });

            const data = res?.data || {};
            const list = Array.isArray(data.items) ? data.items : [];
            const normalized = list.map(normalizeItem);
            setItems(normalized);
        } catch (err) {
            // console.error("[MoodRecommender] error:", err?.message || err);
            setError("Oops, something went wrong. Try another mood?");
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const onKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            handleSubmit(e);
        }
    };

    const goDetail = (card) => {
        if (!card?._id) return;
        if (card.kind === "series") {
            navigate(`/series/${card._id}`);
        } else {
            navigate(`/movie/${card._id}`);
        }
    };

    return (
        <>
            {/* Panel chính */}
            {open && (
                <div className="fixed bottom-20 right-4 w-80 sm:w-96 bg-main border border-subMain rounded-2xl shadow-xl z-40 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-subMain/60">
                        <div>
                            <p className="text-sm text-gray-300">Mood recommender</p>
                            <h3 className="text-base font-semibold text-white">
                                What&apos;s your mood today?
                            </h3>
                        </div>
                        <button
                            onClick={toggleOpen}
                            className="p-1 rounded-full hover:bg-white/10 text-gray-300"
                        >
                            <IoMdClose className="text-lg" />
                        </button>
                    </div>

                    {/* Input */}
                    <form
                        onSubmit={handleSubmit}
                        className="px-4 pt-3 pb-2 flex gap-2 items-stretch"
                    >
                        <input
                            type="text"
                            value={mood}
                            onChange={(e) => setMood(e.target.value)}
                            onKeyDown={onKeyDown}
                            placeholder='Ex: "I want to watch Korean comedy"'
                            className="flex-1 bg-black/30 border border-subMain rounded-lg px-3 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-white"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-3 py-2 rounded-lg bg-subMain hover:bg-main border border-subMain text-xs md:text-sm font-semibold text-white whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Finding..." : "Find"}
                        </button>
                    </form>

                    {/* Lỗi */}
                    {error && (
                        <p className="px-4 text-xs text-red-400 pb-1">{error}</p>
                    )}

                    {/* Kết quả */}
                    <div className="px-3 pb-3">
                        {loading ? (
                            <div className="py-4">
                                <div className="flex justify-center">
                                    {/* Nếu Loader dùng full screen thì thôi, mình để text đơn giản */}
                                    <span className="text-xs text-gray-400">
                                        Loading recommendations...
                                    </span>
                                </div>
                            </div>
                        ) : items.length > 0 ? (
                            <div className="mt-2 max-h-72 overflow-y-auto space-y-2">
                                {items.map((card) => (
                                    <button
                                        key={card._id}
                                        onClick={() => goDetail(card)}
                                        className="w-full text-left flex gap-3 bg-black/40 hover:bg-black/60 rounded-xl p-2 transition"
                                    >
                                        <div className="w-12 h-16 flex-shrink-0 bg-gray-700 rounded-lg overflow-hidden">
                                            {card.posterUrl ? (
                                                <img
                                                    src={card.posterUrl}
                                                    alt={card.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                                                    No image
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <p className="text-xs font-semibold text-white line-clamp-2">
                                                    {card.title}
                                                </p>
                                                <p className="text-[11px] text-gray-400 mt-0.5">
                                                    {card.kind === "series" ? "Series" : "Movie"}
                                                    {card.category ? ` · ${card.category}` : ""}
                                                    {card.language ? ` · ${card.language}` : ""}
                                                </p>
                                            </div>
                                            {card.year || card.rate ? (
                                                <p className="text-[10px] text-gray-500 mt-1">
                                                    {card.year ? `Year: ${card.year}` : ""}
                                                    {card.year && card.rate ? " · " : ""}
                                                    {card.rate ? `Rating: ${card.rate.toFixed(1)}` : ""}
                                                </p>
                                            ) : null}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : touched ? (
                            <p className="mt-2 text-xs text-gray-400 px-1 pb-2">
                                No title matches that mood yet. Try different words (e.g.
                                &quot;romantic anime&quot;, &quot;Korean action&quot;).
                            </p>
                        ) : (
                            <p className="mt-2 text-xs text-gray-500 px-1 pb-2">
                                Tell me your vibe: &quot;sad but hopeful&quot;, &quot;funny
                                Korean drama&quot;, &quot;dark sci-fi&quot;, ...
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Nút tròn nổi góc phải dưới */}
            <button
                onClick={toggleOpen}
                className="fixed bottom-4 right-4 z-30 rounded-full shadow-lg bg-subMain hover:bg-main border border-subMain flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold"
            >
                <BsEmojiSmile className="text-lg" />
                <span className="hidden sm:inline">Mood</span>
            </button>
        </>
    );
}
