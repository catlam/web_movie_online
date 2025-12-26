import asyncHandler from "express-async-handler";
import { MoviesData } from "../Data/MovieData.js";
import Movie from "../Models/MoviesModel.js";
import { searchMovies, upsertMovie, deleteMovie as esDeleteMovie } from "../config/elastic.js";
import { createMovieNotification } from "./notificationController.js";


// ************PUBLIC CONTROLLERS******************
// @desc import movies
// @route POST /api/movies/import
// @access Public

const importMovies = asyncHandler(async (req, res) => {
  // first we make sure our Movies table is empty by delete all document 
  await Movie.deleteMany({});
  // then we insert all movies from MoviesData
  const movies = await Movie.insertMany(MoviesData);
  res.status(201).json(movies);
});

// @desc get all movies
// @route GET /api/movies
// @access Public

const getMovies = asyncHandler(async (req, res) => {
  try {
    const { category, time, language, rate, year, search, sort = "az" } = req.query;

    // ===================== ELASTICSEARCH (ưu tiên) =====================
    try {
      const esParams = {
        q: search || "",
        category: category || undefined,
        language: language || undefined,
        year: year ? Number(year) : undefined,
        minRate: rate ? Number(rate) : undefined,
        page: Number(req.query.pageNumber) || 1,
        limit: 5,
        sort: ["az", "za", "newest", "oldest", "rate_desc", "rate_asc"].includes(String(sort)) ? sort : "az",
      };

      const esResp = await searchMovies(esParams);
      if (esResp && !esResp.error && Array.isArray(esResp.hits)) {
        return res.json({
          movies: esResp.hits,          // [{ _id, name, ... }]
          page: esResp.page,
          pages: esResp.pages,
          totalMovies: esResp.total,
          limit: esResp.limit,
          sort: esParams.sort,
        });
      }
    } catch (_) {
      // ES chưa chạy / lỗi → bỏ qua, dùng MongoDB
    }

    // ===================== FALLBACK MONGODB =====================
    // Bộ lọc cơ bản theo trường cấu trúc
    const baseFilters = {
      ...(category && { category }),
      ...(time && { time }),
      ...(language && { language }),
      ...(year && { year: Number(year) }),  
      ...(rate && { rate: { $gte: Number(rate) } }), 
    };

    // Tìm kiếm text mở rộng: name, desc, category, language, casts.name
    const textFilter = search
      ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { desc: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
          { language: { $regex: search, $options: "i" } },
          { "casts.name": { $regex: search, $options: "i" } }, // search theo diễn viên
        ],
      }
      : {};

    const query = { ...baseFilters, ...textFilter };

    // Phân trang
    const page = Number(req.query.pageNumber) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    // Sort
    let sortSpec = { name: 1 };     // A → Z
    if (sort === "za") sortSpec = { name: -1 };      // Z → A
    if (sort === "newest") sortSpec = { createdAt: -1 }; // mới nhất
    if (sort === "oldest") sortSpec = { createdAt: 1 };  // cũ nhất
    if (sort === "rate_desc") sortSpec = { rate: -1 };     // rate cao → thấp
    if (sort === "rate_asc") sortSpec = { rate: 1 };      // rate thấp → cao

    const [movies, count] = await Promise.all([
      Movie.find(query).sort(sortSpec).skip(skip).limit(limit),
      Movie.countDocuments(query),
    ]);

    return res.json({
      movies,
      page,
      pages: Math.ceil(count / limit),
      totalMovies: count,
      limit,
      sort,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});


// @desc get movies by id
// @route GET /api/movies/:id
// @access Public
const getMovieById = asyncHandler(async (req, res) => {
  try {

    //find movie by id in database
    const movie = await Movie.findById(req.params.id);
    //if the movie if found  send it to the client
    if (movie) {
      res.json(movie);
    }
    //if the movie is not found send a 404 error
    else {
      res.status(404);
      throw new Error("Movie not found");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
})

// @desc get top rated movies
// @route GET /api/movies/rated
// @access Public
const getTopRatedMovies = asyncHandler(async (req, res) => {
  try {
    //find top rated movies
    const movies = await Movie.find({}).sort({ rate: -1 });
    //send top rated movies to the client
    res.json(movies);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
})

// @desc get random movies
// @route GET /api/movies/random/all
// @access Public
const getRandomMovies = asyncHandler(async (req, res) => {
  try {
    const size = Math.min(Math.max(parseInt(req.query.size, 10) || 8, 1), 100);
    const movies = await Movie.aggregate([{ $sample: { size } }]);
    res.json(movies);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ************PRIVATE CONTROLLERS******************

// @desc create movie review
// @route POST /api/movies/:id/reviews
// @access Private
const createMovieReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  try {
    //find movie by id in database
    const movie = await Movie.findById(req.params.id);

    if (movie) {
      // check if movie user already review this movie
      const alreadyReiviewed = movie.reviews.find(
        (r) => r.userId.toString() === req.user._id.toString()
      );
      // if the user already reviewed this movie send 404 error
      if (alreadyReiviewed) {
        res.status(404);
        throw new Error("You already reviewed this movie");
      }
      // else create a new review
      const review = {
        userName: req.user.fullName,
        userId: req.user._id,
        userImage: req.user.image,
        rating: Number(rating),
        comment,
      }
      // push new review to movie reviews array
      movie.reviews.push(review);
      // increment the number of reviews 
      movie.numberOfReviews = movie.reviews.length;

      // calculate the new average rate
      movie.rate = movie.reviews.reduce((acc, item) => item.rating + acc, 0) /
        movie.reviews.length;

      // save the movie in database
      await movie.save();
      // send updated movie to the client
      res.status(201).json({
        message: "Review added"
      });

    } else {
      res.status(404);
      throw new Error("Movie not found");
    }
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
})

// @desc delete movie review
// @route POST /api/movies/:id/reviews
// @access Private
const deleteMovieReview = asyncHandler(async (req, res) => {
  try {
    // Find the movie by ID in the database
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      res.status(404);
      throw new Error("Movie not found");
    }

    // Check if the user has already reviewed this movie
    const alreadyReviewed = movie.reviews.find(
      (r) => r.userId.toString() === req.user._id.toString()
    );

    // If the user hasn't reviewed the movie, return a 404 error
    if (!alreadyReviewed) {
      res.status(404);
      throw new Error("You haven't reviewed this movie");
    }

    // Find and remove the user's review
    const index = movie.reviews.findIndex(
      (r) => r.userId.toString() === req.user._id.toString()
    );
    movie.reviews.splice(index, 1);

    // Update the number of reviews
    movie.numberOfReviews = movie.reviews.length;

    // Recalculate the average rating
    if (movie.reviews.length === 0) {
      movie.rate = 0; // If there are no reviews, set the average rating to 0
    } else {
      movie.rate = movie.reviews.reduce((acc, item) => item.rating + acc, 0) / movie.reviews.length;
    }

    // Save the updated movie in the database
    await movie.save();

    // Return a success message
    res.json({
      message: "Review deleted successfully"
    });

  } catch (error) {
    // Return an error if something went wrong
    res.status(500).json({ message: error.message });
  }
});





// ************ADMIN CONTROLLERS******************

// @desc update movie 
// @route PUT /api/movies/:id
// @access Private/Admin
const updateMovie = asyncHandler(async (req, res) => {
  try {
    const {
      name,
      desc,
      image,
      titleImage,
      rate,
      numberOfReviews,
      category,
      time,
      language,
      year,
      video,
      casts
    } = req.body

    // find movie by id in database
    const movie = await Movie.findById(req.params.id);

    if (movie) {
      // update movie data
      movie.name = name || movie.name;
      movie.desc = desc || movie.desc;
      movie.image = image || movie.image;
      movie.titleImage = titleImage || movie.titleImage;
      movie.rate = rate || movie.rate;
      movie.numberOfReviews = numberOfReviews || movie.numberOfReviews;
      movie.category = category || movie.category;
      movie.time = time || movie.time;
      movie.language = language || movie.language;
      movie.year = year || movie.year;
      movie.video = video || movie.video;
      movie.casts = casts || movie.casts;

      // save the movie in database
      const updatedMovie = await movie.save();

      await upsertMovie(updatedMovie._id.toString(), updatedMovie);
      // send the updated movie to the client
      res.status(201).json(updatedMovie);
    } else {
      res.status(404);
      throw new Error("Movie not found");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Delete movie
// @route DELETE /api/movies/:id
// @access Private/Admin
const deleteMovie = asyncHandler(async (req, res) => {
  try {
    // find movie by id in database
    const movie = await Movie.findById(req.params.id);
    // if the movie is found delete it
    if (movie) {
      await movie.deleteOne();

      await esDeleteMovie(req.params.id);
      // send a success message to the client
      res.json({ message: "Movie removed" });
    }
    // if the movie is not found send 404 error
    else {
      res.status(404);
      throw new Error("Movie not found");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
})

// @desc Delete all movie
// @route DELETE /api/movies/:id
// @access Private/Admin
const deleteAllMovies = asyncHandler(async (req, res) => {
  try {
    // delete all movies in database
    await Movie.deleteMany({});
    // send a success message to the client
    res.json({ message: "All movies removed" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
})

// @desc Create movie
// @route POST /api/movies
// @access Private/Admin
const createMovie = asyncHandler(async (req, res) => {
  try {
    const {
      name,
      desc,
      image,
      titleImage,
      rate,
      numberOfReviews,
      category,
      time,
      language,
      year,
      video,
      casts
    } = req.body

    // create a new movie
    const movie = new Movie({
      name,
      desc,
      image,
      titleImage,
      rate,
      numberOfReviews,
      category,
      time,
      language,
      year,
      video,
      casts,
      userId: req.user._id,
    });

    // save the movie in database
    if (movie) {
      const createdMovie = await movie.save();

      await upsertMovie(createdMovie._id.toString(), createdMovie);
      await createMovieNotification(movie);
      res.status(201).json(createdMovie);
    }
    else {
      res.status(400);
      throw new Error("Invalid movie data");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Sync toàn bộ phim từ Mongo sang ES
// @route POST /api/movies/sync-es
// @access Private/Admin
const syncMoviesToES = asyncHandler(async (req, res) => {
  const result = await syncAllMoviesToES(500);
  if (result.ok) return res.json({ message: 'Synced to ES', total: result.total });
  return res.status(500).json({ message: result.error || 'Sync failed' });
});


export {
  importMovies,
  getMovies,
  getMovieById,
  getTopRatedMovies,
  getRandomMovies,
  createMovieReview,
  updateMovie,
  deleteMovie,
  deleteAllMovies,
  createMovie,
  deleteMovieReview,
  syncMoviesToES,
};