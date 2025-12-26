import React, { useEffect } from 'react'
import Titles from '../Titles';
import { BsBookmarkStarFill } from "react-icons/bs";
import { Message, Select } from '../UsedInputs';
import Rating from '../Stars';
import { Empty } from "../Notifications/empty"
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { ReviewValidation } from '../Validation/MovieValidation';
import { toast } from 'react-hot-toast'
import { InlineError } from '../Notifications/Error';
import { Link } from 'react-router-dom';
import { deleteReviewMovieAction, reviewMovieAction } from '../../Redux/Actions/MoviesActions';




const Ratings = [
  {
    title: "0 - Poor",
    value: 0,
  },
  {
    title: "1 - Fair",
    value: 1,
  },
  {
    title: "2 - Good",
    value: 2,
  },
  {
    title: "3 - Very Good",
    value: 3,
  },
  {
    title: "4 - Excellent",
    value: 4,
  },
  {
    title: "5 - Masterpiece",
    value: 5,
  }
];

function MovieRates({ movie }) {
  const dispatch = useDispatch();


  // use Selector
  const { isLoading, isError } = useSelector(
    (state) => state.createReview);
  const { userInfo } = useSelector(
    (state) => state.userLogin);

  // validation review
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(ReviewValidation)
  })

  // on submit
  const onSubmit = (data) => {
    dispatch(reviewMovieAction({
      id: movie?._id,
      review: { ...data }
    }));
  }

  const handleDeleteReview = () => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      dispatch(deleteReviewMovieAction(movie._id)); 
    }
  };

  useEffect(() => {
    if (isError) {
      toast.error(isError)
      dispatch({ type: "CREATE_REVIEW_RESET" })
    }
  }, [isError, dispatch])

  return (
    <div className="my-12">
      <Titles title="Reviews" Icon={BsBookmarkStarFill} />
      <div className="mt-10 xl:grid flex-colo grid-cols-5 gap-12 bg-dry xs:p-10 py-10 px-2 sm:p-20 rounded">
        {/* write review */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="xl:col-span-2 w-full flex flex-col gap-8 "
        >
          <h3 className="text-xl text-text font-semibold">
            Review "{movie?.name}"
          </h3>
          <p className="text-sm leading-7 font-medium text-border">
            Write a review for the movie. It will be posted on this page.
            Lorem ipsum dolor sit, amet consectetur adipisicing elit.
            Excepturi ratione obcaecati animi impedit omnis mollitia quo.
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
            {
              errors.rating && <InlineError text={errors.rating.message} />
            }
          </div>
          {/* message */}
          <div className="w-full">
            <Message
              name="comment"
              register={{ ...register("comment") }}
              label="Comment"
              placeholder="Write your review here"
            />
            {
              errors.comment && <InlineError text={errors.comment.message} />
            }
          </div>
          {/* submit */}
          {
            userInfo ? (
              <button
                disabled={isLoading}
                type="submit"
                className="bg-subMain text-white py-3 w-full flex-colo rounded"
              >
                {
                  isLoading ? "Loading..." : "Submit"
                }
              </button>
            ) : (
              <Link
                to="/login"
                className="bg-main border border-dashed border-border text-subMain py-4 w-full flex-colo rounded"
              >
                Login to review this movie
              </Link>
            )
          }

        </form>
        {/* reviews */}
        <div className="col-span-3 flex w-full flex-col gap-6">
          <h3 className="text-xl text-text font-semibold">Reviews ({movie?.numberOfReviews})</h3>
          <div className="w-full flex flex-col bg-main gap-6 rounded-lg md:p-12 p-6 h-header overflow-y-scroll">
            {movie?.reviews?.length > 0 ? (
              movie?.reviews?.map((review) => (
                <div key={review?._id} className="w-full bg-dry p-6 border border-gray-800 rounded-lg relative">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-main rounded-full overflow-hidden">
                      <img
                        src={review?.userImage ? review.userImage : "/images/user.png"}
                        alt={review?.userName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold">{review?.userName}</h2>
                      <div className="flex mt-2 gap-2 text-star text-sm">
                        <Rating value={review?.rating} />
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-text mt-4">{review?.comment}</p>

                  {/* Delete button */}
                  {userInfo && review?.userId.toString() === userInfo._id.toString() && (
                    <button
                      onClick={() => handleDeleteReview(review._id)}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))
            ) : (
              <Empty message={`Be first to rate "${movie?.name}"`} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MovieRates