import React from "react";

interface Props {
  onClose: () => void;
  onConfirm: () => void;
}

const PaypalModal: React.FC<Props> = ({ onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-20 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-lg w-[90%] max-w-md">
        <h3 className="text-lg font-bold mb-4">Add PayPal Account</h3>
        <p className="text-sm text-gray-500 mb-6">[PayPal form fields go here]</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaypalModal;
