// Controllers/MomoController.js
import axios from "axios";
import crypto from "crypto";
import Plan from "../Models/Plan.js";
import Payment from "../models/Payment.js";
import Purchase from "../Models/Purchase.js";

const accessKey = process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85";
const secretKey = process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";
const partnerCode = process.env.MOMO_PARTNER_CODE || "MOMO";
const requestType = process.env.MOMO_REQUEST_TYPE || "payWithMethod";

const redirectUrl = process.env.MOMO_RETURN_URL || "http://localhost:3000/payment/result";
const ipnUrl = process.env.MOMO_IPN_URL || "http://localhost:5000/api/momo/ipn";

const USE_QUERY_ON_RETURN = process.env.USE_QUERY_ON_RETURN === "1";

const G = v => (v === undefined || v === null ? "" : String(v));
const de = v => decodeURIComponent(G(v).replace(/\+/g, " "));

async function momoQuery(orderId, requestId) {
    const raw =
        `accessKey=${accessKey}` +
        `&orderId=${orderId}` +
        `&partnerCode=${partnerCode}` +
        `&requestId=${requestId}`;
    const signature = crypto.createHmac("sha256", secretKey).update(raw).digest("hex");
    const body = { partnerCode, requestId, orderId, signature, lang: "vi" };
    const { data } = await axios.post(
        "https://test-payment.momo.vn/v2/gateway/api/query",
        body,
        { headers: { "Content-Type": "application/json" }, timeout: 15000 }
    );
    return data; // { resultCode, message, transId, ... }
}

async function activateMembershipForPayment(payment, note = "manual") {
    // payment: document Payment đã lấy từ DB (có userId, planId, amount, ...)
    const plan = await Plan.findById(payment.planId);
    const now = new Date();
    const addMs = (plan?.durationDays || 30) * 24 * 3600 * 1000;

    let sub = await Purchase.findOne({ userId: payment.userId, status: "active" });
    if (sub && sub.expiresAt > now) {
        sub.expiresAt = new Date(sub.expiresAt.getTime() + addMs);
        await sub.save();
        console.log(`🔄 [${note}] Extended membership for user ${payment.userId} → ${sub.expiresAt.toISOString()}`);
    } else {
        const expiresAt = new Date(now.getTime() + addMs);
        await Purchase.updateOne(
            { userId: payment.userId },
            {
                $set: {
                    userId: payment.userId,
                    planId: plan?._id,
                    status: "active",
                    startedAt: now,
                    expiresAt,
                },
            },
            { upsert: true }
        );
        console.log(`💎 [${note}] Activated membership for user ${payment.userId} → ${expiresAt.toISOString()}`);
    }
}

