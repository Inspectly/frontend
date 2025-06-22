import React from "react";

interface Props {
  onClose: () => void;
  onConfirm: () => void;
}

const CreditCardModal: React.FC<Props> = ({ onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-20 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-lg w-[90%] max-w-md">
        <h3 className="text-lg font-bold mb-4">Add Credit Card</h3>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Cardholder Name"
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="Card Number"
            maxLength={19}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="MM/YY"
              maxLength={5}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="CVV"
              maxLength={4}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <input
            type="text"
            placeholder="Billing Address (optional)"
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
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

export default CreditCardModal;
