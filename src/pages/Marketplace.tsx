import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faAngleDoubleLeft,
  faAngleDoubleRight,
} from "@fortawesome/free-solid-svg-icons";
import { MapPin, Wrench, LayoutGrid, List as ListIcon, Clock } from "lucide-react";
import { BUTTON_HOVER } from "../styles/shared";
import HeroBand from "../components/dashboard/HeroBand";
import PropertyThumbnail from "../components/dashboard/PropertyThumbnail";
import { getRelativeTime } from "../utils/dateUtils";
import {
  useGetAddressesByIssueIdsMutation,
  useGetPaginatedIssuesQuery,
} from "../features/api/issuesApi";
import { useGetListingsQuery } from "../features/api/listingsApi";
import { useGetClientsQuery } from "../features/api/clientsApi";
import { useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";
import { useGetOffersByVendorIdQuery } from "../features/api/issueOffersApi";
import { useGetAssessmentsByUserIdQuery } from "../features/api/issueAssessmentsApi";
import IssueItem from "../components/IssueItem";
import AddressGroupCard from "../components/AddressGroupCard";
import MarketplaceIssueCard from "../components/MarketplaceIssueCard";
import MarketplaceSearchAutocomplete from "../components/MarketplaceSearchAutocomplete";
import BidStatusButton from "../components/BidStatusButton";
import { getBidStage, isCtaStage } from "../utils/bidStatus";
import {
  Client,
  IssueAddress,
  IssueAssessment,
  IssueAssessmentStatus,
  IssueOffer,
  IssueOfferStatus,
  IssueType,
  Listing,
} from "../types";
import { RootState } from "../store/store";
import { marketplacePrefetchService } from "../services/marketplacePrefetchService";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";

const Marketplace: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get current user and vendor data
  const user = useSelector((state: RootState) => state.auth.user);
  const isVendor = user?.user_type === "vendor";
  const { data: vendor } = useGetVendorByVendorUserIdQuery(String(user?.id), {
    skip: !user?.id || !isVendor,
  });

  // The current vendor's own offers, so each card can surface an existing bid.
  // (Backend stores the vendor's user id in issue_offers.vendor_id.)
  const { data: vendorOffers = [] } = useGetOffersByVendorIdQuery(
    Number(user?.id),
    { skip: !user?.id || !isVendor }
  );
  const offerByIssueId = useMemo(() => {
    const map: Record<number, IssueOffer> = {};
    for (const o of vendorOffers) {
      if (o.status === IssueOfferStatus.REJECTED) continue;
      const cur = map[o.issue_id];
      if (!cur) {
        map[o.issue_id] = o;
      } else if (o.status === IssueOfferStatus.ACCEPTED) {
        map[o.issue_id] = o;
      } else if (
        cur.status !== IssueOfferStatus.ACCEPTED &&
        new Date(o.created_at).getTime() > new Date(cur.created_at).getTime()
      ) {
        map[o.issue_id] = o;
      }
    }
    return map;
  }, [vendorOffers]);

  // The current vendor's assessment requests, so each card/modal can surface
  // the "awaiting confirmation" / "confirmed" stage instantly.
  const { data: vendorAssessments = [] } = useGetAssessmentsByUserIdQuery(
    Number(user?.id),
    { skip: !user?.id || !isVendor }
  );
  const assessmentByIssueId = useMemo(() => {
    const map: Record<number, IssueAssessment> = {};
    for (const a of vendorAssessments) {
      if (a.status === IssueAssessmentStatus.REJECTED) continue;
      const cur = map[a.issue_id];
      if (!cur) {
        map[a.issue_id] = a;
      } else if (a.status === IssueAssessmentStatus.ACCEPTED) {
        map[a.issue_id] = a;
      } else if (
        cur.status !== IssueAssessmentStatus.ACCEPTED &&
        new Date(a.created_at).getTime() > new Date(cur.created_at).getTime()
      ) {
        map[a.issue_id] = a;
      }
    }
    return map;
  }, [vendorAssessments]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Normalize URL type param to match dropdown values
  const normalizeTypeParam = (type: string | null): string => {
    if (!type) return "";
    const normalized = type.toLowerCase();
    // Map vendor types to issue types
    const typeMapping: Record<string, string> = {
      general: 'other',
      electrician: 'electrical',
      plumber: 'plumbing',
      painter: 'painting',
      roofer: 'roofing',
      carpenter: 'carpentry',
      landscaper: 'landscaping',
    };
    return typeMapping[normalized] || normalized;
  };
  
  const [selectedType, setSelectedType] = useState(() => {
    return normalizeTypeParam(searchParams.get('type'));
  });
  const [selectedCity, setSelectedCity] = useState(() => {
    return searchParams.get('city') || "";
  });
  const [selectedProvince, setSelectedProvince] = useState("");
  const [groupByAddress, setGroupByAddress] = useState(() => {
    return searchParams.get('grouped') === 'true';
  });

  // View mode — grid (cards) or list (compact rows). Persisted in the URL so
  // a vendor's preferred scan mode survives reloads and is shareable. List
  // only applies to ungrouped results; grouped-by-address always uses the
  // AddressGroupCard layout regardless.
  const [view, setView] = useState<"grid" | "list">(() => {
    return searchParams.get('view') === 'list' ? 'list' : 'grid';
  });

  // Modal state
  const [selectedIssue, setSelectedIssue] = useState<IssueType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [autoOpenBid, setAutoOpenBid] = useState(false);

  const itemsPerPage = 12;
  const maxFetchLimit = 100; // Backend max page size is 100

  // Initialize filters from URL params on mount
  useEffect(() => {
    const type = searchParams.get('type');
    const city = searchParams.get('city');
    if (type) setSelectedType(normalizeTypeParam(type));
    if (city) setSelectedCity(city);
  }, []); // Only run on mount

  // Single URL-sync effect for the view preferences (grouped / view / sort).
  // Reads the latest params via a ref instead of depending on `searchParams`,
  // so writing the URL doesn't re-trigger this effect (the previous trio of
  // effects each depended on `searchParams` AND wrote it, causing a churn of
  // redundant navigations on every toggle). A string guard skips no-op writes.
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;
  useEffect(() => {
    const next = new URLSearchParams(searchParamsRef.current);
    groupByAddress ? next.set('grouped', 'true') : next.delete('grouped');
    view === 'list' ? next.set('view', 'list') : next.delete('view');
    if (next.toString() !== searchParamsRef.current.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [groupByAddress, view, setSearchParams]);

  // Type mapping to handle variations in issue types
  const getTypeVariations = useCallback((selectedType: string): string[] => {
    const typeMap: Record<string, string[]> = {
      electrical: ['electrical', 'electrician', 'electric', 'wiring', 'outlet', 'circuit'],
      plumbing: ['plumbing', 'plumber', 'pipe', 'pipes', 'water', 'drain', 'faucet', 'toilet'],
      hvac: ['hvac', 'heating', 'cooling', 'furnace', 'ac', 'air conditioning', 'ventilation'],
      roofing: ['roofing', 'roof', 'roofer', 'shingle', 'shingles', 'gutter', 'gutters'],
      flooring: ['flooring', 'floor', 'floors', 'carpet', 'hardwood', 'tile', 'laminate'],
      painting: ['painting', 'paint', 'painter', 'wall', 'walls', 'interior', 'exterior'],
      landscaping: ['landscaping', 'landscape', 'landscaper', 'yard', 'garden', 'lawn', 'tree'],
      structural: ['structural', 'structure', 'foundation', 'beam', 'support', 'framing', 'load bearing'],
      'dry wall': ['dry wall', 'drywall', 'wall', 'sheetrock', 'gypsum', 'patching', 'texture'],
      carpentry: ['carpentry', 'carpenter', 'wood', 'trim', 'cabinet', 'door', 'window', 'molding'],
      other: ['other', 'misc', 'miscellaneous', 'general', 'repair', 'maintenance']
    };
    
    return typeMap[selectedType] || [selectedType];
  }, []);

  // Map vendor type to issue type for filtering
  const vendorTypeToIssueType: Record<string, string> = {
    electrician: 'electrical',
    plumber: 'plumbing',
    painter: 'painting',
    roofer: 'roofing',
    carpenter: 'carpentry',
    landscaper: 'landscaping',
    hvac: 'hvac',
    general: 'other',
  };
  
  // Get vendor's primary specialty mapped to issue type
  const vendorSpecialtyAsIssueType = useMemo(() => {
    if (!vendor?.vendor_types) return null;
    const primaryType = vendor.vendor_types.toLowerCase().split(',')[0]?.trim();
    return vendorTypeToIssueType[primaryType] || primaryType || null;
  }, [vendor?.vendor_types]);
  
  // Auto-apply vendor's filters on first load (only if no URL params)
  const [hasAutoApplied, setHasAutoApplied] = useState(false);
  useEffect(() => {
    if (hasAutoApplied || !isVendor || !vendor) return;
    
    const urlType = searchParams.get('type');
    const urlCity = searchParams.get('city');
    
    // Only auto-apply if no URL params are set
    if (!urlType && !urlCity) {
      if (vendorSpecialtyAsIssueType) {
        setSelectedType(vendorSpecialtyAsIssueType);
      }
      if (vendor.city) {
        setSelectedCity(vendor.city);
      }
    }
    setHasAutoApplied(true);
  }, [isVendor, vendor, vendorSpecialtyAsIssueType, searchParams, hasAutoApplied]);

  // Determine API parameters - fetch all available data when grouping or type filtering
  const apiParams = useMemo(() => {
    return {
      page: (groupByAddress || selectedType) ? 1 : currentPage,
      size: (groupByAddress || selectedType) ? maxFetchLimit : itemsPerPage, // Use configurable limit for grouping
      search: searchTerm.trim(),
      type: "", // Don't send type to API, we'll filter client-side for better matching
      city: selectedCity,
      state: selectedProvince,
      vendor_assigned: false,
    };
  }, [currentPage, itemsPerPage, searchTerm, selectedType, selectedCity, selectedProvince, groupByAddress, maxFetchLimit]);

  // Check if we should use prefetched data (when no filters are applied)
  const shouldUsePrefetch = useMemo(() => {
    return !searchTerm.trim() && !selectedType && !selectedCity && !selectedProvince;
  }, [searchTerm, selectedType, selectedCity, selectedProvince]);

  // Try to get prefetched data
  const prefetchedData = useMemo(() => {
    if (shouldUsePrefetch) {
      return marketplacePrefetchService.findCachedData(groupByAddress);
    }
    return null;
  }, [shouldUsePrefetch, groupByAddress]);

  // API query - skip if we have valid prefetched data
  const { data, error, isLoading } = useGetPaginatedIssuesQuery(apiParams, {
    skip: shouldUsePrefetch && !!prefetchedData,
  });

  // Query for unassigned issues (for display and filtering)
  const allUnassignedQueryParams = {
    page: 1,
    size: maxFetchLimit,
    search: "",
    type: "",
    city: "",
    state: "",
    vendor_assigned: false, // Only unassigned issues
  };

  const { data: allUnassignedData, isLoading: isLoadingAllUnassigned } = useGetPaginatedIssuesQuery(allUnassignedQueryParams);

  // Fetch ALL listings to get all available cities/states for dropdowns
  // This shows all locations where properties exist, regardless of issues
  const { data: allListings, isLoading: isLoadingListings } = useGetListingsQuery();
  const { data: allClients } = useGetClientsQuery();

  // Get addresses for issues
  const [getAddressesByIssueIds] = useGetAddressesByIssueIdsMutation();
  const [addresses, setAddresses] = useState<IssueAddress[]>([]);
  const [, setIsLoadingAddresses] = useState(true);

  // Use prefetched data if available, otherwise use API data
  // Filter to only show open, unassigned issues on the marketplace
  const rawIssues = useMemo(() => {
    const issues = prefetchedData?.items || data?.items || [];
    return issues.filter((issue: IssueType) => {
      // Only show open issues (status check)
      const status = (issue.status || "").toLowerCase().replace("status.", "");
      if (status !== "open") return false;
      // Only show unassigned issues (no vendor assigned)
      if (issue.vendor_id) return false;
      return true;
    });
  }, [prefetchedData?.items, data?.items]);

  // Pool for the search autocomplete: open + unassigned jobs that are already
  // loaded (the unfiltered allUnassignedData set), so suggestions are instant
  // and independent of the currently applied filters.
  const searchPool = useMemo(() => {
    return (allUnassignedData?.items || []).filter((issue: IssueType) => {
      const status = (issue.status || "").toLowerCase().replace("status.", "");
      if (status !== "open") return false;
      if (issue.vendor_id) return false;
      return true;
    });
  }, [allUnassignedData?.items]);

  // Apply client-side type filtering for better matching with smart fallbacks
  const { filteredIssues, currentFilterMode } = useMemo(() => {
    // Helper to filter by type
    const filterByType = (issues: IssueType[], type: string) => {
      const typeVariations = getTypeVariations(type);
      return issues.filter((issue: IssueType) => {
        const issueType = issue.type?.toLowerCase() || '';
        return typeVariations.some(variation =>
          issueType.includes(variation.toLowerCase()) ||
          variation.toLowerCase().includes(issueType)
        );
      });
    };

    // Helper to filter by city (using addresses)
    const filterByCity = (issues: IssueType[], city: string) => {
      return issues.filter((issue: IssueType) => {
        const address = addresses.find(a => a.issue_id === issue.id);
        return address?.city?.toLowerCase() === city.toLowerCase();
      });
    };

    // If no filters applied, return all
    if (!selectedType && !selectedCity) {
      return { filteredIssues: rawIssues, currentFilterMode: "all" as const };
    }

    // Try exact match first (both type and city if both are set)
    let result = rawIssues;

    if (selectedType) {
      result = filterByType(result, selectedType);
    }

    // For city filtering, we need addresses loaded
    if (selectedCity && addresses.length > 0) {
      const cityFiltered = filterByCity(result, selectedCity);

      // If we have results with both filters, return them
      if (cityFiltered.length > 0) {
        return { filteredIssues: cityFiltered, currentFilterMode: "exact" as const };
      }

      // Fallback: If type+city returns nothing, try just type
      if (selectedType && result.length > 0) {
        return { filteredIssues: result, currentFilterMode: "type_only" as const };
      }

      // Fallback: If just type returns nothing, try just city
      if (selectedType) {
        const cityOnly = filterByCity(rawIssues, selectedCity);
        if (cityOnly.length > 0) {
          return { filteredIssues: cityOnly, currentFilterMode: "city_only" as const };
        }
      }

      // No results with any combination - show all
      return { filteredIssues: rawIssues, currentFilterMode: "all" as const };
    }

    return { filteredIssues: result, currentFilterMode: "exact" as const };
  }, [rawIssues, selectedType, selectedCity, getTypeVariations, addresses]);

  // For ungrouped view, paginate the issues client-side when using prefetched
  // data or filtering; otherwise the API already sent us the correct page.
  const issues = useMemo(() => {
    if (!groupByAddress) {
      if (prefetchedData?.items || selectedType) {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredIssues.slice(startIndex, endIndex);
      }
      // For API data without prefetch, return as-is (already paginated by server)
      return filteredIssues;
    }
    return filteredIssues;
  }, [filteredIssues, groupByAddress, currentPage, itemsPerPage, prefetchedData?.items, selectedType]);

  // Calculate total items based on filtering
  const totalItems = selectedType
    ? filteredIssues.length  // Use filtered count when type filtering is applied
    : (prefetchedData?.total || data?.total || 0);

  // Create address map for easy lookup
  const addressMap = useMemo(() => {
    return addresses.reduce((acc, addr) => {
      acc[addr.issue_id] = addr;
      return acc;
    }, {} as Record<number, IssueAddress>);
  }, [addresses]);

  // Map listing id -> listing so the issue modal can resolve the homeowner
  // (listing.user_id) and the property address.
  const listingMap = useMemo(() => {
    return (allListings ?? []).reduce((acc, l) => {
      acc[l.id] = l;
      return acc;
    }, {} as Record<number, Listing>);
  }, [allListings]);

  // Map owner user id -> client so the issue modal can show the homeowner name
  // instantly (instead of waiting on a per-issue client round-trip).
  const clientByUserId = useMemo(() => {
    return (allClients ?? []).reduce((acc, c) => {
      acc[c.user_id] = c;
      return acc;
    }, {} as Record<number, Client>);
  }, [allClients]);

  // Fetch addresses for displayed issues (for showing location info on cards)
  useEffect(() => {
    if (allUnassignedData?.items && allUnassignedData.items.length > 0) {
      setIsLoadingAddresses(true);
      const issueIds = allUnassignedData.items.map((issue) => issue.id);
      getAddressesByIssueIds(issueIds)
        .unwrap()
        .then((fetchedAddresses) => {
          setAddresses(fetchedAddresses);
          setIsLoadingAddresses(false);
        })
        .catch((err) => {
          console.error("Error fetching addresses:", err);
          setIsLoadingAddresses(false);
        });
    } else if (!isLoadingAllUnassigned && (!allUnassignedData?.items || allUnassignedData.items.length === 0)) {
      setIsLoadingAddresses(false);
    }
  }, [allUnassignedData?.items, getAddressesByIssueIds, isLoadingAllUnassigned]);

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


  // Group issues by property when grouping is enabled (works with filtered
  // issues). We key on listing_id rather than the street address string so
  // every issue at the same property is combined — even before per-issue
  // addresses finish loading and even while the exact street address is hidden
  // (it is only revealed once an offer/assessment is accepted).
  const groupedIssues: { address: IssueAddress; issues: IssueType[] }[] = useMemo(() => {
    if (!groupByAddress) return [];

    const groups: Record<string, { address: IssueAddress; issues: IssueType[] }> = {};

    for (const issue of filteredIssues as IssueType[]) {
      const issueAddr = addressMap[issue.id];
      const listing = listingMap[issue.listing_id];
      const key =
        issue.listing_id != null
          ? `listing_${issue.listing_id}`
          : issueAddr
          ? `${issueAddr.address}_${issueAddr.city}_${issueAddr.state}`
          : `issue_${issue.id}`;

      if (!groups[key]) {
        // Resolve a display address: prefer the per-issue address, then fall
        // back to the listing so the card can still show the city.
        const address: IssueAddress = issueAddr || {
          issue_id: issue.id,
          address: listing?.address || "",
          city: listing?.city || "",
          state: listing?.state || "",
          country: listing?.country || "",
          postal_code: listing?.postal_code || "",
        };
        groups[key] = { address, issues: [] };
      } else if (!groups[key].address.city && issueAddr) {
        // Upgrade to a real address once one becomes available for the group.
        groups[key].address = issueAddr;
      }

      groups[key].issues.push(issue);
    }

    // Grouping only makes sense for properties that bundle multiple jobs, so
    // only surface addresses with 2+ issues. Single-issue properties remain
    // visible in the normal (ungrouped) list/grid view.
    return Object.values(groups).filter((g) => g.issues.length >= 2);
  }, [filteredIssues, addressMap, listingMap, groupByAddress]);

  // Calculate pagination based on view type
  const totalPages = groupByAddress
    ? Math.ceil(groupedIssues.length / itemsPerPage)
    : Math.ceil(totalItems / itemsPerPage);

  // For grouped view, paginate the groups client-side
  const paginatedGroups: { address: IssueAddress; issues: IssueType[] }[] = useMemo(() => {
    if (!groupByAddress) return groupedIssues;

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
    return groupedIssues.slice(startIndex, endIndex);
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

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("");
    setSelectedCity("");
    setSelectedProvince("");
    setCurrentPage(1);
  };

  // Hero copy — matches the vendor dashboard's HeroBand exactly so Find Jobs
  // feels like a continuation of the workspace. Kicker is static, but the
  // summary line tracks current filter scope and result count so the vendor
  // gets a real-time read on what the page is showing.
  const firstName = useMemo(() => {
    const raw = (user as { first_name?: string } | null)?.first_name?.trim();
    return raw ? raw.split(" ")[0] : undefined;
  }, [user]);

  const hasAnyFilter =
    Boolean(searchTerm.trim()) ||
    Boolean(selectedType) ||
    Boolean(selectedCity) ||
    Boolean(selectedProvince);

  const heroSummary = useMemo(() => {
    if (groupByAddress) {
      const n = groupedIssues.length;
      if (n === 0) return "No open job clusters match these filters yet.";
      return `Browse ${n} address${n === 1 ? "" : "es"} with active work to bid on.`;
    }
    const n = totalItems;
    if (n === 0) {
      return hasAnyFilter
        ? "No open jobs match these filters yet — try widening your search."
        : "No open jobs right now — check back soon.";
    }
    if (currentFilterMode === "exact" && hasAnyFilter) {
      return `${n} open job${n === 1 ? "" : "s"} matched — pick one and place your quote.`;
    }
    if (currentFilterMode === "type_only" || currentFilterMode === "city_only") {
      return `Couldn't find an exact match — showing ${n} close opportunit${n === 1 ? "y" : "ies"} instead.`;
    }
    return `${n} open job${n === 1 ? "" : "s"} available — find the right fit and bid.`;
  }, [groupByAddress, groupedIssues.length, totalItems, hasAnyFilter, currentFilterMode]);

  const isHeroQuiet = totalItems === 0 && !hasAnyFilter && !groupByAddress;

  // Show the full-screen loader only while the API is loading and we have no
  // prefetched data to fall back on.
  const isDataLoading = isLoading && !prefetchedData;
  const hasFatalError = !!error;

  if (isDataLoading) {
    return (
      <div className="min-h-screen w-full bg-dashboard flex justify-center items-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  if (hasFatalError) {
    return (
      <div className="min-h-screen w-full bg-dashboard flex justify-center items-center text-red-600">
        Error loading marketplace data. Please try again.
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-dashboard">
      <div className="w-full max-w-[1800px] mx-auto px-4 py-5 lg:px-8 lg:py-6">

        {/* HERO BAND — same component the vendor dashboard uses, so Find Jobs
            inherits the gold-halo chrome, kicker rhythm, and "all caught up"
            chip behaviour. The summary line below adapts to filter scope. */}
        <HeroBand
          greeting="FIND JOBS"
          firstName={firstName}
          summary={heroSummary}
          isQuiet={isHeroQuiet}
        />

        {/* Search and Filter Section — single compact row at lg+, stacks on
            smaller widths. No header, no labels: icons + placeholders are the
            affordances. The group-by-address pill replaces the old checkbox
            row so the entire filter chrome stays ~64px tall. */}
        <div className="bg-card rounded-2xl shadow-card border border-border/60 mb-6">
          <div className="p-3 lg:p-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-2">
              {/* Search input with autocomplete — full width below lg, flex-1 at lg+ */}
              <MarketplaceSearchAutocomplete
                value={searchTerm}
                onChange={setSearchTerm}
                issues={searchPool}
                addressMap={addressMap}
                onSubmitSearch={handleSearch}
                onSelectIssue={(issue) => {
                  setSelectedIssue(issue);
                  setAutoOpenBid(false);
                  setIsModalOpen(true);
                }}
              />

              {/* Selects + group toggle — 2-col grid below lg, inline at lg+ */}
              <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center lg:gap-2">
                <div className="relative">
                  <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
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
                    className="w-full lg:w-[150px] pl-9 pr-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors bg-card text-foreground text-sm"
                  >
                    <option value="">Any type</option>
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

                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <select
                    value={selectedProvince}
                    onChange={(e) => {
                      const newState = e.target.value;
                      setSelectedProvince(newState);

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
                    className="w-full lg:w-[140px] pl-9 pr-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors bg-card text-foreground disabled:opacity-50 text-sm"
                  >
                    <option value="">{isLoadingListings ? "Loading..." : "Any Province"}</option>
                    {uniqueStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <select
                    value={selectedCity}
                    onChange={(e) => {
                      setSelectedCity(e.target.value);
                      setCurrentPage(1);
                    }}
                    disabled={isLoadingListings}
                    className="w-full lg:w-[160px] pl-9 pr-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors bg-card text-foreground disabled:opacity-50 text-sm"
                  >
                    <option value="">{isLoadingListings ? "Loading..." : "Any city"}</option>
                    {filteredCities.map((city: string) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  aria-pressed={groupByAddress}
                  onClick={() => {
                    setGroupByAddress((prev) => !prev);
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                    groupByAddress
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  Group
                </button>
              </div>

              {/* Action buttons — full width below lg, inline at lg+ */}
              <div className="flex gap-2 w-full lg:w-auto lg:flex-shrink-0">
                <button
                  onClick={handleSearch}
                  className="flex-1 lg:flex-initial px-4 py-2 bg-gold text-white rounded-xl font-semibold text-sm hover:bg-foreground hover:text-background transition-colors"
                >
                  Search
                </button>
                <button
                  onClick={clearFilters}
                  className={`flex-1 lg:flex-initial px-4 py-2 bg-card text-foreground rounded-xl font-semibold text-sm border border-border ${BUTTON_HOVER}`}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Smart Filter Fallback Banner */}
        {isVendor && currentFilterMode !== "exact" && currentFilterMode !== "all" && (selectedType || selectedCity) && (
          <div className="mb-6 px-5 py-4 rounded-2xl flex items-start gap-3 bg-gold-50 text-foreground border border-gold-200 shadow-card">
            {currentFilterMode === "type_only"
              ? <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-gold" />
              : <Wrench className="w-4 h-4 mt-1 flex-shrink-0 text-gold" />
            }
            <div>
              <p className="font-semibold">
                {currentFilterMode === "type_only" && (
                  <>No {normalizeAndCapitalize(selectedType)} jobs found in {selectedCity}</>
                )}
                {currentFilterMode === "city_only" && (
                  <>No {normalizeAndCapitalize(selectedType)} jobs available</>
                )}
              </p>
              <p className="text-sm mt-1 text-muted-foreground">
                {currentFilterMode === "type_only" && (
                  <>Showing {normalizeAndCapitalize(selectedType)} opportunities in other areas. Consider expanding your service area.</>
                )}
                {currentFilterMode === "city_only" && (
                  <>Showing other job types in {selectedCity}. Consider adding more specialties to your profile.</>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Slim count line + sort selector + view toggle. The segmented
            grid/list control is hidden when grouped-by-address is on, since
            grouped uses AddressGroupCard regardless of the chosen view. */}
        <div className="flex items-center justify-between gap-3 mb-3 px-1">
          <span className="text-xs font-medium text-muted-foreground">
            {groupByAddress
              ? `${groupedIssues.length} address group${groupedIssues.length === 1 ? "" : "s"}`
              : `${totalItems} open job${totalItems === 1 ? "" : "s"}`}
          </span>

          <div className="flex items-center gap-2">
            {!groupByAddress && (
            <div
              role="tablist"
              aria-label="View mode"
              className="inline-flex items-center rounded-lg border border-border bg-card p-0.5"
            >
              <button
                type="button"
                role="tab"
                aria-selected={view === "grid"}
                onClick={() => setView("grid")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  view === "grid"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Grid
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === "list"}
                onClick={() => setView("list")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  view === "list"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ListIcon className="w-3.5 h-3.5" />
                List
              </button>
            </div>
            )}
          </div>
        </div>

        {/* Results body — three render paths:
            1. Grouped: AddressGroupCard grid (regardless of view setting).
            2. List view: dense rows in one card surface — same pattern as
               the vendor dashboard's "New Job Opportunities" list, so a
               vendor can scan many jobs at once and quote in one click.
            3. Grid view: the original IssueItem card grid. */}
        {groupByAddress ? (
          groupedIssues.length === 0 ? (
            <div className="bg-card rounded-2xl shadow-card border border-border/60 p-10 text-center">
              <p className="font-semibold text-foreground">No grouped properties</p>
              <p className="text-sm mt-1 text-muted-foreground">
                Grouping shows properties with two or more open jobs. Turn off
                grouping to see every individual job.
              </p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
            {paginatedGroups.map((group, index) => (
              <AddressGroupCard
                key={`${group.address.address}_${index}`}
                address={group.address}
                issues={group.issues}
                offerByIssueId={offerByIssueId}
                listing={listingMap[group.issues[0]?.listing_id]}
              />
            ))}
          </div>
          )
        ) : view === "list" ? (
          <div className="bg-card rounded-2xl shadow-card border border-border/60 divide-y divide-border overflow-hidden">
            {issues.map((issue: IssueType) => {
              const address = addressMap[issue.id];
              const openDetails = () => {
                setSelectedIssue(issue);
                setAutoOpenBid(false);
                setIsModalOpen(true);
              };
              const openOffers = (e: React.MouseEvent) => {
                e.stopPropagation();
                setSelectedIssue(issue);
                setAutoOpenBid(true);
                setIsModalOpen(true);
              };
              const listOffer = offerByIssueId[issue.id];
              const listAssessment = assessmentByIssueId[issue.id];
              const listStage = getBidStage(listOffer, listAssessment);
              return (
                <div
                  key={issue.id}
                  onClick={openDetails}
                  className="flex items-center gap-3 px-4 lg:px-5 py-3 hover:bg-muted/40 cursor-pointer transition-colors"
                >
                  <PropertyThumbnail
                    imageUrl={issue.image_urls && issue.image_urls.length > 0 ? issue.image_urls : undefined}
                    size="lg"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {issue.summary || `${normalizeAndCapitalize(issue.type)} Issue`}
                      </p>
                      <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-muted text-muted-foreground flex-shrink-0">
                        {normalizeAndCapitalize(issue.type)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-2">
                      {address?.city && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {address.city}
                        </span>
                      )}
                      {issue.created_at && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          {getRelativeTime(issue.created_at)}
                        </span>
                      )}
                      {issue.severity && (
                        <span className="capitalize">{issue.severity}</span>
                      )}
                    </p>
                  </div>

                  <BidStatusButton
                    stage={listStage}
                    className="shrink-0 w-40 h-11 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Active CTA → jump straight into the bid panel; any other
                      // stage opens the detail view to manage / view status.
                      if (isCtaStage(listStage)) openOffers(e);
                      else openDetails();
                    }}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
            {issues.map((issue: IssueType) => (
              <IssueItem
                key={issue.id}
                issue={issue}
                address={addressMap[issue.id]}
                myOffer={offerByIssueId[issue.id]}
                myAssessment={assessmentByIssueId[issue.id]}
                onClick={(clickedIssue) => {
                  setSelectedIssue(clickedIssue);
                  setAutoOpenBid(false);
                  setIsModalOpen(true);
                }}
                onPlaceBid={(clickedIssue) => {
                  setSelectedIssue(clickedIssue);
                  setAutoOpenBid(true);
                  setIsModalOpen(true);
                }}
              />
            ))}
          </div>
        )}

        {/* Pagination — neutral foreground tones to match the dashboard's
            "View all" affordance, with hover on muted instead of gold. */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1.5 mt-8">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 5))}
              disabled={currentPage === 1}
              aria-label="Jump back 5 pages"
              className="px-3 py-2 rounded-lg bg-card border border-border text-foreground hover:bg-muted/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-card"
            >
              <FontAwesomeIcon icon={faAngleDoubleLeft} />
            </button>

            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="px-3 py-2 rounded-lg bg-card border border-border text-foreground hover:bg-muted/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-card"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>

            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === "number" && handlePageChange(page)}
                disabled={page === "..."}
                className={`min-w-[40px] px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                  page === currentPage
                    ? "bg-foreground text-background border-foreground"
                    : page === "..."
                    ? "bg-card border-border text-muted-foreground cursor-default"
                    : "bg-card border-border text-foreground hover:bg-muted/60"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="px-3 py-2 rounded-lg bg-card border border-border text-foreground hover:bg-muted/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-card"
            >
              <FontAwesomeIcon icon={faArrowRight} />
            </button>

            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 5))}
              disabled={currentPage === totalPages}
              aria-label="Jump forward 5 pages"
              className="px-3 py-2 rounded-lg bg-card border border-border text-foreground hover:bg-muted/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-card"
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
            className="bg-card rounded-2xl shadow-2xl border border-border/60 w-[45vw] max-w-2xl min-w-[340px] h-[85vh] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <MarketplaceIssueCard
              issue={selectedIssue}
              listing={listingMap[selectedIssue.listing_id]}
              address={addressMap[selectedIssue.id]}
              initialMyOffer={offerByIssueId[selectedIssue.id]}
              initialMyAssessment={assessmentByIssueId[selectedIssue.id]}
              initialClient={
                clientByUserId[
                  listingMap[selectedIssue.listing_id]?.user_id ?? -1
                ]
              }
              autoOpenBid={autoOpenBid}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedIssue(null);
                setAutoOpenBid(false);
              }}
              onNotInterested={() => {
                setIsModalOpen(false);
                setSelectedIssue(null);
                setAutoOpenBid(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;