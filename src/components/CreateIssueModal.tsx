// src/components/CreateIssueModal.tsx
import React, { useRef, useState } from "react";
import { useCreateIssueMutation } from "../features/api/issuesApi";
import { useCreateReportMutation } from "../features/api/reportsApi";
import { useCreateListingMutation } from "../features/api/listingsApi";
import { useGetVendorTypesQuery } from "../features/api/vendorTypesApi";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import type { IssueStatus, IssueType, Listing, ReportType } from "../types";
import { toast } from "react-hot-toast";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (issue: IssueType) => void;
  listings: Listing[];
  reports: ReportType[];
};

const CreateIssueModal: React.FC<Props> = ({
  open,
  onClose,
  onCreated,
  listings,
  reports,
}) => {
  const { data: fetchedVendorTypes } = useGetVendorTypesQuery();
  const [createIssue, { isLoading }] = useCreateIssueMutation();
  const [createReport] = useCreateReportMutation();
  const [createListing] = useCreateListingMutation();
  const user = useSelector((state: RootState) => state.auth.user);

  const [formData, setFormData] = useState<{
    listing_id?: number;
    type: string;
    description: string;
    summary: string;
    severity: string;
    status: IssueStatus | string;
    active: boolean;
  }>({
    listing_id: undefined,
    type: "",
    description: "",
    summary: "",
    severity: "",
    status: "open",
    active: true,
  });

  // "Add new address" inline form
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ address: "", city: "", state: "", country: "Canada", postal_code: "" });
  const [isCreatingListing, setIsCreatingListing] = useState(false);
  const [localListings, setLocalListings] = useState<Listing[]>([]); // Newly created listings not yet in parent prop

  // Store actual File objects and lightweight blob URLs for preview (not base64)
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  const handleFieldChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "listing_id") {
      if (value === "__new__") {
        setShowNewAddress(true);
        setFormData((prev) => ({ ...prev, listing_id: undefined }));
      } else {
        setShowNewAddress(false);
        setFormData((prev) => ({ ...prev, listing_id: value ? Number(value) : undefined }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const newPreviewUrls = newFiles.map((f) => URL.createObjectURL(f));

    setImageFiles((prev) => [...prev, ...newFiles]);
    setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  };

  // Convert File objects to base64 only at submit time
  const filesToBase64 = (files: File[]): Promise<string[]> => {
    return Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          })
      )
    );
  };

  // Find or create a "My Posted Jobs" report for manual issue creation
  // Never assign manual issues to extraction reports
  const getOrCreateReportId = async (listingId: number): Promise<number> => {
    // Look specifically for a "My Posted Jobs" or "Jobs" report
    const jobsReport = reports.find((r) => {
      if (r.listing_id !== listingId) return false;
      const name = (r.name || "").toLowerCase();
      return name === "my posted jobs" || name === "jobs";
    });
    if (jobsReport) return jobsReport.id;

    // None found — create a new "My Posted Jobs" collection
    const listing = listings.find((l) => l.id === listingId) || localListings.find((l) => l.id === listingId);
    const newReport = await createReport({
      listing_id: listingId,
      user_id: listing?.user_id,
      name: "My Posted Jobs",
    }).unwrap();
    return newReport.id;
  };

  // Create a new listing from inline address form
  const handleCreateNewListing = async () => {
    if (!newAddress.address.trim() || !newAddress.city.trim() || !newAddress.state.trim()) {
      toast.error("Please fill in address, city, and province/state");
      return;
    }
    // Show saving state but don't block — save optimistically
    setIsCreatingListing(true);
    const savedAddress = { ...newAddress };
    setShowNewAddress(false);
    setNewAddress({ address: "", city: "", state: "", country: "Canada", postal_code: "" });

    try {
      const created = await createListing({
        ...savedAddress,
        user_id: user?.id,
      }).unwrap();
      if (created?.id) {
        const fullListing: Listing = {
          id: created.id,
          user_id: user?.id || 0,
          address: savedAddress.address,
          city: savedAddress.city,
          state: savedAddress.state,
          country: savedAddress.country,
          postal_code: savedAddress.postal_code,
          image_url: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setLocalListings((prev) => [...prev, fullListing]);
        setFormData((prev) => ({ ...prev, listing_id: created.id }));
        toast.success("Property added!");
      }
    } catch (e) {
      console.error("Failed to create listing:", e);
      toast.error("Failed to add property. Please try again.");
      setShowNewAddress(true);
      setNewAddress(savedAddress);
    } finally {
      setIsCreatingListing(false);
    }
  };

  const canSubmit =
    !!formData.listing_id &&
    !!formData.type &&
    !!formData.summary &&
    !!formData.description &&
    !!formData.severity &&
    !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !formData.listing_id) return;

    try {
      const severityMap: Record<string, string> = {
        low: "Low",
        medium: "Medium",
        high: "High",
      };

      // Auto-find or create a "My Posted Jobs" report for this listing
      const reportId = await getOrCreateReportId(formData.listing_id);

      // Convert files to base64 only now (at submit time)
      const base64Images = await filesToBase64(imageFiles);

      const submittedData: any = {
        report_id: reportId,
        listing_id: formData.listing_id,
        type: formData.type,
        summary: formData.summary,
        description: formData.description,
        severity: severityMap[formData.severity.toLowerCase()] || "None",
        status: "open" as IssueStatus,
        active: formData.active,
        image_urls: base64Images as any, // Backend expects array
      };
      const apiResponse = await createIssue(submittedData).unwrap();

      // Normalize status to frontend format
      const rawStatus = (apiResponse.status || "open") as string;
      const normalizedStatus = rawStatus.startsWith("Status.")
        ? rawStatus
        : `Status.${rawStatus.toUpperCase()}`;

      // Use blob URLs for instant preview if backend didn't return image URLs
      const effectiveImageUrls = apiResponse.image_urls
        || (imagePreviewUrls.length === 1 ? imagePreviewUrls[0] : imagePreviewUrls.length > 1 ? JSON.stringify(imagePreviewUrls) : "");

      const fullIssue: IssueType = {
        ...submittedData,
        ...apiResponse,
        status: normalizedStatus as IssueStatus,
        image_urls: effectiveImageUrls,
      } as IssueType;

      toast.success("Issue created");
      onCreated?.(fullIssue);

      // reset form & close
      setFormData({
        listing_id: undefined,
        type: "",
        description: "",
        summary: "",
        severity: "",
        status: "open",
        active: true,
      });
      setImageFiles([]);
      setImagePreviewUrls([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onClose();
    } catch (err: any) {
      console.error("Failed to create issue:", err);
      const errorMsg = err?.data?.detail?.[0]?.msg || "Failed to create issue";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-xl max-h-[calc(100vh-2rem)] rounded-xl shadow-lg flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h6 className="text-lg font-semibold">Post a Job</h6>
          <button
            onClick={onClose}
            className="text-2xl font-light text-gray-600 hover:text-gray-800 leading-none"
            aria-label="Close"
            type="button"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <div className="grid grid-cols-12 gap-4">
          {/* Property Address (required) */}
          <div className="relative col-span-12">
            <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
              Property
            </label>
            {!showNewAddress ? (
              <>
                <select
                  name="listing_id"
                  className="w-full rounded-lg cursor-pointer border border-gray-300 bg-white px-5 py-2.5 appearance-none"
                  value={formData.listing_id ?? ""}
                  onChange={handleFieldChange}
                  required
                  disabled={isLoading}
                >
                  <option value="" disabled>
                    Select a property
                  </option>
                  {/* Existing + locally created listings */}
                  {[...listings, ...localListings.filter((ll) => !listings.find((l) => l.id === ll.id))].map((listing) => (
                    <option key={listing.id} value={listing.id}>
                      {listing.address}, {listing.city}, {listing.state}
                    </option>
                  ))}
                  <option value="__new__">+ Add new address</option>
                </select>
                <div className="absolute inset-y-0 top-8 right-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </>
            ) : (
              <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                <input
                  type="text"
                  placeholder="Street address"
                  value={newAddress.address}
                  onChange={(e) => setNewAddress((p) => ({ ...p, address: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress((p) => ({ ...p, city: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Province / State"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress((p) => ({ ...p, state: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Postal code"
                    value={newAddress.postal_code}
                    onChange={(e) => setNewAddress((p) => ({ ...p, postal_code: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Country"
                    value={newAddress.country}
                    onChange={(e) => setNewAddress((p) => ({ ...p, country: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCreateNewListing}
                    disabled={isCreatingListing}
                    className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50"
                  >
                    {isCreatingListing ? "Saving..." : "Save Address"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowNewAddress(false); setNewAddress({ address: "", city: "", state: "", country: "Canada", postal_code: "" }); }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Type */}
          <div className="relative col-span-12">
            <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
              Type
            </label>
            <select
              name="type"
              className="w-full rounded-lg cursor-pointer border border-gray-300 bg-white px-5 py-2.5 appearance-none"
              value={formData.type}
              onChange={handleFieldChange}
              required
              disabled={isLoading}
            >
              <option value="" disabled hidden>
                Select an issue type
              </option>
              {fetchedVendorTypes?.map((option) => (
                <option key={option.id} value={option.vendor_type}>
                  {normalizeAndCapitalize(option.vendor_type)}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 top-8 right-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none"
                   viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          </div>

          {/* Summary */}
          <div className="col-span-12">
            <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
              Summary
            </label>
            <input
              type="text"
              name="summary"
              className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5"
              placeholder="Short summary"
              value={formData.summary}
              onChange={handleFieldChange}
              required
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="col-span-12">
            <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
              Description
            </label>
            <textarea
              name="description"
              className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5"
              placeholder="Detailed description"
              value={formData.description}
              onChange={handleFieldChange}
              required
              disabled={isLoading}
            />
          </div>

          {/* Severity */}
          <div className="relative col-span-12">
            <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
              Severity
            </label>
            <select
              name="severity"
              className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 cursor-pointer appearance-none"
              value={formData.severity}
              onChange={handleFieldChange}
              required
              disabled={isLoading}
            >
              <option value="" disabled hidden>
                Select a severity
              </option>
              {["low", "medium", "high"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 top-8 right-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none"
                   viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          </div>

          {/* Active */}
          <div className="col-span-12">
            <label className="inline-flex items-center space-x-2 text-sm leading-5 font-semibold text-gray-600">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleFieldChange}
                className="form-checkbox h-4 w-4 text-blue-600"
                disabled={isLoading}
              />
              <span>Active</span>
            </label>
          </div>

          {/* Image Upload (optional, multiple) */}
          <div className="col-span-12">
            <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
              Upload Images
            </label>
            <div className="flex w-full">
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-gray-800 text-white text-sm px-4 py-2 rounded-l-lg flex items-center whitespace-nowrap"
              >
                Choose Files
              </label>
              <span className="border border-l-0 border-gray-300 bg-white text-sm px-5 py-2.5 rounded-r-lg w-full flex items-center truncate">
                {imageFiles.length > 0
                  ? `${imageFiles.length} file${imageFiles.length > 1 ? "s" : ""} selected`
                  : "No files chosen"}
              </span>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  handleImageUpload(e);
                }}
                disabled={isLoading}
              />
            </div>
            {/* Image previews using lightweight blob URLs */}
            {imagePreviewUrls.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                {imagePreviewUrls.map((url, idx) => (
                  <div key={idx} className="relative flex-shrink-0">
                    <img
                      src={url}
                      alt={`Preview ${idx + 1}`}
                      className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(url);
                        setImageFiles((prev) => prev.filter((_, i) => i !== idx));
                        setImagePreviewUrls((prev) => prev.filter((_, i) => i !== idx));
                      }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Submit - Fixed footer */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <button
            type="submit"
            form="create-issue-form"
            className="btn bg-emerald-500 text-white py-2 px-6 rounded-lg hover:bg-emerald-600 disabled:opacity-60"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isLoading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateIssueModal;
