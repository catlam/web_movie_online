// src/Redux/Actions/seriesActions.js
import toast from "react-hot-toast";
import { ErrorsAction, tokenProtection } from "../Protection";

import * as seriesConstants from "../Constants/seriesConstants";
import * as seriesApi from "../APIs/seriesServices";
import * as episodeApi from "../APIs/episodeServices";
import * as seasonApi from "../APIs/seasonServices";



// ============== SERIES ==============

const listSeriesAction = (params = {}) => async (dispatch) => {
    try {
        dispatch({ type: seriesConstants.SERIES_LIST_REQUEST });

        const {
            pageNumber = 1,
            search = '',
            sort = 'az',
            limit = 5, 
        } = params;

        const query = {
            page: pageNumber,
            limit,
            search,
            sort,
        };

        const response = await seriesApi.listSeriesService(query);

        dispatch({
            type: seriesConstants.SERIES_LIST_SUCCESS,
            payload: response, 
        });
    } catch (error) {
        ErrorsAction(error, dispatch, seriesConstants.SERIES_LIST_FAIL);
    }
};

// Get series details
const getSeriesDetailsAction = (id) => async (dispatch) => {
    try {
        dispatch({ type: seriesConstants.SERIES_DETAILS_REQUEST });

        // 1) Lấy series gốc
        const base = await seriesApi.getSeriesByIdService(id);

        // 2) Đảm bảo có danh sách seasons
        let seasons = Array.isArray(base.seasons) ? base.seasons : [];
        if (seasons.length === 0) {
            seasons = await seriesApi.listSeasonsBySeriesService(id);
        }

        // 3) Đảm bảo mỗi season có episodes
        const seasonsWithEpisodes = await Promise.all(
            seasons.map(async (s) => {
                let eps = Array.isArray(s.episodes) ? s.episodes : [];
                if (eps.length === 0) {
                    eps = await seasonApi.listEpisodesBySeasonService(s._id);
                }
                return { ...s, episodes: eps };
            })
        );

        // 4) Tạo mảng episodes phẳng ở cấp series (cho UI dùng nhanh)
        const flatEpisodes = seasonsWithEpisodes.flatMap((s) => s.episodes || []);

        // 5) Hợp nhất vào 1 object series đầy đủ cho UI
        const merged = {
            ...base,
            seasons: seasonsWithEpisodes,
            episodes: Array.isArray(base.episodes) && base.episodes.length > 0
                ? base.episodes
                : flatEpisodes,
            useSeasons: seasonsWithEpisodes.length > 0,
        };

        dispatch({ type: seriesConstants.SERIES_DETAILS_SUCCESS, payload: merged });
    } catch (err) {
        const msg = err?.response?.data?.message || err.message || "Failed to load series";
        dispatch({ type: seriesConstants.SERIES_DETAILS_FAIL, payload: msg });
    }
};

// get random series action
const getRandomSeriesAction = (size = 8) => async (dispatch) => {
    try {
        dispatch({ type: seriesConstants.SERIES_RANDOM_REQUEST });
        const response = await seriesApi.getRandomSeriesService(size);
        dispatch({ type: seriesConstants.SERIES_RANDOM_SUCCESS, payload: response });
    } catch (error) {
        ErrorsAction(error, dispatch, seriesConstants.SERIES_RANDOM_FAIL);
    }
};

// Create series (admin)
// const createSeriesAction = (payload) => async (dispatch, getState) => {
//     try {
//         dispatch({ type: seriesConstants.SERIES_CREATE_REQUEST });
//         const response = await seriesApi.createSeriesService(payload, tokenProtection(getState));
//         dispatch({ type: seriesConstants.SERIES_CREATE_SUCCESS, payload: response });
//         toast.success("Series created");
//     } catch (error) {
//         ErrorsAction(error, dispatch, seriesConstants.SERIES_CREATE_FAIL);
//     }
// };

