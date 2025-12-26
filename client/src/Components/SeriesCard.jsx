import React from "react";
import { Link } from "react-router-dom";
import { FaHeart } from "react-icons/fa";
import { FaRegHeart } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { IfMovieLiked, LikeMovie } from "../Context/Functionalities";

function SeriesCard({ series, noLink = false }) {
    const dispatch = useDispatch();
    const { userInfo } = useSelector((s) => s.userLogin);

    const favState = useSelector((s) => s.userGetFavoriteMovies || {});
    const favorites = Array.isArray(favState.favorites) ? favState.favorites : (favState.likedMovies || []);
    const isLoading = !!favState.isLoading;

    const item = { ...series, __kind: "series" };
    const isLiked = IfMovieLiked(favorites, item);

    const Img = (
        <img
            src={series?.image ? series.image : series?.titleImage || "/images/user.png"}
            alt={series?.name || series?.title || "Series"}
            className="w-full h-96 object-cover"
            loading="lazy"
            decoding="async"
        />
    );

    const btnClass = isLiked
        ? "bg-transparent text-red-500 border-red-500 hover:bg-red-500/10"
        : "bg-subMain text-white border-subMain hover:bg-transparent";

    return (
        <div className="border border-border p-1 hover:scale-95 transitions relative rounded overflow-hidden">
            {noLink ? Img : <Link to={`/series/${series?._id}`} className="w-full">{Img}</Link>}

            <div className="absolute flex-btn gap-2 bottom-0 right-0 left-0 bg-main/60 text-white px-4 py-3">
                <h3 className="font-semibold truncate">
                    {series?.name || series?.title || "Untitled"}
                </h3>

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

export default SeriesCard;
