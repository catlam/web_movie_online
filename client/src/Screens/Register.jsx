import React, { useEffect, useState } from 'react';
import Layout from "../Layout/Layout";
import { Input } from '../Components/UsedInputs';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiLogIn } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { yupResolver } from '@hookform/resolvers/yup';
import { RegisterValidation } from '../Components/Validation/UserValidation';
import { useForm } from 'react-hook-form';
import { registerAction } from '../Redux/Actions/userActions';
import toast from 'react-hot-toast';
import { InlineError } from '../Components/Notifications/Error';

function Register() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const { isLoading, isError, userInfo } = useSelector(
        (state) => state.userRegister
    );

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(RegisterValidation)
    });

    const onSubmit = (data) => {
        dispatch(registerAction(data));
    };

    useEffect(() => {
        if (userInfo?.isAdmin) {
            navigate("/dashboard");
        } else if (userInfo) {
            toast.success(`Welcome ${userInfo.fullName}`);
            dispatch({ type: "USER_REGISTER_RESET" });
            navigate("/choose-plan"); // chuyển qua chọn gói sau khi đăng ký
        }
        if (isError) toast.error(isError);
    }, [userInfo, isError, navigate, dispatch]);

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
                        className="w-full max-w-md md:max-w-lg xl:max-w-xl gap-5 flex-colo p-8 sm:p-10 bg-dry rounded-lg border border-border shadow-lg/30"
                    >
                        <img
                            src="/images/logo.png"
                            alt="logo"
                            className="w-full h-12 object-contain"
                        />

                        <div className="w-full">
                            <Input
                                label="Full Name"
                                placeholder="Jennie Kim"
                                type="text"
                                name="fullName"
                                register={register("fullName")}
                                bg={true}
                            />
                            {errors.fullName && <InlineError text={errors.fullName.message} />}
                        </div>

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
                            {errors.password && <InlineError text={errors.password.message} />}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-subMain transition hover:bg-main flex-rows gap-4 text-white p-4 rounded-lg w-full"
                        >
                            {isLoading ? "Loading..." : (<><FiLogIn /> Sign Up</>)}
                        </button>

                        <p className="text-center text-border">
                            Already have an account?{" "}
                            <Link to="/login" className="text-dryGray font-semibold ml-2">
                                Sign In
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </Layout>
    );
}

export default Register;
