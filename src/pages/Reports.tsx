import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPlus,
  faUpload,
  faBriefcase,
  faFileAlt,
  faClock,
  faCircleNotch,
  faCheckCircle,
  faTriangleExclamation,
  faFilter,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { useGetListingByIdQuery, useGetListingsQuery } from "../features/api/listingsApi";
import {
  useGetReportsQuery,
  useGetReportsByUserIdQuery,
  useUpdateReportMutation,
} from "../features/api/reportsApi";
import { useGetIssuesQuery, useUpdateIssueMutation } from "../features/api/issuesApi";
import { buildIssueUpdateBody } from "../utils/issueUpdateHelper";
import { useGetTasksByReportIdQuery } from "../features/api/taskApi";
import ImageComponent from "../components/ImageComponent";
import CreateIssueCollectionModal from "../components/CreateIssueCollectionModal";
import CreateIssueModal from "../components/CreateIssueModal";
import HomeownerIssueCard from "../components/HomeownerIssueCard";
import type { ReviewStatus, IssueType, IssueStatus, Listing } from "../types";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";
import { statusMapping } from "../types";
import { BUTTON_HOVER } from "../styles/shared";

const normalizeReviewStatus = (raw?: string | null): ReviewStatus => {
  const v = (raw ?? "").toLowerCase();
  return v === "in_review" || v === "completed" || v === "not_reviewed"
    ? (v as ReviewStatus)
    : "not_reviewed";
};

