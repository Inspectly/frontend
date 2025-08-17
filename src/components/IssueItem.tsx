import React, { useMemo } from "react";
import { IssueAddress, IssueType, Vendor } from "../types";
import ImageComponent from "./ImageComponent";
import { useNavigate } from "react-router-dom";
import { useGetOffersByVendorIdQuery } from "../features/api/issueOffersApi";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faMapMarkerAlt, 
  faExclamationTriangle, 
  faClock,
  faExclamationCircle,
  faInfoCircle
} from "@fortawesome/free-solid-svg-icons";

interface IssueItemProps {
  issue: IssueType;
  vendor?: Vendor;
  userType?: string;
  address?: IssueAddress;
}

const IssueItem: React.FC<IssueItemProps> = ({ issue, userType, address }) => {
  const vendorId = useSelector((state: RootState) => state.auth.user?.id);

  const { data: allVendorOffers = [], isLoading: offerLoading } =
    useGetOffersByVendorIdQuery(vendorId || "", {
      skip: !vendorId || userType !== "vendor",
    });

  const navigate = useNavigate();

  const vendorOffers = useMemo(() => {
    return allVendorOffers.filter((offer) => offer.issue_id === issue.id);
  }, [allVendorOffers, issue.id]);

  const sortedVendorOffers = useMemo(() => {
    return [...vendorOffers].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [vendorOffers]);

  const latestVendorOffer = sortedVendorOffers.length
    ? sortedVendorOffers[0].price
    : null;

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

  return (
    <div
      onClick={() => navigate(`/marketplace/${issue.id}`)}
      className="group cursor-pointer border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all bg-white"
    >
      {/* Compact Header Image */}
      <div className="relative h-[120px] w-full">
        <ImageComponent
          src={issue.image_url}
          fallback="/images/property_card_holder.jpg"
          className="w-full h-full object-cover transition-transform duration-300"
        />
      </div>

      {/* Details Section */}
      <div className="p-4">
        {/* Issue Type and Timestamp */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white bg-blue-500 px-3 py-1 rounded">
            {issue.type}
          </span>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <FontAwesomeIcon icon={faClock} className="text-gray-400" />
            <span>
              {new Date(issue.created_at).toLocaleDateString() === new Date().toLocaleDateString() 
                ? 'Today'
                : `${Math.floor((new Date().getTime() - new Date(issue.created_at).getTime()) / (1000 * 60 * 60 * 24))} Days ago`}
            </span>
          </div>
        </div>

        {/* Summary */}
        <h3 className="font-medium text-gray-900 mb-3 text-sm line-clamp-2 group-hover:underline">
          {issue.summary}
        </h3>

        {/* Bottom Row: City, Severity, Rating */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400" />
              <span className="font-medium text-gray-700">
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
            <span className="text-yellow-400">★</span>
            <span className="font-medium text-gray-700">4.97</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueItem;
