import React, { useEffect, useMemo } from 'react';
import SideBar from '../SideBar';
import { FaRegListAlt, FaUser, FaPlus } from 'react-icons/fa';
import { HiViewGridAdd } from 'react-icons/hi';
import { PiTelevisionSimpleFill } from 'react-icons/pi';
import { useDispatch, useSelector } from 'react-redux';
import { getAllUsersAction } from '../../../Redux/Actions/userActions';
import toast from 'react-hot-toast';
import { getAllMoviesAction } from '../../../Redux/Actions/MoviesActions';
import { listSeriesAction } from '../../../Redux/Actions/seriesActions';
import { Link } from 'react-router-dom';

function Dashboard() {
  const dispatch = useDispatch();

  // categories
  const { isLoading: catLoading, isError: catError, categories } =
    useSelector((state) => state.categoryGetAll);

  // users
  const { isLoading: userLoading, isError: userError, users } =
    useSelector((state) => state.adminGetAllUsers);

  // movies
  const {
    isLoading,
    isError,
    movies: moviesRaw,
    totalMovies = 0,
  } = useSelector((state) => state.getAllMovies);

  // series
  const seriesListState = useSelector((s) => s.seriesList || s.getAllSeries || {});
  const {
    isLoading: seriesLoading = false,
    isError: seriesError = null,
    items: seriesItemsRaw = [],
    total: totalSeries = 0,
  } = seriesListState;

  const movies = Array.isArray(moviesRaw) ? moviesRaw : [];
  const seriesItems = Array.isArray(seriesItemsRaw) ? seriesItemsRaw : [];

  useEffect(() => {
    dispatch(getAllUsersAction());
    dispatch(getAllMoviesAction({ pageNumber: 1, limit: 200 }));
    dispatch(listSeriesAction({ pageNumber: 1, limit: 200 }));
    if (isError || catError || userError || seriesError) {
      toast.error('Something went wrong!');
    }
  }, [dispatch, isError, catError, userError, seriesError]);

  // ===== Stats cards =====
  const DashboardData = [
    {
      bg: 'bg-orange-600',
      icon: FaRegListAlt,
      title: 'Total Movies',
      total: isLoading ? 'Loading...' : totalMovies,
    },
    {
      bg: 'bg-violet-600',
      icon: PiTelevisionSimpleFill,
      title: 'Total Series',
      total: seriesLoading ? 'Loading...' : totalSeries,
    },
    {
      bg: 'bg-blue-700',
      icon: HiViewGridAdd,
      title: 'Total Categories',
      total: catLoading ? 'Loading...' : (categories?.length || 0),
    },
    {
      bg: 'bg-green-600',
      icon: FaUser,
      title: 'Total Users',
      total: userLoading ? 'Loading...' : (users?.length || 0),
    },
  ];

  // ===== Derived snapshots (no charts) =====
  const topCategories = useMemo(() => {
    const count = {};
    const add = (it) => {
      let c = 'Unknown';
      if (typeof it?.category === 'string') c = it.category;
      else if (Array.isArray(it?.category) && it.category[0]) c = it.category[0];
      count[c] = (count[c] || 0) + 1;
    };
    movies.forEach(add);
    seriesItems.forEach(add);
    return Object.entries(count)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [movies, seriesItems]);

  const yearSnapshot = useMemo(() => {
    const cur = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => cur - 4 + i);
    const bucket = Object.fromEntries(years.map(y => [y, 0]));
    const safeYear = (v) => {
      const y = parseInt(v, 10);
      return Number.isFinite(y) ? y : null;
    };
    const addYear = (arr) => {
      arr.forEach(it => {
        const y = safeYear(it?.year);
        if (y && bucket.hasOwnProperty(y)) bucket[y] += 1;
      });
    };
    addYear(movies);
    addYear(seriesItems);
    return years.map(y => ({ year: String(y), total: bucket[y] }));
  }, [movies, seriesItems]);

  return (
    <SideBar>
      <h2 className="text-xl font-bold">Dashboard</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
        {DashboardData.map((data, index) => (
          <div
            key={index}
            className="p-4 rounded bg-main border border-border grid grid-cols-4 gap-2"
          >
            <div className={`col-span-1 rounded-full h-12 w-12 flex-colo ${data.bg}`}>
              <data.icon />
            </div>
            <div className="col-span-3">
              <h2 className="text-sm text-border">{data.title}</h2>
              <p className="mt-2 font-bold text-white">{data.total}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-main border border-border rounded p-4">
        <h3 className="text-md font-medium text-border mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/addMovie"
            className="px-3 py-2 rounded border border-border text-white bg-dry hover:bg-subMain transition flex items-center gap-2"
          >
            <FaPlus className="text-sm" /> New Movie
          </Link>
          <Link
            to="/addSeries"
            className="px-3 py-2 rounded border border-border text-white bg-dry hover:bg-subMain transition flex items-center gap-2"
          >
            <FaPlus className="text-sm" /> New Series
          </Link>
          <Link
            to="/categories"
            className="px-3 py-2 rounded border border-border text-white bg-dry hover:bg-subMain transition"
          >
            Manage Categories
          </Link>
          <Link
            to="/users"
            className="px-3 py-2 rounded border border-border text-white bg-dry hover:bg-subMain transition"
          >
            Manage Users
          </Link>
        </div>
      </div>

      {/* Snapshots (text lists) */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Snapshot */}
        <div className="bg-main border border-border rounded p-4">
          <h3 className="text-md font-medium text-border mb-3">Top Categories</h3>
          {topCategories.length ? (
            <ul className="space-y-2">
              {topCategories.map((c) => (
                <li
                  key={c.name}
                  className="flex items-center justify-between text-sm text-white/90 bg-dry px-3 py-2 rounded border border-border"
                >
                  <span className="truncate pr-3">{c.name}</span>
                  <span className="font-semibold">{c.total}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-white/60">No data</p>
          )}
        </div>

        {/* Year Snapshot */}
        <div className="bg-main border border-border rounded p-4">
          <h3 className="text-md font-medium text-border mb-3">Titles by Year (last 5)</h3>
          {yearSnapshot.some(y => y.total > 0) ? (
            <ul className="space-y-2">
              {yearSnapshot.map((y) => (
                <li
                  key={y.year}
                  className="flex items-center justify-between text-sm text-white/90 bg-dry px-3 py-2 rounded border border-border"
                >
                  <span>{y.year}</span>
                  <span className="font-semibold">{y.total}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-white/60">No releases in the last 5 years</p>
          )}
        </div>
      </div>
    </SideBar>
  );
}

export default Dashboard;
