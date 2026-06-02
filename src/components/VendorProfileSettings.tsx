import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useGetVendorByVendorUserIdQuery, useUpdateVendorMutation } from "../features/api/vendorsApi";
import { useGetVendorTypesQuery } from "../features/api/vendorTypesApi";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import Preloader from "./Preloader";
import { toast } from "react-toastify";
import { Camera } from "lucide-react";

interface VendorFormData {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  serviceArea: string;
  businessType: string;
  license: string;
  providesWarranty: boolean;
  warrantyAmount: string;
  warrantyUnit: string;
}

type Tab = "profile" | "notifications" | "verification";

const WARRANTY_UNITS = ["Days", "Weeks", "Months", "Years"] as const;

// Parse a stored warranty string (e.g. "1 year", "6 months") into an
// amount + unit for the form controls. Falls back to a sensible default.
const parseWarranty = (warranty?: string | null): { amount: string; unit: string } => {
  const match = (warranty || "").trim().match(/^(\d+)\s*(day|week|month|year)/i);
  if (match) {
    const word = match[2].toLowerCase();
    return { amount: match[1], unit: `${word.charAt(0).toUpperCase()}${word.slice(1)}s` };
  }
  return { amount: "1", unit: "Years" };
};

// Build the canonical warranty string, e.g. "1 year" / "2 years".
const formatWarranty = (amount: string, unit: string): string => {
  const n = parseInt(amount, 10) || 1;
  const singular = unit.replace(/s$/, "").toLowerCase();
  return `${n} ${singular}${n === 1 ? "" : "s"}`;
};

