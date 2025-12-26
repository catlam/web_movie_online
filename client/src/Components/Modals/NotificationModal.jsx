// client/src/Components/Notifications/NotificationModal.jsx
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { markRead, setNotifications } from "../../Redux/notificationSlice";
import { Empty } from "../Notifications/empty";
import { fetchNotificationsService } from "../../Redux/APIs/notificationServices";

function formatTime(dateString) {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
    });
}

const MAX_VISIBLE = 5;

const NotificationModal = ({ open, onClose }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { items } = useSelector((state) => state.notifications);
    const [showAll, setShowAll] = useState(false);
    const [loadedFromApi, setLoadedFromApi] = useState(false);

    // 🔥 Lần đầu mở modal thì load từ backend
    useEffect(() => {
        if (!open) return;
        if (loadedFromApi) return;
        if (items && items.length > 0) {
            setLoadedFromApi(true);
            return;
        }

        (async () => {
            try {
                const list = await fetchNotificationsService();
                dispatch(setNotifications(list));
                setLoadedFromApi(true);
            } catch (e) {
                console.error("[NotificationModal] fetch notifications error:", e);
            }
        })();
    }, [open, loadedFromApi, items, dispatch]);

    if (!open) return null;

    const handleClickNotification = (n) => {
        dispatch(markRead(n._id));

        if (n.type === "new_movie") {
            navigate(`/movie/${n.refId}`);
        } else if (n.type === "new_series") {
            navigate(`/series/${n.refId}`);
        }

        onClose();
    };

    const visibleItems = showAll ? items : items.slice(0, MAX_VISIBLE);
    const hasMore = items && items.length > MAX_VISIBLE;

    return (
        <div className="fixed inset-0 z-40 flex items-start justify-end pt-20 pr-4 bg-black/40">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative z-50 w-full max-w-md bg-main rounded-xl shadow-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="text-white font-semibold text-sm">Notifications</h3>
                    <button
                        onClick={onClose}
                        className="text-xs text-gray-300 hover:text-white"
                    >
                        Close
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                    {items && items.length > 0 ? (
                        <>
                            <ul className="divide-y divide-border">
                                {visibleItems.map((n) => (
                                    <li
                                        key={n._id}
                                        onClick={() => handleClickNotification(n)}
                                        className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition ${n.isRead ? "opacity-70" : ""
                                            }`}
                                    >
                                        <div className="w-12 h-16 flex-shrink-0 rounded-md overflow-hidden bg-dryGray">
                                            {n.image ? (
                                                <img
                                                    src={n.image}
                                                    alt={n.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                                                    No image
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <p className="text-xs text-gray-400 mb-0.5">
                                                {n.type === "new_movie" && "New Movie"}
                                                {n.type === "new_series" && "New Series"}
                                            </p>
                                            <p className="text-sm font-semibold text-white line-clamp-1">
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-gray-300 line-clamp-2 mt-0.5">
                                                {n.message}
                                            </p>
                                            <p className="text-[11px] text-gray-500 mt-1">
                                                {formatTime(n.createdAt)}
                                            </p>
                                        </div>

                                        {!n.isRead && (
                                            <div className="flex items-start pt-1">
                                                <span className="w-2 h-2 rounded-full bg-subMain" />
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>

                            {hasMore && (
                                <div className="px-4 py-2 border-t border-border flex justify-center">
                                    <button
                                        onClick={() => setShowAll((v) => !v)}
                                        className="text-xs text-subMain hover:underline"
                                    >
                                        {showAll ? "Show less" : "Show more"}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="py-8 px-4">
                            <Empty message="No notifications yet." />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationModal;
