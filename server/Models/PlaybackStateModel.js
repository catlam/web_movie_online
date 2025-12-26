import mongoose from "mongoose";

const playbackStateSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        movieId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Movies",
            required: true,
            index: true,
        },
        seasonNumber: { type: Number, default: null, index: true },
        episodeNumber: { type: Number, default: null, index: true },
        episodeId: { type: mongoose.Schema.Types.ObjectId, ref: "Episode", default: null, index: true },

        lastPosition: { type: Number, default: 0 }, 
        duration: { type: Number, default: 0 },     
        progressPct: { type: Number, default: 0 },  
        finished: { type: Boolean, default: false },

        lastAction: {
            type: String,
            enum: ["start", "progress", "complete"],
            default: "progress",
        },
        lastActionAt: { type: Date, default: Date.now, index: true },
        lastSessionId: { type: String, default: null },

        title: { type: String, default: null },
        posterPath: { type: String, default: null },
        backdropPath: { type: String, default: null },
        isPremium: { type: Boolean, default: false },
        releaseDate: { type: String, default: null },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: "playback_state",
    }
);

playbackStateSchema.index(
    { userId: 1, movieId: 1, seasonNumber: 1, episodeNumber: 1 },
    { unique: true, partialFilterExpression: { userId: { $exists: true } } }
);
export default mongoose.model("PlaybackState", playbackStateSchema);
