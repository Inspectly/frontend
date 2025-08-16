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
  faPlus, // <-- added
} from "@fortawesome/free-solid-svg-icons";
import { useGetIssuesQuery } from "../features/api/issuesApi";
import { IssueType } from "../types";

// 👇 import the single self-contained manager (no other slider needed)
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

  // Build a "From report" image pool by scanning all issues in this report.
  // We gather URLs from `issue.images` (string[]) or `issue.image_url` (string).
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
    // Create stable-ish ids for demo; backend will replace with real ids later
    let counter = 1;
    return urls.map((u) => ({
      image_id: counter++,
      url: u,
      thumb_url: u,
    }));
  }, [reportIssues]);

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (isError) return <div className="p-6">Failed to load issues.</div>;

  return (
    <div className="min-h-screen bg-neutral-50">
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
        <aside className="w-72 shrink-0 bg-white border rounded-xl h-[calc(100vh-140px)] sticky top-[88px] overflow-y-auto">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">
                Issues ({reportIssues.length})
              </h2>
              <p className="text-xs text-neutral-500">
                Select an issue to review & update
              </p>
            </div>
            {/* Add Issue button (visual only for now) */}
            <button
              type="button"
              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border hover:bg-neutral-50"
              title="Add Issue"
              onClick={() => {
                // TODO: wire up modal or navigation later
                console.log("Add Issue clicked");
              }}
            >
              <FontAwesomeIcon color={'blue'} icon={faPlus} />
            </button>
          </div>

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
                  <li key={issue.id}>
                    <button
                      onClick={() => setSelectedIssueId(issue.id)}
                      className={[
                        "w-full text-left px-3 py-2 rounded-lg flex items-start gap-3",
                        active ? "bg-blue-50 text-blue-700" : "hover:bg-neutral-50",
                      ].join(" ")}
                    >
                      <FontAwesomeIcon
                        icon={icon}
                        className={["mt-0.5", active ? "" : "text-neutral-500"].join(
                          " "
                        )}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium">
                          {issue.type || "other"}
                        </div>
                        <div className="text-xs text-neutral-500 truncate">
                          {snippet(issue.summary)}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Main review card */}
        <main className="flex-1">
          <div className="border rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="p-4 space-y-6">
              {!selectedIssue ? (
                <div className="text-neutral-500 text-sm">
                  Select an issue from the left to review.
                </div>
              ) : (
                <IssueEditor
                  key={selectedIssue.id}
                  issue={selectedIssue}
                  reportImages={reportImagePool}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/** Editable Issue card showing: Type, Summary, Description, Images (interactive), and Active */
function IssueEditor({
  issue,
  reportImages,
}: {
  issue: IssueType;
  reportImages: ReportImage[];
}) {
  const [summary, setSummary] = useState<string>(issue.summary ?? "");
  const [description, setDescription] = useState<string>(
    (issue as any).description ?? ""
  );
  const [active, setActive] = useState<boolean>(Boolean((issue as any).active));

  // Build initial current images for this issue (local-only for demo)
  const initialIssueImages: IssueImage[] = useMemo(() => {
    const urls: string[] = Array.isArray((issue as any).images)
      ? ((issue as any).images as string[])
      : (issue as any).image_url
      ? [String((issue as any).image_url)]
      : [];
    return urls.map((u, idx) => ({
      issue_image_id: idx + 1, // demo id; backend will supply real link ids
      image_id: 1000 + idx + 1, // demo file id
      url: u,
      thumb_url: u,
      order_index: idx,
    }));
  }, [issue]);

  // Keep a local copy so the manager re-syncs if needed on prop change
  const [currentImages, setCurrentImages] = useState<IssueImage[]>(
    initialIssueImages
  );

  // simple incremental id generator for demo-created images
  const idSeqRef = useRef<number>(currentImages.length + 1);
  const genLinkId = () => idSeqRef.current++;
  const genFileId = () => 100000 + idSeqRef.current++;

  // --- Callbacks for IssueImageManager (local, optimistic demo versions) ---

  const onAttachExisting = async (imageIds: number[]): Promise<IssueImage[]> => {
    // Map selected report images into IssueImage objects
    const picked = reportImages.filter((ri) => imageIds.includes(ri.image_id));
    const newly: IssueImage[] = picked.map((ri) => ({
      issue_image_id: genLinkId(),
      image_id: ri.image_id ?? genFileId(),
      url: ri.url,
      thumb_url: ri.thumb_url ?? ri.url,
      order_index: 0, // will be normalized below
    }));

    // Update local state to persist across re-renders
    setCurrentImages((prev) =>
      [...prev, ...newly].map((it, i) => ({ ...it, order_index: i }))
    );

    return newly;
  };

  const createdObjectUrlsRef = useRef<string[]>([]);
  useEffect(() => {
    // cleanup any object URLs we created for demo uploads
    return () => {
      createdObjectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const onUploadNew = async (files: File[]): Promise<IssueImage[]> => {
    // For demo: create object URLs to preview locally
    const newly: IssueImage[] = files.map((file) => {
      const url = URL.createObjectURL(file);
      createdObjectUrlsRef.current.push(url);
      return {
        issue_image_id: genLinkId(),
        image_id: genFileId(),
        url,
        thumb_url: url,
        order_index: 0, // will be normalized
      };
    });

    setCurrentImages((prev) =>
      [...prev, ...newly].map((it, i) => ({ ...it, order_index: i }))
    );

    // In real app: presign + upload to S3, then return server-provided records
    return newly;
  };

  const onRemove = async (issueImageId: number): Promise<void> => {
    setCurrentImages((prev) =>
      prev
        .filter((it) => it.issue_image_id !== issueImageId)
        .map((it, i) => ({ ...it, order_index: i }))
    );
    // In real app: call DELETE /issues/{id}/images/{issue_image_id}
  };

  const onReorder = async (orderedIssueImageIds: number[]): Promise<void> => {
    setCurrentImages((prev) => {
      const byId = new Map(prev.map((p) => [p.issue_image_id, p]));
      const next = orderedIssueImageIds
        .map((id, i) => ({ ...(byId.get(id) as IssueImage), order_index: i }))
        .filter(Boolean);
      return next;
    });
    // In real app: PATCH /issues/{id}/images/reorder with ordered ids
  };

  const handleSave = () => {
    console.log("Save issue", {
      id: issue.id,
      type: issue.type,
      summary,
      description,
      active,
      images: currentImages.map((ci) => ci.url), // demo payload
    });
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

      {/* Images (interactive manager) */}
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

      {/* Active */}
      <div className="rounded-xl border-2 p-4 bg-blue-50/40 border-blue-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="font-semibold text-blue-900">Marketplace visibility</h4>
            <p className="text-sm text-blue-800/80 mt-1">
              If <strong>Active</strong>, this issue will appear in the
              marketplace for vendors. Turn it off to keep it hidden from
              vendors.
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

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
          onClick={handleSave}
        >
          Save
        </button>
        <button
          className="px-3 py-2 rounded-lg border text-sm hover:bg-neutral-50"
          onClick={() => {
            setSummary(issue.summary ?? "");
            setDescription((issue as any).description ?? "");
            setActive(Boolean((issue as any).active));
            // Reset images to initial for demo
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
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