const VendorProfileSettings: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: vendorData, isLoading, refetch } = useGetVendorByVendorUserIdQuery(user?.id.toString() || "", {
    skip: !user?.id,
  });
  const [updateVendor, { isLoading: isUpdating }] = useUpdateVendorMutation();
  const { data: vendorTypesList } = useGetVendorTypesQuery();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<VendorFormData>({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    serviceArea: "",
    businessType: "",
    license: "",
    providesWarranty: false,
    warrantyAmount: "1",
    warrantyUnit: "Years",
  });

  const getInitialFormData = (data: typeof vendorData): VendorFormData => {
    const { amount, unit } = parseWarranty(data?.warranty);
    return {
      name: data?.name || "",
      contactName: "",
      email: data?.email || "",
      phone: data?.phone || "",
      serviceArea: [data?.city, data?.state].filter(Boolean).join(", "),
      businessType: data?.vendor_types || "",
      license: data?.license || "",
      providesWarranty: Boolean(data?.warranty && data.warranty.trim()),
      warrantyAmount: amount,
      warrantyUnit: unit,
    };
  };

  useEffect(() => {
    if (vendorData) {
      setFormData(getInitialFormData(vendorData));
    }
  }, [vendorData]);

  const isChanged = JSON.stringify(formData) !== JSON.stringify(getInitialFormData(vendorData));

  const handleCancel = () => {
    setFormData(getInitialFormData(vendorData));
  };

  const handleFileUpload = (
    e: ChangeEvent<HTMLInputElement>,
    setter: (src: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
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

    const [city = "", state = ""] = formData.serviceArea.split(",").map((s) => s.trim());

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
        address: vendorData.address,
        city,
        state,
        country: vendorData.country,
        postal_code: vendorData.postal_code,
        rating: vendorData.rating,
        review: vendorData.review,
        warranty: formData.providesWarranty
          ? formatWarranty(formData.warrantyAmount, formData.warrantyUnit)
          : "",
      };

      await updateVendor(payload).unwrap();
      toast.success("Profile updated successfully");
      refetch();
    } catch (error) {
      console.error("Failed to update vendor", error);
      toast.error("Failed to update profile");
    }
  };

  if (isLoading) return <Preloader />;

  const subtitleParts = [
    vendorData?.vendor_types || vendorData?.vendor_type?.vendor_type,
    vendorData?.verified ? "Verified" : null,
  ].filter(Boolean);

  const tabClass = (tab: Tab) =>
    `px-5 py-2 rounded-full text-sm font-medium transition ${
      activeTab === tab
        ? "bg-white text-neutral-900 shadow-sm border border-neutral-200"
        : "text-neutral-500 hover:text-neutral-800"
    }`;

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-serif text-4xl text-neutral-900 mb-1">Profile</h1>
        <p className="text-neutral-500">Manage your profile and preferences</p>
      </header>

      <div className="inline-flex items-center gap-1 bg-neutral-100 rounded-full p-1 mb-6">
        <button type="button" className={tabClass("profile")} onClick={() => setActiveTab("profile")}>
          Profile
        </button>
        <button type="button" className={tabClass("notifications")} onClick={() => setActiveTab("notifications")}>
          Notifications
        </button>
        <button type="button" className={tabClass("verification")} onClick={() => setActiveTab("verification")}>
          Verification
        </button>
      </div>

      {activeTab === "profile" && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="relative mb-16">
            <div className="h-44 w-full rounded-xl overflow-hidden bg-neutral-200">
              {bannerPreview ? (
                <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300" />
              )}
              <input
                type="file"
                id="bannerUpload"
                accept=".png, .jpg, .jpeg"
                onChange={(e) => handleFileUpload(e, setBannerPreview)}
                hidden
              />
              <label
                htmlFor="bannerUpload"
                className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-white/90 hover:bg-white rounded-full cursor-pointer shadow"
              >
                <Camera className="w-4 h-4 text-neutral-700" />
              </label>
            </div>

            <div className="absolute left-6 -bottom-10">
              <div className="relative w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-neutral-100">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                    No photo
                  </div>
                )}
              </div>
              <input
                type="file"
                id="avatarUpload"
                accept=".png, .jpg, .jpeg"
                onChange={(e) => handleFileUpload(e, setAvatarPreview)}
                hidden
              />
              <label
                htmlFor="avatarUpload"
                className="absolute bottom-0 right-0 w-7 h-7 flex items-center justify-center bg-gold text-white rounded-full cursor-pointer shadow"
              >
                <Camera className="w-3.5 h-3.5" />
              </label>
            </div>
          </div>

          <div className="mb-6 pl-1">
            <h3 className="text-lg font-semibold text-neutral-900">
              {formData.name || "Your business"}
            </h3>
            {subtitleParts.length > 0 && (
              <p className="text-sm text-neutral-500">{subtitleParts.join(" · ")}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-800 mb-2">
                Business Name
              </label>
              <input
                type="text"
                id="name"
                className="w-full border border-neutral-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/40"
                placeholder="Enter business name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-neutral-800 mb-2">
                Contact Name
              </label>
              <input
                type="text"
                id="contactName"
                className="w-full border border-neutral-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/40"
                placeholder="Enter contact name"
                value={formData.contactName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-800 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full border border-neutral-200 rounded-lg px-4 py-2.5 bg-neutral-50 text-neutral-500 cursor-not-allowed"
                value={formData.email}
                readOnly
                disabled
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-800 mb-2">
                Phone
              </label>
              <input
                type="text"
                id="phone"
                className="w-full border border-neutral-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/40"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="serviceArea" className="block text-sm font-medium text-neutral-800 mb-2">
              Service Area
            </label>
            <input
              type="text"
              id="serviceArea"
              className="w-full border border-neutral-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/40"
              placeholder="e.g. London, ON"
              value={formData.serviceArea}
              onChange={handleChange}
            />
          </div>

          {/* Warranty — vendor-level. When enabled, the terms are attached to
              all of this vendor's offers so homeowners can see them. */}
          <div className="mb-6 border border-neutral-200 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.providesWarranty}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, providesWarranty: e.target.checked }))
                }
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-gold focus:ring-gold"
              />
              <span className="text-sm">
                <span className="block font-medium text-neutral-800">I offer a warranty on my work</span>
                <span className="block text-neutral-500">
                  Shown to homeowners with every offer you submit.
                </span>
              </span>
            </label>

            {formData.providesWarranty && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-neutral-800 mb-2">
                  Warranty length
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    id="warrantyAmount"
                    min={1}
                    className="w-24 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                    value={formData.warrantyAmount}
                    onChange={handleChange}
                  />
                  <select
                    id="warrantyUnit"
                    className="border border-neutral-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 bg-white"
                    value={formData.warrantyUnit}
                    onChange={handleChange}
                  >
                    {WARRANTY_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  Homeowners will see "{formatWarranty(formData.warrantyAmount, formData.warrantyUnit)} warranty" on your offers.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isUpdating || !isChanged}
              className="bg-gold hover:bg-gold-600 text-white text-sm font-medium px-6 py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>
            {isChanged && (
              <button
                type="button"
                onClick={handleCancel}
                className="border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-medium px-6 py-2.5 rounded-lg"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {activeTab === "notifications" && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-8">
          <h3 className="text-lg font-semibold text-neutral-900 mb-1">Notifications</h3>
          <p className="text-sm text-neutral-500">We are working on it!</p>
        </div>
      )}

      {activeTab === "verification" && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Verification</h3>
          <div className="mb-5">
            <p className="text-sm font-medium text-neutral-800 mb-2">Status</p>
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                vendorData?.verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {vendorData?.verified ? "Verified" : "Pending Verification"}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="businessType" className="block text-sm font-medium text-neutral-800 mb-2">
                Business Type
              </label>
              <select
                id="businessType"
                className="w-full border border-neutral-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/40"
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
            <div>
              <label htmlFor="license" className="block text-sm font-medium text-neutral-800 mb-2">
                License Number
              </label>
              <input
                type="text"
                id="license"
                className="w-full border border-neutral-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/40"
                placeholder="Enter license number"
                value={formData.license}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorProfileSettings;
