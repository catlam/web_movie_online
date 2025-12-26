
// utils/mapRecoToMovie.js
export const mapRecoToMovie = (r) => ({
    _id: r.movieId,
    name: r.title || "Untitled",
    title: r.title || "Untitled",
    image: r.posterUrl || r.titleImage || r.image || "",
    category: r.genres?.[0] || "Recommended",
    year: r.year ?? null,
    score: r.score,    
    rate: r.rate ?? 0
});
