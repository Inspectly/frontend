import {
  useGetReportByIdQuery,
  useUpdateReportMutation,
} from "../features/api/reportsApi";

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWrench,
  faBolt,
  faBuilding,
  faTint,
  faPaintRoller,
  faBroom,
  faWind,
  faHouse,
  faSnowflake,
  faGripLines,
  faLayerGroup,
  faHammer,
  faLeaf,
  faQuestionCircle,
  faListCheck,
} from "@fortawesome/free-solid-svg-icons";

import {
  useGetIssuesQuery,
  useUpdateIssueMutation,
  useCreateIssueMutation,
  useDeleteIssueMutation,
} from "../features/api/issuesApi";

import { IssueStatus, IssueType, statusMapping } from "../types";
import { IssueImage, ReportImage } from "../components/IssueImageManager";
import ReviewIssueEditor from "../components/ReviewIssueEditor";
import ReviewSidebar from "../components/ReviewSidebar";

/* ---------------- helpers & constants ---------------- */

type RouteParams = { listingId?: string; reportId?: string };

const issueIcons: Record<string, any> = {
  general: faWrench,
  structural: faBuilding,
  electrician: faBolt,
  plumber: faTint,
  painter: faPaintRoller,
  cleaner: faBroom,
  hvac: faWind,
  roofing: faHouse,
  insulation: faSnowflake,
  drywall: faGripLines,
  plaster: faLayerGroup,
  carpentry: faHammer,
  landscaping: faLeaf,
  other: faQuestionCircle,
};

const VENDOR_TYPE_OPTIONS = [
  "GENERAL",
  "STRUCTURAL",
  "ELECTRICIAN",
  "PLUMBER",
  "PAINTER",
  "CLEANER",
  "HVAC",
  "ROOFING",
  "INSULATION",
  "DRYWALL",
  "PLASTER",
  "CARPENTRY",
  "LANDSCAPING",
  "OTHER",
];

function snippet(text?: string, max = 42) {
  if (!text) return "—";
  const t = text.trim();
  return t.length <= max ? t : t.slice(0, max - 1) + "…";
}

/** === Helpers for PUT payloads & severity mapping === */
type UiSeverity = "low" | "medium" | "high";

/** server -> ui */
function mapServerSeverityToUi(s?: string): UiSeverity {
  if (!s) return "medium";
  const val = s.toLowerCase();
  if (val === "low") return "low";
  if (val === "high") return "high";
  // treat "none" and unknowns as "medium" for editing UX
  return "medium";
}

/** ui -> server (example server expects capitalized or "None") */
function mapUiSeverityToServer(s?: UiSeverity | string): string {
  if (!s) return "None";
  const val = String(s).toLowerCase();
  if (val === "low") return "Low";
  if (val === "medium") return "Medium";
  if (val === "high") return "High";
  return "None";
}

function statusToApi(status: string): string {
  if (status.startsWith("Status.")) {
    return statusMapping[status as IssueStatus] || "open";
  }
  return status; // already in simple format
}

function buildIssuePutBody(original: IssueType, patch: Partial<IssueType>) {
  const merged: any = {
    report_id: (patch as any).report_id ?? (original as any).report_id,
    vendor_id: (patch as any).vendor_id ?? (original as any).vendor_id ?? null,

    type: (patch as any).type ?? (original as any).type ?? "other",
    description: (patch as any).description ?? (original as any).description ?? "",
    summary: (patch as any).summary ?? (original as any).summary ?? "",

    severity: mapUiSeverityToServer(
      (patch as any).severity ?? mapServerSeverityToUi((original as any).severity)
    ),

    // Convert status to API format (remove Status. prefix)
    status: statusToApi((patch as any).status ?? (original as any).status ?? "open"),

    active:
      typeof (patch as any).active === "boolean"
        ? (patch as any).active
        : (original as any).active ?? false,

    image_url: (patch as any).image_url ?? (original as any).image_url ?? "",
    images: (patch as any).images ?? (original as any).images ?? undefined,

    created_at: (original as any).created_at,
    updated_at: (original as any).updated_at,

    review_status:
      (patch as any).review_status ??
      (original as any).review_status ??
      "not_reviewed",
  };

  if (merged.images === undefined) delete merged.images;

  // Add the ID back for RTK Query URL building
  return { ...merged, id: original.id } as IssueType;
}

function buildReportPutBody(r: any, status: "not_reviewed" | "in_review" | "completed") {
  if (!r) return null;
  return {
    id: r.id,              
    user_id: r.user_id,
    listing_id: r.listing_id,
    aws_link: r.aws_link ?? "",
    name: r.name ?? "",
    review_status: status,
  };
}


/* ----------------- lightweight modal ----------------- */

