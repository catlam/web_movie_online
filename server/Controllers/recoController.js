// server/Controllers/recoController.js
import asyncHandler from "express-async-handler";
import Movie from "../Models/MoviesModel.js";   
import Series from "../Models/SeriesModel.js";

// Chuẩn hoá chuỗi về lowercase, trim
const norm = (s) => String(s || "").toLowerCase().trim();

// Lấy tất cả language & category đang có trong DB (movies + series)
async function loadKnownMeta() {
    // distinct trả ra list string / null
    const movieLanguages = await Movie.distinct("language");
    const seriesLanguages = await Series.distinct("language");
    const movieCategories = await Movie.distinct("category");
    const seriesCategories = await Series.distinct("category");

    const langs = Array.from(
        new Set(
            [...movieLanguages, ...seriesLanguages]
                .filter(Boolean)
                .map((x) => String(x))
        )
    );
    const cats = Array.from(
        new Set(
            [...movieCategories, ...seriesCategories]
                .filter(Boolean)
                .map((x) => String(x))
        )
    );

    return {
        languages: langs,
        categories: cats,
    };
}

// Từ list tokens → match vào list giá trị trong DB theo substring
function matchTokensToValues(tokens, values) {
    const matched = new Set();
    const lowerValues = values.map((v) => ({
        raw: v,
        low: norm(v),
    }));

    for (const t of tokens) {
        const lowT = norm(t);
        if (!lowT) continue;
        for (const v of lowerValues) {
            // ví dụ: "korean" match "korean", "korean drama"
            if (v.low.includes(lowT)) {
                matched.add(v.raw);
            }
        }
    }
    return Array.from(matched);
}

// GET /api/reco/mood-search?mood=...
export const moodSearch = asyncHandler(async (req, res) => {
    const moodRaw = req.query.mood || "";
    const limit = Number(req.query.limit) || 12;

    const mood = norm(moodRaw);
    if (!mood) {
        return res.json({ items: [], debug: { reason: "empty_mood" } });
    }

    // tách từ: "i want korean comedy" -> ["i","want","korean","comedy"]
    const tokens = mood
        .split(/[\s,.;!?]+/)
        .map((t) => t.trim())
        .filter(Boolean);

    // Lấy language, category hiện có trong DB
    const { languages, categories } = await loadKnownMeta();

    // Match token vào language/category
    const languageMatches = matchTokensToValues(tokens, languages);  // ví dụ: ["Korean"]
    const categoryMatches = matchTokensToValues(tokens, categories); // ví dụ: ["Comedy"]

    // Những token nào đã được dùng cho language / category thì loại ra khỏi text tokens
    const usedTokens = new Set(
        [...languageMatches, ...categoryMatches].map((v) => norm(v))
    );

    const textTokens = tokens.filter((t) => {
        const lowT = norm(t);
        // nếu token đã nằm trong một language/category nào đó (substring) thì coi như đã dùng
        for (const v of usedTokens) {
            if (v.includes(lowT) || lowT.includes(v)) return false;
        }
        return true;
    });

    // Build query Mongo
    const andConditions = [];

    if (languageMatches.length > 0) {
        // language lưu dạng string, ví dụ "Korean"
        andConditions.push({ language: { $in: languageMatches } });
    }

    if (categoryMatches.length > 0) {
        // category lưu dạng string, ví dụ "Comedy"
        andConditions.push({ category: { $in: categoryMatches } });
    }

    if (textTokens.length > 0) {
        // Ghép các token còn lại thành regex OR
        // Ví dụ textTokens = ["romantic"] -> /romantic/i
        const regex = new RegExp(textTokens.join("|"), "i");
        andConditions.push({
            $or: [
                { title: regex }, // nếu có
                { name: regex },  // Movie/Series thường dùng name
                { desc: regex },  // nếu cậu lưu mô tả ở field desc
                { description: regex }, // nếu có field khác
            ],
        });
    }

    const baseQuery = andConditions.length > 0 ? { $and: andConditions } : {};

    // console.log("[moodSearch] mood =", moodRaw);
    // console.log("[moodSearch] tokens =", tokens);
    // console.log("[moodSearch] languageMatches =", languageMatches);
    // console.log("[moodSearch] categoryMatches =", categoryMatches);
    // console.log("[moodSearch] textTokens =", textTokens);
    // console.log("[moodSearch] query =", JSON.stringify(baseQuery));

    // Query song song movies + series
    const [movies, series] = await Promise.all([
        Movie.find(baseQuery)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean(),
        Series.find(baseQuery)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean(),
    ]);

    const mapped = [
        ...movies.map((m) => ({
            kind: "movie",
            _id: m._id,
            movieId: m._id,
            title: m.title || m.name,
            name: m.name,
            desc: m.desc,
            posterUrl: m.posterUrl || m.image || m.titleImage,
            image: m.image,
            titleImage: m.titleImage,
            year: m.year,
            language: m.language,
            category: Array.isArray(m.category) ? m.category : [m.category].filter(Boolean),
        })),
        ...series.map((s) => ({
            kind: "series",
            _id: s._id,
            movieId: s._id,
            title: s.title || s.name,
            name: s.name,
            desc: s.desc,
            posterUrl: s.posterUrl || s.image || s.titleImage,
            image: s.image,
            titleImage: s.titleImage,
            year: s.year,
            language: s.language,
            category: Array.isArray(s.category) ? s.category : [s.category].filter(Boolean),
        })),
    ];

    // nếu không tìm được gì, trả về debug để FE hiển thị message
    if (mapped.length === 0) {
        return res.json({
            items: [],
            debug: {
                mood: moodRaw,
                tokens,
                languageMatches,
                categoryMatches,
                textTokens,
            },
        });
    }

    return res.json({
        items: mapped.slice(0, limit),
        debug: {
            mood: moodRaw,
            tokens,
            languageMatches,
            categoryMatches,
            textTokens,
            total: mapped.length,
        },
    });
});
