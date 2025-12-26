// src/api/AxiosReco.js
import axios from "axios";

const RECO_BASE = (process.env.REACT_APP_RECO_URL || "http://localhost:8002").trim();

const AxiosReco = axios.create({
    baseURL: RECO_BASE,
    headers: { "Content-Type": "application/json" },
    timeout: 10000,
});

AxiosReco.interceptors.request.use((config) => {
    const raw = localStorage.getItem("userInfo") || localStorage.getItem("token");
    let token = null;
    try {
        token = raw && raw.startsWith("{") ? JSON.parse(raw).token : raw;
    } catch { /* ignore */ }
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default AxiosReco;