export const createPayment = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { planCode = "standard", period = "monthly" } = req.body;

        if (req.user?.isAdmin) {
            return res.status(400).json({
                message: "Admin does not need to buy a package, has full access.",
            });
        }

        // 1) Get plan by code
        const plan = await Plan.findOne({
            code: planCode.toLowerCase(),
            isActive: true,
        });
        if (!plan) {
            return res.status(400).json({ message: "Plan not found" });
        }

        // 2) Resolve amount based on period (monthly / yearly)
        const monthlyPrice = plan.price?.monthly;
        const yearlyPrice = plan.price?.yearly;

        let rawAmount;
        if (period === "yearly") {
            rawAmount =
                typeof yearlyPrice === "number" && !isNaN(yearlyPrice) && yearlyPrice > 0
                    ? yearlyPrice
                    : monthlyPrice;
        } else {
            rawAmount = monthlyPrice;
        }

        if (typeof rawAmount !== "number" || isNaN(rawAmount) || rawAmount <= 0) {
            console.error("[MoMo] Invalid plan price:", {
                planCode,
                monthlyPrice,
                yearlyPrice,
                period,
            });
            return res.status(400).json({ message: "Invalid plan price configuration" });
        }

        const amount = String(rawAmount);

        const orderInfo = `Buy ${plan.name} (${period})`;
        const orderId = partnerCode + Date.now();
        const requestId = orderId;
        const extraData = "";
        const autoCapture = true;
        const lang = "vi";

        // 3) raw signature
        const rawSignature =
            `accessKey=${accessKey}` +
            `&amount=${amount}` +
            `&extraData=${extraData}` +
            `&ipnUrl=${ipnUrl}` +
            `&orderId=${orderId}` +
            `&orderInfo=${orderInfo}` +
            `&partnerCode=${partnerCode}` +
            `&redirectUrl=${redirectUrl}` +
            `&requestId=${requestId}` +
            `&requestType=${requestType}`;

        const signature = crypto
            .createHmac("sha256", secretKey)
            .update(rawSignature)
            .digest("hex");

        // 4) Save payment pending
        await Payment.create({
            userId,
            planId: plan._id,
            orderId,
            requestId,
            amount: rawAmount, // Number, không phải NaN
            status: "pending",
            period, // optional: lưu luôn "monthly"/"yearly"
        });

        // 5) Call MoMo create
        const body = {
            partnerCode,
            partnerName: "Test",
            storeId: "MomoTestStore",
            requestId,
            amount,
            orderId,
            orderInfo,
            redirectUrl,
            ipnUrl,
            lang,
            requestType,
            autoCapture,
            extraData,
            orderGroupId: "",
            signature,
        };

        console.log("\n================ [MoMo Create Payment] ================");
        console.table({
            userId: String(userId),
            planCode,
            planName: plan.name,
            period,
            amount,
            orderId,
            requestId,
            requestType,
        });
        console.log("rawSignature:", rawSignature);
        console.log("signature  :", signature);
        console.log("redirectUrl:", redirectUrl);
        console.log("ipnUrl     :", ipnUrl);
        console.log("=======================================================\n");

        const momoRes = await axios.post(
            "https://test-payment.momo.vn/v2/gateway/api/create",
            body,
            { headers: { "Content-Type": "application/json" }, timeout: 15000 }
        );

        await Payment.updateOne(
            { orderId },
            { $set: { payUrl: momoRes.data?.payUrl, rawCreateRes: momoRes.data } }
        );

        console.log("\n================ [MoMo Create Response] ===============");
        console.table({
            httpStatus: momoRes.status,
            resultCode: momoRes.data?.resultCode,
            message: momoRes.data?.message,
        });
        console.log("payUrl    :", momoRes.data?.payUrl);
        console.log("shortLink :", momoRes.data?.shortLink);
        console.log("raw       :", JSON.stringify(momoRes.data, null, 2));
        console.log("=======================================================\n");

        return res.json({
            payUrl: momoRes.data?.payUrl,
            orderId,
            resultCode: momoRes.data?.resultCode,
        });
    } catch (e) {
        console.error("[momo/create] err:", e?.response?.data || e.message);
        return res.status(400).json({ message: "MoMo create failed" });
    }
};

