// server/socket/registry.js
class SocketRegistry {
    constructor() {
        this.map = new Map(); // userId -> Set(socketId)
        this.io = null;
    }

    bind(io) {
        this.io = io;
    }

    add(userId, socketId) {
        if (!userId) return;
        const key = String(userId);
        const set = this.map.get(key) || new Set();
        set.add(socketId);
        this.map.set(key, set);
    }

    remove(userId, socketId) {
        const key = String(userId);
        const set = this.map.get(key);
        if (!set) return;
        set.delete(socketId);
        if (set.size === 0) this.map.delete(key);
    }

    emitToUser(userId, event, payload) {
        if (!this.io) return;
        const set = this.map.get(String(userId));
        if (!set) return;
        for (const sid of set) this.io.to(sid).emit(event, payload);
    }

    broadcast(event, payload) {
        if (!this.io) return;
        this.io.emit(event, payload);
    }
}

export default new SocketRegistry();
