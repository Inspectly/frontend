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
import { useNavigate, useSearchParams } from "react-router-dom";

interface AddressGroupCardProps {
  address: IssueAddress;
  issues: IssueType[];
}

const AddressGroupCard: React.FC<AddressGroupCardProps> = ({ address, issues }) => {
  const [currentIssueIndex, setCurrentIssueIndex] = useState(0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
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
    const currentParams = new URLSearchParams(searchParams);
    const paramsString = currentParams.toString();
    const url = `/marketplace/${currentIssue.id}${paramsString ? `?${paramsString}` : ''}`;
    navigate(url);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group cursor-pointer border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all bg-white h-[350px]"
    >
      {/* Image Section - Top 3/4 */}
      <div className="h-3/4 overflow-hidden relative">
        <ImageComponent
          src={currentIssue.image_url}
          fallback="/images/property_card_holder.jpg"
          className="w-full h-full object-cover"
        />
        
        {/* Issue Count and Type Labels - Bottom Left Corner of Image */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div className="bg-blue-600/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm shadow-lg">
            {issues.length} Issue{issues.length > 1 ? 's' : ''}
          </div>
          <span className="text-xs font-semibold text-white bg-blue-600/90 px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-lg">
            {currentIssue.type}
          </span>
        </div>

        {/* Navigation Controls - Center of Image (only if multiple issues) */}
        {issues.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between px-4">
            <button
              onClick={handlePreviousIssue}
              className="bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all backdrop-blur-sm shadow-lg"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-lg" />
            </button>
            
            <button
              onClick={handleNextIssue}
              className="bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all backdrop-blur-sm shadow-lg"
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-lg" />
            </button>
          </div>
        )}

        {/* Navigation Indicator - Top Right Corner (only if multiple issues) */}
        {issues.length > 1 && (
          <div className="absolute top-3 right-3">
            <div className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm font-medium shadow-lg">
              {currentIssueIndex + 1} of {issues.length}
            </div>
          </div>
        )}
      </div>

      {/* Content Section - Bottom 1/4 */}
      <div className="h-1/4 p-4 flex flex-col justify-between">
        {/* Top Row: Summary and Days aligned horizontally */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:underline flex-1 pr-3">
            {currentIssue.summary}
          </h3>
          <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
            <FontAwesomeIcon icon={faClock} className="text-gray-400" />
            <span>
              {new Date(currentIssue.created_at).toLocaleDateString() === new Date().toLocaleDateString() 
                ? 'Today'
                : `${Math.floor((new Date().getTime() - new Date(currentIssue.created_at).getTime()) / (1000 * 60 * 60 * 24))} Days ago`}
            </span>
          </div>
        </div>

        {/* Bottom Row: Address, Severity, Rating */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-gray-600">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400" />
              <span>
                {address.city}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <FontAwesomeIcon icon={severityConfig.icon} className={severityConfig.color} />
              <span className="text-gray-600 capitalize">
                {currentIssue.severity || 'Medium'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">★</span>
            <span className="font-medium text-gray-700">4.97</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressGroupCard;
