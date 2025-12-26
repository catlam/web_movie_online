import React, { useEffect, useMemo } from 'react';
import Layout from '../Layout/Layout';
import Banner from '../Components/Home/Banner';
import Promos from '../Components/Home/Promos';
import TopRated from '../Components/Home/TopRated';
import PopularMovies from '../Components/Home/PopularMovies';
import ViewHistory from '../Components/Home/ViewHistory';
import PopularSeries from '../Components/Home/PopularSeries';

import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import { getAllMoviesAction, getRandomMoviesAction, getTopRatedMovieAction } from '../Redux/Actions/MoviesActions';
import { getRandomSeriesAction, listSeriesAction } from '../Redux/Actions/seriesActions';
import RecommendedForYou from '../Components/Home/RecommendedForYou';
import MoodRecommenderWidget from '../Components/Home/MoodRecommenderWidget';

function readUserId() {
  try {
    const raw = localStorage.getItem('userInfo');
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u?._id || u?.id || u?.userId || null;
  } catch {
    return null;
  }
}

function HomeScreen() {
  const dispatch = useDispatch();

  // Movies selectors
  const { isLoading: randomLoading, isError: randomError, movies: randomMovies } =
    useSelector((state) => state.getRandomMovies);
  const { isLoading: topLoading, isError: topError, movies: topMovies } =
    useSelector((state) => state.getTopRatedMovie);
  const { isLoading: allMoviesLoading, isError: allMoviesError, movies: allMovies } =
    useSelector((state) => state.getAllMovies);

  // Series selector (từ reducer seriesList)
  const {
    loading: seriesLoading,
    error: seriesError,
    items: seriesItems,
  } = useSelector((state) => state.seriesRandom || {});

  // const {
  //   loading: seriesLoading,
  //   error: seriesError,
  //   items: seriesItems,
  // } = useSelector((state) => state.seriesList || {});

  // Fetch data
  useEffect(() => {
    dispatch(getRandomMoviesAction(24));
    dispatch(getAllMoviesAction({}));
    dispatch(getTopRatedMovieAction());
    dispatch(getRandomSeriesAction(24));
    // dispatch(listSeriesAction({ limit: 8, sort: 'rate_desc' }));
  }, [dispatch]);

  // Toast lỗi
  useEffect(() => {
    if (randomError || topError || allMoviesError || seriesError) {
      toast.error('Something went wrong!');
    }
  }, [randomError, topError, allMoviesError, seriesError]);

  const userId = useMemo(() => readUserId(), []);

  return (
    <Layout>
      <div className="container px-5 sm:px-8 lg:px-16 xl:px-24 2xl:px-32 max-w-screen-2xl mx-auto">
        <Banner movies={allMovies} isLoading={allMoviesLoading} />
        <ViewHistory />
        <RecommendedForYou
          key={userId || 'guest'}
          pageSize={8}
          limit={8}
          userId={userId}
          hideWhenNoUser={true}
          hideWhenColdStart={true}
        />
        <PopularMovies movies={randomMovies} isLoading={randomLoading} />
        <PopularSeries isLoading={seriesLoading} series={seriesItems} />
        <Promos />
        <TopRated movies={topMovies} isLoading={topLoading} />
        <MoodRecommenderWidget />
      </div>
    </Layout>
  );
}

export default HomeScreen;
