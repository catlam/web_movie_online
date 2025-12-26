import React from 'react';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { GoEye } from 'react-icons/go';
import { Link } from 'react-router-dom';

const Head = "text-xs text-left text-main font-semibold px-6 py-2 uppercase";
const Text = "text-sm text-left leading-6 whitespace-nowrap px-6 py-3";

// Row component
const Row = ({ series, i, onDeleteHandler, admin }) => {
    if (!series) return null;

    const id = series?._id || i;
    const name = series?.name || '—';
    const img = series?.image || '/images/user.png';
    const category = series?.category || '—';
    const language = series?.language || '—';
    const year = series?.year || '—';

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
                    to={`/series/${id}`}
                    className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    title={`View ${name}`}
                >
                    {name}
                </Link>
            </td>

            {/* Category */}
            <td className={Text}>{category}</td>

            {/* Language */}
            <td className={Text}>{language}</td>

            {/* Year */}
            <td className={Text}>{year}</td>

            {/* Actions */}
            <td className={`${Text} float-right flex-rows gap-2`}>
                {admin ? (
                    <>
                        {/* Edit Button */}
                        <Link
                            to={`/editSeries/${id}`}
                            className="border border-border bg-dry flex-rows gap-2 text-border rounded py-1 px-2"
                        >
                            Edit <FaEdit className="text-green-500" />
                        </Link>

                        {/* Delete Button */}
                        <button
                            onClick={() => onDeleteHandler?.(id)}
                            className="bg-subMain text-white rounded flex-colo w-6 h-6"
                            title="Delete series"
                        >
                            <MdDelete />
                        </button>
                    </>
                ) : (
                    <>
                        {/* Delete (non-admin) */}
                        <button
                            onClick={() => onDeleteHandler?.(id)}
                            className="border border-border bg-dry flex-rows gap-2 text-border rounded py-1 px-2"
                        >
                            Delete <FaTrashAlt className="text-red-500" />
                        </button>

                        {/* View Button (tùy chọn – có thể bỏ vì tên đã có link) */}
                        {/* <Link
              to={`/series/${id}`}
              className="bg-subMain text-white rounded flex-colo w-6 h-6"
              title="View series"
            >
              <GoEye />
            </Link> */}
                    </>
                )}
            </td>
        </tr>
    );
};

// SeriesTable component
function SeriesTable({ data = [], admin = true, onDeleteHandler }) {
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
                            key={item?._id ?? `series-${i}`}
                            series={item}
                            i={i}
                            onDeleteHandler={onDeleteHandler}
                            admin={admin}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default SeriesTable;