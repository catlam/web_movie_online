import React from "react";
import Loader from "../Notifications/Loader";
import Titles from "../Titles";
import { Link } from "react-router-dom";
import { BsCollectionFill } from "react-icons/bs";

function SeasonEpisodePicker({
    seasons = [],
    episodes = [],
    isSeasonsLoading = false,
    isEpisodesLoading = false,
    errorText = "",
    activeSeasonId,
    onChangeSeason,
}) {
    return (
        <div className="mt-6">
            {/* Season selector */}
            <div className="flex items-center gap-3">
                <label className="text-sm text-border">Season</label>
                <select
                    className="bg-main border border-border rounded-lg px-3 py-2 text-sm outline-none"
                    value={activeSeasonId || ""}
                    onChange={(e) => onChangeSeason?.(e.target.value)}
                >
                    {seasons?.map((s) => (
                        <option key={s._id} value={s._id}>
                            {s.name || `Season ${s.seasonNumber || ""}`}
                        </option>
                    ))}
                </select>
            </div>

            {/* Episodes */}
            <div className="mt-6">
                <Titles title="Episodes" Icon={BsCollectionFill} />
                {isEpisodesLoading ? (
                    <div className="w-full flex justify-center py-10">
                        <Loader />
                    </div>
                ) : errorText ? (
                    <p className="text-red-400 text-sm mt-4">{String(errorText)}</p>
                ) : episodes?.length > 0 ? (
                    <div className="grid sm:mt-6 mt-4 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">
                        {episodes.map((ep) => (
                            <EpisodeCard key={ep._id} ep={ep} />
                        ))}
                    </div>
                ) : (
                    <p className="text-border text-sm mt-4">No episodes.</p>
                )}
            </div>
        </div>
    );
}

function EpisodeCard({ ep }) {
    const { _id, episodeNumber, title, desc, duration, releaseDate } = ep || {};
    const minutes = duration ? Math.round(duration / 60) : null;

    return (
        <div className="group rounded-xl overflow-hidden bg-neutral-900/70 hover:bg-neutral-900 transition p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-white font-semibold">
                        E{episodeNumber}: {title}
                    </p>
                    {releaseDate ? (
                        <p className="text-xs text-neutral-400 mt-0.5">
                            {new Date(releaseDate).toLocaleDateString()}
                        </p>
                    ) : null}
                </div>
                {minutes ? (
                    <span className="text-xs rounded bg-white/10 px-2 py-0.5">
                        {minutes} min
                    </span>
                ) : null}
            </div>
            {desc ? (
                <p className="text-sm text-neutral-300 mt-2 line-clamp-3">{desc}</p>
            ) : null}

            {/* Điều hướng tới player của bạn (thay URL nếu khác) */}
            <div className="mt-3">
                <Link
                    to={`/watch/episode/${_id}`}
                    className="text-xs inline-flex items-center rounded-lg bg-subMain px-3 py-1.5 text-white hover:opacity-90"
                >
                    Watch
                </Link>
            </div>
        </div>
    );
}

export default SeasonEpisodePicker;
