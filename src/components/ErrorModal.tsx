import React from "react";

interface ErrorModalProps {
  error: string;
  onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ error, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120]">
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-[90%]">
        <div className="text-red-500 text-center mb-4">{error}</div>
        <button
          onClick={onClose}
          className="bg-purple-500 text-white px-4 py-2 rounded w-full"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;