// Extraction status badge component for each report tab
const ExtractionBadge: React.FC<{ reportId: number }> = ({ reportId }) => {
  const { data: tasks = [] } = useGetTasksByReportIdQuery(reportId, {
    pollingInterval: 5000,
  });

  const status = useMemo(() => {
    if (!tasks.length) return null;
    const latest = tasks
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    const core = (latest?.status || "").split(".").pop()?.toUpperCase() || "";
    if (core === "PENDING") return { label: "Queued", icon: faClock, cls: "text-amber-500" };
    if (core === "IN_PROGRESS") return { label: "Extracting...", icon: faCircleNotch, cls: "text-blue-500", spin: true };
    if (core === "COMPLETED") return { label: "Extracted", icon: faCheckCircle, cls: "text-emerald-500" };
    if (core === "FAILED") return { label: "Failed", icon: faTriangleExclamation, cls: "text-red-500" };
    return null;
  }, [tasks]);

  if (!status) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[0.6rem] ${status.cls}`}>
      <FontAwesomeIcon icon={status.icon} className={(status as any).spin ? "animate-spin" : ""} />
      {status.label}
    </span>
  );
};

const Reports: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  const { data: allReports, error, isLoading, refetch } = useGetReportsQuery();
  const { data: userReports } = useGetReportsByUserIdQuery(user?.id, { skip: !user?.id });
  // Prefer user's reports when viewing a property so issues show (same source as Listings count & dashboard/Offers)
  const reports = useMemo(() => {
    const r = (user?.id != null ? userReports : null) ?? allReports;
    if (Array.isArray(r)) return r;
    if (r && typeof r === "object" && Array.isArray((r as any).reports)) return (r as any).reports;
    if (r && typeof r === "object" && Array.isArray((r as any).results)) return (r as any).results;
    return [];
  }, [user?.id, userReports, allReports]);
  const { data: allIssues } = useGetIssuesQuery();
  const [updateReport] = useUpdateReportMutation();
  const [updateIssue] = useUpdateIssueMutation();
  const navigate = useNavigate();
  const { listingId } = useParams<{ listingId: string }>();
  const { data: listing } = useGetListingByIdQuery(Number(listingId), {
    skip: !listingId,
  });

  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<{ issue: IssueType; listing?: Listing } | null>(null);
  const [isActionOpen, setIsActionOpen] = useState(false);

  // Filters
  const [filterSource, setFilterSource] = useState<string>("all"); // "all" | "manual" | report_id
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const location = useLocation();

  // All user listings for finding duplicates by address (normalize in case API returns object)
  const { data: allListingsRaw } = useGetListingsQuery();
  const allListings = useMemo(() => {
    const r = allListingsRaw;
    if (Array.isArray(r)) return r;
    if (r && typeof r === "object" && Array.isArray((r as any).listings)) return (r as any).listings;
    if (r && typeof r === "object" && Array.isArray((r as any).results)) return (r as any).results;
    return [];
  }, [allListingsRaw]);

  useEffect(() => {
    const state = location.state as any;
    if (state?.openCreateCollection) {
      setIsCreateCollectionOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
    if (state?.openIssue) {
      setSelectedIssue({ issue: state.openIssue, listing: listing || undefined });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  // Find all listing IDs that share the same address (merge duplicates); use numbers for consistent Set.has()
  const relatedListingIds = useMemo(() => {
    if (!listing) return new Set([Number(listingId)]);
    const list = Array.isArray(allListings) ? allListings : [];
    if (list.length === 0) return new Set([Number(listingId)]);
    const normalizedAddr = (listing.address || "").trim().toLowerCase();
    const ids = new Set<number>();
    ids.add(Number(listingId));
    list.forEach((l) => {
      if ((l.address || "").trim().toLowerCase() === normalizedAddr && Number(l.user_id) === Number(user?.id)) {
        ids.add(Number(l.id));
      }
    });
    return ids;
  }, [listing, allListings, listingId, user?.id]);

  // Reports for this listing (and any duplicates); match listing_id as number
  const listingReports = useMemo(() => {
    return (reports ?? [])
      .filter((r) => relatedListingIds.has(Number(r.listing_id)))
      .map((r) => ({
        ...r,
        review_status: normalizeReviewStatus(r.review_status),
      }));
  }, [reports, relatedListingIds]);

  // All issues for this listing (via reports); normalize report_id for matching
  const listingIssues = useMemo(() => {
    if (!allIssues) return [];
    const reportIds = new Set(listingReports.map((r) => Number(r.id)));
    return allIssues.filter((issue) => reportIds.has(Number(issue.report_id)));
  }, [allIssues, listingReports]);

  // Unique issue types for filter dropdown
  const uniqueIssueTypes = useMemo(() => {
    return [...new Set(listingIssues.map((i) => i.type).filter(Boolean))].sort();
  }, [listingIssues]);

  const isManualReport = (r: { name?: string | null }) => {
    const name = (r.name || "").toLowerCase();
    return name === "jobs" || name === "my posted jobs" || name.startsWith("collection");
  };

  // Reports that need attention (queued/extracting/need review)
  const reportsNeedingAction = useMemo(() => {
    return listingReports.filter((r) =>
      !isManualReport(r) && (r.review_status === "not_reviewed" || r.review_status === "in_review")
    );
  }, [listingReports]);

  // Filtered issues
  const filteredIssues = useMemo(() => {
    let result = listingIssues;

    // Source filter
    if (filterSource === "manual") {
      const manualReportIds = new Set(listingReports.filter((r) => isManualReport(r)).map((r) => Number(r.id)));
      result = result.filter((i) => manualReportIds.has(Number(i.report_id)));
    } else if (filterSource !== "all") {
      result = result.filter((i) => String(i.report_id) === filterSource);
    }

    // Type filter
    if (filterType !== "all") {
      result = result.filter((i) => i.type === filterType);
    }

    // Severity filter
    if (filterSeverity !== "all") {
      result = result.filter((i) => (i.severity || "").toLowerCase() === filterSeverity);
    }

    // Status filter
    if (filterStatus !== "all") {
      result = result.filter((i) => {
        const mapped = statusMapping[i.status as IssueStatus];
        return mapped === filterStatus;
      });
    }

    return result;
  }, [listingIssues, filterSource, filterType, filterSeverity, filterStatus, listingReports]);

  const getStatusInfo = (status: string) => {
    const mapped = statusMapping[status as IssueStatus];
    switch (mapped) {
      case "open": return { label: "Open", cls: "bg-gray-100 text-gray-700" };
      case "in_progress": return { label: "In Progress", cls: "bg-blue-50 text-blue-700" };
      case "review": return { label: "Review", cls: "bg-amber-50 text-amber-700" };
      case "completed": return { label: "Completed", cls: "bg-emerald-50 text-emerald-700" };
      default: return { label: "Open", cls: "bg-gray-100 text-gray-700" };
    }
  };

  const handleStartOrContinueReview = async (report: typeof listingReports[0]) => {
    try {
      if ((report.review_status ?? "not_reviewed") === "not_reviewed") {
        await updateReport({
          id: report.id,
          user_id: report.user_id,
          listing_id: report.listing_id,
          aws_link: report.aws_link ?? "",
          name: report.name ?? "",
          review_status: "in_review",
        }).unwrap();
        refetch();
      }
      navigate(`/listings/${listingId}/reports/${report.id}/review`, {
        state: { report },
      });
    } catch (e: any) {
      console.error("Failed to start review:", e?.data ?? e);
    }
  };

  if (isLoading && reports.length === 0 && !allIssues) return <p>Loading...</p>;
  if (error && reports.length === 0) return <p>Error loading data</p>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-[1600px] mx-auto px-4 py-5 lg:px-8 lg:py-6">
        {/* Back + Header */}
        <div className="mb-5">
          <button
            onClick={() => navigate("/listings")}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-3 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
            All Properties
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 shadow-sm">
              <ImageComponent
                src={listing?.image_url}
                fallback="/images/property_card_holder.jpg"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{listing?.address}</h1>
              <p className="text-sm text-gray-500">{listing?.city}, {listing?.state}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setIsCreateCollectionOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
              >
                <FontAwesomeIcon icon={faUpload} className="text-xs" />
                Upload Report
              </button>
              <button
                onClick={() => setIsCreateIssueOpen(true)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 bg-gold text-white rounded-xl text-sm font-bold shadow-sm ${BUTTON_HOVER}`}
              >
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
                Post a Job
              </button>
            </div>
          </div>
        </div>

        {/* Reports needing attention — collapsible dropdown */}
        {reportsNeedingAction.length > 0 && (
          <div className="mb-4 rounded-xl overflow-hidden border border-amber-300 bg-amber-50 shadow-sm">
            <button
              onClick={() => setIsActionOpen(!isActionOpen)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-amber-100/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{reportsNeedingAction.length}</span>
                </span>
                <span className="text-sm font-semibold text-amber-900">
                  Report{reportsNeedingAction.length > 1 ? "s" : ""} need{reportsNeedingAction.length === 1 ? "s" : ""} your attention
                </span>
              </div>
              <FontAwesomeIcon
                icon={isActionOpen ? faChevronUp : faChevronDown}
                className="text-amber-500 text-xs"
              />
            </button>

            {isActionOpen && (
              <div className="border-t border-amber-200">
                {reportsNeedingAction.map((r, idx) => (
                  <div
                    key={r.id}
                    className={`flex items-center justify-between px-4 py-2.5 bg-white/60 ${
                      idx < reportsNeedingAction.length - 1 ? "border-b border-amber-100" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FontAwesomeIcon icon={faFileAlt} className="text-amber-500 text-xs flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {r.name || `Report #${r.id}`}
                      </span>
                      <ExtractionBadge reportId={r.id} />
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        r.review_status === "in_review"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {r.review_status === "in_review" ? "In progress" : "Not started"}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStartOrContinueReview(r as any); }}
                      className={`px-3 py-1.5 text-xs font-bold text-white rounded-lg flex-shrink-0 transition-colors ${
                        r.review_status === "in_review"
                          ? "bg-blue-500 hover:bg-blue-600"
                          : "bg-gray-900 hover:bg-gray-800"
                      }`}
                    >
                      {r.review_status === "in_review" ? "Continue" : "Review"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filters — Marketplace-style with labels */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-5 overflow-hidden">
          <div className="bg-gradient-to-r from-gold-50 to-amber-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFilter} className="text-gold text-sm" />
              <span className="text-sm font-semibold text-gray-900">Filter Issues</span>
            </div>
            <span className="text-xs text-gray-500">
              Showing {filteredIssues.length} of {listingIssues.length}
            </span>
          </div>

          <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Source filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Source</label>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold focus:border-gold bg-gray-50 focus:bg-white transition-colors"
              >
                <option value="all">All Sources</option>
                <option value="manual">My Posted Jobs</option>
                {listingReports.filter((r) => !isManualReport(r)).map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.name || `Report #${r.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Type filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold focus:border-gold bg-gray-50 focus:bg-white transition-colors"
              >
                <option value="all">All Types</option>
                {uniqueIssueTypes.map((type) => (
                  <option key={type} value={type}>{normalizeAndCapitalize(type)}</option>
                ))}
              </select>
            </div>

            {/* Severity filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Severity</label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold focus:border-gold bg-gray-50 focus:bg-white transition-colors"
              >
                <option value="all">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold focus:border-gold bg-gray-50 focus:bg-white transition-colors"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Clear filters */}
          {(filterSource !== "all" || filterType !== "all" || filterSeverity !== "all" || filterStatus !== "all") && (
            <div className="px-5 pb-3">
              <button
                onClick={() => { setFilterSource("all"); setFilterType("all"); setFilterSeverity("all"); setFilterStatus("all"); }}
                className="text-sm font-medium text-gold hover:text-foreground transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Issues table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {filteredIssues.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-gray-100 rounded-xl flex items-center justify-center">
                <FontAwesomeIcon icon={faBriefcase} className="text-xl text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">No issues yet</h3>
              <p className="text-sm text-gray-500 mb-4">Post a job or upload an inspection report to get started.</p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setIsCreateIssueOpen(true)}
                  className={`inline-flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg text-sm font-bold ${BUTTON_HOVER}`}
                >
                  <FontAwesomeIcon icon={faPlus} className="text-xs" />
                  Post a Job
                </button>
                <button
                  onClick={() => setIsCreateCollectionOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50"
                >
                  <FontAwesomeIcon icon={faUpload} className="text-xs" />
                  Upload Report
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="bg-gray-50 text-center font-medium text-xs text-gray-500 uppercase tracking-wide px-4 py-3">Severity</th>
                    <th className="bg-gray-50 text-left font-medium text-xs text-gray-500 uppercase tracking-wide px-4 py-3">Summary</th>
                    <th className="bg-gray-50 text-left font-medium text-xs text-gray-500 uppercase tracking-wide px-4 py-3">Type</th>
                    <th className="bg-gray-50 text-left font-medium text-xs text-gray-500 uppercase tracking-wide px-4 py-3">Source</th>
                    <th className="bg-gray-50 text-left font-medium text-xs text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                    <th className="bg-gray-50 text-center font-medium text-xs text-gray-500 uppercase tracking-wide px-4 py-3">Marketplace</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map((issue) => {
                    const report = listingReports.find((r) => r.id === issue.report_id);
                    const statusInfo = getStatusInfo(issue.status);
                    const manual = report ? isManualReport(report) : true;
                    const isLocked = !!issue.vendor_id;

                    return (
                      <tr
                        key={issue.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${!issue.active ? "bg-red-50/50" : ""}`}
                        onClick={() => setSelectedIssue({ issue, listing: listing || undefined })}
                      >
                        {/* Severity */}
                        <td className="text-center px-4 py-3">
                          <span className={`inline-block w-3 h-3 rounded-full ${
                            issue.severity?.toLowerCase() === "high" ? "bg-red-500" :
                            issue.severity?.toLowerCase() === "medium" ? "bg-amber-400" : "bg-emerald-500"
                          }`} />
                        </td>

                        {/* Summary */}
                        <td className="text-left px-4 py-3">
                          <span className="text-sm font-medium text-blue-600 hover:underline">{issue.summary}</span>
                        </td>

                        {/* Type */}
                        <td className="text-left px-4 py-3">
                          <span className="text-sm text-gray-700">{normalizeAndCapitalize(issue.type)}</span>
                        </td>

                        {/* Source */}
                        <td className="text-left px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <FontAwesomeIcon icon={manual ? faBriefcase : faFileAlt} className={`text-xs ${manual ? "text-gold" : "text-blue-500"}`} />
                            <span className="text-sm text-gray-600">{manual ? "My Job" : (report?.name || "Report")}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="text-left px-4 py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded text-xs font-medium ${statusInfo.cls}`}>
                            {statusInfo.label}
                          </span>
                        </td>

                        {/* Marketplace toggle */}
                        <td className="text-center px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <label className={`inline-flex items-center ${isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={isLocked ? false : issue.active}
                              disabled={isLocked}
                              onChange={() => {
                                if (!isLocked) {
                                  updateIssue(buildIssueUpdateBody(issue, { active: !issue.active }, Number(listingId)));
                                }
                              }}
                            />
                            <span className="relative w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center">
          <div className="relative w-[1100px] h-[80vh] mx-auto overflow-hidden rounded-2xl shadow-xl bg-white">
            <HomeownerIssueCard
              issue={selectedIssue.issue}
              listing={selectedIssue.listing}
              onClose={() => setSelectedIssue(null)}
            />
          </div>
        </div>
      )}

      {/* Modals */}
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

      <CreateIssueModal
        open={isCreateIssueOpen}
        onClose={() => setIsCreateIssueOpen(false)}
        listings={listing ? [listing] : []}
        reports={listingReports as any[]}
        onCreated={() => {
          setIsCreateIssueOpen(false);
          refetch();
        }}
      />
    </div>
  );
};

export default Reports;
