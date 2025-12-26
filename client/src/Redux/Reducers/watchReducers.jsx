import * as watchConstants from "../Constants/watchConstants";

export const continueWatchingReducer = (
    state = { loading: false, items: [], error: null },
    action
) => {
    switch (action.type) {
        case watchConstants.CONTINUE_WATCHING_REQUEST:
            return { loading: true, items: [], error: null };
        case watchConstants.CONTINUE_WATCHING_SUCCESS:
            return { loading: false, items: action.payload, error: null };
        case watchConstants.CONTINUE_WATCHING_FAIL:
            return { loading: false, items: [], error: action.payload };
        case watchConstants.CONTINUE_WATCHING_RESET:
            return { loading: false, items: [], error: null };
        default:
            return state;
    }
};

export const deletePlaybackReducer = (state = {}, action) => {
    switch (action.type) {
        case watchConstants.DELETE_PLAYBACK_REQUEST:
            return { loading: true };
        case watchConstants.DELETE_PLAYBACK_SUCCESS:
            return { loading: false, success: true };
        case watchConstants.DELETE_PLAYBACK_FAIL:
            return { loading: false, error: action.payload };
        case watchConstants.DELETE_PLAYBACK_RESET:
            return {};
        default:
            return state;
    }
};

export const clearAllPlaybackReducer = (state = {}, action) => {
    switch (action.type) {
        case watchConstants.CLEAR_ALL_PLAYBACK_REQUEST:
            return { loading: true };
        case watchConstants.CLEAR_ALL_PLAYBACK_SUCCESS:
            return { loading: false, success: true };
        case watchConstants.CLEAR_ALL_PLAYBACK_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};