import React from 'react';
import { Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import FlexMovieItems from '../FlexMovieItems';
import { Link } from "react-router-dom";
import { FaHeart } from 'react-icons/fa';
import Loader from '../Notifications/Loader';
import { RiMovie2Line } from 'react-icons/ri';
import { useDispatch, useSelector } from 'react-redux';
import { IfMovieLiked, LikeMovie } from '../../Context/Functionalities';

const Swipper = ({ sameClass, movies }) => {
    const dispatch = useDispatch();
    const { userInfo } = useSelector((s) => s.userLogin);
    // lấy favorites từ slice; hỗ trợ nhiều shape → reducer của bạn nên chuẩn hóa về { favorites: [] }
    const { favorites = [], isLoading } = useSelector((s) => s.userGetFavoriteMovies || {});

    // helper: chuẩn hóa item có __kind
    const toItem = (m) => ({ ...m, __kind: 'movie' });

    return (
        <Swiper
            direction="vertical"
            spaceBetween={0}
            slidesPerView={1}
            speed={1000}
            modules={[Autoplay]}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            className={sameClass}
        >
            {movies?.slice(0, 5).map((movie) => {
                const item = toItem(movie);
                const liked = IfMovieLiked(favorites, item);
                return (
                    <SwiperSlide key={movie?._id} className="relative rounded overflow-hidden">
                        <img
                            src={movie?.titleImage || "/images/user.png"}
                            alt={movie?.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute linear-bg xl:pl-52 sm:pl-32 pl-8 top-0 bottom-0 right-0 left-0 flex flex-col justify-center lg:gap-8 md:gap-5 gap-4">
                            <h1 className="xl:text-4xl truncate capitalize font-sans sm:text-2xl text-xl font-bold">
                                {movie?.name}
                            </h1>
                            <div className="flex gap-5 items-center text-dryGray">
                                <FlexMovieItems movie={movie} />
                            </div>
                            <div className="flex gap-5 items-center">
                                <Link
                                    to={`/movie/${movie?._id}`}
                                    className="bg-subMain hover:text-main transitions text-white px-8 py-3 rounded font-medium sm:text-sm text-xs"
                                >
                                    Watch
                                </Link>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        LikeMovie(item, dispatch, userInfo, favorites);
                                    }}
                                    disabled={isLoading}
                                    className={`px-8 py-3 rounded text-sm bg-white/30 transitions border-2 border-subMain 
                    ${liked ? "text-subMain" : "text-white"} hover:text-subMain`}
                                    aria-label={liked ? "Liked" : "Like"}
                                    title={liked ? "Liked" : "Like"}
                                >
                                    <FaHeart />
                                </button>
                            </div>
                        </div>
                    </SwiperSlide>
                );
            })}
        </Swiper>
    );
};

function Banner({ movies, isLoading }) {
    const sameClass = "w-full flex-colo xl:h-[500px] lg:h-[400px] h-[300px]";
    return (
        <div className="relative w-full ">
            {isLoading ? (
                <div className={sameClass}>
                    <Loader />
                </div>
            ) : movies?.length > 0 ? (
                <Swipper sameClass={sameClass} movies={movies} />
            ) : (
                <div className={sameClass}>
                    <div className="flex-colo w-24 h-24 p-5 mb-4 rounded-full bg-dry text-subMain text-4xl">
                        <RiMovie2Line />
                    </div>
                    <p className="text-border text-sm">It seem's like we don't have any movie</p>
                </div>
            )}
        </div>
    );
}

export default Banner;
