import React, { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faXmark,
  faMapMarkerAlt,
  faExclamationTriangle, 
  faExclamationCircle, 
  faInfoCircle,
  faClock,
  faCalendarAlt,
  faDollarSign
} from "@fortawesome/free-solid-svg-icons";
import { IssueAddress, IssueType } from "../types";
import ImageComponent from "./ImageComponent";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";
import { useCreateOfferMutation } from "../features/api/issueOffersApi";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { formatRelativeTime } from "../utils/dateUtils";
import { BUTTON_HOVER } from "../styles/shared";
import { toast } from "react-toastify";

interface GroupedIssuesModalProps {
  address: IssueAddress;
  issues: IssueType[];
  isOpen: boolean;
  onClose: () => void;
}

const GroupedIssuesModal: React.FC<GroupedIssuesModalProps> = ({ 
  address, 
  issues, 
  isOpen, 
  onClose 
}) => {
  const [selectedIssueIds, setSelectedIssueIds] = useState<Set<number>>(new Set());
  const [currentDisplayedIssueId, setCurrentDisplayedIssueId] = useState<number>(issues[0]?.id || 0);
  
  // Offer modal state
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerComment, setOfferComment] = useState("");
  const [offerError, setOfferError] = useState("");
  
  // API hooks
  const [createOffer] = useCreateOfferMutation();
  
  // User info
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const userType = useSelector((state: RootState) => state.auth.user?.user_type);

  // Helper function to extract street name from full address
  const getStreetName = (fullAddress: string) => {
    const addressParts = fullAddress?.split(' ') || [];
    // If first part is numeric (house number), remove it to show just street name
    if (addressParts.length > 1 && /^\d+/.test(addressParts[0])) {
      return addressParts.slice(1).join(' ');
    }
    return fullAddress || 'this street';
  };

  // Get the currently displayed issue
  const currentIssue = useMemo(() => {
    return issues.find(issue => issue.id === currentDisplayedIssueId) || issues[0];
  }, [issues, currentDisplayedIssueId]);

  // Helper function to get severity icon and color
  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return { icon: faExclamationTriangle, color: 'text-red-500' };
      case 'medium':
        return { icon: faExclamationCircle, color: 'text-orange-500' };
      case 'low':
        return { icon: faInfoCircle, color: 'text-blue-500' };
      default:
        return { icon: faExclamationCircle, color: 'text-orange-500' };
    }
  };

  // Handle issue selection
  const handleIssueSelect = (issueId: number) => {
    setSelectedIssueIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
      }
      return newSet;
    });
  };

  // Handle select all / deselect all
  const handleSelectAll = () => {
    if (selectedIssueIds.size === issues.length) {
      setSelectedIssueIds(new Set());
    } else {
      setSelectedIssueIds(new Set(issues.map(issue => issue.id)));
    }
  };

  // Handle issue click to display details
  const handleIssueClick = (issueId: number) => {
    setCurrentDisplayedIssueId(issueId);
  };

  // Handle offer submission
  const handleOfferSubmit = async () => {
    if (!userId || selectedIssueIds.size === 0) return;

    const offerValue = parseFloat(offerAmount);
    if (isNaN(offerValue) || offerValue <= 0) {
      setOfferError("Please enter a valid offer amount");
      return;
    }

    try {
      // Submit offers for all selected issues
      await Promise.all(
        Array.from(selectedIssueIds).map(issueId =>
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

      // Reset form and close modal
      setOfferAmount("");
      setOfferComment("");
      setOfferError("");
      setIsOfferModalOpen(false);
      
      toast.success(`Offers submitted successfully for ${selectedIssueIds.size} issue${selectedIssueIds.size > 1 ? 's' : ''}!`);
      
    } catch (error) {
      console.error("Failed to submit offers:", error);
      setOfferError("Failed to submit offers. Please try again.");
    }
  };

  // Handle assessment scheduling
  const handleScheduleAssessment = () => {
    if (selectedIssueIds.size === 0) return;
    
    // TODO: In a full implementation, this would open a calendar/scheduling modal
    toast.info(`Assessment scheduling for ${selectedIssueIds.size} issue${selectedIssueIds.size > 1 ? 's' : ''} - Coming soon!`);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-7xl h-[90vh] p-4">
        <div className="relative bg-white rounded-lg shadow-lg h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b rounded-t">
            <div>
              {/* Show address only when at least one issue has a vendor assigned */}
              {issues.some(i => i.vendor_id) ? (
                <>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Issues on {getStreetName(address.address)}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                    {address.city}, {address.state}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Issues at this Property
                  </h3>
                  <p className="text-gray-400 mt-1 italic">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                    Address visible after offer accepted
                  </p>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-900 rounded-lg text-sm w-8 h-8 flex items-center justify-center hover:bg-gray-200"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Issues List */}
            <div className="w-1/3 border-r bg-gray-50 flex flex-col">
              {/* Issues List Header */}
              <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-gray-900">
                    Issues ({issues.length})
                  </h4>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-gold hover:text-gold-700 font-medium"
                  >
                    {selectedIssueIds.size === issues.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <p className="text-sm text-gray-600 h-5">
                  {selectedIssueIds.size > 0 
                    ? `${selectedIssueIds.size} issue${selectedIssueIds.size > 1 ? 's' : ''} selected`
                    : '\u00A0' /* Non-breaking space to maintain height */
                  }
                </p>
              </div>

              {/* Issues List */}
              <div className="flex-1 overflow-y-auto">
                {issues.map((issue) => {
                  const isSelected = selectedIssueIds.has(issue.id);
                  const isDisplayed = currentDisplayedIssueId === issue.id;
                  const severityConfig = getSeverityIcon(issue.severity);

                  return (
                    <div
                      key={issue.id}
                      className={`p-4 border-b cursor-pointer transition-colors ${
                        isDisplayed 
                          ? 'bg-gold-50 border-l-4 border-l-gold' 
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => handleIssueClick(issue.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIssueSelect(issue.id);
                          }}
                          className={`mt-1 w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'bg-gray-900 border-gray-900 text-white hover:bg-gray-800' 
                              : 'border-gray-500 hover:border-gold bg-white'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>

                        {/* Issue Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-white bg-gray-900 px-2 py-1 rounded">
                              {normalizeAndCapitalize(issue.type)}
                            </span>
                            <div className="flex items-center gap-1">
                              <FontAwesomeIcon icon={severityConfig.icon} className={severityConfig.color} />
                              <span className="text-xs text-gray-600 capitalize">
                                {issue.severity || 'Medium'}
                              </span>
                            </div>
                          </div>
                          
                          <h5 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2">
                            {issue.summary}
                          </h5>
                          
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <FontAwesomeIcon icon={faClock} />
                            <span>
                              {formatRelativeTime(issue.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Panel - Issue Details */}
            <div className="flex-1 flex flex-col">
              {currentIssue && (
                <>
                  {/* Issue Details Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {/* Issue Header */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm font-semibold text-white bg-gray-900 px-3 py-1.5 rounded-lg">
                          {normalizeAndCapitalize(currentIssue.type)}
                        </span>
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon 
                            icon={getSeverityIcon(currentIssue.severity).icon} 
                            className={getSeverityIcon(currentIssue.severity).color} 
                          />
                          <span className="text-sm text-gray-600 capitalize">
                            {currentIssue.severity || 'Medium'} Severity
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <FontAwesomeIcon icon={faClock} />
                          <span>
                            {formatRelativeTime(currentIssue.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {currentIssue.summary}
                      </h2>
                    </div>

                    {/* Issue Images - with scroll for multiple */}
                    {(() => {
                      let imageList: string[] = [];
                      const raw = currentIssue.image_urls;
                      if (Array.isArray(raw)) {
                        imageList = raw.filter(Boolean);
                      } else if (typeof raw === "string" && raw.startsWith("[")) {
                        try { imageList = JSON.parse(raw).filter(Boolean); } catch { if (raw) imageList = [raw]; }
                      } else if (raw) {
                        imageList = [raw];
                      }
                      if (imageList.length === 0) imageList = ["/images/property_card_holder.jpg"];

                      return (
                        <div className="mb-6">
                          <div className="rounded-lg overflow-hidden">
                            <ImageComponent
                              src={imageList[0]}
                              fallback="/images/property_card_holder.jpg"
                              className="w-full h-64 object-cover"
                            />
                          </div>
                          {imageList.length > 1 && (
                            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                              {imageList.map((url, idx) => (
                                <img
                                  key={idx}
                                  src={url}
                                  alt={`Image ${idx + 1}`}
                                  className="w-16 h-16 rounded-lg object-cover cursor-pointer border-2 border-transparent hover:border-blue-500 transition-colors flex-shrink-0"
                                  onClick={() => {
                                    // Swap clicked image to main display
                                    const el = document.querySelector('.grouped-main-image') as HTMLImageElement;
                                    if (el) el.src = url;
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Issue Description - moved above details grid */}
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {currentIssue.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Issue Details Grid - status, severity, type as compact badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                      <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg border border-gray-200">
                        {normalizeAndCapitalize(currentIssue.type)}
                      </span>
                      <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200 capitalize">
                        {currentIssue.status?.replace("Status.", "").replace(/_/g, " ").toLowerCase() || "open"}
                      </span>
                      <span className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                        currentIssue.severity === "High" ? "bg-red-50 text-red-700 border-red-200"
                        : currentIssue.severity === "Medium" ? "bg-orange-50 text-orange-700 border-orange-200"
                        : "bg-green-50 text-green-700 border-green-200"
                      }`}>
                        {currentIssue.severity || "Medium"}
                      </span>
                    </div>
                    <div className={`grid ${currentIssue.vendor_id ? 'grid-cols-2' : 'grid-cols-1'} gap-4 mb-6`}>
                      {currentIssue.vendor_id && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-1">Cost Estimate</h4>
                          <p className="text-gray-700">{currentIssue.cost || 'Not specified'}</p>
                        </div>
                      )}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-1">Created</h4>
                        <p className="text-gray-700">{new Date(currentIssue.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t bg-gray-50 p-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {selectedIssueIds.size > 0 ? (
                          <>Actions will be applied to {selectedIssueIds.size} selected issue{selectedIssueIds.size > 1 ? 's' : ''}</>
                        ) : (
                          'Select issues to perform bulk actions'
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setIsOfferModalOpen(true)}
                          disabled={selectedIssueIds.size === 0 || userType !== 'vendor'}
                          className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <FontAwesomeIcon icon={faDollarSign} />
                          Submit Offer
                        </button>
                        <button
                          onClick={handleScheduleAssessment}
                          disabled={selectedIssueIds.size === 0 || userType !== 'vendor'}
                          className={`flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold transition-colors`}
                        >
                          <FontAwesomeIcon icon={faCalendarAlt} />
                          Schedule Assessment
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Offer Submission Modal */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              Submit Offer for {selectedIssueIds.size} Issue{selectedIssueIds.size > 1 ? 's' : ''}
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Offer Amount ($)
              </label>
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold focus:border-gold"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment (Optional)
              </label>
              <textarea
                value={offerComment}
                onChange={(e) => setOfferComment(e.target.value)}
                placeholder="Add a comment for the client..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold focus:border-gold"
                rows={3}
              />
            </div>

            {offerError && (
              <p className="text-red-600 text-sm mb-4">{offerError}</p>
            )}

            <div className="text-sm text-gray-600 mb-4">
              <p>You are submitting offers for:</p>
              <ul className="list-disc list-inside mt-1">
                {Array.from(selectedIssueIds).map(issueId => {
                  const issue = issues.find(i => i.id === issueId);
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
                className={`text-sm px-4 py-2 rounded-lg border border-gray-300 ${BUTTON_HOVER}`}
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
