import React from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
    const navigate = useNavigate();
    const [email, setEmail] = React.useState("");

    const handleStart = () => {
        if (!email) return alert("Vui lòng nhập email!");
        localStorage.setItem("signup_email", email);
        navigate("/choose-plan");
    };

    return (
        <div className="relative h-screen bg-black text-white">
            <img
                src="/images/netflix-bg.jpg"
                alt="background"
                className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/80"></div>

            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
                <h1 className="text-5xl font-bold max-w-3xl">
                    Phim, series không giới hạn và nhiều nội dung khác
                </h1>
                <p className="mt-4 text-xl">Giá từ 74.000đ. Hủy bất kỳ lúc nào.</p>
                <p className="mt-2">
                    Nhập email để tạo hoặc kích hoạt lại tư cách thành viên.
                </p>
                <div className="mt-6 flex w-full max-w-md">
                    <input
                        type="email"
                        className="flex-1 p-3 rounded-l bg-white text-black outline-none"
                        placeholder="Địa chỉ email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <button
                        onClick={handleStart}
                        className="bg-red-600 px-6 text-lg font-semibold rounded-r hover:bg-red-700"
                    >
                        Bắt đầu
                    </button>
                </div>
            </div>
        </div>
    );
}
