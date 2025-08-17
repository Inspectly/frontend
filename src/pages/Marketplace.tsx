import React, { useState, useEffect, useMemo } from "react";
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
import { IssueAddress } from "../types";
import { useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

// Cache utilities
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_PREFIX = 'marketplace_cache_';

interface CacheEntry {
  data: any;
  timestamp: number;
  key: string;
}

const getCacheKey = (params: any) => {
  return `${CACHE_PREFIX}${JSON.stringify(params)}`;
};

const setCache = (key: string, data: any) => {
  const entry: CacheEntry = {
    data,
    timestamp: Date.now(),
    key
  };
  try {
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.warn('Cache storage failed:', error);
  }
};

const getCache = (key: string): { data: any; isExpired: boolean } => {
  try {
    const item = sessionStorage.getItem(key);
    if (!item) return { data: null, isExpired: false };
    
    const entry: CacheEntry = JSON.parse(item);
    const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
    
    if (isExpired) {
      sessionStorage.removeItem(key);
      return { data: null, isExpired: true };
    }
    
    return { data: entry.data, isExpired: false };
  } catch (error) {
    console.warn('Cache retrieval failed:', error);
    return { data: null, isExpired: false };
  }
};

const clearCache = (pattern?: string) => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        if (!pattern || key.includes(pattern)) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  } catch (error) {
    console.warn('Cache clearing failed:', error);
  }
};

