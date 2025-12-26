import React, { useMemo, useState } from 'react';
import Titles from "../Titles";
import { BsBookmarkStarFill, BsCaretLeftFill, BsCaretRightFill } from "react-icons/bs";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import { FaHeart } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Rating from "../Stars";
import { Empty } from "../Notifications/empty"
import Loader from "../Notifications/Loader"

import 'swiper/swiper-bundle.css';
import { useDispatch, useSelector } from 'react-redux';
import { IfMovieLiked, LikeMovie } from '../../Context/Functionalities';

const SwiperTop = ({ prevEl, nextEl, movies }) => {
  const { isLoading } = useSelector((state) => state.userLikeMovie);
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.userLogin);

  const isLiked = (movie) => IfMovieLiked(movie);

  return (
    <Swiper
      navigation={{ nextEl, prevEl }}
      slidesPerView={4}
      autoplay={{ delay: 2500, disableOnInteraction: false }}
      speed={800}
      loop={true}
      modules={[Navigation, Autoplay]}
      breakpoints={{
        0: {
          slidesPerView: 2,
          spaceBetween: 8
        },
        640: {
          slidesPerView: 3,
          spaceBetween: 12
        },
        1024: {
          slidesPerView: 4,
          spaceBetween: 20
        },
      }}
    >
      {movies?.map((movie, index) => (
        <SwiperSlide key={movie?._id || index}>
          {/* Wrapper giống Netflix Top10 */}
          <div className="relative flex items-center justify-center py-6">
            {/* Số thứ tự to phía sau poster */}
            <span
              className="
                absolute 
                -left-2 md:-left-4 
                top-1/2 -translate-y-1/2
                text-[70px] sm:text-[90px] md:text-[110px] lg:text-[130px]
                font-black text-white/10 select-none
                pointer-events-none
              "
            >
              {index + 1}
            </span>

            {/* Poster + nút like + rating */}
            <div className="relative z-10 w-28 sm:w-32 md:w-40 lg:w-44">
              <div className="relative rounded-lg overflow-hidden shadow-lg">
                <Link to={`/movie/${movie?._id}`}>
                  <img
                    src={movie?.image ? movie.image : "/images/user.png"}
                    alt={movie?.name}
                    className="w-full h-40 sm:h-44 md:h-56 lg:h-60 object-cover 
                               transition-transform duration-300 hover:scale-105"
                  />
                </Link>

                {/* Heart ở góc trên phải */}
                <button
                  onClick={() => LikeMovie(movie, dispatch, userInfo)}
                  disabled={isLiked(movie) || isLoading}
                  className={`
                    absolute top-2 right-2 
                    w-8 h-8 flex-colo rounded-full text-xs
                    transition
                    ${isLiked(movie)
                      ? "bg-subMain text-white"
                      : "bg-black/60 hover:bg-subMain text-white"
                    }
                  `}
                >
                  <FaHeart />
                </button>
              </div>

              {/* Tên + rating ở dưới (nhỏ, không phá layout Netflix) */}
              <div className="mt-2 text-center space-y-1">
                <Link
                  to={`/movie/${movie?._id}`}
                  className="block text-xs sm:text-sm font-semibold line-clamp-2"
                  title={movie?.name}
                >
                  {movie?.name}
                </Link>
                <div className="flex items-center justify-center gap-1 text-star text-xs">
                  <Rating value={movie?.rate} />
                  {typeof movie?.rate === "number" && (
                    <span>{movie.rate.toFixed(1)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

function TopRated({ movies, isLoading }) {
  const [nextEl, setNextEl] = useState(null);
  const [prevEl, setPrevtEl] = useState(null);
  const classNames =
    "hover:bg-dry transitions text-sm rounded w-8 h-8 flex-colo bg-subMain text-white";

  const topRatedMovies = useMemo(() => {
    if (!Array.isArray(movies)) return [];
    return [...movies]
      .filter((m) => typeof m?.rate === "number")
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 8);
  }, [movies]);

  return (
    <div className="my-16">
      <Titles title="Top Rated" Icon={BsBookmarkStarFill} />
      <div className="mt-10">
        {isLoading ? (
          <Loader />
        ) : topRatedMovies?.length > 0 ? (
          <SwiperTop nextEl={nextEl} prevEl={prevEl} movies={topRatedMovies} />
        ) : (
          <Empty message="It seems like we don't have any top rated movie yet" />
        )}

        {/* Nút điều hướng swiper */}
        <div className="w-full px-1 flex-rows gap-6 pt-8 justify-center">
          <button className={classNames} ref={(node) => setPrevtEl(node)}>
            <BsCaretLeftFill />
          </button>
          <button className={classNames} ref={(node) => setNextEl(node)}>
            <BsCaretRightFill />
          </button>
        </div>
      </div>
    </div>
  );
}

export default TopRated;
