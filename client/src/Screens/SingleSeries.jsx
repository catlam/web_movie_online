import React, { useEffect, useMemo, useState } from "react";
import Layout from "../Layout/Layout";
import { useParams, useNavigate } from "react-router-dom";
import Titles from '../Components/Titles';
import Loader from "../Components/Notifications/Loader";
import { BsCollectionFill } from "react-icons/bs";
import { RiMovie2Line } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import ShareMovieModal from "../Components/Modals/ShareModal";
import MovieCasts from "../Components/Single/MovieCasts";

// actions
import {
    getSeriesDetailsAction,
    listSeasonsBySeriesAction,
} from "../Redux/Actions/seriesActions";
import { listEpisodesBySeasonAction } from "../Redux/Actions/seasonActions";

import SeriesInfo from "../Components/Single/SeriesInfo";
import SeasonEpisodePicker from "../Components/Single/SeasonEpisodePicker";
import SeriesRates from "../Components/Single/SeriesRates";

function SingleSeries() {
    const { id: seriesId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const sameClass = "w-full gap-6 flex-colo min-h-screen";
    const [modalOpen, setModalOpen] = useState(false);

    // series detail
    const {
        loading: seriesLoading,
        error: seriesError,
        series,
    } = useSelector((s) => s.seriesDetails || {});

    // seasons of this series
    const {
        loading: seasonsLoading,
        error: seasonsError,
        seasons = [],
    } = useSelector((s) => s.seasonListBySeries || {});

    // episodes of active season
    const {
        loading: episodesLoading,
        error: episodesError,
        episodes = [],
    } = useSelector((s) => s.episodeListBySeason || {});

    const [activeSeasonId, setActiveSeasonId] = useState("");

    // fetch series + seasons
    useEffect(() => {
        if (!seriesId) return;
        dispatch(getSeriesDetailsAction(seriesId));
        dispatch(listSeasonsBySeriesAction(seriesId));
    }, [dispatch, seriesId]);

    // chọn season đầu tiên khi seasons về
    useEffect(() => {
        if (seasons.length > 0) {
            const first = [...seasons].sort(
                (a, b) => (a.seasonNumber || 0) - (b.seasonNumber || 0)
            )[0];
            if (!activeSeasonId || !seasons.find((s) => s._id === activeSeasonId)) {
                setActiveSeasonId(first?._id || "");
            }
        }
    }, [seasons, activeSeasonId]);

    // fetch episodes theo season
    useEffect(() => {
        if (activeSeasonId) dispatch(listEpisodesBySeasonAction(activeSeasonId));
    }, [dispatch, activeSeasonId]);

    const headerRight = useMemo(() => {
        const totalSeasons = seasons?.length || 0;
        const totalEpisodes = episodes?.length || 0;
        return `Seasons: ${totalSeasons} • Episodes: ${totalEpisodes}`;
    }, [seasons, episodes]);

    const busy =
        seriesLoading || seasonsLoading || (!activeSeasonId && seasons.length > 0);
    const fatalError = seriesError;
    const listError = seasonsError || episodesError;

    const mappedSeries = series
        ? {
            ...series,
            title: series.name ?? series.title,
            casts: Array.isArray(series.casts) ? series.casts : [],
            reviews: Array.isArray(series.reviews) ? series.reviews : [],
            numberOfReviews:
                typeof series.numberOfReviews === "number"
                    ? series.numberOfReviews
                    : series?.reviews?.length || 0,
            rate: typeof series.rate === "number" ? series.rate : 0,
        }
        : null;

    const handlePlayFirst = () => {
        if (episodes?.length > 0) {
            const firstEp = [...episodes].sort(
                (a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0)
            )[0];
            if (firstEp?._id) {
                return navigate(`/watch/episode/${firstEp._id}`);
            }
        }
        const el = document.getElementById("season-episode-picker");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <Layout>
            {busy ? (
                <div className={sameClass}>
                    <Loader />
                </div>
            ) : fatalError ? (
                <div className={sameClass}>
                    <div className="flex-colo w-24 h-24 p-5 mb-4 rounded-full bg-dry text-subMain text-4xl">
                        <RiMovie2Line />
                    </div>
                    <p className="text-border text-sm">Something went wrong</p>
                </div>
            ) : (
                <>
                    {/* Share */}
                    <ShareMovieModal
                        modalOpen={modalOpen}
                        setModalOpen={setModalOpen}
                        movie={mappedSeries}
                    />

                    <SeriesInfo series={series || {}} onPlayFirst={handlePlayFirst} />

                    <div className="container mx-auto min-h-screen px-2 py-6">
                        {/* Casts */}
                        <MovieCasts movie={mappedSeries} />

                        {/* Seasons & Episodes */}
                        <div className="mt-12" id="season-episode-picker">
                            <SeasonEpisodePicker
                                seasons={seasons}
                                episodes={episodes}
                                isSeasonsLoading={seasonsLoading}
                                isEpisodesLoading={episodesLoading}
                                errorText={listError}
                                activeSeasonId={activeSeasonId}
                                onChangeSeason={setActiveSeasonId}
                            />
                        </div>


                        {/* Rates */}
                        <SeriesRates series={mappedSeries} seriesId={seriesId} />
                    </div>
                </>
            )}
        </Layout>
    );
}

export default SingleSeries;
