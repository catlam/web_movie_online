import toast from "react-hot-toast";
import { ErrorsAction, tokenProtection } from "../Protection";

import * as episodeConstants from "../Constants/episodeConstants";
import {
    createEpisodeUnderSeasonService,
    getEpisodeByIdService,
    updateEpisodeService,
    deleteEpisodeService,
} from "../APIs/episodeServices";

// Create episode under season (admin)
const createEpisodeUnderSeasonAction = (seasonId, payload) => async (dispatch, getState) => {
    try {
        dispatch({ type: episodeConstants.EPISODE_CREATE_REQUEST });
        const response = await createEpisodeUnderSeasonService(
            seasonId,
            payload,
            tokenProtection(getState)
        );
        dispatch({ type: episodeConstants.EPISODE_CREATE_SUCCESS, payload: response });
        toast.success("Episode created");
    } catch (error) {
        ErrorsAction(error, dispatch, episodeConstants.EPISODE_CREATE_FAIL);
    }
};

// Get episode details
const getEpisodeDetailsAction = (id) => async (dispatch) => {
    try {
        dispatch({ type: episodeConstants.EPISODE_DETAILS_REQUEST });
        const response = await getEpisodeByIdService(id);
        dispatch({ type: episodeConstants.EPISODE_DETAILS_SUCCESS, payload: response });
    } catch (error) {
        ErrorsAction(error, dispatch, episodeConstants.EPISODE_DETAILS_FAIL);
    }
};

// Update episode (admin)
const updateEpisodeAction = (id, payload) => async (dispatch, getState) => {
    try {
        dispatch({ type: episodeConstants.EPISODE_UPDATE_REQUEST });
        const response = await updateEpisodeService(id, payload, tokenProtection(getState));
        dispatch({ type: episodeConstants.EPISODE_UPDATE_SUCCESS, payload: response });
        toast.success("Episode updated");
    } catch (error) {
        ErrorsAction(error, dispatch, episodeConstants.EPISODE_UPDATE_FAIL);
    }
};

// Delete episode (admin)
const deleteEpisodeAction = (id) => async (dispatch, getState) => {
    try {
        dispatch({ type: episodeConstants.EPISODE_DELETE_REQUEST });
        const response = await deleteEpisodeService(id, tokenProtection(getState));
        dispatch({ type: episodeConstants.EPISODE_DELETE_SUCCESS, payload: response });
        toast.success("Episode deleted");
    } catch (error) {
        ErrorsAction(error, dispatch, episodeConstants.EPISODE_DELETE_FAIL);
    }
};

export {
    createEpisodeUnderSeasonAction,
    getEpisodeDetailsAction,
    updateEpisodeAction,
    deleteEpisodeAction,
};
