import React, { useEffect, useState } from 'react';
import SideBar from '../SideBar';
import Table from '../../../Components/Table';
import { useDispatch, useSelector } from 'react-redux';
import { deleteAllMoviesAction, deleteMovieAction, getAllMoviesAction } from '../../../Redux/Actions/MoviesActions';
import toast from 'react-hot-toast';
import Loader from '../../../Components/Notifications/Loader';
import { Empty } from '../../../Components/Notifications/empty';
import { TbPlayerTrackNext, TbPlayerTrackPrev } from 'react-icons/tb';

function MoviesList() {
    const dispatch = useDispatch();
    const sameClass = "text-white p-2 rounded font-semibold border-2 border-subMain hover:bg-subMain";

    const { isLoading, isError, movies, pages, page } = useSelector(
        (state) => state.getAllMovies
    );
    const { isLoading: deleteLoading, isError: deleteError, isSuccess } = useSelector(
        (state) => state.deleteMovie
    );
    const { isLoading: allLoading, isError: allError } = useSelector(
        (state) => state.deleteAllMovies
    );

    // --- Search & Sort (A-Z / Z-A) ---
    const [localSearch, setLocalSearch] = useState("");
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("az"); // 'az' | 'za'

    // Debounce search 300ms
    useEffect(() => {
        const t = setTimeout(() => setSearch(localSearch.trim()), 300);
        return () => clearTimeout(t);
    }, [localSearch]);

    // Load lần đầu & khi search/sort đổi -> về page 1
    useEffect(() => {
        dispatch(getAllMoviesAction({ pageNumber: 1, search, sort }));
    }, [dispatch, search, sort]);

    // Reload trang hiện tại sau khi xóa thành công
    const reloadCurrentPage = () => {
        if (isSuccess) {
            dispatch(getAllMoviesAction({ pageNumber: page || 1, search, sort }));
        }
    };

    useEffect(() => {
        reloadCurrentPage();
    }, [isSuccess]);

    const deleteMovieHandler = (id) => {
        if (window.confirm("Are you sure you want to delete this movie?")) {
            dispatch(deleteMovieAction(id));
        }
    };

    const deleteAllMoviesHandler = () => {
        if (window.confirm("Are you sure you want to delete all movies?")) {
            dispatch(deleteAllMoviesAction()).then(() =>
                dispatch(getAllMoviesAction({ pageNumber: 1, search, sort }))
            );
        }
    };

    // Error toast
    useEffect(() => {
        if (isError) toast.error(isError);
        if (deleteError) toast.error(deleteError);
        if (allError) toast.error(allError);
    }, [isError, deleteError, allError]);

    // Pagination
    const nextPage = () => {
        if (page < pages) {
            dispatch(getAllMoviesAction({ pageNumber: page + 1, search, sort }));
        }
    };
    const prevPage = () => {
        if (page > 1) {
            dispatch(getAllMoviesAction({ pageNumber: page - 1, search, sort }));
        }
    };

    return (
        <SideBar>
            <div className="flex flex-col gap-6">
                {/* Header + Filters */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-xl font-bold">Movies List</h2>

                    <div className="flex flex-wrap gap-3 items-center">
                        {/* Search */}
                        <input
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') setSearch(localSearch.trim()); }}
                            placeholder="Search by title…"
                            className="bg-main border border-border rounded px-4 py-2 text-sm text-white w-56"
                        />

                        {/* Sort A→Z / Z→A */}
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="bg-main border border-border rounded px-3 py-2 text-sm text-white"
                        >
                            <option value="az">A → Z</option>
                            <option value="za">Z → A</option>
                        </select>

                        {/* Delete All */}
                        {movies?.length > 0 && (
                            <button
                                disabled={allLoading}
                                onClick={deleteAllMoviesHandler}
                                className="bg-main font-medium transition hover:bg-subMain border border-subMain text-white py-2.5 px-4 rounded"
                            >
                                {allLoading ? "Deleting..." : "Delete All"}
                            </button>
                        )}
                    </div>
                </div>

                {isLoading || deleteLoading ? (
                    <Loader />
                ) : movies?.length > 0 ? (
                    <>
                        <Table data={movies} admin={true} onDeleteHandler={deleteMovieHandler} />
                        {/* Pagination */}
                        <div className="w-full flex-rows gap-6 my-5">
                            <button
                                onClick={prevPage}
                                disabled={page === 1}
                                className={sameClass}
                                title="Previous page"
                            >
                                <TbPlayerTrackPrev className="text-xl" />
                            </button>
                            <span className="text-sm text-white/80">
                                Page {page} / {pages}
                            </span>
                            <button
                                onClick={nextPage}
                                disabled={page === pages}
                                className={sameClass}
                                title="Next page"
                            >
                                <TbPlayerTrackNext className="text-xl" />
                            </button>
                        </div>
                    </>
                ) : (
                    <Empty message="You have no movies" />
                )}
            </div>
        </SideBar>
    );
}

export default MoviesList;