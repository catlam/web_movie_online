import React from 'react';
import Titles from '../Titles';
import { FaUserFriends } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';

function MovieCasts({ movie }) {
  return (
    movie?.casts?.length > 0 && (
      <div className="my-10">
        <Titles title="Casts" Icon={FaUserFriends} />
        <div className="mt-8">
          <Swiper
            autoplay={{
              delay: 1500,
              disableOnInteraction: false,
            }}
            speed={800}
            modules={[Autoplay]}
            spaceBetween={8} 
            breakpoints={{
              0: { slidesPerView: 3.5 },
              400: { slidesPerView: 4 },
              768: { slidesPerView: 5 },
              1024: { slidesPerView: 6 },
              1280: { slidesPerView: 8 },
            }}
            className="!px-1" 
          >
            {movie?.casts?.map((cast) => (
              <SwiperSlide key={cast?._id || cast?.id}>
                <div className="flex flex-col items-center text-center text-xs text-white gap-2">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                    <img
                      src={cast?.image ? cast?.image : '/images/user.png'}
                      alt={cast?.name}
                      className="w-full h-full object-cover rounded-full border border-gray-700 shadow-md hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="truncate w-20 sm:w-24 font-medium text-border">
                    {cast?.name}
                  </p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    )
  );
}

export default MovieCasts;
