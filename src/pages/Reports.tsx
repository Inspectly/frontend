import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPlus, faUpload, faTriangleExclamation, faEye } from "@fortawesome/free-solid-svg-icons";
import { MapPin, CircleCheck, Clock, TriangleAlert, FileText, Loader2, AlertCircle } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { useGetListingByIdQuery } from "../features/api/listingsApi";
import { useGetReportsQuery } from "../features/api/reportsApi";
import { useGetIssuesByListingIdQuery } from "../features/api/issuesApi";
import { useGetTasksByReportIdQuery } from "../features/api/taskApi";
import CreateIssueCollectionModal from "../components/CreateIssueCollectionModal";
import PostJobWizard from "../components/PostJobWizard";
import ImageComponent from "../components/ImageComponent";
import HomeownerIssueCard from "../components/HomeownerIssueCard";
import type { ExtractionStatus, IssueType, ReportType } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────


const formatIssueDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

type StatusKey = "Status.OPEN" | "Status.IN_PROGRESS" | "Status.REVIEW" | "Status.COMPLETED" | string;

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  "Status.OPEN":        { label: "Open",        className: "bg-amber-100 text-amber-700" },
  "Status.IN_PROGRESS": { label: "In Progress",  className: "bg-blue-100 text-blue-700" },
  "Status.REVIEW":      { label: "Review",       className: "bg-purple-100 text-purple-700" },
  "Status.COMPLETED":   { label: "Completed",    className: "bg-green-100 text-green-700" },
};

const SEVERITY_CONFIG: Record<string, { className: string }> = {
  high:   { className: "bg-red-100 text-red-700" },
  medium: { className: "bg-yellow-100 text-yellow-700" },
  low:    { className: "bg-green-100 text-green-600" },
};

const getStatusConfig = (status: StatusKey) =>
  STATUS_CONFIG[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };

const getSeverityConfig = (severity: string) =>
  SEVERITY_CONFIG[severity?.toLowerCase()] ?? { className: "bg-gray-100 text-gray-600" };

type TabKey = "all" | "inspection" | "posted" | "extractions";

const EXTRACTION_STATUS_CONFIG: Record<
  ExtractionStatus,
  { label: string; className: string }
> = {
  NONE:        { label: "No tasks",    className: "bg-gray-100 text-gray-600" },
  PENDING:     { label: "Queued",      className: "bg-amber-100 text-amber-700" },
  IN_PROGRESS: { label: "Processing",  className: "bg-blue-100 text-blue-700" },
  COMPLETED:   { label: "Completed",   className: "bg-green-100 text-green-700" },
  FAILED:      { label: "Failed",      className: "bg-red-100 text-red-700" },
};

const normalizeTaskStatus = (raw?: string): ExtractionStatus => {
  if (!raw) return "NONE";
  const core = raw.split(".").pop()?.toUpperCase() ?? raw.toUpperCase();
  return (["PENDING", "IN_PROGRESS", "FAILED", "COMPLETED"].includes(core)
    ? core
    : "NONE") as ExtractionStatus;
};

// ─── Issue row ────────────────────────────────────────────────────────────────

interface IssueRowProps {
  issue: IssueType;
  onClick: () => void;
}

const IssueRow: React.FC<IssueRowProps> = ({ issue, onClick }) => {
  const firstImage = useMemo(() => {
    const raw = issue.image_urls as string | string[];
    if (Array.isArray(raw)) return raw.find(Boolean) ?? null;
    if (typeof raw === "string" && raw.startsWith("[")) {
      try { const p = JSON.parse(raw); return Array.isArray(p) ? p.find(Boolean) ?? null : null; } catch { /* ignore */ }
    }
    return raw || null;
  }, [issue.image_urls]);

  const statusCfg = getStatusConfig(issue.status);
  const severityCfg = getSeverityConfig(issue.severity);

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 px-5 py-4 bg-card border border-border rounded-xl hover:shadow-sm cursor-pointer transition-all"
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
        <ImageComponent
          src={firstImage}
          fallback="/images/property_card_holder.jpg"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-foreground truncate">{issue.summary}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {issue.type} · {formatIssueDate(issue.created_at)}
        </p>
      </div>

      {/* Badges + eye */}
      <div className="flex items-center gap-2 shrink-0">
        {issue.severity && (
          <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${severityCfg.className}`}>
            {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1).toLowerCase()}
          </span>
        )}
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusCfg.className}`}>
          {statusCfg.label}
        </span>
        <FontAwesomeIcon icon={faEye} className="text-muted-foreground/50 text-sm ml-1" />
      </div>
    </div>
  );
};

// ─── Extraction row ───────────────────────────────────────────────────────────

