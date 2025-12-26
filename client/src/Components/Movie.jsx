import React from "react";
import { Link } from "react-router-dom";
import { FaHeart } from "react-icons/fa";
import { FaRegHeart } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { IfMovieLiked, LikeMovie } from "../Context/Functionalities";

function Movie({ movie }) {
    const dispatch = useDispatch();
    const { userInfo } = useSelector((s) => s.userLogin);

    const favState = useSelector((s) => s.userGetFavoriteMovies || {});
    const favorites = Array.isArray(favState.favorites) ? favState.favorites : (favState.likedMovies || []);
    const isLoading = !!favState.isLoading;

    const item = { ...movie, __kind: "movie" };
    const isLiked = IfMovieLiked(favorites, item);

    const btnClass = isLiked
        ? "bg-transparent text-red-500 border-red-500 hover:bg-red-500/10"
        : "bg-subMain text-white border-subMain hover:bg-transparent";

    return (
        <div className="border border-border p-1 hover:scale-95 transitions relative rounded overflow-hidden">
            <Link to={`/movie/${movie?._id}`} className="w-full">
                <img
                    src={movie?.image || "/images/user.png"}
                    alt={movie?.name}
                    className="w-full h-96 object-cover"
                />
            </Link>

            <div className="absolute flex-btn gap-2 bottom-0 right-0 left-0 bg-main/60 text-white px-4 py-3">
                <h3 className="font-semibold truncate">{movie?.name}</h3>

                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        LikeMovie(item, dispatch, userInfo, favorites); // toggle add/remove
                    }}
                    disabled={isLoading}
                    aria-pressed={isLiked}
                    title={isLiked ? "Remove from favorites" : "Add to favorites"}
                    className={`h-9 w-9 flex-colo transition border-2 rounded-md ${btnClass}`}
                >
                    {isLiked ? <FaHeart /> : <FaRegHeart />}
                </button>
            </div>
        </div>
    );
}
export default Movie;
