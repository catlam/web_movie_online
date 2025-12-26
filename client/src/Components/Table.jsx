// Table.jsx
import React from 'react';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { GoEye } from 'react-icons/go';

const Head = "text-xs text-left text-main font-semibold px-6 py-2 uppercase";
const Text = "text-sm text-left leading-6 whitespace-nowrap px-6 py-3";

const formatCategory = (cat) => {
    if (!cat) return '—';
    if (Array.isArray(cat)) return cat.filter(Boolean).join(', ');
    if (cat && typeof cat === 'object') return cat?.name ?? '—';
    return cat ?? '—';
};

// Row component
const Row = ({ item, i, onDeleteHandler, admin, resolveLink }) => {
    if (!item) return null;

    const id = item?._id ?? `${i}`;
    const kind = item?.__kind === 'series' ? 'Series' : 'Movie';
    const name = item?.name || item?.title || '—';
    const img = item?.image || item?.titleImage || '/images/user.png';

    // Xác định link chi tiết
    const toHref = resolveLink
        ? resolveLink(item)
        : (kind === 'Series' ? `/series/${id}` : `/movie/${id}`);

    return (
        <tr key={id}>
            {/* Image */}
            <td className={Text}>
                <div className="w-12 p-1 bg-dry border border-border h-12 rounded overflow-hidden">
                    <img
                        className="h-full w-full object-cover"
                        src={img}
                        alt={name}
                        loading="lazy"
                    />
                </div>
            </td>

            {/* Name – Clickable Link */}
            <td className={`${Text} truncate`}>
                <Link
                    to={toHref}
                    className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    title={`View ${name}`}
                >
                    {name}
                </Link>
            </td>

            {/* Category */}
            <td className={Text}>{formatCategory(item?.category)}</td>

            {/* Language */}
            <td className={Text}>{item?.language ?? '—'}</td>

            {/* Year */}
            <td className={Text}>{item?.year ?? '—'}</td>

            {/* Actions */}
            <td className={`${Text} float-right flex-rows gap-2`}>
                {admin ? (
                    <>
                        {/* Edit Button */}
                        <Link
                            to={`/edit/${id}`}
                            className="border border-border bg-dry flex-rows gap-2 text-border rounded py-1 px-2"
                        >
                            Edit <FaEdit className="text-green-500" />
                        </Link>

                        {/* Delete Button */}
                        <button
                            onClick={() => onDeleteHandler && onDeleteHandler(id, kind)}
                            className="bg-subMain text-white rounded flex-colo w-6 h-6"
                            title="Delete"
                        >
                            <MdDelete />
                        </button>
                    </>
                ) : (
                    <>
                        {/* Delete Button (non-admin) */}
                        <button
                            onClick={() => onDeleteHandler && onDeleteHandler(id, kind)}
                            className="border border-border bg-dry flex-rows gap-2 text-border rounded py-1 px-2"
                        >
                            Delete <FaTrashAlt className="text-red-500" />
                        </button>

                        {/* View Button (tùy chọn – có thể bỏ nếu tên đã có link) */}
                        {/* <Link
                            to={toHref}
                            className="bg-subMain text-white rounded flex-colo w-6 h-6"
                            title="View"
                        >
                            <GoEye />
                        </Link> */}
                    </>
                )}
            </td>
        </tr>
    );
};

// Table component
function Table({ data, admin, onDeleteHandler, resolveLink }) {
    const safeData = Array.isArray(data)
        ? data.filter(item => item && typeof item === 'object')
        : [];

    return (
        <div className="overflow-x-auto overflow-hidden relative w-full">
            <table className="w-full table-auto border border-border divide-y divide-border">
                <thead>
                    <tr className="bg-dryGray">
                        <th className={Head}>Image</th>
                        <th className={Head}>Name</th>
                        <th className={Head}>Category</th>
                        <th className={Head}>Language</th>
                        <th className={Head}>Year</th>
                        <th className={`${Head} text-end`}>Actions</th>
                    </tr>
                </thead>

                <tbody className="bg-main divide-y divide-gray-800">
                    {safeData.map((item, i) => (
                        <Row
                            key={item?._id ?? `row-${i}`}
                            item={item}
                            i={i}
                            admin={!!admin}
                            onDeleteHandler={onDeleteHandler}
                            resolveLink={resolveLink}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Table;