// src/Screens/PaymentPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createMomoPayment } from "../../Redux/APIs/MomoServices";

export default function PaymentPage() {
    const navigate = useNavigate();
    const [status, setStatus] = useState("creating"); // creating | redirecting | error
    const [message, setMessage] = useState("");
    const createdRef = useRef(false);      
    const redirectedRef = useRef(false);  

    useEffect(() => {
        const run = async () => {
            if (createdRef.current) return;
            createdRef.current = true;

            try {
                const planCode = localStorage.getItem("selected_plan");
                if (!planCode) {
                    setStatus("error");
                    setMessage("No plan selected. Please choose a plan first.");
                    return;
                }

                setStatus("creating");

                // Nếu API /api/momo/create cần token (router có protect)
                const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
                const token = userInfo?.token;

                const res = await createMomoPayment(planCode, token);
                // -> nhớ sửa MomoServices cho nhận token và set Authorization

                if (!res?.payUrl) {
                    setStatus("error");
                    setMessage(res?.message || "Create MoMo payment failed.");
                    return;
                }

                if (redirectedRef.current) return;
                redirectedRef.current = true;

                setStatus("redirecting");
                window.location.href = res.payUrl;
            } catch (e) {
                setStatus("error");
                setMessage(e?.message || "Payment error");
            }
        };

        run();
    }, [navigate]);

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
                    <h1 className="text-2xl font-bold mb-2">Payment</h1>
                    {status === "creating" && <p>Creating your MoMo payment…</p>}
                    {status === "redirecting" && <p>Redirecting to MoMo…</p>}
                    {status === "error" && (
                        <>
                            <p className="text-red-400">{message}</p>
                            <button
                                type="button"
                                onClick={() => navigate("/choose-plan")}
                                className="mt-4 bg-subMain px-5 py-3 rounded hover:opacity-90"
                            >
                                Back to choose plan
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
