// src/SubscriptionProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export default function SubscriptionProtectedRoute() {
    const { userInfo } = useSelector((s) => s.userLogin) || {};
    const token = userInfo?.token;
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        const check = async () => {
            try {
                if (!token) {
                    setAllowed(false);
                    setLoading(false);
                    return;
                }
                const r = await fetch("/api/user/subscription", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await r.json();
                setAllowed(!!data?.active);
            } catch {
                setAllowed(false);
            } finally {
                setLoading(false);
            }
        };
        check();
    }, [token]);

    if (!userInfo) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (loading) {
        return (
            <div className="min-h-[50vh] grid place-items-center text-white/80">
                Checking membership…
            </div>
        );
    }

    if (!allowed) {
        // Không có gói active → chuyển về trang membership
        return <Navigate to="/membership" replace state={{ from: location }} />;
    }

    return <Outlet />;
}
