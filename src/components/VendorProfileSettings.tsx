import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useGetVendorByVendorUserIdQuery, useUpdateVendorMutation } from "../features/api/vendorsApi";
import { useGetVendorTypesQuery } from "../features/api/vendorTypesApi";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import Preloader from "./Preloader";
import { toast } from "react-toastify";

interface VendorFormData {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipcode: string;
  businessType: string;
  serviceAreas: string;
  license: string;
}

const VendorProfileSettings: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: vendorData, isLoading, refetch } = useGetVendorByVendorUserIdQuery(user?.id.toString() || "", {
    skip: !user?.id,
  });
  const [updateVendor, { isLoading: isUpdating }] = useUpdateVendorMutation();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<VendorFormData>({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    businessType: "",
    serviceAreas: "",
    license: "",
  });

  const getInitialFormData = (data: typeof vendorData): VendorFormData => ({
    name: data?.name || "",
    email: data?.email || "",
    phone: data?.phone || "",
    street: data?.address || "",
    city: data?.city || "",
    state: data?.state || "",
    zipcode: data?.postal_code || "",
    businessType: data?.vendor_types || "",
    serviceAreas: "",
    license: data?.license || "",
  });

  useEffect(() => {
    if (vendorData) {
      setFormData(getInitialFormData(vendorData));
    }
  }, [vendorData]);

  const isChanged = JSON.stringify(formData) !== JSON.stringify(getInitialFormData(vendorData));

  const handleCancel = () => {
    setFormData(getInitialFormData(vendorData));
  };

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!vendorData?.id) return;

    try {
      const payload = {
        id: vendorData.id,
        vendor_user_id: user?.id,
        vendor_type: { vendor_type: formData.businessType },
        vendor_types: formData.businessType,
        code: vendorData.code,
        license: formData.license,
        verified: vendorData.verified,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.street,
        city: formData.city,
        state: formData.state,
        country: vendorData.country,
        postal_code: formData.zipcode,
        rating: vendorData.rating,
        review: vendorData.review
      };

      await updateVendor(payload).unwrap();
      toast.success("Vendor profile updated successfully");
      refetch();
    } catch (error) {
      console.error("Failed to update vendor", error);
      toast.error("Failed to update vendor profile");
    }
  };

  const { data: vendorTypesList } = useGetVendorTypesQuery();

  if (isLoading) return <Preloader />;

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
            Company Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="businessName"
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Enter company name"
            value={formData.name}
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
            className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
            placeholder="Enter email"
            value={formData.email}
            readOnly
            disabled
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
            {vendorTypesList?.map((type: any) => (
              <option key={type.id || type.vendor_type} value={type.vendor_type}>
                {type.vendor_type}
              </option>
            ))}
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
            placeholder="Torronto, London, Scarborough"
            value={formData.serviceAreas}
            onChange={handleChange}
          />
        </div>

        <div className="mb-5">
          <label htmlFor="license" className="block font-semibold text-sm text-neutral-600 mb-2">License Number</label>
          <input
            type="text"
            id="license"
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Enter license number"
            value={formData.license}
            onChange={handleChange}
          />
        </div>

        <div className="mb-5">
          <label className="block font-semibold text-sm text-neutral-600 mb-2">Verification Status</label>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${vendorData?.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {vendorData?.verified ? 'Verified' : 'Pending Verification'}
          </div>
        </div>

        {isChanged && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="border border-red-600 bg-red-100 hover:bg-red-200 text-red-600 text-base px-8 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white text-base px-8 py-2 rounded-lg disabled:opacity-50"
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default VendorProfileSettings;
