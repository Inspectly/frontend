import React, { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faPlus,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import ImageComponent from "../components/ImageComponent";
import { useGetListingByUserIdQuery, useCreateListingMutation } from "../features/api/listingsApi";
import { useGetIssuesQuery } from "../features/api/issuesApi";
import { useGetReportsByUserIdQuery } from "../features/api/reportsApi";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import AddListingOnlyModal from "../components/AddListingOnlyModal";
import { Listing } from "../types";
import { BUTTON_HOVER } from "../styles/shared";

const Listings: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: listings, error, isLoading } = useGetListingByUserIdQuery(user?.id ?? 0, { skip: !user?.id });
  const { data: allIssues } = useGetIssuesQuery();
  const [createListing] = useCreateListingMutation();
  const { data: reports } = useGetReportsByUserIdQuery(user?.id, { skip: !user?.id });

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddListingModalOpen, setIsAddListingModalOpen] = useState(false);

  // Auto-open modal if action=add is in URL
  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setIsAddListingModalOpen(true);
      searchParams.delete("action");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // User's report IDs (ensure numbers for consistent matching)
  const userReportIds = useMemo(() => {
    if (!reports) return new Set<number>();
    return new Set(reports.map((r) => Number(r.id)));
  }, [reports]);

  // Report -> listing mapping
  const reportToListing = useMemo(() => {
    if (!reports) return {} as Record<number, number>;
    const map: Record<number, number> = {};
    reports.forEach((r) => { map[r.id] = r.listing_id; });
    return map;
  }, [reports]);

  // User's issues only (match by report id, normalize number/string)
  const userIssues = useMemo(() => {
    if (!allIssues) return [];
    const reportIdSet = new Set(userReportIds);
    return allIssues.filter((issue) => reportIdSet.has(Number(issue.report_id)));
  }, [allIssues, userReportIds]);

  // Issue count per listing (merged for duplicate addresses)
  const issueCountByListing = useMemo(() => {
    const map: Record<number, number> = {};
    userIssues.forEach((issue) => {
      const listingId = reportToListing[issue.report_id] || issue.listing_id;
      if (listingId) map[listingId] = (map[listingId] || 0) + 1;
    });
    return map;
  }, [userIssues, reportToListing]);

  // User's listings (from user-specific API), deduplicated by address
  const userListings = useMemo(() => {
    const all = Array.isArray(listings) ? listings : (listings && typeof listings === "object" && Array.isArray((listings as any).listings) ? (listings as any).listings : []);
    const seen = new Map<string, Listing>();
    const mergedCounts = new Map<string, number>();

    all.forEach((listing) => {
      const key = (listing.address || "").trim().toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, listing);
        mergedCounts.set(key, issueCountByListing[listing.id] || 0);
      } else {
        mergedCounts.set(key, (mergedCounts.get(key) || 0) + (issueCountByListing[listing.id] || 0));
      }
    });

    let result = Array.from(seen.entries()).map(([key, listing]) => ({
      listing,
      issueCount: mergedCounts.get(key) || 0,
    }));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(({ listing }) =>
        listing.address?.toLowerCase().includes(q) || listing.city?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [listings, searchQuery, issueCountByListing]);

  if (isLoading && !listings) return <p>Loading...</p>;
  if (error) return <p>Error loading properties</p>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-[1600px] mx-auto px-4 py-5 lg:px-8 lg:py-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {userListings.length} propert{userListings.length !== 1 ? "ies" : "y"} · {userIssues.length} issue{userIssues.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            className={`inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-white rounded-xl font-bold text-sm shadow-sm ${BUTTON_HOVER}`}
            onClick={() => setIsAddListingModalOpen(true)}
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Property
          </button>
        </div>

        {/* Search */}
        <div className="mb-5">
          <form className="relative" onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              placeholder="Search by address or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full max-w-sm rounded-xl border border-gray-200 bg-white px-10 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
            />
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400"
            />
          </form>
        </div>

        {/* Empty state */}
        {userListings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-2xl text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No properties yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Add a property to start posting jobs and getting quotes from verified vendors.
            </p>
            <button
              onClick={() => setIsAddListingModalOpen(true)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-white rounded-xl font-bold text-sm shadow-sm ${BUTTON_HOVER}`}
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Your First Property
            </button>
          </div>
        ) : (
          /* Tile grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {userListings.map(({ listing, issueCount }) => (
              <div
                key={listing.id}
                onClick={() => navigate(`/listings/${listing.id}`)}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden relative bg-gray-100">
                  <ImageComponent
                    src={listing.image_url}
                    fallback="/images/property_card_holder.jpg"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {issueCount > 0 && (
                    <div className="absolute top-2 right-2 bg-gray-900/80 text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {issueCount}
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-gray-900 truncate leading-tight">
                    {listing.address?.split(",")[0] || listing.address}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {listing.city}, {listing.state}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Property Modal */}
        <AddListingOnlyModal
          isOpen={isAddListingModalOpen}
          onClose={() => setIsAddListingModalOpen(false)}
          onSubmit={async (formData) => {
            try {
              const created = await createListing({
                ...formData,
                user_id: user.id,
              }).unwrap();
              setIsAddListingModalOpen(false);
              if (created?.id) {
                navigate(`/listings/${created.id}`);
              }
            } catch (e) {
              console.error("Failed to create listing:", e);
            }
          }}
        />
      </div>
    </div>
  );
};

export default Listings;
