// src/Redux/APIs/seriesAPI.js
import Axios from "./Axios";

const unwrap = (resp) => resp?.data?.data ?? resp?.data;

// LIST series
export const listSeriesService = async (q = {}) => {
    const {
        pageNumber,      // ưu tiên
        page,            // fallback nếu pageNumber không có
        limit = 12,
        sort = "az",
        search = "",
        category = "",
        language = "",
        year = "",
    } = q;

    const effectivePage =
        Number.isFinite(+pageNumber) ? +pageNumber :
            Number.isFinite(+page) ? +page : 1;

    const { data } = await Axios.get("/series", {
        params: {
            pageNumber: effectivePage, 
            limit,
            sort,
            search,
            category,
            language,
            year,
        },
    });

    return data; // { items, page, pages, total, ...}
};

// DETAILS series
export const getSeriesByIdService = async (id) => {
    const { data } = await Axios.get(`/series/${id}`);
    return data;
};

// RANDOM series
export const getRandomSeriesService = async (size = 8) => {
    const { data } = await Axios.get('/series/random', { params: { size } });
    return data; // Series[]
};

// CREATE series (admin)
export const createSeriesService = async (payload, config) => {
    const { data } = await Axios.post("/series", payload, config);
    return data;
};

// UPDATE series (admin)
export const updateSeriesService = async (id, payload, config) => {
    const { data } = await Axios.put(`/series/${id}`, payload, config);
    return data;
};

// DELETE series (admin)
export const deleteSeriesService = async (id, config) => {
    const { data } = await Axios.delete(`/series/${id}`, config);
    return data;
};

// SUMMARY series
export const getSeriesSummaryService = async (id) => {
    const { data } = await Axios.get(`/series/${id}/summary`);
    return data; // { seriesId, seasonCount, episodeCount }
};

// SEASONS under a series
export const listSeasonsBySeriesService = async (seriesId) => {
    const { data } = await Axios.get(`/series/${seriesId}/seasons`);
    return data; // Season[]
};

export const createSeasonUnderSeriesService = async (seriesId, payload, config) => {
    const { data } = await Axios.post(`/series/${seriesId}/seasons`, payload, config);
    return data; // Season
};


// review movie function
export const reviewSeriesService = async (token, seriesId, review) => {
    const { data } = await Axios.post(`/series/${seriesId}/reviews`, review, {
        headers: {
            Authorization: `Bearer ${token}`
        },
    });
    return data;
};

// delete review movie function
export const deleteReviewSeriesService = async (token, seriesId) => {
    const { data } = await Axios.delete(`/series/${seriesId}/reviews`, {
        headers: {
            Authorization: `Bearer ${token}`
        },
    });
    return data;
};

export const resolveEpisodeByNumberService = async (seriesId, seasonNumber, episodeNumber) => {
    const resp = await Axios.get(`/series/${seriesId}/resolve-episode`, {
        params: { seasonNumber, episodeNumber },
    });
    return unwrap(resp); // { episodeId: "..."} | { episodeId: null }
};