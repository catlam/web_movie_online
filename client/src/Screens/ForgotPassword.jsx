import React, { useEffect, useState } from 'react';
import Layout from "../Layout/Layout";
import { Input } from '../Components/UsedInputs';
import { Link, useNavigate } from 'react-router-dom';
import { FiLock } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import { InlineError } from '../Components/Notifications/Error';
import { toast } from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { forgotPasswordAction } from '../Redux/Actions/userActions';

// Validation schema cho Forgot Password
const ForgotPasswordValidation = yup.object().shape({
    email: yup.string().email("Invalid email").required("Email is required"),
    newPassword: yup.string().min(6, "Password must be at least 6 chars").required("New password is required"),
});

function ForgotPassword() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const { loading, success, error, message } = useSelector(
        (state) => state.userForgotPassword
    );

    // useForm hook
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(ForgotPasswordValidation),
    });

    // on submit
    const onSubmit = (data) => {
        dispatch(forgotPasswordAction(data.email, data.newPassword));
    };

    // Side effects
    useEffect(() => {
        if (success) {
            toast.success(message || "Password reset successful");
            dispatch({ type: "USER_FORGOT_PASSWORD_RESET" });
            navigate("/login");
        }
        if (error) {
            toast.error(error);
            dispatch({ type: "USER_FORGOT_PASSWORD_RESET" });
        }
    }, [success, error, message, navigate, dispatch]);

    return (
        <Layout>
            <div className="container mx-auto px-2 my-12 flex-colo">
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="w-full max-w-md md:max-w-lg xl:max-w-xl gap-5 flex-colo p-14 bg-dry rounded-lg border border-border"
                >
                    <img
                        src="/images/logo.png"
                        alt="logo"
                        className="w-full h-12 object-contain"
                    />

                    {/* Email */}
                    <div className="w-full">
                        <Input
                            label="Email"
                            placeholder="example@gmail.com"
                            type="email"
                            name="email"
                            register={register("email")}
                            bg={true}
                        />
                        {errors.email && <InlineError text={errors.email.message} />}
                    </div>

                    {/* New Password */}
                    <div className="w-full">
                        <Input
                            label="New Password"
                            type={showPassword ? "text" : "password"}
                            register={register("newPassword")}
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


                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-subMain transition hover:bg-main flex-rows gap-4 text-white p-4 rounded-lg w-full"
                    >
                        {loading ? "Processing..." : (<><FiLock /> Reset Password</>)}
                    </button>

                    <p className="text-center text-border mt-4">
                        Remembered password?{" "}
                        <Link to="/login" className="text-dryGray font-semibold ml-2">
                            Sign In
                        </Link>
                    </p>
                </form>
            </div>
        </Layout>
    );
}

export default ForgotPassword;