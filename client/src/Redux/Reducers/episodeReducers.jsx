// src/reducers/episodeReducers.js
import * as episodeConstants from "../Constants/episodeConstants";

export const episodeCreateReducer = (state = {}, action) => {
    switch (action.type) {
        case episodeConstants.EPISODE_CREATE_REQUEST:
            return { loading: true };
        case episodeConstants.EPISODE_CREATE_SUCCESS:
            return { loading: false, success: true, episode: action.payload };
        case episodeConstants.EPISODE_CREATE_FAIL:
            return { loading: false, error: action.payload };
        case episodeConstants.EPISODE_CREATE_RESET:
            return {};
        default:
            return state;
    }
};

export const episodeDetailsReducer = (state = { episode: null }, action) => {
    switch (action.type) {
        case episodeConstants.EPISODE_DETAILS_REQUEST:
            return { ...state, loading: true, error: null };
        case episodeConstants.EPISODE_DETAILS_SUCCESS:
            return { loading: false, error: null, episode: action.payload };
        case episodeConstants.EPISODE_DETAILS_FAIL:
            return { loading: false, error: action.payload, episode: null };
        default:
            return state;
    }
};

export const episodeUpdateReducer = (state = {}, action) => {
    switch (action.type) {
        case episodeConstants.EPISODE_UPDATE_REQUEST:
            return { loading: true };
        case episodeConstants.EPISODE_UPDATE_SUCCESS:
            return { loading: false, success: true, episode: action.payload };
        case episodeConstants.EPISODE_UPDATE_FAIL:
            return { loading: false, error: action.payload };
        case episodeConstants.EPISODE_UPDATE_RESET:
            return {};
        default:
            return state;
    }
};

export const episodeDeleteReducer = (state = {}, action) => {
    switch (action.type) {
        case episodeConstants.EPISODE_DELETE_REQUEST:
            return { loading: true };
        case episodeConstants.EPISODE_DELETE_SUCCESS:
            return { loading: false, success: true, result: action.payload };
        case episodeConstants.EPISODE_DELETE_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};