const Marketplace: React.FC = () => {
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const userType = useSelector(
    (state: RootState) => state.auth.user?.user_type
  );

  const { data: vendor } = useGetVendorByVendorUserIdQuery(userId || "", {
    skip: !userId || userType !== "vendor",
  });

  const [getAddressesByIssueIds] = useGetAddressesByIssueIdsMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [groupByAddress, setGroupByAddress] = useState(false);
  
  // Cache state
  const [cacheRefreshKey] = useState(0);
  
  // Background grouping state
  const [backgroundGroupingComplete, setBackgroundGroupingComplete] = useState(false);

  const offset = (currentPage - 1) * itemsPerPage;

  // When grouping by address, we need ALL issues to group properly
  // When not grouping, we can use pagination at API level
  const { data, error, isLoading } = useGetPaginatedIssuesQuery({
    offset: groupByAddress ? 0 : offset,
    limit: groupByAddress ? 1000 : itemsPerPage, // Fetch more when grouping
    search: searchQuery,
    city: selectedCity,
    state: selectedState,
    type: selectedType,
    vendor_assigned: false, // Only fetch issues assigned to vendors
  });

  const issues = data?.issues || [];
  const totalItems = data?.total_filtered?.count || 0;

  const [addresses, setAddresses] = useState<Record<number, IssueAddress>>({});
  const [addressesLoaded, setAddressesLoaded] = useState(false);

  useEffect(() => {
    if (!issues || issues.length === 0) return;

    const fetchAddresses = async () => {
      try {
        const issueIds = issues.map((issue) => issue.id);
        const addressList = await getAddressesByIssueIds(issueIds).unwrap();
        const addressMap = Object.fromEntries(
          addressList.map((a) => [a.issue_id, a])
        );
        setAddresses(addressMap);
        setAddressesLoaded(true);
      } catch (err) {
        console.error("Failed to fetch batch addresses", err);
      }
    };

    fetchAddresses();
  }, [issues]);

  const isDataReady = !isLoading && issues && addressesLoaded;

  // Background grouping effect - precompute grouping when data is ready
  useEffect(() => {
    if (!isDataReady || backgroundGroupingComplete) return;

    // Small delay to not block initial render
    const timeoutId = setTimeout(() => {
      const backgroundCacheKey = getCacheKey({
        search: searchQuery,
        city: selectedCity,
        state: selectedState,
        type: selectedType,
        groupByAddress: true,
        issueIds: issues.map(i => i.id).sort(),
        refreshKey: cacheRefreshKey
      });

      const { data: cachedGroups } = getCache(backgroundCacheKey);
      
      if (!cachedGroups) {
        console.log('🔄 Background grouping started...');
        const startTime = performance.now();

        // Perform the same grouping logic as the main useMemo
        const grouped = issues
          .filter((issue) => issue.vendor_id === null)
          .reduce((acc, issue) => {
            const address = addresses[issue.id];
            const addressKey = address 
              ? `${address.address}, ${address.city}, ${address.state}`
              : `Unknown Address - Issue ${issue.id}`;
            
            if (!acc[addressKey]) {
              acc[addressKey] = {
                address: address || {
                  address: "Unknown Address",
                  city: "Unknown",
                  state: "Unknown",
                  issue_id: issue.id
                } as IssueAddress,
                issues: []
              };
            }
            acc[addressKey].issues.push(issue);
            return acc;
          }, {} as Record<string, { address: IssueAddress; issues: typeof issues }>);

        const groups = Object.values(grouped);
        setCache(backgroundCacheKey, groups);
        
        const duration = performance.now() - startTime;
        console.log(`✅ Background grouping complete: ${issues.length} issues → ${groups.length} groups (${duration.toFixed(2)}ms)`);
      } else {
        console.log('📦 Background grouping already cached');
      }
      
      setBackgroundGroupingComplete(true);
    }, 100); // 100ms delay

    return () => clearTimeout(timeoutId);
  }, [isDataReady, issues, addresses, searchQuery, selectedCity, selectedState, selectedType, cacheRefreshKey, backgroundGroupingComplete]);

  // Group issues by address when groupByAddress is enabled (with caching)
  const { processedIssues, allAddressGroups } = useMemo(() => {
    if (!groupByAddress || !isDataReady) {
      return { 
        processedIssues: issues.filter((issue) => issue.vendor_id === null), 
        allAddressGroups: [] 
      };
    }

    // Generate cache key for current state
    const cacheKey = getCacheKey({
      search: searchQuery,
      city: selectedCity,
      state: selectedState,
      type: selectedType,
      groupByAddress: true,
      issueIds: issues.map(i => i.id).sort(),
      refreshKey: cacheRefreshKey
    });

    // Try to get from cache first
    const { data: cachedGroups, isExpired } = getCache(cacheKey);
    
    if (cachedGroups && !isExpired) {
      console.log('📦 Using cached address groups');
      return {
        processedIssues: [],
        allAddressGroups: cachedGroups
      };
    }
    
    if (isExpired) {
      console.log('⏰ Cache expired, refreshing automatically');
    }

    console.log('🔄 Computing address groups...');
    const startTime = performance.now();

    // Group issues by address
    const grouped = issues
      .filter((issue) => issue.vendor_id === null) // Only ungrouped issues
      .reduce((acc, issue) => {
        const address = addresses[issue.id];
        
        // Handle issues without addresses
        const addressKey = address 
          ? `${address.address}, ${address.city}, ${address.state}`
          : `Unknown Address - Issue ${issue.id}`;
        
        if (!acc[addressKey]) {
          acc[addressKey] = {
            address: address || {
              address: "Unknown Address",
              city: "Unknown",
              state: "Unknown",
              issue_id: issue.id
            } as IssueAddress,
            issues: []
          };
        }
        acc[addressKey].issues.push(issue);
        return acc;
      }, {} as Record<string, { address: IssueAddress; issues: typeof issues }>);

    // Convert to array for rendering
    const groups = Object.values(grouped);
    
    // Cache the result
    setCache(cacheKey, groups);
    
    const duration = performance.now() - startTime;
    console.log(`✅ Grouped ${issues.length} issues into ${groups.length} addresses in ${duration.toFixed(2)}ms`);
    
    return { 
      processedIssues: [], // Empty when grouping 
      allAddressGroups: groups
    };
  }, [groupByAddress, isDataReady, issues, addresses, searchQuery, selectedCity, selectedState, selectedType, cacheRefreshKey]);

  // Apply pagination based on current view mode
  const { displayItems, totalCount } = useMemo(() => {
    if (groupByAddress) {
      // For grouped view: paginate address groups (frontend pagination)
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedGroups = allAddressGroups.slice(startIndex, endIndex);
      
      return {
        displayItems: paginatedGroups,
        totalCount: allAddressGroups.length
      };
    } else {
      // For regular view: 
      // If we fetched all data (because grouping was enabled), do frontend pagination
      // Otherwise, use API pagination (processedIssues is already paginated)
      if (issues.length > itemsPerPage && issues.length < totalItems) {
        // API pagination is being used
        return {
          displayItems: processedIssues,
          totalCount: totalItems
        };
      } else {
        // We have all data, do frontend pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedIssues = processedIssues.slice(startIndex, endIndex);
        
        return {
          displayItems: paginatedIssues,
          totalCount: processedIssues.length
        };
      }
    }
  }, [groupByAddress, allAddressGroups, processedIssues, currentPage, itemsPerPage, totalItems, issues.length]);

  // Calculate total pages based on current view mode
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Optional debug logging (can be removed in production)
  // console.log('Marketplace Debug:', {
  //   groupByAddress,
  //   totalCount,
  //   cacheInfo: {
  //     cacheRefreshKey,
  //     sessionStorageSize: `${Object.keys(sessionStorage).filter(k => k.startsWith(CACHE_PREFIX)).length} items`
  //   }
  // });

  // Extract unique city, province, and types
  const uniqueCity = [...new Set(Object.values(addresses).map((a) => a.city))];
  const uniqueState = [
    ...new Set(Object.values(addresses).map((a) => a.state)),
  ];
  const uniqueTypes = [...new Set(issues?.map((issue) => issue?.type))];

  // Adjust `itemsPerPage` dynamically based on the number of columns
  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      let columns = 1; // Default to 1 column

      if (width >= 640) columns = 2; // `sm:grid-cols-2`
      if (width >= 768) columns = 3; // `md:grid-cols-3`
      if (width >= 1536) columns = 4; // `2xl:grid-cols-4`

      const rows = 4; // Always display at least 4 rows
      setItemsPerPage(columns * rows);
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);

    return () => {
      window.removeEventListener("resize", updateItemsPerPage);
    };
  }, []);

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  const handleJumpBackward = () => {
    setCurrentPage((prev) => Math.max(1, prev - 5));
  };

  const handleJumpForward = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 5));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1); // Reset to first page on search
    clearCache(); // Clear cache when search changes
  };

  // Reset background grouping when filters change
  useEffect(() => {
    setBackgroundGroupingComplete(false);
  }, [searchQuery, selectedCity, selectedState, selectedType]);

  // Clear cache when filters change
  useEffect(() => {
    clearCache();
  }, [selectedCity, selectedState, selectedType]);

  // Clear cache on component unmount
  useEffect(() => {
    return () => {
      // Optional: clear cache on unmount to free memory
      // clearCache();
    };
  }, []);

  if (error) return <p>Error loading issues</p>;

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <h1 className="text-2xl font-semibold mb-0">Marketplace</h1>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="space-y-4">
          {/* Top Row: Search, Filter Button, and Group Checkbox */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={handleSearchChange}
                className="h-10 w-64 rounded-lg border border-gray-200 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400"
              />
            </div>

            {/* Filter Button */}
            <button className="h-10 px-6 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
              Filter
            </button>

            {/* Group by Address Checkbox */}
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={groupByAddress}
                onChange={(e) => {
                  setGroupByAddress(e.target.checked);
                  setCurrentPage(1); // Reset to first page when toggling
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              Group by address
            </label>
          </div>

          {/* Bottom Row: Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Cities Filter */}
            <select
              className="h-10 min-w-[120px] bg-white border border-gray-200 rounded-lg px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Cities</option>
              {uniqueCity.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            {/* Provinces Filter */}
            <select
              className="h-10 min-w-[120px] bg-white border border-gray-200 rounded-lg px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Provinces</option>
              {uniqueState.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>

            {/* Types Filter */}
            <select
              className="h-10 min-w-[100px] bg-white border border-gray-200 rounded-lg px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Types</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-white p-6">
          {!isDataReady ? (
            <div className="text-center text-gray-500 animate-pulse py-10">
              Loading issues...
            </div>
          ) : groupByAddress ? (
            // Address Grouped View
            displayItems.length === 0 ? (
              <div className="text-center text-gray-500">
                No address groups found matching your criteria.
              </div>
            ) : (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-6"
                style={{
                  gridAutoRows: "minmax(150px, auto)",
                }}
              >
                {(displayItems as Array<{ address: IssueAddress; issues: typeof issues }>).map((group, index) => (
                  <AddressGroupCard
                    key={`${group.address.address}-${group.address.city}-${index}`}
                    address={group.address}
                    issues={group.issues}
                  />
                ))}
              </div>
            )
          ) : (
            // Regular Issue View
            displayItems.length === 0 ? (
              <div className="text-center text-gray-500">
                No issues found matching your criteria.
              </div>
            ) : (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-6"
                style={{
                  gridAutoRows: "minmax(150px, auto)",
                }}
              >
                {(displayItems as typeof issues).map((issue) => (
                  <IssueItem
                    key={issue.id}
                    issue={issue}
                    vendor={vendor}
                    userType={userType}
                    address={
                      addresses[issue.id]
                        ? addresses[issue.id]
                        : ({} as IssueAddress)
                    }
                  />
                ))}
              </div>
            )
          )}

          {/* Pagination */}
          <div className="flex flex-col items-center gap-4 mt-8">
            <span className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}{" "}
              {groupByAddress ? 'address groups' : 'entries'}
            </span>
            
            <div className="flex items-center gap-2">
              {/* Jump Backward by 5 */}
              <button
                className={`flex items-center justify-center h-9 w-9 rounded-lg border ${
                  currentPage <= 5 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
                onClick={handleJumpBackward}
                disabled={currentPage <= 5}
                title="Go back 5 pages"
              >
                <FontAwesomeIcon icon={faAngleDoubleLeft} className="text-sm" />
              </button>

              {/* Previous Page */}
              <button
                className={`flex items-center justify-center h-9 w-9 rounded-lg border ${
                  currentPage === 1 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
                onClick={handlePrevious}
                disabled={currentPage === 1}
                title="Previous page"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
              </button>

              {/* Page Numbers (1-10 max) */}
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    className={`flex items-center justify-center h-9 w-9 rounded-lg border font-medium ${
                      currentPage === page
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => handlePageClick(page)}
                  >
                    {page}
                  </button>
                )
              )}

              {/* Next Page */}
              <button
                className={`flex items-center justify-center h-9 w-9 rounded-lg border ${
                  currentPage === totalPages 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
                onClick={handleNext}
                disabled={currentPage === totalPages}
                title="Next page"
              >
                <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
              </button>

              {/* Jump Forward by 5 */}
              <button
                className={`flex items-center justify-center h-9 w-9 rounded-lg border ${
                  currentPage > totalPages - 5 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
                onClick={handleJumpForward}
                disabled={currentPage > totalPages - 5}
                title="Go forward 5 pages"
              >
                <FontAwesomeIcon icon={faAngleDoubleRight} className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
