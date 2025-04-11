import React from "react";
import { useGetReportByIdQuery } from "../features/api/reportsApi";
import { useGetListingByIdQuery } from "../features/api/listingsApi";
import { IssueType } from "../types";
import ImageComponent from "./ImageComponent";
import { useNavigate } from "react-router-dom";
import { useGetOffersByIssueIdQuery } from "../features/api/issueOffersApi";

interface IssueItemProps {
  issue: IssueType;
}

const IssueItem: React.FC<IssueItemProps> = ({ issue }) => {
  const { data: offers, isLoading: offerLoading } = useGetOffersByIssueIdQuery(
    issue.id,
    {
      skip: !issue?.id,
    }
  );

  const highestOffer = offers?.length
    ? [...offers].sort((a, b) => b.price - a.price)[0].price
    : null;

  const { data: report, isLoading: reportLoading } = useGetReportByIdQuery(
    issue.report_id.toString()
  );

  const { data: listing, isLoading: listingLoading } = useGetListingByIdQuery(
    report?.listing_id.toString() || "",
    {
      skip: !report, // Only fetch listing if report is available
    }
  );

  const navigate = useNavigate();

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
          Current Offer:{" "}
          {offerLoading
            ? "Loading offer..."
            : highestOffer
            ? `$${highestOffer}`
            : "No offers yet"}
        </p>

        {/* Summary */}
        <p className="text-gray-800 text-sm line-clamp-2 group-hover:underline">
          {issue.summary}
        </p>

        {/* Location */}
        <p className="text-gray-600 text-xs group-hover:underline">
          {reportLoading || listingLoading
            ? "Loading..."
            : `${listing?.address || "Unknown"},
            ${listing?.postal_code || "Unknown"}`}
        </p>
      </div>
    </div>
  );
};

export default IssueItem;
