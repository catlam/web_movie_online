// src/Redux/APIs/seasonAPI.js
import Axios from "./Axios";

// GET season by id
export const getSeasonByIdService = async (id) => {
    const { data } = await Axios.get(`/seasons/${id}`);
    return data; // Season
};

// UPDATE season (admin)
export const updateSeasonService = async (id, payload, config) => {
    const { data } = await Axios.put(`/seasons/${id}`, payload, config);
    return data;
};

// DELETE season (admin)
export const deleteSeasonService = async (id, config) => {
    const { data } = await Axios.delete(`/seasons/${id}`, config);
    return data;
};

// EPISODES under a season
export const listEpisodesBySeasonService = async (seasonId) => {
    const { data } = await Axios.get(`/seasons/${seasonId}/episodes`);
    return data; // Episode[]
};
