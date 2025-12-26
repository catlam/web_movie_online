// client/src/Redux/notificationSlice.js
import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
    name: "notifications",
    initialState: {
        items: [],       // list notifications
        unreadCount: 0,  // badge số chưa đọc
    },
    reducers: {
        addNotification: (state, { payload }) => {
            // prepend vào đầu
            state.items.unshift({
                ...payload,
                isRead: payload.isRead ?? false,
            });
            state.unreadCount += 1;
        },

        setNotifications: (state, { payload }) => {
            state.items = payload || [];
            state.unreadCount = state.items.filter((n) => !n.isRead).length;
        },

        markRead: (state, { payload: id }) => {
            const n = state.items.find((x) => x._id === id);
            if (n && !n.isRead) {
                n.isRead = true;
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        },

        clearNotifications: (state) => {
            state.items = [];
            state.unreadCount = 0;
        },
    },
});

export const {
    addNotification,
    setNotifications,
    markRead,
    clearNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;
