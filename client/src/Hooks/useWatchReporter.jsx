import { useEffect, useRef, useCallback } from "react";
import { upsertWatchService } from "../Redux/APIs/watchAPI";

export default function useWatchReporter({
    movieId,      
    seriesId,      
    seasonNumber,
    episodeNumber,
    episodeId, 
    videoRef,
    pingInterval = 10,
    sessionId,
}) {
    const sentStartRef = useRef(false);
    const lastSentPosRef = useRef(0);
    const lastPingAtRef = useRef(0);
    const timerRef = useRef(null);

    // 👇 series dùng seriesId (server vẫn nhận field 'movieId')
    const contentId = (seriesId && seasonNumber && episodeNumber) ? seriesId : movieId;

    const send = useCallback(async (event, position, duration, inc) => {
        if (!contentId) return;
        console.log("[useWatchReporter] Sending:", {
            movieId: contentId,
            seasonNumber,
            episodeNumber,
            episodeId,
            event,
            position,
            duration,
            playedSeconds: inc,
            sessionId,
        });
        try {
            await upsertWatchService({
                movieId: contentId,
                seasonNumber: seasonNumber ?? null,
                episodeNumber: episodeNumber ?? null,
                episodeId: episodeId ?? null,
                event,
                position,
                duration,
                playedSeconds: inc,
                sessionId: sessionId ?? null,
            });
        } catch (err) {
            console.error("watch reporter send error", err?.response?.status || err?.message || err);
        }
    }, [contentId, seasonNumber, episodeNumber, episodeId, sessionId]);

    const stop = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
    };

    const start = useCallback(() => {
        stop();
        timerRef.current = setInterval(async () => {
            const v = videoRef.current;
            if (!v || v.paused || v.seeking || v.readyState < 1) return;
            const now = Date.now();
            const pos = v.currentTime || 0;
            const dur = v.duration || 0;
            const inc = pos - lastSentPosRef.current;
            const since = (now - lastPingAtRef.current) / 1000;
            if (since >= pingInterval && inc > 0.5) {
                lastSentPosRef.current = pos;
                lastPingAtRef.current = now;
                await send("progress", pos, dur, inc);
            }
        }, 1000);
    }, [videoRef, pingInterval, send]);

    const onPlay = async () => {
        const v = videoRef.current;
        if (v && !sentStartRef.current) {
            sentStartRef.current = true;
            lastSentPosRef.current = v.currentTime || 0;
            lastPingAtRef.current = Date.now();
            await send("start", v.currentTime || 0, v.duration || 0, 0);
        }
        start();
    };

    const onPause = async () => {
        const v = videoRef.current;
        if (!v) return;
        stop();
        const pos = v.currentTime || 0;
        const dur = v.duration || 0;
        const inc = Math.max(0, pos - lastSentPosRef.current);
        lastSentPosRef.current = pos;
        lastPingAtRef.current = Date.now();
        await send("progress", pos, dur, inc);
    };

    const onEnded = async () => {
        const v = videoRef.current;
        stop();
        await send("complete", (v?.duration || v?.currentTime || 0), v?.duration || 0, 0);
    };

    useEffect(() => () => stop(), []);
    useEffect(() => {
        const h = () => (document.hidden ? stop() : start());
        document.addEventListener("visibilitychange", h);
        return () => document.removeEventListener("visibilitychange", h);
    }, [start]);

    return { onPlay, onPause, onEnded };
}
