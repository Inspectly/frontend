import React, { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

export interface ListingOnlyFormData {
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  image_url?: string;
}

interface AddListingOnlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ListingOnlyFormData) => Promise<void> | void;
}

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
};

const CA_POSTAL_REGEX = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

const initialForm: ListingOnlyFormData = {
  address: "",
  city: "",
  state: "",
  country: "Canada",
  postal_code: "",
  image_url: "",
};

const AddListingOnlyModal: React.FC<AddListingOnlyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<ListingOnlyFormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    setFormData((prev) => ({ ...prev, country, state: "" }));
  };

  const handlePostalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/gi, "");
    if (v.length > 3) v = `${v.slice(0, 3)} ${v.slice(3, 6)}`;
    setFormData((prev) => ({ ...prev, postal_code: v }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFormData((prev) => ({ ...prev, image_url: base64 }));
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image_url: "" }));
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      setImagePreview("");
      onClose();
    } catch (err) {
      console.error("Failed to submit:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialForm);
    setImagePreview("");
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

        <h6 className="text-lg font-semibold mb-4">Add New Property</h6>

        <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-4">
          {/* Property Image */}
          <div className="col-span-12">
            <label className="text-sm font-semibold text-gray-600 mb-2 block">
              Property Photo (optional)
            </label>
            {imagePreview ? (
              <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={imagePreview}
                  alt="Property preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                >
                  &times;
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
              >
                <ImagePlus className="w-8 h-8 mb-1" />
                <span className="text-sm">Click to upload a photo</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={loading}
            />
          </div>

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

          <div className="col-span-12">
            <button
              type="submit"
              disabled={loading}
              className={`btn bg-primary text-white py-2 px-6 rounded-lg hover:bg-primary/90 w-full font-semibold ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Creating..." : "Create Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddListingOnlyModal;
