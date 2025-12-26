import React, { useEffect } from 'react';
import Aos from 'aos';
import { Route, Routes } from 'react-router-dom'
import HomeScreen from './Screens/HomeScreen';
import AboutUs from './Screens/AboutUs';
import ContactUs from './Screens/ContactUs';
import MoviesPage from './Screens/Movies';
import SingleMovie from './Screens/SingleMovie';
import WatchPage from './Screens/WatchPage';
import NotFound from './Screens/NotFound';
import Login from './Screens/Login';
import Register from './Screens/Register';
import Profile from './Screens/Dashboard/Profile';
import Password from './Screens/Dashboard/Password';
import FavoritesMovies from './Screens/Dashboard/FavoritesMovies';
import MoviesList from './Screens/Dashboard/Admin/MovieList';
import Dashboard from './Screens/Dashboard/Admin/Dashboard';
import Categories from './Screens/Dashboard/Admin/Categories';
import Users from './Screens/Dashboard/Admin/Users';
import AddMovie from './Screens/Dashboard/Admin/AddMovie';
import ScrollOnTop from './ScrollOnTop';
import ToastContainer from './Components/Notifications/ToastContainer';
import { AdminProtectedRouter, ProtectedRouter } from './ProtectedRouter';
import { useDispatch, useSelector } from 'react-redux';
import { getAllCategoriesAction } from './Redux/Actions/CategoriesActions';
import { getAllMoviesAction } from './Redux/Actions/MoviesActions';
import { getFavoriteMoviesAction } from './Redux/Actions/userActions';
import toast from 'react-hot-toast';
import EditMovie from './Screens/Dashboard/Admin/EditMovie';
import SingleSeries from './Screens/SingleSeries';
import ForgotPassword from './Screens/ForgotPassword';
import AddSeries from './Screens/Dashboard/Admin/AddSeries';
import SeriesList from './Screens/Dashboard/Admin/SeriesList';
import EditSeries from './Screens/Dashboard/Admin/EditSeries';
import WatchSeriesEpisode from './Screens/WatchSeriesEpisode';
import { listSeriesAction } from './Redux/Actions/seriesActions';
import Membership from './Screens/Dashboard/Membership';
import PaymentPage from './Screens/Landing/PaymentPage';
import ChoosePlanPage from './Screens/Landing/ChoosePlanPage';
import PaymentResult from './Screens/Landing/PaymentResult';
import SubscriptionProtectedRoute from './SubscriptionProtectedRoute';
import useNotificationSocket from './Hooks/useNotificationSocket';
import AdminPlans from './Screens/Dashboard/Admin/AdminPlans';



function App() {
  Aos.init();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.userLogin);
  const { isError, isSuccess } = useSelector((state) => state.userLikeMovie);
  const { isError: catError } = useSelector((state) => state.categoryGetAll);
  const token = userInfo?.token;

  useEffect(() => {
    dispatch(getAllCategoriesAction())
    dispatch(getAllMoviesAction({}))
    dispatch(listSeriesAction({}));
    if (userInfo) {
      dispatch(getFavoriteMoviesAction())
    }
    if (isError || catError) {
      toast.error("Something went wrong, please try again")
      dispatch({ type: 'LIKE_MOVIE_RESET' })
    }
    if (isSuccess) {
      dispatch({ type: "LIKE_MOVIE_RESET" })
    }
  }, [dispatch, userInfo, isError, catError, isSuccess])

  useNotificationSocket(token);


  return (
    <>
      <ToastContainer />
      <ScrollOnTop>
        <Routes>
          <Route path="/choose-plan" element={<ChoosePlanPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          {/***********PUBLIC ROUTERS***************/}
          <Route path="/" element={<HomeScreen />}/>
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/movies/:search" element={<MoviesPage />} />
          <Route path="/movie/:id" element={<SingleMovie />} />
          <Route path="/series/:id" element={<SingleSeries />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgotPassword" element={<ForgotPassword />} />

          
          <Route path="/payment/result" element={<PaymentResult />} />

          <Route path="*" element={<NotFound />} />

          {/***********PRIVATE PUBLIC ROUTERS***************/}
          <Route element={<ProtectedRouter />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/membership" element={<Membership />} />
            <Route path="/password" element={<Password />} />
            <Route path="/favorites" element={<FavoritesMovies />} />

            <Route element={<SubscriptionProtectedRoute />}>
              <Route path="/watch/:id" element={<WatchPage />} />
              <Route path="/watch/episode/:episodeId" element={<WatchSeriesEpisode />} />
            </Route>
            {/***********ADMIN ROUTERS***************/}
            <Route element={<AdminProtectedRouter />} >
              <Route path="/movieslist" element={<MoviesList />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/users" element={<Users />} />
              <Route path="/addmovie" element={<AddMovie />} />
              <Route path="/edit/:id" element={<EditMovie />} />
              <Route path="/addSeries" element={<AddSeries />} />
              <Route path="/seriesList" element={<SeriesList />} />
              <Route path="/editSeries/:id" element={<EditSeries />} />
              <Route path="/plans" element={<AdminPlans />} />
            </Route>
          </Route>
        </Routes>
      </ScrollOnTop>
    </>
  );
}

export default App;