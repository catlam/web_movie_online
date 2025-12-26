import React, { useEffect, useState } from 'react';
import SideBar from '../SideBar';
import { useDispatch, useSelector } from 'react-redux';
import { listSeriesAction, deleteSeriesAction } from '../../../Redux/Actions/seriesActions';
import toast from 'react-hot-toast';
import Loader from '../../../Components/Notifications/Loader';
import { Empty } from '../../../Components/Notifications/empty';
import { TbPlayerTrackNext, TbPlayerTrackPrev } from 'react-icons/tb';
import SeriesTable from '../../../Components/SeriesTable';

function SeriesList() {
    const dispatch = useDispatch();

    const btnClass =
        'text-white p-2 rounded font-semibold border-2 border-subMain hover:bg-subMain';

    const rootState = useSelector((s) => s);
    const seriesListState = rootState.seriesList || rootState.getAllSeries || {};

    const {
        isLoading = false,
        isError = null,
        items = [],
        page: reduxPage = 1, // nếu backend trả về trang hiện tại, có thể bỏ qua
        pages = 1,
    } = seriesListState;

    const { isLoading: deleteLoading = false, isError: deleteError = null } =
        rootState.deleteSeries || {};

    // ---- Local filters & pagination (NO URL SYNC) ----
    const [localSearch, setLocalSearch] = useState('');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('az');
    const [page, setPage] = useState(1); // chỉ đổi số trang ở đây

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setSearch(localSearch.trim()), 300);
        return () => clearTimeout(t);
    }, [localSearch]);

    // Reset về trang 1 khi đổi filter
    useEffect(() => {
        setPage(1);
    }, [search, sort]);

    // Load data theo local page
    useEffect(() => {
        dispatch(
            listSeriesAction({
                pageNumber: page,
                search,
                sort,
                limit: 5,
            })
        );
    }, [dispatch, page, search, sort]);

    // Xóa series -> reload ngay trang hiện tại (theo local page)
    const deleteSeriesHandler = (id) => {
        if (window.confirm('Are you sure you want to delete this series?')) {
            dispatch(deleteSeriesAction(id)).then(() => {
                dispatch(listSeriesAction({ pageNumber: page, search, sort, limit: 5 }));
            });
        }
    };

    // Error toasts
    useEffect(() => {
        if (isError) toast.error(isError);
        if (deleteError) toast.error(deleteError);
    }, [isError, deleteError]);

    // Pagination handlers (không đổi URL)
    const nextPage = () => {
        setPage((p) => (p < pages ? p + 1 : p));
    };

    const prevPage = () => {
        setPage((p) => (p > 1 ? p - 1 : p));
    };

    const data = items || [];

    return (
        <SideBar>
            <div className="flex flex-col gap-6">
                {/* Header + Filters */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-xl font-bold">Series List</h2>

                    <div className="flex flex-wrap gap-3 items-center">
                        {/* Search */}
                        <input
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') setSearch(localSearch.trim());
                            }}
                            placeholder="Search by title…"
                            className="bg-main border border-border rounded px-4 py-2 text-sm text-white w-56"
                        />

                        {/* Sort */}
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="bg-main border border-border rounded px-3 py-2 text-sm text-white"
                        >
                            <option value="az">A to Z</option>
                            <option value="za">Z to A</option>
                        </select>
                    </div>
                </div>

                {isLoading || deleteLoading ? (
                    <Loader />
                ) : data?.length > 0 ? (
                    <>
                        <SeriesTable
                            data={data}
                            admin={true}
                            onDeleteHandler={deleteSeriesHandler}
                        />

                        {/* Pagination */}
                        <div className="w-full flex-rows gap-6 my-5">
                            <button
                                onClick={prevPage}
                                disabled={page === 1}
                                className={`${btnClass} ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                className={`${btnClass} ${page === pages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Next page"
                            >
                                <TbPlayerTrackNext className="text-xl" />
                            </button>
                        </div>
                    </>
                ) : (
                    <Empty message="You have no series" />
                )}
            </div>
        </SideBar>
    );
}

export default SeriesList;
