import toast from "react-hot-toast";
import { ErrorsAction, tokenProtection } from "../Protection";

import * as seasonConstants from "../Constants/seasonConstants";
import {
    getSeasonByIdService,
    updateSeasonService,
    deleteSeasonService,
    listEpisodesBySeasonService,
} from "../APIs/seasonServices";

// Get season details
const getSeasonDetailsAction = (id) => async (dispatch) => {
    try {
        dispatch({ type: seasonConstants.SEASON_DETAILS_REQUEST });
        const response = await getSeasonByIdService(id);
        dispatch({ type: seasonConstants.SEASON_DETAILS_SUCCESS, payload: response });
    } catch (error) {
        ErrorsAction(error, dispatch, seasonConstants.SEASON_DETAILS_FAIL);
    }
};

// Update season (admin)
const updateSeasonAction = (id, payload) => async (dispatch, getState) => {
    try {
        dispatch({ type: seasonConstants.SEASON_UPDATE_REQUEST });
        const response = await updateSeasonService(id, payload, tokenProtection(getState));
        dispatch({ type: seasonConstants.SEASON_UPDATE_SUCCESS, payload: response });
        toast.success("Season updated");
    } catch (error) {
        ErrorsAction(error, dispatch, seasonConstants.SEASON_UPDATE_FAIL);
    }
};

// Delete season (admin)
const deleteSeasonAction = (id) => async (dispatch, getState) => {
    try {
        dispatch({ type: seasonConstants.SEASON_DELETE_REQUEST });
        const response = await deleteSeasonService(id, tokenProtection(getState));
        dispatch({ type: seasonConstants.SEASON_DELETE_SUCCESS, payload: response });
        toast.success("Season deleted");
    } catch (error) {
        ErrorsAction(error, dispatch, seasonConstants.SEASON_DELETE_FAIL);
    }
};

// List episodes by season
const listEpisodesBySeasonAction = (seasonId) => async (dispatch) => {
    try {
        dispatch({ type: seasonConstants.EPISODE_LIST_BY_SEASON_REQUEST });
        const response = await listEpisodesBySeasonService(seasonId);
        dispatch({ type: seasonConstants.EPISODE_LIST_BY_SEASON_SUCCESS, payload: response });
    } catch (error) {
        ErrorsAction(error, dispatch, seasonConstants.EPISODE_LIST_BY_SEASON_FAIL);
    }
};

export {
    getSeasonDetailsAction,
    updateSeasonAction,
    deleteSeasonAction,
    listEpisodesBySeasonAction,
};
