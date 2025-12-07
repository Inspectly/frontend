// src/components/CreateIssueModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCreateIssueMutation } from "../features/api/issuesApi";
import { useGetVendorTypesQuery } from "../features/api/vendorTypesApi";
import type { IssueStatus } from "../types";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { handleCreateIssueWithImage } from "../utils/issueUtil";

type IssueCollection = { id: number; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  issueCollections: IssueCollection[];
};

const CreateIssueModal: React.FC<Props> = ({
  open,
  onClose,
  onCreated,
  issueCollections,
}) => {
  const { data: fetchedVendorTypes } = useGetVendorTypesQuery();
  const [createIssue, { isLoading }] = useCreateIssueMutation();
  const userId = useSelector((state: RootState) => state.auth.user?.id);

  // NOTE: no default auto-select; user must choose a collection
  const [formData, setFormData] = useState<{
    report_id?: number;
    type: string;
    description: string;
    summary: string;
    severity: string;
    status: IssueStatus | string;
    active: boolean;
    image_url: string;
  }>({
    report_id: undefined,
    type: "",
    description: "",
    summary: "",
    severity: "",
    status: "open",           // ✅ default to "open"
    active: true,
    image_url: "",
  });

  // Ensure status defaults to "open" whenever the modal opens (in case it was cleared previously)
  useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        status: prev.status || "open",
      }));
    }
  }, [open]);

  const [selectedFileName, setSelectedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const statusOptions = useMemo(
    () => [
      { value: "open", label: "Open" },
      { value: "in_progress", label: "In-progress" },
      { value: "review", label: "Review" },
      { value: "completed", label: "Completed" },
    ],
    []
  );

  if (!open) return null;

  const handleFieldChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "report_id") {
      setFormData((prev) => ({
        ...prev,
        report_id: value ? Number(value) : undefined,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    
    // Create preview for UI
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        setFormData((prev) => ({
          ...prev,
          image_url: reader.result as string, // Keep for preview only
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const canSubmit =
    !!formData.report_id &&
    !!formData.type &&
    !!formData.summary &&
    !!formData.description &&
    !!formData.severity &&
    !!formData.status &&
    !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !formData.report_id || !userId) return;

    // Store the file from the input
    const imageFile = fileInputRef.current?.files?.[0] || null;

    try {
      await handleCreateIssueWithImage({
        formData: {
          ...formData,
          image_file: imageFile,
        },
        reportId: formData.report_id,
        userId: userId, // Pass userId
        createIssue,
        refetch: onCreated,
        onClose,
      });

      // Reset form
      setFormData({
        report_id: undefined,
        type: "",
        description: "",
        summary: "",
        severity: "",
        status: "open",
        active: true,
        image_url: "",
      });
      setSelectedFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Failed to create issue:", err);
      // Error handling is done in the util function
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-xl rounded-xl shadow-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-3xl font-light text-gray-600 hover:text-gray-800"
          aria-label="Close"
          type="button"
        >
          &times;
        </button>

        <h6 className="text-lg font-semibold mb-4">Create New Issue</h6>

        <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-4">
          {/* Issue Collection (no auto-select) */}
          <div className="relative col-span-12">
            <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
              Issue Collection
            </label>
            <select
              name="report_id"
              className="w-full rounded-lg cursor-pointer border border-gray-300 bg-white px-5 py-2.5 appearance-none"
              value={formData.report_id ?? ""}
              onChange={handleFieldChange}
              required
              disabled={isLoading}
            >
              <option value="" disabled>
                Select Issue Collection
              </option>
              {issueCollections.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 top-8 right-4 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
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
                  {option.vendor_type}
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
          <div className="relative col-span-6">
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

          {/* Status */}
          <div className="relative col-span-6">
            <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
              Status
            </label>
            <select
              name="status"
              className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 cursor-pointer appearance-none"
              value={formData.status}
              onChange={handleFieldChange}
              required
              disabled={isLoading}
            >
              {/* No placeholder; "open" is already selected by default */}
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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

          {/* Image Upload (optional) */}
          <div className="col-span-12">
            <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
              Upload Image
            </label>
            <div className="flex w-full">
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-gray-800 text-white text-sm px-4 py-2 rounded-l-lg flex items-center whitespace-nowrap"
              >
                Choose File
              </label>
              <span className="border border-l-0 border-gray-300 bg-white text-base px-5 py-2.5 rounded-r-lg w-full flex items-center">
                {selectedFileName || "No file chosen"}
              </span>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFileName(file.name);
                    handleImageUpload(e);
                  }
                }}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="col-span-12">
            <button
              type="submit"
              className="btn bg-emerald-500 text-white py-2 px-6 rounded-lg hover:bg-emerald-600 disabled:opacity-60"
              disabled={!canSubmit}
            >
              {isLoading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateIssueModal;
