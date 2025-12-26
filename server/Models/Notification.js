// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["new_movie", "new_series"], required: true },
    refId: { type: mongoose.Schema.Types.ObjectId, required: true },
    image: { type: String },

    // Ai nhận? (chọn 1 trong 3 cơ chế tuỳ usecase)
    audience: {
        all: { type: Boolean, default: false },                      // broadcast toàn hệ
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],// danh sách user cụ thể
        genres: [String],                                               // segment theo thể loại
    },

    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true, versionKey: false });

// Chỉ số để query nhanh
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ "audience.users": 1, createdAt: -1 });
notificationSchema.index({ "audience.all": 1, createdAt: -1 });
notificationSchema.index({ "audience.genres": 1 });

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
