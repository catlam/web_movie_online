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
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { InlineError } from '../../../Components/Notifications/Error';
import Loader from '../../../Components/Notifications/Loader';

import {
    getSeriesDetailsAction,
    updateSeriesAction,
} from '../../../Redux/Actions/seriesActions';
import {
    updateEpisodeAction,
    createEpisodeUnderSeasonAction,
} from '../../../Redux/Actions/episodeActions';


function EditSeries() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();

    // categories
    const { categories } = useSelector((state) => state.categoryGetAll || {});

    // ✅ Đúng slice & field theo reducer hay dùng: { loading, error, series }
    const {
        loading: seriesLoading,
        error: seriesError,
        series = {},
    } = useSelector((s) => s.seriesDetails || {});

    // update status
    const {
        isLoading: editLoading = false,
        isSuccess: editSuccess = false,
        isError: editError = null,
    } = useSelector((s) => s.updateSeries || {});

    // Local states
    const [backdropUrl, setBackdropUrl] = useState('');
    const [backdropLink, setBackdropLink] = useState('');
    const [posterUrl, setPosterUrl] = useState('');
    const [posterLink, setPosterLink] = useState('');
    const [useSeasons, setUseSeasons] = useState(false);

    const [seasonName, setSeasonName] = useState('');
    const [seasonNumber, setSeasonNumber] = useState('');
    const [seasons, setSeasons] = useState([]);

    const [epName, setEpName] = useState('');
    const [epNumber, setEpNumber] = useState('');
    const [epRuntime, setEpRuntime] = useState('');
    const [epVideoUrl, setEpVideoUrl] = useState('');
    const [epVideoLink, setEpVideoLink] = useState('');
    const [epSeasonId, setEpSeasonId] = useState('');
    const [episodes, setEpisodes] = useState([]);

    // Search, filter, pagination
    const [searchText, setSearchText] = useState("");
    const [filterSeasonLocalId, setFilterSeasonLocalId] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // Modal edit/create
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editing, setEditing] = useState(null);

    const closeEditModal = () => { setShowEditModal(false); setEditing(null); };
    const openEditModal = (ep) => { setEditing(ep); setShowEditModal(true); };

    const saveEditingEpisode = () => {
        if (!editing) return;
        setEpisodes(prev =>
            prev.map(e => e._localId === editing._localId ? editing : e)
        );
        setShowEditModal(false);
        setEditing(null);
    };


    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();

    // final images
    const finalBackdrop = backdropLink?.trim() || backdropUrl || '';
    const finalPoster = posterLink?.trim() || posterUrl || '';

    // options
    const categoriesOptions = useMemo(() => {
        return (categories || []).map((c) => ({
            title: c?.title || c?.name || String(c),
            value: c?.title || c?.name || String(c),
        }));
    }, [categories]);

    // fetch series
    useEffect(() => {
        if (id) dispatch(getSeriesDetailsAction(id));
    }, [dispatch, id]);

    // khi series về -> nạp form & local states
    useEffect(() => {
        if (!series || !series._id) return;

        // fill form
        reset({
            name: series.name || '',
            language: series.language || '',
            year: series.year || '',
            category: series.category || '',
            desc: series.desc || '',
            // ❌ bỏ tags: KHÔNG set vào form, KHÔNG hiển thị
        });

        // images
        setBackdropUrl(series.image || '');
        setBackdropLink('');
        setPosterUrl(series.titleImage || '');
        setPosterLink('');

        // seasons toggle
        setUseSeasons(!!series.useSeasons);

        // map seasons -> _localId
        const localSeasons = Array.isArray(series.seasons)
            ? series.seasons.map((s) => ({
                _localId: crypto.randomUUID(),
                name: s.name,
                seasonNumber: s.seasonNumber,
                _serverId: s._id,
            }))
            : [];
        setSeasons(localSeasons);

        // episodes (nếu backend trả trong series)
        const localEpisodes = Array.isArray(series.episodes)
            ? series.episodes.map((e) => ({
                _localId: crypto.randomUUID(),
                _serverId: e._id, 
                title: e.title || e.name || '', 
                episodeNumber: e.episodeNumber,
                runtime: e.runtime,
                video: e.video,
                seasonLocalId:
                    localSeasons.find((s) => s._serverId === (e.season?._id || e.season))?._localId ||
                    null,
            }))
            : [];
        setEpisodes(localEpisodes);

        // default chọn season đầu cho add episode
        if (localSeasons.length > 0) {
            setEpSeasonId(localSeasons[0]._localId);
        } else {
            setEpSeasonId('');
        }
    }, [series, reset]);

    useEffect(() => {
        console.log('[DEBUG] Series details received:', series);
    }, [series]);


    // handlers
    const addSeason = () => {
        if (!seasonName?.trim()) return toast.error('Season name is required');
        const num = Number(seasonNumber);
        if (!Number.isFinite(num) || num <= 0) return toast.error('Season number must be > 0');

        const exists = seasons.some((s) => Number(s.seasonNumber) === num);
        if (exists) return toast.error(`Season ${num} already exists`);

        const newSeason = {
            _localId: crypto.randomUUID(),
            name: seasonName.trim(),
            seasonNumber: num,
        };
        setSeasons((prev) => [...prev, newSeason].sort((a, b) => a.seasonNumber - b.seasonNumber));
        setSeasonName('');
        setSeasonNumber('');
        if (!epSeasonId) setEpSeasonId(newSeason._localId);
    };

    const removeSeason = (localId) => {
        setSeasons((prev) => prev.filter((s) => s._localId !== localId));
        setEpisodes((prev) => prev.filter((e) => e.seasonLocalId !== localId));
        if (epSeasonId === localId) {
            const remain = seasons.filter((s) => s._localId !== localId);
            setEpSeasonId(remain[0]?._localId || '');
        }
    };

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
                Number(e.episodeNumber) === num &&
                (useSeasons ? e.seasonLocalId === seasonLocalId : true)
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

    const updateEpField = (localId, field, value) => {
        setEpisodes(prev =>
            prev.map(ep =>
                ep._localId === localId ? { ...ep, [field]: value } : ep
            )
        );
    };

    const getSeasonServerIdByLocal = (localId) => {
        const found = seasons.find((s) => s._localId === localId);
        return found?._serverId || null; 
    };

    const saveEpisodes = async () => {
        const tasks = episodes.map(async (ep) => {
            const seasonIdResolved = useSeasons
                ? getSeasonServerIdByLocal(ep.seasonLocalId) || ep._serverSeasonId || null
                : ep._serverSeasonId || null;

            const payload = {
                title: ep.title?.trim() || '',
                episodeNumber: Number(ep.episodeNumber) || 1,
                runtime: Number(ep.runtime) || 0,
                video: ep.video || '',
                ...(seasonIdResolved ? { seasonId: seasonIdResolved } : {}),
            };

            if (ep._serverId) {
                // update tập đã có
                await dispatch(updateEpisodeAction(ep._serverId, payload));
            } else {
                // tạo mới nếu chưa có
                if (!seasonIdResolved)
                    throw new Error(`Episode "${ep.title || 'Untitled'}" is missing season`);
                const created = await dispatch(createEpisodeUnderSeasonAction(seasonIdResolved, payload));
                // optional: cập nhật lại state nếu muốn dùng liền không reload
                if (created?.payload?._id) {
                    setEpisodes((prev) =>
                        prev.map((x) =>
                            x._localId === ep._localId
                                ? { ...x, _serverId: created.payload._id, _serverSeasonId: seasonIdResolved }
                                : x
                        )
                    );
                }
            }
        });

        await Promise.all(tasks);
    };

    const removeEpisode = (localId) => {
        setEpisodes((prev) => prev.filter((e) => e._localId !== localId));
    };

    const onSubmit = async (data) => {
        const payload = {
            name: data.name.trim(),
            language: data.language?.trim() || '',
            year: Number(data.year) || new Date().getFullYear(),
            category: data.category,
            desc: data.desc || '',
            image: finalBackdrop,
            titleImage: finalPoster,
        };

        try {
            await dispatch(updateSeriesAction(id, payload)); // cập nhật series
            await saveEpisodes();                            // cập nhật/tạo episodes
            toast.success('Series & episodes updated!');
            await dispatch(getSeriesDetailsAction(id));
            navigate('/seriesList');
        } catch (err) {
            console.error(err);
            toast.error('Failed to update series or episodes');
        }
    };


    // update status
    useEffect(() => {
        if (editSuccess) {
            toast.success('Series updated successfully!');
            navigate('/seriesList');
        }
        if (editError) {
            toast.error(typeof editError === 'string' ? editError : 'Failed to update series');
        }
    }, [editSuccess, editError, navigate]);

    // ============ Filter + Search + Pagination logic ============
    const filteredEpisodes = useMemo(() => {
        let list = episodes;
        if (filterSeasonLocalId) {
            list = list.filter((e) => e.seasonLocalId === filterSeasonLocalId);
        }
        if (searchText.trim()) {
            const kw = searchText.trim().toLowerCase();
            list = list.filter((e) => (e.title || '').toLowerCase().includes(kw));
        }
        return list.sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
    }, [episodes, filterSeasonLocalId, searchText]);

    const totalPages = Math.max(1, Math.ceil(filteredEpisodes.length / pageSize));

    useEffect(() => {
        if (page > totalPages) setPage(1);
    }, [totalPages, page]);

    const pagedEpisodes = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredEpisodes.slice(start, start + pageSize);
    }, [filteredEpisodes, page]);


    const seasonOptions = useMemo(
        () =>
            seasons.map((s) => ({
                value: s._localId,
                title: s.name || `Season ${s.seasonNumber}`,
            })),
        [seasons]
    );

    if (seriesLoading) return <Loader />;

    if (seriesError)
        return (
            <SideBar>
                <div className="text-center text-red-400 py-10">Failed to load series info.</div>
            </SideBar>
        );

        

    return (
        <SideBar>
            <div className="flex flex-col gap-6">
                <h2 className="text-xl font-bold">Edit Series: {series?.name}</h2>

                {/* Basic info */}
                <div className="w-full grid md:grid-cols-2 gap-6">
                    <div className="w-full">
                        <Input label="Series Title" type="text" bg name="name" register={register('name')} />
                        {errors.name && <InlineError text={errors.name.message} />}
                    </div>
                    <div className="w-full">
                        <Input label="Language" type="text" bg name="language" register={register('language')} />
                        {errors.language && <InlineError text={errors.language.message} />}
                    </div>
                </div>

                <div className="w-full grid md:grid-cols-2 gap-6">
                    <div className="w-full">
                        <Input label="Year" type="number" bg name="year" register={register('year')} />
                        {errors.year && <InlineError text={errors.year.message} />}
                    </div>
                    <div className="text-sm w-full">
                        <Select
                            label="Category"
                            options={categoriesOptions}
                            name="category"
                            register={{ ...register('category') }}
                        />
                        {errors.category && <InlineError text={errors.category.message} />}
                    </div>
                </div>

                {/* Images */}
                <Titles title="Images" Icon={FaListUl} />
                <div className="w-full grid md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-3">
                        <p className="text-border font-semibold text-sm">Backdrop</p>
                        <Uploader setImageUrl={setBackdropUrl} />
                        <Input
                            label="Or paste Image URL"
                            placeholder="https://..."
                            type="text"
                            bg
                            name="backdropLink"
                            value={backdropLink}
                            onChange={(e) => setBackdropLink(e.target.value)}
                        />
                        <Imagepreview image={finalBackdrop} name="backdrop" />
                    </div>
                    <div className="flex flex-col gap-3">
                        <p className="text-border font-semibold text-sm">Poster</p>
                        <Uploader setImageUrl={setPosterUrl} />
                        <Input
                            label="Or paste Image URL"
                            placeholder="https://..."
                            type="text"
                            bg
                            name="posterLink"
                            value={posterLink}
                            onChange={(e) => setPosterLink(e.target.value)}
                        />
                        <Imagepreview image={finalPoster} name="poster" />
                    </div>
                </div>
                

                {/* Description */}
                <Message
                    label="Series Description"
                    placeholder="Description"
                    name="desc"
                    register={{ ...register('desc') }}
                />

                {/* Use seasons */}
                <label className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        className="w-4 h-4 accent-subMain"
                        checked={useSeasons}
                        onChange={(e) => setUseSeasons(e.target.checked)}
                    />
                    <span className="text-sm text-border">Use Seasons</span>
                </label>

                {/* Seasons */}
                {useSeasons && (
                    <>
                        <Titles title="Seasons" Icon={FaListUl} />
                        <div className="w-full grid md:grid-cols-3 gap-4">
                            <Input
                                label="Season Name"
                                type="text"
                                bg
                                value={seasonName}
                                onChange={(e) => setSeasonName(e.target.value)}
                            />
                            <Input
                                label="Season Number"
                                type="number"
                                bg
                                value={seasonNumber}
                                onChange={(e) => setSeasonNumber(e.target.value)}
                            />
                            <button
                                onClick={addSeason}
                                className="bg-subMain text-white rounded flex items-center justify-center gap-2 px-4"
                            >
                                <FaPlus /> Add
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
                <Titles title="Episodes" Icon={FaListUl} />
                <div className="w-full grid md:grid-cols-5 gap-4">
                    <Input label="Episode Name" bg value={epName} onChange={(e) => setEpName(e.target.value)} />
                    <Input
                        label="Episode Number"
                        type="number"
                        bg
                        value={epNumber}
                        onChange={(e) => setEpNumber(e.target.value)}
                    />
                    <Input
                        label="Runtime (min)"
                        type="number"
                        bg
                        value={epRuntime}
                        onChange={(e) => setEpRuntime(e.target.value)}
                    />
                    {useSeasons ? (
                        <div className="text-sm w-full">
                            <Select
                                label="Season"
                                options={seasonOptions}
                                name="epSeason"
                                register={{
                                    onChange: (e) => setEpSeasonId(e.target.value),
                                }}
                            />
                        </div>
                    ) : (
                        <div />
                    )}
                    <button
                        onClick={addEpisode}
                        className="bg-subMain text-white rounded flex items-center justify-center gap-2 px-4"
                    >
                        <FaPlus /> Add Episode
                    </button>
                </div>

                {/* Episode video (upload or link) */}
                <div className="w-full grid md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <p className="text-border font-semibold text-sm">Upload Episode Video</p>
                        <Uploader setImageUrl={setEpVideoUrl} />
                        {epVideoUrl ? (
                            <div className="w-full bg-main text-sm text-subMain py-3 border border-border rounded flex items-center justify-center">
                                Video selected
                            </div>
                        ) : null}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Input
                            label="Or paste Video URL"
                            placeholder="https://..."
                            type="text"
                            bg
                            value={epVideoLink}
                            onChange={(e) => setEpVideoLink(e.target.value)}
                        />
                        <p className="text-xs text-border">You can use upload or paste URL.</p>
                    </div>
                </div>


                {/* Episode table & modals */}
                {/* === Toolbar: search + filter + add === */}
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="min-w-[220px]">
                        <Input
                            label="Search episodes"
                            placeholder="Title contains..."
                            bg
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>

                    {useSeasons && (
                        <div className="text-sm min-w-[200px]">
                            <Select
                                label="Filter by season"
                                options={[{ value: "", title: "All seasons" }, ...seasonOptions]}
                                name="filterSeason"
                                register={{
                                    onChange: (e) => setFilterSeasonLocalId(e.target.value),
                                }}
                            />
                        </div>
                    )}

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-subMain text-white rounded px-4 py-2 flex items-center gap-2"
                    >
                        <FaPlus /> Add Episode
                    </button>
                </div>

                {/* === Table episodes === */}
                <div className="mt-4 overflow-x-auto border border-border rounded">
                    <table className="w-full text-sm">
                        <thead className="bg-dry">
                            <tr className="text-left">
                                <th className="p-3 w-16">#</th>
                                <th className="p-3">Title</th>
                                <th className="p-3 w-24">Runtime</th>
                                {useSeasons && <th className="p-3 w-40">Season</th>}
                                <th className="p-3 w-40">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagedEpisodes.map((e) => {
                                const seasonLabel = useSeasons
                                    ? seasons.find((s) => s._localId === e.seasonLocalId)?.name || "—"
                                    : "—";
                                return (
                                    <tr key={e._localId} className="border-t border-border">
                                        <td className="p-3">{e.episodeNumber}</td>
                                        <td className="p-3 truncate max-w-[320px]">{e.title}</td>
                                        <td className="p-3">{e.runtime || 0}m</td>
                                        {useSeasons && <td className="p-3">{seasonLabel}</td>}
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openEditModal(e)}
                                                    className="px-3 py-1 rounded bg-dry border border-border hover:bg-opacity-70"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => removeEpisode(e._localId)}
                                                    className="px-3 py-1 rounded bg-dry border border-border text-red-400 hover:bg-opacity-70"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {pagedEpisodes.length === 0 && (
                                <tr>
                                    <td colSpan={useSeasons ? 5 : 4} className="p-6 text-center text-border">
                                        No episodes found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* === Pagination === */}
                <div className="flex items-center justify-end gap-3 mt-3">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1 bg-dry border border-border rounded disabled:opacity-50"
                    >
                        Prev
                    </button>
                    <span className="text-xs text-border">Page {page} / {totalPages}</span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="px-3 py-1 bg-dry border border-border rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>

                {/* === Modal Edit === */}
                {showEditModal && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                        <div className="w-full max-w-lg bg-main border border-border rounded-xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Edit Episode</h3>
                                <button onClick={closeEditModal} className="text-border">✕</button>
                            </div>
                            <Input
                                label="Title"
                                bg
                                value={editing.title || ""}
                                onChange={(e) => setEditing((x) => ({ ...x, title: e.target.value }))}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="Episode Number"
                                    type="number"
                                    bg
                                    value={editing.episodeNumber ?? ""}
                                    onChange={(e) => setEditing((x) => ({ ...x, episodeNumber: Number(e.target.value) }))}
                                />
                                <Input
                                    label="Runtime (min)"
                                    type="number"
                                    bg
                                    value={editing.runtime ?? ""}
                                    onChange={(e) => setEditing((x) => ({ ...x, runtime: Number(e.target.value) }))}
                                />
                            </div>
                            {useSeasons && (
                                <div className="text-sm w-full">
                                    <label className="block mb-1 text-xs text-border">Season</label>
                                    <select
                                        value={editing.seasonLocalId || ""}
                                        onChange={(e) =>
                                            setEditing((x) => ({ ...x, seasonLocalId: e.target.value }))
                                        }
                                        className="w-full bg-dry border border-border text-sm rounded p-2 focus:border-subMain"
                                    >
                                        <option value="">Select season...</option>
                                        {seasonOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <Input
                                label="Video URL"
                                bg
                                value={editing.video || ""}
                                onChange={(e) => setEditing((x) => ({ ...x, video: e.target.value }))}
                            />
                            <div>
                                <p className="text-border font-semibold text-xs mb-2">Replace Video (optional)</p>
                                <Uploader setImageUrl={(url) => setEditing((x) => ({ ...x, video: url }))} />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={closeEditModal} className="px-4 py-2 bg-dry border border-border rounded">
                                    Cancel
                                </button>
                                <button
                                    onClick={saveEditingEpisode}
                                    className="px-4 py-2 bg-subMain text-white rounded"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}



                <button
                    disabled={editLoading}
                    onClick={handleSubmit(onSubmit)}
                    className="bg-subMain w-full flex-rows gap-6 font-medium text-white py-4 rounded"
                >
                    {editLoading ? 'Updating...' : (<><ImUpload /> Update Series</>)}
                </button>
            </div>
        </SideBar>
    );
}

export default EditSeries;
