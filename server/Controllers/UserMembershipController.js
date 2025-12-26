import Purchase from "../Models/Purchase.js";
import Plan from "../Models/Plan.js";

export const getMembershipStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const sub = await Purchase.findOne({ userId }).populate("planId");

        if (req.user.isAdmin) {
            return res.json({
                active: true,
                plan: { name: "Admin Access", level: 999 },
                expiresAt: null,
            });
        }

        if (!sub)
            return res.json({ active: false, plan: null, expiresAt: null });

        const now = new Date();
        const active = sub.status === "active" && sub.expiresAt > now;

        return res.json({
            active,
            plan: sub.planId,
            expiresAt: sub.expiresAt,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
