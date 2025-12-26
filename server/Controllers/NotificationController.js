// server/Controllers/notificationController.js
import Notification from "../Models/Notification.js";
import SocketRegistry from "../socket/registry.js";
import asyncHandler from "express-async-handler";


/**
 * Broadcast a new movie notification
 */
export const createMovieNotification = async (movie) => {
    const notif = await Notification.create({
        title: `New Movie: ${movie.name}`,
        message: movie.desc?.slice(0, 120) || "A new movie has just been added!",
        type: "new_movie",
        refId: movie._id,
        image: movie.image,
        audience: { all: true },
    });

    SocketRegistry.broadcast("notification", {
        _id: notif._id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        refId: notif.refId,
        image: notif.image,
        createdAt: notif.createdAt,
    });

    return notif;
};


/**
 * Broadcast a new series notification
 */
export const createSeriesNotification = async (series) => {
    const notif = await Notification.create({
        title: `New Series: ${series.name}`,
        message: series.desc?.slice(0, 120) || "A new series has just been added!",
        type: "new_series",
        refId: series._id,
        image: series.image,
        audience: { all: true },
    });

    SocketRegistry.broadcast("notification", {
        _id: notif._id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        refId: notif.refId,
        image: notif.image,
        createdAt: notif.createdAt,
    });

    return notif;
};

export const getNotifications = asyncHandler(async (req, res) => {
    const items = await Notification.find({})
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    res.json({ items });
});