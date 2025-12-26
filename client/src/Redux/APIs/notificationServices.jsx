// client/src/Redux/APIs/notificationServices.js
import Axios from "./Axios";

export const fetchNotificationsService = async () => {
    const { data } = await Axios.get("/notifications");
    return data?.items || [];
};
