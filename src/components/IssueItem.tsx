import React, { useState, useMemo } from "react";
import { IssueAddress, IssueType } from "../types";
import ImageComponent from "./ImageComponent";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faMapMarkerAlt, 
  faExclamationTriangle, 
  faClock,
  faExclamationCircle,
  faInfoCircle,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { formatRelativeTime } from "../utils/dateUtils";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";
import { CARD_HOVER } from "../styles/shared";

interface IssueItemProps {
  issue: IssueType;
  userType?: string;
  address?: IssueAddress;
  onClick?: (issue: IssueType) => void;
}

const IssueItem: React.FC<IssueItemProps> = ({ issue, address, onClick }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Parse image_urls into an array
  const imageList = useMemo(() => {
    const raw = issue.image_urls as string | string[];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === "string" && raw.startsWith("[")) {
      try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed.filter(Boolean); } catch { /* ignore */ }
    }
    if (raw) return [raw];
    return [];
  }, [issue.image_urls]);

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

  const severityConfig = getSeverityIcon(issue.severity);

  const handleClick = () => {
    if (onClick) {
      onClick(issue);
    } else {
      const currentParams = new URLSearchParams(searchParams);
      const paramsString = currentParams.toString();
      const url = `/marketplace/${issue.id}${paramsString ? `?${paramsString}` : ''}`;
      navigate(url);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group cursor-pointer border border-gray-200 rounded-xl overflow-hidden bg-white h-[350px] ${CARD_HOVER.LIFT}`}
    >
      {/* Image Section - Top 3/4 with scroll arrows */}
      <div className="h-3/4 overflow-hidden relative">
        <ImageComponent
          src={imageList[currentImageIndex] || "/images/property_card_holder.jpg"}
          fallback="/images/property_card_holder.jpg"
          className="w-full h-full object-cover"
        />

        {/* Left/Right navigation arrows - only if multiple images */}
        {imageList.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : imageList.length - 1)); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev < imageList.length - 1 ? prev + 1 : 0)); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100"
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
            </button>
            {/* Dot indicators */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5">
              {imageList.map((_, idx) => (
                <span key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentImageIndex ? "bg-white" : "bg-white/50"}`} />
              ))}
            </div>
          </>
        )}

        {/* Issue Type Label - Bottom Left Corner of Image */}
        <div className="absolute bottom-3 left-3">
          <span className="text-xs font-semibold text-white bg-gray-900/90 px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-lg">
            {normalizeAndCapitalize(issue.type)}
          </span>
        </div>
      </div>

      {/* Content Section - Bottom 1/4 */}
      <div className="h-1/4 p-4 flex flex-col justify-between">
        {/* Top Row: Summary and Days aligned horizontally */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:underline flex-1 pr-3">
            {issue.summary}
          </h3>
          <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
            <FontAwesomeIcon icon={faClock} className="text-gray-400" />
            <span>
              {formatRelativeTime(issue.created_at)}
            </span>
          </div>
        </div>

        {/* Bottom Row: City, Severity, Rating */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-gray-600">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400" />
              <span>
                {address?.city || "Loading..."}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <FontAwesomeIcon icon={severityConfig.icon} className={severityConfig.color} />
              <span className="text-gray-600 capitalize">
                {issue.severity || 'Medium'}
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

export default IssueItem;
