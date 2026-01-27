import React, { useEffect, useMemo, useState } from "react";
import {
  IssueAssessment,
  IssueOffer,
  IssueStatus,
  IssueType,
  Listing,
  statusMapping,
  statusOptions,
} from "../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";
import Attachments from "./Attachments";
import Comments from "./Comments";
import VendorName from "./VendorName";
import { useNavigate } from "react-router-dom";
import { useUpdateIssueMutation } from "../features/api/issuesApi";
import {
  useCreateOfferMutation,
  useGetOffersByIssueIdQuery,
  useUpdateOfferMutation,
} from "../features/api/issueOffersApi";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import {
  useGetAssessmentsByIssueIdQuery,
  useUpdateAssessmentMutation,
} from "../features/api/issueAssessmentsApi";
import { useGetVendorsQuery } from "../features/api/vendorsApi";
import OffersTabClient from "./OffersTabClient";
import { useCreateCheckoutSessionMutation } from "../features/api/stripePaymentsApi";
import AssessmentReviewTab from "./AssessmentReviewTab";
import VendorReviewModal from "./VendorReviewModal";
import { useCreateVendorReviewMutation } from "../features/api/vendorReviewsApi";

export interface HomeownerIssueCardProps {
  issue: IssueType;
  listing?: Listing;
  onClose?: () => void;
}

