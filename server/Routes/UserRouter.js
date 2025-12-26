import express from 'express';
import { 
    loginUser, 
    registerUser, 
    updateUserProfile, 
    deleteUserProfile, 
    changeUserPassword,
    getFavorites,
    addFavorite,
    clearFavorites,
    getUsers,
    deleteUser,
    removeFavorite,
    resetPasswordDirect,
} from '../Controllers/UserController.js';
import { protect, admin } from '../middlewares/Auth.js';

const router = express.Router();

// *********PUBLIC ROUTES******************
router.post("/", registerUser);
router.post('/login', loginUser);
router.post("/reset-password", resetPasswordDirect)

//*********PRIVATE ROUTES****************
router.put("/", protect, updateUserProfile);
router.delete("/", protect, deleteUserProfile);
router.put("/password", protect, changeUserPassword);
router.get("/favorites", protect, getFavorites)
router.post("/favorites", protect, addFavorite)
router.delete("/favorites", protect, clearFavorites)
router.delete("/favorites/:kind/:id", protect, removeFavorite)

// ***********ADMIN ROUTES********************
router.get("/", protect, admin, getUsers);
router.delete("/:id", protect, admin, deleteUser);


export default router;