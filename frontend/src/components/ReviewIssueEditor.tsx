import React, { useEffect, useMemo, useRef, useState } from "react";
import { IssueType } from "../types";
import IssueImageManager, { IssueImage, ReportImage } from "./IssueImageManager";


type Severity = "low" | "medium" | "high";
type UiSeverity = Severity;

export type UpdateIssueFn = (body: any) => { unwrap: () => Promise<any> };

function mapServerSeverityToUi(s?: string): UiSeverity {
  if (!s) return "medium";
  const val = s.toLowerCase();
  if (val === "low") return "low";
  if (val === "high") return "high";
  return "medium";
}

interface Props {
  issue: IssueType;
  reportImages: ReportImage[];
  saveSignal: number;
  resetSignal: number;
  updateIssue: UpdateIssueFn;
  refetch: () => void;
  buildIssuePutBody: (original: IssueType, patch: Partial<IssueType>) => IssueType;
}

const ReviewIssueEditor: React.FC<Props> = ({
  issue,
  reportImages,
  saveSignal,
  resetSignal,
  updateIssue,
  refetch,
  buildIssuePutBody,
}) => {
  const SEVERITY_OPTIONS: { value: Severity; label: string }[] = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];

  const [summary, setSummary] = useState<string>(issue.summary ?? "");
  const [description, setDescription] = useState<string>((issue as any).description ?? "");
  const [active, setActive] = useState<boolean>(Boolean((issue as any).active));
  const [severity, setSeverity] = useState<Severity>(mapServerSeverityToUi((issue as any).severity) as Severity);

  // open modals when signals increment (lightweight)
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
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

  // initial images
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

  const [currentImages, setCurrentImages] = useState<IssueImage[]>(initialIssueImages);
  const idSeqRef = useRef<number>(currentImages.length + 1);
  const genLinkId = () => idSeqRef.current++;
  const genFileId = () => 100000 + idSeqRef.current++;

  const createdObjectUrlsRef = useRef<string[]>([]);
  useEffect(() => {
    return () => {
      createdObjectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const onAttachExisting = async (imageIds: number[]): Promise<IssueImage[]> => {
    const picked = reportImages.filter((ri) => imageIds.includes(ri.image_id));
    const newly: IssueImage[] = picked.map((ri) => ({
      issue_image_id: genLinkId(),
      image_id: ri.image_id ?? genFileId(),
      url: ri.url,
      thumb_url: ri.thumb_url ?? ri.url,
      order_index: 0,
    }));
    setCurrentImages((prev) => [...prev, ...newly].map((it, i) => ({ ...it, order_index: i })));
    return newly;
  };

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
    setCurrentImages((prev) => [...prev, ...newly].map((it, i) => ({ ...it, order_index: i })));
    return newly;
  };

  const onRemove = async (issueImageId: number) => {
    setCurrentImages((prev) => prev.filter((it) => it.issue_image_id !== issueImageId).map((it, i) => ({ ...it, order_index: i })));
  };

  const onReorder = async (orderedIssueImageIds: number[]) => {
    setCurrentImages((prev) => {
      const byId = new Map(prev.map((p) => [p.issue_image_id, p]));
      return orderedIssueImageIds.map((id, i) => ({ ...(byId.get(id) as IssueImage), order_index: i })).filter(Boolean);
    });
  };

  const doSave = async () => {
    try {
      const body = buildIssuePutBody(issue, {
        summary,
        description,
        active,
        severity,
        review_status: "completed",
      });
      await updateIssue(body).unwrap();
      await refetch();
    } catch (e) {
      console.error("Save failed:", e);
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
      {/* Type + Severity */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex-1">
          <label className="text-sm font-medium text-neutral-700">Type</label>
          <div className="mt-1 text-sm px-3 py-2 rounded-lg border bg-neutral-50">
            {issue.type || "other"}
          </div>
        </div>

        <div className="sm:w-auto">
          <label htmlFor="severity" className="text-sm font-medium text-neutral-700">Severity</label>
          <div className="mt-1 relative">
            <select
              id="severity"
              className="block w-40 appearance-none rounded-lg border px-3 py-2 text-sm pr-9"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
            >
              {SEVERITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-400">▾</span>
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

      {/* Visibility */}
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
            <span className="text-sm font-medium">{active ? "Active" : "Inactive"}</span>
          </label>
        </div>
      </div>

      {/* Save / Reset confirmations */}
      {confirmSaveOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmSaveOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border p-4">
            <h3 className="text-base font-semibold mb-2">Accept & Save Changes</h3>
            <p className="text-sm text-neutral-700 mb-4">
              You are about to <strong>save</strong> changes for this issue. Proceed?
            </p>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 rounded-lg border text-sm" onClick={() => setConfirmSaveOpen(false)}>Cancel</button>
              <button
                className="px-3 py-2 rounded-lg text-white text-sm font-semibold bg-blue-600 hover:bg-blue-700"
                onClick={async () => { await doSave(); setConfirmSaveOpen(false); }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmResetOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmResetOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border p-4">
            <h3 className="text-base font-semibold mb-2">Reset Issue Changes</h3>
            <p className="text-sm text-neutral-700 mb-4">Reset all unsaved changes for this issue?</p>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 rounded-lg border text-sm" onClick={() => setConfirmResetOpen(false)}>Cancel</button>
              <button
                className="px-3 py-2 rounded-lg text-white text-sm font-semibold bg-blue-600 hover:bg-blue-700"
                onClick={() => { doReset(); setConfirmResetOpen(false); }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewIssueEditor;
