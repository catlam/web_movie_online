import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBar from "./SideBar";
import { FaCheck, FaClock, FaExclamationTriangle } from "react-icons/fa";
import { getActivePlansForUser } from "../../Redux/APIs/PlanServices";

// ===== Helpers =====
const fm = (n) =>
    Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
const dt = (s) => (s ? new Date(s).toLocaleString() : "—");

export default function Membership() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [sub, setSub] = useState(null);
    const [payments, setPayments] = useState([]);
    const [plans, setPlans] = useState([]);

    const cardCls = "bg-main/60 border border-border rounded-2xl";
    const sectionTitle = "text-white/90 text-sm font-semibold tracking-wide";

    const userInfo = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("userInfo") || "{}");
        } catch {
            return {};
        }
    }, []);
    const token = userInfo?.token;

    useEffect(() => {
        const run = async () => {
            try {
                setLoading(true);
                setError("");

                // Current subscription
                const r1 = await fetch("/api/user/subscription", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const d1 = await r1.json();

                // Payment history
                let d2 = [];
                try {
                    const r2 = await fetch("/api/user/payments?limit=10", {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (r2.ok) d2 = await r2.json();
                } catch { }

                // Active plans from backend
                try {
                    const activePlans = await getActivePlansForUser();
                    setPlans(activePlans || []);
                } catch (e) {
                    console.error("[Membership] getActivePlansForUser error:", e);
                }

                setSub(d1 || null);
                setPayments(Array.isArray(d2) ? d2 : []);
            } catch (e) {
                console.error(e);
                setError("Could not load membership. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [token]);

    // Find active plan by planCode from subscription
    const activePlan = useMemo(() => {
        if (!sub?.planCode || !plans.length) return null;
        return plans.find((p) => p.code === sub.planCode) || null;
    }, [sub, plans]);

    const soonExpired =
        sub?.active && sub?.expiresAt
            ? new Date(sub.expiresAt).getTime() - Date.now() <
            7 * 24 * 3600 * 1000
            : false;

    const goPay = (planCode) => {
        if (!planCode) return;
        navigate(`/payment?plan=${planCode}&period=monthly`);
    };

    // Derive perks from plan
    const hd = activePlan
        ? ["HD", "FHD", "2K", "4K"].includes(activePlan.maxQuality)
        : false;
    const uhd = activePlan
        ? ["2K", "4K"].includes(activePlan.maxQuality)
        : false;
    const devices = activePlan?.maxDevices || "—";
    const downloads =
        typeof activePlan?.maxDevices === "number"
            ? `${activePlan.maxDevices} devices`
            : "—";

    return (
        <SideBar>
            <div className="flex flex-col gap-6">
                <h2 className="text-xl font-bold">Membership</h2>

                {loading ? (
                    <Skeleton cardCls={cardCls} />
                ) : error ? (
                    <ErrorBlock message={error} />
                ) : (
                    <>
                        {/* Top grid */}
                        <div className="grid lg:grid-cols-12 gap-6">
                            {/* Current Plan */}
                            <div className={`lg:col-span-8 ${cardCls} p-6`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className={sectionTitle}>Current Plan</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xl font-extrabold">
                                                {activePlan?.name || sub?.planName || "—"}
                                            </span>
                                            <StatusBadge active={!!sub?.active} />
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm">
                                            <InfoRow
                                                label="Purchased on"
                                                value={dt(sub?.startedAt)}
                                            />
                                            <InfoRow
                                                label="Expires on"
                                                value={dt(sub?.expiresAt)}
                                                highlight={soonExpired}
                                            />
                                        </div>
                                    </div>

                                    {sub?.active && (
                                        <div className="flex flex-col items-end gap-2">
                                            {soonExpired && (
                                                <span className="text-[11px] text-yellow-300">
                                                    Expiring soon — renew now
                                                </span>
                                            )}
                                            <button
                                                onClick={() =>
                                                    goPay(activePlan?.code || sub?.planCode)
                                                }
                                                className="bg-subMain hover:opacity-90 transition text-white px-4 py-2 rounded"
                                            >
                                                Renew Now
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Perks */}
                                <div className="grid sm:grid-cols-4 gap-3 mt-6 text-sm">
                                    <Perk
                                        label="HD (720p/1080p)"
                                        value={hd ? "Yes" : "No"}
                                    />
                                    <Perk
                                        label="Ultra HD (4K)"
                                        value={uhd ? "Yes" : "No"}
                                    />
                                    <Perk label="Devices" value={devices} />
                                    <Perk label="Downloads" value={downloads} />
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className={`lg:col-span-4 ${cardCls} p-6`}>
                                <p className={sectionTitle}>Actions</p>
                                <div className="flex flex-col gap-3 mt-5">
                                    <button
                                        onClick={() =>
                                            goPay(activePlan?.code || sub?.planCode)
                                        }
                                        disabled={!sub?.active}
                                        className="bg-subMain hover:opacity-90 transition text-white px-5 py-3 rounded disabled:opacity-50"
                                    >
                                        Renew Plan
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Plan grid */}
                        <div className={`${cardCls} p-6`}>
                            <div className="flex items-center justify-between mb-4">
                                <p className={sectionTitle}>Change Plan</p>
                            </div>
                            <PlanGrid
                                plans={plans}
                                currentPlanCode={sub?.planCode}
                                onSelect={goPay}
                            />
                        </div>

                        {/* Payment history */}
                        <div className={`${cardCls} p-6`}>
                            <p className={sectionTitle}>Recent Payments</p>
                            <PaymentHistory payments={payments} />
                        </div>
                    </>
                )}
            </div>
        </SideBar>
    );
}

/* ================= Subcomponents ================= */

function Skeleton({ cardCls }) {
    return (
        <div className="flex flex-col gap-6">
            <div className={`h-40 ${cardCls}`} />
            <div className={`h-64 ${cardCls}`} />
            <div className={`h-56 ${cardCls}`} />
        </div>
    );
}

function ErrorBlock({ message }) {
    return (
        <div className="bg-red-900/20 border border-red-500/40 rounded-2xl p-6 text-red-300 flex items-center gap-3">
            <FaExclamationTriangle />
            <p>{message}</p>
        </div>
    );
}

function StatusBadge({ active }) {
    return active ? (
        <span className="text-xs px-2 py-1 rounded bg-green-600/20 border border-green-400/40 text-green-300 flex items-center gap-1">
            <FaCheck size={12} /> Active
        </span>
    ) : (
        <span className="text-xs px-2 py-1 rounded bg-yellow-600/20 border border-yellow-400/40 text-yellow-200 flex items-center gap-1">
            <FaClock size={12} /> Inactive
        </span>
    );
}

function InfoRow({ label, value, highlight }) {
    return (
        <div>
            <p className="text-border">{label}</p>
            <p
                className={`text-white/90 ${highlight ? "text-yellow-300" : ""
                    }`}
            >
                {value}
            </p>
        </div>
    );
}

function Perk({ label, value }) {
    return (
        <div className="rounded-lg border border-border p-4">
            <div className="text-border">{label}</div>
            <div className="font-semibold">{value}</div>
        </div>
    );
}

function PlanGrid({ plans, currentPlanCode, onSelect }) {
    if (!plans?.length) {
        return (
            <p className="text-border text-sm mt-3">
                No available plans.
            </p>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => {
                const isCurrent = p.code === currentPlanCode;

                const hd = ["HD", "FHD", "2K", "4K"].includes(p.maxQuality);
                const uhd = ["2K", "4K"].includes(p.maxQuality);
                const devices = p.maxDevices || 1;
                const downloads = `${devices} devices`;

                const borderColor = isCurrent
                    ? "border-subMain/70"
                    : "border-border";

                return (
                    <div
                        key={p._id}
                        className={`rounded-2xl bg-main/70 border ${borderColor} hover:border-subMain transition p-6 backdrop-blur-md`}
                    >
                        <div className="flex items-baseline justify-between mt-1">
                            <h3 className="text-lg font-bold">{p.name}</h3>
                            <div className="text-right">
                                <div className="text-2xl font-extrabold">
                                    {fm(p.price?.monthly)}{" "}
                                    <span className="text-sm font-normal">VND</span>
                                </div>
                                <div className="text-[11px] text-border">/month</div>
                            </div>
                        </div>

                        <div className="h-px bg-border/60 my-4" />

                        <ul className="flex flex-col gap-2 text-sm">
                            <RowItem ok={hd} text="HD (720p/1080p)" />
                            <RowItem ok={uhd} text="Ultra HD (4K)" />
                            <RowItem ok text={`Devices: ${devices}`} />
                            <RowItem ok text={`Downloads on ${downloads}`} />
                            <RowItem ok text="No ads" />
                        </ul>

                        <div className="mt-5">
                            {isCurrent ? (
                                <button
                                    onClick={() => onSelect(p.code)}
                                    className="w-full bg-subMain hover:opacity-90 transition text-white px-5 py-3 rounded"
                                >
                                    Renew {p.name}
                                </button>
                            ) : (
                                <button
                                    onClick={() => onSelect(p.code)}
                                    className="w-full border border-border hover:border-subMain transition text-white px-5 py-3 rounded"
                                >
                                    Switch to {p.name}
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function RowItem({ ok, text }) {
    return (
        <li className="flex items-center gap-2">
            <span
                className={`inline-block w-4 h-4 rounded-full border border-border ${ok ? "bg-subMain/80" : "bg-transparent"
                    }`}
            />
            <span>{text}</span>
        </li>
    );
}

function PaymentHistory({ payments }) {
    if (!payments?.length) {
        return (
            <p className="text-border text-sm mt-3">
                No payments found.
            </p>
        );
    }
    return (
        <div className="mt-3 rounded-xl overflow-hidden border border-border">
            <div className="grid grid-cols-5 bg-main/60 text-sm">
                <div className="p-3 text-border">Date</div>
                <div className="p-3 text-border">Order ID</div>
                <div className="p-3 text-border">Amount</div>
                <div className="p-3 text-border">Method</div>
                <div className="p-3 text-border">Status</div>
            </div>
            {payments.map((p) => (
                <div
                    key={p._id || p.orderId}
                    className="grid grid-cols-5 border-t border-border text-sm"
                >
                    <div className="p-3">{dt(p.createdAt)}</div>
                    <div className="p-3 truncate" title={p.orderId}>
                        {p.orderId}
                    </div>
                    <div className="p-3">{fm(p.amount)}₫</div>
                    <div className="p-3">{p.method || "MoMo"}</div>
                    <div className="p-3 capitalize">{p.status}</div>
                </div>
            ))}
        </div>
    );
}
