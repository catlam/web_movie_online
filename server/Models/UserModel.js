import mongoose from "mongoose";

const likedItemSchema = new mongoose.Schema({
    refId: { type: mongoose.Schema.Types.ObjectId, required: true },
    kind: { type: String, enum: ['Movie', 'Series'], required: true },
}, { _id: false });


const UserSchema = mongoose.Schema({
    fullName: {
        type: String,
        required: [true, "Please add a full name "],
    },
    email: {
        type: String,
        required: [true, "Please add an email "],
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Please add a password "],
        minlength: [6, "Please must be at least 6 characters"],
    },
    image: {
        type: String,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    likedItems: [likedItemSchema],
},
    {
        timestamps: true,
    }
);

export default mongoose.model("User", UserSchema)