// Pages/Dashboard/Series/AddSeries.jsx
import React, { useEffect, useMemo, useState } from 'react';
import SideBar from '../SideBar';
import { Input, Message, Select } from '../../../Components/UsedInputs';
import Uploader from '../../../Components/Uploader';
import { Imagepreview } from '../../../Components/ImagePreview';
import Titles from '../../../Components/Titles';
import { MdDelete } from 'react-icons/md';
import { FaPlus, FaListUl } from 'react-icons/fa';
import { ImUpload } from 'react-icons/im';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { InlineError } from '../../../Components/Notifications/Error';
import { LanguageData } from '../../../Data/FilterData';

import CastModal from '../../../Components/Modals/CastsModal'; 
import {
    addSeriesCastAction,
    updateSeriesCastAction,
    removeSeriesCastAction,
    resetSeriesCastAction,
    createSeriesAction,
} from '../../../Redux/Actions/seriesActions';

function AddSeries() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // ===== Cast modal state (giống Movie) =====
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCast, setEditingCast] = useState(null);

    // categories
    const { categories } = useSelector((state) => state.categoryGetAll || {});
    // create status
    const { isLoading, isError, isSuccess } = useSelector((s) => s.seriesCreate || {});
    // ✅ Lấy casts của Series (khác Movie)
    const seriesCasts = useSelector((s) => s.seriesCasts?.casts || []);

    // Form state
    const [backdropUrl, setBackdropUrl] = useState('');
    const [backdropLink, setBackdropLink] = useState('');
    const [posterUrl, setPosterUrl] = useState('');
    const [posterLink, setPosterLink] = useState('');
    const [useSeasons, setUseSeasons] = useState(false);

    // Seasons
    const [seasonName, setSeasonName] = useState('');
    const [seasonNumber, setSeasonNumber] = useState('');
    const [seasons, setSeasons] = useState([]);

    // Episodes
    const [epName, setEpName] = useState('');
    const [epNumber, setEpNumber] = useState('');
    const [epRuntime, setEpRuntime] = useState('');
    const [epVideoUrl, setEpVideoUrl] = useState('');
    const [epVideoLink, setEpVideoLink] = useState('');
    const [epSeasonId, setEpSeasonId] = useState('');
    const [episodes, setEpisodes] = useState([]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();

    const finalBackdrop = backdropLink?.trim() || backdropUrl || '';
    const finalPoster = posterLink?.trim() || posterUrl || '';

    const categoriesOptions = useMemo(() => {
        return (categories || []).map((c) => ({
            title: c?.title || c?.name || String(c),
            value: c?.title || c?.name || String(c),
        }));
    }, [categories]);

    // ===== Seasons handlers (giữ nguyên của bạn) =====
    const addSeason = () => {
        if (!seasonName?.trim()) return toast.error('Season name is required');
        const num = Number(seasonNumber);
        if (!Number.isFinite(num) || num <= 0) return toast.error('Season number must be > 0');
        if (seasons.some((s) => Number(s.seasonNumber) === num)) {
            return toast.error(`Season ${num} already exists`);
        }
        setSeasons((prev) =>
            [...prev, { _localId: crypto.randomUUID(), name: seasonName.trim(), seasonNumber: num }]
                .sort((a, b) => a.seasonNumber - b.seasonNumber)
        );
        setSeasonName('');
        setSeasonNumber('');
    };

    const removeSeason = (localId) => {
        setSeasons((prev) => prev.filter((s) => s._localId !== localId));
        setEpisodes((prev) => prev.filter((e) => e.seasonLocalId !== localId)); // remove eps in this season
    };

    // ===== Episodes handlers (giữ nguyên core) =====
    const addEpisode = () => {
        if (!epName?.trim()) return toast.error('Episode name is required');
        const num = Number(epNumber);
        if (!Number.isFinite(num) || num <= 0) return toast.error('Episode number must be > 0');
        const runtime = Number(epRuntime);
        if (!Number.isFinite(runtime) || runtime <= 0) return toast.error('Runtime must be > 0');

        const video = epVideoLink?.trim() || epVideoUrl || '';
        if (!video) return toast.error('Episode video is required (upload or paste link)');

        let seasonLocalId = undefined;
        if (useSeasons) {
            if (!epSeasonId) return toast.error('Please select a season for this episode');
            seasonLocalId = epSeasonId;
        }

        const conflict = episodes.some(
            (e) =>
                Number(e.episodeNumber) === num && (useSeasons ? e.seasonLocalId === seasonLocalId : true)
        );
        if (conflict) {
            return toast.error(
                useSeasons
                    ? `Episode ${num} already exists in the selected season`
                    : `Episode ${num} already exists`
            );
        }

        const newEp = {
            _localId: crypto.randomUUID(),
            title: epName.trim(),
            episodeNumber: num,
            runtime,
            video,
            seasonLocalId,
        };
        setEpisodes((prev) => [...prev, newEp].sort((a, b) => a.episodeNumber - b.episodeNumber));

        setEpName('');
        setEpNumber('');
        setEpRuntime('');
        setEpVideoUrl('');
        setEpVideoLink('');
    };

    const removeEpisode = (localId) => {
        setEpisodes((prev) => prev.filter((e) => e._localId !== localId));
    };

    // ===== Submit =====
    const onSubmit = (data) => {
        if (!data?.name?.trim()) return toast.error('Series title is required');
        if (!data?.category) return toast.error('Series category is required');
        if (!Number.isFinite(Number(data?.year))) return toast.error('Year must be a number');
        if (episodes.length === 0) return toast.error('At least 1 episode is required');

        const payload = {
            name: data.name.trim(),
            language: data.language?.trim() || '',
            year: Number(data.year) || new Date().getFullYear(),
            category: data.category,
            desc: data.desc || '',
            image: finalBackdrop,
            titleImage: finalPoster,
            isPremium: !!data.isPremium,
            useSeasons,
            seasons: seasons.map((s) => ({
                name: s.name,
                seasonNumber: Number(s.seasonNumber),
                _localId: s._localId,
            })),
            episodes: episodes.map((e) => ({
                title: e.title,
                episodeNumber: Number(e.episodeNumber),
                runtime: Number(e.runtime),
                video: e.video,
                seasonLocalId: e.seasonLocalId || null,
            })),
            // ❌ KHÔNG cần gửi casts ở đây vì createSeriesAction sẽ lấy từ Redux (seriesCasts)
            // casts: seriesCasts
        };

        dispatch(createSeriesAction(payload));
    };

    // ===== Effects =====
    useEffect(() => {
        if (isSuccess) {
            toast.success('Series created successfully!');
            reset({ name: '', language: '', year: '', category: '', desc: '', isPremium: false });
            setBackdropUrl(''); setBackdropLink('');
            setPosterUrl(''); setPosterLink('');
            setUseSeasons(false);
            setSeasons([]); setEpisodes([]);
            // ✅ reset casts của series sau khi tạo xong
            dispatch(resetSeriesCastAction());
            navigate('/addSeries');
            dispatch({ type: 'SERIES_CREATE_RESET' });
        }
        if (isError) {
            toast.error(typeof isError === 'string' ? isError : 'Something went wrong');
            dispatch({ type: 'SERIES_CREATE_RESET' });
        }
    }, [isSuccess, isError, reset, navigate, dispatch]);

    useEffect(() => {
        if (useSeasons && seasons.length > 0) {
            setEpSeasonId((prev) => (prev && seasons.some((s) => s._localId === prev) ? prev : seasons[0]._localId));
        } else {
            setEpSeasonId('');
        }
    }, [useSeasons, seasons]);

    const seasonOptions = useMemo(
        () => seasons.map((s) => ({ value: s._localId, title: s.name || `Season ${s.seasonNumber}` })),
        [seasons]
    );

    // ===== Handlers for CAST list (Series) =====
    const openAddCastModal = () => {
        setEditingCast(null);
        setModalOpen(true);
    };
    const openEditCastModal = (c) => {
        setEditingCast(c);
        setModalOpen(true);
    };
    const deleteCast = (idOrTempId) => {
        dispatch(removeSeriesCastAction(idOrTempId));
        toast.success("Cast deleted successfully");
    };

    return (
        <SideBar>
            <CastModal
                modalOpen={modalOpen}
                setModalOpen={setModalOpen}
                cast={editingCast}
                selectCasts={(state) => state.seriesCasts?.casts || []}
                onAdd={(payload) => addSeriesCastAction({ ...payload, tempId: crypto.randomUUID() })}
                onEdit={(payload) => updateSeriesCastAction(payload)}
            />

            <div className="flex flex-col gap-6">
                <h2 className="text-xl font-bold">Create Series</h2>

                {/* Basic info */}
                <div className="w-full grid md:grid-cols-2 gap-6">
                    <div className="w-full">
                        <Input label="Series Title" placeholder="Attack on Titan" type="text" bg name="name" register={register('name')} />
                        {errors.name && <InlineError text={errors.name.message} />}
                    </div>
                    <div className="w-full">
                        <Select
                            label="Language"
                            options={LanguageData.filter(lang => lang.title !== "Sort By Language")}
                            name="language"
                            register={{ ...register('language') }}
                            placeholder="Select Language"
                        />
                        {errors.language && <InlineError text={errors.language.message} />}
                    </div>
                </div>

                <div className="w-full grid md:grid-cols-2 gap-6">
                    <div className="w-full">
                        <Input label="Year" placeholder="2013" type="number" bg name="year" register={register('year')} />
                        {errors.year && <InlineError text={errors.year.message} />}
                    </div>
                    <div className="text-sm w-full">
                        <Select label="Category" options={categoriesOptions} name="category" register={{ ...register('category') }} />
                        {errors.category && <InlineError text={errors.category.message} />}
                    </div>
                </div>

                {/* Images */}
                <Titles title="Images" Icon={FaListUl} />
                <div className="w-full grid md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-3">
                        <p className="text-border font-semibold text-sm">Backdrop (image)</p>
                        <Uploader setImageUrl={setBackdropUrl} />
                        <Input label="Or paste Image URL" placeholder="https://..." type="text" bg name="backdropLink" value={backdropLink} onChange={(e) => setBackdropLink(e.target.value)} />
                        <Imagepreview image={finalBackdrop} name="backdrop" />
                    </div>
                    <div className="flex flex-col gap-3">
                        <p className="text-border font-semibold text-sm">Poster (titleImage)</p>
                        <Uploader setImageUrl={setPosterUrl} />
                        <Input label="Or paste Image URL" placeholder="https://..." type="text" bg name="posterLink" value={posterLink} onChange={(e) => setPosterLink(e.target.value)} />
                        <Imagepreview image={finalPoster} name="poster" />
                    </div>
                </div>

                {/* Description */}
                <div className="w-full">
                    <Message label="Series Description" placeholder="Make it short and sweet" name="desc" register={{ ...register('desc') }} />
                    {errors.desc && <InlineError text={errors.desc.message} />}
                </div>

                {/* CAST — giống Movie */}
                <Titles title="Casts" Icon={FaListUl} />
                <div className="w-full grid lg:grid-cols-2 gap-6 items-start">
                    <button
                        onClick={openAddCastModal}
                        className="w-full py-4 bg-main border border-subMain border-dashed text-white rounded"
                    >
                        Add Cast
                    </button>
                    <div className="grid 2xl:grid-cols-4 lg:grid-cols-3 sm:grid-col4 grid-cols-2 gap-4">
                        {seriesCasts?.length > 0 &&
                            seriesCasts.map((c) => (
                                <div key={c._id || c.tempId} className="p-2 italic text-xs text-text rounded flex-colo bg-main border border-border">
                                    <img
                                        src={c?.image || "/images/user.jpg"}
                                        alt={c?.name}
                                        className="w-full h-24 object-cover rounded mb-2"
                                    />
                                    <p className="truncate w-full text-center">{c?.name}</p>
                                    {c?.role ? <p className="text-[11px] text-border mt-1">{c.role}</p> : null}
                                    <div className="flex-rows mt-2 w-full gap-2">
                                        <button
                                            onClick={() => deleteCast(c._id || c.tempId)}
                                            className="w-6 h-6 flex-colo bg-dry border border-border text-subMain rounded"
                                        >
                                            <MdDelete />
                                        </button>
                                        <button
                                            onClick={() => openEditCastModal(c)}
                                            className="w-6 h-6 flex-colo bg-dry border border-border text-green-600 rounded"
                                        >
                                            ✎
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Use seasons toggle */}
                <div className="w-full">
                    <label className="flex items-center gap-3">
                        <input type="checkbox" className="w-4 h-4 accent-subMain" checked={useSeasons} onChange={(e) => setUseSeasons(e.target.checked)} />
                        <span className="text-sm text-border">Use Seasons</span>
                    </label>
                    <p className="text-xs text-border mt-1">If disabled, episodes will be added directly to the series (no season).</p>
                </div>

                {/* Seasons block */}
                {useSeasons && (
                    <>
                        <Titles title="Seasons" Icon={FaListUl} />
                        <div className="w-full grid md:grid-cols-3 gap-4">
                            <Input label="Season Name" placeholder="Season 1" type="text" bg value={seasonName} onChange={(e) => setSeasonName(e.target.value)} />
                            <Input label="Season Number" placeholder="1" type="number" bg value={seasonNumber} onChange={(e) => setSeasonNumber(e.target.value)} />
                            <button onClick={addSeason} className="bg-subMain text-white rounded flex items-center justify-center gap-2 px-4">
                                <FaPlus /> Add Season
                            </button>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                            {seasons.map((s) => (
                                <div key={s._localId} className="p-4 rounded bg-main border border-border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold">{s.name}</p>
                                            <p className="text-xs text-border">Season {s.seasonNumber}</p>
                                        </div>
                                        <button
                                            onClick={() => removeSeason(s._localId)}
                                            className="w-7 h-7 flex items-center justify-center rounded bg-dry border border-border text-red-400"
                                        >
                                            <MdDelete />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Episodes */}
                <Titles title="Episodes (required)" Icon={FaListUl} />
                <div className="w-full grid md:grid-cols-5 gap-4">
                    <Input label="Episode Name" placeholder="To You, in 2000 Years" type="text" bg value={epName} onChange={(e) => setEpName(e.target.value)} />
                    <Input label="Episode Number" placeholder="1" type="number" bg value={epNumber} onChange={(e) => setEpNumber(e.target.value)} />
                    <Input label="Runtime (min)" placeholder="24" type="number" bg value={epRuntime} onChange={(e) => setEpRuntime(e.target.value)} />
                    {useSeasons ? (
                        <div className="text-sm w-full">
                            <Select
                                label="Season"
                                options={seasons.map((s) => ({ value: s._localId, title: s.name || `Season ${s.seasonNumber}` }))}
                                name="epSeason"
                                register={{ onChange: (e) => setEpSeasonId(e.target.value) }}
                            />
                        </div>
                    ) : (
                        <div />
                    )}
                    <button onClick={addEpisode} className="bg-subMain text-white rounded flex items-center justify-center gap-2 px-4">
                        <FaPlus /> Add Episode
                    </button>
                </div>

                {/* Episode video */}
                <div className="w-full grid md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <p className="text-border font-semibold text-sm">Upload Episode Video</p>
                        <Uploader setImageUrl={setEpVideoUrl} />
                        {epVideoUrl ? (
                            <div className="w-full bg-main text-sm text-subMain py-3 border border-border rounded flex items-center justify-center">
                                Video uploaded
                            </div>
                        ) : null}
                    </div>
                    <div className="flex flex-col gap-2">
                        <Input label="Or paste Video URL" placeholder="https://..." type="text" bg value={epVideoLink} onChange={(e) => setEpVideoLink(e.target.value)} />
                        <p className="text-xs text-border">You can use either upload or URL.</p>
                    </div>
                </div>

                {/* Episode list */}
                <div className="grid lg:grid-cols-2 gap-4">
                    {episodes.map((e) => {
                        const seasonLabel = useSeasons
                            ? seasons.find((s) => s._localId === e.seasonLocalId)?.name || 'Unknown Season'
                            : '—';
                        return (
                            <div key={e._localId} className="p-4 bg-main border border-border rounded">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold">{e.title}</p>
                                        <p className="text-xs text-border">
                                            Ep {e.episodeNumber} • {e.runtime} min {useSeasons ? `• ${seasonLabel}` : ''}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => removeEpisode(e._localId)}
                                        className="w-7 h-7 flex items-center justify-center rounded bg-dry border border-border text-red-400"
                                    >
                                        <MdDelete />
                                    </button>
                                </div>
                                <p className="text-xs text-border mt-2 break-all">Video: {e.video}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Submit */}
                <button
                    disabled={isLoading}
                    onClick={handleSubmit(onSubmit)}
                    className="bg-subMain w-full flex-rows gap-6 font-medium text-white py-4 rounded"
                >
                    {isLoading ? 'Please wait...' : (<><ImUpload /> Publish Series</>)}
                </button>
            </div>
        </SideBar>
    );
}

export default AddSeries;