const HomeownerIssueCard: React.FC<HomeownerIssueCardProps> = ({
  issue,
  listing,
  onClose,
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
  } = useGetOffersByIssueIdQuery(issue?.id, { skip: !issue?.id });

  const [createOffer] = useCreateOfferMutation();
  const [updateOffer] = useUpdateOfferMutation();


  const { data: allVendors = [] } = useGetVendorsQuery();

  const [updateIssue, { isLoading: isUpdatingVisibility }] =
    useUpdateIssueMutation();
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
  const [activeTab, setActiveTab] = useState<
    "details" | "offers" | "assessments"
  >("details");
  const [isActive, setIsActive] = useState<boolean>(issue.active);

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [counterTarget, setCounterTarget] = useState<IssueOffer | null>(null);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerError, setOfferError] = useState("");
  const [isOfferSubmitting, setIsOfferSubmitting] = useState(false);
  const [commentClient, setCommentClient] = useState("");

  // Vendor Review State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);
  const [reviewSubmitStatus, setReviewSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [createVendorReview] = useCreateVendorReviewMutation();

  useEffect(() => setIsActive(issue.active), [issue.active]);

  const handleStatusChange = async (newStatus: string) => {
    // If status is moving to completed, trigger review modal
    const isCompleted = newStatus === "completed" || newStatus === "Status.COMPLETED";

    if (isCompleted && issue.vendor_id && issue.review_status !== "completed") {
      setPendingStatusChange(newStatus);
      setIsReviewModalOpen(true);
      return;
    }

    try {
      await updateIssue({
        ...issue,
        status: newStatus,
      }).unwrap();
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const handleReviewSubmit = async (rating: number, review: string) => {
    if (!issue.vendor_id || !userId) return;

    try {
      await createVendorReview({
        vendor_user_id: issue.vendor_id,
        user_id: userId,
        rating,
        review,
      }).unwrap();

      // Complete the status change and mark review as completed
      await updateIssue({
        ...issue,
        status: pendingStatusChange || "Status.COMPLETED",
        review_status: "completed",
      }).unwrap();

      setReviewSubmitStatus("success");
      setIsReviewModalOpen(false);
      setPendingStatusChange(null);
    } catch (err) {
      console.error("Failed to submit review", err);
      setReviewSubmitStatus("error");
    }
  };


  useEffect(() => {
    setActiveTab("details");
    navigate(`?tab=details`, { replace: true });
  }, [issue?.id, navigate]);

  const vendorIdToName = useMemo(() => {
    const map: Record<number, string> = {};
    allVendors.forEach((vendor) => {
      map[vendor.id] = vendor.name;
    });
    return map;
  }, [allVendors]);

  const formatDate = (iso: string) =>
    new Date(iso + "Z").toLocaleString("en-US", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const handleTabChange = (tab: "details" | "offers" | "assessments") => {
    setActiveTab(tab);
    navigate(`?tab=${tab}`);
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



  const handleToggleVisibility = async () => {
    if (isUpdatingVisibility) return;

    const next = !isActive;
    setIsActive(next);

    try {
      await updateIssue({
        ...issue,
        status: issue.status,
        active: next,
      }).unwrap();
    } catch (e) {
      setIsActive(!next); // rollback
      console.error("Failed to update visibility", e);
    }
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

  return (
    <div className="relative h-full min-h-0 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white hover:opacity-90 z-10"
        >
          <FontAwesomeIcon icon={faTimes} className="text-sm" />
        </button>
      )}

      {/* header */}
      <div className="flex items-start justify-between gap-4 px-6 py-4 border-b bg-white">
        <div className="pr-10">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
            {normalizeAndCapitalize(issue.type)} Issue
          </p>
          <h2 className="text-xl font-semibold text-gray-800 leading-snug">
            {issue.summary || "No Title Found"}
          </h2>
          {listing && (
            <p className="text-sm text-gray-500 mt-1">
              {listing.address}, {listing.city}, {listing.state}
            </p>
          )}
        </div>
      </div>

      {/* tabs */}
      <div className="flex gap-2 px-6 pt-4 border-b bg-white">
        {["details", "offers", "assessments"].map((tab) => (
          <button
            key={tab}
            onClick={() =>
              handleTabChange(tab as "details" | "offers" | "assessments")
            }
            className={`px-4 py-2 text-sm font-medium rounded-t-lg relative ${activeTab === tab
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === "offers" && offers.length > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[1.25rem] h-5 px-1 rounded-full bg-red-500 text-white text-[0.65rem] flex items-center justify-center">
                {offers.length > 9 ? "9+" : offers.length}
              </span>
            )}
            {tab === "assessments" && assessments.length > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[1.25rem] h-5 px-1 rounded-full bg-amber-500 text-white text-[0.65rem] flex items-center justify-center">
                {assessments.length > 9 ? "9+" : assessments.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
        {/* DETAILS TAB */}
        {activeTab === "details" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* LEFT */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <img
                  src={issue.image_url || "/images/no-image.webp"}
                  alt="Issue"
                  className="w-full h-[260px] rounded-lg object-cover cursor-pointer"
                  onClick={() => setSelectedImage(issue.image_url)}
                />
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Description
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {issue.description || "No description available."}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Attachments
                </h3>
                <Attachments issueId={issue.id} userType={userType} />
              </div>

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

            {/* RIGHT: details */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between gap-4">
                    <p className="text-xs font-bold uppercase text-gray-800">
                      Type
                    </p>
                    <p className="text-sm font-semibold text-gray-500">
                      {normalizeAndCapitalize(issue.type)}
                    </p>
                  </div>

                  <div className="flex justify-between gap-4">
                    <p className="text-xs font-bold uppercase text-gray-800">
                      Severity
                    </p>
                    <p
                      className={`text-sm font-semibold ${issue.severity === "High"
                        ? "text-red-600"
                        : issue.severity === "Medium"
                          ? "text-yellow-600"
                          : "text-green-600"
                        }`}
                    >
                      {issue.severity}
                    </p>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase text-gray-800">
                        Marketplace
                      </p>
                      <p className="text-[0.65rem] text-gray-500">
                        {isActive
                          ? "Visible in marketplace"
                          : "Hidden from marketplace"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleVisibility}
                      disabled={isUpdatingVisibility}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isActive ? "bg-blue-500" : "bg-gray-300"
                        } ${isUpdatingVisibility
                          ? "opacity-60 cursor-not-allowed"
                          : ""
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-4" : "translate-x-1"
                          }`}
                      />
                    </button>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <p className="text-xs font-bold uppercase text-gray-800">
                      Status
                    </p>
                    <select
                      value={issue.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className={`inline-flex px-2.5 py-1.5 rounded text-xs font-medium border-0 focus:ring-0 cursor-pointer ${statusMapping[issue.status as IssueStatus] === "open"
                        ? "bg-gray-100 text-gray-700"
                        : statusMapping[issue.status as IssueStatus] === "in_progress"
                          ? "bg-blue-100 text-blue-700"
                          : statusMapping[issue.status as IssueStatus] === "review"
                            ? "bg-yellow-100 text-yellow-700"
                            : statusMapping[issue.status as IssueStatus] === "closed"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="h-px bg-gray-100 my-2" />

                  <div className="flex justify-between gap-4">
                    <p className="text-xs font-bold uppercase text-gray-800">
                      Cost
                    </p>
                    <p className="text-sm font-semibold text-gray-500">
                      {issue.cost != null
                        ? `$${Number(issue.cost).toFixed(2)}`
                        : "N/A"}
                    </p>
                  </div>

                  <div className="flex justify-between gap-4">
                    <p className="text-xs font-bold uppercase text-gray-800">
                      Vendor
                    </p>
                    <p className="text-sm font-semibold text-gray-500">
                      {issue.vendor_id ? (
                        <VendorName
                          vendorId={issue.vendor_id}
                          isVendorId={false}
                          showRating
                        />
                      ) : (
                        "Not assigned"
                      )}
                    </p>
                  </div>

                  <div className="h-px bg-gray-100 my-2" />

                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase text-gray-800">
                      Date Created
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(issue.created_at)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase text-gray-800">
                      Date Updated
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(issue.updated_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OFFERS TAB */}
        {activeTab === "offers" && (
          <div className="space-y-4">
            {offersLoading ? (
              <p>Loading offers...</p>
            ) : offersError ? (
              <p>Error loading offers</p>
            ) : (
              <>
                {userType === "client" && (
                  <OffersTabClient
                    offers={offers}
                    uniqueVendors={
                      new Set(offers.map((o) => o.vendor_id)).size
                    }
                    handleOpenOfferModal={handleOpenOfferModal}
                    onOpenOfferModal={() => setIsOfferModalOpen(true)}
                    onOfferAccepted={async (acceptedOffer) => {
                      try {
                        const response = await createCheckoutSession({
                          client_id: userId,
                          vendor_id: acceptedOffer.vendor_id,
                          offer_id: acceptedOffer.id,
                        }).unwrap();
                        window.location.href = response.session_url;
                      } catch (err) {
                        console.error("Stripe error", err);
                        alert("Could not start payment, please try again.");
                      }
                    }}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* ASSESSMENTS TAB */}
        {activeTab === "assessments" && (
          <div className="space-y-3">
            {assessments.length === 0 &&
              !assessmentsLoading &&
              !assessmentsFetching ? (
              <p className="text-gray-600">No assessment requested yet.</p>
            ) : (
              <AssessmentReviewTab
                assessments={assessments}
                onAccept={handleAcceptAssessment}
                userId={userId}
                userType={userType}
                vendorIdToName={vendorIdToName}
                onlyShowVendorId={undefined}
                assessmentsLoading={assessmentsLoading || assessmentsFetching}
              />
            )}
          </div>
        )}
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
            <h2 className="text-lg font-semibold mb-4">Place Your Offer</h2>

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
                You are placing a <strong>counter</strong> to the original offer
                of <strong>${counterTarget.price}</strong>
              </p>
            ) : (
              <p className="text-sm text-gray-600 mb-2">
                You are about to place an offer for:{" "}
                <strong>
                  $
                  {new Intl.NumberFormat("en-US").format(
                    Number(offerAmount) || 0
                  )}
                </strong>
              </p>
            )}

            <p className="text-xs text-gray-500 mt-2">
              By selecting <strong>Confirm offer</strong>, you are committing to
              this issue.
            </p>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setIsOfferModalOpen(false)}
                className="text-sm px-4 py-2 rounded border border-gray-400"
                disabled={isOfferSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleOfferSubmit}
                className="text-sm px-4 py-2 rounded bg-blue-600 text-white"
                disabled={isOfferSubmitting}
              >
                {isOfferSubmitting ? <>Sending...</> : "Confirm Offer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Review Modal */}
      <VendorReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setPendingStatusChange(null);
        }}
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
              className={`w-full py-2 px-4 rounded font-medium text-white transition-colors ${reviewSubmitStatus === "success" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                }`}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeownerIssueCard;
