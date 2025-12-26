import React, { useEffect } from 'react';
import Titles from '../Titles';
import { BsBookmarkStarFill } from "react-icons/bs";
import { Message, Select } from '../UsedInputs';
import Rating from '../Stars';
import { Empty } from "../Notifications/empty";
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { ReviewValidation } from '../Validation/MovieValidation';
import { toast } from 'react-hot-toast';
import { InlineError } from '../Notifications/Error';
import { Link } from 'react-router-dom';

import { reviewSeriesAction, deleteReviewSeriesAction } from '../../Redux/Actions/seriesActions';

const Ratings = [
    { title: "0 - Poor", value: 0 },
    { title: "1 - Fair", value: 1 },
    { title: "2 - Good", value: 2 },
    { title: "3 - Very Good", value: 3 },
    { title: "4 - Excellent", value: 4 },
    { title: "5 - Masterpiece", value: 5 },
];

function SeriesRates({ series }) {
    const dispatch = useDispatch();

    const { isLoading, isError } = useSelector((state) => state.createReview);
    const { userInfo } = useSelector((state) => state.userLogin);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({ resolver: yupResolver(ReviewValidation) });

    const onSubmit = (data) => {
        dispatch(
            reviewSeriesAction({
                id: series?._id,
                review: { ...data },
            })
        );
    };

    const handleDeleteReview = () => {
        if (window.confirm("Are you sure you want to delete this review?")) {
            // Backend xoá theo user hiện tại, không cần reviewId
            dispatch(deleteReviewSeriesAction(series?._id));
        }
    };

    useEffect(() => {
        if (isError) {
            toast.error(isError);
            dispatch({ type: "CREATE_REVIEW_RESET" });
        }
    }, [isError, dispatch]);

    return (
        <div className="my-12">
            <Titles title="Reviews" Icon={BsBookmarkStarFill} />
            <div className="mt-10 xl:grid flex-colo grid-cols-5 gap-12 bg-dry xs:p-10 py-10 px-2 sm:p-20 rounded">
                {/* write review */}
                <form onSubmit={handleSubmit(onSubmit)} className="xl:col-span-2 w-full flex flex-col gap-8">
                    <h3 className="text-xl text-text font-semibold">
                        Review "{series?.name}"
                    </h3>

                    <p className="text-sm leading-7 font-medium text-border">
                        Write a review for the series. It will be posted on this page.
                    </p>

                    <div className="text-sm w-full">
                        <Select
                            label="Select Rating"
                            options={Ratings}
                            name="rating"
                            register={{ ...register("rating") }}
                        />
                        <div className="flex mt-4 text-lg gap-2 text-star">
                            <Rating value={watch("rating", false)} />
                        </div>
                        {errors.rating && <InlineError text={errors.rating.message} />}
                    </div>

                    {/* message */}
                    <div className="w-full">
                        <Message
                            name="comment"
                            register={{ ...register("comment") }}
                            label="Comment"
                            placeholder="Write your review here"
                        />
                        {errors.comment && <InlineError text={errors.comment.message} />}
                    </div>

                    {/* submit */}
                    {userInfo ? (
                        <button
                            disabled={isLoading}
                            type="submit"
                            className="bg-subMain text-white py-3 w-full flex-colo rounded"
                        >
                            {isLoading ? "Loading..." : "Submit"}
                        </button>
                    ) : (
                        <Link
                            to="/login"
                            className="bg-main border border-dashed border-border text-subMain py-4 w-full flex-colo rounded"
                        >
                            Login to review this series
                        </Link>
                    )}
                </form>

                {/* reviews list */}
                <div className="col-span-3 flex w-full flex-col gap-6">
                    <h3 className="text-xl text-text font-semibold">
                        Reviews ({series?.numberOfReviews || 0})
                    </h3>

                    <div className="w-full flex flex-col bg-main gap-6 rounded-lg md:p-12 p-6 h-header overflow-y-scroll">
                        {series?.reviews?.length > 0 ? (
                            series.reviews.map((review) => {
                                const isMine =
                                    userInfo &&
                                    String(review?.userId) === String(userInfo?._id);

                                return (
                                    <div
                                        key={review?._id || `${review?.userId}-${review?.createdAt}`}
                                        className="w-full bg-dry p-6 border border-gray-800 rounded-lg relative"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-main rounded-full overflow-hidden">
                                                <img
                                                    src={review?.userImage || "/images/user.png"}
                                                    alt={review?.userName}
                                                    className="h-full w-full object-cover"
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            </div>
                                            <div>
                                                <h2 className="text-sm font-semibold">
                                                    {review?.userName || "User"}
                                                </h2>
                                                <div className="flex mt-2 gap-2 text-star text-sm">
                                                    <Rating value={review?.rating} />
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-sm text-text mt-4">{review?.comment}</p>

                                        {isMine && (
                                            <button
                                                onClick={handleDeleteReview}
                                                className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <Empty message={`Be first to rate "${series?.name}"`} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SeriesRates;
