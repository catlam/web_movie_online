import mongoose from "mongoose";
import dotenv from "dotenv";
import Plan from "../Models/Plan.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Seeding plans...");

    await Plan.deleteMany();

    await Plan.insertMany([
        {
            code: "basic",
            name: "Basic Plan",
            price: 79000,
            durationDays: 30,
            description: "1 device, SD quality",
            isActive: true,
        },
        {
            code: "standard",
            name: "Standard Plan",
            price: 129000,
            durationDays: 30,
            description: "2 devices, HD quality",
            isActive: true,
        },
        {
            code: "premium",
            name: "Premium Plan",
            price: 199000,
            durationDays: 30,
            description: "4 devices, Ultra HD",
            isActive: true,
        },
    ]);

    console.log("✅ Done seeding plans.");
    process.exit(0);
});
