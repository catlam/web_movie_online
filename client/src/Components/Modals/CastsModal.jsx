import React, { useEffect, useState } from 'react';
import MainModal from './MainModal';
import { Input } from '../UsedInputs';
import Uploder from '../Uploader';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { addCastAction as movieAddCast, updateCastAction as movieUpdateCast } from '../../Redux/Actions/MoviesActions';
import toast from 'react-hot-toast';
import { ImagepreviewCast } from '../ImagePreviewCast';
import { InlineError } from '../Notifications/Error';

function CastModal({
    modalOpen,
    setModalOpen,
    cast,
    onAdd,
    onEdit,
    showRole = false,
}) {
    const dispatch = useDispatch();
    const [castImage, setCastImage] = useState('');        // từ upload
    const [castImageUrl, setCastImageUrl] = useState('');  // từ input URL
    const generatedId = Math.floor(Math.random() * 100000000);

    // Tính ảnh cuối cùng: URL > Upload > Old image
    const finalImage = castImageUrl?.trim() || castImage?.trim() || cast?.image || '';

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(
            yup.object().shape({
                name: yup.string().required('Cast Name is required'),
                ...(showRole ? { role: yup.string().max(100, 'Max 100 chars') } : {}),
            })
        ),
    });

    // Submit
    const onSubmit = (data) => {
        const basePayload = {
            name: (data?.name || '').trim(),
            image: finalImage,
            ...(showRole && data?.role ? { role: String(data.role).trim() } : {}),
        };

        if (cast) {
            // EDIT
            if (onEdit) {
                dispatch(onEdit({ ...cast, ...basePayload }));
            } else {
                dispatch(movieUpdateCast({ ...basePayload, id: cast.id }));
            }
            toast.success('Cast updated successfully');
        } else {
            // CREATE
            if (onAdd) {
                dispatch(onAdd({ ...basePayload }));
            } else {
                dispatch(movieAddCast({ ...basePayload, id: generatedId }));
            }
            toast.success('Cast created successfully');
        }

        // Reset
        reset();
        setCastImage('');
        setCastImageUrl('');
        setModalOpen(false);
    };

    // Load dữ liệu khi mở modal (edit)
    useEffect(() => {
        if (cast) {
            setValue('name', cast?.name || '');
            if (showRole) setValue('role', cast?.role || '');
            setCastImage(cast?.image || '');
            setCastImageUrl(''); // ưu tiên upload cũ
        } else {
            reset();
            setCastImage('');
            setCastImageUrl('');
        }
    }, [cast, setValue, reset, showRole]);

    return (
        <MainModal modalOpen={modalOpen} setModalOpen={setModalOpen}>
            <div className="inline-block border border-border w-full align-middle p-10 overflow-y-auto h-auto bg-main text-white rounded-2xl text-center">
                <h2 className="text-3xl font-bold">{cast ? 'Update Cast' : 'Create Cast'}</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 text-left mt-6">
                    {/* Name */}
                    <div className="w-full">
                        <Input
                            label="Cast name"
                            placeholder="John Doe"
                            type="text"
                            name="name"
                            register={register('name')}
                            bg
                        />
                        {errors.name && <InlineError text={errors.name.message} />}
                    </div>

                    {/* Role (nếu bật) */}
                    {showRole && (
                        <div className="w-full">
                            <Input
                                label="Role (optional)"
                                placeholder="Main Actor"
                                type="text"
                                name="role"
                                register={register('role')}
                                bg
                            />
                            {errors.role && <InlineError text={errors.role.message} />}
                        </div>
                    )}

                    {/* IMAGE UPLOAD + URL */}
                    <div className="flex flex-col gap-3">
                        <p className="text-border font-semibold text-sm">Cast Image</p>

                        <Uploder setImageUrl={setCastImage} />

                        <Input
                            label="Or paste Image URL"
                            placeholder="https://example.com/actor.jpg"
                            type="text"
                            bg
                            value={castImageUrl}
                            onChange={(e) => setCastImageUrl(e.target.value)}
                        />

                        <ImagepreviewCast
                            image={finalImage || '/images/user.png'}
                            name="castImage"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="w-full flex-rows gap-4 py-3 hover:bg-dry text-lg bg-subMain rounded transition border-2 border-subMain text-white"
                    >
                        {cast ? 'Update' : 'Add'}
                    </button>
                </form>
            </div>
        </MainModal>
    );
}

export default CastModal;