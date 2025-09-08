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
import { useGetIssuesQuery } from "../features/api/issuesApi";
import { IssueType } from "../types";

import IssueImageManager, {
  IssueImage,
  ReportImage,
} from "../components/IssueImageManager";

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

function snippet(text?: string, max = 42) {
  if (!text) return "—";
  const t = text.trim();
  return t.length <= max ? t : t.slice(0, max - 1) + "…";
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
  const { data: issues = [], isLoading, isError } = useGetIssuesQuery();

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

  // --- Main editor footer control signals (locked footer buttons open child modals) ---
  const [saveSignal, setSaveSignal] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);

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
                onClick={() => console.log("Add Issue clicked")}
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
                  const icon = issueIcons[issue.type] || faWrench;

                  return (
                    <li key={issue.id} className="mb-2">
                      {/* Unified wrapper so hover covers whole item */}
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

                          {/* Status dot (UI-only; wire logic later) */}
                          <span
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full"
                            title="Not opened"
                          >
                            <FontAwesomeIcon icon={faCircle} className="text-amber-500" />
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
                              onClick={() => console.log("Accept issue clicked", issue.id)}
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

          {/* Rigid footer (does not scroll) */}
          <div className="border-t px-4 py-3 flex justify-end gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
              title="Accept All"
              onClick={() => setAcceptAllOpen(true)}
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
        onConfirm={() => console.log("Accept All confirmed (UI only)")}
        onClose={() => setAcceptAllOpen(false)}
      />

      {/* Delete Issue Dialog */}
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
          console.log("Delete issue confirmed (UI only)", pendingDeleteIssueId);
        }}
        onClose={() => setPendingDeleteIssueId(null)}
      />
    </div>
  );
}

/** Editable Issue card
 * - Severity (its own compact block)
 * - Visibility (full descriptive block BELOW severity)
 * - Save/Reset modals triggered by parent footer via signals
 */
function IssueEditor({
  issue,
  reportImages,
  saveSignal,
  resetSignal,
}: {
  issue: IssueType;
  reportImages: ReportImage[];
  saveSignal: number;
  resetSignal: number;
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
    ((issue as any).severity as Severity) ?? "medium"
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
  const doSave = () => {
    console.log("Save issue (confirmed)", {
      id: issue.id,
      type: issue.type,
      severity,
      summary,
      description,
      active,
      images: currentImages.map((ci) => ci.url),
    });
  };
  const doReset = () => {
    setSummary(issue.summary ?? "");
    setDescription((issue as any).description ?? "");
    setActive(Boolean((issue as any).active));
    setSeverity(((issue as any).severity as Severity) ?? "medium");
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
      {/* Type */}
      <div>
        <label className="text-sm font-medium text-neutral-700">Type</label>
        <div className="mt-1 text-sm px-3 py-2 rounded-lg border bg-neutral-50">
          {issue.type || "other"}
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

      {/* Severity (compact, its own block) */}
      <div>
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

      {/* Visibility (full descriptive card, its own block BELOW severity) */}
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

      {/* Modals opened by parent footer */}
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
