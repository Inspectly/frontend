// src/components/CreateIssueModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCreateIssueMutation } from "../features/api/issuesApi";
import { useGetVendorTypesQuery } from "../features/api/vendorTypesApi";
import type { IssueStatus } from "../types";
import { toast } from "react-hot-toast";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";

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


  const [selectedFileName, setSelectedFileName] = useState("");
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

    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        setFormData((prev) => ({
          ...prev,
          image_url: reader.result as string, // base64 preview only
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
    !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !formData.report_id) return;

    try {
      await createIssue({
        report_id: formData.report_id,
        type: formData.type,
        summary: formData.summary,
        description: formData.description,
        severity: formData.severity,
        status: "open" as IssueStatus,
        active: formData.active,
        image_url: formData.image_url,
      }).unwrap();

      toast.success("Issue created");
      onCreated?.();

      // reset form & close
      setFormData({
        report_id: undefined,
        type: "",
        description: "",
        summary: "",
        severity: "",
        status: "open",    // ✅ keep default for next open
        active: true,
        image_url: "",
      });
      setSelectedFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      onClose();
    } catch (err) {
      console.error("Failed to create issue:", err);
      toast.error("Failed to create issue");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-xl max-h-[calc(100vh-2rem)] rounded-xl shadow-lg flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h6 className="text-lg font-semibold">Create New Issue</h6>
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
