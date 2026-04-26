import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faMagnifyingGlass,
  faAngleDoubleLeft,
  faAngleDoubleRight,
} from "@fortawesome/free-solid-svg-icons";
import { MapPin, Wrench } from "lucide-react";
import { BUTTON_HOVER } from "../styles/shared";
import {
  useGetAddressesByIssueIdsMutation,
  useGetPaginatedIssuesQuery,
} from "../features/api/issuesApi";
import { useGetListingsQuery } from "../features/api/listingsApi";
import { useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";
import IssueItem from "../components/IssueItem";
import AddressGroupCard from "../components/AddressGroupCard";
import IssueDetails from "../components/IssueDetails";
import { IssueAddress, IssueType } from "../types";
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
  
  // Modal state
  const [selectedIssue, setSelectedIssue] = useState<IssueType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const itemsPerPage = 12;
  const maxFetchLimit = 100; // Backend max page size is 100

  // Initialize filters from URL params on mount
  useEffect(() => {
    const type = searchParams.get('type');
    const city = searchParams.get('city');
    if (type) setSelectedType(normalizeTypeParam(type));
    if (city) setSelectedCity(city);
  }, []); // Only run on mount

  // Update URL when groupByAddress changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (groupByAddress) {
      newParams.set('grouped', 'true');
    } else {
      newParams.delete('grouped');
    }
    setSearchParams(newParams, { replace: true });
  }, [groupByAddress, searchParams, setSearchParams]);

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

  // API query - skip if we have valid prefetched data; poll every 20s so vendors see new issues
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
        return { 
          filteredIssues: result, 
          currentFilterMode: "type_only" as const 
        };
      }
      
      // Fallback: If just type returns nothing, try just city
      if (selectedType) {
        const cityOnly = filterByCity(rawIssues, selectedCity);
        if (cityOnly.length > 0) {
          return { 
            filteredIssues: cityOnly, 
            currentFilterMode: "city_only" as const 
          };
        }
      }
      
      // No results with any combination - show all
      return { 
        filteredIssues: rawIssues, 
        currentFilterMode: "all" as const 
      };
    }
    
    return { filteredIssues: result, currentFilterMode: "exact" as const };
  }, [rawIssues, selectedType, selectedCity, getTypeVariations, addresses]);

  // For ungrouped view, paginate the issues client-side when using prefetched data or filtering
  const issues = useMemo(() => {
    if (!groupByAddress) {
      // Only do client-side pagination when we have prefetched data or type filtering
      // Otherwise, the API already sent us the correct page
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


  // Group issues by address when grouping is enabled (works with filtered issues)
  const groupedIssues: { address: IssueAddress; issues: IssueType[] }[] = useMemo(() => {
    if (!groupByAddress || addresses.length === 0) return [];

    const groups = filteredIssues.reduce((acc: Record<string, { address: IssueAddress; issues: IssueType[] }>, issue: IssueType) => {
      const address = addressMap[issue.id];
      if (!address) return acc;

      const key = `${address.address}_${address.city}_${address.state}`;
      if (!acc[key]) {
        acc[key] = {
          address,
          issues: [],
        };
      }
      acc[key].issues.push(issue);
        return acc;
    }, {} as Record<string, { address: IssueAddress; issues: IssueType[] }>);

    return Object.values(groups);
  }, [filteredIssues, addressMap, groupByAddress, addresses.length]);

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

  // Show loading only if we don't have prefetched data and API is loading
  const isDataLoading = isLoading && !prefetchedData;
  
  if (isDataLoading) {
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
          <div className="bg-card rounded-xl shadow-lg border border-border mb-8 overflow-hidden">
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
                    setSelectedType(e.target.value);
                    setCurrentPage(1);
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
                    setSelectedCity(""); // Clear city if it doesn't exist in the new state
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

        {/* Smart Filter Fallback Banner */}
        {isVendor && currentFilterMode !== "exact" && currentFilterMode !== "all" && (selectedType || selectedCity) && (
          <div className="mb-6 px-4 py-3 rounded-lg flex items-start gap-3 bg-gold-50 text-foreground border border-gold-200">
            {currentFilterMode === "type_only"
              ? <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gold" />
              : <Wrench className="w-4 h-4 mt-0.5 flex-shrink-0 text-gold" />
            }
            <div>
              <p className="font-medium">
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
            className="bg-card rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto relative"
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
              <IssueDetails issue={selectedIssue} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;