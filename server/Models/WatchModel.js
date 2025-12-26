import mongoose from "mongoose";

const watchHistorySchema = new mongoose.Schema(
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
        episodeId: { type: mongoose.Schema.ObjectId, ref: 'Episode', default: null, index: true },

        action: {
            type: String,
            enum: ["start", "progress", "complete"],
            required: true,
        },
        position: { type: Number, default: 0 },  
        duration: { type: Number, default: 0 },   
        playedSeconds: { type: Number, default: 0 }, 

        client: {
            deviceId: { type: String, default: null },
            ua: { type: String, default: null },
            ip: { type: String, default: null },
        },

        ts: { type: Date, default: Date.now, index: true },
    },
    {
        timestamps: false, 
        versionKey: false,
        collection: "watch_history",
    }
);

watchHistorySchema.index({ userId: 1, movieId: 1, ts: -1 });
watchHistorySchema.index({ userId: 1, movieId: 1, seasonNumber: 1, episodeNumber: 1, ts: -1 });


export default mongoose.model("WatchHistory", watchHistorySchema);
