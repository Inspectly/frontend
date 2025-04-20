import React, { useMemo } from "react";
import { useGetReportByIdQuery } from "../features/api/reportsApi";
import { useGetListingByIdQuery } from "../features/api/listingsApi";
import { IssueType } from "../types";
import ImageComponent from "./ImageComponent";
import { useNavigate } from "react-router-dom";
import { useGetOffersByIssueIdQuery } from "../features/api/issueOffersApi";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";

interface IssueItemProps {
  issue: IssueType;
}

const IssueItem: React.FC<IssueItemProps> = ({ issue }) => {
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const userType = useSelector(
    (state: RootState) => state.auth.user?.user_type
  );

  const { data: vendor } = useGetVendorByVendorUserIdQuery(userId || "", {
    skip: !userId || userType !== "vendor",
  });

  const { data: offers = [], isLoading: offerLoading } =
    useGetOffersByIssueIdQuery(issue.id, {
      skip: !issue?.id,
    });

  // If client, get latest offers sorted by created_at descending
  const sortedOffers = useMemo(() => {
    return [...offers].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [offers]);

  const latestOffer = sortedOffers.length ? sortedOffers[0].price : null;
  const totalOffers = offers.length;

  // If vendor, filter to only that vendor’s offers
  const vendorOffers = offers.filter(
    (offer) => String(offer.vendor_id) === String(vendor?.id)
  );

  const sortedVendorOffers = useMemo(() => {
    return [...vendorOffers].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [vendorOffers]);

  const latestVendorOffer = sortedVendorOffers.length
    ? sortedVendorOffers[0].price
    : null;

  const { data: report, isLoading: reportLoading } = useGetReportByIdQuery(
    issue.report_id
  );

  const { data: listing, isLoading: listingLoading } = useGetListingByIdQuery(
    report?.listing_id || -1,
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
          {offerLoading ? (
            "Loading offer..."
          ) : userType === "client" ? (
            // CLIENT: show "latest overall" + "total offers"
            latestOffer !== null ? (
              <>
                Current Offer: $
                {new Intl.NumberFormat("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(latestOffer)}
                <br />
                Total Offers: {totalOffers}
              </>
            ) : (
              "No offers yet"
            )
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
