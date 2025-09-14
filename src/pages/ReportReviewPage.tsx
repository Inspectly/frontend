// src/pages/ReportReviewPage.tsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
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
  faPlus,
  faCheck,
  faXmark,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";

import {
  useGetIssuesQuery,
  useUpdateIssueMutation,
  useCreateIssueMutation,
} from "../features/api/issuesApi";

import { IssueType } from "../types";
import IssueImageManager, { IssueImage, ReportImage } from "../components/IssueImageManager";

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

/** Build a FULL Issue body for PUT by merging original + patch */
function buildIssuePutBody(original: IssueType, patch: Partial<IssueType>) {
  const merged: any = {
    id: original.id,
    report_id: (patch as any).report_id ?? (original as any).report_id,
    vendor_id: (patch as any).vendor_id ?? (original as any).vendor_id ?? null,

    type: (patch as any).type ?? (original as any).type ?? "other",
    description: (patch as any).description ?? (original as any).description ?? "",
    summary: (patch as any).summary ?? (original as any).summary ?? "",

    severity: mapUiSeverityToServer(
      (patch as any).severity ?? mapServerSeverityToUi((original as any).severity)
    ),

    status: (patch as any).status ?? (original as any).status ?? "open",
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

  return merged as IssueType;
}

/** Lightweight modal */
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

export default function ReportReviewPage() {
  const { listingId, reportId } = useParams<RouteParams>();
  const {
    data: issues = [],
    isLoading,
    isError,
    refetch,
  } = useGetIssuesQuery();

  const [updateIssue] = useUpdateIssueMutation();
  const [createIssue] = useCreateIssueMutation();

  const reportIssues: IssueType[] = useMemo(() => {
    if (!reportId) return [];
    return (issues as IssueType[]).filter(
      (i) => String(i.report_id) === String(reportId)
    );
  }, [issues, reportId]);

  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);
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
  const [formData, setFormData] = useState<{
    type: string;
    description: string;
    summary: string;
    severity: string; // ui: "low" | "medium" | "high"
    active: boolean;
  }>({
    type: "",
    description: "",
    summary: "",
    severity: "",
    active: true,
  });

  const handleModalClose = () => {
    setIsAddIssueModalOpen(false);
    setFormData({
      type: "",
      description: "",
      summary: "",
      severity: "",
      active: true,
    });
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
      const created = await createIssue({
        report_id: Number(reportId),
        type: formData.type,
        description: formData.description,
        summary: formData.summary,
        severity: mapUiSeverityToServer(formData.severity as UiSeverity),
        active: formData.active,
        status: "open",          
        review_status: "completed", 
        image_url: "",           
      } as any).unwrap();

      await refetch();
      setIsAddIssueModalOpen(false);

      if (created?.id && String(created.report_id) === String(reportId)) {
        setSelectedIssueId(created.id);
      }
    } catch (err) {
      console.error("Failed to create issue:", err);
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
      updateIssue(body).unwrap().catch((e) => console.error("Failed to set in_review:", e));
    }
  }, [selectedIssue, updateIssue]);

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (isError) return <div className="p-6">Failed to load issues.</div>;

  return (
    <div className="bg-neutral-50">
      {/* Header / breadcrumb */}
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            to={`/listings/${listingId}`}
            className="text-blue-600 hover:underline flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Reports
          </Link>
          <span className="text-neutral-400">/</span>
          <span className="text-neutral-700 font-bold">Reviewing Report</span>
        </div>
      </header>

      {/* Workspace */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="w-80 shrink-0 bg-white border rounded-xl h-[calc(100vh-140px)] sticky top-[88px] overflow-hidden flex flex-col">
          {/* Top bar */}
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">
                Issues ({reportIssues.length})
              </h2>
              <p className="text-xs text-neutral-500">
                Select an issue to review & update
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border hover:bg-neutral-50"
                title="Add Issue"
                onClick={() => setIsAddIssueModalOpen(true)}
              >
                <FontAwesomeIcon color={"blue"} icon={faPlus} />
              </button>
            </div>
          </div>

          {/* Scrollable items */}
          <div className="flex-1 overflow-y-auto">
            {reportIssues.length === 0 ? (
              <div className="p-4 text-sm text-neutral-600">
                No issues found for this report.
              </div>
            ) : (
              <ul className="p-2">
                {reportIssues.map((issue) => {
                  const active = issue.id === selectedIssueId;
                  const icon = issueIcons[(issue.type || "").toLowerCase()] || faWrench;

                  return (
                    <li key={issue.id} className="mb-2">
                      <div
                        className={[
                          "w-full rounded-lg border p-2 transition",
                          active
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "hover:bg-neutral-50 border-transparent",
                        ].join(" ")}
                      >
                        {/* Row 1: icon + title + dot */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedIssueId(issue.id)}
                            className="shrink-0"
                            title="Open"
                          >
                            <FontAwesomeIcon
                              icon={icon}
                              className={active ? "" : "text-neutral-500"}
                            />
                          </button>

                          <button
                            onClick={() => setSelectedIssueId(issue.id)}
                            className="min-w-0 text-left flex-1"
                            title="Open"
                          >
                            <div className="text-sm font-medium truncate">
                              {issue.type || "other"}
                            </div>
                          </button>

                          {/* Status dot */}
                          <span
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full"
                            title={(issue as any).review_status || "not_reviewed"}
                          >
                            <FontAwesomeIcon
                              icon={faCircle}
                              className={
                                (issue as any).review_status === "completed"
                                  ? "text-green-600"
                                  : (issue as any).review_status === "in_review"
                                  ? "text-amber-500"
                                  : "text-neutral-300"
                              }
                            />
                          </span>
                        </div>

                        {/* Row 2: summary */}
                        <div className="text-xs text-neutral-500 truncate">
                          {snippet(issue.summary)}
                        </div>

                        {/* Row 3: bottom-right actions */}
                        <div className="mt-1 flex justify-end">
                          <div className="ml-2 flex gap-1">
                            <button
                              className="inline-flex items-center justify-center w-8 h-8 rounded-md border hover:bg-green-50"
                              title="Accept issue"
                              onClick={() => {
                                const body = buildIssuePutBody(issue, { review_status: "completed" } as any);
                                updateIssue(body)
                                  .unwrap()
                                  .catch((e) => console.error("Mark completed failed:", e));
                              }}
                            >
                              <FontAwesomeIcon icon={faCheck} className="text-green-600" />
                            </button>
                            <button
                              className="inline-flex items-center justify-center w-8 h-8 rounded-md border hover:bg-red-50"
                              title="Delete issue"
                              onClick={() => setPendingDeleteIssueId(issue.id)}
                            >
                              <FontAwesomeIcon icon={faXmark} className="text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Rigid footer */}
          <div className="border-t px-4 py-3 flex justify-end gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              title="Accept All"
              onClick={() => setAcceptAllOpen(true)}
              disabled={reportIssues.length === 0}
            >
              Accept All
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-neutral-50"
              title="Cancel"
              onClick={() => console.log("cancel clicked")}
            >
              Cancel
            </button>
          </div>

          {/* Progress area (shows while Accept All loop runs) */}
          {isCompletingAll && (
            <div className="px-4 pb-3 text-xs text-neutral-700">
              Completing issues… {completeCount}/{reportIssues.length}
              {completeErrors > 0 && (
                <span className="text-red-600"> • errors: {completeErrors}</span>
              )}
              <div className="mt-1 h-1 w-full bg-neutral-200 rounded">
                <div
                  className="h-1 bg-blue-600 rounded"
                  style={{ width: `${(completeCount / Math.max(1, reportIssues.length)) * 100}%` }}
                />
              </div>
            </div>
          )}
        </aside>

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
                  <IssueEditor
                    key={selectedIssue.id}
                    issue={selectedIssue}
                    reportImages={reportImagePool}
                    saveSignal={saveSignal}
                    resetSignal={resetSignal}
                    updateIssue={updateIssue}
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

          for (const it of reportIssues) {
            try {
              const body = buildIssuePutBody(it, { review_status: "completed" } as any);
              await updateIssue(body as any).unwrap();
              setCompleteCount((c) => c + 1);
            } catch {
              setCompleteErrors((e) => e + 1);
            }
          }

          setTimeout(() => setIsCompletingAll(false), 600);
        }}
        onClose={() => setAcceptAllOpen(false)}
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
                  className="w-full rounded-lg cursor-pointer border border-gray-300 bg-white px-5 py-2.5 appearance-none"
                  value={formData.type}
                  required
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
                  className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5"
                  placeholder="Short summary"
                  value={formData.summary}
                  onChange={handleInputChange}
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
                  className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5"
                  placeholder="Detailed description"
                  value={formData.description}
                  onChange={handleInputChange}
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
                  className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 cursor-pointer appearance-none"
                  value={formData.severity}
                  required
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

              {/* Marketplace visibility (new line, same look/feel as review page) */}
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
                  className="btn bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Issue Dialog (wired later) */}
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
        onConfirm={() => {
          console.log("Delete issue confirmed (to be wired)", pendingDeleteIssueId);
        }}
        onClose={() => setPendingDeleteIssueId(null)}
      />
    </div>
  );
}

/** Editable Issue card */
function IssueEditor({
  issue,
  reportImages,
  saveSignal,
  resetSignal,
  updateIssue,
}: {
  issue: IssueType;
  reportImages: ReportImage[];
  saveSignal: number;
  resetSignal: number;
  updateIssue: ReturnType<typeof useUpdateIssueMutation>[0];
}) {
  type Severity = "low" | "medium" | "high";
  const SEVERITY_OPTIONS: { value: Severity; label: string }[] = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];

  const [summary, setSummary] = useState<string>(issue.summary ?? "");
  const [description, setDescription] = useState<string>(
    (issue as any).description ?? ""
  );
  const [active, setActive] = useState<boolean>(Boolean((issue as any).active));
  const [severity, setSeverity] = useState<Severity>(
    mapServerSeverityToUi((issue as any).severity) as Severity
  );

  // local confirm dialogs (opened by parent signals)
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // open modals when signals increment
  const prevSaveSig = useRef(saveSignal);
  const prevResetSig = useRef(resetSignal);
  useEffect(() => {
    if (saveSignal !== prevSaveSig.current) {
      prevSaveSig.current = saveSignal;
      setConfirmSaveOpen(true);
    }
  }, [saveSignal]);
  useEffect(() => {
    if (resetSignal !== prevResetSig.current) {
      prevResetSig.current = resetSignal;
      setConfirmResetOpen(true);
    }
  }, [resetSignal]);

  // Build initial current images (demo)
  const initialIssueImages: IssueImage[] = useMemo(() => {
    const urls: string[] = Array.isArray((issue as any).images)
      ? ((issue as any).images as string[])
      : (issue as any).image_url
      ? [String((issue as any).image_url)]
      : [];
    return urls.map((u, idx) => ({
      issue_image_id: idx + 1,
      image_id: 1000 + idx + 1,
      url: u,
      thumb_url: u,
      order_index: idx,
    }));
  }, [issue]);

  const [currentImages, setCurrentImages] = useState<IssueImage[]>(
    initialIssueImages
  );

  const idSeqRef = useRef<number>(currentImages.length + 1);
  const genLinkId = () => idSeqRef.current++;
  const genFileId = () => 100000 + idSeqRef.current++;

  const onAttachExisting = async (imageIds: number[]): Promise<IssueImage[]> => {
    const picked = reportImages.filter((ri) => imageIds.includes(ri.image_id));
    const newly: IssueImage[] = picked.map((ri) => ({
      issue_image_id: genLinkId(),
      image_id: ri.image_id ?? genFileId(),
      url: ri.url,
      thumb_url: ri.thumb_url ?? ri.url,
      order_index: 0,
    }));
    setCurrentImages((prev) =>
      [...prev, ...newly].map((it, i) => ({ ...it, order_index: i }))
    );
    return newly;
  };

  const createdObjectUrlsRef = useRef<string[]>([]);
  useEffect(() => {
    return () => {
      createdObjectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const onUploadNew = async (files: File[]): Promise<IssueImage[]> => {
    const newly: IssueImage[] = files.map((file) => {
      const url = URL.createObjectURL(file);
      createdObjectUrlsRef.current.push(url);
      return {
        issue_image_id: genLinkId(),
        image_id: genFileId(),
        url,
        thumb_url: url,
        order_index: 0,
      };
    });
    setCurrentImages((prev) =>
      [...prev, ...newly].map((it, i) => ({ ...it, order_index: i }))
    );
    return newly;
  };

  const onRemove = async (issueImageId: number): Promise<void> => {
    setCurrentImages((prev) =>
      prev
        .filter((it) => it.issue_image_id !== issueImageId)
        .map((it, i) => ({ ...it, order_index: i }))
    );
  };

  const onReorder = async (orderedIssueImageIds: number[]): Promise<void> => {
    setCurrentImages((prev) => {
      const byId = new Map(prev.map((p) => [p.issue_image_id, p]));
      const next = orderedIssueImageIds
        .map((id, i) => ({ ...(byId.get(id) as IssueImage), order_index: i }))
        .filter(Boolean);
      return next;
    });
  };

  // actual save / reset
  const doSave = async () => {
    try {
      const body = buildIssuePutBody(issue, {
        summary,
        description,
        active,
        severity, // UI -> server mapping inside buildIssuePutBody
        review_status: "completed",
      } as any);
      await updateIssue(body as any).unwrap();
    } catch (e) {
      console.error("Save failed", e);
    }
  };

  const doReset = () => {
    setSummary(issue.summary ?? "");
    setDescription((issue as any).description ?? "");
    setActive(Boolean((issue as any).active));
    setSeverity(mapServerSeverityToUi((issue as any).severity) as any);
    const reset = (Array.isArray((issue as any).images)
      ? ((issue as any).images as string[])
      : (issue as any).image_url
      ? [String((issue as any).image_url)]
      : []
    ).map((u, idx) => ({
      issue_image_id: idx + 1,
      image_id: 1000 + idx + 1,
      url: u,
      thumb_url: u,
      order_index: idx,
    })) as IssueImage[];
    setCurrentImages(reset);
    idSeqRef.current = reset.length + 1;
  };

  return (
    <div className="space-y-6">
      {/* Type + Severity (inline row) */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        {/* Type */}
        <div className="flex-1">
          <label className="text-sm font-medium text-neutral-700">Type</label>
          <div className="mt-1 text-sm px-3 py-2 rounded-lg border bg-neutral-50">
            {issue.type || "other"}
          </div>
        </div>

        {/* Severity */}
        <div className="sm:w-auto">
          <label htmlFor="severity" className="text-sm font-medium text-neutral-700">
            Severity
          </label>
          <div className="mt-1 relative">
            <select
              id="severity"
              className="block w-40 appearance-none rounded-lg border px-3 py-2 text-sm pr-9"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
            >
              {SEVERITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-400">
              ▾
            </span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div>
        <label className="text-sm font-medium text-neutral-700">Summary</label>
        <textarea
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-medium text-neutral-700">Description</label>
        <textarea
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Images */}
      <div>
        <label className="text-sm font-medium text-neutral-700">Images</label>
        <div className="mt-2">
          <IssueImageManager
            currentImages={currentImages}
            reportImages={reportImages}
            onAttachExisting={onAttachExisting}
            onUploadNew={onUploadNew}
            onRemove={onRemove}
            onReorder={onReorder}
            heightClassName="h-72 sm:h-80 md:h-96"
          />
        </div>
      </div>

      {/* Visibility (same as your request) */}
      <div className="rounded-xl border-2 p-4 bg-blue-50/40 border-blue-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="font-semibold text-blue-900">Marketplace visibility</h4>
            <p className="text-sm text-blue-800/80 mt-1">
              If <strong>Active</strong>, this issue will appear in the marketplace
              for vendors. Turn it off to keep it hidden from vendors.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <span className="w-10 h-6 bg-neutral-300 rounded-full peer-checked:bg-blue-600 transition relative">
              <span className="absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full transition peer-checked:translate-x-4" />
            </span>
            <span className="text-sm font-medium">
              {active ? "Active" : "Inactive"}
            </span>
          </label>
        </div>
      </div>

      {/* Modals (triggered by parent) */}
      <Modal
        open={confirmSaveOpen}
        title="Accept & Save Changes"
        body={
          <p>
            You are about to <strong>save</strong> changes for this issue. This cannot be
            undone and means you are accepting this issue. Proceed?
          </p>
        }
        confirmText="Save Changes"
        onConfirm={doSave}
        onClose={() => setConfirmSaveOpen(false)}
      />
      <Modal
        open={confirmResetOpen}
        title="Reset Issue Changes"
        body={<p>You are about to reset all unsaved changes for this issue. Continue?</p>}
        confirmText="Reset"
        onConfirm={doReset}
        onClose={() => setConfirmResetOpen(false)}
      />
    </div>
  );
}
