// helpers/getMeta.js
import Movie from "../Models/MoviesModel.js";
import Series from "../Models/SeriesModel.js";

export async function getAllCategories() {
    const movieCats = await Movie.aggregate([
        { $unwind: "$category" },
        { $group: { _id: "$category" } }
    ]);

    const seriesCats = await Series.aggregate([
        { $unwind: "$category" },
        { $group: { _id: "$category" } }
    ]);

    const set = new Set([
        ...movieCats.map(c => c._id),
        ...seriesCats.map(c => c._id),
    ]);

    return Array.from(set);
}

export async function getAllLanguages() {
    const movieLangs = await Movie.distinct("language");
    const seriesLangs = await Series.distinct("language");

    return Array.from(new Set([...movieLangs, ...seriesLangs]));
}
