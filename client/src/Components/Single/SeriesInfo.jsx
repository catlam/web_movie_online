import React from 'react';
import FlexMovieItems from '../FlexMovieItems';
import { FaPlay, FaShareAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Rating from '../Stars';

function SeriesInfo({ series = {}, setModalOpen }) {
    const backdrop = series?.titleImage || '/images/user.png'; // giống MovieInfo
    const poster = series?.image || '/images/user.png';

    return (
        <div className="w-full xl:h-screen relative text-white">
            {/* Backdrop */}
            <img
                src={backdrop}
                alt={series?.name || 'Backdrop'}
                className="w-full hidden xl:inline-block h-full object-cover"
                loading="lazy"
                decoding="async"
            />

            {/* Overlay + content */}
            <div className="xl:bg-main bg-dry flex-colo xl:bg-opacity-90 xl:absolute top-0 left-0 right-0 bottom-0">
                <div className="container px-3 mx-auto 2xl:px-32 xl:grid grid-cols-3 flex-colo py-10 lg:py-20 gap-8">

                    {/* Poster (giữ bố cục MovieInfo) */}
                    <div className="xl:col-span-1 w-full xl:order-none order-last h-header rounded-lg overflow-hidden">
                        <img
                            src={poster}
                            alt={series?.name || 'Poster'}
                            className="w-full h-100 object-cover"
                            loading="lazy"
                            decoding="async"
                        />
                    </div>

                    {/* Text + actions */}
                    <div className="col-span-2 md:grid grid-cols-5 gap-4 items-center">
                        <div className="col-span-3 flex flex-col gap-6">

                            {/* Title — style từ bản SeriesInfo đẹp */}
                            <h1 className="text-white text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight line-clamp-2 drop-shadow capitalize">
                                {series?.name || 'Untitled Series'}
                            </h1>

                            {/* Meta badges — năm / thể loại / ngôn ngữ / rate */}
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                                {series?.year ? (
                                    <span className="inline-flex items-center rounded-lg bg-white/5 px-2 py-1 text-neutral-200 ring-1 ring-white/10">
                                        {series.year}
                                    </span>
                                ) : null}
                                {series?.category ? (
                                    <span className="inline-flex items-center rounded-lg bg-white/5 px-2 py-1 text-neutral-200 ring-1 ring-white/10">
                                        {series.category}
                                    </span>
                                ) : null}
                                {series?.language ? (
                                    <span className="inline-flex items-center rounded-lg bg-white/5 px-2 py-1 text-neutral-200 ring-1 ring-white/10">
                                        {series.language}
                                    </span>
                                ) : null}
                                {typeof series?.rate === 'number' ? (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-yellow-500/15 px-2 py-1 text-yellow-300 ring-1 ring-yellow-400/20">
                                        <span>⭐</span>
                                        {series.rate.toFixed(1)}
                                    </span>
                                ) : null}
                            </div>

                            {/* Info phụ (giữ như MovieInfo) */}
                            <div className="flex items-center gap-4 font-medium text-dryGray">
                                <div className="flex-colo bg-subMain text-xs px-2 py-1">HD 4K</div>
                                <FlexMovieItems movie={series} />
                            </div>

                            {/* Mô tả */}
                            {series?.desc ? (
                                <p className="text-text text-sm leading-7">{series.desc}</p>
                            ) : null}

                            {/* Share / Language / Watch — Y HỆT MovieInfo */}
                            <div className="grid sm:grid-cols-5 grid-cols-3 gap-4 p-6 bg-main border border-gray-800 rounded-lg">
                                {/* share */}
                                <div className="col-span-1 flex-colo border-r border-border">
                                    <button
                                        onClick={() => setModalOpen?.(true)}
                                        className="w-10 h-10 flex-colo rounded-lg bg-white bg-opacity-20"
                                        aria-label="Share"
                                        title="Share"
                                    >
                                        <FaShareAlt />
                                    </button>
                                </div>
                                {/* language */}
                                <div className="col-span-2 flex-colo font-medium text-sm">
                                    <p>
                                        Language:{' '}
                                        <span className="ml-2 truncate">{series?.language || 'N/A'}</span>
                                    </p>
                                </div>
                                {/* watch button (route giống MovieInfo) */}
                                <div className="sm:col-span-2 col-span-3 flex justify-end font-medium text-sm">
                                    <Link
                                        to={`/watch/${series?._id}`}
                                        className="bg-dry py-4 hover:bg-subMain transitions border-2 border-subMain rounded-full flex-rows gap-4 w-full sm:py-3"
                                    >
                                        <FaPlay className="w-3 h-3" /> Watch
                                    </Link>
                                </div>
                            </div>

                            {/* Stars rating */}
                            <div className="flex mb-6 text-lg gap-2 text-star">
                                <Rating value={series?.rate} />
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default SeriesInfo;
