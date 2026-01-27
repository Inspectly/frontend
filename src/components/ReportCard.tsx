import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faRotateRight,
  faCircleNotch,
  faTriangleExclamation,
  faCheckCircle,
  faFileLines,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { ExtractionStatus, ReportCardMode, ReviewStatus } from "../types";

export interface ReportLite {
  id: number;
  name?: string | null;
  review_status?: ReviewStatus | null;
}

interface Props {
  report: ReportLite;
  mode: ReportCardMode;
  extractionStatus: ExtractionStatus;
  onOpen: () => void;
  onReview: () => void;
  onRetry?: () => void;
}

const extractionBadge = (status: ExtractionStatus) => {
  switch (status) {
    case "PENDING":
      return { label: "Queued", icon: faClock };
    case "IN_PROGRESS":
      return { label: "Extracting…", icon: faCircleNotch, spin: true };
    case "FAILED":
      return { label: "Extraction failed", icon: faTriangleExclamation };
    case "COMPLETED":
      return { label: "Extracted", icon: faCheckCircle };
    default:
      return null;
  }
};

const primaryForMode = (mode: ReportCardMode) => {
  switch (mode) {
    case "REVIEW":
      return { label: "Review", style: "bg-blue-500 hover:bg-blue-600 text-white" };
    case "CONTINUE_REVIEW":
      return { label: "Continue Review", style: "bg-indigo-500 hover:bg-indigo-600 text-white" };
    case "VIEW":
      return { label: "View", style: "bg-slate-800 hover:bg-slate-900 text-white" };
    case "PENDING":
      return { label: "Queued", style: "bg-gray-100 text-gray-400 cursor-not-allowed", disabled: true };
    case "FAILED":
      return { label: "Failed", style: "bg-rose-100 text-rose-800 cursor-not-allowed", disabled: true };
    case "EXTRACTING":
      return { label: "Extracting...", style: "bg-gray-100 text-gray-400 cursor-not-allowed", disabled: true };
    case "NONE":
    default:
      return null;
  }
};

const ReportCard: React.FC<Props> = ({
  report,
  mode,
  extractionStatus,
  onOpen,
  onReview,
  onRetry,
}) => {
  const badge = extractionBadge(extractionStatus);
  const primary = primaryForMode(mode);

  const handlePrimary = () => {
    if (mode === "VIEW") onOpen();
    else if (mode === "REVIEW" || mode === "CONTINUE_REVIEW") onReview();
  };

  return (
    <div
      className={[
        "group relative rounded-2xl overflow-hidden border border-neutral-200 bg-white",
        "shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5",
        "flex flex-col",
      ].join(" ")}
    >
      {/* Thumbnail / hero area (keeps your older look w/ visual) */}
      <div className="relative h-32 w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <FontAwesomeIcon icon={faFileLines} className="text-3xl text-gray-500" />
        {/* Glassy badge overlay in the top-right */}
        {badge && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-2 px-2 py-1 text-[11px] font-medium rounded-lg bg-white/70 text-gray-800 backdrop-blur-lg shadow-sm">
            <FontAwesomeIcon
              icon={badge.icon}
              className={badge.spin ? "animate-spin" : ""}
            />
            {badge.label}
          </span>
        )}
      </div>

      {/* Title */}
      <div className="p-3 grow">
        <h3 className="text-sm font-semibold line-clamp-2">
          {report.name || `Report #${report.id}`}
        </h3>
        <p className="text-[11px] text-gray-500 mt-1">ID: {report.id}</p>
      </div>

      {/* Actions */}
      <div className="px-3 pb-3 flex items-center gap-2">
        {primary ? (
          <button
            className={`flex-1 h-9 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 ${primary.style}`}
            onClick={handlePrimary}
            disabled={primary.disabled}
          >
            {primary.label}
            {!primary.disabled && <FontAwesomeIcon icon={faArrowRight} />}
          </button>
        ) : (
          <button
            disabled
            className="flex-1 h-9 rounded-lg text-sm font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"
            title="Not ready yet"
          >
            Loading..
          </button>
        )}

        {extractionStatus === "FAILED" && onRetry && (
          <button
            className="h-9 px-3 rounded-lg text-sm font-semibold bg-rose-100 text-rose-800 hover:bg-rose-200 inline-flex items-center gap-2"
            onClick={onRetry}
            title="Retry extraction"
          >
            <FontAwesomeIcon icon={faRotateRight} />
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default ReportCard;
