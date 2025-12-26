// src/Redux/APIs/watchAPI.js
import Axios from './Axios';

// Ghi nhận tiến độ
export const upsertWatchService = async (payload) => {
    const { data } = await Axios.post('/watch', payload);
    return data;
};

// Tiếp tục xem
export const getContinueWatchingService = async () => {
    const { data } = await Axios.get('/watch/me/continue');
    return data?.data || [];
};

// Đã xem gần đây
export const getRecentlyWatchedService = async () => {
    const { data } = await Axios.get('/watch/me/recent');
    return data?.data || [];
};

// State resume
export const getPlaybackStateService = async (params) => {
    const { data } = await Axios.get('/watch/me/state', { params });
    return data?.data || null;
};

// Xoá 1 mục
// export const deleteOnePlaybackService = async (movieId) => {
//     const { data } = await Axios.delete(`/watch/me/${movieId}`);
//     return data;
// };

// Xoá toàn bộ
export const clearAllPlaybackService = async () => {
    const { data } = await Axios.delete('/watch/me');
    return data;
};

// Admin top
export const adminTopWatchedService = async () => {
    const { data } = await Axios.get('/watch/admin/top');
    return data?.data || [];
};

// NEW: Series history
export const getSeriesHistoryService = async (movieId) => {
    const { data } = await Axios.get(`/watch/me/series/${movieId}/history`);
    return data?.data || [];
};

// NEW: Season history
export const getSeasonHistoryService = async (movieId, seasonNumber) => {
    const { data } = await Axios.get(`/watch/me/series/${movieId}/season/${seasonNumber}`);
    return data?.data || [];
};

// NEW: Episode logs (tuỳ chọn dùng cho debug/analytics)
export const getEpisodeLogsService = async (movieId, seasonNumber, episodeNumber) => {
    const { data } = await Axios.get(
        `/watch/me/series/${movieId}/season/${seasonNumber}/episode/${episodeNumber}/logs`
    );
    return data?.data || [];
};

export const deletePlaybackService = async (movieId, opts = {}) => {
    const params = {};
    if (opts.seasonNumber != null) params.seasonNumber = opts.seasonNumber;
    if (opts.episodeNumber != null) params.episodeNumber = opts.episodeNumber;

    const config = Object.keys(params).length ? { params } : undefined;
    const { data } = await Axios.delete(`/watch/me/${movieId}`, config);
    return data;
};

export const deleteOnePlaybackService = (movieId) =>
    deletePlaybackService(movieId);

export const deleteOneEpisodePlaybackService = (movieId, seasonNumber, episodeNumber) =>
    deletePlaybackService(movieId, { seasonNumber, episodeNumber });