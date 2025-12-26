import express from 'express';
import { protect, admin } from '../middlewares/Auth.js';
import * as moviesController from '../Controllers/MoviesController.js';

const router = express.Router();

// *********PUBLIC ROUTES******************
router.post("/import", moviesController.importMovies);
router.get("/", moviesController.getMovies);
router.get("/:id", moviesController.getMovieById);
router.get("/rated/top", moviesController.getTopRatedMovies);
router.get("/random/all", moviesController.getRandomMovies);



//*********PRIVATE ROUTES****************
router.post("/:id/reviews", protect, moviesController.createMovieReview);
router.delete("/:id/reviews", protect, moviesController.deleteMovieReview);


// ***********ADMIN ROUTES********************
router.put("/:id", protect, admin, moviesController.updateMovie);
router.delete("/:id", protect, admin, moviesController.deleteMovie);
router.delete("/", protect, admin, moviesController.deleteAllMovies);
router.post("/", protect, admin, moviesController.createMovie);



export default router;