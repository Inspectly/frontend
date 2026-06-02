import React, { useState, useMemo } from "react";
import { MapPin } from "lucide-react";
import { PROPERTY_FALLBACK_IMAGE } from "../constants/assets";
import { IssueAddress, IssueAssessment, IssueOffer, IssueType } from "../types";
import ImageComponent from "./ImageComponent";
import BidStatusButton from "./BidStatusButton";
import { getBidStage, isCtaStage, BidStage } from "../utils/bidStatus";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
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
  /** The current vendor's existing offer on this issue, if any. */
  myOffer?: IssueOffer;
  /** The current vendor's assessment request on this issue, if any. */
  myAssessment?: IssueAssessment;
  onClick?: (issue: IssueType) => void;
  onPlaceBid?: (issue: IssueType) => void;
}

const IssueItem: React.FC<IssueItemProps> = ({ issue, address, myOffer, myAssessment, onClick, onPlaceBid }) => {
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

  const stage = getBidStage(myOffer, myAssessment);

  // Glanceable status badge shown over the image (amount for offers,
  // visit status for assessments).
  const badge: { label: string; className: string } | null = (() => {
    const stageBadges: Partial<Record<BidStage, { label: string; className: string }>> = {
      offer_accepted: { label: "Offer accepted", className: "bg-emerald-500/90 text-white" },
      offer_pending: {
        label: myOffer ? `$${Number(myOffer.price).toLocaleString()}` : "Your offer",
        className: "bg-gold/90 text-white",
      },
      assessment_confirmed: { label: "Visit confirmed", className: "bg-emerald-500/90 text-white" },
      assessment_pending: { label: "Visit requested", className: "bg-sky-500/90 text-white" },
    };
    return stageBadges[stage] ?? null;
  })();

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
      className={`group border border-border rounded-xl overflow-hidden bg-card h-[400px] flex flex-col ${CARD_HOVER.LIFT}`}
    >
      {/* Image Section - with scroll arrows */}
      <div onClick={handleClick} className="cursor-pointer h-[260px] overflow-hidden relative">
        <ImageComponent
          src={imageList[currentImageIndex] || PROPERTY_FALLBACK_IMAGE}
          fallback={PROPERTY_FALLBACK_IMAGE}
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

        {/* Status badge - Top Right (offer amount / visit status) */}
        {badge && (
          <div className="absolute top-3 right-3">
            <span
              className={`text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm shadow-lg ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div onClick={handleClick} className="cursor-pointer flex-1 px-4 pt-3 pb-2 flex flex-col justify-between">
        {/* Top Row: Summary and Days aligned horizontally */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-foreground text-sm line-clamp-2 group-hover:underline flex-1 pr-3">
            {issue.summary}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
            <FontAwesomeIcon icon={faClock} className="text-gray-400" />
            <span>
              {formatRelativeTime(issue.created_at)}
            </span>
          </div>
        </div>

        {/* Bottom Row: City, Severity, Rating */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span>
                {address?.city || "Loading..."}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <FontAwesomeIcon icon={severityConfig.icon} className={severityConfig.color} />
              <span className="text-muted-foreground capitalize">
                {issue.severity || 'Medium'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status-driven action button */}
      <div className="px-4 pb-4">
        <BidStatusButton
          stage={stage}
          className="w-full h-11 px-4"
          onClick={(e) => {
            e.stopPropagation();
            // Active CTA → open the bid panel; other stages open the detail
            // view so the vendor can view / manage the pending item.
            if (isCtaStage(stage)) {
              if (onPlaceBid) onPlaceBid(issue);
              else handleClick();
            } else if (onClick) {
              onClick(issue);
            } else {
              handleClick();
            }
          }}
        />
      </div>
    </div>
  );
};

export default IssueItem;
