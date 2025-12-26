import React from 'react';
import MainModal from './MainModal';
import { FaFacebook, FaPinterest } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { FacebookShareButton, TwitterShareButton, TelegramShareButton, EmailShareButton, PinterestShareButton } from 'react-share';
import { FaTelegram, FaXTwitter } from 'react-icons/fa6';

function ShareMovieModal({ modalOpen, setModalOpen, movie }) {
    const shareData = [
        {
            icon:FaFacebook,
            shareButton: FacebookShareButton
        },
        {
            icon: FaXTwitter,
            shareButton: TwitterShareButton
        },
        {
            icon: FaTelegram,
            shareButton: TelegramShareButton
        },
        {
            icon: FaPinterest,
            shareButton: PinterestShareButton
        },
        {
            icon: MdEmail,
            shareButton: EmailShareButton,
        },
    ]

    const url = `${window.location.protocol}//${window.location.host}/movie/${movie?._id}`
    return (
        <MainModal modalOpen={modalOpen} setModalOpen={setModalOpen}>
            <div className="inline-block border border-border w-full align-middle p-10 overflow-y-auto h-full bg-main text-white rounded-2xl text-center">
                <h2 className="text-2xl ">Share <span className="text-xl font-bold">"{movie?.name}"</span></h2>
                <form className="flex-rows flex-wrap gap-6 mt-6">
                    {
                        shareData.map((data, index) => (
                            <data.shareButton key={index} url={url} quote="Cineva | Free Movies Site">
                                <div className="w-12 transition hover:bg-subMain flex-colo text-lg h-12 bg-white rounded bg-opacity-30">
                                    <data.icon/>
                                </div>
                            </data.shareButton>
                        ))
                    }
                </form>
            </div>
        </MainModal>
    );
}

export default ShareMovieModal;
