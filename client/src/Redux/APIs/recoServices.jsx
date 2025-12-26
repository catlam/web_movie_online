// src/api/recoApi.js
import AxiosReco from "./AxiosReco";

export async function getUserRecommendations(userId, n = 12) {
    if (!userId) return { items: [], cold_start: true };
    const { data } = await AxiosReco.get(`/recommend/user/${userId}`, { params: { n } });
    return data; // { userId, items: [...], cold_start? }
}

export async function getSimilar(kind, id, n = 12) {
    try {
        const { data } = await AxiosReco.get(`/recommend/similar/${kind}/${id}`, { params: { n } });
        return data; // { items: [...] }
    } catch (e) {
        if (kind === "movie") {
            const { data } = await AxiosReco.get(`/recommend/similar/${id}`, { params: { n } });
            return data;
        }
        throw e;
    }
}
