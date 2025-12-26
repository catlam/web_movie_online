import Axios from "./Axios";

export const createMomoPayment = async (planCode, period = "monthly") => {
    try {
        const { data } = await Axios.post("/momo/create", {
            planCode,
            period,
        });
        return data;
    } catch (error) {
        console.error("[MoMo Service] create payment error:", error);
        throw error.response?.data || error;
    }
};