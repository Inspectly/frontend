import React, { useState, ChangeEvent, FormEvent } from "react";

type PaymentMethod = "paypal" | "stripe" | "bank";

interface PaypalForm {
  secretKey: string;
  publicKey: string;
  currency: string;
  environment: "sandbox" | "production";
}

interface StripeForm {
  secretKey: string;
  publicKey: string;
  currency: string;
}

interface BankForm {
  accountName: string;
  accountNumber: string;
  bankName: string;
  routingNumber: string;
}

const PaymentSettings: React.FC = () => {
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>("paypal");
  const [paypalData, setPaypalData] = useState<PaypalForm>({
    secretKey: "",
    publicKey: "",
    currency: "USD",
    environment: "sandbox",
  });
  const [stripeData, setStripeData] = useState<StripeForm>({
    secretKey: "",
    publicKey: "",
    currency: "USD",
  });
  const [bankData, setBankData] = useState<BankForm>({
    accountName: "",
    accountNumber: "",
    bankName: "",
    routingNumber: "",
  });
  const [taxInfo, setTaxInfo] = useState("");

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    method: PaymentMethod
  ) => {
    const { id, value } = e.target;
    if (method === "paypal") setPaypalData((prev) => ({ ...prev, [id]: value }));
    else if (method === "stripe") setStripeData((prev) => ({ ...prev, [id]: value }));
    else if (method === "bank") setBankData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Paypal:", paypalData);
    console.log("Stripe:", stripeData);
    console.log("Bank:", bankData);
    console.log("Tax Info:", taxInfo);
  };

  const renderToggle = (method: PaymentMethod) => (
    <label className="inline-flex items-center cursor-pointer ml-auto">
      <input
        type="radio"
        name="payment-method"
        value={method}
        checked={activeMethod === method}
        onChange={() => setActiveMethod(method)}
        className="sr-only peer"
      />
      <span className="relative w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:rounded-full after:transition-transform peer-checked:after:translate-x-4" />
    </label>
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-neutral-800 mb-6">Payment Settings</h2>

      {/* Paypal Card */}
      <div className="card rounded-xl border border-gray-200 bg-white mb-6">
        <div className="card-header border-b border-gray-200 py-4 px-6 flex items-center justify-between">
          <span className="text-lg font-semibold text-neutral-700">Paypal</span>
          {renderToggle("paypal")}
        </div>
        {activeMethod === "paypal" && (
          <div className="card-body p-6">
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-12 sm:col-span-6">
                <label htmlFor="environment" className="text-sm font-semibold text-neutral-700 block mb-2">
                  Environment *
                </label>
                <select
                  id="environment"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={paypalData.environment}
                  onChange={(e) => handleChange(e, "paypal")}
                >
                  <option value="sandbox">Sandbox</option>
                  <option value="production">Production</option>
                </select>
              </div>
              <div className="col-span-12 sm:col-span-6">
                <label htmlFor="currency" className="text-sm font-semibold text-neutral-700 block mb-2">
                  Currency *
                </label>
                <select
                  id="currency"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={paypalData.currency}
                  onChange={(e) => handleChange(e, "paypal")}
                >
                  <option value="USD">USD</option>
                  <option value="BDT">BDT</option>
                  <option value="INR">INR</option>
                </select>
              </div>
              <div className="col-span-12 sm:col-span-6">
                <label htmlFor="secretKey" className="text-sm font-semibold text-neutral-700 block mb-2">
                  Secret Key *
                </label>
                <input
                  type="text"
                  id="secretKey"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={paypalData.secretKey}
                  onChange={(e) => handleChange(e, "paypal")}
                />
              </div>
              <div className="col-span-12 sm:col-span-6">
                <label htmlFor="publicKey" className="text-sm font-semibold text-neutral-700 block mb-2">
                  Public Key *
                </label>
                <input
                  type="text"
                  id="publicKey"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={paypalData.publicKey}
                  onChange={(e) => handleChange(e, "paypal")}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stripe Card */}
      <div className="card rounded-xl border border-gray-200 bg-white mb-6">
        <div className="card-header border-b border-gray-200 py-4 px-6 flex items-center justify-between">
          <span className="text-lg font-semibold text-neutral-700">Stripe</span>
          {renderToggle("stripe")}
        </div>
        {activeMethod === "stripe" && (
          <div className="card-body p-6">
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-12 sm:col-span-6">
                <label htmlFor="currency" className="text-sm font-semibold text-neutral-700 block mb-2">
                  Currency *
                </label>
                <select
                  id="currency"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={stripeData.currency}
                  onChange={(e) => handleChange(e, "stripe")}
                >
                  <option value="USD">USD</option>
                  <option value="BDT">BDT</option>
                  <option value="INR">INR</option>
                </select>
              </div>
              <div className="col-span-12 sm:col-span-6">
                <label htmlFor="secretKey" className="text-sm font-semibold text-neutral-700 block mb-2">
                  Secret Key *
                </label>
                <input
                  type="text"
                  id="secretKey"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={stripeData.secretKey}
                  onChange={(e) => handleChange(e, "stripe")}
                />
              </div>
              <div className="col-span-12 sm:col-span-6">
                <label htmlFor="publicKey" className="text-sm font-semibold text-neutral-700 block mb-2">
                  Public Key *
                </label>
                <input
                  type="text"
                  id="publicKey"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={stripeData.publicKey}
                  onChange={(e) => handleChange(e, "stripe")}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bank Transfer Card */}
      <div className="card rounded-xl border border-gray-200 bg-white mb-6">
        <div className="card-header border-b border-gray-200 py-4 px-6 flex items-center justify-between">
          <span className="text-lg font-semibold text-neutral-700">Bank Transfer</span>
          {renderToggle("bank")}
        </div>
        {activeMethod === "bank" && (
          <div className="card-body p-6">
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-12 sm:col-span-6">
                <label htmlFor="accountName" className="text-sm font-semibold text-neutral-700 block mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  id="accountName"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={bankData.accountName}
                  onChange={(e) => handleChange(e, "bank")}
                />
              </div>
              <div className="col-span-12 sm:col-span-6">
                <label htmlFor="accountNumber" className="text-sm font-semibold text-neutral-700 block mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  id="accountNumber"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={bankData.accountNumber}
                  onChange={(e) => handleChange(e, "bank")}
                />
              </div>
              <div className="col-span-12 sm:col-span-6">
                <label htmlFor="bankName" className="text-sm font-semibold text-neutral-700 block mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  id="bankName"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={bankData.bankName}
                  onChange={(e) => handleChange(e, "bank")}
                />
              </div>
              <div className="col-span-12 sm:col-span-6">
                <label htmlFor="routingNumber" className="text-sm font-semibold text-neutral-700 block mb-2">
                  Routing Number
                </label>
                <input
                  type="text"
                  id="routingNumber"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={bankData.routingNumber}
                  onChange={(e) => handleChange(e, "bank")}
                />
              </div>
            </div>
          </div>
        )}
      </div>

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
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Save All Changes
        </button>
      </div>
    </div>
  );
};

export default PaymentSettings;
