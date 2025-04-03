import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

import { useGetReportByIdQuery } from "../features/api/reportsApi";
import { useGetListingByIdQuery } from "../features/api/listingsApi";
import { useGetBidsByIssueIdQuery } from "../features/api/issueBidsApi";
import { useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";

import ImageComponent from "./ImageComponent";
import { IssueType } from "../types";

interface IssueItemProps {
  issue: IssueType;
}

const IssueItem: React.FC<IssueItemProps> = ({ issue }) => {
  // 1) Get user info from Redux
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const userType = useSelector((state: RootState) => state.auth.user?.user_type);

  // 2) If user is a vendor, fetch their vendor record
  const { data: vendor } = useGetVendorByVendorUserIdQuery(userId || "", {
    skip: !userId || userType !== "vendor",
  });

  // 3) Fetch all bids for this issue
  const {
    data: bids = [],
    isLoading: bidLoading,
  } = useGetBidsByIssueIdQuery(issue.id, {
    skip: !issue?.id,
  });

  // 4) If user is a client, we want the *latest* among all bids
  //    Sort by created_at descending
  const sortedBids = [...bids].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const latestBidOverall = sortedBids.length ? sortedBids[0].price : null;
  const totalBids = bids.length;

  // 5) If user is a vendor, filter to only that vendor’s bids
  const vendorBids = bids.filter(
    (bid) => String(bid.vendor_id) === String(vendor?.id)
  );
  vendorBids.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const myLatestVendorBid = vendorBids.length ? vendorBids[0].price : null;

  // 6) Fetch optional data about the listing/report
  const { data: report, isLoading: reportLoading } = useGetReportByIdQuery(
    issue.report_id.toString()
  );
  const { data: listing, isLoading: listingLoading } = useGetListingByIdQuery(
    report?.listing_id?.toString() || "",
    {
      skip: !report,
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
        <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
          {issue.type}
        </span>

        {/* Bid Info */}
        <p className="text-lg font-semibold text-gray-900 mt-2 group-hover:underline">
          {bidLoading ? (
            "Loading bid..."
          ) : userType === "client" ? (
            // CLIENT: show "latest overall" + "total bids"
            latestBidOverall !== null ? (
              <>
                Current Bid: $
                {new Intl.NumberFormat("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(latestBidOverall)}
                <br />
                Total Bids: {totalBids}
              </>
            ) : (
              "No bids yet"
            )
          ) : userType === "vendor" ? (
            // VENDOR: show only their own latest bid
            myLatestVendorBid !== null ? (
              <>
                Your Bid: $
                {new Intl.NumberFormat("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(myLatestVendorBid)}
              </>
            ) : (
              "No bids from you yet"
            )
          ) : (
            // For other user types (e.g. not logged in) you can decide
            "No bids to display"
          )}
        </p>

        {/* Summary */}
        <p className="text-gray-800 text-sm line-clamp-2 group-hover:underline">
          {issue.summary}
        </p>

        {/* Location */}
        <p className="text-gray-600 text-xs group-hover:underline">
          {reportLoading || listingLoading
            ? "Loading..."
            : `${listing?.address || "Unknown"}, ${listing?.postal_code || "Unknown"}`}
        </p>
      </div>
    </div>
  );
};

export default IssueItem;

