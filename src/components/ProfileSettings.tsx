import React, { useState, ChangeEvent, FormEvent } from "react";

interface FormData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipcode: string;
  businessType: string;
  serviceAreas: string;
  languages: string;
}

const ProfileSettings: React.FC = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    businessType: "",
    serviceAreas: "",
    languages: "",
  });

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Submitted:", formData);
    // TODO: Connect to backend
  };

  return (
    <div className="card-body">
      <h6 className="text-base text-neutral-600 mb-4">Company Logo / Profile Photo</h6>

      {/* Upload Image */}
      <div className="mb-6 mt-4 relative w-[120px] h-[120px]">
        <div className="avatar-upload relative w-full h-full rounded-full overflow-hidden border border-gray-300">
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-sm text-gray-400">
              No image
            </div>
          )}
          <div className="avatar-edit absolute bottom-2 right-3 z-10">
            <input
              type="file"
              id="imageUpload"
              accept=".png, .jpg, .jpeg"
              onChange={handleImageUpload}
              hidden
            />
            <label
              htmlFor="imageUpload"
              className="w-8 h-8 flex justify-center items-center bg-blue-100 text-blue-600 border border-blue-600 hover:bg-blue-200 text-lg rounded-full cursor-pointer"
            >
              📷
            </label>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label htmlFor="businessName" className="block font-semibold text-sm text-neutral-600 mb-2">
            Business Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="businessName"
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Enter business name"
            value={formData.businessName}
            onChange={handleChange}
          />
        </div>

        <div className="mb-5">
          <label htmlFor="ownerName" className="block font-semibold text-sm text-neutral-600 mb-2">
            Owner Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="ownerName"
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Enter owner name"
            value={formData.ownerName}
            onChange={handleChange}
          />
        </div>

        <div className="mb-5">
          <label htmlFor="email" className="block font-semibold text-sm text-neutral-600 mb-2">
            Email Address <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            id="email"
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Enter email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div className="mb-5">
          <label htmlFor="phone" className="block font-semibold text-sm text-neutral-600 mb-2">
            Phone Number
          </label>
          <input
            type="text"
            id="phone"
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Enter phone number"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        {/* Address Fields */}
        <div className="mb-5">
          <label className="block font-semibold text-sm text-neutral-600 mb-2">
            Business Address
          </label>
          <input
            type="text"
            id="street"
            className="w-full border rounded-lg px-3 py-2 mb-4"
            placeholder="Street address"
            value={formData.street}
            onChange={handleChange}
          />
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              id="city"
              className="w-[300px] border rounded-lg px-3 py-2"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
            />
            <input
              type="text"
              id="state"
              className="w-[150px] border rounded-lg px-3 py-2"
              placeholder="State"
              value={formData.state}
              onChange={handleChange}
            />
          </div>
          <input
            type="text"
            id="zipcode"
            className="w-52 border rounded-lg px-3 py-2"
            placeholder="Zip Code"
            value={formData.zipcode}
            onChange={handleChange}
          />
        </div>

        <div className="mb-5">
          <label htmlFor="businessType" className="block font-semibold text-sm text-neutral-600 mb-2">
            Business Type
          </label>
          <select
            id="businessType"
            className="w-full border rounded-lg px-3 py-2"
            value={formData.businessType}
            onChange={handleChange}
          >
            <option value="">Select business type</option>
            <option>Plumbing</option>
            <option>Electrical</option>
            <option>General Contractor</option>
            <option>Landscaping</option>
            <option>Cleaning Services</option>
          </select>
        </div>

        <div className="mb-5">
          <label htmlFor="serviceAreas" className="block font-semibold text-sm text-neutral-600 mb-2">
            Service Area (comma-separated)
          </label>
          <input
            type="text"
            id="serviceAreas"
            className="w-full border rounded-lg px-3 py-2"
            placeholder="e.g. Dhaka, Sylhet, Chittagong"
            value={formData.serviceAreas}
            onChange={handleChange}
          />
        </div>

        <div className="mb-5">
          <label htmlFor="languages" className="block font-semibold text-sm text-neutral-600 mb-2">
            Languages Spoken (comma-separated)
          </label>
          <input
            type="text"
            id="languages"
            className="w-full border rounded-lg px-3 py-2"
            placeholder="e.g. English, Bangla"
            value={formData.languages}
            onChange={handleChange}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            className="border border-red-600 bg-red-100 hover:bg-red-200 text-red-600 text-base px-8 py-2 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white text-base px-8 py-2 rounded-lg"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
