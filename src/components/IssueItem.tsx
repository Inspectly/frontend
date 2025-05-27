import React, { useMemo } from "react";
import { IssueAddress, IssueType, Vendor } from "../types";
import ImageComponent from "./ImageComponent";
import { useNavigate } from "react-router-dom";
import {
  useGetOffersByIssueIdQuery,
  useGetOffersByVendorIdQuery,
} from "../features/api/issueOffersApi";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

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

  return (
    <div
      onClick={() => navigate(`/marketplace/${issue.id}`)}
      className="group cursor-pointer border border-gray-300 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all bg-white max-w-[381px] min-w-[242px]"
    >
      {/* Image Section */}
      <div className="relative h-[240px] w-full">
        <ImageComponent
          src={issue.image_url}
          fallback="/images/property_card_holder.jpg"
          className="w-full h-full object-cover transition-transform duration-300"
        />
      </div>

      {/* Details Section */}
      <div className="p-3">
        {/* Issue Type */}
        <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
          {issue.type}
        </span>

        {/* Cost */}
        <p className="text-lg font-semibold text-gray-900 mt-2 group-hover:underline">
          {offerLoading ? (
            "Loading offer..."
          ) : userType === "vendor" ? (
            // VENDOR: show only their own latest offer
            latestVendorOffer !== null ? (
              <>
                Your Offer: $
                {new Intl.NumberFormat("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(latestVendorOffer)}
              </>
            ) : (
              "No offers from you yet"
            )
          ) : (
            // For other user types (e.g. not logged in) you can decide
            "No offers to display"
          )}
        </p>

        {/* Summary */}
        <p className="text-gray-800 text-sm line-clamp-2 group-hover:underline">
          {issue.summary}
        </p>

        {/* Location */}
        <p className="text-gray-600 text-xs group-hover:underline">
          {address
            ? `${address.address}, ${address.postal_code}`
            : "Loading address..."}
        </p>
      </div>
    </div>
  );
};

export default IssueItem;
