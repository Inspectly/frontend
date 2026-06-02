import React, { useState, useMemo } from "react";
import { MapPin } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faExclamationTriangle,
  faExclamationCircle,
  faInfoCircle,
  faClock,
  faDollarSign,
} from "@fortawesome/free-solid-svg-icons";
import { IssueAddress, IssueOffer, IssueOfferStatus, IssueType, Listing } from "../types";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";
import { useCreateOfferMutation } from "../features/api/issueOffersApi";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { formatRelativeTime } from "../utils/dateUtils";
import { BUTTON_HOVER } from "../styles/shared";
import { toast } from "react-toastify";
import MarketplaceIssueCard from "./MarketplaceIssueCard";

interface GroupedIssuesModalProps {
  address: IssueAddress;
  issues: IssueType[];
  offerByIssueId?: Record<number, IssueOffer>;
  listing?: Listing;
  isOpen: boolean;
  onClose: () => void;
}

const GroupedIssuesModal: React.FC<GroupedIssuesModalProps> = ({
  address,
  issues,
  offerByIssueId,
  listing,
  isOpen,
  onClose,
}) => {
  const [selectedIssueIds, setSelectedIssueIds] = useState<Set<number>>(new Set());
  const [currentDisplayedIssueId, setCurrentDisplayedIssueId] = useState<number>(issues[0]?.id || 0);

  // Bulk offer modal state
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerComment, setOfferComment] = useState("");
  const [offerError, setOfferError] = useState("");

  const [createOffer] = useCreateOfferMutation();

  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const userType = useSelector((state: RootState) => state.auth.user?.user_type);

  const currentIssue = useMemo(() => {
    return issues.find((issue) => issue.id === currentDisplayedIssueId) || issues[0];
  }, [issues, currentDisplayedIssueId]);

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return { icon: faExclamationTriangle, color: "text-red-500" };
      case "medium":
        return { icon: faExclamationCircle, color: "text-orange-500" };
      case "low":
        return { icon: faInfoCircle, color: "text-blue-500" };
      default:
        return { icon: faExclamationCircle, color: "text-orange-500" };
    }
  };

  const handleIssueSelect = (issueId: number) => {
    setSelectedIssueIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIssueIds.size === issues.length) {
      setSelectedIssueIds(new Set());
    } else {
      setSelectedIssueIds(new Set(issues.map((issue) => issue.id)));
    }
  };

  const handleOfferSubmit = async () => {
    if (!userId || selectedIssueIds.size === 0) return;

    const offerValue = parseFloat(offerAmount);
    if (isNaN(offerValue) || offerValue <= 0) {
      setOfferError("Please enter a valid offer amount");
      return;
    }

    try {
      await Promise.all(
        Array.from(selectedIssueIds).map((issueId) =>
          createOffer({
            issue_id: issueId,
            vendor_id: userId,
            price: offerValue,
            status: "received",
            comment_vendor: offerComment,
            comment_client: "",
          }).unwrap()
        )
      );

      setOfferAmount("");
      setOfferComment("");
      setOfferError("");
      setIsOfferModalOpen(false);
      setSelectedIssueIds(new Set());

      toast.success(
        `Offers submitted successfully for ${selectedIssueIds.size} issue${selectedIssueIds.size > 1 ? "s" : ""}!`
      );
    } catch (error) {
      console.error("Failed to submit offers:", error);
      setOfferError("Failed to submit offers. Please try again.");
    }
  };

  if (!isOpen) return null;

  const getStreetName = (fullAddress: string) => {
    const addressParts = fullAddress?.split(" ") || [];
    if (addressParts.length > 1 && /^\d+/.test(addressParts[0])) {
      return addressParts.slice(1).join(" ");
    }
    return fullAddress || "this street";
  };

  const addressRevealed = issues.some((i) => i.vendor_id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-7xl h-[90vh] p-4">
        <div className="relative bg-card rounded-lg shadow-lg h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b rounded-t flex-shrink-0">
            <div>
              <h3 className="text-2xl font-semibold text-foreground">
                {addressRevealed ? `Issues on ${getStreetName(address.address)}` : "Issues at this Property"}
              </h3>
              <p className={`mt-1 text-muted-foreground ${addressRevealed ? "" : "italic"}`}>
                <MapPin className="w-3.5 h-3.5 mr-1.5 inline flex-shrink-0" />
                {addressRevealed
                  ? `${address.city}, ${address.state}`
                  : [address.city, address.state].filter(Boolean).join(", ") ||
                    "Address visible after offer accepted"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground rounded-lg text-sm w-8 h-8 flex items-center justify-center hover:bg-muted"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Selectable issues list */}
            <div className="w-1/3 border-r border-border bg-muted/40 flex flex-col">
              <div className="p-4 border-b border-border bg-card flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-foreground">Issues ({issues.length})</h4>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-gold hover:text-gold-700 font-medium"
                  >
                    {selectedIssueIds.size === issues.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground h-5">
                  {selectedIssueIds.size > 0
                    ? `${selectedIssueIds.size} issue${selectedIssueIds.size > 1 ? "s" : ""} selected for offer`
                    : "Tick issues to bid on several at once"}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto">
                {issues.map((issue) => {
                  const isSelected = selectedIssueIds.has(issue.id);
                  const isDisplayed = currentDisplayedIssueId === issue.id;
                  const severityConfig = getSeverityIcon(issue.severity);
                  const issueOffer = offerByIssueId?.[issue.id];
                  const issueOfferAccepted = issueOffer?.status === IssueOfferStatus.ACCEPTED;

                  return (
                    <div
                      key={issue.id}
                      className={`p-4 border-b cursor-pointer transition-colors ${
                        isDisplayed ? "bg-gold-50 border-l-4 border-l-gold" : "hover:bg-muted"
                      }`}
                      onClick={() => setCurrentDisplayedIssueId(issue.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox — selects the issue for a bulk offer */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIssueSelect(issue.id);
                          }}
                          className={`mt-1 w-5 h-5 border-2 rounded flex items-center justify-center transition-all flex-shrink-0 ${
                            isSelected
                              ? "bg-gray-900 border-gray-900 text-white hover:bg-gray-800"
                              : "border-border hover:border-gold bg-card"
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs font-semibold text-white bg-gray-900 px-2 py-1 rounded">
                              {normalizeAndCapitalize(issue.type)}
                            </span>
                            <div className="flex items-center gap-1">
                              <FontAwesomeIcon icon={severityConfig.icon} className={severityConfig.color} />
                              <span className="text-xs text-muted-foreground capitalize">
                                {issue.severity || "Medium"}
                              </span>
                            </div>
                          </div>

                          <h5 className="font-medium text-foreground text-sm line-clamp-2 mb-2">
                            {issue.summary}
                          </h5>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <FontAwesomeIcon icon={faClock} />
                              {formatRelativeTime(issue.created_at)}
                            </span>
                            {issueOffer && (
                              <span
                                className={`font-semibold px-2 py-0.5 rounded ${
                                  issueOfferAccepted
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gold-50 text-gold-700"
                                }`}
                              >
                                {issueOfferAccepted ? "Accepted" : "Your offer"} ${issueOffer.price}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Left footer — bulk offer on the ticked issues */}
              <div className="p-4 border-t border-border bg-card flex-shrink-0">
                <button
                  onClick={() => setIsOfferModalOpen(true)}
                  disabled={selectedIssueIds.size === 0 || userType !== "vendor"}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gold text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <FontAwesomeIcon icon={faDollarSign} />
                  {selectedIssueIds.size > 0
                    ? `Bid on ${selectedIssueIds.size} selected`
                    : "Select issues to bid"}
                </button>
              </div>
            </div>

            {/* Right Panel - The same single-issue module used in the ungrouped
                view, so offer state (Place Bid / Edit / Delete), assessments,
                and address reveal all behave identically. */}
            <div className="flex-1 overflow-y-auto bg-muted/20">
              {currentIssue && (
                <div className="p-4">
                  <MarketplaceIssueCard
                    key={currentIssue.id}
                    issue={currentIssue}
                    listing={listing}
                    address={address}
                    initialMyOffer={offerByIssueId?.[currentIssue.id]}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Offer Submission Modal */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-card p-6 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              Submit Offer for {selectedIssueIds.size} Issue{selectedIssueIds.size > 1 ? "s" : ""}
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">Offer Amount ($)</label>
              <input
                type="number"
                value={offerAmount}
                onChange={(e) => {
                  setOfferAmount(e.target.value);
                  setOfferError("");
                }}
                min="1"
                step="0.01"
                placeholder="Enter your offer amount"
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-gold focus:border-gold"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">Comment (Optional)</label>
              <textarea
                value={offerComment}
                onChange={(e) => setOfferComment(e.target.value)}
                placeholder="Add a comment for the client..."
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-gold focus:border-gold"
                rows={3}
              />
            </div>

            {offerError && <p className="text-red-600 text-sm mb-4">{offerError}</p>}

            <div className="text-sm text-muted-foreground mb-4">
              <p>You are submitting offers for:</p>
              <ul className="list-disc list-inside mt-1">
                {Array.from(selectedIssueIds).map((issueId) => {
                  const issue = issues.find((i) => i.id === issueId);
                  return (
                    <li key={issueId} className="truncate">
                      {issue?.summary || `${normalizeAndCapitalize(issue?.type || "")} Issue`}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsOfferModalOpen(false);
                  setOfferAmount("");
                  setOfferComment("");
                  setOfferError("");
                }}
                className={`text-sm px-4 py-2 rounded-lg border border-border text-foreground ${BUTTON_HOVER}`}
              >
                Cancel
              </button>
              <button
                onClick={handleOfferSubmit}
                disabled={!offerAmount || parseFloat(offerAmount) <= 0}
                className="text-sm px-4 py-2 rounded-lg bg-gold text-white hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Submit Offers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupedIssuesModal;
