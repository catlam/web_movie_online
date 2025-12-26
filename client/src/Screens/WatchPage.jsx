import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import Layout from "../Layout/Layout";
import { BiArrowBack } from "react-icons/bi";
import { FaCloudDownloadAlt, FaHeart, FaPlay } from "react-icons/fa";
import { RiMovie2Line } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import Loader from "../Components/Notifications/Loader";
import { getMovieByIdAction } from "../Redux/Actions/MoviesActions";
import { IfMovieLiked, LikeMovie } from "../Context/Functionalities";
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

function WatchPage() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const location = useLocation();

    const videoRef = useRef(null);
    const seekedOnceRef = useRef(false);

    const [started, setStarted] = useState(false);
    const [resumeTime, setResumeTime] = useState(
        location.state?.resumeSeconds ?? 0
    );

    const sameClass = "w-full gap-6 flex-colo min-h-screen";

    const { isLoading, isError, movie } = useSelector(
        (state) => state.getMovieById
    );
    const { isLoading: likeLoading } = useSelector(
        (state) => state.userLikeMovie
    );
    const { userInfo } = useSelector((state) => state.userLogin);

    const isLiked = (m) => IfMovieLiked(m);

    // URL video từ movie
    const mediaUrl = movie?.video || "";

    const isDirectMedia = (url = "") =>
        /\.(mp4|webm|ogg|m3u8)(\?.*)?$/i.test(url);

    const showHtml5 = isDirectMedia(mediaUrl);
    const showYouTube = !showHtml5 && isYoutube(mediaUrl);

    // HTML5 progress reporter
    const { onPlay, onPause, onEnded } = useWatchReporter({
        movieId: id,
        videoRef,
        pingInterval: 10,
    });

    // Resume từ API nếu chưa có resumeTime
    useEffect(() => {
        if (!id || !userInfo?.token || resumeTime > 0) return;

        getPlaybackStateService({ movieId: id })
            .then((st) => {
                if (st?.lastPosition > 0) {
                    setResumeTime(Number(st.lastPosition));
                }
            })
            .catch((err) => {
                console.error("[WatchPage] getPlaybackStateService error:", err);
            });
    }, [id, userInfo?.token, resumeTime]);

    // Load movie details
    useEffect(() => {
        if (id) dispatch(getMovieByIdAction(id));
    }, [dispatch, id]);

    // HTML5 loadedmetadata -> seek resume
    const handleLoadedMetadata = async () => {
        const v = videoRef.current;
        if (!v) return;

        try {
            if (!seekedOnceRef.current && resumeTime > 0) {
                v.currentTime = resumeTime;
                seekedOnceRef.current = true;
            }
            await v.play();
            onPlay();
        } catch (e) {
            console.error("[WatchPage] handleLoadedMetadata error:", e);
        }
    };

    // Reset khi đổi movie / link
    useEffect(() => {
        setStarted(false);
        seekedOnceRef.current = false;
    }, [id, mediaUrl]);

    // ===== YouTube player setup =====
    const ytDivRef = useRef(null);
    const ytPlayerRef = useRef(null);
    const ytPingTimerRef = useRef(null);

    useEffect(() => {
        if (!showYouTube) return;

        let cancelled = false;

        (async () => {
            const YT = await loadYouTubeAPI();
            if (cancelled) return;

            const videoId = extractYoutubeId(mediaUrl);
            if (!videoId || !ytDivRef.current) return;

            // destroy cũ
            if (ytPlayerRef.current?.destroy) {
                ytPlayerRef.current.destroy();
            }

            ytPlayerRef.current = new YT.Player(ytDivRef.current, {
                width: "100%",
                height: "100%",
                videoId,
                playerVars: {
                    autoplay: 0,
                    rel: 0,
                    controls: 1,
                },
                events: {
                    onReady: () => {
                        if (!seekedOnceRef.current && resumeTime > 0) {
                            try {
                                ytPlayerRef.current.seekTo(
                                    Math.floor(resumeTime),
                                    true
                                );
                                seekedOnceRef.current = true;
                            } catch (err) {
                                console.error(
                                    "[WatchPage] YouTube seekTo error:",
                                    err
                                );
                            }
                        }
                    },
                    onStateChange: async (ev) => {
                        const s = ev?.data;
                        if (!ytPlayerRef.current) return;

                        if (s === YT.PlayerState.PLAYING) {
                            // gửi start 1 lần
                            if (id) {
                                try {
                                    await upsertWatchService({
                                        movieId: id,
                                        event: "start",
                                        position: Number(
                                            ytPlayerRef.current.getCurrentTime() || 0
                                        ),
                                        duration: Number(
                                            ytPlayerRef.current.getDuration() || 0
                                        ),
                                        playedSeconds: 0,
                                    });
                                } catch (err) {
                                    console.error(
                                        "[WatchPage] upsertWatchService start error:",
                                        err
                                    );
                                }
                            }

                            // ping progress mỗi 10s nếu có tiến
                            if (ytPingTimerRef.current)
                                clearInterval(ytPingTimerRef.current);

                            let lastSentAt = 0;
                            let lastPos = 0;
                            ytPingTimerRef.current = setInterval(async () => {
                                if (!ytPlayerRef.current) return;
                                const pos = Number(
                                    ytPlayerRef.current.getCurrentTime() || 0
                                );
                                const dur = Number(
                                    ytPlayerRef.current.getDuration() || 0
                                );
                                const now = Date.now();
                                const since = (now - lastSentAt) / 1000;
                                const inc = pos - lastPos;
                                if (since >= 10 && inc > 0.5) {
                                    lastSentAt = now;
                                    lastPos = pos;
                                    if (id) {
                                        try {
                                            await upsertWatchService({
                                                movieId: id,
                                                event: "progress",
                                                position: pos,
                                                duration: dur,
                                                playedSeconds: inc,
                                            });
                                        } catch (err) {
                                            console.error(
                                                "[WatchPage] upsertWatchService progress error:",
                                                err
                                            );
                                        }
                                    }
                                }
                            }, 1000);
                        } else if (s === YT.PlayerState.PAUSED) {
                            if (ytPingTimerRef.current)
                                clearInterval(ytPingTimerRef.current);
                            if (id && ytPlayerRef.current) {
                                try {
                                    await upsertWatchService({
                                        movieId: id,
                                        event: "progress",
                                        position: Number(
                                            ytPlayerRef.current.getCurrentTime() || 0
                                        ),
                                        duration: Number(
                                            ytPlayerRef.current.getDuration() || 0
                                        ),
                                        playedSeconds: 0,
                                    });
                                } catch (err) {
                                    console.error(
                                        "[WatchPage] upsertWatchService pause error:",
                                        err
                                    );
                                }
                            }
                        } else if (s === YT.PlayerState.ENDED) {
                            if (ytPingTimerRef.current)
                                clearInterval(ytPingTimerRef.current);
                            if (id) {
                                try {
                                    await upsertWatchService({
                                        movieId: id,
                                        event: "complete",
                                        position: Number(
                                            ytPlayerRef.current.getDuration() || 0
                                        ),
                                        duration: Number(
                                            ytPlayerRef.current.getDuration() || 0
                                        ),
                                        playedSeconds: 0,
                                    });
                                } catch (err) {
                                    console.error(
                                        "[WatchPage] upsertWatchService complete error:",
                                        err
                                    );
                                }
                            }
                        }
                    },
                },
            });
        })();

        return () => {
            cancelled = true;
            if (ytPingTimerRef.current)
                clearInterval(ytPingTimerRef.current);
            if (ytPlayerRef.current?.destroy) ytPlayerRef.current.destroy();
            ytPlayerRef.current = null;
        };
    }, [showYouTube, mediaUrl, id, resumeTime]);
    // =====================================

    const handleStart = () => {
        setStarted(true);

        // HTML5
        if (showHtml5 && videoRef.current) {
            const v = videoRef.current;

            if (v.readyState < 3) {
                const onCanPlay = () => {
                    v.removeEventListener("canplay", onCanPlay);
                    try {
                        if (!seekedOnceRef.current && resumeTime > 0) {
                            v.currentTime = resumeTime;
                            seekedOnceRef.current = true;
                        }
                        v
                            .play()
                            .catch((err) =>
                                console.error(
                                    "[WatchPage] HTML5 play error:",
                                    err
                                )
                            );
                    } catch (err) {
                        console.error(
                            "[WatchPage] HTML5 seek/play error:",
                            err
                        );
                    }
                };
                v.addEventListener("canplay", onCanPlay, { once: true });
            } else {
                try {
                    if (!seekedOnceRef.current && resumeTime > 0) {
                        v.currentTime = resumeTime;
                        seekedOnceRef.current = true;
                    }
                    v
                        .play()
                        .catch((err) =>
                            console.error("[WatchPage] HTML5 play error:", err)
                        );
                } catch (err) {
                    console.error(
                        "[WatchPage] HTML5 seek/play error:",
                        err
                    );
                }
            }
        }

        // YouTube
        if (showYouTube && ytPlayerRef.current) {
            try {
                ytPlayerRef.current.playVideo();
            } catch (err) {
                console.error("[WatchPage] YouTube play error:", err);
            }
        }
    };

    return (
        <Layout>
            <div className="container mx-auto bg-dry p-6 mb-12">
                {!isError && (
                    <div className="flex-btn flex-wrap mb-6 gap-2 bg-main rounded border-gray-800 p-6">
                        <Link
                            to={`/movie/${movie?._id}`}
                            className="md:text-xl text-sm flex gap-3 items-center font-bold text-dryGray"
                        >
                            <BiArrowBack />
                            {movie?.name}
                        </Link>
                        <div className="flex-btn sm:w-auto w-full gap-5">
                            <button
                                onClick={() => LikeMovie(movie, dispatch, userInfo)}
                                disabled={isLiked(movie) || likeLoading}
                                className={`bg-white hover:text-subMain 
                  ${isLiked(movie) ? "text-subMain" : "text-white"}
                  transition bg-opacity-30 rounded px-4 py-3 text-sm`}
                            >
                                <FaHeart />
                            </button>
                            <button className="bg-subMain flex-rows gap-2 hover:text-main transition text-white rounded px-8 font-medium py-3 text-sm">
                                <FaCloudDownloadAlt /> Download
                            </button>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className={sameClass}>
                        <Loader />
                    </div>
                ) : isError ? (
                    <div className={sameClass}>
                        <div className="flex-colo w-24 h-24 p-5 mb-4 rounded-full bg-dry text-subMain text-4xl">
                            <RiMovie2Line />
                        </div>
                        <p className="text-border text-sm">{isError}</p>
                    </div>
                ) : (
                    <div className="w-full relative rounded-lg overflow-hidden">
                        {/* Player */}
                        {showHtml5 ? (
                            <div className="aspect-video relative">
                                <video
                                    ref={videoRef}
                                    controls
                                    className={`absolute inset-0 w-full h-full ${started ? "" : "opacity-0 pointer-events-none"
                                        }`}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onPlay={onPlay}
                                    onPause={onPause}
                                    onEnded={onEnded}
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
                                    Video link is not playable. Please provide a valid
                                    YouTube URL (e.g. https://www.youtube.com/watch?v=...)
                                    or an mp4/webm file URL.
                                </p>
                            </div>
                        )}

                        {/* Overlay Poster + Play */}
                        {!started && (showHtml5 || showYouTube) && (
                            <div className="absolute inset-0">
                                <img
                                    src={
                                        movie?.image ||
                                        movie?.titleImage ||
                                        "/images/banner.png"
                                    }
                                    alt={movie?.name}
                                    className="w-full h-full object-cover rounded-lg"
                                />
                                <div className="absolute inset-0 bg-main bg-opacity-30 flex-colo">
                                    <button
                                        onClick={handleStart}
                                        className="bg-white text-subMain flex-colo border border-subMain rounded-full w-20 h-20 font-medium text-xl"
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

export default WatchPage;
