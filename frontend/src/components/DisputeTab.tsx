import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
  useCreateDisputeAttachmentMutation,
  useCreateDisputeMessageMutation,
  useCreateDisputeMutation,
  useGetDisputeDetailsByIssueOfferIdQuery,
  useGetDisputesByIssueOfferIdQuery,
} from "../features/api/issueDisputesApi";
import { DisputeDetailItem } from "../types";

interface DisputeTabProps {
  issueOfferId?: number;
  userType?: string;
  className?: string;
  isOfferLoading?: boolean;
}

const formatDate = (isoString: string) => {
  const date = new Date(isoString + "Z");
  return date.toLocaleString("en-US", {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const normalizeStatusLabel = (status?: string) => {
  if (!status) return "Unknown";
  const cleaned = status
    .toLowerCase()
    .replace("dispute_status.", "")
    .replace("status.", "")
    .replace(/_/g, " ")
    .trim();
  if (!cleaned) return status;
  return cleaned.replace(/\b\w/g, (m) => m.toUpperCase());
};

const statusClasses = (status?: string) => {
  const cleaned = status
    ?.toLowerCase()
    .replace("dispute_status.", "")
    .replace("status.", "")
    .replace(/_/g, " ")
    .trim();
  if (cleaned === "open") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (cleaned === "pending") {
    return "bg-amber-100 text-amber-700";
  }
  if (cleaned === "resolved" || cleaned === "closed") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (cleaned === "rejected" || cleaned === "denied") {
    return "bg-red-100 text-red-700";
  }
  return "bg-gray-100 text-gray-700";
};

const isImageUrl = (url: string) =>
  /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(url);

const getAttachmentLabel = (url: string) => {
  try {
    const clean = url.split("?")[0];
    const name = clean.split("/").pop() || "Attachment";
    return decodeURIComponent(name);
  } catch {
    return "Attachment";
  }
};

const formatUserType = (userType?: string) => {
  if (!userType) return "User";
  return userType.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
};

const normalizeUserType = (userType?: string) => {
  if (!userType) return "";
  return userType
    .replace(/user_type\./i, "")
    .replace(/usertype\./i, "")
    .toLowerCase();
};

const DisputeTab: React.FC<DisputeTabProps> = ({
  issueOfferId,
  userType,
  className,
  isOfferLoading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [createdDisputeId, setCreatedDisputeId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: disputes = [],
    isLoading: disputesLoading,
    error: disputesError,
    refetch: refetchDisputes,
  } = useGetDisputesByIssueOfferIdQuery(issueOfferId!, {
    skip: !issueOfferId,
  });

  const activeDispute = useMemo(() => {
    if (disputes.length === 0) return null;
    return [...disputes].sort(
      (a, b) =>
        new Date(b.created_at + "Z").getTime() -
        new Date(a.created_at + "Z").getTime()
    )[0];
  }, [disputes]);

  const disputeId = createdDisputeId ?? activeDispute?.id ?? null;

  const {
    data: disputeDetails,
    isLoading: detailsLoading,
    error: detailsError,
    refetch: refetchDetails,
  } = useGetDisputeDetailsByIssueOfferIdQuery(issueOfferId!, {
    skip: !issueOfferId || !disputeId,
  });

  const [createDispute] = useCreateDisputeMutation();
  const [createDisputeMessage] = useCreateDisputeMessageMutation();
  const [createDisputeAttachment] = useCreateDisputeAttachmentMutation();

  useEffect(() => {
    setMessage("");
    setPendingFiles([]);
    setCreatedDisputeId(null);
  }, [issueOfferId]);

  const hasDispute = Boolean(disputeId);
  const items = useMemo(() => {
    const raw = disputeDetails?.items ?? [];
    return [...raw].sort(
      (a, b) =>
        new Date(a.created_at + "Z").getTime() -
        new Date(b.created_at + "Z").getTime()
    );
  }, [disputeDetails?.items]);
  const statusLabel =
    detailsLoading && !disputeDetails
      ? "Loading..."
      : normalizeStatusLabel(disputeDetails?.status);
  const statusClass =
    detailsLoading && !disputeDetails
      ? "bg-gray-100 text-gray-500"
      : statusClasses(disputeDetails?.status);

  const canSubmit =
    message.trim().length > 0 &&
    !isSubmitting &&
    Boolean(userType);

  const handleAddAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setPendingFiles((prev) => [...prev, ...files]);
    event.target.value = "";
  };

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const submitDispute = async () => {
    if (!issueOfferId || !userType || !canSubmit) return;
    const normalizedUserType = normalizeUserType(userType);
    if (!normalizedUserType) {
      toast.error("User type is missing. Please refresh and try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      let activeDisputeId = disputeId;
      if (!activeDisputeId) {
        const created = await createDispute({
          issueOfferId,
          statusMessage: "Dispute opened",
        }).unwrap();
        activeDisputeId = created?.id;
        if (!activeDisputeId) throw new Error("Dispute could not be created.");
        setCreatedDisputeId(activeDisputeId);
      }

      await createDisputeMessage({
        issueDisputeId: activeDisputeId,
        issueOfferId,
        message: message.trim(),
        userType: normalizedUserType,
      }).unwrap();

      if (pendingFiles.length > 0) {
        await Promise.all(
          pendingFiles.map((file) =>
            createDisputeAttachment({
              issueDisputeId: activeDisputeId!,
              issueOfferId,
              file,
              userType: normalizedUserType,
            }).unwrap()
          )
        );
      }

      setMessage("");
      setPendingFiles([]);
      await refetchDisputes();
      if (disputeId || activeDisputeId) {
        await refetchDetails();
      }
    } catch (err: any) {
      console.error("Failed to submit dispute", err);
      const detail = err?.data?.detail || err?.error || err?.message;
      toast.error(detail || "Unable to submit dispute. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItem = (item: DisputeDetailItem, index: number) => {
    const isCurrentUser =
      normalizeUserType(item.user_type) === normalizeUserType(userType);
    const alignmentClass = isCurrentUser ? "justify-end" : "justify-start";
    const bubbleClass = isCurrentUser
      ? "bg-blue-100 text-blue-900 border-blue-200"
      : "bg-gray-50 text-gray-700 border-gray-200";
    const metaClass = isCurrentUser ? "text-blue-600" : "text-gray-500";

    if (item.type === "message") {
      return (
        <div key={`message-${item.created_at}-${index}`} className={`flex ${alignmentClass}`}>
          <div className={`w-[75%] rounded-2xl border p-3 ${bubbleClass}`}>
            <div className={`flex items-center justify-between text-[11px] mb-2 ${metaClass}`}>
              <span className="font-semibold uppercase tracking-wide">
                {formatUserType(item.user_type)}
              </span>
              <span>{formatDate(item.created_at)}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{item.message}</p>
          </div>
        </div>
      );
    }

    const attachmentLabel = getAttachmentLabel(item.attachment_url);
    const image = isImageUrl(item.attachment_url);

    return (
      <div key={`attachment-${item.created_at}-${index}`} className={`flex ${alignmentClass}`}>
        <div className={`w-[75%] rounded-2xl border p-3 ${bubbleClass}`}>
          <div className={`flex items-center justify-between text-[11px] mb-2 ${metaClass}`}>
            <span className="font-semibold uppercase tracking-wide">
              {formatUserType(item.user_type)}
            </span>
            <span>{formatDate(item.created_at)}</span>
          </div>
          <div className="flex flex-col gap-3">
            {image ? (
              <img
                src={item.attachment_url}
                alt={attachmentLabel}
                className="max-h-64 w-full rounded-md object-cover"
              />
            ) : (
              <div className="flex items-center justify-between rounded-md border border-dashed border-gray-300 bg-white px-3 py-2 text-sm text-gray-600">
                <span className="truncate">{attachmentLabel}</span>
                <span className="text-xs uppercase text-gray-400">File</span>
              </div>
            )}
            <a
              href={item.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Open attachment
            </a>
          </div>
        </div>
      </div>
    );
  };

  if (isOfferLoading) {
    return (
      <div className={className}>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-600">Loading dispute details...</p>
        </div>
      </div>
    );
  }

  if (!issueOfferId) {
    return (
      <div className={className}>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-600">
            Disputes are available after an offer is accepted.
          </p>
        </div>
      </div>
    );
  }

  if (disputesLoading) {
    return (
      <div className={className}>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-600">Loading dispute details...</p>
        </div>
      </div>
    );
  }

  if (disputesError && !hasDispute) {
    return (
      <div className={className}>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-red-600">Unable to load dispute status.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col min-h-[60vh] max-h-[70vh]">
        {!hasDispute && (
          <>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Dispute the work done on this issue
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Explain why you’re disputing this completed work. This will be reviewed and shared with the vendor.
            </p>
          </>
        )}

        {hasDispute && (
          <div className="mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase text-gray-500">Status</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}
              >
                {statusLabel}
              </span>
            </div>
            {disputeDetails?.status_message &&
              disputeDetails.status_message.trim().toLowerCase() !== "dispute opened" && (
                <p className="mt-2 text-sm text-gray-600">
                  {disputeDetails.status_message}
                </p>
              )}
          </div>
        )}

        {hasDispute && (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-2 mb-4">
            {detailsLoading ? (
              <p className="text-sm text-gray-500">Loading dispute activity...</p>
            ) : detailsError ? (
              <p className="text-sm text-red-600">Unable to load dispute activity.</p>
            ) : items.length > 0 ? (
              items.map(renderItem)
            ) : (
              <p className="text-sm text-gray-500">No dispute activity yet.</p>
            )}
          </div>
        )}

        <div className="mt-auto space-y-4 border-t border-gray-100 pt-4 bg-white">
          <div>
            <textarea
              placeholder={hasDispute ? "Add a message..." : "Describe the issue..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="w-full min-h-[72px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase text-gray-700 mb-2">
              Attachments
            </h4>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAddAttachment}
                className="px-3 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Add files
              </button>
              <span className="text-sm text-gray-500">
                {pendingFiles.length > 0
                  ? `${pendingFiles.length} selected`
                  : "No files selected"}
              </span>
            </div>
            {pendingFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {pendingFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
                  >
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePendingFile(index)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700"
                      disabled={isSubmitting}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={submitDispute}
              className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {hasDispute ? "Send Update" : "Submit Dispute"}
            </button>
          </div>
        </div>
      </div>

      <input
        type="file"
        accept="image/*, .pdf, .doc, .docx"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default DisputeTab;
