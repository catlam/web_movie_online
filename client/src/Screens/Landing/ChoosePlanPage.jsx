import React, { useMemo, useState } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// === Helper ===
const fm = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

// === Subscription plans ===
const PLANS = [
    {
        id: "basic",
        title: "Basic",
        badge: "",
        color: "border-white/10",
        features: {
            hd: false,
            uhd: false,
            devices: "1",
            downloads: "1 device",
            ads: "No ads",
        },
        priceMonthly: 79000,
    },
    {
        id: "standard",
        title: "Standard",
        badge: "Best Value",
        color: "border-subMain/70",
        features: {
            hd: true,
            uhd: false,
            devices: "2",
            downloads: "2 devices",
            ads: "No ads",
        },
        priceMonthly: 129000,
    },
    {
        id: "premium",
        title: "Premium",
        badge: "",
        color: "border-yellow-400/60",
        features: {
            hd: true,
            uhd: true,
            devices: "4",
            downloads: "4 devices",
            ads: "No ads",
        },
        priceMonthly: 199000,
    },
];

// === Main Component ===
export default function ChoosePlanPage() {
    const [selectedPlan, setSelectedPlan] = useState("standard");
    const navigate = useNavigate();

    const activePlan = useMemo(
        () => PLANS.find((p) => p.id === selectedPlan),
        [selectedPlan]
    );

    const totalPrice = activePlan.priceMonthly;

    const onConfirm = () => {
        // lưu gói đã chọn
        localStorage.setItem("selected_plan", activePlan.id);
        navigate("/payment");
    };

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-start py-16 px-4 text-white bg-dry">
            {/* === Blurred background === */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/images/head.jpg"
                    alt="background"
                    className="w-full h-full object-cover opacity-50 blur-sm"
                />
                <div className="absolute inset-0 bg-black/60" /> {/* overlay tối */}
            </div>

            {/* === Content === */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-5xl w-full">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
                    Choose Your Plan
                </h1>
                <p className="text-gray-400 mb-8 max-w-2xl">
                    Pick a plan that fits your lifestyle. You can switch or cancel anytime — no commitments.
                </p>

                {/* === Plan Cards === */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 w-full">
                    {PLANS.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            selected={selectedPlan === plan.id}
                            onSelect={() => setSelectedPlan(plan.id)}
                        />
                    ))}
                </div>

                {/* === Summary === */}
                <div className="w-full mt-12">
                    <Summary plan={activePlan} total={totalPrice} onConfirm={onConfirm} />
                </div>

                {/* === Comparison Table === */}
                <div className="w-full mt-10">
                    <Comparison />
                </div>
            </div>
        </div>
    );
}

// === Plan Card ===
function PlanCard({ plan, selected, onSelect }) {
    const price = plan.priceMonthly;

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`relative text-left rounded-2xl bg-main/70 border ${plan.color} hover:border-subMain transition p-6 flex flex-col gap-4 outline-none ${selected ? "ring-2 ring-subMain" : ""
                } backdrop-blur-md`}
        >
            {plan.badge && (
                <span className="absolute -top-3 left-4 text-[10px] tracking-wide bg-subMain text-white px-2 py-1 rounded">
                    {plan.badge}
                </span>
            )}

            <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-bold">{plan.title}</h3>
                <div className="text-right">
                    <div className="text-2xl font-extrabold">
                        {fm(price)} <span className="text-sm font-normal">VND</span>
                    </div>
                    <div className="text-[11px] text-border">/month</div>
                </div>
            </div>

            <div className="h-px bg-border/60" />

            <ul className="flex flex-col gap-3 text-sm">
                <Feature ok={plan.features.hd} label="HD (720p/1080p)" />
                <Feature ok={plan.features.uhd} label="Ultra HD (4K)" />
                <Feature ok label={`Devices: ${plan.features.devices}`} />
                <Feature ok label={`Downloads on ${plan.features.downloads}`} />
                <Feature ok label={plan.features.ads} />
            </ul>

            <div
                className={`mt-1 text-xs px-3 py-2 rounded border ${selected
                        ? "border-subMain text-subMain"
                        : "border-border text-border"
                    } w-fit`}
            >
                {selected ? "Selected" : "Select"}
            </div>
        </button>
    );
}

// === Feature line ===
function Feature({ ok, label }) {
    return (
        <li className="flex items-center gap-3">
            <span
                className={`rounded-full w-5 h-5 border border-border flex items-center justify-center ${ok ? "bg-subMain/80" : "bg-transparent"
                    }`}
            >
                {ok ? (
                    <FaCheck size={12} className="text-white" />
                ) : (
                    <FaTimes size={12} className="text-border" />
                )}
            </span>
            <span className="text-white/90">{label}</span>
        </li>
    );
}

// === Summary ===
function Summary({ plan, total, onConfirm }) {
    return (
        <div className="rounded-2xl border border-border bg-main/70 backdrop-blur-md p-6 flex flex-col gap-4">
            <h4 className="font-semibold text-lg">Summary</h4>
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border border-border p-4">
                    <div className="text-border">Plan</div>
                    <div className="font-semibold">{plan.title}</div>
                </div>
                <div className="rounded-lg border border-border p-4">
                    <div className="text-border">Billing</div>
                    <div className="font-semibold capitalize">Monthly</div>
                </div>
                <div className="rounded-lg border border-border p-4">
                    <div className="text-border">Total</div>
                    <div className="font-semibold">{fm(total)} VND</div>
                </div>
            </div>
            <div className="text-[12px] text-border">
                Auto-renewal enabled. You can cancel anytime from your account settings.
            </div>
            <div className="flex gap-3 flex-wrap justify-center sm:justify-start">
                <button
                    onClick={onConfirm}
                    className="bg-subMain hover:opacity-90 transition text-white px-6 py-3 rounded font-medium"
                >
                    Continue to Payment
                </button>
            </div>
        </div>
    );
}

// === Comparison Table ===
function Comparison() {
    return (
        <div className="rounded-2xl border border-border overflow-hidden bg-main/70 backdrop-blur-md">
            <div className="grid grid-cols-4 bg-main/60">
                <div className="p-4 text-sm text-border">Feature</div>
                {PLANS.map((p) => (
                    <div key={p.id} className="p-4 text-center text-sm font-semibold">
                        {p.title}
                    </div>
                ))}
            </div>
            <Row label="HD (720p/1080p)">
                {PLANS.map((p) => (
                    <Cell key={p.id}>{p.features.hd ? "✓" : "—"}</Cell>
                ))}
            </Row>
            <Row label="Ultra HD (4K)">
                {PLANS.map((p) => (
                    <Cell key={p.id}>{p.features.uhd ? "✓" : "—"}</Cell>
                ))}
            </Row>
            <Row label="Devices at once">
                {PLANS.map((p) => (
                    <Cell key={p.id}>{p.features.devices}</Cell>
                ))}
            </Row>
            <Row label="Downloads">
                {PLANS.map((p) => (
                    <Cell key={p.id}>{p.features.downloads}</Cell>
                ))}
            </Row>
            <Row label="Monthly Price">
                {PLANS.map((p) => (
                    <Cell key={p.id}>{fm(p.priceMonthly)}₫</Cell>
                ))}
            </Row>
        </div>
    );
}

function Row({ label, children }) {
    return (
        <div className="grid grid-cols-4 border-t border-border">
            <div className="p-4 text-sm text-border">{label}</div>
            {children}
        </div>
    );
}

function Cell({ children }) {
    return <div className="p-4 text-center text-sm">{children}</div>;
}
