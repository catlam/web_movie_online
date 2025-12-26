import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../Layout/Layout";
import { Link, useParams, useLocation } from "react-router-dom";
import { BiArrowBack } from "react-icons/bi";
import { FaPlay } from "react-icons/fa";
import { RiMovie2Line } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import Loader from "../Components/Notifications/Loader";
import { getEpisodeDetailsAction } from "../Redux/Actions/episodeActions";
import { getPlaybackStateService, upsertWatchService } from "../Redux/APIs/watchAPI";
import useWatchReporter from "../Hooks/useWatchReporter";
import { loadYouTubeAPI } from "../utils/loadYouTubeAPI";

// ======== YouTube helper =========
const YT_REGEXES = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\s]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?&\s/]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?&\s/]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^?&\s/]+)/i,
];
function extractYoutubeId(url = "") {
    for (const re of YT_REGEXES) {
        const m = url.match(re);
        if (m?.[1]) return m[1];
    }
    return null;
}
function isYoutube(url = "") {
    return !!extractYoutubeId(url);
}
// ==================================

function WatchSeriesEpisode() {
    const { episodeId } = useParams();
    const dispatch = useDispatch();
    const location = useLocation();

    const videoRef = useRef(null);
    const seekedOnceRef = useRef(false);

    const [started, setStarted] = useState(false);
    const [resumeTime, setResumeTime] = useState(location.state?.resumeSeconds ?? 0);

    const sameClass = "w-full gap-6 flex-colo min-h-screen";

    const { userInfo } = useSelector((s) => s.userLogin || {});
    const {
        loading: epLoading = false,
        error: epError = null,
        episode = {},
    } = useSelector((s) => s.episodeDetails || {});

    // seriesId an toàn
    const seriesId = useMemo(() => {
        return episode?.seriesId?._id || episode?.seriesId || episode?.series?._id || null;
    }, [episode]);

    const currentSeason = episode?.seasonNumber ?? null;
    const currentEpisode = episode?.episodeNumber ?? null;
    const currentEpisodeId = episode?._id ?? null;

    // HTML5 progress (video tag)
    const { onPlay, onPause, onEnded } = useWatchReporter({
        seriesId,
        seasonNumber: currentSeason,
        episodeNumber: currentEpisode,
        episodeId: currentEpisodeId,
        videoRef,
        pingInterval: 10,
        sessionId: seriesId ? `${seriesId}-S${currentSeason}-E${currentEpisode}` : undefined,
    });

    const isDirectMedia = (url = "") => /\.(mp4|webm|ogg|m3u8)(\?.*)?$/i.test(url);
    const mediaUrl = episode?.video || "";

    const showHtml5 = isDirectMedia(mediaUrl);
    const showYouTube = !showHtml5 && isYoutube(mediaUrl);

    // YouTube player refs
    const ytDivRef = useRef(null);
    const ytPlayerRef = useRef(null);
    const ytPingTimerRef = useRef(null);

    // Reset trạng thái khi đổi tập/URL
    useEffect(() => {
        setStarted(false);
        seekedOnceRef.current = false;
    }, [episodeId, mediaUrl]);

    // Resume time từ API nếu không có từ location.state
    useEffect(() => {
        if (!seriesId || currentSeason == null || currentEpisode == null || resumeTime > 0) return;
        getPlaybackStateService({
            movieId: seriesId,
            seasonNumber: currentSeason,
            episodeNumber: currentEpisode,
        })
            .then((st) => {
                if (st?.lastPosition > 0) setResumeTime(Number(st.lastPosition));
            })
            .catch((err) => {
                console.error("[WatchSeriesEpisode] getPlaybackStateService error:", err);
            });
    }, [seriesId, currentSeason, currentEpisode, resumeTime]);

    // Episode details
    useEffect(() => {
        if (episodeId) dispatch(getEpisodeDetailsAction(episodeId));
    }, [dispatch, episodeId]);

    // HTML5 loaded metadata -> seek resume
    const handleLoadedMetadata = () => {
        const v = videoRef.current;
        if (!v) return;
        try {
            if (!seekedOnceRef.current && resumeTime > 0) {
                v.currentTime = resumeTime;
                seekedOnceRef.current = true;
            }
        } catch (err) {
            console.error("[WatchSeriesEpisode] handleLoadedMetadata error:", err);
        }
    };

    // Khởi tạo YouTube Player API khi là YouTube
    useEffect(() => {
        if (!showYouTube) return;

        let cancelled = false;

        (async () => {
            const YT = await loadYouTubeAPI();
            if (cancelled) return;

            const videoId = extractYoutubeId(mediaUrl);
            if (!videoId || !ytDivRef.current) return;

            // Destroy cũ nếu có
            if (ytPlayerRef.current?.destroy) {
                ytPlayerRef.current.destroy();
            }

            ytPlayerRef.current = new YT.Player(ytDivRef.current, {
                width: "100%",
                height: "100%",
                videoId,
                playerVars: {
                    autoplay: 0, // sẽ bấm nút overlay để play
                    rel: 0,
                    controls: 1,
                },
                events: {
                    onReady: () => {
                        // Seek đến resumeTime khi player sẵn sàng
                        if (!seekedOnceRef.current && resumeTime > 0) {
                            try {
                                ytPlayerRef.current.seekTo(Math.floor(resumeTime), true);
                                seekedOnceRef.current = true;
                            } catch (err) {
                                console.error("[WatchSeriesEpisode] YouTube seekTo error:", err);
                            }
                        }
                    },
                    onStateChange: async (ev) => {
                        const s = ev?.data;
                        if (s === YT.PlayerState.PLAYING) {
                            // gửi start 1 lần
                            if (seriesId) {
                                try {
                                    await upsertWatchService({
                                        movieId: seriesId,
                                        seasonNumber: currentSeason,
                                        episodeNumber: currentEpisode,
                                        event: "start",
                                        position: Number(ytPlayerRef.current?.getCurrentTime() || 0),
                                        duration: Number(ytPlayerRef.current?.getDuration() || 0),
                                        playedSeconds: 0,
                                    });
                                } catch (err) {
                                    console.error("[WatchSeriesEpisode] upsertWatchService start error:", err);
                                }
                            }

                            // ping định kỳ
                            if (ytPingTimerRef.current) clearInterval(ytPingTimerRef.current);
                            let lastSentAt = 0;
                            let lastPos = 0;
                            ytPingTimerRef.current = setInterval(async () => {
                                const p = ytPlayerRef.current;
                                if (!p) return;
                                const pos = Number(p.getCurrentTime() || 0);
                                const dur = Number(p.getDuration() || 0);
                                const now = Date.now();
                                const since = (now - lastSentAt) / 1000;
                                const inc = pos - lastPos;
                                if (since >= 10 && inc > 0.5) {
                                    lastSentAt = now;
                                    lastPos = pos;
                                    if (seriesId) {
                                        try {
                                            await upsertWatchService({
                                                movieId: seriesId,
                                                seasonNumber: currentSeason,
                                                episodeNumber: currentEpisode,
                                                event: "progress",
                                                position: pos,
                                                duration: dur,
                                                playedSeconds: inc,
                                            });
                                        } catch (err) {
                                            console.error("[WatchSeriesEpisode] upsertWatchService progress error:", err);
                                        }
                                    }
                                }
                            }, 1000);
                        } else if (s === YT.PlayerState.PAUSED) {
                            if (ytPingTimerRef.current) clearInterval(ytPingTimerRef.current);
                            // gửi 1 ping cuối
                            if (seriesId && ytPlayerRef.current) {
                                try {
                                    await upsertWatchService({
                                        movieId: seriesId,
                                        seasonNumber: currentSeason,
                                        episodeNumber: currentEpisode,
                                        event: "progress",
                                        position: Number(ytPlayerRef.current.getCurrentTime() || 0),
                                        duration: Number(ytPlayerRef.current.getDuration() || 0),
                                        playedSeconds: 0,
                                    });
                                } catch (err) {
                                    console.error("[WatchSeriesEpisode] upsertWatchService pause error:", err);
                                }
                            }
                        } else if (s === YT.PlayerState.ENDED) {
                            if (ytPingTimerRef.current) clearInterval(ytPingTimerRef.current);
                            if (seriesId) {
                                try {
                                    await upsertWatchService({
                                        movieId: seriesId,
                                        seasonNumber: currentSeason,
                                        episodeNumber: currentEpisode,
                                        event: "complete",
                                        position: Number(ytPlayerRef.current?.getDuration() || 0),
                                        duration: Number(ytPlayerRef.current?.getDuration() || 0),
                                        playedSeconds: 0,
                                    });
                                } catch (err) {
                                    console.error("[WatchSeriesEpisode] upsertWatchService complete error:", err);
                                }
                            }
                        }
                    },
                },
            });
        })();

        return () => {
            cancelled = true;
            if (ytPingTimerRef.current) clearInterval(ytPingTimerRef.current);
            if (ytPlayerRef.current?.destroy) ytPlayerRef.current.destroy();
            ytPlayerRef.current = null;
        };
    }, [showYouTube, mediaUrl, seriesId, currentSeason, currentEpisode, resumeTime]);

    // Nút Play
    const handleStart = () => {
        setStarted(true);

        // HTML5
        if (showHtml5 && videoRef.current) {
            const v = videoRef.current;
            if (v.readyState < 3) {
                const onCanPlay = () => {
                    v.removeEventListener("canplay", onCanPlay);
                    if (!seekedOnceRef.current && resumeTime > 0) {
                        v.currentTime = resumeTime;
                        seekedOnceRef.current = true;
                    }
                    v.play().catch((err) => console.error("[WatchSeriesEpisode] HTML5 play error:", err));
                };
                v.addEventListener("canplay", onCanPlay, { once: true });
            } else {
                if (!seekedOnceRef.current && resumeTime > 0) {
                    v.currentTime = resumeTime;
                    seekedOnceRef.current = true;
                }
                v.play().catch((err) => console.error("[WatchSeriesEpisode] HTML5 play error:", err));
            }
        }

        // YouTube: chỉ play, seek đã xử lý trong onReady
        if (showYouTube && ytPlayerRef.current) {
            try {
                ytPlayerRef.current.playVideo();
            } catch (err) {
                console.error("[WatchSeriesEpisode] YouTube play error:", err);
            }
        }
    };

    // Tiêu đề
    const heading = useMemo(() => {
        if (!episode) return "Episode";
        const epName =
            episode.title ||
            episode.name ||
            (episode.episodeNumber ? `Episode ${episode.episodeNumber}` : "Episode");
        return epName;
    }, [episode]);

    const backLink = seriesId ? `/series/${seriesId}` : "/series";

    return (
        <Layout>
            <div className="container mx-auto bg-dry p-6 mb-12">
                {!epError && (
                    <div className="flex-btn flex-wrap mb-6 gap-2 bg-main rounded border-gray-800 p-6">
                        <Link
                            to={backLink}
                            className="md:text-xl text-sm flex gap-3 items-center font-bold text-dryGray"
                            title="Back to series"
                        >
                            <BiArrowBack />
                            {heading}
                        </Link>
                    </div>
                )}

                {epLoading ? (
                    <div className={sameClass}>
                        <Loader />
                    </div>
                ) : epError ? (
                    <div className={sameClass}>
                        <div className="flex-colo w-24 h-24 p-5 mb-4 rounded-full bg-dry text-subMain text-4xl">
                            <RiMovie2Line />
                        </div>
                        <p className="text-border text-sm">{epError}</p>
                    </div>
                ) : (
                    <div className="w-full relative rounded-lg overflow-hidden">
                        {/* Player */}
                        {showHtml5 ? (
                            <div className="aspect-video relative">
                                <video
                                    ref={videoRef}
                                    controls
                                    playsInline
                                    className={`absolute inset-0 w-full h-full ${started ? "" : "opacity-0 pointer-events-none"}`}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onPlay={() => seriesId && onPlay()}
                                    onPause={() => seriesId && onPause()}
                                    onEnded={() => seriesId && onEnded()}
                                >
                                    <source src={mediaUrl} />
                                </video>
                            </div>
                        ) : showYouTube ? (
                            <div className="relative pt-[56.25%] rounded overflow-hidden">
                                <div
                                    ref={ytDivRef}
                                    className="absolute top-0 left-0 w-full h-full rounded"
                                />
                            </div>
                        ) : (
                            <div className="w-full flex-colo min-h-[300px] rounded border border-border">
                                <p className="text-sm text-border">
                                    Liên kết không phát được. Hãy dán link YouTube hợp lệ
                                    (ví dụ: https://www.youtube.com/watch?v=...) hoặc upload file .mp4/.webm.
                                </p>
                            </div>
                        )}

                        {/* Overlay Poster + Play */}
                        {!started && (showHtml5 || showYouTube) && (
                            <div className="absolute inset-0">
                                <img
                                    src={
                                        episode?.thumbnail ||
                                        episode?.image ||
                                        episode?.titleImage ||
                                        "/images/banner.png"
                                    }
                                    alt={heading}
                                    className="w-full h-full object-cover rounded-lg"
                                />
                                <div className="absolute inset-0 bg-main bg-opacity-30 flex-colo">
                                    <button
                                        onClick={handleStart}
                                        className="bg-white text-subMain flex-colo border border-subMain rounded-full w-20 h-20 font-medium text-xl"
                                        title="Play"
                                    >
                                        <FaPlay />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default WatchSeriesEpisode;