export const momoIpn = async (req, res) => {
    try {
        const ipn = req.body;

        console.log("\n================ [MoMo IPN Received] ================");
        console.log("Full IPN payload:\n", JSON.stringify(ipn, null, 2));
        console.log("========================================================\n");

        // 1) verify chữ ký (coalesce các field optional)
        const raw =
            `accessKey=${accessKey}` +
            `&amount=${G(ipn.amount)}` +
            `&extraData=${G(ipn.extraData)}` +
            `&message=${G(ipn.message)}` +
            `&orderId=${G(ipn.orderId)}` +
            `&orderInfo=${G(ipn.orderInfo)}` +
            `&orderType=${G(ipn.orderType)}` +
            `&partnerCode=${G(ipn.partnerCode)}` +
            `&payType=${G(ipn.payType)}` +
            `&requestId=${G(ipn.requestId)}` +
            `&responseTime=${G(ipn.responseTime)}` +
            `&resultCode=${G(ipn.resultCode)}` +
            `&transId=${G(ipn.transId)}`;

        const calcSign = crypto.createHmac("sha256", secretKey).update(raw).digest("hex");

        console.log("Calculated Signature:", calcSign);
        console.log("IPN Provided Signature:", ipn.signature);
        console.log("raw used for signature:\n", raw);

        if (calcSign !== ipn.signature) {
            console.warn("Signature mismatch! (check accessKey/secretKey/fields order/value)");
            return res.status(400).send("signature mismatch");
        }

        // 2) lấy payment theo orderId
        const payment = await Payment.findOne({ orderId: ipn.orderId });
        if (!payment) {
            console.warn("Payment record not found for order:", ipn.orderId);
            return res.status(404).send("payment not found");
        }

        // 3) không xử lý lại
        if (payment.status === "paid") {
            console.log("Payment already processed:", ipn.orderId);
            return res.status(200).send("0 | already processed");
        }

        // 4) kiểm tra số tiền
        if (Number(payment.amount) !== Number(ipn.amount)) {
            console.warn("Amount mismatch! expected:", payment.amount, "got:", ipn.amount);
            await Payment.updateOne({ _id: payment._id }, { $set: { status: "failed", rawIpn: ipn } });
            return res.status(400).send("amount mismatch");
        }

        // 5) xử lý kết quả
        if (Number(ipn.resultCode) === 0) {
            console.log("MoMo confirmed SUCCESS for order:", ipn.orderId);

            await Payment.updateOne(
                { _id: payment._id },
                { $set: { status: "paid", transId: ipn.transId, rawIpn: ipn } }
            );

            const plan = await Plan.findById(payment.planId);
            const now = new Date();
            const addMs = (plan?.durationDays || 30) * 24 * 3600 * 1000;

            let sub = await Purchase.findOne({ userId: payment.userId, status: "active" });
            if (sub && sub.expiresAt > now) {
                sub.expiresAt = new Date(sub.expiresAt.getTime() + addMs);
                await sub.save();
                console.log(`🔄 Extended membership for user ${payment.userId} → ${sub.expiresAt.toISOString()}`);
            } else {
                const expiresAt = new Date(now.getTime() + addMs);
                await Purchase.updateOne(
                    { userId: payment.userId },
                    {
                        $set: {
                            userId: payment.userId,
                            planId: plan?._id,
                            status: "active",
                            startedAt: now,
                            expiresAt,
                        },
                    },
                    { upsert: true }
                );
                console.log(`💎 Activated membership for user ${payment.userId} → ${expiresAt.toISOString()}`);
            }

            return res.status(200).send("0 | success");
        }

        console.warn("MoMo returned failure resultCode:", ipn.resultCode);
        await Payment.updateOne({ _id: payment._id }, { $set: { status: "failed", rawIpn: ipn } });
        return res.status(200).send("0 | failure recorded");
    } catch (e) {
        console.error("[momo/ipn]Server error:", e.message);
        return res.status(500).send("server error");
    }
};

