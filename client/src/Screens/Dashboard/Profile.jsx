import React, { useEffect, useState } from 'react';
import SideBar from './SideBar';
import Uploder from '../../Components/Uploader';
import { Input } from "../../Components/UsedInputs";
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { ProfileValidation } from '../../Components/Validation/UserValidation';
import { InlineError } from '../../Components/Notifications/Error';
import { Imagepreview } from '../../Components/ImagePreview';
import { deleteProfileAction, updateProfileAction } from '../../Redux/Actions/userActions';
import toast from 'react-hot-toast';

function Profile() {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((s) => s.userLogin);

  // Update
  const { isLoading, isError, isSuccess } = useSelector((s) => s.userUpdateProfile);
  // Delete
  const { isLoading: deleteLoading, isError: deleteError } = useSelector((s) => s.userDeleteProfile);

  const [imageUrl, setImageUrl] = useState(userInfo?.image || "");

  // react-hook-form
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(ProfileValidation),
  });

  // Submit update
  const onSubmit = (data) => {
    dispatch(updateProfileAction({ ...data, image: imageUrl }));
  };

  // Delete profile
  const onDelete = () => {
    if (window.confirm("Are you sure you want to delete this profile?")) {
      dispatch(deleteProfileAction());
    }
  };

  // Effects
  useEffect(() => {
    if (userInfo) {
      setValue("fullName", userInfo.fullName || "");
      setValue("email", userInfo.email || "");
      setImageUrl(userInfo.image || "");
    }
  }, [userInfo, setValue]);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Profile updated successfully");
      dispatch({ type: "USER_UPDATE_PROFILE_RESET" });
    }
    if (isError || deleteError) {
      toast.error(isError || deleteError);
      dispatch({ type: "USER_UPDATE_PROFILE_RESET" });
      dispatch({ type: "USER_DELETE_PROFILE_RESET" });
    }
  }, [dispatch, isSuccess, isError, deleteError]);

  // Styles
  const cardCls = "bg-main/60 border border-border rounded-2xl";
  const sectionTitle = "text-white/90 text-sm font-semibold tracking-wide";

  return (
    <SideBar>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <h2 className="text-xl font-bold">Profile</h2>

        {/* Top grid: avatar + form */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Avatar Card */}
          <div className={`lg:col-span-4 ${cardCls} p-6 flex flex-col items-center text-center gap-5`}>
            <div className="relative">
              {/* Avatar preview */}
              <div className="w-36 h-36 rounded-full overflow-hidden ring-2 ring-border shadow">
                <Imagepreview image={imageUrl} name={userInfo?.fullName || "User"} />
              </div>

              {/* Mini badge */}
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded bg-black/60 border border-border">
                {userInfo?.fullName || "User"}
              </span>
            </div>

            {/* Uploader */}
            <div className="w-full">
              <p className={`${sectionTitle} mb-2`}>Profile Photo</p>
              <Uploder setImageUrl={setImageUrl} />
              <p className="text-[11px] text-border mt-2">
                Recommended: square image (e.g. 512×512). JPG/PNG.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className={`lg:col-span-8 ${cardCls} p-6`}>
            <div className="grid md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="w-full">
                <p className={sectionTitle}>Full name</p>
                <Input
                  placeholder="Your name"
                  type="text"
                  name="fullName"
                  register={register("fullName")}
                  bg
                />
                {errors.fullName && <InlineError text={errors.fullName.message} />}
              </div>

              {/* Email */}
              <div className="w-full">
                <p className={sectionTitle}>Email</p>
                <Input
                  placeholder="you@example.com"
                  type="email"
                  name="email"
                  register={register("email")}
                  bg
                />
                {errors.email && <InlineError text={errors.email.message} />}
              </div>
            </div>

            {/* Submit row */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 mt-6">
              {/* Danger Zone (mobile lên trên) */}
              <button
                type="button"
                onClick={onDelete}
                disabled={deleteLoading || isLoading}
                className="w-full sm:w-auto bg-[#1c1c1e] hover:bg-[#2a2a2c] border border-red-500/50 text-red-400 px-5 py-3 rounded transition"
              >
                {deleteLoading ? "Deleting..." : "Delete Account"}
              </button>

              <button
                type="submit"
                disabled={deleteLoading || isLoading}
                className="w-full sm:w-auto bg-subMain hover:opacity-90 text-white px-6 py-3 rounded border border-subMain transition"
              >
                {isLoading ? "Updating..." : "Update Profile"}
              </button>
            </div>
          </div>
        </div>

        {/* Extra: Account info small panel */}
        <div className={`${cardCls} p-5`}>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="min-w-[220px]">
              <p className="text-border mb-1">User ID</p>
              <p className="text-white/90 font-mono break-all">{userInfo?._id || "—"}</p>
            </div>
            <div className="min-w-[220px]">
              <p className="text-border mb-1">Status</p>
              <p className="text-white/90">{userInfo ? "Signed in" : "—"}</p>
            </div>
            <div className="min-w-[220px]">
              <p className="text-border mb-1">Role</p>
              <p className="text-white/90 capitalize">{userInfo?.isAdmin ? "Admin" : "User"}</p>
            </div>
          </div>
        </div>
      </form>
    </SideBar>
  );
}

export default Profile;