interface ExtractionRowProps {
  report: ReportType;
  onClick: () => void;
}

const ExtractionRow: React.FC<ExtractionRowProps> = ({ report, onClick }) => {
  // Poll every 30s while non-terminal. Subscription is only alive while the
  // Extractions tab is active (rows unmount on tab switch), and we stop the
  // poll entirely once the latest task hits COMPLETED/FAILED.
  const [done, setDone] = useState(false);
  const { data: tasks = [] } = useGetTasksByReportIdQuery(report.id, {
    skip: done,
    pollingInterval: done ? 0 : 30000,
    refetchOnMountOrArgChange: true,
  });

  const latestTask = useMemo(() => {
    if (!tasks.length) return undefined;
    return tasks
      .slice()
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
  }, [tasks]);

  const status = normalizeTaskStatus(latestTask?.status);

  useEffect(() => {
    if (status === "COMPLETED" || status === "FAILED") setDone(true);
  }, [status]);

  const cfg = EXTRACTION_STATUS_CONFIG[status];
  const isActive = status === "PENDING" || status === "IN_PROGRESS";
  const isFailed = status === "FAILED";

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 px-5 py-4 bg-card border border-border rounded-xl hover:shadow-sm cursor-pointer transition-all"
    >
      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
        {isActive ? (
          <Loader2 size={20} className="text-blue-500 animate-spin" />
        ) : isFailed ? (
          <AlertCircle size={20} className="text-red-500" />
        ) : status === "COMPLETED" ? (
          <CircleCheck size={20} className="text-green-500" />
        ) : (
          <FileText size={20} className="text-muted-foreground" />
        )}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-foreground truncate">
          {report.name || "Untitled report"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Uploaded {formatIssueDate(report.created_at)}
          {latestTask && (
            <>
              {" · "}Last update {formatIssueDate(latestTask.updated_at)}
            </>
          )}
        </p>
      </div>

      {/* Status pill */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${cfg.className}`}
        >
          {cfg.label}
        </span>
        <FontAwesomeIcon icon={faEye} className="text-muted-foreground/50 text-sm ml-1" />
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const Reports: React.FC = () => {
  const { data: reports, refetch } = useGetReportsQuery();

  const user = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();
  const { listingId } = useParams<{ listingId: string }>();
  const { data: listing } = useGetListingByIdQuery(Number(listingId), { skip: !listingId });
  const { data: allIssues = [] } = useGetIssuesByListingIdQuery(
    Number(listingId),
    { skip: !listingId }
  );

  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<IssueType | null>(null);

  const location = useLocation();

  useEffect(() => {
    if ((location.state as any)?.openCreateCollection) {
      setIsCreateCollectionOpen(true);
      navigate(location.pathname, { replace: true });
    }
  }, []);

  const listingIssues = allIssues;

  // Reports for this listing (used by modals)
  const listingReports = useMemo(
    () => (reports ?? []).filter((r) => String(r.listing_id) === listingId),
    [reports, listingId]
  );

  // Stats
  const openCount = useMemo(
    () => listingIssues.filter((i) => i.status === "Status.OPEN").length,
    [listingIssues]
  );
  const inProgressCount = useMemo(
    () => listingIssues.filter((i) => i.status === "Status.IN_PROGRESS" || i.status === "Status.REVIEW").length,
    [listingIssues]
  );
  const completedCount = useMemo(
    () => listingIssues.filter((i) => i.status === "Status.COMPLETED").length,
    [listingIssues]
  );

  // Tab filtering
  const inspectionIssues = useMemo(
    () => listingIssues.filter((i) => i.report_id && i.report_id > 0),
    [listingIssues]
  );
  const postedIssues = useMemo(
    () => listingIssues.filter((i) => !i.report_id || i.report_id === 0),
    [listingIssues]
  );

  const displayedIssues = useMemo(() => {
    if (activeTab === "inspection") return inspectionIssues;
    if (activeTab === "posted") return postedIssues;
    return listingIssues;
  }, [activeTab, listingIssues, inspectionIssues, postedIssues]);

  const handleIssueClick = (issue: IssueType) => {
    setSelectedIssue(issue);
  };

  const cityState = [listing?.city, listing?.state].filter(Boolean).join(", ");

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all",         label: "All Issues",  count: listingIssues.length },
    { key: "inspection",  label: "Inspection",  count: inspectionIssues.length },
    { key: "posted",      label: "Posted",      count: postedIssues.length },
    { key: "extractions", label: "Extractions", count: listingReports.length },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Hero ── */}
      <div className="relative w-full h-44 overflow-hidden bg-muted">
        <ImageComponent
          src={listing?.image_url}
          fallback="/images/property_card_holder.jpg"
          className="w-full h-full object-cover"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />

        {/* Back button */}
        <button
          onClick={() => navigate("/listings")}
          className="absolute top-4 left-4 flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-medium transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
          Properties
        </button>

        {/* Address */}
        <div className="absolute bottom-4 left-5">
          <h1 className="text-xl font-bold text-white leading-snug">{listing?.address ?? "Loading…"}</h1>
          {cityState && (
            <p className="flex items-center gap-1 text-white/80 text-sm mt-0.5">
              <MapPin size={12} />
              {cityState}
            </p>
          )}
        </div>
      </div>

      {/* ── Photo strip ── */}
      <div className="px-[4%] pt-4 flex items-center gap-3 overflow-x-auto pb-1">
        {listing?.image_url && (
          <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
            <ImageComponent
              src={listing.image_url}
              fallback="/images/property_card_holder.jpg"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* ── Actions + Stats ── */}
      <div className="px-[4%] pt-4 pb-3 flex flex-col gap-3">
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background text-foreground text-sm font-semibold hover:bg-muted transition-colors"
            onClick={() => setIsCreateCollectionOpen(true)}
          >
            <FontAwesomeIcon icon={faUpload} className="text-xs" />
            Upload Report
          </button>
          <button
            className="btn-gold flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            onClick={() => setIsPostJobOpen(true)}
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
            Post a Job
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-4">
            <TriangleAlert size={22} className="text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">{openCount}</p>
              <p className="text-sm text-muted-foreground mt-1">Open</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-4">
            <Clock size={22} className="text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">{inProgressCount}</p>
              <p className="text-sm text-muted-foreground mt-1">In Progress</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-4">
            <CircleCheck size={22} className="text-green-500 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">{completedCount}</p>
              <p className="text-sm text-muted-foreground mt-1">Completed</p>
            </div>
          </div>
        </div>

        {/* Attention banner */}
        {openCount > 0 && (
          <div className="flex items-center gap-2 bg-gold-light rounded-xl px-5 py-3 text-sm text-gold">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-gold text-xs" />
            <span><span className="font-semibold">{openCount} {openCount === 1 ? "issue" : "issues"}</span> need attention</span>
          </div>
        )}
      </div>

      {/* ── Tabs + Issue list ── */}
      <div className="px-[4%] flex-1">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border mb-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? "border-gold text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === tab.key
                    ? "bg-gold/15 text-gold"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "extractions" ? (
          listingReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                <FileText size={20} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                No reports yet
              </p>
              <p className="text-xs text-muted-foreground">
                Upload an inspection report to see extraction progress here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-3">
              {listingReports
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )
                .map((report) => (
                  <ExtractionRow
                    key={report.id}
                    report={report}
                    onClick={() =>
                      navigate(`/listings/${listingId}/reports/${report.id}`, {
                        state: { report },
                      })
                    }
                  />
                ))}
            </div>
          )
        ) : displayedIssues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
              <TriangleAlert size={20} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No issues found</p>
            <p className="text-xs text-muted-foreground">
              {activeTab === "inspection"
                ? "Upload a report to create inspection issues."
                : activeTab === "posted"
                ? "Post a job to add issues directly."
                : "Upload a report or post a job to get started."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pt-3">
            {displayedIssues.map((issue) => (
              <IssueRow
                key={issue.id}
                issue={issue}
                onClick={() => handleIssueClick(issue)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="h-6" />

      {/* ── Modals ── */}
      <CreateIssueCollectionModal
        open={isCreateCollectionOpen}
        onClose={() => setIsCreateCollectionOpen(false)}
        listingId={Number(listingId)}
        userId={user?.id}
        onCreated={() => {
          setIsCreateCollectionOpen(false);
          refetch();
        }}
      />

      <PostJobWizard
        open={isPostJobOpen}
        onClose={() => { setIsPostJobOpen(false); refetch(); }}
        listings={[]}
        reports={listingReports as any[]}
        currentListing={listing}
      />

      {/* ── Issue detail modal ── */}
      {selectedIssue && (
        <div
          className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center"
          onClick={() => setSelectedIssue(null)}
        >
          <div
            className="relative w-[45vw] max-w-2xl min-w-[340px] h-[85vh] overflow-hidden rounded-2xl shadow-xl bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedIssue(null)}
              className="absolute -top-10 right-0 text-white text-3xl leading-none px-2 hover:text-white/70 transition-colors"
            >
              &times;
            </button>
            <HomeownerIssueCard
              key={selectedIssue.id}
              issue={allIssues.find((i) => i.id === selectedIssue.id) ?? selectedIssue}
              listing={listing}
              onClose={() => setSelectedIssue(null)}
              defaultTab="details"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
