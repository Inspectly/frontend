import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
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
import { normalizeAndCapitalize } from "../utils/typeNormalizer";
import { parseAsUTC } from "../utils/calendarUtils";
import { buildIssueUpdateBody } from "../utils/issueUpdateHelper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";
import {
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import Attachments from "./Attachments";
import Comments from "./Comments";
import Dropdown from "./Dropdown";
import DisputeTab from "./DisputeTab";

import VendorName from "./VendorName";
import { BUTTON_HOVER } from "../styles/shared";
import { useNavigate } from "react-router-dom";
import { useUpdateIssueMutation } from "../features/api/issuesApi";
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
  useGetAssessmentsByUsersInteractionIdQuery,
  useUpdateAssessmentMutation,
} from "../features/api/issueAssessmentsApi";
import CalendarSelector from "./CalendarSelector";
import AssessmentReview from "./AssessmentReview";
import {
  useGetVendorByVendorUserIdQuery,
  useGetVendorsQuery,
} from "../features/api/vendorsApi";
import { useGetClientByUserIdQuery } from "../features/api/clientsApi";
import { useGetReportByIdQuery } from "../features/api/reportsApi";
import OffersTabClient from "./OffersTabClient";
import OffersTabVendor from "./OffersTabVendor";
import { useCreateCheckoutSessionMutation } from "../features/api/stripePaymentsApi";

export interface IssueDetailsProps {
  issue: IssueType;
  listing?: Listing;
  defaultTab?: "details" | "offers" | "assessments" | "dispute";
  autoOpenDispute?: boolean;
}

type IssueDetailsTab = "details" | "offers" | "assessments" | "dispute";
const ISSUE_DETAILS_TABS: IssueDetailsTab[] = [
  "details",
  "offers",
  "assessments",
  "dispute",
];

// Extract tab from URL (default to "details")
const getTabFromURL = (): IssueDetailsTab => {
  const params = new URLSearchParams(location.search);
  const tab = params.get("tab") || "details";
  return ISSUE_DETAILS_TABS.includes(tab as IssueDetailsTab)
    ? (tab as IssueDetailsTab)
    : "details";
};


