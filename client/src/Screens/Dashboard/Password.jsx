import React, { useEffect, useState } from 'react';
import SideBar from './SideBar'
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { PasswordValidation } from '../../Components/Validation/UserValidation';
import { InlineError } from '../../Components/Notifications/Error';
import { changePasswordAction } from '../../Redux/Actions/userActions';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';

function Password() {
    const dispatch = useDispatch();
    const { isLoading, isError, message, isSuccess } = useSelector(
        (state) => state.userchangepassword
    );

    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(PasswordValidation),
    });

    const onSubmit = (data) => {
        dispatch(changePasswordAction(data))
    };

    useEffect(() => {
        if (isSuccess) {
            dispatch({ type: "USER_CHANGE_PASSWORD_RESET" })
        }
        if (isError) {
            toast.error(isError);
            dispatch({ type: "USER_CHANGE_PASSWORD_RESET" })
        }
        if (message) {
            toast.success(message);
            reset();
        }
    }, [isSuccess, isError, message, dispatch, reset]);

    // Hàm render input password với toggle
    const renderPasswordInput = (label, name, showState, setShowState, placeholder = "******") => (
        <div className="w-full">
            <label className="block text-sm font-medium mb-1">{label}</label>
            <div className="relative">
                <input
                    type={showState ? "text" : "password"}
                    {...register(name)}
                    placeholder={placeholder}
                    className="w-full mt-2 p-4 pr-10 border border-border rounded-lg bg-main text-sm flex items-center"
                />
                <div
                    className="absolute right-3 inset-y-0 flex items-center cursor-pointer text-gray-400"
                    onClick={() => setShowState(!showState)}
                >
                    {showState ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </div>
            </div>
            {errors[name] && <InlineError text={errors[name].message} />}
        </div>
    );

    return (
        <SideBar>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                <h2 className="text-xl font-bold">Change Password</h2>

                {renderPasswordInput("Previous Password", "oldPassword", showOld, setShowOld)}
                {renderPasswordInput("New Password", "newPassword", showNew, setShowNew)}
                {renderPasswordInput("Confirm Password", "confirmPassword", showConfirm, setShowConfirm)}

                <div className="flex justify-end items-center my-4">
                    <button
                        disabled={isLoading}
                        type="submit"
                        className="bg-main font-medium transition hover:bg-subMain border border-subMain text-white py-3 px-6 rounded w-full sm:w-auto"
                    >
                        {isLoading ? "Changing..." : "Change Password"}
                    </button>
                </div>
            </form>
        </SideBar>
    )
}

export default Password;