function Modal({
  open,
  title,
  body,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onClose,
  danger,
}: {
  open: boolean;
  title: string;
  body: string | JSX.Element;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
  danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border">
        <div className="p-4 border-b">
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        <div className="p-4 text-sm text-neutral-700">{body}</div>
        <div className="p-4 pt-2 flex items-center justify-end gap-2">
          <button
            className="px-3 py-2 rounded-lg border text-sm hover:bg-neutral-50"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            className={[
              "px-3 py-2 rounded-lg text-white text-sm font-semibold",
              danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700",
            ].join(" ")}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- page component -------------------- */

export default function ReportReviewPage() {
  const navigate = useNavigate();
  const { listingId, reportId } = useParams<RouteParams>();

  const { data: report } = useGetReportByIdQuery(Number(reportId), {
    skip: !reportId,
  });


  const {
    data: issues = [],
    isLoading,
    isError,
    refetch,
  } = useGetIssuesQuery();

  const [updateIssue] = useUpdateIssueMutation();
  const [createIssue] = useCreateIssueMutation();
  const [deleteIssue] = useDeleteIssueMutation();
  const [completeOpen, setCompleteOpen] = useState(false);
  const [updateReport] = useUpdateReportMutation();

  const reportIssues: IssueType[] = useMemo(() => {
    if (!reportId) return [];
    return (issues as IssueType[]).filter(
      (i) => String(i.report_id) === String(reportId)
    );
  }, [issues, reportId]);

  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);

  const allReviewed = useMemo(
    () =>
      reportIssues.length > 0 &&
      reportIssues.every((i) => (i as any).review_status === "completed"),
    [reportIssues]
  );

  useEffect(() => {
    setSelectedIssueId((prev) =>
      prev && reportIssues.some((i) => i.id === prev)
        ? prev
        : reportIssues[0]?.id ?? null
    );
  }, [reportIssues]);

  const selectedIssue = useMemo(
    () => reportIssues.find((i) => i.id === selectedIssueId) ?? null,
    [reportIssues, selectedIssueId]
  );

  useEffect(() => {
    if (!report) return;
    const current = String(report.review_status || "").toLowerCase();
    if (current === "not_reviewed") {
      const body = buildReportPutBody(report, "in_review");
      if (body) {
        updateReport(body as any).unwrap().catch(() => {});
      }
    }
  }, [report, updateReport]);

  // Build report-wide image pool (distinct URLs)
  const reportImagePool: ReportImage[] = useMemo(() => {
    const urls: string[] = [];
    for (const iss of reportIssues) {
      const imgs = Array.isArray((iss as any).images)
        ? ((iss as any).images as string[])
        : (iss as any).image_url
        ? [String((iss as any).image_url)]
        : [];
      imgs.forEach((u) => {
        if (u && !urls.includes(u)) urls.push(u);
      });
    }
    let counter = 1;
    return urls.map((u) => ({
      image_id: counter++,
      url: u,
      thumb_url: u,
    }));
  }, [reportIssues]);

  // --- Dialogs ---
  const [acceptAllOpen, setAcceptAllOpen] = useState(false);
  const [pendingDeleteIssueId, setPendingDeleteIssueId] = useState<number | null>(null);

  // --- Add Issue Modal state ---
  const [isAddIssueModalOpen, setIsAddIssueModalOpen] = useState(false);
  const initialForm = {
    type: "",
    description: "",
    summary: "",
    severity: "",
    active: true,
  };
  const [formData, setFormData] = useState<{
    type: string;
    description: string;
    summary: string;
    severity: string; // ui: "low" | "medium" | "high"
    active: boolean;
  }>(initialForm);
  const [isCreating, setIsCreating] = useState(false);

  const handleModalClose = () => {
    setIsAddIssueModalOpen(false);
    setFormData(initialForm);
    setIsCreating(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      const created = await createIssue({
        report_id: Number(reportId),
        listing_id: Number(listingId),
        type: formData.type,
        description: formData.description,
        summary: formData.summary,
        severity: mapUiSeverityToServer(formData.severity as UiSeverity),
        active: formData.active,
        status: "open",
        review_status: "completed",
        image_url: "",
      } as any).unwrap();

      // reset the form whether or not we close the modal
      setFormData(initialForm);

      await refetch();
      setIsAddIssueModalOpen(false);
      if (created?.id && String(created.report_id) === String(reportId)) {
        setSelectedIssueId(created.id);
      }
    } catch (err) {
      console.error("Failed to create issue:", err);
    } finally {
      setIsCreating(false);
    }
  };

  // --- Accept All progress UI ---
  const [isCompletingAll, setIsCompletingAll] = useState(false);
  const [completeCount, setCompleteCount] = useState(0);
  const [completeErrors, setCompleteErrors] = useState(0);

  // --- Main editor footer control signals ---
  const [saveSignal, setSaveSignal] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);

  // When an issue is opened, if review_status is "not_reviewed", flip to "in_review"
  useEffect(() => {
    if (!selectedIssue) return;

    const rs = (selectedIssue as any).review_status as
      | "not_reviewed"
      | "in_review"
      | "completed"
      | undefined;

    if (rs === "not_reviewed") {
      const body = buildIssuePutBody(selectedIssue, { review_status: "in_review" } as any);
      updateIssue(body)
        .unwrap()
        .then(() => refetch())
        .catch((e) => console.error("Failed to set in_review:", e));
    }
  }, [selectedIssue, updateIssue, refetch]);

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (isError) return <div className="p-6">Failed to load issues.</div>;

  return (
    <div className="bg-neutral-50">
      {/* Header / breadcrumb */}
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 h-14 flex gap-3 justify-end">
                  <ul className="text-lg text-gray-600 flex items-center gap-[6px]">
                    <li className="font-medium">
                      <a
                        href="/listings"
                        className="flex items-center gap-2 hover:text-blue-400"
                      >
                        <FontAwesomeIcon icon={faListCheck} className="size-4" />
                        Listings
                      </a>
                    </li>
                    <li>-</li>
                    <li className="font-medium">
                      <a
                        href={`/listings/${listingId}`}
                        className="flex items-center gap-2 hover:text-blue-400"
                      >
                        Reports
                      </a>
                    </li>
                    <li>-</li>
                    <li className="font-medium">Review Report</li>
                  </ul>
        </div>
      </header>

      {/* Workspace */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <ReviewSidebar
          issues={reportIssues}
          selectedIssueId={selectedIssueId}
          onSelectIssue={(id) => setSelectedIssueId(id)}
          onCreateIssueClick={() => setIsAddIssueModalOpen(true)}
          onAcceptOne={async (issue) => {
            try {
              const body = buildIssuePutBody(issue, { review_status: "completed" } as any);
              await updateIssue(body as any).unwrap();
              await refetch();
            } catch (e) {
              console.error("Mark completed failed:", e);
            }
          }}
          onDeleteOne={(id) => setPendingDeleteIssueId(id)}
          onAcceptAllClick={() => setAcceptAllOpen(true)}
          onCompleteClick={() => setCompleteOpen(true)}
          allReviewed={allReviewed}
          isCompletingAll={isCompletingAll}
          completeCount={completeCount}
          completeErrors={completeErrors}
        />


        {/* Main card with locked header & footer, scrollable body */}
        <main className="flex-1">
          <div className="border rounded-2xl bg-white shadow-sm h-[calc(100vh-140px)] flex flex-col overflow-hidden">
            {/* Header (locked) */}
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="text-base font-semibold">
                  {selectedIssue ? `Issue Details` : `No Issue Selected`}
                </h3>
                {selectedIssue && (
                  <p className="text-xs text-neutral-500 truncate">
                    {snippet(selectedIssue.summary)}
                  </p>
                )}
              </div>
            </div>

            {/* Body (scrollable) */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                {!selectedIssue ? (
                  <div className="text-neutral-500 text-sm">
                    Select an issue from the left to review.
                  </div>
                ) : (
                  <ReviewIssueEditor
                    key={selectedIssue.id}
                    issue={selectedIssue}
                    reportImages={reportImagePool}
                    saveSignal={saveSignal}
                    resetSignal={resetSignal}
                    updateIssue={updateIssue}
                    refetch={refetch}
                    buildIssuePutBody={buildIssuePutBody}
                  />
                )}
              </div>
            </div>

            {/* Footer (locked) */}
            <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
              <button
                className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                onClick={() => setSaveSignal((n) => n + 1)}
                disabled={!selectedIssue}
              >
                Save
              </button>
              <button
                className="px-3 py-2 rounded-lg border text-sm hover:bg-neutral-50 disabled:opacity-50"
                onClick={() => setResetSignal((n) => n + 1)}
                disabled={!selectedIssue}
              >
                Reset
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Accept All Dialog */}
      <Modal
        open={acceptAllOpen}
        title="Complete Review for Report"
        body={
          <p>
            You are about to mark this report’s review as <strong>completed</strong>.
            Vendors will see accepted issues as active (subject to visibility). Proceed?
          </p>
        }
        confirmText="Mark as Completed"
        onConfirm={async () => {
          setAcceptAllOpen(false);
          setIsCompletingAll(true);
          setCompleteCount(0);
          setCompleteErrors(0);

          // only update issues not yet completed
          const pending = reportIssues.filter(
            (it) => (it as any).review_status !== "completed"
          );

          for (const it of pending) {
            try {
              const body = buildIssuePutBody(it, { review_status: "completed" } as any);
              await updateIssue(body as any).unwrap();
              setCompleteCount((c) => c + 1);
            } catch {
              setCompleteErrors((e) => e + 1);
            }
          }

          await refetch();
          setTimeout(() => setIsCompletingAll(false), 600);
        }}
        onClose={() => setAcceptAllOpen(false)}
      />

      {/* Complete Modal */}
      <Modal
        open={completeOpen}
        title="Mark Report as Reviewed"
        body={
          <p>
            You’re about to <strong>mark this report as reviewed</strong>. All accepted
            issues will be published and visible in the report.
          </p>
        }
        confirmText="Complete"
        onConfirm={async () => {
          try {
            const payload = buildReportPutBody(report, "completed");
            if (payload) {
              await updateReport(payload as any).unwrap();
            }
            navigate(`/listings/${listingId ?? ""}`);
          } catch (e) {
            console.error("Failed to mark report completed:", (e as any)?.data ?? e);
          } finally {
            await refetch(); // refresh issues view just in case
          }
        }}
        onClose={() => setCompleteOpen(false)}
      />


      {/* Add Issue Modal */}
      {isAddIssueModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-lg p-6 relative">
            <button
              onClick={handleModalClose}
              className="absolute top-2 right-4 text-3xl font-light text-gray-600 hover:text-gray-800"
              aria-label="Close"
            >
              &times;
            </button>
            <h6 className="text-lg font-semibold mb-4">Create New Issue</h6>
            <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-4">
              {/* Type */}
              <div className="relative col-span-12">
                <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
                  Type
                </label>
                <select
                  name="type"
                  className="w-full rounded-lg cursor-pointer border border-gray-300 bg-white px-5 py-2.5 appearance-none disabled:opacity-60"
                  value={formData.type}
                  required
                  disabled={isCreating}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                >
                  <option value="" disabled hidden>
                    Select an issue type
                  </option>
                  {VENDOR_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 top-8 right-4 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
                  className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 disabled:opacity-60"
                  placeholder="Short summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  disabled={isCreating}
                  required
                />
              </div>

              {/* Description */}
              <div className="col-span-12">
                <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
                  Description
                </label>
                <textarea
                  name="description"
                  className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 disabled:opacity-60"
                  placeholder="Detailed description"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={isCreating}
                  required
                />
              </div>

              {/* Severity */}
              <div className="relative col-span-12 sm:col-span-6">
                <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
                  Severity
                </label>
                <select
                  name="severity"
                  className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 cursor-pointer appearance-none disabled:opacity-60"
                  value={formData.severity}
                  required
                  disabled={isCreating}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      severity: e.target.value,
                    }))
                  }
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
                  <svg
                    className="w-5 h-5 text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Marketplace visibility */}
              <div className="col-span-12">
                <div className="rounded-xl border-2 p-4 bg-blue-50/40 border-blue-200">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-blue-900">Marketplace visibility</h4>
                      <p className="text-sm text-blue-800/80 mt-1">
                        If <strong>Active</strong>, this issue will appear in the marketplace for vendors.
                        Turn it off to keep it hidden from vendors.
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={formData.active}
                        onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                        disabled={isCreating}
                      />
                      <span className="w-10 h-6 bg-neutral-300 rounded-full peer-checked:bg-blue-600 transition relative">
                        <span className="absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full transition peer-checked:translate-x-4" />
                      </span>
                      <span className="text-sm font-medium">
                        {formData.active ? "Active" : "Inactive"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="col-span-12">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="btn bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 disabled:opacity-60 inline-flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                      </svg>
                      Submitting…
                    </>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Issue Dialog (wired) */}
      <Modal
        open={pendingDeleteIssueId !== null}
        title="Delete Issue"
        body={
          <p>
            You are about to <strong>delete</strong> this issue. This action cannot be
            undone. Are you sure?
          </p>
        }
        confirmText="Delete"
        danger
        onConfirm={async () => {
          if (pendingDeleteIssueId == null) return;
          const idToDelete = pendingDeleteIssueId;

          // choose a fallback selection from the same report BEFORE deleting
          const remaining = reportIssues.filter((i) => i.id !== idToDelete);
          const nextSelectedId = remaining[0]?.id ?? null;

          try {
            await deleteIssue(idToDelete).unwrap();
            if (selectedIssueId === idToDelete) {
              setSelectedIssueId(nextSelectedId);
            }
          } catch (e) {
            console.error("Delete failed", e);
          }
        }}
        onClose={() => setPendingDeleteIssueId(null)}
      />
    </div>
  );
}