import * as watchConstants from "../Constants/watchConstants";
import {
    getContinueWatchingService,
    deletePlaybackService,
    clearAllPlaybackService,
} from "../APIs/watchAPI"; 
import { tokenProtection } from "../Protection";

export const getContinueWatchingAction = () => async (dispatch, getState) => {
    const token = tokenProtection(getState);
    if (!token) {
        dispatch({ type: watchConstants.CONTINUE_WATCHING_RESET });
        return;
    }

    try {
        dispatch({ type: watchConstants.CONTINUE_WATCHING_REQUEST });
        const list = await getContinueWatchingService();
        dispatch({ type: watchConstants.CONTINUE_WATCHING_SUCCESS, payload: list });
    } catch (error) {
        if (error?.response?.status === 401) {
            dispatch({ type: watchConstants.CONTINUE_WATCHING_RESET });
            return;
        }
        dispatch({
            type: watchConstants.CONTINUE_WATCHING_FAIL,
            payload:
                error?.response?.data?.message ||
                error?.message ||
                "Failed to load continue watching",
        });
    }
};

export const deletePlaybackAction =
    ({ movieId, seasonNumber = null, episodeNumber = null }) =>
        async (dispatch, getState) => {
            const token = tokenProtection(getState);
            if (!token) return;

            try {
                dispatch({ type: watchConstants.DELETE_PLAYBACK_REQUEST });
                await deletePlaybackService(movieId, {
                    seasonNumber,
                    episodeNumber,
                });
                dispatch({ type: watchConstants.DELETE_PLAYBACK_SUCCESS });
                // refresh danh sách
                dispatch(getContinueWatchingAction());
            } catch (error) {
                dispatch({
                    type: watchConstants.DELETE_PLAYBACK_FAIL,
                    payload:
                        error?.response?.data?.message ||
                        error?.message ||
                        "Failed to delete item",
                });
            }
        };

// NEW: xoá toàn bộ lịch sử xem
export const clearAllPlaybackAction = () => async (dispatch, getState) => {
    const token = tokenProtection(getState);
    if (!token) return;
    try {
        dispatch({ type: watchConstants.CLEAR_ALL_PLAYBACK_REQUEST });
        await clearAllPlaybackService();
        dispatch({ type: watchConstants.CLEAR_ALL_PLAYBACK_SUCCESS });
        dispatch(getContinueWatchingAction());
    } catch (error) {
        dispatch({
            type: watchConstants.CLEAR_ALL_PLAYBACK_FAIL,
            payload:
                error?.response?.data?.message ||
                error?.message ||
                "Failed to clear history",
        });
    }
};