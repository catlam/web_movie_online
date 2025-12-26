import toast from "react-hot-toast";
import {
    likeMovieAction,
    deleteFavoriteMovieByIdAction,
} from "../Redux/Actions/userActions";

/** Chuẩn hoá favorites từ nhiều shape khác nhau của Redux slice */
const normalizeFavorites = (src) => {
    if (Array.isArray(src)) return src;
    if (src && Array.isArray(src.favorites)) return src.favorites;
    if (src && Array.isArray(src.likedMovies)) return src.likedMovies;
    if (src && Array.isArray(src.items)) return src.items;
    return [];
};

/** Lấy id item theo nhiều field khác nhau */
const getItemId = (item) =>
    item?._id || item?.id || item?.movieId || item?.seriesId || null;

/** Chuẩn hoá kind cho server: "Movie" | "Series" */
const getServerKind = (item) => {
    // ưu tiên marker tự set
    if (item?.__kind === "series") return "Series";
    if (item?.__kind === "movie") return "Movie";

    // fallback theo field phổ biến
    const k = (item?.kind || item?.type || "").toString().toLowerCase();
    if (k === "series") return "Series";
    if (k === "movie") return "Movie";

    // nếu không biết thì mặc định Movie (đỡ phá luồng cũ)
    return "Movie";
};

/**
 * IfMovieLiked: chịu mọi kiểu gọi
 * - IfMovieLiked(movie)                        // kiểu cũ (TopRated đang dùng)
 * - IfMovieLiked(favorites, movie)
 * - IfMovieLiked(movie, favorites)
 */
export const IfMovieLiked = (a, b) => {
    // Case 1: gọi kiểu cũ IfMovieLiked(item)
    if (b === undefined) {
        const item = a;
        const id = getItemId(item);
        if (!id) return false;

        // ưu tiên lấy favorites từ localStorage nếu có (để không cần truyền redux state)
        try {
            const raw = localStorage.getItem("favorites");
            if (!raw) return false;
            const favorites = normalizeFavorites(JSON.parse(raw));
            const kind = getServerKind(item);
            return favorites.some(
                (f) => getItemId(f) === id && getServerKind(f) === kind
            );
        } catch {
            return false;
        }
    }

    // Case 2/3: có 2 tham số, tự đoán cái nào là favorites
    const favoritesMaybe = Array.isArray(a) || a?.favorites || a?.likedMovies || a?.items ? a : b;
    const itemMaybe = favoritesMaybe === a ? b : a;

    const favorites = normalizeFavorites(favoritesMaybe);
    const id = getItemId(itemMaybe);
    if (!id) return false;

    const kind = getServerKind(itemMaybe);
    return favorites.some(
        (f) => getItemId(f) === id && getServerKind(f) === kind
    );
};

/**
 * Toggle like/unlike (movie/series đều chơi)
 * favoritesMaybe: optional (nếu có truyền redux favorites vào thì check chuẩn hơn)
 */
export const LikeMovie = (item, dispatch, userInfo, favoritesMaybe) => {
    if (!userInfo?._id) {
        toast.error("Please sign in to add to favorites");
        return;
    }

    const id = getItemId(item);
    if (!id) {
        toast.error("Missing item id");
        return;
    }

    const kind = getServerKind(item);

    // nếu không truyền favoritesMaybe thì IfMovieLiked(item) sẽ check bằng localStorage (fallback)
    const liked =
        favoritesMaybe !== undefined
            ? IfMovieLiked(favoritesMaybe, item)
            : IfMovieLiked(item);

    if (liked) {
        dispatch(deleteFavoriteMovieByIdAction({ id, kind }));
    } else {
        dispatch(likeMovieAction({ id, kind }));
    }
};
