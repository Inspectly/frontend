import React, { useEffect, useMemo, useState } from "react";
import ReportCard, { ReportStatus } from "./ReportCard";
import { useGetTasksByReportIdQuery } from "../features/api/taskApi";


type ReportLite = {
  id: number;
  name?: string | null;
  is_reviewed?: boolean;
};

interface Props {
  report: ReportLite;
  onOpen: () => void;
  onReview: () => void;
  onRetry?: () => void;
}

const normalize = (raw?: string): ReportStatus => {
  if (!raw) return "NOT_STARTED";
  const core = raw.includes(".") ? raw.split(".")[1] : raw; // "Status.IN_PROGRESS" -> "IN_PROGRESS"
  if (core === "PENDING" || core === "IN_PROGRESS" || core === "FAILED" || core === "COMPLETED") {
    return core as ReportStatus;
  }
  return "NOT_STARTED";
};

const ReportCardWithStatus: React.FC<Props> = ({ report, onOpen, onReview, onRetry }) => {
  // Poll while active; stop when terminal or reviewed.
  const [stopPolling, setStopPolling] = useState(false);

  const { data: tasks = [] } = useGetTasksByReportIdQuery(report.id, {
    skip: stopPolling === true,
    pollingInterval: stopPolling ? 0 : 3000,
    refetchOnMountOrArgChange: true,
  });

  const latestStatus: ReportStatus = useMemo(() => {
    if (!tasks.length) return "NOT_STARTED";
    const latest = tasks
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    return normalize(latest?.status);
  }, [tasks]);

  // Stop polling when terminal or reviewed
  useEffect(() => {
    if (latestStatus === "COMPLETED" || latestStatus === "FAILED" || report.is_reviewed) {
      setStopPolling(true);
    }
  }, [latestStatus, report.is_reviewed]);

  return (
    <ReportCard
      report={report}
      status={latestStatus}
      isReviewed={!!report.is_reviewed}
      onOpen={onOpen}
      onReview={onReview}
      onRetry={onRetry}
    />
  );
};

export default ReportCardWithStatus;