const createSeriesAction = (payload) => async (dispatch, getState) => {
    const token = tokenProtection(getState);
    try {
        dispatch({ type: seriesConstants.SERIES_CREATE_REQUEST });

        const stateCasts = getState()?.seriesCasts?.casts || [];
        // Chuẩn hoá tối thiểu
        const normalizedCasts = stateCasts
            .map(c => {
                const name = (c?.name || "").trim();
                if (!name) return null;
                const item = { name };
                if (c.image) item.image = String(c.image).trim();
                if (c.role) item.role = String(c.role).trim();
                return item;
            })
            .filter(Boolean);

        // 1) Tạo Series
        console.group("[createSeriesAction] STEP 1: POST /series");
        const baseBody = {
            name: payload.name,
            language: payload.language,
            year: payload.year,
            category: payload.category,
            desc: payload.desc,
            image: payload.image,         // backdrop
            titleImage: payload.titleImage, // poster
            isPremium: !!payload.isPremium,
            casts: normalizedCasts, 
        };
        console.log("body:", baseBody);

        const createdSeries = await seriesApi.createSeriesService(baseBody, {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log("=> created series:", createdSeries);
        console.groupEnd();

        const seriesId = createdSeries?._id || createdSeries?.id;
        if (!seriesId) throw new Error("Series created but no _id returned");

        // 2) Tạo Seasons (nếu có)
        const localMap = new Map(); // _localId -> real seasonId
        if (payload.useSeasons && Array.isArray(payload.seasons) && payload.seasons.length) {
            console.group("[createSeriesAction] STEP 2: POST /series/:id/seasons");
            for (const s of payload.seasons) {
                const body = { name: s.name, seasonNumber: Number(s.seasonNumber) };
                console.log(`POST /series/${seriesId}/seasons`, body);
                const createdSeason = await seriesApi.createSeasonUnderSeriesService(
                    seriesId,
                    body,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const seasonId = createdSeason?._id || createdSeason?.id;
                console.log("=> created season:", createdSeason);
                localMap.set(s._localId, seasonId);
            }
            console.groupEnd();
        }

        // 3) Tạo Episodes (bắt buộc phải có theo yêu cầu)
        if (!Array.isArray(payload.episodes) || payload.episodes.length === 0) {
            throw new Error("At least 1 episode is required");
        }

        console.group("[createSeriesAction] STEP 3: POST episodes");
        for (const e of payload.episodes) {
            const episodeNumber = Number(e.episodeNumber);
            if (!Number.isFinite(episodeNumber) || episodeNumber <= 0) {
                console.error("Invalid episodeNumber for episode:", e);
                continue; // Bỏ qua episode không hợp lệ
            }
            const body = {
                title: e.title || e.name,
                episodeNumber: episodeNumber,
                duration: Number(e.runtime),
                video: e.video,
            };
            console.log("Sending episode body:", body);

            if (payload.useSeasons) {
                const seasonId = localMap.get(e.seasonLocalId);
                if (!seasonId) {
                    console.warn("Cannot map seasonLocalId for episode:", e);
                    continue;
                }
                console.log(`POST /seasons/${seasonId}/episodes`, body);
                await episodeApi.createEpisodeUnderSeasonService(
                    seasonId,
                    body,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                // Nếu không dùng seasons, giả sử có API tạo episode dưới series trực tiếp
                // Nếu không, thêm logic hoặc throw error
                console.log(`POST /series/${seriesId}/episodes`, body);
                // await episodeApi.createEpisodeUnderSeriesService(seriesId, body, { headers: { Authorization: `Bearer ${token}` } });
                // Hoặc throw nếu không hỗ trợ
                throw new Error("Creating episodes without seasons is not supported");
            }
        }
        console.groupEnd();

        dispatch(resetSeriesCastAction());

        toast.success("Series created with seasons & episodes!");
        dispatch({ type: seriesConstants.SERIES_CREATE_SUCCESS });

    } catch (err) {
        const msg = err?.response?.data?.message || err.message || "Create series failed";
        console.error("[createSeriesAction] ERROR:", msg);
        toast.error(msg);
        dispatch({ type: seriesConstants.SERIES_CREATE_FAIL, payload: msg });
    }
};

// Update series (admin)
const updateSeriesAction = (id, payload) => async (dispatch, getState) => {
    try {
        dispatch({ type: seriesConstants.SERIES_UPDATE_REQUEST });
        const response = await seriesApi.updateSeriesService(id, payload, tokenProtection(getState));
        dispatch({ type: seriesConstants.SERIES_UPDATE_SUCCESS, payload: response });
        toast.success("Series updated");
    } catch (error) {
        ErrorsAction(error, dispatch, seriesConstants.SERIES_UPDATE_FAIL);
    }
};

// Delete series (admin)
const deleteSeriesAction = (id) => async (dispatch, getState) => {
    try {
        dispatch({ type: seriesConstants.SERIES_DELETE_REQUEST });
        const response = await seriesApi.deleteSeriesService(id, tokenProtection(getState));
        dispatch({ type: seriesConstants.SERIES_DELETE_SUCCESS, payload: response });
        toast.success("Series deleted");
    } catch (error) {
        ErrorsAction(error, dispatch, seriesConstants.SERIES_DELETE_FAIL);
    }
};

// Get summary (season/episode counts)
const getSeriesSummaryAction = (id) => async (dispatch) => {
    try {
        dispatch({ type: seriesConstants.SERIES_SUMMARY_REQUEST });
        const response = await seriesApi.getSeriesSummaryService(id);
        dispatch({ type: seriesConstants.SERIES_SUMMARY_SUCCESS, payload: response });
    } catch (error) {
        ErrorsAction(error, dispatch, seriesConstants.SERIES_SUMMARY_FAIL);
    }
};

// ============== SEASONS (under a series) ==============

// List seasons of a series
const listSeasonsBySeriesAction = (seriesId) => async (dispatch) => {
    try {
        dispatch({ type: seriesConstants.SEASON_LIST_BY_SERIES_REQUEST });
        const response = await seriesApi.listSeasonsBySeriesService(seriesId);
        dispatch({ type: seriesConstants.SEASON_LIST_BY_SERIES_SUCCESS, payload: response });
    } catch (error) {
        ErrorsAction(error, dispatch, seriesConstants.SEASON_LIST_BY_SERIES_FAIL);
    }
};

// Create season under a series (admin)
const createSeasonUnderSeriesAction = (seriesId, payload) => async (dispatch, getState) => {
    try {
        dispatch({ type: seriesConstants.SEASON_CREATE_REQUEST });
        const response = await seriesApi.createSeasonUnderSeriesService(
            seriesId,
            payload,
            tokenProtection(getState)
        );
        dispatch({ type: seriesConstants.SEASON_CREATE_SUCCESS, payload: response });
        toast.success("Season created");
    } catch (error) {
        ErrorsAction(error, dispatch, seriesConstants.SEASON_CREATE_FAIL);
    }
};

// review movie action
const reviewSeriesAction = ({ id, review }) => async (dispatch, getState) => {
    try {
        dispatch({ type: seriesConstants.CREATE_REVIEW_REQUEST })
        const response = await seriesApi.reviewSeriesService(
            tokenProtection(getState),
            id,
            review
        );
        dispatch({
            type: seriesConstants.CREATE_REVIEW_SUCCESS,
            payload: response
        })
        toast.success("Review created successfully!");
        dispatch({ type: seriesConstants.CREATE_REVIEW_RESET })
        dispatch(getSeriesDetailsAction(id));
    } catch (error) {
        ErrorsAction(error, dispatch, seriesConstants.CREATE_REVIEW_FAIL);
    }
}

// delete review movie action
const deleteReviewSeriesAction = (id) => async (dispatch, getState) => {
    try {
        dispatch({ type: seriesConstants.DELETE_REVIEW_REQUEST })
        const response = await seriesApi.deleteReviewSeriesService(
            tokenProtection(getState),
            id
        );
        dispatch({
            type: seriesConstants.DELETE_REVIEW_SUCCESS,
            payload: response
        })
        toast.success("Review deleted successfully!");
        dispatch(getSeriesDetailsAction(id));
    } catch (error) {
        ErrorsAction(error, dispatch, seriesConstants.DELETE_REVIEW_FAIL);
    }
}

export {
    listSeriesAction,
    getSeriesDetailsAction,
    createSeriesAction,
    updateSeriesAction,
    deleteSeriesAction,
    getSeriesSummaryAction,
    listSeasonsBySeriesAction,
    createSeasonUnderSeriesAction,
    reviewSeriesAction,
    deleteReviewSeriesAction,
    getRandomSeriesAction,

};

export const addSeriesCastAction = (cast) => (dispatch, getState) => {
    // cast: { name: string, image?: string, role?: string, _id?/tempId? }
    dispatch({ type: seriesConstants.SERIES_ADD_CAST, payload: cast });
};

export const updateSeriesCastAction = (cast) => (dispatch) => {
    dispatch({ type: seriesConstants.SERIES_EDIT_CAST, payload: cast });
};

export const removeSeriesCastAction = (idOrTempId) => (dispatch) => {
    dispatch({ type: seriesConstants.SERIES_DELETE_CAST, payload: idOrTempId });
};

export const resetSeriesCastAction = () => (dispatch) => {
    dispatch({ type: seriesConstants.SERIES_RESET_CAST });
};