import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true, // e.g. "basic", "standard", "premium"
        },
        name: {
            type: String,
            required: true, // e.g. "Basic Plan"
        },
        description: {
            type: String,
            default: "",
        },
        price: {
            monthly: { type: Number, required: true },
            yearly: { type: Number, default: 0 },
        },
        durationDays: {
            type: Number,
            default: 30, 
        },
        features: {
            hd: { type: Boolean, default: false },
            uhd: { type: Boolean, default: false },
            devices: { type: Number, default: 1 },
            downloads: { type: String, default: "1 device" },
            ads: { type: String, default: "No ads" },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);


export default mongoose.models.Plan || mongoose.model("Plan", planSchema);

