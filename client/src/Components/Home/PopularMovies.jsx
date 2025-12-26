import React, { useState, useMemo, useEffect } from "react";
import Titles from "../Titles";
import { BsCollectionFill } from "react-icons/bs";
import { Empty } from "../Notifications/empty";
import Loader from "../Notifications/Loader";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import Rating from "../Stars";
import { TbX, TbPlayerTrackPrev, TbPlayerTrackNext } from "react-icons/tb";
import Movie from "../Movie";

import { FaHeart } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { IfMovieLiked, LikeMovie } from "../../Context/Functionalities";

function PopularMovies({ isLoading, movies = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Like state
  const { isLoading: likeLoading } = useSelector((state) => state.userLikeMovie);
  const { userInfo } = useSelector((state) => state.userLogin);
  const dispatch = useDispatch();

  const isLiked = (movie) => IfMovieLiked(movie);

  // Top 10 movie
  const topMovies = useMemo(() => movies.slice(0, 10), [movies]);

  const itemsPerView = 5;
  const [offset, setOffset] = useState(0);
  const [direction, setDirection] = useState(1); // 1: next, -1: prev

  useEffect(() => {
    setOffset(0);
  }, [topMovies.length]);

  const maxOffset = Math.max(0, topMovies.length - itemsPerView);
  const visibleMovies = topMovies.slice(offset, offset + itemsPerView);

  const handlePrevRow = () => {
    if (offset === 0) return;
    setDirection(-1);
    setOffset((prev) => Math.max(prev - 1, 0)); // lùi từng 1 film
  };

  const handleNextRow = () => {
    if (offset === maxOffset) return;
    setDirection(1);
    setOffset((prev) => Math.min(prev + 1, maxOffset)); // tiến từng 1 film
  };

  return (
    <div className="my-16 relative">
      {/* Header: Title + More */}
      <div className="flex items-center justify-between gap-4">
        <Titles title="Popular Movies" Icon={BsCollectionFill} />
        {movies.length > 0 && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-sm md:text-base text-subMain hover:text-white border border-subMain px-4 py-1.5 rounded-full font-semibold transitions"
          >
            More
          </button>
        )}
      </div>

      {/* Main content */}
      {isLoading ? (
        <div className="mt-6">
          <Loader />
        </div>
      ) : movies.length > 0 ? (
        <>
          <div className="mt-10 flex items-center justify-center gap-6">
            {/* Prev */}
            <button
              onClick={handlePrevRow}
              disabled={offset === 0}
              className="
                hidden md:flex
                w-11 h-11 rounded-full flex-colo
                bg-black/40 hover:bg-black/70 text-white
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              <TbPlayerTrackPrev className="text-2xl" />
            </button>

            <div className="overflow-hidden max-w-6xl">
              <motion.div
                key={offset}
                initial={{ x: direction > 0 ? 40 : -40, opacity: 0.9 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex flex-nowrap gap-8"
              >
                {visibleMovies.map((movie, index) => {
                  const realIndex = offset + index;
                  const rank = realIndex + 1;

                  return (
                    <div
                      key={movie._id || realIndex}
                      className="relative flex-shrink-0 flex flex-col items-center justify-start"
                    >
                      <span
                        className="
                          absolute
                          -left-4
                          bottom-0 translate-y-1/3
                          text-[80px] sm:text-[100px] md:text-[120px]
                          font-black text-white/10
                          select-none pointer-events-none
                        "
                      >
                        {rank}
                      </span>

                      {/* Poster + info */}
                      <div className="relative z-10 w-32 sm:w-40 md:w-48">
                        <div className="relative rounded-xl overflow-hidden shadow-lg">
                          <Link to={`/movie/${movie?._id}`}>
                            <img
                              src={movie?.image ? movie.image : "/images/user.png"}
                              alt={movie?.name}
                              className="w-full h-48 sm:h-56 md:h-64 object-cover
                                         transition-transform duration-300 hover:scale-105"
                            />
                          </Link>

                          {/* Heart like (giống TopRated) */}
                          <button
                            onClick={() => LikeMovie(movie, dispatch, userInfo)}
                            disabled={isLiked(movie) || likeLoading}
                            className={`
                              absolute top-2 right-2
                              w-8 h-8 flex-colo rounded-full text-xs
                              transition
                              ${isLiked(movie)
                                ? "bg-subMain text-white"
                                : "bg-black/60 hover:bg-subMain text-white"
                              }
                            `}
                            title={isLiked(movie) ? "Liked" : "Like"}
                          >
                            <FaHeart />
                          </button>
                        </div>

                        <div className="mt-3 text-center space-y-1">
                          <Link
                            to={`/movie/${movie?._id}`}
                            className="block text-sm md:text-base font-semibold truncate max-w-[180px]"
                            title={movie?.name}
                          >
                            {movie?.name}
                          </Link>

                          <div className="flex items-center justify-center gap-1 text-star text-xs md:text-sm">
                            <Rating value={movie?.rate} />
                            {typeof movie?.rate === "number" && (
                              <span>{movie.rate.toFixed(1)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </div>

            {/* Next */}
            <button
              onClick={handleNextRow}
              disabled={offset === maxOffset}
              className="
                hidden md:flex
                w-11 h-11 rounded-full flex-colo
                bg-black/40 hover:bg-black/70 text-white
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              <TbPlayerTrackNext className="text-2xl" />
            </button>
          </div>
        </>
      ) : (
        <div className="mt-6">
          <Empty message="It seem's like we don't have any movie" />
        </div>
      )}

      {/* MODAL: All movies */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="
              fixed inset-0 
              z-[9999]
              bg-black/70 
              flex items-start justify-center 
              pt-10
            "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              className="
                bg-main 
                w-full max-w-6xl 
                max-h-[80vh] 
                rounded-xl 
                overflow-hidden 
                flex flex-col 
                border border-border
              "
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-base md:text-lg font-semibold text-white">
                  All Popular Movies
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 flex-colo rounded-full hover:bg-white/10 text-white"
                >
                  <TbX className="text-xl" />
                </button>
              </div>

              {/* Modal content */}
              <div className="p-4 overflow-y-auto overflow-x-hidden">
                {movies.length > 0 ? (
                  <div className="grid xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">
                    {movies.map((movie, index) => (
                      <Movie key={movie._id || index} movie={movie} />
                    ))}
                  </div>
                ) : (
                  <Empty message="It seem's like we don't have any movie" />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PopularMovies;
