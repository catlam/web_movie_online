import asyncHandler from "express-async-handler";
import User from "../Models/UserModel.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../middlewares/Auth.js";
import Movie from "../Models/MoviesModel.js";
import Series from "../Models/SeriesModel.js";


// @desc Registers user
// @route POST /api/users


// @access Public
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, password, image } = req.body;
    try {
        const userExists = await User.findOne({ email })
        // check if user exists
        if (userExists) {
            res.status(400)
            throw new Error("User already exists")
        }
        // hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // create user in DB
        const user = await User.create({
            fullName,
            email,
            password: hashedPassword,
            image,
        });

        // if user created successfully send user data to client
        if (user) {
            res.status(201).json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                image: user.image,
                isAdmin: user.isAdmin,
                token: generateToken(user._id),
            });
        }

        else {
            res.status(400);
            throw new Error("Invalid user data");
        }

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// @desc Login user
// @route POST /api/users/login
// @access Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        // if user exists compare password with hashed password then send user data token to client
        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                image: user.image,
                isAdmin: user.isAdmin,
                token: generateToken(user._id),
            });
            // if user is not found or password not match send error message       
        } else {
            res.status(401);
            throw new Error("Invalid email or password");
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ***********PRIVATE CONTROLLER *************

// @desc Update user profile
// @route PUT /api/users/profile
// @access Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const { fullName, email, image } = req.body;
    try {
        //find user in DB
        const user = await User.findById(req.user._id);
        // if user exists update his profile and send updated user data to client
        if (user) {
            user.fullName = fullName || user.fullName;
            user.email = email || user.email;
            user.image = image || user.image;

            const updatedUser = await user.save();
            // send updated user data and token to client
            res.json({
                _id: updatedUser._id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                image: updatedUser.image,
                isAdmin: updatedUser.isAdmin,
                token: generateToken(updatedUser._id),
            });
        }
        // else send error message
        else {
            res.status(404);
            throw new Error("User not found");
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc Delete user profile
// @route DELETE /api/users/
// @access Private
const deleteUserProfile = asyncHandler(async (req, res) => {
    try {
        //find user in DB
        const user = await User.findById(req.user._id);
        // if user exists delete user form DB
        if (user) {
            //if user is admin throw error message
            if (user.isAdmin) {
                res.status(400);
                throw new Error("Can't delete admin user");
            }
            //else delete user form DB
            await User.findByIdAndDelete(req.user._id);
            res.json({ message: "User deleted successfully" });
        }
        // else send error message
        else {
            res.status(404);
            throw new Error("User not found");
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc Change user password
// @route PUT /api/users/password
// @access Private
const changeUserPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
        //find user in DB
        const user = await User.findById(req.user._id);
        // if user exists compare old password with hashed password
        if (user && (await bcrypt.compare(oldPassword, user.password))) {
            // hash new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            // update user password in DB
            user.password = hashedPassword;
            await user.save();
            res.json({ message: "Password changed successfully" });
        }
        // else send error message
        else {
            res.status(401);
            throw new Error("Invalid old password");
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc Reset password trực tiếp bằng email + mật khẩu mới (KHÔNG email/OTP) - DEV ONLY
// @route POST /api/users/reset-password
// @access Public
const resetPasswordDirect = asyncHandler(async (req, res) => {
    const { email, newPassword } = req.body || {};

    if (!email || !newPassword) {
        res.status(400);
        throw new Error("Email and new password are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    // hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    return res.json({ message: "Password reset successful" });
});

// @desc Get all liked movies
// @route GET /api/users/favorites
// @access Private
const getFavorites = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const movieIds = user.likedItems.filter(i => i.kind === 'Movie').map(i => i.refId);
    const seriesIds = user.likedItems.filter(i => i.kind === 'Series').map(i => i.refId);

    const [movies, series] = await Promise.all([
        Movie.find({ _id: { $in: movieIds } }),
        Series.find({ _id: { $in: seriesIds } }),
    ]);

    const shaped = [
        ...movies.map(m => ({ ...m.toObject(), __kind: 'movie' })),
        ...series.map(s => ({ ...s.toObject(), __kind: 'series' })),
    ];

    res.json(shaped);
});

// @desc Add movie to liked movies
// @route POST /api/users/favorites
// @access Private
const addFavorite = asyncHandler(async (req, res) => {
    const { id, kind } = req.body;
    if (!id || !['Movie', 'Series'].includes(kind)) {
        return res.status(400).json({ message: 'Invalid payload' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const exists = user.likedItems.some(i => i.refId.toString() === id && i.kind === kind);
    if (exists) return res.status(400).json({ message: 'Already liked' });

    const existsDoc = kind === 'Movie'
        ? await Movie.exists({ _id: id })
        : await Series.exists({ _id: id });
    if (!existsDoc) return res.status(404).json({ message: `${kind} not found` });

    user.likedItems.push({ refId: id, kind });
    await user.save();
    res.json(user.likedItems);
});

// @desc Delete all liked movies
// @route DELETE api/users/favorites
// @access Private
const clearFavorites = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.likedItems = [];
    await user.save();
    res.json({ messaging: 'All favorites cleared' });
});

// @desc Delete liked movies by id
// @route DELETE api/users/favorites/:id
// @access Private
const removeFavorite = asyncHandler(async (req, res) => {
    const { kind, id } = req.params;
    if (!['Movie', 'Series'].includes(kind)) {
        return res.status(400).json({ message: 'Invalid kind' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const before = user.likedItems.length;
    user.likedItems = user.likedItems.filter(i => !(i.kind === kind && i.refId.toString() === id));
    if (before === user.likedItems.length) {
        return res.status(400).json({ message: 'Item not liked' });
    }
    await user.save();
    res.json({ messaging: 'Removed from favorites' });
});

// **************ADMIN CONTROLLERS******************
// @desc Get all users
// @route GET /api/users
// @access Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    try {
        // find all users in DB
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
})

// @desc Delete all users
// @route DELETE /api/users/:id
// @access Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    try {
        //find user in DB
        const user = await User.findById(req.params.id);
        //if user exists, delete user from DB
        if (user) {
            //if user is admin throw error message
            if (user.isAdmin) {
                res.status(400);
                throw new Error("Can't delete admin user");
            }
            // else delete user from DB
            await User.findByIdAndDelete(req.params.id);
            res.json({ message: "User deleted successfully" });
        }
        // else send error message
        else {
            res.status(404);
            throw new Error("User not found");
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});



export {
    registerUser,
    loginUser,
    updateUserProfile,
    deleteUserProfile,
    changeUserPassword, 
    resetPasswordDirect,
    getFavorites,
    addFavorite,
    clearFavorites,
    getUsers,
    deleteUser,
    removeFavorite,
};