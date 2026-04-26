import React, { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faStar,
  faMapMarkerAlt,
  faCalendar,
  faMessage,
  faCheckCircle,
  faClock,
  faCircleXmark,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import { IssueOffer, IssueOfferStatus, IssueType, Listing, Vendor } from "../types";
import { getIssueImageUrlsFromIssue } from "../utils/issueImageUtils";
import VendorModal from "./VendorModal";
import {
  useGetCommentsQuery,
  useCreateCommentMutation,
} from "../features/api/commentsApi";
import { useGetVendorReviewsByVendorUserIdQuery } from "../features/api/vendorReviewsApi";
import UserName from "./UserName";

const FALLBACK_HOUSE_IMAGE = "/images/property_card_holder.jpg";

interface OfferDetailModalProps {
  offer: IssueOffer;
  issue: IssueType;
  listing?: Listing;
  vendor?: Vendor;
  currentUserId?: number;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
  isProcessing?: boolean;
}

const OfferDetailModal: React.FC<OfferDetailModalProps> = ({
  offer,
  issue,
  listing,
  vendor,
  currentUserId,
  onClose,
  onAccept,
  onDecline,
  isProcessing = false,
}) => {
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [newComment, setNewComment] = useState("");

  const issueImages = getIssueImageUrlsFromIssue(issue);
  const thumbSrc = issueImages[0] || FALLBACK_HOUSE_IMAGE;

  const vendorName = vendor?.name || vendor?.company_name || "Unknown vendor";
  const rating = vendor?.rating ? Number(vendor.rating) : null;

  const { data: vendorReviews = [] } = useGetVendorReviewsByVendorUserIdQuery(
    vendor?.vendor_user_id ?? 0,
    { skip: !vendor?.vendor_user_id }
  );
  const reviewCount = vendorReviews.length;

  const { data: allComments = [] } = useGetCommentsQuery();
  const issueComments = useMemo(
    () => allComments.filter((c) => c.issue_id === issue.id),
    [allComments, issue.id]
  );
  const [createComment, { isLoading: isPostingComment }] = useCreateCommentMutation();

  const status = offer.status;
  const isPending = status === IssueOfferStatus.RECEIVED;
  const isAccepted = status === IssueOfferStatus.ACCEPTED;
  const isDeclined = status === IssueOfferStatus.REJECTED;

  const formatDate = (iso: string) => {
    const date = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCommentDate = (iso: string) => {
    const date = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleSendComment = async () => {
    const trimmed = newComment.trim();
    if (!trimmed || !currentUserId) return;
    try {
      await createComment({
        issueId: issue.id,
        comment: trimmed,
        userId: currentUserId,
      }).unwrap();
      setNewComment("");
    } catch (err) {
      console.error("Failed to post comment", err);
    }
  };

  const handleCommentKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  const renderStatusPill = () => {
    if (isAccepted) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
          <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
          Accepted
        </span>
      );
    }
    if (isDeclined) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <FontAwesomeIcon icon={faCircleXmark} className="w-3 h-3" />
          Declined
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
        Pending
      </span>
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4 py-6"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors z-10"
          >
            <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
          </button>

          {/* Header: avatar + name + status */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {vendor?.profile_image_url && vendor.profile_image_url !== "None" ? (
                  <img
                    src={vendor.profile_image_url}
                    alt={vendorName}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-base font-semibold text-gray-600">
                    {(vendorName[0] || "?").toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 pr-8">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => vendor && setShowVendorModal(true)}
                    disabled={!vendor}
                    className="text-xl font-bold text-gray-900 hover:underline disabled:no-underline disabled:cursor-default text-left truncate"
                  >
                    {vendorName}
                  </button>
                  {renderStatusPill()}
                </div>
                {(rating !== null && !Number.isNaN(rating)) || reviewCount > 0 ? (
                  <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                    {rating !== null && !Number.isNaN(rating) && (
                      <>
                        <FontAwesomeIcon icon={faStar} className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-semibold text-gray-800">{rating.toFixed(1)}</span>
                      </>
                    )}
                    {reviewCount > 0 && (
                      <span className="text-gray-500">({reviewCount} reviews)</span>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Issue summary card */}
          <div className="px-6">
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="w-16 h-12 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
                <img
                  src={thumbSrc}
                  alt={issue.summary || "Issue"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_HOUSE_IMAGE;
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  {issue.summary || "Issue"}
                </div>
                {listing?.address && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3" />
                    <span className="truncate">{listing.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quote + Duration */}
          <div className="px-6 mt-4 grid grid-cols-2 gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500">Quote Amount</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                ${(offer.price || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500">Est. Duration</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">—</div>
            </div>
          </div>

          {/* Date */}
          <div className="px-6 mt-3 flex items-center gap-2 text-sm text-gray-500">
            <FontAwesomeIcon icon={faCalendar} className="w-3.5 h-3.5" />
            <span>{formatDate(offer.created_at)}</span>
          </div>

          {/* Vendor Message */}
          <div className="px-6 mt-4">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 text-gray-900">
                <FontAwesomeIcon icon={faMessage} className="w-3.5 h-3.5" />
                <span className="font-semibold text-sm">Vendor Message</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {offer.comment_vendor?.trim() || "No message from vendor."}
              </p>
            </div>
          </div>

          {/* Comments */}
          <div className="px-6 mt-4 mb-4">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3 text-gray-900">
                <FontAwesomeIcon icon={faMessage} className="w-3.5 h-3.5" />
                <span className="font-semibold text-sm">Comments</span>
                {issueComments.length > 0 && (
                  <span className="text-xs text-gray-500">({issueComments.length})</span>
                )}
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 mb-3">
                {issueComments.length === 0 ? (
                  <p className="text-xs text-gray-500">No comments yet.</p>
                ) : (
                  issueComments.map((c) => (
                    <div key={c.id} className="bg-white border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700">
                          <UserName userId={Number(c.user_id)} />
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatCommentDate(c.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.comment}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={handleCommentKeyDown}
                  placeholder="Reply to vendor..."
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleSendComment}
                  disabled={!newComment.trim() || isPostingComment || !currentUserId}
                  className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                  <FontAwesomeIcon icon={faPaperPlane} className="w-3 h-3" />
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons (only when Pending) */}
          {isPending && (
            <div className="px-6 pb-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onDecline}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={onAccept}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-gold text-white text-sm font-semibold hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Processing..." : "Accept Offer"}
              </button>
            </div>
          )}
        </div>
      </div>

      {showVendorModal && vendor && (
        <VendorModal vendor={vendor} onClose={() => setShowVendorModal(false)} />
      )}
    </>
  );
};

export default OfferDetailModal;
