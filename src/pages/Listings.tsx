import React, { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faMagnifyingGlass,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import {
  LayoutGrid,
  AlignJustify,
  MapPin,
  TriangleAlert,
  CircleCheck,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import ImageComponent from "../components/ImageComponent";
import {
  useGetListingByUserIdQuery,
  useCreateListingMutation,
} from "../features/api/listingsApi";
import { useGetIssuesQuery } from "../features/api/issuesApi";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import AddListingOnlyModal from "../components/AddListingOnlyModal";
import { Listing } from "../types";

type ViewMode = "grid" | "list";

interface IssueCounts {
  total: number;
  open: number;
  resolved: number;
}

function relativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    // Treat anything under 2 minutes as "Just added"
    if (diffMs < 1000 * 60 * 2) return "Just added";
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "—";
  }
}

// ─── Property Card (grid view) ───────────────────────────────────────────────

interface PropertyCardProps {
  listing: Listing;
  issueCounts?: IssueCounts;
  onClick: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  listing,
  issueCounts,
  onClick,
}) => {
  const total = issueCounts?.total ?? 0;
  const open = issueCounts?.open ?? 0;
  const resolved = issueCounts?.resolved ?? 0;
  const cityState = [listing.city, listing.state].filter(Boolean).join(", ");

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl bg-card overflow-hidden shadow-soft hover-lift"
    >
      {/* Image area */}
      <div className="relative h-[var(--property-card-image-h)] overflow-hidden bg-muted">
        <ImageComponent
          src={listing.image_url}
          fallback="/images/property_card_holder.jpg"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {open > 0 && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-issue-open text-issue-open-foreground text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
            <TriangleAlert size={11} />
            {open} open
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground text-sm leading-snug mb-1 truncate">
          {listing.address}
        </h3>

        {cityState && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
            <MapPin size={11} />
            {cityState}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <TriangleAlert size={11} />
            {total} {total === 1 ? "issue" : "issues"}
          </span>
          <span
            className={`flex items-center gap-1 ${resolved > 0 ? "text-issue-resolved font-medium" : ""}`}
          >
            <CircleCheck size={11} />
            {resolved}
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Clock size={11} />
            {relativeTime(listing.updated_at)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Property Row (list view) ─────────────────────────────────────────────────

const PropertyListRow: React.FC<PropertyCardProps> = ({
  listing,
  issueCounts,
  onClick,
}) => {
  const total = issueCounts?.total ?? 0;
  const open = issueCounts?.open ?? 0;
  const resolved = issueCounts?.resolved ?? 0;
  const cityState = [listing.city, listing.state].filter(Boolean).join(", ");

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer flex items-center gap-4 rounded-xl bg-card p-3 shadow-soft hover-lift"
    >
      {/* Thumbnail */}
      <div className="relative w-20 h-[3.75rem] rounded-lg overflow-hidden bg-muted shrink-0">
        <ImageComponent
          src={listing.image_url}
          fallback="/images/property_card_holder.jpg"
          className="w-full h-full object-cover"
        />
        {open > 0 && (
          <div className="absolute top-1 right-1 bg-issue-open text-issue-open-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
            {open}
          </div>
        )}
      </div>

      {/* Address + city */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground text-sm truncate">
          {listing.address}
        </h3>
        {cityState && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin size={11} />
            {cityState}
          </p>
        )}
      </div>

      {/* Meta */}
      <div className="hidden sm:flex items-center gap-5 text-xs text-muted-foreground shrink-0">
        <span className="flex items-center gap-1">
          <TriangleAlert size={11} />
          {total} {total === 1 ? "issue" : "issues"}
        </span>
        <span
          className={`flex items-center gap-1 ${resolved > 0 ? "text-issue-resolved font-medium" : ""}`}
        >
          <CircleCheck size={11} />
          {resolved} resolved
        </span>
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {relativeTime(listing.updated_at)}
        </span>
      </div>
    </div>
  );
};

// ─── Skeleton loader ──────────────────────────────────────────────────────────

const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-2xl border border-border overflow-hidden">
        <div className="shimmer h-[var(--property-card-image-h)] w-full" />
        <div className="p-4 space-y-2">
          <div className="shimmer h-4 w-3/4 rounded" />
          <div className="shimmer h-3 w-1/2 rounded" />
          <div className="shimmer h-3 w-full rounded mt-3" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const Listings: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  const { data: listings, error, isLoading } = useGetListingByUserIdQuery(
    user?.id ?? 0,
    { skip: !user?.id }
  );
  const { data: allIssues = [] } = useGetIssuesQuery();
  const [createListing] = useCreateListingMutation();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [isAddListingModalOpen, setIsAddListingModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Auto-open modal if action=add is in URL
  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setIsAddListingModalOpen(true);
      searchParams.delete("action");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Filter listings by user and search query
  const filteredListings = useMemo(
    () =>
      listings?.filter((listing) => {
        if (listing?.user_id !== user?.id) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          listing?.address?.toLowerCase().includes(q) ||
          listing?.city?.toLowerCase().includes(q)
        );
      }) ?? [],
    [listings, user?.id, searchQuery]
  );

  // Build per-listing issue counts from flat issues list
  const issueCountsByListing = useMemo(() => {
    const map: Record<number, IssueCounts> = {};
    for (const issue of allIssues) {
      if (!map[issue.listing_id]) {
        map[issue.listing_id] = { total: 0, open: 0, resolved: 0 };
      }
      map[issue.listing_id].total++;
      if (issue.status === "Status.OPEN") map[issue.listing_id].open++;
      if (issue.status === "Status.COMPLETED") map[issue.listing_id].resolved++;
    }
    return map;
  }, [allIssues]);

  // Total issues across user's listings (for subtitle)
  const totalIssues = useMemo(
    () =>
      filteredListings.reduce(
        (sum, l) => sum + (issueCountsByListing[l.id]?.total ?? 0),
        0
      ),
    [filteredListings, issueCountsByListing]
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredListings.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentListings = filteredListings.slice(startIndex, endIndex);

  // Responsive items-per-page
  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      let cols = 1;
      if (width >= 640) cols = 2;
      if (width >= 768) cols = 3;
      if (width >= 1536) cols = 4;
      setItemsPerPage(cols * 3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const handlePrevious = () => currentPage > 1 && setCurrentPage((p) => p - 1);
  const handleNext = () =>
    currentPage < totalPages && setCurrentPage((p) => p + 1);
  const handlePageClick = (page: number) => setCurrentPage(page);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Error loading properties. Please try again.
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-0.5">
            My Properties
          </h1>
          <p className="text-sm text-muted-foreground">
            {filteredListings.length}{" "}
            {filteredListings.length === 1 ? "property" : "properties"}
            {totalIssues > 0 && (
              <>
                {" "}
                · {totalIssues} {totalIssues === 1 ? "issue" : "issues"}
              </>
            )}
          </p>
        </div>

        <button
          className="btn-gold flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0"
          onClick={() => setIsAddListingModalOpen(true)}
        >
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
          Add Property
        </button>
      </div>

      {/* ── Search + view toggle ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by address or city..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
          />
        </div>

        {/* Grid / List toggle */}
        <div className="flex items-center border border-border rounded-xl overflow-hidden">
          <button
            className={`h-10 w-10 flex items-center justify-center transition-colors ${
              viewMode === "grid"
                ? "bg-gold-light text-gold"
                : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            onClick={() => setViewMode("grid")}
            title="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            className={`h-10 w-10 flex items-center justify-center border-l border-border transition-colors ${
              viewMode === "list"
                ? "bg-gold-light text-gold"
                : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            onClick={() => setViewMode("list")}
            title="List view"
          >
            <AlignJustify size={16} />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading && !listings ? (
        <CardSkeleton count={itemsPerPage} />
      ) : currentListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <MapPin size={28} className="text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">
            {searchQuery ? "No properties found" : "No properties yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery
              ? "Try a different address or city."
              : "Add your first property to get started."}
          </p>
          {!searchQuery && (
            <button
              className="btn-gold flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              onClick={() => setIsAddListingModalOpen(true)}
            >
              <FontAwesomeIcon icon={faPlus} className="text-xs" />
              Add Property
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-5">
          {currentListings.map((listing) => (
            <PropertyCard
              key={listing.id}
              listing={listing}
              issueCounts={issueCountsByListing[listing.id]}
              onClick={() => navigate(`/listings/${listing.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {currentListings.map((listing) => (
            <PropertyListRow
              key={listing.id}
              listing={listing}
              issueCounts={issueCountsByListing[listing.id]}
              onClick={() => navigate(`/listings/${listing.id}`)}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-2 mt-8">
          <span className="text-sm text-muted-foreground">
            Showing {filteredListings.length === 0 ? 0 : startIndex + 1}–
            {Math.min(endIndex, filteredListings.length)} of{" "}
            {filteredListings.length}
          </span>
          <ul className="flex flex-wrap items-center gap-1.5">
            <li>
              <button
                className={`flex items-center justify-center h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 1
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-muted hover:bg-muted-foreground/20 text-foreground"
                }`}
                onClick={handlePrevious}
                disabled={currentPage === 1}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <li key={page}>
                <button
                  className={`flex items-center justify-center h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted-foreground/20 text-foreground"
                  }`}
                  onClick={() => handlePageClick(page)}
                >
                  {page}
                </button>
              </li>
            ))}
            <li>
              <button
                className={`flex items-center justify-center h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === totalPages
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-muted hover:bg-muted-foreground/20 text-foreground"
                }`}
                onClick={handleNext}
                disabled={currentPage === totalPages}
              >
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* ── Add listing modal ── */}
      <AddListingOnlyModal
        isOpen={isAddListingModalOpen}
        onClose={() => setIsAddListingModalOpen(false)}
        onSubmit={async (formData) => {
          try {
            const created = await createListing({
              ...formData,
              user_id: user.id,
            }).unwrap();

            const newListingId: number = created?.id ?? null;
            if (!newListingId) {
              console.error(
                "Could not resolve new listing id from response:",
                created
              );
              return;
            }

            setIsAddListingModalOpen(false);
            navigate(`/listings/${newListingId}`, {
              state: { openCreateCollection: true },
              replace: false,
            });
            window.scrollTo(0, 0);
          } catch (e) {
            console.error("Failed to create listing:", e);
          }
        }}
      />
    </div>
  );
};

export default Listings;
