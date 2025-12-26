import { combineReducers, configureStore } from '@reduxjs/toolkit';
import * as User from './Reducers/userReducers';
import * as categories from './Reducers/categoriesReducers'
import * as movies from "./Reducers/moviesReducers";
import { clearAllPlaybackReducer, continueWatchingReducer, deletePlaybackReducer } from './Reducers/watchReducers';
import * as series from './Reducers/seriesReducers'
import * as season from './Reducers/seasonReducers'
import * as episode from './Reducers/episodeReducers'
import notificationReducer from "./notificationSlice";


const rootReducer = combineReducers({
    // user reducers
    userLogin: User.userLoginReducer,
    userRegister: User.userRegisterReducer,
    userUpdateProfile: User.userUpdateProfileReducer,
    userDeleteProfile: User.userDeleteProfileReducer,
    userchangepassword: User.userChangePasswordReducer,
    userGetFavoriteMovies: User.userGetFavoriteMoviesReducer,
    userDeleteFavoriteMovies: User.userDeleteFavoriteMovieReducer,
    adminGetAllUsers: User.adminGetAllUsersReducer,
    adminDeleteUser: User.adminDeleteUserReducer,
    userLikeMovie: User.userLikeMovieReducer,
    userDeleteMovieById: User.userDeleteFavoriteMovieByIdReducer,
    userForgotPassword: User.userForgotPasswordReducer,
    notifications: notificationReducer,


    // Category reducers
    categoryGetAll: categories.getAllCategoriesReducer,
    categoryCreate: categories.createCategoryReducer,
    categoryUpdate: categories.updateCategoryReducer,
    categoryDelete: categories.deleteCategoryReducer,

    // Movies reducers
    getAllMovies: movies.moviesListReducer,
    getRandomMovies: movies.moviesRandomReducer,
    getMovieById: movies.movieDetailsReducer,
    getTopRatedMovie: movies.movieTopRatedReducer,
    createReview: movies.createReviewReducer,
    deleteMovie: movies.deleteMovieReducer,
    deleteAllMovies: movies.deleteAllMoviesReducer,
    createMovie: movies.createMovieReducer,
    casts: movies.CastsReducer,
    updateMovie: movies.updateMovieReducer,
    deleteReview: movies.deleteReviewReducer,

    // watch history
    continueWatching: continueWatchingReducer,
    deletePlayback: deletePlaybackReducer,
    clearAllPlayback: clearAllPlaybackReducer,

    // series reducers
    seriesList: series.seriesListReducer,
    seriesDetails: series.seriesDetailsReducer,
    seriesCreate: series.seriesCreateReducer,
    seriesUpdate: series.seriesUpdateReducer,
    seriesDelete: series.seriesDeleteReducer,
    seriesSummary: series.seriesSummaryReducer,
    createReviewSeries: series.createReviewReducer,
    deleteMovieSeries: series.deleteReviewReducer,
    seriesCasts: series.seriesCastsReducer,
    seriesRandom: series.seriesRandomReducer,

    // seasons under a series
    seasonListBySeries: series.seasonListBySeriesReducer,
    seasonCreate: series.seasonCreateReducer,

    // season single + episodes list
    seasonDetails: season.seasonDetailsReducer,
    seasonUpdate: season.seasonUpdateReducer,
    seasonDelete: season.seasonDeleteReducer,
    episodeListBySeason: season.episodeListBySeasonReducer,

    // episode CRUD
    episodeCreate: episode.episodeCreateReducer,
    episodeDetails: episode.episodeDetailsReducer,
    episodeUpdate: episode.episodeUpdateReducer,
    episodeDelete: episode.episodeDeleteReducer,

})

// get userInfo form localStorage
const userInfoFromLocalStorage = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;

// initialState
const initialState = {
    userLogin: { userInfo: userInfoFromLocalStorage },
};

export const store = configureStore({
    reducer: rootReducer,
    preloadedState: initialState,
})