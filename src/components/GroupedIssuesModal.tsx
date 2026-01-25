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
import { useCreateAssessmentMutation } from "../features/api/issueAssessmentsApi";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { formatRelativeTime } from "../utils/dateUtils";

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
  
  // Assessment modal state
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  
  // API hooks
  const [createOffer] = useCreateOfferMutation();
  const [createAssessment] = useCreateAssessmentMutation();
  
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
      
      // Show success message (you might want to add a toast notification here)
      alert(`Offers submitted successfully for ${selectedIssueIds.size} issue${selectedIssueIds.size > 1 ? 's' : ''}!`);
      
    } catch (error) {
      console.error("Failed to submit offers:", error);
      setOfferError("Failed to submit offers. Please try again.");
    }
  };

  // Handle assessment scheduling
  const handleScheduleAssessment = () => {
    if (selectedIssueIds.size === 0) return;
    
    // For now, show a placeholder message
    // In a full implementation, this would open a calendar/scheduling modal
    alert(`Assessment scheduling for ${selectedIssueIds.size} issue${selectedIssueIds.size > 1 ? 's' : ''} - Calendar integration coming soon!`);
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
              <h3 className="text-2xl font-semibold text-gray-900">
                Issues on {getStreetName(address.address)}
              </h3>
              <p className="text-gray-600 mt-1">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                {address.city}, {address.state}
              </p>
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
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
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
                          ? 'bg-blue-50 border-l-4 border-l-blue-500' 
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
                              ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700' 
                              : 'border-gray-500 hover:border-blue-500 bg-white'
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
                            <span className="text-xs font-semibold text-white bg-blue-600 px-2 py-1 rounded">
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
                        <span className="text-sm font-semibold text-white bg-blue-600 px-3 py-1.5 rounded-lg">
                          {currentIssue.type}
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

                    {/* Issue Image */}
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Image</h3>
                      <div className="rounded-lg overflow-hidden">
                        <ImageComponent
                          src={currentIssue.image_url || "/images/property_card_holder.jpg"}
                          fallback="/images/property_card_holder.jpg"
                          className="w-full h-64 object-cover"
                        />
                      </div>
                    </div>

                    {/* Issue Description */}
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {currentIssue.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Issue Details Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-1">Status</h4>
                        <p className="text-gray-700 capitalize">{currentIssue.status}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-1">Cost Estimate</h4>
                        <p className="text-gray-700">{currentIssue.cost || 'Not specified'}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-1">Created</h4>
                        <p className="text-gray-700">{new Date(currentIssue.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-1">Last Updated</h4>
                        <p className="text-gray-700">{new Date(currentIssue.updated_at).toLocaleDateString()}</p>
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
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <FontAwesomeIcon icon={faDollarSign} />
                          Submit Offer
                        </button>
                        <button
                          onClick={handleScheduleAssessment}
                          disabled={selectedIssueIds.size === 0 || userType !== 'vendor'}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                className="w-full border border-gray-300 rounded px-3 py-2"
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
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
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
                className="text-sm px-4 py-2 rounded border border-gray-400 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleOfferSubmit}
                disabled={!offerAmount || parseFloat(offerAmount) <= 0}
                className="text-sm px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
