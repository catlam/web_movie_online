// src/Redux/APIs/episodeAPI.js
import Axios from "./Axios";

// CREATE episode under season (admin)
export const createEpisodeUnderSeasonService = async (seasonId, payload, config) => {
    const { data } = await Axios.post(`/seasons/${seasonId}/episodes`, payload, config);
    return data; // Episode
};

// GET episode by id
export const getEpisodeByIdService = async (id) => {
    const { data } = await Axios.get(`/episodes/${id}`);
    return data; // Episode
};

// UPDATE episode (admin)
export const updateEpisodeService = async (id, payload, config) => {
    const { data } = await Axios.put(`/episodes/${id}`, payload, config);
    return data;
};

// DELETE episode (admin)
export const deleteEpisodeService = async (id, config) => {
    const { data } = await Axios.delete(`/episodes/${id}`, config);
    return data;
};

export const getEpisodeBySeriesSEService = async (seriesId, seasonNumber, episodeNumber) => {
    const { data } = await Axios.get(`/episodes/by-se/series/${seriesId}`, {
        params: { seasonNumber, episodeNumber },
    });
    // data: { _id, episode }
    return data;
};