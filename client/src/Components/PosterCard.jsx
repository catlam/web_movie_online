import React from "react";

/**
 * Thẻ hiển thị trung lập cho cả movie & series
 * - Không import Movie/SeriesCard
 * - Không dùng <Link>
 * - Parent truyền onOpen() để điều hướng
 */
export default function PosterCard({
    image,
    title,
    subtitle,           // ví dụ "S1 • Ep3"
    progressPct = null, // số 0..100 hoặc null
    onOpen,
    onDelete,
    deleting = false,
}) {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onOpen();
            }}
            className="border border-border p-1 hover:scale-95 transitions relative rounded overflow-hidden cursor-pointer outline-none"
            title={title}
        >
            <img
                src={image || "/images/user.png"}
                alt={title || "Poster"}
                className="w-full h-96 object-cover"
                loading="lazy"
                decoding="async"
            />

            {/* tiêu đề + phụ đề (season/episode) */}
            <div className="absolute flex items-center justify-between gap-2 bottom-0 right-0 left-0 bg-main/60 text-white px-4 py-3">
                <div className="min-w-0">
                    <h3 className="font-semibold truncate">{title || "Untitled"}</h3>
                    {subtitle ? (
                        <p className="text-xs opacity-90 truncate">{subtitle}</p>
                    ) : null}
                </div>

                {/* nút X xoá */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete && onDelete();
                    }}
                    disabled={deleting}
                    title="Remove from Continue Watching"
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm
            ${deleting ? "bg-black/40 text-white/60 cursor-not-allowed" : "bg-black/70 hover:bg-black/90 text-white"}`}
                >
                    ×
                </button>
            </div>

            {/* progress bar */}
            {typeof progressPct === "number" && (
                <div className="absolute left-0 right-0 bottom-2 px-2">
                    <div className="h-1 w-full bg-white/20 rounded">
                        <div
                            className="h-1 bg-white rounded"
                            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
