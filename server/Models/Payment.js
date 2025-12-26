import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Plan",
            required: true,
        },
        orderId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        requestId: String,
        amount: Number,
        payUrl: String,
        transId: String, // mã giao dịch MoMo (khi trả về IPN)
        status: {
            type: String,
            enum: ["pending", "paid", "failed"],
            default: "pending",
        },
        rawCreateRes: Object, // dữ liệu MoMo trả về khi tạo
        rawIpn: Object,       // dữ liệu MoMo IPN callback
    },
    { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

