import { useEffect } from "react";
import { connectSocket } from "../socket";
import { useDispatch } from "react-redux";
import { addNotification } from "../Redux/notificationSlice";
import { toast } from "react-hot-toast";

export default function useNotificationSocket(token) {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!token) return;
        const socket = connectSocket(token);

        socket.on("notification", (payload) => {
            dispatch(addNotification(payload));
            toast(`${payload.title}`, { icon: "🔔" });
        });

        return () => socket.off("notification");
    }, [token]);
}
