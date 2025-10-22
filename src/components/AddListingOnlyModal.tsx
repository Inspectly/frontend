// src/components/AddListingOnlyModal.tsx
import React, { useState } from "react";

export interface ListingOnlyFormData {
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

interface AddListingOnlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ListingOnlyFormData) => Promise<void> | void;
}

// Country → States/Provinces map (same as the “with report” modal)
const COUNTRY_STATES: Record<string, { code: string; name: string }[]> = {
  Canada: [
    { code: "AB", name: "Alberta" },
    { code: "BC", name: "British Columbia" },
    { code: "MB", name: "Manitoba" },
    { code: "NB", name: "New Brunswick" },
    { code: "NL", name: "Newfoundland and Labrador" },
    { code: "NS", name: "Nova Scotia" },
    { code: "NT", name: "Northwest Territories" },
    { code: "NU", name: "Nunavut" },
    { code: "ON", name: "Ontario" },
    { code: "PE", name: "Prince Edward Island" },
    { code: "QC", name: "Quebec" },
    { code: "SK", name: "Saskatchewan" },
    { code: "YT", name: "Yukon" },
  ],
  // Extend with more countries as needed
};

// Regex for Canadian postal code
const CA_POSTAL_REGEX = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

const initialForm: ListingOnlyFormData = {
  address: "",
  city: "",
  state: "",
  country: "Canada",
  postal_code: "",
};

const AddListingOnlyModal: React.FC<AddListingOnlyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<ListingOnlyFormData>(initialForm);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const availableStates = COUNTRY_STATES[formData.country] || [];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = e.target.value;
    setFormData((prev) => ({
      ...prev,
      country,
      state: "", // reset province/state when country changes
    }));
  };

  // Auto-format postal code if Canada
  const handlePostalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/gi, "");
    if (v.length > 3) v = `${v.slice(0, 3)} ${v.slice(3, 6)}`;
    setFormData((prev) => ({ ...prev, postal_code: v }));
  };

  const validateBeforeSubmit = () => {
    if (!formData.country) {
      alert("Please select a country.");
      return false;
    }
    if (!formData.state) {
      alert("Please select a state/province.");
      return false;
    }
    if (
      formData.country === "Canada" &&
      !CA_POSTAL_REGEX.test(formData.postal_code)
    ) {
      alert("Please enter a valid Canadian postal code (e.g., A1A 1A1).");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBeforeSubmit()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData(initialForm);
      onClose();
    } catch (err) {
      console.error("Failed to submit:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialForm);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-xl rounded-xl shadow-lg p-6 relative">
        <button
          onClick={handleCancel}
          className="absolute top-2 right-4 text-3xl font-light text-gray-600 hover:text-gray-800"
          type="button"
          aria-label="Close"
          disabled={loading}
        >
          &times;
        </button>

        <h6 className="text-lg font-semibold mb-4">Add New Listing</h6>

        <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-4">
          <div className="col-span-12">
            <label className="text-sm font-semibold text-gray-600">
              Address
            </label>
            <input
              type="text"
              name="address"
              className="w-full rounded-lg border border-gray-300 px-5 py-2.5"
              placeholder="123 Main St"
              value={formData.address}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>

          <div className="col-span-6">
            <label className="text-sm font-semibold text-gray-600">City</label>
            <input
              type="text"
              name="city"
              className="w-full rounded-lg border border-gray-300 px-5 py-2.5"
              placeholder="City"
              value={formData.city}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>

          {/* Country */}
          <div className="col-span-6">
            <label className="text-sm font-semibold text-gray-600">
              Country
            </label>
            <select
              name="country"
              value={formData.country}
              onChange={handleCountryChange}
              className="w-full rounded-lg border border-gray-300 px-5 py-2.5 bg-white"
              required
              disabled={loading}
            >
              <option value="" disabled>
                Select country
              </option>
              {Object.keys(COUNTRY_STATES).map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          {/* State/Province */}
          <div className="col-span-6">
            <label className="text-sm font-semibold text-gray-600">
              State / Province
            </label>
            <select
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-gray-300 px-5 py-2.5 bg-white"
              required
              disabled={loading}
            >
              <option value="" disabled>
                Select state/province
              </option>
              {availableStates.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Postal Code */}
          <div className="col-span-6">
            <label className="text-sm font-semibold text-gray-600">
              Postal Code
            </label>
            <input
              type="text"
              name="postal_code"
              className="w-full rounded-lg border border-gray-300 px-5 py-2.5"
              placeholder={formData.country === "Canada" ? "A1A 1A1" : ""}
              value={formData.postal_code}
              onChange={handlePostalChange}
              required
              disabled={loading}
            />
          </div>

          {/* Submit */}
          <div className="col-span-12">
            <button
              type="submit"
              disabled={loading}
              className={`btn bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 w-full ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Creating..." : "Create Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddListingOnlyModal;
