// src/reducers/seasonReducers.js
import * as seasonConstants from "../Constants/seasonConstants";

export const seasonDetailsReducer = (state = { season: null }, action) => {
    switch (action.type) {
        case seasonConstants.SEASON_DETAILS_REQUEST:
            return { ...state, loading: true, error: null };
        case seasonConstants.SEASON_DETAILS_SUCCESS:
            return { loading: false, error: null, season: action.payload };
        case seasonConstants.SEASON_DETAILS_FAIL:
            return { loading: false, error: action.payload, season: null };
        default:
            return state;
    }
};

export const seasonUpdateReducer = (state = {}, action) => {
    switch (action.type) {
        case seasonConstants.SEASON_UPDATE_REQUEST:
            return { loading: true };
        case seasonConstants.SEASON_UPDATE_SUCCESS:
            return { loading: false, success: true, season: action.payload };
        case seasonConstants.SEASON_UPDATE_FAIL:
            return { loading: false, error: action.payload };
        case seasonConstants.SEASON_UPDATE_RESET:
            return {};
        default:
            return state;
    }
};

export const seasonDeleteReducer = (state = {}, action) => {
    switch (action.type) {
        case seasonConstants.SEASON_DELETE_REQUEST:
            return { loading: true };
        case seasonConstants.SEASON_DELETE_SUCCESS:
            return { loading: false, success: true, result: action.payload };
        case seasonConstants.SEASON_DELETE_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const episodeListBySeasonReducer = (state = { episodes: [] }, action) => {
    switch (action.type) {
        case seasonConstants.EPISODE_LIST_BY_SEASON_REQUEST:
            return { ...state, loading: true, error: null };
        case seasonConstants.EPISODE_LIST_BY_SEASON_SUCCESS:
            return { loading: false, error: null, episodes: action.payload };
        case seasonConstants.EPISODE_LIST_BY_SEASON_FAIL:
            return { loading: false, error: action.payload, episodes: [] };
        default:
            return state;
    }
};
