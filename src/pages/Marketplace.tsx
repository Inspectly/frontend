import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faMagnifyingGlass,
  faAngleDoubleLeft,
  faAngleDoubleRight,
} from "@fortawesome/free-solid-svg-icons";
import {
  useGetAddressesByIssueIdsMutation,
  useGetPaginatedIssuesQuery,
} from "../features/api/issuesApi";
import IssueItem from "../components/IssueItem";
import AddressGroupCard from "../components/AddressGroupCard";
import { IssueAddress, IssueType } from "../types";
import { marketplacePrefetchService } from "../services/marketplacePrefetchService";

const Marketplace: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState(() => {
    return searchParams.get('type') || "";
  });
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [groupByAddress, setGroupByAddress] = useState(() => {
    return searchParams.get('grouped') === 'true';
  });

  const itemsPerPage = 12;
  const maxFetchLimit = 50000; // Configurable limit for grouping - can be adjusted based on system capacity

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

  // Determine API parameters - fetch all available data when grouping or type filtering
  const apiParams = useMemo(() => {
    return {
      offset: (groupByAddress || selectedType) ? 0 : (currentPage - 1) * itemsPerPage,
      limit: (groupByAddress || selectedType) ? maxFetchLimit : itemsPerPage, // Use configurable limit for grouping
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
    skip: shouldUsePrefetch && !!prefetchedData
  });


  // Separate API call to get ALL issues for dropdown options (without city/state filters)
  const { data: allIssuesData } = useGetPaginatedIssuesQuery({
    offset: 0,
    limit: maxFetchLimit,
    search: "",
    type: "",
    city: "",
    state: "",
    vendor_assigned: false,
  });

  // Get addresses for issues
  const [getAddressesByIssueIds] = useGetAddressesByIssueIdsMutation();
  const [addresses, setAddresses] = useState<IssueAddress[]>([]);


  // Use prefetched data if available, otherwise use API data
  const rawIssues = useMemo(() => {
    return prefetchedData?.issues || data?.issues || [];
  }, [prefetchedData?.issues, data?.issues]);

  // Apply client-side type filtering for better matching
  const filteredIssues = useMemo(() => {
    if (!selectedType) return rawIssues;
    
    const typeVariations = getTypeVariations(selectedType);
    return rawIssues.filter((issue: IssueType) => {
      const issueType = issue.type?.toLowerCase() || '';
      return typeVariations.some(variation => 
        issueType.includes(variation.toLowerCase()) || 
        variation.toLowerCase().includes(issueType)
      );
    });
  }, [rawIssues, selectedType, getTypeVariations]);

  // For ungrouped view, paginate the issues client-side when using prefetched data or filtering
  const issues = useMemo(() => {
    if (!groupByAddress) {
      // Only do client-side pagination when we have prefetched data or type filtering
      // Otherwise, the API already sent us the correct page
      if (prefetchedData?.issues || selectedType) {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredIssues.slice(startIndex, endIndex);
      }
      // For API data without prefetch, return as-is (already paginated by server)
      return filteredIssues;
    }
    return filteredIssues;
  }, [filteredIssues, groupByAddress, currentPage, itemsPerPage, prefetchedData?.issues, selectedType]);
  
  // Calculate total items based on filtering
  const totalItems = selectedType 
    ? filteredIssues.length  // Use filtered count when type filtering is applied
    : (prefetchedData?.total_filtered?.count || data?.total_filtered?.count || 0);

  // Create address map for easy lookup
  const addressMap = useMemo(() => {
    return addresses.reduce((acc, addr) => {
      acc[addr.issue_id] = addr;
      return acc;
    }, {} as Record<number, IssueAddress>);
  }, [addresses]);

  // Fetch addresses for ALL issues (for dropdown options)
  useEffect(() => {
    if (allIssuesData?.issues && allIssuesData.issues.length > 0) {
      const issueIds = allIssuesData.issues.map((issue) => issue.id);
      getAddressesByIssueIds(issueIds)
        .unwrap()
        .then(setAddresses)
        .catch((err) => console.error("Error fetching addresses:", err));
    }
  }, [allIssuesData?.issues, getAddressesByIssueIds]);


  // Extract unique cities and states from address data
  // When type is selected, only show cities/states that have issues of that type
  const uniqueCities: string[] = useMemo(() => {
    const relevantAddresses = selectedType 
      ? filteredIssues.map((issue: IssueType) => addressMap[issue.id]).filter(Boolean)
      : addresses;
    
    return [...new Set(relevantAddresses.map((addr: IssueAddress) => addr.city).filter(Boolean))].sort() as string[];
  }, [addresses, selectedType, filteredIssues, addressMap]);

  const uniqueStates: string[] = useMemo(() => {
    const relevantAddresses = selectedType 
      ? filteredIssues.map((issue: IssueType) => addressMap[issue.id]).filter(Boolean)
      : addresses;
    
    return [...new Set(relevantAddresses.map((addr: IssueAddress) => addr.state).filter(Boolean))].sort() as string[];
  }, [addresses, selectedType, filteredIssues, addressMap]);

  // Filter cities based on selected state (for cascading dropdown)
  const filteredCities: string[] = useMemo(() => {
    if (!selectedProvince) {
      return uniqueCities; // Show all cities if no state selected
    }
    
    // Use contextually relevant addresses (filtered by type if type is selected)
    const relevantAddresses = selectedType 
      ? filteredIssues.map((issue: IssueType) => addressMap[issue.id]).filter(Boolean)
      : addresses;
    
    const citiesInState = relevantAddresses
      .filter((addr: IssueAddress) => addr.state === selectedProvince)
      .map((addr: IssueAddress) => addr.city)
      .filter(Boolean);
    
    return [...new Set(citiesInState)].sort() as string[];
  }, [uniqueCities, addresses, selectedProvince, selectedType, filteredIssues, addressMap]);

  // Create a mapping of city to state for auto-selecting state when city is chosen
  const cityToStateMap = useMemo(() => {
    const map: Record<string, string> = {};
    
    // Use contextually relevant addresses (filtered by type if type is selected)
    const relevantAddresses = selectedType 
      ? filteredIssues.map((issue: IssueType) => addressMap[issue.id]).filter(Boolean)
      : addresses;
    
    relevantAddresses.forEach((addr: IssueAddress) => {
      if (addr.city && addr.state) {
        map[addr.city] = addr.state;
      }
    });
    return map;
  }, [addresses, selectedType, filteredIssues, addressMap]);

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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4">

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Search & Filter</h2>
            <p className="text-sm text-gray-600">Find the perfect issues for your expertise</p>
      </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <input
                type="text"
                    placeholder="Search issues..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
              />
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                    className="absolute left-3 top-3.5 text-gray-400"
              />
                </div>
            </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={selectedType}
                onChange={(e) => {
                    setSelectedType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
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
                  <option value="general">General</option>
                  <option value="other">Other</option>
                </select>
          </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <select
              value={selectedCity}
              onChange={(e) => {
                const newCity = e.target.value;
                setSelectedCity(newCity);
                
                // Auto-select state when city is chosen
                if (newCity && cityToStateMap[newCity]) {
                  setSelectedProvince(cityToStateMap[newCity]);
                } else if (!newCity) {
                  // Don't clear state when "All Cities" is selected - let user keep state filter
                }
                
                setCurrentPage(1);
              }}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
            >
              <option value="">All Cities</option>
                  {filteredCities.map((city: string) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <select
                  value={selectedProvince}
              onChange={(e) => {
                const newState = e.target.value;
                setSelectedProvince(newState);
                
                // Clear city if it's not available in the new state
                if (selectedCity && newState) {
                  const citiesInNewState = addresses
                    .filter((addr) => addr.state === newState)
                    .map((addr) => addr.city)
                    .filter(Boolean);
                  
                  const uniqueCitiesInState = [...new Set(citiesInNewState)];
                  
                  if (!uniqueCitiesInState.includes(selectedCity)) {
                    setSelectedCity(""); // Clear city if it doesn't exist in the new state
                  }
                }
                
                setCurrentPage(1);
              }}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
            >
                  <option value="">All States</option>
                  {uniqueStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex gap-2">
                  <button
                    onClick={handleSearch}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                  >
                    Search
                  </button>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium border border-gray-300"
                  >
                    Clear
            </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={groupByAddress}
              onChange={(e) => {
                  setGroupByAddress(e.target.checked);
                setCurrentPage(1);
              }}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
              />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                  📍 Group by address
                </span>
            </label>

            </div>
          </div>
          </div>

        {/* Results Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {groupByAddress ? "Grouped Issues" : "All Issues"}
            </h2>
            <span className="text-gray-600">
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
                  />
                ))}
              </div>

        {/* Pagination - show for both grouped and ungrouped views when there are multiple pages */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
              <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 5))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faAngleDoubleLeft} />
              </button>

              <button
              onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
              <FontAwesomeIcon icon={faArrowLeft} />
              </button>

            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === "number" && handlePageChange(page)}
                disabled={page === "..."}
                className={`px-3 py-2 rounded-lg border ${
                  page === currentPage
                    ? "bg-blue-600 text-white border-blue-600"
                    : page === "..."
                    ? "bg-white border-gray-300 text-gray-400 cursor-default"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faArrowRight} />
              </button>

              <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 5))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faAngleDoubleRight} />
              </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;