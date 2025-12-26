import React, { useEffect, useState } from 'react';
import Layout from "../Layout/Layout";
import { Input } from '../Components/UsedInputs';
import { Link, useNavigate } from 'react-router-dom';
import { FiLogIn, FiEye, FiEyeOff } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { LoginValidation } from '../Components/Validation/UserValidation';
import { yupResolver } from '@hookform/resolvers/yup';
import { InlineError } from '../Components/Notifications/Error';
import { loginAction } from '../Redux/Actions/userActions';
import { toast } from 'react-hot-toast';

function Login() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const { isLoading, isError, userInfo, isSuccess } = useSelector(
        (state) => state.userLogin
    );

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(LoginValidation)
    });

    const onSubmit = (data) => {
        dispatch(loginAction(data));
    };

    useEffect(() => {
        if (userInfo?.isAdmin) {
            navigate("/dashboard");
        } else if (userInfo) {
            navigate("/profile"); // (giữ nguyên flow hiện tại của bạn)
        }
        if (isSuccess) {
            toast.success(`Welcome back ${userInfo.fullName}`);
        }
        if (isError) {
            toast.error(isError);
            dispatch({ type: "USER_LOGIN_RESET" });
        }
    }, [userInfo, isSuccess, isError, navigate, dispatch]);

    return (
        <Layout>
            {/* Wrapper có nền mờ */}
            <div className="relative min-h-[calc(100vh-0px)] bg-dry">
                {/* Background mờ + overlay tối */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/head.jpg"
                        alt="background"
                        className="w-full h-full object-cover opacity-50 blur-sm"
                    />
                    <div className="absolute inset-0 bg-black/60" />
                </div>

                {/* Nội dung (form) nổi lên trên */}
                <div className="relative z-10 container mx-auto px-2 py-12 flex-colo">
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="w-full max-w-md md:max-w-lg xl:max-w-xl gap-5 flex-colo p-14 bg-dry rounded-lg border border-border shadow-lg/30"
                    >
                        <img
                            src="/images/logo.png"
                            alt="logo"
                            className="w-full h-12 object-contain"
                        />

                        <div className="w-full">
                            <Input
                                label="Email"
                                placeholder="cineva@gmail.com"
                                type="email"
                                name="email"
                                register={register("email")}
                                bg={true}
                            />
                            {errors.email && <InlineError text={errors.email.message} />}
                        </div>

                        <div className="w-full">
                            <Input
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                register={register("password")}
                                placeholder="*******"
                                bg={true}
                                right={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((s) => !s)}
                                        className="text-gray-400"
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                    </button>
                                }
                            />

                            <p className="text-border text-right mt-2">
                                <Link to="/forgotPassword" className="text-sm text-dryGray font-normal">
                                    Do not remember password?
                                </Link>
                            </p>

                            {errors.password && <InlineError text={errors.password.message} />}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-subMain transition hover:bg-main flex-rows gap-4 text-white p-4 rounded-lg w-full"
                        >
                            {isLoading ? "Loading..." : (<><FiLogIn /> Sign In</>)}
                        </button>

                        <p className="text-center text-border">
                            Don't have an account?{" "}
                            <Link to="/register" className="text-dryGray font-semibold ml-2">
                                Sign Up
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </Layout>
    );
}

export default Login;
