// src/Redux/APIs/planService.js
import Axios from "./Axios";

// Lấy tất cả gói membership (admin)
export const getAllPlans = async () => {
    try {
        const { data } = await Axios.get("/admin/plans");
        console.log("[Plan Service] getAllPlans:", data);
        return data; // array
    } catch (error) {
        console.error("[Plan Service] getAllPlans error:", error);
        throw error?.response?.data || error;
    }
};

// Lấy chi tiết 1 gói
export const getPlanById = async (id) => {
    try {
        const { data } = await Axios.get(`/admin/plans/${id}`);
        console.log("[Plan Service] getPlanById:", data);
        return data;
    } catch (error) {
        console.error("[Plan Service] getPlanById error:", error);
        throw error?.response?.data || error;
    }
};

// Tạo mới gói membership
export const createPlan = async (payload) => {
    try {
        const { data } = await Axios.post("/admin/plans", payload);
        console.log("[Plan Service] createPlan:", data);
        return data;
    } catch (error) {
        console.error("[Plan Service] createPlan error:", error);
        throw error?.response?.data || error;
    }
};

// Cập nhật gói membership
export const updatePlan = async (id, payload) => {
    try {
        const { data } = await Axios.put(`/admin/plans/${id}`, payload);
        console.log("[Plan Service] updatePlan:", data);
        return data;
    } catch (error) {
        console.error("[Plan Service] updatePlan error:", error);
        throw error?.response?.data || error;
    }
};

// Xóa gói membership
export const deletePlan = async (id) => {
    try {
        const { data } = await Axios.delete(`/admin/plans/${id}`);
        console.log("[Plan Service] deletePlan:", data);
        return data;
    } catch (error) {
        console.error("[Plan Service] deletePlan error:", error);
        throw error?.response?.data || error;
    }
};

// Bật/tắt nhanh trạng thái gói membership
export const togglePlanStatus = async (id) => {
    try {
        const { data } = await Axios.patch(`/admin/plans/${id}/toggle`);
        console.log("[Plan Service] togglePlanStatus:", data);
        return data; // plan đã được cập nhật isActive
    } catch (error) {
        console.error("[Plan Service] togglePlanStatus error:", error);
        throw error?.response?.data || error;
    }
};

export const getActivePlansForUser = async () => {
    try {
        // assuming Axios baseURL = "/api"
        const { data } = await Axios.get("/plans");
        console.log("[Plan Service] getActivePlansForUser:", data);
        return data;
    } catch (error) {
        console.error("[Plan Service] getActivePlansForUser error:", error);
        throw error?.response?.data || error;
    }
};