export const momoReturn = async (req, res) => {
    try {
        const {
            partnerCode, orderId, requestId, amount, orderInfo, orderType,
            transId, resultCode, message, payType, responseTime, extraData, signature
        } = req.query;

        const raw =
            `accessKey=${accessKey}` +
            `&amount=${G(amount)}` +
            `&extraData=${G(extraData)}` +
            `&message=${de(message)}` +
            `&orderId=${G(orderId)}` +
            `&orderInfo=${de(orderInfo)}` +
            `&orderType=${G(orderType)}` +
            `&partnerCode=${G(partnerCode)}` +
            `&payType=${G(payType)}` +
            `&requestId=${G(requestId)}` +
            `&responseTime=${G(responseTime)}` +
            `&resultCode=${G(resultCode)}` +
            `&transId=${G(transId)}`;

        const calcSig = crypto.createHmac("sha256", secretKey).update(raw).digest("hex");

        console.log("\n================ [MoMo Return Verify] ================");
        console.log("Raw for signature:", raw);
        console.log("Calculated sig:", calcSig);
        console.log("Provided sig:", signature);
        console.log("Query params:", req.query);
        console.log("======================================================\n");

        if (calcSig !== signature) {
            return res.status(400).json({ ok: false, reason: "signature" });
        }

        const payment = await Payment.findOne({ orderId });
        if (!payment) return res.status(404).json({ ok: false, reason: "order-not-found" });

        const ok = String(resultCode) === "0" && String(payment.amount) === String(amount);

        if (ok && USE_QUERY_ON_RETURN) {
            try {
                await new Promise(r => setTimeout(r, 2000));
                const q = await momoQuery(orderId, requestId);
                console.log("[MoMo RETURN] Query result:", q);

                if (q?.resultCode === 0) {
                    const fresh = await Payment.findOne({ orderId });
                    if (fresh?.status !== "paid") {
                        const plan = await Plan.findById(fresh.planId);
                        const now = new Date();
                        const addMs = (plan?.durationDays || 30) * 24 * 3600 * 1000;

                        await Payment.updateOne(
                            { _id: fresh._id },
                            { $set: { status: "paid", transId: q.transId, rawQuery: q } }
                        );

                        let sub = await Purchase.findOne({ userId: fresh.userId, status: "active" });
                        if (sub && sub.expiresAt > now) {
                            sub.expiresAt = new Date(sub.expiresAt.getTime() + addMs);
                            await sub.save();
                        } else {
                            await Purchase.updateOne(
                                { userId: fresh.userId },
                                {
                                    $set: {
                                        userId: fresh.userId,
                                        planId: plan?._id,
                                        status: "active",
                                        startedAt: now,
                                        expiresAt: new Date(now.getTime() + addMs),
                                    },
                                },
                                { upsert: true }
                            );
                        }
                        console.log("[MoMo RETURN] Activated via Query fallback.");
                    }
                }
            } catch (e) {
                console.warn("[MoMo RETURN] Query fallback failed:", e?.message);
            }
        }

        return res.json({ ok, rc: Number(resultCode), amount: String(amount), orderId });
    } catch (e) {
        console.error("[momo/return] error:", e);
        return res.status(500).json({ ok: false, reason: "server" });
    }
};

export const getPaymentByOrderId = async (req, res) => {
    try {
        const { orderId } = req.params;

        const payment = await Payment.findOne({ orderId })
            .populate("userId", "name email")      // tùy schema User
            .populate("planId", "code name price durationDays");

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        return res.json(payment);
    } catch (e) {
        console.error("[momo/getPaymentByOrderId] error:", e.message);
        return res.status(500).json({ message: "Server error" });
    }
};

export const updatePaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body; // expected: "pending" | "paid" | "failed" | "cancelled" | "refunded"

        const ALLOWED = ["pending", "paid", "failed", "cancelled", "refunded"];

        if (!ALLOWED.includes(status)) {
            return res.status(400).json({
                message: `Invalid status. Allowed: ${ALLOWED.join(", ")}`,
            });
        }

        const payment = await Payment.findOne({ orderId });
        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        const wasPaid = payment.status === "paid";
        const willBePaid = status === "paid";

        payment.status = status;
        await payment.save();

        console.log("\n================ [Admin Update Payment] ================");
        console.table({
            orderId: payment.orderId,
            userId: String(payment.userId),
            oldStatus: payment.status,
            newStatus: status,
        });
        console.log("=========================================================\n");

        if (!wasPaid && willBePaid) {
            await activateMembershipForPayment(payment, "admin-update");
        }

        return res.json({
            message: "Payment updated successfully",
            payment,
        });
    } catch (e) {
        console.error("[momo/updatePaymentStatus] error:", e.message);
        return res.status(500).json({ message: "Server error" });
    }
};
