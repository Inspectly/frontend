// src/components/ReportCard.tsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faTriangleExclamation,
  faSpinner,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

export type ReportStatus =
  | "NOT_STARTED"
  | "PENDING"
  | "IN_PROGRESS"
  | "FAILED"
  | "COMPLETED";

// If your report objects already include listing_id, keep this.
// Otherwise, pass listingId via props (see props below).
type ReportLite = {
  id: number;
  name?: string | null;
  is_reviewed?: boolean;
  listing_id?: number; // <— added (optional)
};

interface ReportCardProps {
  report: ReportLite;
  status: ReportStatus;
  isReviewed?: boolean;
  onOpen: () => void;
  onReview?: () => void;        // now optional; we'll still navigate
  onRetry?: () => void;
  listingId?: number;           // <— optional override if report.listing_id isn't present
}

const badgeFor = (status: ReportStatus, isReviewed?: boolean) => {
  if (status === "COMPLETED" && isReviewed) {
    return { label: "Reviewed", cls: "bg-emerald-100 text-emerald-700" };
  }
  switch (status) {
    case "COMPLETED":   return { label: "Needs review", cls: "bg-gray-200 text-gray-700" };
    case "IN_PROGRESS": return { label: "Extracting…",  cls: "bg-blue-100 text-blue-700" };
    case "PENDING":     return { label: "Pending",      cls: "bg-amber-100 text-amber-700" };
    case "FAILED":      return { label: "Failed",       cls: "bg-rose-100 text-rose-700" };
    default:            return { label: "Not started",  cls: "bg-gray-100 text-gray-700" };
  }
};

const visualFor = (status: ReportStatus) => {
  if (status === "PENDING") {
    return { icon: faClock, className: "text-amber-500", text: "Pending" };
  }
  if (status === "IN_PROGRESS") {
    return { icon: faSpinner, className: "text-blue-500 animate-spin", text: "Extracting…" };
  }
  if (status === "FAILED") {
    return { icon: faTriangleExclamation, className: "text-rose-500", text: "Failed" };
  }
  return { icon: faFileLines, className: "text-teal-500", text: null as string | null };
};

const ReportCard: React.FC<ReportCardProps> = ({
  report,
  status,
  isReviewed,
  onOpen,
  onReview,
  listingId, // optional
}) => {
  const navigate = useNavigate();

  const { label, cls } = badgeFor(status, isReviewed);
  const vis = visualFor(status);

  const needsReview = status === "COMPLETED" && !isReviewed;
  const canOpen     = status === "COMPLETED" && !!isReviewed;

  const isBlocked   = status === "PENDING" || status === "IN_PROGRESS" || status === "FAILED";
  const showActions = canOpen || needsReview;

  const handleReviewClick = () => {
    // call parent handler if provided
    if (onReview) onReview();

    // figure out listing id from prop or report object
    const lid = listingId ?? report.listing_id;
    if (!lid) {
      console.warn("ReportCard: listingId is missing; cannot navigate to review page.");
      return;
    }
    navigate(`/listings/${lid}/reports/${report.id}/review`);
  };

  return (
    <div
      onClick={() => { if (canOpen) onOpen(); }}
      className={[
        "group relative border border-neutral-200 rounded-2xl overflow-hidden bg-white transition",
        canOpen
          ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg"
          : needsReview
          ? "cursor-default hover:-translate-y-0.5 hover:shadow-lg"
          : "cursor-not-allowed opacity-80",
      ].join(" ")}
      role={canOpen ? "button" : "region"}
      tabIndex={0}
      onKeyDown={(e) => {
        if (canOpen && (e.key === "Enter" || e.key === " ")) onOpen();
      }}
    >
      {/* Status badge */}
      <span className={`absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded-md ${cls}`}>
        {label}
      </span>

      {/* Visual */}
      <div className="relative flex flex-col gap-2 items-center justify-center h-[130px] bg-gray-100">
        <FontAwesomeIcon icon={vis.icon} className={`text-3xl ${vis.className}`} />
        {vis.text && <span className="text-sm text-gray-700">{vis.text}</span>}
      </div>

      {/* Title */}
      <div className="p-3">
        <h6 className="font-semibold text-sm leading-snug line-clamp-2">
          {report.name || "Untitled report"} - {status}
        </h6>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="px-3 pb-3 flex items-center gap-2">
          {canOpen && (
            <button
              className="flex-1 h-9 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600"
              onClick={(e) => { e.stopPropagation(); onOpen(); }}
            >
              Open
            </button>
          )}
          {needsReview && (
            <button
              className="flex-1 h-9 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600"
              onClick={(e) => { e.stopPropagation(); handleReviewClick(); }}
            >
              Review
            </button>
          )}
        </div>
      )}

      {/* Lock overlay */}
      {isBlocked && <div className="absolute inset-0 bg-white/40 pointer-events-none" />}
    </div>
  );
};

export default ReportCard;
