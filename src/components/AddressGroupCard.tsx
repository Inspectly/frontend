import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faChevronLeft, 
  faChevronRight, 
  faMapMarkerAlt,
  faExclamationTriangle, 
  faExclamationCircle, 
  faInfoCircle,
  faClock
} from "@fortawesome/free-solid-svg-icons";
import { IssueAddress, IssueType } from "../types";
import ImageComponent from "./ImageComponent";
import { useNavigate } from "react-router-dom";

interface AddressGroupCardProps {
  address: IssueAddress;
  issues: IssueType[];
}

const AddressGroupCard: React.FC<AddressGroupCardProps> = ({ address, issues }) => {
  const [currentIssueIndex, setCurrentIssueIndex] = useState(0);
  const navigate = useNavigate();
  
  const currentIssue = issues[currentIssueIndex];

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

  const severityConfig = getSeverityIcon(currentIssue.severity);

  const handlePreviousIssue = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIssueIndex((prev) => (prev > 0 ? prev - 1 : issues.length - 1));
  };

  const handleNextIssue = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIssueIndex((prev) => (prev < issues.length - 1 ? prev + 1 : 0));
  };

  const handleCardClick = () => {
    navigate(`/marketplace/${currentIssue.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group cursor-pointer border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all bg-white relative"
    >
      {/* Issue Count Badge */}
      <div className="absolute top-3 right-3 z-10 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
        {issues.length} Issue{issues.length > 1 ? 's' : ''}
      </div>

      {/* Compact Header Image */}
      <div className="relative h-[120px] w-full">
        <ImageComponent
          src={currentIssue.image_url}
          fallback="/images/property_card_holder.jpg"
          className="w-full h-full object-cover transition-transform duration-300"
        />
        
        {/* Navigation Arrows (only show if multiple issues) */}
        {issues.length > 1 && (
          <>
            <button
              onClick={handlePreviousIssue}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
            </button>
            <button
              onClick={handleNextIssue}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all"
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
            </button>
          </>
        )}

        {/* Issue Navigation Dots */}
        {issues.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {issues.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIssueIndex 
                    ? 'bg-white' 
                    : 'bg-white bg-opacity-50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="p-6">
        {/* Issue Type and Timestamp */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white bg-blue-500 px-3 py-1 rounded">
            {currentIssue.type}
          </span>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <FontAwesomeIcon icon={faClock} className="text-gray-400" />
            <span>
              {new Date(currentIssue.created_at).toLocaleDateString() === new Date().toLocaleDateString() 
                ? 'Today'
                : `${Math.floor((new Date().getTime() - new Date(currentIssue.created_at).getTime()) / (1000 * 60 * 60 * 24))} Days ago`}
            </span>
          </div>
        </div>

        {/* Summary */}
        <h3 className="font-medium text-gray-900 mb-3 text-sm line-clamp-2 group-hover:underline">
          {currentIssue.summary}
        </h3>

        {/* Address */}
        <div className="flex items-center gap-1 mb-3 text-xs">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400" />
          <span className="font-medium text-gray-700">
            {address.address}, {address.city}, {address.state}
          </span>
        </div>

        {/* Bottom Row: Severity and Rating */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <FontAwesomeIcon icon={severityConfig.icon} className={severityConfig.color} />
            <span className="text-gray-600 capitalize">
              {currentIssue.severity || 'Medium'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-yellow-400">★</span>
            <span className="font-medium text-gray-700">4.97</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressGroupCard;
