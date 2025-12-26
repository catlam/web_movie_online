import jwt from 'jsonwebtoken';
import User from "../Models/UserModel.js";
import asyncHandler from "express-async-handler";

// @desc Authenticated user & get token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
    });
}

// protection middleware
const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        res.status(401);
        throw new Error("Not authorized, no token");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");
        if (!req.user) {
            res.status(401);
            throw new Error("User not found");
        }
        return next();
    } catch (err) {
        // Phân biệt lỗi hết hạn để client xử lý đúng
        if (err?.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired", code: "TOKEN_EXPIRED" });
        }
        console.error("JWT verify error:", err?.message);
        return res.status(401).json({ message: "Not authorized, token failed", code: "TOKEN_INVALID" });
    }
});

// admin middleware
const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(401);
        throw new Error("Not authorized, you are not an admin");
    }
}

export { generateToken, protect, admin };