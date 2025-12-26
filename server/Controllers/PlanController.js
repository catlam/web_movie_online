import Plan from "../Models/Plan.js";

// Lấy danh sách tất cả plan
export const getPlans = async (req, res) => {
    try {
        const plans = await Plan.find().sort({ createdAt: -1 });
        res.json(plans);
    } catch (err) {
        console.error("getPlans error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Lấy chi tiết 1 plan
export const getPlanById = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) return res.status(404).json({ message: "Plan not found" });
        res.json(plan);
    } catch (err) {
        console.error("getPlanById error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Create new plan
export const createPlan = async (req, res) => {
    try {
        const {
            code,
            name,
            description,
            priceMonthly,
            priceYearly,
            durationDays,
            // features fields (optional)
            hd,
            uhd,
            devices,
            downloads,
            ads,
            features, // optional object: { hd, uhd, devices, downloads, ads }
            isActive,
        } = req.body;

        if (!code || !name || priceMonthly === undefined) {
            return res
                .status(400)
                .json({ message: "code, name and priceMonthly are required" });
        }

        const existed = await Plan.findOne({ code: code.toLowerCase() });
        if (existed) {
            return res.status(400).json({ message: "Plan code already exists" });
        }

        // build features object
        const newFeatures = {
            hd: features?.hd ?? hd ?? false,
            uhd: features?.uhd ?? uhd ?? false,
            devices:
                features?.devices ??
                (devices !== undefined ? Number(devices) : 1),
            downloads:
                features?.downloads ??
                downloads ??
                (devices !== undefined
                    ? `${devices} device(s)`
                    : "1 device"),
            ads: features?.ads ?? ads ?? "No ads",
        };

        const plan = await Plan.create({
            code: code.toLowerCase(),
            name,
            description,
            price: {
                monthly: Number(priceMonthly),
                yearly:
                    priceYearly !== undefined && priceYearly !== ""
                        ? Number(priceYearly)
                        : 0,
            },
            durationDays:
                durationDays !== undefined ? Number(durationDays) : 30,
            features: newFeatures,
            isActive: isActive !== undefined ? !!isActive : true,
        });

        res.status(201).json(plan);
    } catch (err) {
        console.error("createPlan error:", err);
        res.status(500).json({ message: "Server error" });
    }
};


// Update plan
export const updatePlan = async (req, res) => {
    try {
        const {
            code,
            name,
            description,
            priceMonthly,
            priceYearly,
            durationDays,
            // features
            hd,
            uhd,
            devices,
            downloads,
            ads,
            features,
            isActive,
        } = req.body;

        const plan = await Plan.findById(req.params.id);
        if (!plan) return res.status(404).json({ message: "Plan not found" });

        if (code) plan.code = code.toLowerCase();
        if (name) plan.name = name;
        if (description !== undefined) plan.description = description;

        // price
        if (priceMonthly !== undefined || priceYearly !== undefined) {
            plan.price = {
                monthly:
                    priceMonthly !== undefined
                        ? Number(priceMonthly)
                        : plan.price?.monthly,
                yearly:
                    priceYearly !== undefined && priceYearly !== ""
                        ? Number(priceYearly)
                        : plan.price?.yearly ?? 0,
            };
        }

        // duration
        if (durationDays !== undefined) {
            plan.durationDays = Number(durationDays);
        }

        // features
        const newFeatures = { ...(plan.features || {}) };

        if (features && typeof features === "object") {
            if (features.hd !== undefined) newFeatures.hd = !!features.hd;
            if (features.uhd !== undefined) newFeatures.uhd = !!features.uhd;
            if (features.devices !== undefined)
                newFeatures.devices = Number(features.devices);
            if (features.downloads !== undefined)
                newFeatures.downloads = features.downloads;
            if (features.ads !== undefined) newFeatures.ads = features.ads;
        }

        if (hd !== undefined) newFeatures.hd = !!hd;
        if (uhd !== undefined) newFeatures.uhd = !!uhd;
        if (devices !== undefined) newFeatures.devices = Number(devices);
        if (downloads !== undefined) newFeatures.downloads = downloads;
        if (ads !== undefined) newFeatures.ads = ads;

        plan.features = newFeatures;

        if (isActive !== undefined) plan.isActive = !!isActive;

        const updated = await plan.save();
        res.json(updated);
    } catch (err) {
        console.error("updatePlan error:", err);
        res.status(500).json({ message: "Server error" });
    }
};


// Xóa plan
export const deletePlan = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) return res.status(404).json({ message: "Plan not found" });

        await plan.deleteOne();
        res.json({ message: "Plan deleted" });
    } catch (err) {
        console.error("deletePlan error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const togglePlanStatus = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) return res.status(404).json({ message: "Plan not found" });

        plan.isActive = !plan.isActive;
        const updated = await plan.save();
        res.json(updated);
    } catch (err) {
        console.error("togglePlanStatus error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
