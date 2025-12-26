// src/Screens/PaymentResult.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function PaymentResult() {
    const { search } = useLocation();
    const navigate = useNavigate();
    const params = useMemo(() => new URLSearchParams(search), [search]);

    const [status, setStatus] = useState("checking"); // checking | waiting | success | failed
    const orderId = params.get("orderId");
    const resultCode = params.get("resultCode");

    useEffect(() => {
        let timer;
        const run = async () => {
            // 1) Nếu MoMo báo fail -> fail ngay
            if (resultCode !== "0") {
                setStatus("failed");
                return;
            }

            // 2) Verify chữ ký Return URL ở backend
            try {
                const verifyRes = await fetch(`/api/momo/return${search}`, { method: "GET" });
                const verifyData = await verifyRes.json();
                if (!verifyRes.ok || !verifyData?.ok) {
                    setStatus("failed");
                    return;
                }
            } catch {
                setStatus("failed");
                return;
            }

            // 3) Nếu verify OK -> bắt đầu đợi IPN (poll subscription)
            const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
            const token = userInfo?.token;

            const poll = async (count = 0) => {
                try {
                    const r = await fetch("/api/user/subscription", {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const data = await r.json();

                    if (data?.active) {
                        setStatus("success");
                        timer = setTimeout(() => navigate("/"), 1200);
                        return;
                    }

                    if (count < 15) {
                        setStatus("waiting");
                        setTimeout(() => poll(count + 1), 2000);
                    } else {
                        setStatus("failed");
                    }
                } catch {
                    if (count < 15) setTimeout(() => poll(count + 1), 2000);
                    else setStatus("failed");
                }
            };

            setStatus("checking");
            poll();
        };

        run();
        return () => clearTimeout(timer);
    }, [navigate, resultCode, search]);



    return (
        <div className="relative min-h-screen bg-dry">
            <div className="absolute inset-0 z-0">
                <img
                    src="/images/head.jpg"
                    alt="background"
                    className="w-full h-full object-cover opacity-50 blur-sm"
                />
                <div className="absolute inset-0 bg-black/60" />
            </div>

            <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
                <div className="max-w-md w-full bg-main/70 border border-border rounded-2xl p-6 text-center text-white">
                    <h1 className="text-2xl font-bold mb-1">Payment Result</h1>
                    {orderId && <p className="text-sm text-border mb-4">Order ID: {orderId}</p>}
                    {status === "checking" && <p>Verifying your payment…</p>}
                    {status === "waiting" && <p>Payment successful on MoMo. Waiting for confirmation…</p>}
                    {status === "success" && <p className="text-green-400">Membership activated! Redirecting…</p>}
                    {status === "failed" && (
                        <>
                            <p className="text-red-400">Could not verify your payment.</p>
                            <p className="text-xs text-border mt-2">If money was deducted, please contact support.</p>
                            <button
                                onClick={() => navigate("/choose-plan")}
                                className="mt-4 bg-subMain px-5 py-3 rounded hover:opacity-90"
                            >
                                Try again
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
