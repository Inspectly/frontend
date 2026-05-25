import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import confetti from "canvas-confetti";
import { getIssueImages, saveIssueImages } from "../utils/issueImageStore";
import { getIssueImageUrls } from "../utils/issueImageUtils";
import {
  IssueAssessment,
  IssueOffer,
  IssueOfferStatus,
  IssueStatus,
  IssueType,
  Listing,
  statusMapping,
  statusOptions,
} from "../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faChevronLeft, faChevronRight, faCalendarAlt, faEye, faShare, faHeart, faPlus } from "@fortawesome/free-solid-svg-icons";
import { MapPin } from "lucide-react";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";
import { buildIssueUpdateBody } from "../utils/issueUpdateHelper";
import {
  useCreateAttachmentMutation,
  useDeleteAttachmentMutation,
  useGetAttachmentsQuery,
} from "../features/api/attachmentsApi";
import Comments from "./Comments";
import VendorName from "./VendorName";
import DisputeTab from "./DisputeTab";
import { useNavigate } from "react-router-dom";
import { useUpdateIssueMutation, useGetIssueByIdQuery } from "../features/api/issuesApi";
import {
  useCreateOfferMutation,
  useGetOffersByIssueIdQuery,
  useUpdateOfferMutation,
} from "../features/api/issueOffersApi";
import { useGetDisputesByIssueOfferIdQuery } from "../features/api/issueDisputesApi";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import {
  useGetAssessmentsByIssueIdQuery,
  useUpdateAssessmentMutation,
} from "../features/api/issueAssessmentsApi";
import { useGetVendorsQuery, useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";
import { useGetClientByUserIdQuery } from "../features/api/clientsApi";
import { useGetReportByIdQuery } from "../features/api/reportsApi";
import OffersTabClient from "./OffersTabClient";
import OffersTabVendor from "./OffersTabVendor";
import { useCreateCheckoutSessionMutation } from "../features/api/stripePaymentsApi";
import AssessmentReviewTab from "./AssessmentReviewTab";
import VendorReviewModal from "./VendorReviewModal";
import { useCreateVendorReviewMutation } from "../features/api/vendorReviewsApi";
import { BUTTON_HOVER } from "../styles/shared";

export interface HomeownerIssueCardProps {
  issue: IssueType;
  listing?: Listing;
  onClose?: () => void;
  defaultTab?: "details" | "offers" | "assessments" | "dispute";
  autoOpenDispute?: boolean;
}

const HomeownerIssueCard: React.FC<HomeownerIssueCardProps> = ({
  issue,
  listing,
  onClose,
  defaultTab = "details",
  autoOpenDispute = true,
}) => {
  const navigate = useNavigate();
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const userType = useSelector(
    (state: RootState) => state.auth.user?.user_type
  );
  const statusNormalized =
    statusMapping[issue.status as IssueStatus] ??
    String(issue.status || "").toLowerCase();
  const isCompleted = statusNormalized === "completed";
  const showDisputeButton = userType !== "vendor" && isCompleted;

  // Fetch full issue data so image_urls are available without page refresh
  const { data: fetchedIssue } = useGetIssueByIdQuery(String(issue?.id), { skip: !issue?.id });

  const {
    data: offers = [],
    isLoading: offersLoading,
    error: offersError,
    refetch: refetchOffers,
  } = useGetOffersByIssueIdQuery(issue?.id, { skip: !issue?.id });

  const acceptedOffer = useMemo(() => {
    const byStatus = offers.find(
      (offer) => offer.status === IssueOfferStatus.ACCEPTED
    );
    if (byStatus) return byStatus;
    if (issue?.vendor_id) {
      return offers.find((offer) => offer.vendor_id === issue.vendor_id);
    }
    return undefined;
  }, [offers, issue?.vendor_id]);

  const { data: disputeList = [] } = useGetDisputesByIssueOfferIdQuery(
    acceptedOffer?.id ?? 0,
    { skip: !acceptedOffer?.id }
  );
  const normalizeDisputeStatus = (status?: string) =>
    status
      ?.toLowerCase()
      .replace("dispute_status.", "")
      .replace("status.", "")
      .trim();
  const hasDispute = disputeList.length > 0;
  const hasOpenDispute = disputeList.some(
    (dispute) => normalizeDisputeStatus(dispute.status) === "open"
  );
  const showDisputeTab = userType !== "vendor" && hasDispute;

  const [createOffer] = useCreateOfferMutation();
  const [updateOffer] = useUpdateOfferMutation();


  const { data: allVendors = [] } = useGetVendorsQuery();
  const { data: client } = useGetClientByUserIdQuery(String(userId ?? ""), {
    skip: !userId || userType !== "client",
  });
  const { data: currentVendor } = useGetVendorByVendorUserIdQuery(userId, {
    skip: !userId || userType !== "vendor",
  });

  const { data: report } = useGetReportByIdQuery(issue.report_id, {
    skip: !issue.report_id,
  });

  // True only for issues that originated from a real inspection report,
  // not the synthetic "my posted jobs" report that PostJobWizard creates
  const isFromInspectionReport = !!(
    issue.report_id &&
    issue.report_id > 0 &&
    report &&
    !["my posted jobs", "jobs"].includes((report.name ?? "").toLowerCase().trim())
  );

  // Function to get users_interaction_id for a vendor
  const getUsersInteractionId = (vendorId: number) => {
    // Use report's user_id, or fall back to listing's user_id
    const clientUserId = report?.user_id || listing?.user_id;
    if (!clientUserId || !vendorId || !issue?.id) return "";
    return `${clientUserId}_${vendorId}_${issue.id}`;
  };

  const [updateIssue] = useUpdateIssueMutation();
  const [updateAssessmentStatus] = useUpdateAssessmentMutation();
  const [createCheckoutSession] = useCreateCheckoutSessionMutation();

  const {
    data: assessments = [],
    isLoading: assessmentsLoading,
    refetch: refetchAssessments,
    isFetching: assessmentsFetching,
  } = useGetAssessmentsByIssueIdQuery(issue.id, {
    skip: !issue.id,
  });

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [storedImages, setStoredImages] = useState<string[] | null>(null);
  const [stableImageUrls, setStableImageUrls] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<
    "details" | "offers" | "assessments" | "dispute"
  >(defaultTab);
  const [allowDisputeComposer, setAllowDisputeComposer] = useState(
    defaultTab === "dispute"
  );
  const [isActive, setIsActive] = useState<boolean>(issue.active);

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [counterTarget, setCounterTarget] = useState<IssueOffer | null>(null);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerError, setOfferError] = useState("");
  const [isOfferSubmitting, setIsOfferSubmitting] = useState(false);
  const [commentClient, setCommentClient] = useState("");

  const [commentCount, setCommentCount] = useState(0);

  // Attachments
  const { data: allAttachments = [], refetch: refetchAttachments } = useGetAttachmentsQuery();
  const [createAttachment] = useCreateAttachmentMutation();
  const [deleteAttachment] = useDeleteAttachmentMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const offersTabRef = useRef<HTMLDivElement>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "error">("idle");

  const issueAttachments = useMemo(
    () => allAttachments.filter((a) => a.issue_id === issue.id),
    [allAttachments, issue.id]
  );
  const attachmentImages = useMemo(
    () => issueAttachments.filter((a) => a.type === "image"),
    [issueAttachments]
  );
  const docAttachments = useMemo(
    () => issueAttachments.filter((a) => a.type !== "image"),
    [issueAttachments]
  );

  const handleAddMedia = () => fileInputRef.current?.click();
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !issue.id) return;
    e.target.value = "";
    setUploadStatus("loading");
    try {
      await createAttachment({ issueId: issue.id, file, userId: userId ?? 0 }).unwrap();
      refetchAttachments();
      setUploadStatus("idle");
    } catch {
      setUploadStatus("error");
    }
  };
  const handleDeleteAttachment = async (id: number) => {
    if (!window.confirm("Delete this attachment?")) return;
    try {
      await deleteAttachment(id).unwrap();
      refetchAttachments();
    } catch { /* ignore */ }
  };

  // Vendor Review State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewSubmitStatus, setReviewSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [createVendorReview] = useCreateVendorReviewMutation();

  // Client action modals for issues in Review status
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRequestChangesModal, setShowRequestChangesModal] = useState(false);
  const [changeRequestMessage, setChangeRequestMessage] = useState("");

  // Persist issue images to IndexedDB when we have them (so they survive refetch after posting offer)
  useEffect(() => {
    if (!issue?.id) return;
    const urls = getIssueImageUrls(issue.image_urls);
    if (urls.length > 0) saveIssueImages(issue.id, urls).catch(() => {});
  }, [issue?.id, issue?.image_urls]);

  // Restore images from IndexedDB when issue from cache has none
  useEffect(() => {
    if (!issue?.id) return;
    getIssueImages(issue.id).then(setStoredImages);
  }, [issue?.id]);

  // Effective image list: prefer fetched issue (has image_urls from server), then prop, then IndexedDB
  const effectiveImageUrls = useMemo(() => {
    const fromFetched = getIssueImageUrls(fetchedIssue?.image_urls);
    if (fromFetched.length > 0) return fromFetched;
    const fromIssue = getIssueImageUrls(issue?.image_urls);
    if (fromIssue.length > 0) return fromIssue;
    return storedImages || [];
  }, [fetchedIssue?.image_urls, issue?.image_urls, storedImages]);
  const displayImageUrls = useMemo(
    () => (stableImageUrls.length > 0 ? stableImageUrls : effectiveImageUrls),
    [effectiveImageUrls, stableImageUrls]
  );

  /** Ensure we have images (from Idb if needed) before sending update — prevents clearing on server when cache has none */
  const getIssueForUpdate = async (): Promise<IssueType> => {
    if (!issue) return issue;
    const urls = effectiveImageUrls.length > 0 ? effectiveImageUrls : (await getIssueImages(issue.id)) || [];
    return urls.length > 0 ? { ...issue, image_urls: urls } : issue;
  };

  // Only sync isActive from props when issue.id changes (new issue loaded)
  // Don't sync on issue.active changes to avoid race condition during updates
  useEffect(() => setIsActive(issue.active), [issue.id]);
  useEffect(() => {
    setStableImageUrls([]);
    setCurrentImageIndex(0);
  }, [issue.id]);

  useEffect(() => {
    setAllowDisputeComposer(defaultTab === "dispute");
  }, [defaultTab, issue?.id]);
  useEffect(() => {
    if (!autoOpenDispute) return;
    if (!hasOpenDispute || !showDisputeTab) return;
    setActiveTab((prev) => (prev === "dispute" ? prev : "dispute"));
  }, [autoOpenDispute, hasOpenDispute, showDisputeTab]);
  useEffect(() => {
    if (effectiveImageUrls.length > 0) {
      setStableImageUrls(effectiveImageUrls);
    }
  }, [effectiveImageUrls]);
  useEffect(() => {
    if (displayImageUrls.length > 0 && currentImageIndex >= displayImageUrls.length) {
      setCurrentImageIndex(0);
    }
  }, [currentImageIndex, displayImageUrls.length]);

  // Scroll offers into view whenever the offers tab becomes active
  useEffect(() => {
    if (activeTab === "offers" && offersTabRef.current && scrollBodyRef.current) {
      setTimeout(() => {
        offersTabRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }, [activeTab]);

  const handleReviewSubmit = async (rating: number, review: string) => {
    if (!issue.vendor_id || !userId) return;

    try {
      await createVendorReview({
        vendor_user_id: issue.vendor_id,
        user_id: userId,
        rating,
        review,
      }).unwrap();

      setReviewSubmitStatus("success");
      setIsReviewModalOpen(false);
    } catch (err) {
      console.error("Failed to submit review", err);
      setReviewSubmitStatus("error");
    }
  };


  useEffect(() => {
    if (allowDisputeComposer) return;
    if (autoOpenDispute && showDisputeTab && hasOpenDispute) return;
    setActiveTab(defaultTab);
    navigate(`?tab=${defaultTab}`, { replace: true });
  }, [allowDisputeComposer, autoOpenDispute, defaultTab, hasOpenDispute, issue?.id, navigate, showDisputeTab]);
  // Auto-open bid form when vendor lands on offers tab with no existing bid
  useEffect(() => {
    if (defaultTab !== "offers" || userType !== "vendor" || offersLoading) return;
    const hasBid = offers.some((o) => String(o.vendor_id) === String(userId));
    if (!hasBid) {
      setCounterTarget(null);
      setOfferAmount("");
      setIsOfferModalOpen(true);
    }
  }, [defaultTab, userType, offersLoading, issue?.id]);

  useEffect(() => {
    if (!showDisputeTab && activeTab === "dispute" && !allowDisputeComposer) {
      setActiveTab("details");
    }
  }, [activeTab, allowDisputeComposer, showDisputeTab]);

  const vendorIdToName = useMemo(() => {
    const map: Record<number, string> = {};
    allVendors.forEach((vendor) => {
      map[vendor.id] = vendor.name;
    });
    return map;
  }, [allVendors]);


  const handleTabChange = (tab: "details" | "offers" | "assessments" | "dispute") => {
    setActiveTab(tab);
    navigate(`?tab=${tab}`);
  };

  const handleOpenDisputeComposer = () => {
    setAllowDisputeComposer(true);
    handleTabChange("dispute");
  };

  const handleAcceptAssessment = async (
    accepted: IssueAssessment,
    rejected: IssueAssessment[]
  ) => {
    try {
      await Promise.all([
        updateAssessmentStatus({
          ...accepted,
          interaction_id: accepted.users_interaction_id,
          user_last_viewed: new Date().toISOString(),
          status: "accepted",
        }),
        ...rejected
          .map((a) => ({
            ...a,
            interaction_id: accepted.users_interaction_id,
            user_last_viewed: new Date().toISOString(),
            status: "rejected",
          }))
          .map(updateAssessmentStatus),
      ]);
      refetchAssessments();
    } catch (err) {
      console.error("Failed to update assessment statuses", err);
    }
  };

  const handleRejectSingleAssessment = async (assessment: IssueAssessment) => {
    try {
      await updateAssessmentStatus({
        ...assessment,
        interaction_id: assessment.users_interaction_id,
        user_last_viewed: new Date().toISOString(),
        status: "rejected",
      });
      refetchAssessments();
    } catch (err) {
      console.error("Failed to reject assessment", err);
    }
  };



  const handleToggleVisibility = async () => {
    const next = !isActive;
    setIsActive(next); // Move toggle instantly

    const issueForUpdate = await getIssueForUpdate();
    updateIssue(buildIssueUpdateBody(issueForUpdate, { active: next }, listing?.id))
      .unwrap()
      .catch((e) => {
        setIsActive(!next); // rollback on error
        console.error("Failed to update visibility", e);
      });
  };

  const handleOpenOfferModal = (counterOffer: IssueOffer) => {
    setCounterTarget(counterOffer);
    setOfferAmount(String(counterOffer.price ?? ""));
    setCommentClient("");
    setOfferError("");
    setIsOfferModalOpen(true);
  };

  const handleOfferSubmit = async () => {
    const offerValue = parseFloat(offerAmount);

    if (isNaN(offerValue)) {
      setOfferError("Please enter a valid offer amount.");
      return;
    }

    if (offerValue <= 0) {
      setOfferError("Offer amount must be greater than zero.");
      return;
    }

    if (!userId) {
      setOfferError("User ID is missing. Please log in.");
      return;
    }

    setIsOfferSubmitting(true);

    try {
      if (counterTarget) {
        // 1) Mark the original offer as rejected
        await updateOffer({
          id: counterTarget.id,
          issue_id: counterTarget.issue_id,
          vendor_id: counterTarget.vendor_id,
          price: counterTarget.price,
          status: "rejected",
          user_last_viewed: new Date().toISOString(), // ⬅️ important
          comment_vendor: counterTarget.comment_vendor || "",
          comment_client: counterTarget.comment_client || "",
        }).unwrap();

        // 2) Create a new offer as the client's counter
        await createOffer({
          issue_id: issue.id,
          vendor_id: counterTarget.vendor_id,
          price: offerValue,
          status: "received",
          comment_vendor: counterTarget.comment_vendor || "",
          comment_client: "Client countered the offer",
        }).unwrap();
      } else {
        // Fallback: simple new offer (if ever used without counterTarget)
        await createOffer({
          issue_id: issue.id,
          vendor_id: userId,
          price: offerValue,
          status: "received",
          comment_vendor: "",
          comment_client: commentClient,
        }).unwrap();
      }

      await refetchOffers();

      // reset state
      setCounterTarget(null);
      setOfferAmount("");
      setCommentClient("");
      setOfferError("");
      setIsOfferModalOpen(false);
    } catch (err) {
      console.error("Failed to submit offer:", err);
      setOfferError("Failed to submit offer. Please try again.");
    } finally {
      setIsOfferSubmitting(false);
    }
  };

  // ── Derived display values ────────────────────────────────────────────────
  // Merge issue image_urls + image attachments into one list for the carousel
  const imageList = useMemo(() => {
    const base = displayImageUrls.length > 0 ? displayImageUrls : [];
    const extra = attachmentImages.map((a) => a.url);
    const merged = [...base, ...extra];
    return merged.length > 0 ? merged : ["/images/property_card_holder.jpg"];
  }, [displayImageUrls, attachmentImages]);
  const isLocked = !!issue.vendor_id;
  const effectiveActive = isLocked ? false : isActive;

  const severityColors: Record<string, string> = {
    high:   "bg-red-100 text-red-700",
    medium: "bg-yellow-100 text-yellow-700",
    low:    "bg-green-100 text-green-600",
  };
  const severityClass = severityColors[issue.severity?.toLowerCase()] ?? "bg-gray-100 text-gray-600";

  const statusColors: Record<string, string> = {
    open:        "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    review:      "bg-purple-100 text-purple-700",
    completed:   "bg-green-100 text-green-700",
  };
  const statusNorm = statusMapping[issue.status as IssueStatus] ?? "open";
  const statusClass = statusColors[statusNorm] ?? "bg-gray-100 text-gray-600";
  const statusLabel = statusOptions.find(o => o.value === statusNorm)?.label ?? "Unknown";

  const reportedDate = new Date(issue.created_at).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  const tabList: Array<"details" | "offers" | "assessments" | "dispute"> = ["details", "offers", "assessments"];
  if (showDisputeTab || allowDisputeComposer) tabList.push("dispute");
  const tabLabels: Record<string, string> = {
    details: "About", offers: "Offers", assessments: "Assessments", dispute: "Dispute",
  };

  return (
    <div className="relative h-full min-h-0 flex flex-col bg-card rounded-2xl overflow-hidden">

      {/* ── Image carousel ── */}
      <div className="relative group/img flex-shrink-0">
        <img
          src={imageList[currentImageIndex] || "/images/property_card_holder.jpg"}
          alt="Issue"
          className="w-full h-72 object-cover cursor-pointer"
          onClick={() => setSelectedImage(imageList[currentImageIndex] || null)}
          onError={(e) => { (e.target as HTMLImageElement).src = "/images/property_card_holder.jpg"; }}
        />
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors z-10 backdrop-blur-sm"
          >
            <FontAwesomeIcon icon={faTimes} className="text-sm" />
          </button>
        )}
        {/* Nav arrows */}
        {imageList.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(p => p > 0 ? p - 1 : imageList.length - 1); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-9 h-9 flex items-center justify-center transition-all backdrop-blur-sm shadow-lg opacity-0 group-hover/img:opacity-100"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(p => p < imageList.length - 1 ? p + 1 : 0); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-9 h-9 flex items-center justify-center transition-all backdrop-blur-sm shadow-lg opacity-0 group-hover/img:opacity-100"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm font-medium">
              {currentImageIndex + 1} / {imageList.length}
            </div>
          </>
        )}
      </div>

      {/* ── Thumbnail strip ── */}
      {(imageList.length > 1 || docAttachments.length > 0 || userType !== "vendor") && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border overflow-x-auto flex-shrink-0">
          {/* Image thumbnails */}
          {imageList.filter(u => u !== "/images/property_card_holder.jpg").map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`Image ${idx + 1}`}
              onClick={() => setCurrentImageIndex(idx)}
              className={`w-14 h-14 rounded-lg object-cover cursor-pointer border-2 flex-shrink-0 transition-colors ${
                idx === currentImageIndex ? "border-gold" : "border-transparent hover:border-gold/40"
              }`}
            />
          ))}

          {/* Doc attachment thumbnails */}
          {docAttachments.map((doc) => (
            <div
              key={doc.id}
              className="relative w-14 h-14 rounded-lg border-2 border-transparent bg-muted flex flex-col items-center justify-center cursor-pointer hover:border-gold/40 flex-shrink-0 group/doc"
              onClick={() => window.open(doc.url, "_blank")}
              title={doc.name}
            >
              <img src="/images/google-docs.png" alt="doc" className="w-7 h-7" />
              <span className="text-[9px] text-muted-foreground truncate w-full text-center px-1 mt-0.5">{doc.name}</span>
              {userId === doc.user_id && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteAttachment(doc.id); }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] items-center justify-center hidden group-hover/doc:flex"
                >×</button>
              )}
            </div>
          ))}

          {/* Add media button — homeowners only */}
          {userType !== "vendor" && (
            <div className="relative group/add flex-shrink-0">
              <button
                onClick={handleAddMedia}
                disabled={uploadStatus === "loading"}
                className="w-14 h-14 rounded-lg border-2 border-dashed border-border bg-muted hover:border-gold hover:bg-gold/5 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {uploadStatus === "loading" ? (
                  <span className="text-xs text-muted-foreground">…</span>
                ) : (
                  <FontAwesomeIcon icon={faPlus} className="text-muted-foreground text-lg" />
                )}
              </button>
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-lg bg-gray-900 text-white text-xs px-2.5 py-1.5 opacity-0 group-hover/add:opacity-100 transition-opacity">
                Add documents or images
              </span>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*, .pdf, .doc, .docx"
            className="hidden"
            onChange={handleFileUpload}
          />

          {uploadStatus === "error" && (
            <span className="text-xs text-red-500 flex-shrink-0">Upload failed</span>
          )}
        </div>
      )}

      {/* ── Scrollable body ── */}
      <div ref={scrollBodyRef} className="flex-1 overflow-y-auto">

        {/* Title + address + actions */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold text-foreground leading-snug flex-1">
              {issue.summary || "No Title Found"}
            </h2>
            <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
              <button className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <FontAwesomeIcon icon={faShare} className="text-xs" />
              </button>
              <button className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <FontAwesomeIcon icon={faHeart} className="text-xs" />
              </button>
            </div>
          </div>
          {listing && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1.5">
              <MapPin size={13} className="flex-shrink-0" />
              {listing.address}, {listing.city}, {listing.state}
            </p>
          )}
        </div>

        {/* Tags row */}
        <div className="px-6 pb-4 flex flex-wrap gap-2">
          {issue.severity && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${severityClass}`}>
              {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1).toLowerCase()} Priority
            </span>
          )}
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${statusClass}`}>
            {statusLabel}
          </span>
          {issue.type && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground capitalize">
              {normalizeAndCapitalize(issue.type)}
            </span>
          )}
          {isFromInspectionReport && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
              Inspection Report
            </span>
          )}
        </div>

        <div className="border-t border-border" />

        {/* Reported date */}
        <div className="px-6 py-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-muted-foreground text-sm" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Reported on {reportedDate}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isFromInspectionReport
                ? "Identified during professional home inspection"
                : "Posted directly by homeowner"}
            </p>
          </div>
        </div>

        {/* Marketplace Visibility */}
        <div className="px-6 py-4 flex items-center justify-between gap-4 border-t border-border">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faEye} className="text-muted-foreground text-sm" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Marketplace Visibility</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {effectiveActive
                  ? "Vendors can view and submit quotes for this issue"
                  : isLocked ? "Hidden — vendor already assigned" : "Hidden from marketplace"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { if (!isLocked) handleToggleVisibility(); }}
            disabled={isLocked}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
              isLocked ? "bg-muted opacity-50 cursor-not-allowed"
                : effectiveActive ? "bg-gold cursor-pointer" : "bg-muted-foreground/30 cursor-pointer"
            }`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${effectiveActive ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        {/* Vendor + cost row (when assigned) */}
        {issue.vendor_id && (
          <div className="px-6 py-3 border-t border-border flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Assigned vendor</span>
            <VendorName vendorId={issue.vendor_id} isVendorId={false} showRating />
          </div>
        )}
        {issue.vendor_id && issue.cost != null && (
          <div className="px-6 py-3 border-t border-border flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Agreed cost</span>
            <span className="font-semibold text-foreground">${Number(issue.cost).toFixed(2)}</span>
          </div>
        )}

        {/* Work review action bar */}
        {userType === "client" && statusMapping[issue.status as IssueStatus] === "review" && (
          <div className="mx-6 my-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="font-semibold text-amber-800 text-sm mb-0.5">Work ready for review</p>
            <p className="text-xs text-amber-700 mb-3">The vendor has completed the work and is awaiting your approval.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRequestChangesModal(true)}
                className="flex-1 px-4 py-2 bg-white border border-amber-300 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-50 transition-colors"
              >
                Request Revisions
              </button>
              <button
                onClick={() => setShowApproveModal(true)}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Approve Work
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-border" />

        {/* Tab bar */}
        <div className="flex gap-1 px-6 pt-3 border-b border-border">
          {tabList.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`relative px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab
                  ? "border-gold text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tabLabels[tab]}
              {tab === "offers" && offers.length > 0 && userType !== "vendor" && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[1.1rem] h-4 px-1 rounded-full bg-red-500 text-white text-[0.6rem] font-bold">
                  {offers.length > 9 ? "9+" : offers.length}
                </span>
              )}
              {tab === "assessments" && assessments.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[1.1rem] h-4 px-1 rounded-full bg-gold text-white text-[0.6rem] font-bold">
                  {assessments.length > 9 ? "9+" : assessments.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-6 py-5">

          {/* ABOUT TAB */}
          {activeTab === "details" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">About this issue</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {issue.description || "No description available."}
                </p>
              </div>

              {userType !== "vendor" && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                    Conversation
                    {commentCount > 0 && (
                      <span className="text-xs font-normal text-muted-foreground">({commentCount})</span>
                    )}
                  </h3>
                  <div className="max-h-[360px] overflow-y-auto pr-1">
                    <Comments
                      issueId={issue.id}
                      userId={userId}
                      myName={client ? `${client.first_name} ${client.last_name}` : ""}
                      onCountChange={setCommentCount}
                    />
                  </div>
                </div>
              )}

              {showDisputeButton && (
                <button
                  type="button"
                  onClick={handleOpenDisputeComposer}
                  className="w-full rounded-xl border border-red-200 text-red-600 text-sm font-semibold py-2.5 hover:bg-red-50 transition-colors"
                >
                  Open Dispute
                </button>
              )}
            </div>
          )}

          {/* OFFERS TAB */}
          {activeTab === "offers" && (
            <div ref={offersTabRef} className="space-y-4">
              {offersLoading ? (
                <p className="text-sm text-muted-foreground">Loading offers…</p>
              ) : offersError ? (
                <p className="text-sm text-red-500">Error loading offers.</p>
              ) : userType === "client" ? (
                <OffersTabClient
                  offers={offers}
                  uniqueVendors={new Set(offers.map((o) => o.vendor_id)).size}
                  handleOpenOfferModal={handleOpenOfferModal}
                  onOpenOfferModal={() => setIsOfferModalOpen(true)}
                  issueVendorId={issue.vendor_id}
                  onOfferAccepted={async (acceptedOffer) => {
                    try {
                      const slimIssue = issue ? { ...issue, image_urls: [] } : null;
                      const slimListing = listing ? { ...listing } : null;
                      localStorage.setItem("pending_offer_payment", JSON.stringify({
                        offer_id: acceptedOffer.id,
                        issue_id: acceptedOffer.issue_id,
                        vendor_id: acceptedOffer.vendor_id,
                        price: acceptedOffer.price,
                        comment_vendor: acceptedOffer.comment_vendor || "",
                        comment_client: acceptedOffer.comment_client || "",
                        issue: slimIssue,
                        listing: slimListing,
                      }));
                      const imageUrls = getIssueImageUrls(issue.image_urls);
                      if (imageUrls.length > 0) saveIssueImages(acceptedOffer.issue_id, imageUrls).catch(() => {});
                      const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
                      const successUrl = `${baseUrl}/offers?filter=accepted&session_id={CHECKOUT_SESSION_ID}`;
                      const response = await createCheckoutSession({
                        client_id: (client?.id ?? userId)!,
                        vendor_id: acceptedOffer.vendor_id,
                        offer_id: acceptedOffer.id,
                        success_url: successUrl,
                      }).unwrap();
                      localStorage.setItem("stripe_return_path", window.location.pathname + window.location.search);
                      window.location.href = response.session_url;
                    } catch (err: any) {
                      console.error("Stripe error", err);
                      localStorage.removeItem("pending_offer_payment");
                      const errorDetail = err?.data?.detail || "";
                      if (errorDetail.includes("Stripe Information not found")) {
                        toast.error("Payment setup required. Add a payment method in Settings, or the vendor may need to complete Stripe setup.");
                      } else {
                        toast.error("Could not start payment session. Please try again.");
                      }
                    }
                  }}
                />
              ) : userType === "vendor" ? (
                <OffersTabVendor
                  offers={offers}
                  vendorId={currentVendor?.id}
                  onOpenOfferModal={(editingOffer) => {
                    if (editingOffer) {
                      setCounterTarget(editingOffer);
                      setOfferAmount(String(editingOffer.price ?? ""));
                    } else {
                      setCounterTarget(null);
                      setOfferAmount("");
                    }
                    setIsOfferModalOpen(true);
                  }}
                />
              ) : null}
            </div>
          )}

          {/* ASSESSMENTS TAB */}
          {activeTab === "assessments" && (
            <div className="space-y-3">
              {assessments.length === 0 && !assessmentsLoading && !assessmentsFetching ? (
                <p className="text-sm text-muted-foreground">No assessment requested yet.</p>
              ) : (
                <AssessmentReviewTab
                  assessments={assessments}
                  onAccept={handleAcceptAssessment}
                  onRejectSingle={handleRejectSingleAssessment}
                  userId={userId}
                  userType={userType}
                  vendorIdToName={vendorIdToName}
                  onlyShowVendorId={undefined}
                  assessmentsLoading={assessmentsLoading || assessmentsFetching}
                  issueId={issue.id}
                  getUsersInteractionId={getUsersInteractionId}
                  onProposalSubmitted={async () => { await refetchAssessments(); }}
                />
              )}
            </div>
          )}

          {/* DISPUTE TAB */}
          {activeTab === "dispute" && userType !== "vendor" && (
            <DisputeTab
              issueOfferId={acceptedOffer?.id}
              userType={userType}
              isOfferLoading={offersLoading}
              className="w-full"
            />
          )}
        </div>
      </div>

      {/* fullscreen image */}
      {selectedImage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="relative bg-white rounded-lg shadow-lg max-w-3xl">
            <button
              className="absolute top-2 right-2 text-gray-800 py-1 px-2 rounded-full"
              onClick={() => setSelectedImage(null)}
            >
              <FontAwesomeIcon icon={faTimes} className="text-xl" />
            </button>
            <img
              src={selectedImage}
              alt="Full View"
              className="max-w-full max-h-[90vh] rounded"
            />
          </div>
        </div>
      )}

      {/* OFFER / COUNTER MODAL */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Your quote</h2>

            <input
              type="number"
              value={offerAmount}
              disabled={isOfferSubmitting}
              onChange={(e) => {
                setOfferAmount(e.target.value);
                setOfferError("");
              }}
              min="1"
              placeholder="Enter your offer amount"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
            />

            <textarea
              value={commentClient}
              onChange={(e) => setCommentClient(e.target.value)}
              placeholder="Private comment (optional)"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-2 text-sm"
              rows={2}
            />

            {offerError && (
              <p className="text-red-600 text-sm mb-2">{offerError}</p>
            )}

            {counterTarget ? (
              <p className="text-sm text-gray-600 mb-3">
                You are countering the original quote of <strong>${counterTarget.price}</strong>
              </p>
            ) : (
              <p className="text-sm text-gray-600 mb-2">
                Your quote:{" "}
                <strong>
                  ${new Intl.NumberFormat("en-US").format(Number(offerAmount) || 0)}
                </strong>
              </p>
            )}

            {!counterTarget && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This is a quote. Final cost may change based on actual scope discovered during or after an assessment.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setIsOfferModalOpen(false)}
                className={`text-sm px-4 py-2 rounded-lg border border-gray-300 ${BUTTON_HOVER}`}
                disabled={isOfferSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleOfferSubmit}
                className={`text-sm px-4 py-2 rounded-lg bg-gray-900 text-white ${BUTTON_HOVER} disabled:opacity-50`}
                disabled={isOfferSubmitting}
              >
                {isOfferSubmitting ? <>Sending...</> : "Quote"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Review Modal */}
      <VendorReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmit={handleReviewSubmit}
        vendorName={allVendors.find(v => v.id === issue.vendor_id)?.name || "The Vendor"}
      />

      {/* Success/Error Feedback Modal */}
      {reviewSubmitStatus !== "idle" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm text-center">
            {reviewSubmitStatus === "success" ? (
              <>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 text-2xl">✓</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Review Submitted!</h3>
                <p className="text-gray-600 mb-6">Thank you for your feedback. The issue has been marked as completed.</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-600 text-2xl">✕</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Submission Failed</h3>
                <p className="text-gray-600 mb-6">Something went wrong while submitting your review. Please try again.</p>
              </>
            )}
            <button
              onClick={() => setReviewSubmitStatus("idle")}
              className={`w-full py-2 px-4 rounded-lg font-medium text-white ${reviewSubmitStatus === "success" ? "bg-gray-900" : "bg-gray-900"
                } ${BUTTON_HOVER}`}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Client: Approve Work Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowApproveModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border p-6 mx-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Approve Work?</h3>
                <p className="text-sm text-gray-600 mb-3">
                  This will mark the work as complete and finalize the project. Make sure you're satisfied with the work quality before approving.
                </p>
                <div className="bg-gold-50 border border-gold-200 rounded-lg p-3">
                  <p className="text-xs text-gold-700 font-medium flex items-start gap-2">
                    <svg className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    This action cannot be undone. Payment will be released to the vendor.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                className={`px-4 py-2 rounded-lg border text-sm font-medium ${BUTTON_HOVER}`}
                onClick={() => setShowApproveModal(false)}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-white text-sm font-semibold bg-emerald-600 ${BUTTON_HOVER}`}
                onClick={async () => {
                  try {
                    const issueForUpdate = await getIssueForUpdate();
                    await updateIssue(buildIssueUpdateBody(issueForUpdate, {
                      status: "completed",
                      review_status: "completed",
                    }, listing?.id)).unwrap();
                    setShowApproveModal(false);
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                    toast.success(`Work approved for ${issue.summary || "issue"}!`);
                    if (issue.vendor_id) {
                      setIsReviewModalOpen(true);
                    }
                  } catch (err) {
                    console.error("Failed to approve work", err);
                  }
                }}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client: Revise Modal */}
      {showRequestChangesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowRequestChangesModal(false); setChangeRequestMessage(""); }} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border p-6 mx-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-gold-200 rounded-full flex-shrink-0">
                <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Revise</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Describe what needs to be corrected or improved. The vendor will be notified and the work will return to "In Progress".
                </p>
              </div>
            </div>
            
            <textarea
              value={changeRequestMessage}
              onChange={(e) => setChangeRequestMessage(e.target.value)}
              placeholder="Describe what changes are needed..."
              className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
            />
            
            <div className="flex justify-end gap-2 mt-4">
              <button 
                className={`px-4 py-2 rounded-lg border text-sm font-medium ${BUTTON_HOVER}`}
                onClick={() => {
                  setShowRequestChangesModal(false);
                  setChangeRequestMessage("");
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold bg-gold hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!changeRequestMessage.trim()}
                onClick={async () => {
                  try {
                    const issueForUpdate = await getIssueForUpdate();
                    await updateIssue(buildIssueUpdateBody(issueForUpdate, { status: "in_progress" }, listing?.id)).unwrap();
                    setShowRequestChangesModal(false);
                    setChangeRequestMessage("");
                  } catch (err) {
                    console.error("Failed to request changes", err);
                  }
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeownerIssueCard;
