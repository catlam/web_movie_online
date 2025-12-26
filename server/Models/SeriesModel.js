import mongoose from "mongoose";

const reviewSchema = mongoose.Schema(
    {
        userName: { type: String, required: true },
        userImage: { type: String },
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },

    {
        timestamps: true
    }
)

const SeriesSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, index: true },
        desc: { type: String, default: "" },
        image: { type: String, default: "" },       // backdrop
        titleImage: { type: String, default: "" },   // poster
        category: { type: String, index: true },     // Action, Drama...
        language: { type: String, index: true },     // vi, en...
        year: { type: Number, index: true },
        rate: { type: Number, default: 0 },          // avg rating toàn series
        numberOfReviews: { type: Number, default: 0 },
        reviews: [reviewSchema],
        isPremium: { type: Boolean, default: false },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        seasons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Season" }],
        episodes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Episode" }],
        casts: [
            {
                name: { type: String, required: true },
                image: { type: String },
            },
        ],
    },
    { timestamps: true }
);



export default mongoose.models.Series || mongoose.model("Series", SeriesSchema);
