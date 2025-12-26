// import axios from 'axios';

// const Axios = axios.create({
//     baseURL: 'http://localhost:5000/api',
// })

// export default Axios;

import axios from 'axios';

const Axios = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' },
});

// Tự gắn Bearer token nếu có
Axios.interceptors.request.use((config) => {
    // Bạn lưu user sau login vào localStorage dạng { ..., token }
    const raw = localStorage.getItem('userInfo') || localStorage.getItem('token');
    let token = null;
    try {
        token = raw && raw.startsWith('{') ? JSON.parse(raw).token : raw;
    } catch (e) { /* ignore */ }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        delete config.headers.Authorization; // tránh "Bearer undefined"
    }
    return config;
});

export default Axios;