const IssueDetails: React.FC<IssueDetailsProps> = ({
  issue,
  listing,
  defaultTab,
  autoOpenDispute = true,
}) => {
  const navigate = useNavigate();
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const userType = useSelector(
    (state: RootState) => state.auth.user?.user_type
  );

  const {
    data: offers = [],
    isLoading: offersLoading,
    error: offersError,
    refetch: refetchOffers,
  } = useGetOffersByIssueIdQuery(issue?.id, {
    skip: !issue?.id,
  });
  const { data: allVendors = [] } = useGetVendorsQuery();
  const { data: client } = useGetClientByUserIdQuery(String(userId ?? ""), {
    skip: !userId || userType !== "client",
  });

  const { data: report } = useGetReportByIdQuery(issue.report_id, {
    skip: !issue.report_id,
  });

  const [updateIssue] = useUpdateIssueMutation();
  const [createOffer] = useCreateOfferMutation();
  const [updateOffer] = useUpdateOfferMutation();

  const [updateAssessmentStatus] = useUpdateAssessmentMutation();

  const isVendor = userType === "vendor";
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
  const showDisputeTab = hasDispute;

  const { data: currentVendor } = useGetVendorByVendorUserIdQuery(userId, {
    skip: !isVendor || !userId,
  });

  const getUsersInteractionId = (vendorId: number) => {
    // Use report's user_id, or fall back to listing's user_id
    const clientUserId = report?.user_id || listing?.user_id;
    if (!clientUserId || !vendorId || !issue?.id) return "";
    return `${clientUserId}_${vendorId}_${issue.id}`;
  };

  const usersInteractionId = currentVendor
    ? getUsersInteractionId(currentVendor.id)
    : "";

  const assessmentsByInteraction = useGetAssessmentsByUsersInteractionIdQuery(
    usersInteractionId,
    { skip: !usersInteractionId }
  );
  const assessmentsByIssue = useGetAssessmentsByIssueIdQuery(issue.id, {
    skip: !issue.id,
  });

  // For vendors: use interaction-based query if available, otherwise fall back to issue-based
  // For clients: always use issue-based query
  const assessmentsData = isVendor
    ? (usersInteractionId ? assessmentsByInteraction : assessmentsByIssue)
    : assessmentsByIssue;

  const {
    data: assessments = [],
    isLoading: assessmentsLoading,
    refetch: refetchAssessments,
    isFetching: assessmentsFetching,
  } = assessmentsData;

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [storedImages, setStoredImages] = useState<string[] | null>(null);
  const [stableImageUrls, setStableImageUrls] = useState<string[]>([]);
  const [isActive, setIsActive] = useState<boolean>(issue.active);

  // Sync isActive when a different issue is loaded
  useEffect(() => setIsActive(issue.active), [issue.id]);
  useEffect(() => {
    setStableImageUrls([]);
    setCurrentImageIndex(0);
  }, [issue.id]);

  useEffect(() => {
    if (!autoOpenDispute) return;
    if (!hasOpenDispute || !showDisputeTab) return;
    setActiveTab((prev) => {
      if (prev === "dispute") return prev;
      navigate("?tab=dispute");
      return "dispute";
    });
  }, [autoOpenDispute, hasOpenDispute, navigate, showDisputeTab]);

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

  // Effective image list: from issue first, else from IndexedDB (so status updates don't send empty image_url)
  const effectiveImageUrls = useMemo(() => {
    const fromIssue = getIssueImageUrls(issue?.image_urls);
    if (fromIssue.length > 0) return fromIssue;
    return storedImages || [];
  }, [issue?.image_urls, storedImages]);
  const displayImageUrls = useMemo(
    () => (stableImageUrls.length > 0 ? stableImageUrls : effectiveImageUrls),
    [effectiveImageUrls, stableImageUrls]
  );
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

  /** Ensure we have images (from Idb if needed) before sending update — prevents clearing on server when cache has none */
  const getIssueForUpdate = async (): Promise<IssueType> => {
    if (!issue) return issue;
    const urls = effectiveImageUrls.length > 0 ? effectiveImageUrls : (await getIssueImages(issue.id)) || [];
    return urls.length > 0 ? { ...issue, image_urls: urls } : issue;
  };

  // Collapsible section states removed - using HomeownerIssueCard-style layout

  const [activeTab, setActiveTab] = useState<IssueDetailsTab>(
    defaultTab ?? getTabFromURL()
  );

  const [progressDropdownOpen, setProgressDropdownOpen] = useState<
    number | null
  >(null);

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [counterTarget, setCounterTarget] = useState<IssueOffer | null>(null);
  const [offerAmount, setOfferAmount] = useState("");
  const [editingOffer, setEditingOffer] = useState<IssueOffer | null>(null);
  const [offerError, setOfferError] = useState("");
  const [isOfferSubmitting, setIsOfferSubmitting] = useState(false);

  const [commentVendor, setCommentVendor] = useState("");
  const [commentClient, setCommentClient] = useState("");
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  // Work completion modals
  const [showMarkCompleteModal, setShowMarkCompleteModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRequestChangesModal, setShowRequestChangesModal] = useState(false);
  const [changeRequestMessage, setChangeRequestMessage] = useState("");

  const cardRef = useRef<HTMLDivElement | null>(null);
  const progressDropdownButtonRef = useRef<HTMLButtonElement | null>(null);

  const uniqueVendors = new Set(offers.map((offer) => offer.vendor_id)).size;

  const [createCheckoutSession] = useCreateCheckoutSessionMutation();

  const handleOpenOfferModal = (counterOffer?: IssueOffer) => {
    setCounterTarget(counterOffer || null);
    setIsOfferModalOpen(true);
  };

  const handleEditOfferModal = (offer?: IssueOffer) => {
    setEditingOffer(offer || null);
    setIsOfferModalOpen(true);
  };

  // toggleSection removed - using HomeownerIssueCard-style layout

  const handleStatusChange = async (newStatus: string) => {
    const issueForUpdate = await getIssueForUpdate();
    updateIssue(buildIssueUpdateBody(issueForUpdate, { status: newStatus }, listing?.id));
    setProgressDropdownOpen(null);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString + "Z");

    return date.toLocaleString("en-US", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Auto-detects user’s time zone
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Handle tab change
  const handleTabChange = (tab: "details" | "offers" | "assessments" | "dispute") => {
    setActiveTab(tab);
    navigate(`?tab=${tab}`); // Update URL
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

    if (counterTarget) {
      await updateOffer({
        id: counterTarget.id,
        issue_id: counterTarget.issue_id,
        vendor_id: counterTarget.vendor_id,
        price: counterTarget.price,
        status: "rejected",
        comment_vendor: counterTarget.comment_vendor || "",
        comment_client: counterTarget.comment_client || "",
      }).unwrap();
    }

    try {
      if (editingOffer) {
        // EDIT mode — update existing offer
        await updateOffer({
          id: editingOffer.id,
          issue_id: editingOffer.issue_id,
          vendor_id: editingOffer.vendor_id,
          price: offerAmount,
          status: "received",
          comment_vendor: commentVendor || "",
          comment_client: editingOffer.comment_client || "",
        }).unwrap();
      } else {
        await createOffer({
          issue_id: issue.id,
          vendor_id: counterTarget?.vendor_id || userId,
          price: offerValue,
          status: "received",
          comment_vendor: commentVendor,
          comment_client: counterTarget
            ? "Client countered the offer"
            : commentClient,
        }).unwrap();
      }

      refetchOffers();

      // Reset state
      setCounterTarget(null);
      setOfferAmount("");
      setCommentVendor("");
      setOfferError("");
      setEditingOffer(null);
      setIsOfferModalOpen(false);
    } catch (err) {
      console.error("Failed to submit offer:", err);
      setOfferError("Failed to submit offer. Please try again.");
    } finally {
      setIsOfferSubmitting(false);
    }
  };

  const handleAccept = async (
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

  const handlePostProposal = async () => {
    setIsSubmittingProposal(true);
    try {
      await refetchAssessments().unwrap();
    } catch (err) {
      console.error("Failed to refresh proposals after submission", err);
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  const handleRejectAll = async (vendorId: number) => {
    const toReject = assessments.filter(
      (a) => Number(a.users_interaction_id.split("_")[1]) === vendorId
    );
    setIsSubmittingProposal(true);

    try {
      await Promise.all(
        toReject.map((a) =>
          updateAssessmentStatus({
            ...a,
            interaction_id: a.users_interaction_id,
            status: "rejected",
          })
        )
      );
      await refetchAssessments();
    } catch (err) {
      console.error("Failed to reject all", err);
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  const handleRejectSingle = async (assessment: IssueAssessment) => {
    setIsSubmittingProposal(true);
    try {
      await updateAssessmentStatus({
        ...assessment,
        interaction_id: assessment.users_interaction_id,
        status: "rejected",
      });
      await refetchAssessments();
    } catch (err) {
      console.error("Failed to reject assessment", err);
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  const vendorIdToName = useMemo(() => {
    const map: Record<number, string> = {};
    allVendors.forEach((vendor) => {
      map[vendor.id] = vendor.name;
    });
    return map;
  }, [allVendors]);

  // Sync tab state: use defaultTab when provided (e.g. modal), otherwise URL
  useEffect(() => {
    if (autoOpenDispute && showDisputeTab && hasOpenDispute) return;
    if (defaultTab) {
      setActiveTab(defaultTab);
    } else {
      setActiveTab(getTabFromURL());
    }
  }, [autoOpenDispute, defaultTab, hasOpenDispute, issue?.id, location.search, showDisputeTab]);
  useEffect(() => {
    const allowDisputeComposer = defaultTab === "dispute";
    if (!showDisputeTab && activeTab === "dispute" && !allowDisputeComposer) {
      setActiveTab("details");
    }
  }, [activeTab, defaultTab, showDisputeTab]);


  useEffect(() => {
    if (editingOffer) {
      setOfferAmount(editingOffer.price.toString());
      setCommentVendor(editingOffer.comment_vendor || "");
    } else {
      setOfferAmount("");
      setCommentVendor("");
    }
  }, [editingOffer]);

  return (
    <div
      ref={cardRef}
      className="relative rounded-lg bg-white border-0 overflow-hidden flex flex-col"
    >
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {issue.summary || "No Title Found"}
          </h2>
          <div className="flex items-center gap-2">
            {/* Vendor: Mark Complete Button - show when issue is in progress and this vendor is assigned (vendor_id = user id) */}
            {userType === "vendor" && (() => {
              const statusNorm = statusMapping[issue.status as IssueStatus] ?? String(issue.status || "").toLowerCase();
              const isInProgress = statusNorm === "in_progress" || String(issue.status || "").toUpperCase().includes("IN_PROGRESS");
              const isAssignedVendor = issue.vendor_id != null && Number(issue.vendor_id) === Number(userId);
              return isInProgress && isAssignedVendor;
            })() && (
              <div className="relative group">
                <button
                  onClick={() => setShowMarkCompleteModal(true)}
                  className="w-9 h-9 bg-emerald-500 text-white rounded-full inline-flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg">
                  <div className="font-semibold">Mark Work Complete</div>
                  <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                </div>
              </div>
            )}

            {/* Client: Review Actions - Approve or Revise */}
            {userType === "client" && statusMapping[issue.status as IssueStatus] === "review" && (
              <>
                <div className="relative group">
                  <button
                    onClick={() => setShowRequestChangesModal(true)}
                    className={`w-9 h-9 bg-gold text-white rounded-full inline-flex items-center justify-center shadow-sm ${BUTTON_HOVER}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-40 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg">
                    <div className="font-semibold">Request Revisions</div>
                    <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                  </div>
                </div>
                <div className="relative group">
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="w-9 h-9 bg-emerald-500 text-white rounded-full inline-flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-sm relative"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-40 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg">
                    <div className="font-semibold">Approve Work</div>
                    <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                  </div>
                </div>
              </>
            )}

            {/* Visibility Toggle - hidden for vendors, locked when vendor assigned */}
            {userType !== "vendor" && (() => {
              const isLocked = !!issue.vendor_id;
              const effectiveActive = isLocked ? false : isActive;
              return (
                <button
                  onClick={async () => {
                    if (!isLocked) {
                      const next = !isActive;
                      setIsActive(next);
                      const issueForUpdate = await getIssueForUpdate();
                      updateIssue(buildIssueUpdateBody(issueForUpdate, { active: next }, listing?.id))
                        .unwrap()
                        .catch(() => setIsActive(!next));
                    }
                  }}
                  disabled={isLocked}
                  className={`w-9 h-9 rounded-full inline-flex items-center justify-center transition-colors ${
                    isLocked 
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={effectiveActive ? faEye : faEyeSlash}
                    className="text-sm"
                  />
                </button>
              );
            })()}
          </div>
        </div>
      </div>

      <div className="mb-4 border-b border-gray-200 pt-4 mx-6">
        <ul
          className="flex gap-1 text-sm"
          id="default-tab"
          role="tablist"
        >
          <li role="presentation">
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "details"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-foreground hover:text-background"
                }`}
              type="button"
              role="tab"
              aria-controls="default-details"
              aria-selected={activeTab === "details"}
              onClick={() => handleTabChange("details")}
            >
              Details
            </button>
          </li>
          <li role="presentation">
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${activeTab === "offers"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-foreground hover:text-background"
                }`}
              type="button"
              role="tab"
              aria-controls="default-offers"
              aria-selected={activeTab === "offers"}
              onClick={() => handleTabChange("offers")}
            >
              Offers
              {offers.length > 0 && activeTab !== "offers" && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full"></span>
              )}
            </button>
          </li>
          <li role="presentation">
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${activeTab === "assessments"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-foreground hover:text-background"
                }`}
              type="button"
              role="tab"
              aria-controls="default-assessments"
              aria-selected={activeTab === "assessments"}
              onClick={() => handleTabChange("assessments")}
            >
              Assessments
              {assessments.length > 0 && activeTab !== "assessments" && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full"></span>
              )}
            </button>
          </li>
          {showDisputeTab && (
            <li role="presentation">
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "dispute"
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-foreground hover:text-background"
                  }`}
                type="button"
                role="tab"
                aria-controls="default-dispute"
                aria-selected={activeTab === "dispute"}
                onClick={() => handleTabChange("dispute")}
              >
                Dispute
              </button>
            </li>
          )}
        </ul>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {activeTab === "details" && (
          <div id="default-details" role="tabpanel">
            {/* Property Images - Full Width with gallery for multiple */}
            {(() => {
              let imageList: string[] = displayImageUrls.length > 0 ? displayImageUrls : [];
              if (imageList.length === 0 && listing?.image_url) {
                imageList = [listing.image_url];
              }

              return (
                <div className="mb-6">
                  {/* Main image with scroll arrows */}
                  <div className="relative group/img rounded-xl overflow-hidden">
                    <img
                      src={imageList[currentImageIndex] || "/images/property_card_holder.jpg"}
                      alt="Issue"
                      className="w-full h-[280px] object-cover cursor-pointer"
                      onClick={() => setSelectedImage(imageList[currentImageIndex] || null)}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/images/property_card_holder.jpg"; }}
                    />

                    {/* Left/Right arrows */}
                    {imageList.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : imageList.length - 1)); }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-9 h-9 flex items-center justify-center transition-all backdrop-blur-sm shadow-lg opacity-0 group-hover/img:opacity-100"
                        >
                          <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev < imageList.length - 1 ? prev + 1 : 0)); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-9 h-9 flex items-center justify-center transition-all backdrop-blur-sm shadow-lg opacity-0 group-hover/img:opacity-100"
                        >
                          <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                        {/* Counter */}
                        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm font-medium shadow-lg">
                          {currentImageIndex + 1} / {imageList.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Thumbnail strip */}
                  {imageList.length > 1 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                      {imageList.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Image ${idx + 1}`}
                          className={`w-16 h-16 rounded-lg object-cover cursor-pointer border-2 transition-colors flex-shrink-0 ${
                            idx === currentImageIndex ? "border-blue-500" : "border-transparent hover:border-blue-300"
                          }`}
                          onClick={() => { setCurrentImageIndex(idx); }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Image Lightbox Modal */}
            {selectedImage && (
              <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
                <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl mx-4">
                  <button
                    className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
                    onClick={() => setSelectedImage(null)}
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-2xl" />
                  </button>
                  <img
                    src={selectedImage}
                    alt="Full View"
                    className="max-w-full max-h-[85vh] rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* Two Column Layout - matches HomeownerIssueCard structure */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* LEFT - 2/3 width */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {issue.description || "No description available."}
                  </p>
                </div>

                {/* Attachments Section */}
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Attachments
                  </h3>
                  <Attachments issueId={issue.id} userType={userType} />
                </div>

                {/* Comments Section - Client only */}
                {userType !== "vendor" && (
                  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Comments
                    </h3>
                    <div className="max-h-[360px] overflow-y-auto pr-1">
                      <Comments issueId={issue.id} userId={userId} />
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT - 1/3 width: Details card */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between gap-4">
                      <p className="text-xs font-bold uppercase text-gray-800">Type</p>
                      <p className="text-sm font-semibold text-gray-500">
                        {normalizeAndCapitalize(issue.type)}
                      </p>
                    </div>

                    <div className="flex justify-between gap-4">
                      <p className="text-xs font-bold uppercase text-gray-800">Severity</p>
                      <p className={`text-sm font-semibold ${
                        issue.severity === "High" ? "text-red-600"
                        : issue.severity === "Medium" ? "text-yellow-600"
                        : "text-green-600"
                      }`}>
                        {issue.severity || "Medium"}
                      </p>
                    </div>

                    <div className="flex justify-between items-center gap-4">
                      <p className="text-xs font-bold uppercase text-gray-800">Status</p>
                      {(userType === "vendor" && issue.vendor_id === currentVendor?.id) ? (
                        <div className="relative inline-block">
                          <button
                            className="inline-flex px-2.5 py-1.5 rounded text-xs font-medium bg-gold-100 text-gold-700 items-center gap-1 hover:bg-gold-200 transition-colors"
                            ref={progressDropdownButtonRef}
                            onClick={() =>
                              setProgressDropdownOpen((prev) =>
                                prev === issue.id ? null : issue.id
                              )
                            }
                          >
                            {statusOptions.find(
                              (option) =>
                                option.value ===
                                statusMapping[issue.status as IssueStatus]
                            )?.label || "Unknown"}
                            <FontAwesomeIcon icon={faChevronDown} className="w-2.5 h-2.5" />
                          </button>
                          {Number(progressDropdownOpen) === issue.id && (
                            <Dropdown
                              buttonRef={progressDropdownButtonRef}
                              onClose={() => setProgressDropdownOpen(null)}
                            >
                              <div className="py-1">
                                {statusOptions.map(({ value, label }) => (
                                  <button
                                    key={value}
                                    className={`block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left ${`Status.${value.toUpperCase()}` === issue.status ? "font-semibold bg-gray-50" : ""}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(value);
                                    }}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </Dropdown>
                          )}
                        </div>
                      ) : (
                        <span className={`inline-flex px-2.5 py-1.5 rounded text-xs font-medium ${
                          statusMapping[issue.status as IssueStatus] === "open"
                            ? "bg-gray-100 text-gray-700"
                            : statusMapping[issue.status as IssueStatus] === "in_progress"
                              ? "bg-gold-100 text-gold-700"
                              : statusMapping[issue.status as IssueStatus] === "review"
                                ? "bg-gold-100 text-gold-700"
                                : statusMapping[issue.status as IssueStatus] === "completed"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-gray-100 text-gray-700"
                        }`}>
                          {statusOptions.find(
                            (option) =>
                              option.value === statusMapping[issue.status as IssueStatus]
                          )?.label || "Unknown"}
                        </span>
                      )}
                    </div>

                    <div className="h-px bg-gray-100 my-2" />

                    {/* Cost - only show when vendor is assigned */}
                    {issue.vendor_id && (
                      <div className="flex justify-between gap-4">
                        <p className="text-xs font-bold uppercase text-gray-800">Cost</p>
                        <p className="text-sm font-semibold text-gray-500">
                          {issue.cost != null && issue.cost !== "0"
                            ? `$${Number(issue.cost).toFixed(2)}`
                            : "N/A"}
                        </p>
                      </div>
                    )}

                    {/* Vendor - only show when assigned */}
                    {issue.vendor_id && (
                      <div className="flex justify-between gap-4">
                        <p className="text-xs font-bold uppercase text-gray-800">Vendor</p>
                        <p className="text-sm font-semibold text-gray-500">
                          <VendorName
                            vendorId={issue.vendor_id}
                            isVendorId={false}
                            showRating
                          />
                        </p>
                      </div>
                    )}

                    <div className="h-px bg-gray-100 my-2" />

                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase text-gray-800">Date Created</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(issue.created_at)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase text-gray-800">Date Updated</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(issue.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
                {showDisputeTab && userType !== "vendor" && (
                  <button
                    type="button"
                    onClick={() => handleTabChange("dispute")}
                    className="w-full rounded-lg bg-red-600 text-white text-xs font-bold uppercase tracking-widest py-2.5 hover:bg-red-700 transition-colors"
                  >
                    Dispute
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === "offers" && (
          <div id="default-offers" role="tabpanel" className="w-full">
            {offersLoading ? (
              <p>Loading offers...</p>
            ) : offersError ? (
              <p>Error loading offers</p>
            ) : (
              <>
                  {userType === "client" && (
                    <OffersTabClient
                      offers={offers}
                      uniqueVendors={uniqueVendors}
                      handleOpenOfferModal={handleOpenOfferModal}
                      onOpenOfferModal={() => setIsOfferModalOpen(true)}
                      issueVendorId={issue.vendor_id}
                      onOfferAccepted={async (acceptedOffer) => {
                        try {
                          // Store minimal payload: omit issue.image_urls to avoid QuotaExceededError (images are in IndexedDB)
                          const slimIssue = { ...issue, image_urls: [] };
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

                          // Save issue images to IndexedDB in background (don't block Stripe)
                          const imageUrls = getIssueImageUrls(issue.image_urls);
                          if (imageUrls.length > 0) {
                            saveIssueImages(acceptedOffer.issue_id, imageUrls).catch(() => {});
                          }

                          const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
                          const successUrl = `${baseUrl}/offers?filter=accepted&session_id={CHECKOUT_SESSION_ID}`;
                          const response = await createCheckoutSession({
                            client_id: (client?.id ?? userId)!,
                            vendor_id: acceptedOffer.vendor_id,
                            offer_id: acceptedOffer.id,
                            success_url: successUrl,
                          }).unwrap();
                          window.location.href = response.session_url;
                        } catch (err: any) {
                          console.error("Stripe error", err);
                          localStorage.removeItem("pending_offer_payment");
                          const errorDetail = err?.data?.detail || "";
                          if (errorDetail.includes("Stripe Information not found")) {
                            toast.error("Payment setup required. Add a payment method in Settings (gear icon → Payment Settings), or the vendor may need to complete Stripe setup.");
                          } else {
                            toast.error("Could not start payment session. Please try again.");
                          }
                        }
                      }}
                    />
                  )}

                {userType === "vendor" && (
                  <OffersTabVendor
                    offers={offers}
                    vendorId={currentVendor?.id}
                    onOpenOfferModal={handleEditOfferModal}
                    onOfferAccepted={async (acceptedOffer) => {
                      const issueForUpdate = await getIssueForUpdate();
                      updateIssue(buildIssueUpdateBody(issueForUpdate, { vendor_id: acceptedOffer.vendor_id }, listing?.id));
                    }}
                  />
                )}
              </>
            )}
          </div>
        )}
        {activeTab === "assessments" && (
          <div>
            {userType === "vendor" && assessments.length === 0 ? (
              <CalendarSelector
                issueId={issue.id}
                onSubmitted={() => refetchAssessments()}
                usersInteractionId={usersInteractionId}
                assessmentsLoading={assessmentsLoading || assessmentsFetching}
                existingAssessments={assessments.map((a) => ({
                  ...a,
                  title: "Available",
                  start: parseAsUTC(a.start_time),
                  end: parseAsUTC(a.end_time),
                  isNew: false,
                }))}
              />
            ) : assessments.length === 0 &&
              !assessmentsLoading &&
              !assessmentsFetching ? (
              <p className="text-gray-600">No assessment requested yet.</p>
            ) : (
              <AssessmentReview
                assessments={assessments}
                onAccept={handleAccept}
                onRejectAll={handleRejectAll}
                onRejectSingle={handleRejectSingle}
                issueId={issue.id}
                userId={userId}
                userType={userType}
                vendorIdToName={vendorIdToName}
                usersInteractionId={usersInteractionId}
                getUsersInteractionId={getUsersInteractionId}
                onlyShowVendorId={currentVendor?.id}
                isSubmittingProposal={isSubmittingProposal}
                postProposal={handlePostProposal}
                assessmentsLoading={assessmentsLoading || assessmentsFetching}
              />
            )}
          </div>
        )}
        {activeTab === "dispute" && (
          <div id="default-dispute" role="tabpanel">
            <DisputeTab
              issueOfferId={acceptedOffer?.id}
              userType={userType}
              isOfferLoading={offersLoading}
              className="w-full"
            />
          </div>
        )}
      </div>

      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Place Your Offer</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offer Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={offerAmount}
                    disabled={isOfferSubmitting}
                    onChange={(e) => {
                      setOfferAmount(e.target.value);
                      setOfferError("");
                    }}
                    min="1"
                    placeholder="Enter amount"
                    className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-gold focus:border-gold transition-colors"
                  />
                </div>
              </div>

              {userType === "vendor" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
                  <textarea
                    value={commentVendor}
                    disabled={isOfferSubmitting}
                    onChange={(e) => setCommentVendor(e.target.value)}
                    placeholder="Add a message for the client..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-gold focus:border-gold transition-colors"
                    rows={2}
                  />
                </div>
              )}

              {userType === "client" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Private Note (optional)</label>
                  <textarea
                    value={commentClient}
                    onChange={(e) => setCommentClient(e.target.value)}
                    placeholder="Add a private note..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-gold focus:border-gold transition-colors"
                    rows={2}
                  />
                </div>
              )}

              {offerError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{offerError}</p>
                </div>
              )}

              {counterTarget ? (
                <p className="text-sm text-gray-600">
                  You are placing a <strong>counter</strong> to the original offer of{" "}
                  <strong>${counterTarget.price}</strong>
                </p>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Your offer</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${new Intl.NumberFormat("en-US").format(Number(offerAmount) || 0)}
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-500">
                By selecting <strong>Confirm offer</strong>, you are committing to this issue.
              </p>
            </div>

            <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl">
              <button
                onClick={() => setIsOfferModalOpen(false)}
                className={`flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg ${BUTTON_HOVER}`}
                disabled={isOfferSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleOfferSubmit}
                className={`flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gold rounded-lg ${BUTTON_HOVER} disabled:opacity-50`}
                disabled={isOfferSubmitting}
              >
                {isOfferSubmitting ? "Sending..." : "Confirm Offer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vendor: Mark Work Complete Modal */}
      {showMarkCompleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMarkCompleteModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-gold-100 rounded-full flex-shrink-0">
                <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Submit Work for Review?</h3>
                <p className="text-sm text-gray-600">
                  This will notify the client that you've completed the work. They'll review it and either approve or request changes.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button 
                className={`px-4 py-2 rounded-lg border text-sm font-medium ${BUTTON_HOVER}`}
                onClick={() => setShowMarkCompleteModal(false)}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-white text-sm font-semibold bg-gray-900 ${BUTTON_HOVER}`}
                onClick={async () => {
                  const issueForUpdate = await getIssueForUpdate();
                  updateIssue(buildIssueUpdateBody(issueForUpdate, { status: "review" }, listing?.id));
                  setShowMarkCompleteModal(false);
                }}
              >
                Submit for Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client: Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowApproveModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border p-6">
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
                    <span>Once approved, this action cannot be undone.</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button 
                className={`px-4 py-2 rounded-lg border text-sm font-medium ${BUTTON_HOVER}`}
                onClick={() => setShowApproveModal(false)}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-white text-sm font-semibold bg-emerald-600 ${BUTTON_HOVER}`}
                onClick={async () => {
                  const issueForUpdate = await getIssueForUpdate();
                  updateIssue(buildIssueUpdateBody(issueForUpdate, { 
                    status: "completed",
                    review_status: "completed",
                  }, listing?.id));
                  setShowApproveModal(false);
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
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowRequestChangesModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border p-6">
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
              placeholder="Describe what needs to be corrected or improved..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
              rows={4}
            />
            
            <div className="bg-gold-50 border border-gold-200 rounded-lg p-3 mt-3">
              <p className="text-xs text-gold-700 flex items-start gap-2">
                <svg className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Your feedback will be posted as a comment and the vendor will be notified.</span>
              </p>
            </div>

            <div className="flex justify-end gap-2 mt-6">
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
                className={`px-4 py-2 rounded-lg text-white text-sm font-semibold bg-gold ${BUTTON_HOVER} disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={!changeRequestMessage.trim()}
                onClick={async () => {
                  if (changeRequestMessage.trim()) {
                    const issueForUpdate = await getIssueForUpdate();
                    updateIssue(buildIssueUpdateBody(issueForUpdate, { status: "in_progress" }, listing?.id));
                    setShowRequestChangesModal(false);
                    setChangeRequestMessage("");
                    toast.success("Changes requested! The vendor will be notified.");
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

export default IssueDetails;
