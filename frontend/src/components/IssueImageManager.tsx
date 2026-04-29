import React, { useEffect, useMemo, useRef, useState } from "react";

/** ---- Types you can reuse ---- */
export type IssueImage = {
  issue_image_id: number;   // link row id
  image_id: number;         // file id
  url: string;              // display URL (signed/public)
  thumb_url?: string;
  caption?: string;
  order_index: number;
};

export type ReportImage = {
  image_id: number;
  url: string;
  thumb_url?: string;
};

interface IssueImageManagerProps {
  /** Data */
  currentImages: IssueImage[];
  reportImages: ReportImage[];

  /** Server actions (wire these to RTK Query or your API) */
  onAttachExisting: (imageIds: number[]) => Promise<IssueImage[]>;
  onUploadNew: (files: File[]) => Promise<IssueImage[]>;
  onRemove: (issueImageId: number) => Promise<void>;
  onReorder: (orderedIssueImageIds: number[]) => Promise<void>;

  /** UI */
  className?: string;
  heightClassName?: string;           // e.g. "h-72 sm:h-80 md:h-96"
  emptyPlaceholderUrl?: string;       // fallback when no images
}

/** Utility */
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(n, max));

/** Deduplicate files by name+size+lastModified */
const mergeFiles = (existing: File[], incoming: File[]) => {
  const key = (f: File) => `${f.name}__${f.size}__${f.lastModified}`;
  const map = new Map(existing.map(f => [key(f), f]));
  for (const f of incoming) map.set(key(f), f);
  return Array.from(map.values());
};

/**
 * Single, self-contained interactive image slider:
 * - Built-in slider (no external component)
 * - Add (Upload | From Report), Remove current
 * - Drag-and-drop reorder via thumbnails
 * - Fullscreen preview
 */
