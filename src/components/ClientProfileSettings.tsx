import React, { useState, ChangeEvent, FormEvent } from "react";

interface ClientFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

const ClientProfileSettings: React.FC = () => {
  const [formData, setFormData] = useState<ClientFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Submitted:", formData);
    // TODO: Connect to backend
  };

  return (
    <div className="card-body">
      <h6 className="text-base text-neutral-600 mb-4">Profile Photo</h6>

      {/* Image Upload */}
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
          <label htmlFor="first_name" className="block font-semibold text-sm text-neutral-600 mb-2">
            First Name
          </label>
          <input
            type="text"
            id="first_name"
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Enter first name"
            value={formData.first_name}
            onChange={handleChange}
          />
        </div>

        <div className="mb-5">
          <label htmlFor="last_name" className="block font-semibold text-sm text-neutral-600 mb-2">
            Last Name
          </label>
          <input
            type="text"
            id="last_name"
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Enter last name"
            value={formData.last_name}
            onChange={handleChange}
          />
        </div>

        <div className="mb-5">
          <label htmlFor="email" className="block font-semibold text-sm text-neutral-600 mb-2">
            Email Address
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

        <div className="mb-5">
          <label htmlFor="address" className="block font-semibold text-sm text-neutral-600 mb-2">
            Address
          </label>
          <input
            type="text"
            id="address"
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Enter address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>

        <div className="flex gap-4 mb-5">
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

        <div className="flex gap-4 mb-5">
          <input
            type="text"
            id="country"
            className="w-[300px] border rounded-lg px-3 py-2"
            placeholder="Country"
            value={formData.country}
            onChange={handleChange}
          />
          <input
            type="text"
            id="postal_code"
            className="w-[150px] border rounded-lg px-3 py-2"
            placeholder="Postal Code"
            value={formData.postal_code}
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

export default ClientProfileSettings;
