// FavoritesMovies.jsx
import React, { useEffect } from 'react';
import SideBar from './SideBar';
import Table from '../../Components/Table';
import { useDispatch, useSelector } from 'react-redux';
import {
  deleteAllFavoriteMoviesAction,
  deleteFavoriteMovieByIdAction,
  getFavoriteMoviesAction
} from '../../Redux/Actions/userActions';
import toast from 'react-hot-toast';
import Loader from '../../Components/Notifications/Loader';
import { Empty } from '../../Components/Notifications/empty';

function FavoritesMovies() {
  const dispatch = useDispatch();

  const { isLoading, isError, likedMovies } = useSelector(
    (state) => state.userGetFavoriteMovies
  );

  const {
    isLoading: deleteLoading,
    isError: deleteError,
    isSuccess
  } = useSelector((state) => state.userDeleteFavoriteMovies);

  const deleteMoviesHandler = () => {
    if (window.confirm('Are you sure you want to delete all favorites?')) {
      dispatch(deleteAllFavoriteMoviesAction());
    }
  };

  const deleteMovieByIdHandler = (id, kind) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      dispatch(deleteFavoriteMovieByIdAction({ id, kind }));
    }
  };

  useEffect(() => {
    dispatch(getFavoriteMoviesAction());
    if (isError || deleteError) {
      toast.error(isError || deleteError);
      dispatch({
        type: isError ? 'GET_FAVORITE_MOVIES_RESET' : 'DELETE_FAVORITE_MOVIES_RESET'
      });
    }
  }, [dispatch, isError, deleteError, isSuccess]);

  return (
    <SideBar>
      <div className="flex flex-col gap-6">
        <div className="flex-btn gap-2">
          <h2 className="text-xl font-bold">Favorites</h2>
          {likedMovies?.length > 0 && (
            <button
              disabled={deleteLoading}
              onClick={deleteMoviesHandler}
              className="bg-main font-medium transition hover:bg-subMain border-subMain text-white py-3 px-6 rounded"
            >
              {deleteLoading ? 'Deleting...' : 'Delete All'}
            </button>
          )}
        </div>

        {isLoading ? (
          <Loader />
        ) : likedMovies?.length > 0 ? (
          <Table
            data={likedMovies}
            admin={false}
            onDeleteHandler={deleteMovieByIdHandler}
            resolveLink={(item) => (item.__kind === 'series' ? `/series/${item._id}` : `/movie/${item._id}`)}
          />
        ) : (
          <Empty message="You have no favorites" />
        )}
      </div>
    </SideBar>
  );
}

export default FavoritesMovies;
