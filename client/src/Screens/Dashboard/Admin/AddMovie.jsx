import React, { useEffect, useState } from 'react';
import { Input, Message, Select } from '../../../Components/UsedInputs';
import SideBar from '../SideBar';
import Uploader from '../../../Components/Uploader';
import { MdDelete } from 'react-icons/md';
import { FaEdit } from 'react-icons/fa';
import { ImUpload } from 'react-icons/im';
import CastModal from '../../../Components/Modals/CastsModal';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { movieValidation } from '../../../Components/Validation/MovieValidation';
import { createMovieAction, removeCastAction } from '../../../Redux/Actions/MoviesActions';
import toast from 'react-hot-toast';
import { InlineError } from '../../../Components/Notifications/Error';
import { Imagepreview } from '../../../Components/ImagePreview';
import { LanguageData } from '../../../Data/FilterData';
import Uploder from '../../../Components/Uploader';

function AddMovie() {
    const [modalOpen, setModalOpen] = useState(false);
    const [cast, setCast] = useState(null);

    // Image states
    const [imageWithoutTitle, setImageWithoutTitle] = useState("");
    const [imageWithoutTitleUrl, setImageWithoutTitleUrl] = useState("");
    const [imageTitle, setImageTitle] = useState("");
    const [imageTitleUrl, setImageTitleUrl] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [videoLink, setVideoLink] = useState("");

    const finalVideo = videoLink?.trim() || videoUrl;

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { categories } = useSelector((state) => state.categoryGetAll);
    const { isLoading, isError, isSuccess } = useSelector((state) => state.createMovie);
    const { casts } = useSelector((state) => state.casts);



    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(movieValidation),
        defaultValues: {
            language: "", // ← quan trọng cho placeholder
        },
    });

    // Final image URLs (URL ưu tiên hơn upload)
    const finalImageWithoutTitle = imageWithoutTitleUrl?.trim() || imageWithoutTitle;
    const finalImageTitle = imageTitleUrl?.trim() || imageTitle;

    const onSubmit = (data) => {
        dispatch(createMovieAction({
            ...data,
            image: finalImageWithoutTitle,
            titleImage: finalImageTitle,
            video: finalVideo,
            casts,
        }));
    };

    const deleteCastHandler = (id) => {
        dispatch(removeCastAction(id));
        toast.success("Cast deleted successfully");
    };

    useEffect(() => {
        if (modalOpen === false) setCast(null);
        if (isSuccess) {
            reset({
                name: "", time: 0, language: "", year: 0, category: "", desc: "",
            });
            setImageWithoutTitle(""); setImageWithoutTitleUrl("");
            setImageTitle(""); setImageTitleUrl("");
            setVideoUrl("");
            dispatch({ type: "CREATE_MOVIE_RESET" });
            navigate("/addMovie");
        }
        if (isError) {
            toast.error("Something went wrong");
            dispatch({ type: "CREATE_MOVIE_RESET" });
        }
    }, [modalOpen, isSuccess, isError, dispatch, reset, navigate]);

    return (
        <SideBar>
            <CastModal modalOpen={modalOpen} setModalOpen={setModalOpen} cast={cast} />
            <div className="flex flex-col gap-6">
                <h2 className="text-xl font-bold">Create Movie</h2>

                {/* Basic Info */}
                <div className="w-full grid md:grid-cols-2 gap-6">
                    <div className="w-full">
                        <Input label="Movie Title" placeholder="Harry Potter" type="text" bg name="name" register={register("name")} />
                        {errors.name && <InlineError text={errors.name.message} />}
                    </div>
                    <div className="w-full">
                        <Input label="Hours" placeholder="2" type="number" bg name="time" register={register("time")} />
                        {errors.time && <InlineError text={errors.time.message} />}
                    </div>
                </div>

                <div className="w-full grid md:grid-cols-2 gap-6">
                    <div className="text-sm w-full">
                        <Select
                            label="Language"
                            options={LanguageData.filter(lang => lang.title !== "Sort By Language")}
                            name="language"
                            placeholder="Select Language"
                            register={{ ...register("language") }}
                        />
                        {errors.language && <InlineError text={errors.language.message} />}
                    </div>
                    <div className="w-full">
                        <Input label="Year of Release" placeholder="2022" type="number" bg name="year" register={register("year")} />
                        {errors.year && <InlineError text={errors.year.message} />}
                    </div>
                </div>

                {/* IMAGES - ĐÃ SỬA */}
                <div className="w-full grid md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-3">
                        <p className="text-border font-semibold text-sm">Image without title</p>
                        <Uploader setImageUrl={setImageWithoutTitle} />
                        <Input
                            label="Or paste Image URL"
                            placeholder="https://..."
                            type="text"
                            bg
                            value={imageWithoutTitleUrl}
                            onChange={(e) => setImageWithoutTitleUrl(e.target.value)}
                        />
                        <Imagepreview image={finalImageWithoutTitle} name="Image without title" />
                    </div>

                    <div className="flex flex-col gap-3">
                        <p className="text-border font-semibold text-sm">Image with title</p>
                        <Uploader setImageUrl={setImageTitle} />
                        <Input
                            label="Or paste Image URL"
                            placeholder="https://..."
                            type="text"
                            bg
                            value={imageTitleUrl}
                            onChange={(e) => setImageTitleUrl(e.target.value)}
                        />
                        <Imagepreview image={finalImageTitle} name="Image with title" />
                    </div>
                </div>

                {/* Description */}
                <div className="w-full">
                    <Message label="Movie Description" placeholder="Make it short and sweet" name="desc" register={register("desc")} />
                    {errors.desc && <InlineError text={errors.desc.message} />}
                </div>

                {/* Category */}
                <div className="text-sm w-full">
                    <Select
                        label="Movie Category"
                        options={categories?.length > 0 ? categories : []}
                        name="category"
                        register={register("category")}
                    />
                    {errors.category && <InlineError text={errors.category.message} />}
                </div>

                {/* VIDEO */}
                <div className="flex flex-col gap-2 w-full">
                    <label className="text-border font-semibold text-sm">Movie Video</label>
                    <div className={`w-full grid ${finalVideo && "md:grid-cols-2"} gap-6`}>
                        {finalVideo && (
                            <div className="w-full bg-main text-sm text-subMain py-4 border border-border rounded flex-colo">
                                Video Uploaded!
                            </div>
                        )}
                        <div className="flex flex-col gap-3">
                            <Uploader setImageUrl={setVideoUrl} />
                            <Input
                                label="Or paste Video URL"
                                placeholder="https://..."
                                type="text"
                                bg
                                value={videoLink}
                                onChange={(e) => setVideoLink(e.target.value)}
                            />
                            <p className="text-xs text-border">You can use either upload or URL.</p>
                        </div>
                    </div>
                </div>

                {/* Casts */}
                <div className="w-full grid lg:grid-cols-2 gap-6 items-start">
                    <button onClick={() => setModalOpen(true)} className="w-full py-4 bg-main border border-subMain border-dashed text-white rounded">
                        Add Cast
                    </button>
                    <div className="grid 2xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-4 grid-cols-2 gap-4">
                        {casts?.length > 0 && casts?.map((user) => (
                            <div key={user.id} className="p-2 italic text-xs text-text rounded flex-colo bg-main border border-border">
                                <img src={user?.image ? user.image : "/images/user.jpg"} alt={user.name} className="w-full h-24 object-cover rounded mb-2" />
                                <p>{user.name}</p>
                                <div className="flex-rows mt-2 w-full gap-2">
                                    <button onClick={() => deleteCastHandler(user?.id)} className="w-6 h-6 flex-colo bg-dry border border-border text-subMain rounded">
                                        <MdDelete />
                                    </button>
                                    <button onClick={() => { setCast(user); setModalOpen(true); }} className="w-6 h-6 flex-colo bg-dry border border-border text-green-600 rounded">
                                        <FaEdit />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submit */}
                <button
                    disabled={isLoading}
                    onClick={handleSubmit(onSubmit)}
                    className="bg-subMain w-full flex-rows gap-6 font-medium text-white py-4 rounded"
                >
                    {isLoading ? "Please wait..." : <><ImUpload /> Publish Movie</>}
                </button>
            </div>
        </SideBar>
    );
}

export default AddMovie;