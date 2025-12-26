import React, { useEffect, useMemo, useState } from "react";
import SideBar from "../SideBar";
import toast from "react-hot-toast";
import {
    getAllPlans,
    createPlan,
    updatePlan,
    deletePlan,
    togglePlanStatus,
} from "../../../Redux/APIs/PlanServices";
import { FaBoxOpen, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

// ===== Helpers =====
const fm = (n) =>
    Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

const cardCls = "bg-main/60 border border-border rounded-2xl";
const sectionTitle = "text-white/90 text-sm font-semibold tracking-wide";

export default function AdminMembership() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);

    const [form, setForm] = useState({
        code: "",
        name: "",
        description: "",
        priceMonthly: "",
        priceYearly: "",
        maxDevices: 1,
        maxQuality: "HD",
        accessLevel: "ALL",
        durationDays: 30,
        isActive: true,
    });

    // ===== Load plans once =====
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await getAllPlans();
                setPlans(data || []);
            } catch (err) {
                console.error(err);
                toast.error(err?.message || "Failed to load membership plans");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // ===== Stats for header cards =====
    const stats = useMemo(() => {
        if (!plans?.length) {
            return {
                total: 0,
                active: 0,
                inactive: 0,
                minPrice: 0,
                maxPrice: 0,
            };
        }

        const active = plans.filter((p) => p.isActive).length;
        const inactive = plans.length - active;

        const prices = plans
            .map((p) => p.price?.monthly)
            .filter((v) => typeof v === "number");
        const minPrice = prices.length ? Math.min(...prices) : 0;
        const maxPrice = prices.length ? Math.max(...prices) : 0;

        return {
            total: plans.length,
            active,
            inactive,
            minPrice,
            maxPrice,
        };
    }, [plans]);

    // ===== Form handlers =====
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const resetForm = () => {
        setEditingPlan(null);
        setForm({
            code: "",
            name: "",
            description: "",
            priceMonthly: "",
            priceYearly: "",
            maxDevices: 1,
            maxQuality: "HD",
            accessLevel: "ALL",
            durationDays: 30,
            isActive: true,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.code || !form.name) {
            toast.error("Code and Name are required");
            return;
        }

        const payload = {
            code: form.code.trim(),
            name: form.name.trim(),
            description: form.description,
            priceMonthly:
                form.priceMonthly === "" ? undefined : Number(form.priceMonthly),
            priceYearly:
                form.priceYearly === "" ? undefined : Number(form.priceYearly),
            maxDevices:
                form.maxDevices === "" ? undefined : Number(form.maxDevices),
            maxQuality: form.maxQuality,
            accessLevel: form.accessLevel,
            durationDays:
                form.durationDays === "" ? undefined : Number(form.durationDays),
            isActive: form.isActive,
        };

        try {
            setSaving(true);
            if (editingPlan) {
                const updated = await updatePlan(editingPlan._id, payload);
                toast.success("Plan updated successfully");
                setPlans((prev) =>
                    prev.map((p) => (p._id === updated._id ? updated : p))
                );
            } else {
                const created = await createPlan(payload);
                toast.success("Plan created successfully");
                setPlans((prev) => [created, ...prev]);
            }
            resetForm();
        } catch (err) {
            console.error(err);
            toast.error(err?.message || "Failed to save plan");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);
        setForm({
            code: plan.code,
            name: plan.name,
            description: plan.description || "",
            priceMonthly: plan.price?.monthly ?? "",
            priceYearly: plan.price?.yearly ?? "",
            maxDevices: plan.maxDevices ?? 1,
            maxQuality: plan.maxQuality || "HD",
            accessLevel: plan.accessLevel || "ALL",
            durationDays: plan.durationDays ?? 30,
            isActive: plan.isActive,
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this plan?")) return;
        try {
            await deletePlan(id);
            toast.success("Plan deleted successfully");
            setPlans((prev) => prev.filter((p) => p._id !== id));
        } catch (err) {
            console.error(err);
            toast.error(err?.message || "Failed to delete plan");
        }
    };

    const handleToggle = async (plan) => {
        try {
            const updated = await togglePlanStatus(plan._id);
            toast.success(updated.isActive ? "Plan activated" : "Plan deactivated");
            setPlans((prev) =>
                prev.map((p) => (p._id === updated._id ? updated : p))
            );
        } catch (err) {
            console.error(err);
            toast.error(err?.message || "Failed to change plan status");
        }
    };

    return (
        <SideBar>
            <div className="flex flex-col gap-6">
                <h2 className="text-xl font-bold">Membership Management</h2>

                {/* Stats row – similar style to membership cards */}
                <div className="grid md:grid-cols-4 gap-4">
                    <StatCard
                        icon={<FaBoxOpen />}
                        label="Total Plans"
                        value={stats.total}
                    />
                    <StatCard
                        icon={<FaCheckCircle />}
                        label="Active Plans"
                        value={stats.active}
                    />
                    <StatCard
                        icon={<FaTimesCircle />}
                        label="Inactive Plans"
                        value={stats.inactive}
                    />
                    <div className={cardCls + " p-4 flex flex-col justify-between"}>
                        <p className={sectionTitle}>Price Range</p>
                        <div className="mt-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-border">Min monthly</span>
                                <span className="font-semibold">
                                    {stats.minPrice ? `${fm(stats.minPrice)} VND` : "—"}
                                </span>
                            </div>
                            <div className="flex justify-between mt-1">
                                <span className="text-border">Max monthly</span>
                                <span className="font-semibold">
                                    {stats.maxPrice ? `${fm(stats.maxPrice)} VND` : "—"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main layout: left = list, right = form (like Membership grid) */}
                <div className="grid lg:grid-cols-12 gap-6">
                    {/* Plans list as cards */}
                    <div className={`lg:col-span-7 ${cardCls} p-6`}>
                        <div className="flex items-center justify-between mb-3">
                            <p className={sectionTitle}>Plans</p>
                        </div>

                        {loading ? (
                            <p>Loading...</p>
                        ) : plans.length === 0 ? (
                            <p className="text-sm text-border">No plans found.</p>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {plans.map((plan) => (
                                    <PlanCard
                                        key={plan._id}
                                        plan={plan}
                                        onEdit={() => handleEdit(plan)}
                                        onDelete={() => handleDelete(plan._id)}
                                        onToggle={() => handleToggle(plan)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Form – same vibe as Membership right card */}
                    <div className={`lg:col-span-5 ${cardCls} p-6`}>
                        <p className={sectionTitle}>
                            {editingPlan ? "Edit Plan" : "Create New Plan"}
                        </p>

                        <form className="space-y-3 mt-4" onSubmit={handleSubmit}>
                            <div>
                                <label className="block text-xs mb-1">Code (unique)</label>
                                <input
                                    name="code"
                                    value={form.code}
                                    onChange={handleChange}
                                    className="w-full px-2 py-1 rounded bg-slate-800 text-sm"
                                    placeholder="basic / standard / premium"
                                />
                            </div>

                            <div>
                                <label className="block text-xs mb-1">Display Name</label>
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    className="w-full px-2 py-1 rounded bg-slate-800 text-sm"
                                    placeholder="Basic"
                                />
                            </div>

                            <div>
                                <label className="block text-xs mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    className="w-full px-2 py-1 rounded bg-slate-800 text-sm"
                                    rows={2}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs mb-1">Monthly Price</label>
                                    <input
                                        type="number"
                                        name="priceMonthly"
                                        value={form.priceMonthly}
                                        onChange={handleChange}
                                        className="w-full px-2 py-1 rounded bg-slate-800 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs mb-1">Yearly Price</label>
                                    <input
                                        type="number"
                                        name="priceYearly"
                                        value={form.priceYearly}
                                        onChange={handleChange}
                                        className="w-full px-2 py-1 rounded bg-slate-800 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs mb-1">Max Devices</label>
                                    <input
                                        type="number"
                                        name="maxDevices"
                                        value={form.maxDevices}
                                        onChange={handleChange}
                                        className="w-full px-2 py-1 rounded bg-slate-800 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs mb-1">Max Quality</label>
                                    <select
                                        name="maxQuality"
                                        value={form.maxQuality}
                                        onChange={handleChange}
                                        className="w-full px-2 py-1 rounded bg-slate-800 text-sm"
                                    >
                                        <option value="SD">SD</option>
                                        <option value="HD">HD</option>
                                        <option value="FHD">FHD</option>
                                        <option value="2K">2K</option>
                                        <option value="4K">4K</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs mb-1">Access Level</label>
                                <input
                                    name="accessLevel"
                                    value={form.accessLevel}
                                    onChange={handleChange}
                                    className="w-full px-2 py-1 rounded bg-slate-800 text-sm"
                                    placeholder="ALL / MOVIE_ONLY / SERIES_ONLY"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 items-center">
                                <div>
                                    <label className="block text-xs mb-1">Duration (days)</label>
                                    <input
                                        type="number"
                                        name="durationDays"
                                        value={form.durationDays}
                                        onChange={handleChange}
                                        className="w-full px-2 py-1 rounded bg-slate-800 text-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-2 mt-5">
                                    <input
                                        id="isActive"
                                        type="checkbox"
                                        name="isActive"
                                        checked={form.isActive}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="isActive" className="text-xs">
                                        Active
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                {editingPlan && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-3 py-1 rounded bg-slate-700 text-sm"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-1 rounded bg-green-600 text-sm disabled:opacity-60"
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingPlan
                                            ? "Update Plan"
                                            : "Create Plan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </SideBar>
    );
}

/* ============ Sub components ============ */

function StatCard({ icon, label, value }) {
    return (
        <div className={cardCls + " p-4 flex items-center gap-3"}>
            <div className="w-9 h-9 rounded-full bg-main flex items-center justify-center text-subMain">
                {icon}
            </div>
            <div>
                <p className="text-xs text-border">{label}</p>
                <p className="text-lg font-semibold">{value}</p>
            </div>
        </div>
    );
}

function PlanCard({ plan, onEdit, onDelete, onToggle }) {
    const color = plan.isActive ? "border-subMain/70" : "border-border";
    return (
        <div
            className={`rounded-2xl bg-main/70 border ${color} hover:border-subMain transition p-5 backdrop-blur-md`}
        >
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-xs uppercase text-border tracking-wide">
                        {plan.code}
                    </p>
                    <h3 className="text-lg font-bold mt-1">{plan.name}</h3>
                </div>
                <span
                    className={`text-[11px] px-2 py-1 rounded-full border ${plan.isActive
                            ? "bg-green-500/10 border-green-400/50 text-green-200"
                            : "bg-yellow-500/10 border-yellow-400/50 text-yellow-100"
                        }`}
                >
                    {plan.isActive ? "Active" : "Inactive"}
                </span>
            </div>

            <div className="mt-3 text-sm space-y-1">
                <div className="flex justify-between">
                    <span className="text-border">Monthly</span>
                    <span>{plan.price?.monthly ? `${fm(plan.price.monthly)} VND` : "—"}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-border">Yearly</span>
                    <span>{plan.price?.yearly ? `${fm(plan.price.yearly)} VND` : "—"}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-border">Devices</span>
                    <span>{plan.maxDevices ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-border">Max quality</span>
                    <span>{plan.maxQuality || "—"}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-border">Access level</span>
                    <span>{plan.accessLevel || "—"}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-border">Duration</span>
                    <span>
                        {plan.durationDays ? `${plan.durationDays} days` : "—"}
                    </span>
                </div>
            </div>

            <div className="mt-4 flex gap-2">
                <button
                    onClick={onEdit}
                    className="flex-1 px-3 py-2 rounded bg-yellow-500/90 hover:bg-yellow-400 text-xs"
                >
                    Edit
                </button>
                <button
                    onClick={onToggle}
                    className="flex-1 px-3 py-2 rounded bg-subMain/80 hover:bg-subMain text-xs"
                >
                    {plan.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                    onClick={onDelete}
                    className="px-3 py-2 rounded bg-red-600/90 hover:bg-red-500 text-xs"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}
