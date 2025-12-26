import React from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5'; // Import biểu tượng đóng

function MainModal({ modalOpen, setModalOpen, children }) {
  if (!modalOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-30 bg-black bg-opacity-60 flex justify-center items-center"> {/* 'z-30' để modal ở trên cùng và nền mờ */}
      <div className="rounded-2xl shadow-lg  bg-main relative max-w-xl w-full h-auto"> {/* Kích thước và padding theo Tailwind từ mainmodal2 */}
        {/* Nút đóng modal */}
        <button
          className="absolute top-5 right-5 text-gray-500 hover:text-white focus:outline-none"
          onClick={() => setModalOpen(false)}
        >
          <IoClose size={24} />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

export default MainModal;