const IssueImageManager: React.FC<IssueImageManagerProps> = ({
  currentImages,
  reportImages,
  onAttachExisting,
  onUploadNew,
  onRemove,
  onReorder,
  className = "",
  heightClassName = "h-72 sm:h-80 md:h-96",
  emptyPlaceholderUrl = "/images/no-image.webp",
}) => {
  /* ---------- Local (optimistic) state ---------- */
  const sortedInitial = useMemo(
    () => [...currentImages].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
    [currentImages]
  );
  const [items, setItems] = useState<IssueImage[]>(sortedInitial);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [busy, setBusy] = useState<boolean>(false);

  // Add modal state
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [addTab, setAddTab] = useState<"upload" | "report">("upload");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [selectSet, setSelectSet] = useState<Set<number>>(new Set());

  // Upload drag state
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Preview modal
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // Slider internals
  const [slideIndex, setSlideIndex] = useState<number>(0);
  const touchStartX = useRef<number | null>(null);

  // DnD reorder
  const dragFrom = useRef<number | null>(null);

  /* ---------- Sync external data changes ---------- */
  useEffect(() => {
    const next = [...currentImages].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    setItems(next);
    setActiveIndex(prev => clamp(prev, 0, Math.max(0, next.length - 1)));
    setSlideIndex(prev => clamp(prev, 0, Math.max(0, next.length - 1)));
  }, [currentImages]);

  /* ---------- Derived slider images ---------- */
  const sliderImages = useMemo(
    () =>
      (items.length
        ? items.map((it) => ({ src: it.url, alt: `Image ${it.image_id}` }))
        : [{ src: emptyPlaceholderUrl, alt: "No Image Available" }]
      ),
    [items, emptyPlaceholderUrl]
  );

  const currentIssueImageId = items[activeIndex]?.issue_image_id ?? null;

  /* ---------- Slider actions ---------- */
  const goto = (i: number) => {
    const count = sliderImages.length;
    if (!items.length) {
      setSlideIndex(0);
      return;
    }
    const wrapped = (i + count) % count;
    setSlideIndex(wrapped);
    if (items.length) setActiveIndex(wrapped);
  };
  const next = () => goto(slideIndex + 1);
  const prev = () => goto(slideIndex - 1);

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) (delta < 0 ? next() : prev());
    touchStartX.current = null;
  };

  /* ---------- Remove current ---------- */
  const removeCurrent = async () => {
    if (currentIssueImageId == null) return;
    const prev = items;
    const idx = activeIndex;

    // optimistic
    const nextItems = prev
      .filter((it) => it.issue_image_id !== currentIssueImageId)
      .map((it, i) => ({ ...it, order_index: i }));

    setItems(nextItems);
    const newIndex = clamp(idx, 0, Math.max(0, nextItems.length - 1));
    setActiveIndex(newIndex);
    setSlideIndex(newIndex);

    try {
      setBusy(true);
      await onRemove(currentIssueImageId);
    } catch (e) {
      console.error("Failed to remove image", e);
      setItems(prev);
      setActiveIndex(idx);
      setSlideIndex(idx);
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Attach existing (from report) ---------- */
  const attachExisting = async () => {
    if (selectSet.size === 0) return;
    try {
      setBusy(true);
      const newly = await onAttachExisting(Array.from(selectSet));
      const merged = [...items, ...newly]
        .map((it, i) => ({ ...it, order_index: i }))
        .sort((a, b) => a.order_index - b.order_index);
      setItems(merged);
      setIsAddOpen(false);
      setSelectSet(new Set());
      setActiveIndex(items.length);
      setSlideIndex(items.length);
    } catch (e) {
      console.error("Failed to attach images", e);
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Upload new ---------- */
  const uploadNew = async () => {
    if (uploadFiles.length === 0) return;
    try {
      setBusy(true);
      const newly = await onUploadNew(uploadFiles);
      const merged = [...items, ...newly]
        .map((it, i) => ({ ...it, order_index: i }))
        .sort((a, b) => a.order_index - b.order_index);
      setItems(merged);
      setIsAddOpen(false);
      setUploadFiles([]);
      setActiveIndex(items.length);
      setSlideIndex(items.length);
    } catch (e) {
      console.error("Failed to upload images", e);
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Persist reorder ---------- */
  const persistReorder = async (list: IssueImage[]) => {
    const orderedIds = list
      .sort((a, b) => a.order_index - b.order_index)
      .map((it) => it.issue_image_id);
    try {
      setBusy(true);
      await onReorder(orderedIds);
    } catch (e) {
      console.error("Failed to persist reorder", e);
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Move by buttons ---------- */
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const nextList = [...items];
    const [spliced] = nextList.splice(from, 1);
    nextList.splice(to, 0, spliced);
    const withOrder = nextList.map((it, i) => ({ ...it, order_index: i }));
    setItems(withOrder);
    setActiveIndex(to);
    setSlideIndex(to);
    void persistReorder(withOrder);
  };

  /* ---------- Thumbnails drag & drop ---------- */
  const onThumbDragStart = (i: number) => (e: React.DragEvent) => {
    dragFrom.current = i;
    e.dataTransfer.effectAllowed = "move";
  };
  const onThumbDrop = (i: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragFrom.current;
    dragFrom.current = null;
    if (from == null || from === i) return;
    move(from, i);
  };
  const onThumbDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  /* ---------- Upload tab drag & drop handlers ---------- */
  const handleFiles = (files: FileList | File[]) => {
    const list = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setUploadFiles(prev => mergeFiles(prev, list));
  };

  const onDropFiles: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer?.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  };
  const onDragOverUpload: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };
  const onDragEnterUpload: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const onDragLeaveUpload: React.DragEventHandler<HTMLDivElement> = (e) => {
    // Only set false when actually leaving the dropzone (not entering children)
    if (e.currentTarget === e.target) setIsDragOver(false);
  };

  /* ---------- Render ---------- */
  const slideCount = sliderImages.length;
  const showArrows = items.length > 1;
  const showDots = items.length > 1;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Slider */}
      <div
        className={`relative w-full overflow-hidden rounded-lg ${heightClassName}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-roledescription="carousel"
      >
        <div
          className="whitespace-nowrap transition-transform duration-500 ease-out w-full h-full"
          style={{ transform: `translateX(-${slideIndex * 100}%)` }}
        >
          {sliderImages.map((img, i) => (
            <div key={i} className="inline-block align-top w-full h-full">
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <img
                src={img.src}
                alt={img.alt ?? `Slide ${i + 1}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => items.length && setPreviewSrc(img.src)}
                loading={i === 0 ? "eager" : "lazy"}
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Arrows */}
        {showArrows && (
          <>
            <button
              aria-label="Previous slide"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white shadow p-2"
            >
              ‹
            </button>
            <button
              aria-label="Next slide"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white shadow p-2"
            >
              ›
            </button>
          </>
        )}

        {/* Dots */}
        {showDots && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
            {Array.from({ length: slideCount }).map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goto(i)}
                className={`h-2.5 w-2.5 rounded-full border border-white ${
                  i === slideIndex ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1.5 text-sm rounded-lg border hover:bg-neutral-50"
          onClick={() => setIsAddOpen(true)}
          disabled={busy}
        >
          Add
        </button>
        <button
          className="px-3 py-1.5 text-sm rounded-lg border hover:bg-neutral-50 disabled:opacity-50"
          onClick={removeCurrent}
          disabled={busy || items.length === 0}
        >
          Remove current
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button
            className="px-2 py-1.5 text-sm rounded-lg border hover:bg-neutral-50 disabled:opacity-50"
            onClick={() => move(activeIndex, activeIndex - 1)}
            disabled={busy || items.length <= 1}
            title="Move left"
          >
            ←
          </button>
          <button
            className="px-2 py-1.5 text-sm rounded-lg border hover:bg-neutral-50 disabled:opacity-50"
            onClick={() => move(activeIndex, activeIndex + 1)}
            disabled={busy || items.length <= 1}
            title="Move right"
          >
            →
          </button>
        </div>
      </div>

      {/* Thumbnails (drag to reorder) */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.length === 0 ? (
          <div className="text-xs text-neutral-500">No images yet.</div>
        ) : (
          items.map((it, i) => (
            <div
              key={it.issue_image_id}
              className={[
                "relative w-20 h-16 rounded overflow-hidden border cursor-move select-none",
                i === activeIndex ? "ring-2 ring-blue-500" : "",
              ].join(" ")}
              draggable
              onDragStart={onThumbDragStart(i)}
              onDragOver={onThumbDragOver}
              onDrop={onThumbDrop(i)}
              onClick={() => {
                setActiveIndex(i);
                setSlideIndex(i);
              }}
              title={`#${i + 1}`}
            >
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <img
                src={it.thumb_url || it.url}
                alt={`Thumb ${i + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
              <div className="absolute bottom-0 right-0 text-[10px] px-1 py-0.5 bg-black/60 text-white rounded-tl">
                {i + 1}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1.5 text-sm rounded ${
                    addTab === "upload" ? "bg-blue-600 text-white" : "border"
                  }`}
                  onClick={() => setAddTab("upload")}
                >
                  Upload new
                </button>
                <button
                  className={`px-3 py-1.5 text-sm rounded ${
                    addTab === "report" ? "bg-blue-600 text-white" : "border"
                  }`}
                  onClick={() => setAddTab("report")}
                >
                  From report
                </button>
              </div>
              <button
                className="text-sm px-3 py-1.5 rounded border hover:bg-neutral-50"
                onClick={() => {
                  setIsAddOpen(false);
                  setUploadFiles([]);
                  setSelectSet(new Set());
                  setIsDragOver(false);
                }}
              >
                Close
              </button>
            </div>

            {/* Body */}
            <div className="p-4">
              {addTab === "upload" ? (
                <div className="space-y-3">
                  {/* DROPZONE */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    onDrop={onDropFiles}
                    onDragOver={onDragOverUpload}
                    onDragEnter={onDragEnterUpload}
                    onDragLeave={onDragLeaveUpload}
                    className={[
                      "rounded-lg p-6 text-center cursor-pointer transition-colors border-2 border-dashed",
                      isDragOver
                        ? "bg-blue-50 border-blue-500"
                        : "border-neutral-300 hover:bg-neutral-50",
                    ].join(" ")}
                    aria-label="Upload images by clicking or dragging files here"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) handleFiles(e.target.files);
                      }}
                    />
                    <p className="text-sm font-medium">
                      Drag & drop images here, or <span className="underline">click to browse</span>
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      JPG, PNG, WEBP (Max 10–20MB each per backend policy)
                    </p>
                    {uploadFiles.length > 0 && (
                      <div className="mt-3 text-left">
                        <p className="text-sm font-medium">
                          Selected: {uploadFiles.length} file{uploadFiles.length > 1 ? "s" : ""}
                        </p>
                        <ul className="mt-1 max-h-32 overflow-auto text-xs text-neutral-600 list-disc list-inside">
                          {uploadFiles.map((f, i) => (
                            <li key={`${f.name}-${f.size}-${f.lastModified}-${i}`}>
                              {f.name} ({Math.round(f.size / 1024)} KB)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    {uploadFiles.length > 0 && (
                      <button
                        className="px-3 py-1.5 text-sm rounded-lg border hover:bg-neutral-50"
                        onClick={() => setUploadFiles([])}
                        disabled={busy}
                      >
                        Clear
                      </button>
                    )}
                    <button
                      className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white disabled:opacity-50"
                      disabled={busy || uploadFiles.length === 0}
                      onClick={uploadNew}
                    >
                      Upload & attach
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[50vh] overflow-auto">
                    {reportImages.length === 0 ? (
                      <div className="col-span-full text-sm text-neutral-500">
                        No report images available.
                      </div>
                    ) : (
                      reportImages.map((ri) => {
                        const selected = selectSet.has(ri.image_id);
                        return (
                          <button
                            type="button"
                            key={ri.image_id}
                            onClick={() => {
                              const next = new Set(selectSet);
                              selected ? next.delete(ri.image_id) : next.add(ri.image_id);
                              setSelectSet(next);
                            }}
                            className={[
                              "relative aspect-video rounded overflow-hidden border",
                              selected ? "ring-2 ring-blue-600" : "",
                            ].join(" ")}
                            title={`Image ${ri.image_id}`}
                          >
                            {/* eslint-disable-next-line jsx-a11y/alt-text */}
                            <img
                              src={ri.thumb_url || ri.url}
                              className="w-full h-full object-cover"
                            />
                            {selected && <div className="absolute inset-0 bg-blue-600/20" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                  <div className="flex justify-end">
                    <button
                      className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white disabled:opacity-50"
                      disabled={busy || selectSet.size === 0}
                      onClick={attachExisting}
                    >
                      Attach selected
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <button
            onClick={() => setPreviewSrc(null)}
            className="absolute top-4 right-4 text-white text-xl px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30"
            aria-label="Close image preview"
          >
            ×
          </button>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img
            src={previewSrc}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default IssueImageManager;
