import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCreateReportMutation,
  useUploadReportFileMutation,
} from "../features/api/reportsApi";
import toast from "react-hot-toast";

type Mode = "CHOOSE" | "UPLOAD_AI" | "MANUAL";

type Props = {
  open: boolean;
  onClose: () => void;

  // required for API + routing
  listingId: number;
  userId?: number;

  // lets parent refetch on success
  onCreated?: () => void;
};

const CreateIssueCollectionModal: React.FC<Props> = ({
  open,
  onClose,
  listingId,
  userId,
  onCreated,
}) => {
  const navigate = useNavigate();

  // RTK mutations
  const [createReport, { isLoading: creating }] = useCreateReportMutation();
  const [uploadReportFile, { isLoading: uploading }] =
    useUploadReportFileMutation();

  // local state
  const [mode, setMode] = useState<Mode>("CHOOSE");

  // manual flow
  const [manualName, setManualName] = useState("");

  // upload flow
  const [file, setFile] = useState<File | null>(null);
  const [autoName, setAutoName] = useState(true);
  const [customName, setCustomName] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const busy = creating || uploading;

  const resetAll = () => {
    setMode("CHOOSE");
    setManualName("");
    setFile(null);
    setAutoName(true);
    setCustomName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const humanReadableFromFile = (f: File | null) =>
    f ? f.name.replace(/\.[^/.]+$/, "").trim() : "";

  if (!open) return null;

  /* ----------------- submit: manual ----------------- */
  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !listingId) return;
    if (!manualName.trim()) return;

    try {
      const toastId = toast.loading("Creating collection...");
      const created = await createReport({
        user_id: Number(userId),
        listing_id: Number(listingId),
        name: manualName.trim(),
      }).unwrap();

      const newId = created?.id ?? null;
      toast.success("Collection created successfully!", { id: toastId });
      onCreated?.(); // refresh grid in parent
      resetAll();

      // Navigate directly to the new report page
      if (newId) {
        navigate(`/listings/${listingId}/reports/${newId}`, {
          state: { report: created, openCreateIssue: true },
          replace: false,
        });
      } else {
        handleClose();
      }
    } catch (err) {
      console.error("Manual create failed:", err);
      toast.error("Failed to create collection.");
    }
  };

  /* ----------------- submit: upload ----------------- */
  const submitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !listingId) return;
    if (!file) return;

    try {
      const toastId = toast.loading("Sending report for extraction...");
      const inferredName = autoName
        ? humanReadableFromFile(file) || "AI Issue Collection"
        : customName.trim() || "Inspection Report";

      // Build FormData to match reportUtil.ts (which is working)
      const fd = new FormData();
      fd.append("user_id", String(userId));
      fd.append("listing_id", String(listingId));
      fd.append("name", inferredName);
      fd.append("property_report", file);

      await uploadReportFile(fd).unwrap();

      toast.success("Report received. Our AI model has started extracting issues.", {
        id: toastId,
      });

      onCreated?.(); // refresh list
      handleClose(); // stay on the same page, just close modal
    } catch (err) {
      console.error("Upload create failed:", err);
      toast.error("Failed to upload report for extraction.");
    }
  };

  /* ----------------- UI blocks ----------------- */
  const ChooseBlock = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => setMode("UPLOAD_AI")}
        className="border rounded-xl p-5 text-left hover:shadow-md transition bg-white"
      >
        <div className="text-lg font-semibold mb-1 whitespace-nowrap">
          Upload Inspection Report
        </div>
        <p className="text-sm text-gray-600">
          Drop your home inspection report PDF. Inspectly&apos;s AI will create
          the Issue Collection for you.
        </p>
      </button>
      <button
        type="button"
        onClick={() => setMode("MANUAL")}
        className="border rounded-xl p-5 text-left hover:shadow-md transition bg-white"
      >
        <div className="text-lg font-semibold mb-1 whitespace-nowrap">
          Create Manually
        </div>
        <p className="text-sm text-gray-600">
          Name your issue collection and add issues yourself.
        </p>
      </button>
    </div>
  );

  const UploadBlock = (
    <form onSubmit={submitUpload} className="grid grid-cols-12 gap-4">
      <div
        className="col-span-12 border-2 border-dashed rounded-xl p-6 text-center bg-gray-50 hover:bg-gray-100 transition"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const f = e.dataTransfer.files?.[0];
          if (f) setFile(f);
        }}
      >
        <p className="text-sm text-gray-600">
          Drag &amp; drop your <b>inspection report</b> here PDF, or{" "}
          <button
            type="button"
            className="text-blue-600 underline"
            onClick={() => fileInputRef.current?.click()}
          >
            browse
          </button>
          .
        </p>
        <p className="mt-3 text-sm">
          {file ? (
            <>
              Selected: <span className="font-medium">{file.name}</span>
            </>
          ) : (
            <span className="text-gray-500 text-xs">No file selected</span>
          )}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            if (f) setFile(f);
          }}
        />
      </div>

      <div className="col-span-12">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={autoName}
            onChange={(e) => setAutoName(e.target.checked)}
            disabled={busy}
          />
          Auto-name from file (recommended)
        </label>
        {autoName && file && (
          <p className="text-xs text-gray-500 mt-1">
            Will use:{" "}
            <span className="font-medium">
              {humanReadableFromFile(file) || "AI Issue Collection"}
            </span>
          </p>
        )}
      </div>

      {!autoName && (
        <div className="col-span-12">
          <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
            Issue Collection Name
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5"
            placeholder="e.g., 123 Main St – Pre-Closing"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            disabled={busy}
          />
        </div>
      )}

      <div className="col-span-12 flex items-center justify-between pt-2">
        <button
          type="button"
          className="text-sm text-gray-600 hover:underline"
          onClick={() => setMode("CHOOSE")}
          disabled={busy}
        >
          ← Back
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn border border-neutral-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-neutral-100"
            onClick={handleClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            disabled={!file || busy || !userId || !listingId}
          >
            {busy ? "Uploading..." : "Upload Report"}
          </button>
        </div>
      </div>
    </form>
  );

  const ManualBlock = (
    <form onSubmit={submitManual} className="grid grid-cols-12 gap-4">
      <div className="col-span-12">
        <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
          Issue Collection Name
        </label>
        <input
          type="text"
          className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5"
          placeholder="e.g., Kitchen & Bath"
          value={manualName}
          onChange={(e) => setManualName(e.target.value)}
          required
          disabled={busy}
        />
      </div>

      <div className="col-span-12 flex items-center justify-between pt-2">
        <button
          type="button"
          className="text-sm text-gray-600 hover:underline"
          onClick={() => setMode("CHOOSE")}
          disabled={busy}
        >
          ← Back
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn border border-neutral-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-neutral-100"
            onClick={handleClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 disabled:opacity-60"
            disabled={!manualName.trim() || busy || !userId || !listingId}
          >
            {busy ? "Creating..." : "Create Collection"}
          </button>
        </div>
      </div>
    </form>
  );

  /* ----------------- render ----------------- */
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl md:max-w-3xl rounded-xl shadow-lg p-6 relative">
        <button
          onClick={handleClose}
          className="absolute top-2 right-4 text-3xl font-light text-gray-600 hover:text-gray-800"
          aria-label="Close"
          disabled={busy}
        >
          &times;
        </button>

        <h6 className="text-lg font-semibold mb-4">Add New Issue Collection</h6>

        {mode === "CHOOSE" && ChooseBlock}
        {mode === "UPLOAD_AI" && UploadBlock}
        {mode === "MANUAL" && ManualBlock}
      </div>
    </div>
  );
};

export default CreateIssueCollectionModal;
