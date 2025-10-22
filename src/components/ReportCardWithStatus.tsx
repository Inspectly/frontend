import React, { useEffect, useMemo, useState } from "react";
import ReportCard, {
  ReportLite,
} from "./ReportCard";
import { useGetTasksByReportIdQuery } from "../features/api/taskApi";
import { ExtractionStatus, ReportCardMode, ReviewStatus } from "../types";

const normalizeTaskStatus = (raw?: string): ExtractionStatus => {
  if (!raw) return "NONE";
  const core = raw.split(".").pop()?.toUpperCase() ?? raw.toUpperCase();
  return (["IN_PROGRESS", "FAILED", "COMPLETED"].includes(core)
    ? core
    : "NONE") as ExtractionStatus;
};

interface Props {
  report: ReportLite & { review_status?: ReviewStatus | null };
  onOpen: () => void;
  onReview: () => void; 
  onRetry?: () => void;
}

const ReportCardWithStatus: React.FC<Props> = ({
  report,
  onOpen,
  onReview,
  onRetry,
}) => {
  const [stopPolling, setStopPolling] = useState(false);

  const { data: tasks = [] } = useGetTasksByReportIdQuery(report.id, {
    skip: stopPolling === true,
    pollingInterval: stopPolling ? 0 : 3000,
    refetchOnMountOrArgChange: true,
  });

  const extractionStatus: ExtractionStatus = useMemo(() => {
    if (!tasks.length) return "NONE"; // treat no tasks yet as pending
    const latest = tasks
      .slice()
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
    return normalizeTaskStatus(latest?.status);
  }, [tasks]);

  useEffect(() => {
    console.log(report)
    if (extractionStatus === "COMPLETED" || extractionStatus === "FAILED") {
      setStopPolling(true);
    }
  }, [extractionStatus]);

  const reviewStatus: ReviewStatus = (report.review_status ??
    "not_reviewed") as ReviewStatus;

  let mode: ReportCardMode = "NONE";
  if (reviewStatus === "completed") mode = "VIEW";
  else if (extractionStatus === "NONE") mode ="VIEW";
  else if (reviewStatus === "in_review") mode = "CONTINUE_REVIEW";
  else if (
    reviewStatus === "not_reviewed" &&
    extractionStatus === "COMPLETED"
  )
    mode = "REVIEW";

  return (
    <ReportCard
      report={report}
      mode={mode}
      extractionStatus={extractionStatus}
      onOpen={onOpen}
      onReview={onReview}
      onRetry={onRetry}
    />
  );
};

export default ReportCardWithStatus;
