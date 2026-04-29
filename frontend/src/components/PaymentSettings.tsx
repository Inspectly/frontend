import React, { useState } from "react";
import PaypalModal from "./PaypalModal";
import StripeModal from "./StripeModal";
import BankModal from "./BankModal";
import CreditCardModal from "./CreditcardModal";
type PaymentMethodType = "paypal" | "stripe" | "bank" | "credit card";

interface PaymentMethodInstance {
  id: string;
  type: PaymentMethodType;
}

// Modal registry for dynamic rendering
const paymentModals: Record<
  PaymentMethodType,
  React.FC<{ onClose: () => void; onConfirm: () => void }>
> = {
  'paypal': PaypalModal,
  'stripe': StripeModal,
  'bank': BankModal,
  'credit card': CreditCardModal 
};

const PaymentSettings: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInstance[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType | null>(null);
  const [taxInfo, setTaxInfo] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const confirmAddMethod = () => {
    if (!selectedMethod) return;
    const id = `${selectedMethod}-${Date.now()}`;
    setPaymentMethods((prev) => [...prev, { id, type: selectedMethod }]);
    setSelectedMethod(null);
  };

  const renderMethodCard = (method: PaymentMethodInstance) => (
    <div key={method.id} className="card rounded-xl border border-gray-200 bg-white mb-6 p-6">
      <h3 className="text-lg font-semibold text-neutral-800 capitalize">{method.type}</h3>
      <p className="text-sm text-gray-500 mt-2">[Placeholder for {method.type} form fields]</p>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-neutral-800">Payment Settings</h2>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            + Add Payment Method
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow z-10">
              {(Object.keys(paymentModals) as PaymentMethodType[]).map((method) => (
                <button
                  key={method}
                  onClick={() => {
                    setSelectedMethod(method);
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 capitalize"
                >
                  {method}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {paymentMethods.map(renderMethodCard)}

      {/* Tax Info */}
      <div className="mt-8">
        <label htmlFor="taxInfo" className="block text-sm font-semibold text-neutral-700 mb-2">
          Tax Information (e.g., GST/HST #)
        </label>
        <input
          type="text"
          id="taxInfo"
          className="w-full border border-gray-300 text-neutral-700 rounded-lg px-3 py-2"
          placeholder="Enter Tax Information"
          value={taxInfo}
          onChange={(e) => setTaxInfo(e.target.value)}
        />
      </div>

      <div className="mt-6 text-right">
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          Save All Changes
        </button>
      </div>

      {/* Modal Renderer */}
      {selectedMethod && (() => {
        const ModalComponent = paymentModals[selectedMethod];
        return (
          <ModalComponent
            onClose={() => setSelectedMethod(null)}
            onConfirm={confirmAddMethod}
          />
        );
      })()}
    </div>
  );
};

export default PaymentSettings;
