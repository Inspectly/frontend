import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faMagnifyingGlass,
  faAngleDoubleLeft,
  faAngleDoubleRight,
} from "@fortawesome/free-solid-svg-icons";
import { MapPin } from "lucide-react";
import { BUTTON_HOVER } from "../styles/shared";
import {
  issuesApi,
  useGetAddressesByIssueIdsMutation,
  useGetPaginatedIssuesQuery,
} from "../features/api/issuesApi";
import { useGetListingsQuery } from "../features/api/listingsApi";
import { useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";
import IssueItem from "../components/IssueItem";
import AddressGroupCard from "../components/AddressGroupCard";
import IssueDetails from "../components/IssueDetails";
import { IssueAddress, IssueType } from "../types";
import { AppDispatch, RootState } from "../store/store";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";

const Marketplace: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector((state: RootState) => state.auth.user);
  const isVendor = user?.user_type === "vendor";
  const { data: vendor } = useGetVendorByVendorUserIdQuery(String(user?.id), {
    skip: !user?.id || !isVendor,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const normalizeTypeParam = (type: string | null): string => {
    if (!type) return "";
    const normalized = type.toLowerCase();
    const typeMapping: Record<string, string> = {
      general: "other",
      electrician: "electrical",
      plumber: "plumbing",
      painter: "painting",
      roofer: "roofing",
      carpenter: "carpentry",
      landscaper: "landscaping",
    };
    return typeMapping[normalized] || normalized;
  };

  const [selectedType, setSelectedType] = useState(() => normalizeTypeParam(searchParams.get("type")));
  const [selectedCity, setSelectedCity] = useState(() => searchParams.get("city") || "");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [groupByAddress, setGroupByAddress] = useState(() => searchParams.get("grouped") === "true");

  const [selectedIssue, setSelectedIssue] = useState<IssueType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultTab, setModalDefaultTab] = useState<"details" | "offers">("details");

  const itemsPerPage = 12;
  const maxFetchLimit = 100;

  // Listings — needed for city/state dropdowns and for deriving state from city
  const { data: allListings, isLoading: isLoadingListings } = useGetListingsQuery();

  // Auto-apply vendor specialty + city on first load (only if no URL params already set)
  const vendorTypeToIssueType: Record<string, string> = {
    electrician: "electrical", plumber: "plumbing", painter: "painting",
    roofer: "roofing", carpenter: "carpentry", landscaper: "landscaping",
    hvac: "hvac", general: "other",
  };
  const vendorSpecialtyAsIssueType = useMemo(() => {
    if (!vendor?.vendor_types) return null;
    const primary = vendor.vendor_types.toLowerCase().split(",")[0]?.trim();
    return vendorTypeToIssueType[primary] || primary || null;
  }, [vendor?.vendor_types]);

  const [hasAutoApplied, setHasAutoApplied] = useState(false);
  useEffect(() => {
    if (hasAutoApplied || !isVendor || !vendor) return;
    if (!searchParams.get("type") && !searchParams.get("city")) {
      const newParams = new URLSearchParams(searchParams);
      if (vendorSpecialtyAsIssueType) {
        setSelectedType(vendorSpecialtyAsIssueType);
        newParams.set("type", vendorSpecialtyAsIssueType);
      }
      if (vendor.city) {
        setSelectedCity(vendor.city);
        newParams.set("city", vendor.city);
      }
      setSearchParams(newParams, { replace: true });
    }
    setHasAutoApplied(true);
  }, [isVendor, vendor, vendorSpecialtyAsIssueType, searchParams, hasAutoApplied]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep URL in sync with groupByAddress toggle
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (groupByAddress) newParams.set("grouped", "true");
    else newParams.delete("grouped");
    setSearchParams(newParams, { replace: true });
  }, [groupByAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  // When a type is selected or in grouped view, fetch the full page (100 items) so
  // the server filters efficiently. Otherwise, use server-side pagination (12 items).
  const needsFullFetch = !!selectedType || groupByAddress;

  // The dropdown shows normalized display values ("electrical") but the backend stores
  // vendor occupation names ("electrician"). Map back before sending to the API.
  const issueTypeToBackendType: Record<string, string> = {
    electrical: "electrician",
    plumbing: "plumber",
    painting: "painter",
    roofing: "roofer",
    carpentry: "carpenter",
    landscaping: "landscaper",
    hvac: "hvac",
    other: "general",
  };
  const backendType = issueTypeToBackendType[selectedType] ?? selectedType;

  const apiParams = useMemo(() => ({
    page: needsFullFetch ? 1 : currentPage,
    size: needsFullFetch ? maxFetchLimit : itemsPerPage,
    search: searchTerm.trim(),
    type: backendType,
    city: selectedCity,
    state: selectedProvince,
    vendor_assigned: false as const,
  }), [needsFullFetch, currentPage, searchTerm, backendType, selectedCity, selectedProvince]);

  const { data: primaryData, isLoading, error } = useGetPaginatedIssuesQuery(apiParams);

  // Fallback: if type+city returns 0, retry with city removed.
  const needsFallback = !isLoading && (primaryData?.total ?? 0) === 0 && !!selectedType && !!selectedCity;
  const fallbackParams = useMemo(
    () => needsFallback ? { ...apiParams, city: "", state: "" } : skipToken,
    [needsFallback, apiParams]
  );
  const { data: fallbackData } = useGetPaginatedIssuesQuery(fallbackParams as any);

  const activeData = (needsFallback && (fallbackData?.total ?? 0) > 0) ? fallbackData : primaryData;
  const currentFilterMode = needsFallback && (fallbackData?.total ?? 0) > 0 ? "type_only" : "exact";

  // Background-prefetch remaining pages so pagination feels instant
  useEffect(() => {
    if (!activeData || activeData.pages <= 1) return;
    const pagesToPrefetch = Math.min(activeData.pages - 1, 5);
    for (let p = 2; p <= pagesToPrefetch + 1; p++) {
      dispatch(issuesApi.endpoints.getPaginatedIssues.initiate({ ...apiParams, page: p }));
    }
  }, [activeData?.pages, activeData?.total]); // eslint-disable-line react-hooks/exhaustive-deps

  // Addresses — scoped to currently visible issues only (12 in ungrouped, up to 100 in grouped)
  const [getAddressesByIssueIds] = useGetAddressesByIssueIdsMutation();
  const [addresses, setAddresses] = useState<IssueAddress[]>([]);

  // Filter to open + unassigned (backend handles vendor_assigned; status guard is extra safety)
  const rawIssues = useMemo(() => (activeData?.items ?? []).filter((issue: IssueType) => {
    const status = (issue.status || "").toLowerCase().replace("status.", "");
    return status === "open" && !issue.vendor_id;
  }), [activeData?.items]);

  // Paginate client-side when we fetched the full set (type selected or grouped view),
  // otherwise the server already returned the correct page.
  const issues = useMemo(() => {
    if (groupByAddress) return rawIssues;
    if (needsFullFetch) {
      const start = (currentPage - 1) * itemsPerPage;
      return rawIssues.slice(start, start + itemsPerPage);
    }
    return rawIssues;
  }, [rawIssues, groupByAddress, needsFullFetch, currentPage, itemsPerPage]);

  const totalItems = needsFullFetch ? rawIssues.length : (activeData?.total ?? 0);

  // Fetch addresses for the currently displayed set of issues
  const issueIdsKey = issues.map((i) => i.id).join(",");
  useEffect(() => {
    if (issues.length === 0) return;
    getAddressesByIssueIds(issues.map((i) => i.id))
      .unwrap()
      .then((fetched) => setAddresses((prev) => {
        // Merge: keep addresses for issues not in current set (grouped view may need them all)
        const newMap = new Map(fetched.map((a) => [a.issue_id, a]));
        const kept = prev.filter((a) => !newMap.has(a.issue_id));
        return [...kept, ...fetched];
      }))
      .catch(() => {});
  }, [issueIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const addressMap = useMemo(() => addresses.reduce((acc, addr) => {
    acc[addr.issue_id] = addr;
    return acc;
  }, {} as Record<number, IssueAddress>), [addresses]);


  // Extract unique cities and states from ALL listings (shows all available locations)
  const uniqueCities: string[] = useMemo(() => {
    if (!allListings) return [];
    return [...new Set(allListings.map((listing) => listing.city).filter(Boolean))].sort() as string[];
  }, [allListings]);

  const uniqueStates: string[] = useMemo(() => {
    if (!allListings) return [];
    return [...new Set(allListings.map((listing) => listing.state).filter(Boolean))].sort() as string[];
  }, [allListings]);

  // Filter cities based on selected state (for cascading dropdown)
  const filteredCities: string[] = useMemo(() => {
    if (!selectedProvince || !allListings) {
      return uniqueCities; // Show all cities if no state selected
    }
    
    // Filter cities by selected state - use listings data
    const citiesInState = allListings
      .filter((listing) => listing.state === selectedProvince)
      .map((listing) => listing.city)
      .filter(Boolean);
    
    return [...new Set(citiesInState)].sort() as string[];
  }, [uniqueCities, allListings, selectedProvince]);


  // Group issues by address
  const groupedIssues: { address: IssueAddress; issues: IssueType[] }[] = useMemo(() => {
    if (!groupByAddress || addresses.length === 0) return [];
    const groups = rawIssues.reduce((acc: Record<string, { address: IssueAddress; issues: IssueType[] }>, issue: IssueType) => {
      const address = addressMap[issue.id];
      if (!address) return acc;
      const key = `${address.address}_${address.city}_${address.state}`;
      if (!acc[key]) acc[key] = { address, issues: [] };
      acc[key].issues.push(issue);
      return acc;
    }, {});
    return Object.values(groups);
  }, [rawIssues, addressMap, groupByAddress, addresses.length]);

  // Pagination: client-side when type filter active or grouped; server otherwise
  const totalPages = groupByAddress
    ? Math.ceil(groupedIssues.length / itemsPerPage)
    : Math.ceil(totalItems / itemsPerPage) || 1;

  const paginatedGroups: { address: IssueAddress; issues: IssueType[] }[] = useMemo(() => {
    if (!groupByAddress) return groupedIssues;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return groupedIssues.slice(startIndex, startIndex + itemsPerPage);
  }, [groupedIssues, groupByAddress, currentPage, itemsPerPage]);

  // Smart pagination: show ellipsis for large page counts
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("");
    setSelectedCity("");
    setSelectedProvince("");
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-600">
        Error loading marketplace data. Please try again.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="container mx-auto px-4">

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-gray-900">Marketplace</h1>
          <p className="text-sm text-gray-500 mt-1">Find the perfect jobs for your expertise</p>
        </div>

        {/* Search and Filter Section */}
          <div className="bg-card rounded-xl shadow-card border border-border mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-gold-50 to-amber-50 px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground mb-1">Search & Filter</h2>
            <p className="text-sm text-muted-foreground">Find the perfect jobs for your expertise</p>
      </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Search</label>
            <div className="relative">
              <input
                type="text"
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-colors bg-muted text-foreground focus:bg-card"
              />
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                    className="absolute left-3 top-3.5 text-muted-foreground"
              />
                </div>
            </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                <select
                  value={selectedType}
                onChange={(e) => {
                    const newType = e.target.value;
                    setSelectedType(newType);
                    setCurrentPage(1);
                    const newParams = new URLSearchParams(searchParams);
                    if (newType) {
                      newParams.set('type', newType);
                    } else {
                      newParams.delete('type');
                    }
                    setSearchParams(newParams, { replace: true });
                  }}
                  className="w-full px-3 py-3 border border-border rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-colors bg-muted text-foreground focus:bg-card"
                >
                  <option value="">All Types</option>
                  <option value="electrical">Electrical</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="hvac">HVAC</option>
                  <option value="roofing">Roofing</option>
                  <option value="flooring">Flooring</option>
                  <option value="painting">Painting</option>
                  <option value="landscaping">Landscaping</option>
                  <option value="structural">Structural</option>
                  <option value="dry wall">Dry Wall</option>
                  <option value="carpentry">Carpentry</option>
                  <option value="other">Other</option>
                </select>
          </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">State</label>
            <select
                  value={selectedProvince}
              onChange={(e) => {
                const newState = e.target.value;
                setSelectedProvince(newState);

                // Clear city if it's not available in the new state
                if (selectedCity && newState && allListings) {
                  const citiesInNewState = allListings
                    .filter((listing) => listing.state === newState)
                    .map((listing) => listing.city)
                    .filter(Boolean);

                  const uniqueCitiesInState = [...new Set(citiesInNewState)];

                  if (!uniqueCitiesInState.includes(selectedCity)) {
                    setSelectedCity("");
                  }
                }

                setCurrentPage(1);
              }}
              disabled={isLoadingListings}
                  className="w-full px-3 py-3 border border-border rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-colors bg-muted text-foreground focus:bg-card disabled:opacity-50"
            >
                  <option value="">{isLoadingListings ? "Loading states..." : "All States"}</option>
                  {uniqueStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">City</label>
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setCurrentPage(1);
              }}
              disabled={isLoadingListings}
                  className="w-full px-3 py-3 border border-border rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-colors bg-muted text-foreground focus:bg-card disabled:opacity-50"
            >
              <option value="">{isLoadingListings ? "Loading cities..." : "All Cities"}</option>
                  {filteredCities.map((city: string) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            </div>

              <div className="flex flex-col justify-end">
                <div className="flex gap-2">
                  <button
                    onClick={handleSearch}
                    className={`flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg font-medium shadow-sm hover:shadow-md hover:bg-gold transition-all duration-200`}
                  >
                    Search
                  </button>
                  <button
                    onClick={clearFilters}
                    className={`px-4 py-3 bg-muted text-foreground rounded-lg font-medium border border-border ${BUTTON_HOVER}`}
                  >
                    Clear
            </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={groupByAddress}
              onChange={(e) => {
                  setGroupByAddress(e.target.checked);
                setCurrentPage(1);
              }}
                  className="w-4 h-4 rounded border-border text-gold focus:ring-gold focus:ring-2"
              />
                <span className="text-sm font-medium text-gray-700 group-hover:text-gold transition-colors">
                  📍 Group by address
                </span>
            </label>

            </div>
          </div>
          </div>

        {/* Fallback banner: no issues found in selected city, showing results from other areas */}
        {currentFilterMode === "type_only" && selectedCity && (
          <div className="mb-6 px-4 py-3 rounded-lg flex items-start gap-3 bg-gold-50 text-foreground border border-gold-200">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gold" />
            <div>
              <p className="font-medium">
                No {selectedType ? `${normalizeAndCapitalize(selectedType)} ` : ""}jobs found in {selectedCity}
              </p>
              <p className="text-sm mt-1 text-muted-foreground">
                Showing opportunities from other areas.
              </p>
            </div>
          </div>
        )}

        {/* Results Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-foreground">
              {groupByAddress ? "Grouped Issues" : "All Issues"}
            </h2>
            <span className="text-muted-foreground">
              {groupByAddress
                ? `${groupedIssues.length} address groups found`
                : `${totalItems} issues found`}
            </span>
        </div>
      </div>

        {/* Issues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {groupByAddress
            ? paginatedGroups.map((group, index) => (
                  <AddressGroupCard
                  key={`${group.address.address}_${index}`}
                    address={group.address}
                    issues={group.issues}
                  />
              ))
            : issues.map((issue: IssueType) => (
                  <IssueItem
                    key={issue.id}
                    issue={issue}
                    address={addressMap[issue.id]}
                    onClick={(clickedIssue) => {
                      setSelectedIssue(clickedIssue);
                      setModalDefaultTab("details");
                      setIsModalOpen(true);
                    }}
                    onPlaceBid={(clickedIssue) => {
                      setSelectedIssue(clickedIssue);
                      setModalDefaultTab("offers");
                      setIsModalOpen(true);
                    }}
                  />
                ))}
              </div>

        {/* Pagination - show for both grouped and ungrouped views when there are multiple pages */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
              <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 5))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg bg-card border border-border text-foreground hover:bg-gold hover:text-white hover:border-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:text-foreground disabled:hover:border-border"
            >
              <FontAwesomeIcon icon={faAngleDoubleLeft} />
              </button>

              <button
              onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg bg-card border border-border text-foreground hover:bg-gold hover:text-white hover:border-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:text-foreground disabled:hover:border-border"
              >
              <FontAwesomeIcon icon={faArrowLeft} />
              </button>

            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === "number" && handlePageChange(page)}
                disabled={page === "..."}
                className={`px-3 py-2 rounded-lg border transition-colors ${
                  page === currentPage
                    ? "bg-foreground text-background border-foreground"
                    : page === "..."
                    ? "bg-card border-border text-muted-foreground cursor-default"
                    : "bg-card border-border text-foreground hover:bg-gold hover:text-white hover:border-gold"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg bg-card border border-border text-foreground hover:bg-gold hover:text-white hover:border-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:text-foreground disabled:hover:border-border"
            >
              <FontAwesomeIcon icon={faArrowRight} />
              </button>

              <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 5))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg bg-card border border-border text-foreground hover:bg-gold hover:text-white hover:border-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:text-foreground disabled:hover:border-border"
            >
              <FontAwesomeIcon icon={faAngleDoubleRight} />
              </button>
          </div>
        )}
      </div>

      {/* Issue Details Modal */}
      {isModalOpen && selectedIssue && (
        <div
          className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-start justify-center pt-10 pb-10"
          onClick={() => {
            setIsModalOpen(false);
            setSelectedIssue(null);
          }}
        >
          <div
            className="bg-card rounded-xl shadow-card-hover w-full max-w-4xl max-h-[90vh] overflow-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setIsModalOpen(false);
                setSelectedIssue(null);
              }}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
            
            <div className="p-6">
              <IssueDetails
                issue={selectedIssue}
                defaultTab={modalDefaultTab}
                onNotInterested={() => {
                  setIsModalOpen(false);
                  setSelectedIssue(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;