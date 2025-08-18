import React, { useState, useEffect, useMemo, useRef } from "react";
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

// Cache utilities with separate namespaces for grouped and ungrouped data
const GROUPED_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (longer for expensive grouping operations)
const UNGROUPED_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (shorter for simpler API data)
const GROUPED_CACHE_PREFIX = 'marketplace_grouped_';
const UNGROUPED_CACHE_PREFIX = 'marketplace_ungrouped_';

interface CacheEntry {
  data: any;
  timestamp: number;
  key: string;
  cacheType: 'grouped' | 'ungrouped';
}

const getGroupedCacheKey = (params: any) => {
  return `${GROUPED_CACHE_PREFIX}${JSON.stringify(params)}`;
};

const getUngroupedCacheKey = (params: any) => {
  return `${UNGROUPED_CACHE_PREFIX}${JSON.stringify(params)}`;
};

const setCache = (key: string, data: any, cacheType: 'grouped' | 'ungrouped' = 'ungrouped') => {
  const entry: CacheEntry = {
    data,
    timestamp: Date.now(),
    key,
    cacheType
  };
  try {
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.warn('Cache storage failed:', error);
  }
};

const getCache = (key: string, cacheType: 'grouped' | 'ungrouped' = 'ungrouped'): { data: any; isExpired: boolean } => {
  try {
    const item = sessionStorage.getItem(key);
    if (!item) return { data: null, isExpired: false };
    
    const entry: CacheEntry = JSON.parse(item);
    const duration = cacheType === 'grouped' ? GROUPED_CACHE_DURATION : UNGROUPED_CACHE_DURATION;
    const isExpired = Date.now() - entry.timestamp > duration;
    
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

const clearCache = (cacheType?: 'grouped' | 'ungrouped' | 'all', pattern?: string) => {
  try {
    const keysToRemove: string[] = [];
    const prefixesToCheck = [];
    
    if (cacheType === 'grouped') {
      prefixesToCheck.push(GROUPED_CACHE_PREFIX);
    } else if (cacheType === 'ungrouped') {
      prefixesToCheck.push(UNGROUPED_CACHE_PREFIX);
    } else {
      // 'all' or undefined - clear both
      prefixesToCheck.push(GROUPED_CACHE_PREFIX, UNGROUPED_CACHE_PREFIX);
    }
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        const matchesPrefix = prefixesToCheck.some(prefix => key.startsWith(prefix));
        if (matchesPrefix) {
          if (!pattern || key.includes(pattern)) {
            keysToRemove.push(key);
          }
        }
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    
    console.log(`🗑️ Cleared ${keysToRemove.length} cache entries for ${cacheType || 'all'} cache(s)`);
  } catch (error) {
    console.warn('Cache clearing failed:', error);
  }
};

const getCacheStats = () => {
  try {
    let groupedCount = 0;
    let ungroupedCount = 0;
    let totalSize = 0;
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        if (key.startsWith(GROUPED_CACHE_PREFIX)) {
          groupedCount++;
        } else if (key.startsWith(UNGROUPED_CACHE_PREFIX)) {
          ungroupedCount++;
        }
        
        if (key.startsWith(GROUPED_CACHE_PREFIX) || key.startsWith(UNGROUPED_CACHE_PREFIX)) {
          const value = sessionStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
      }
    }
    
    return {
      groupedEntries: groupedCount,
      ungroupedEntries: ungroupedCount,
      totalEntries: groupedCount + ungroupedCount,
      estimatedSizeKB: Math.round(totalSize / 1024)
    };
  } catch (error) {
    console.warn('Cache stats failed:', error);
    return { groupedEntries: 0, ungroupedEntries: 0, totalEntries: 0, estimatedSizeKB: 0 };
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
  const [groupingJustToggled, setGroupingJustToggled] = useState(false);
  
  // Cache state
  const [cacheRefreshKey] = useState(0);
  
  // Background grouping state
  const [backgroundGroupingComplete, setBackgroundGroupingComplete] = useState(false);

  // When grouping, always start from page 1 (offset 0)
  // When not grouping, use current page for pagination
  const effectiveCurrentPage = groupByAddress ? 1 : currentPage;
  const offset = (effectiveCurrentPage - 1) * itemsPerPage;

  // When grouping by address, we need ALL issues to group properly
  // When not grouping, we can use pagination at API level
  const apiParams = {
    offset: groupByAddress ? 0 : offset,
    limit: groupByAddress ? 1000 : itemsPerPage, // Fetch more when grouping
    search: searchQuery,
    city: selectedCity,
    state: selectedState,
    type: selectedType,
    vendor_assigned: false, // Only fetch issues assigned to vendors
  };
  
  console.log('🔄 API Call Params:', { 
    currentPage, 
    effectiveCurrentPage,
    offset, 
    groupByAddress, 
    actualApiOffset: apiParams.offset, 
    actualApiLimit: apiParams.limit 
  });
  
  const { data, error, isLoading } = useGetPaginatedIssuesQuery(apiParams);

  const issues = data?.issues || [];
  const totalItems = data?.total_filtered?.count || 0;

  // Sync currentPage state when grouping is toggled
  useEffect(() => {
    if (groupByAddress && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [groupByAddress]);

  const [addresses, setAddresses] = useState<Record<number, IssueAddress>>({});
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [addressesFetching, setAddressesFetching] = useState(false);
  const fetchedAddressIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!issues || issues.length === 0) return;

    const fetchAddresses = async () => {
      try {
        const issueIds = issues.map((issue) => issue.id);
        
        // Only fetch addresses we don't already have
        const missingIssueIds = issueIds.filter(id => !fetchedAddressIds.current.has(id));
        
        console.log('🏠 Fetching addresses for issues:', { 
          totalIssueIds: issueIds.length, 
          missingIssueIds: missingIssueIds.length,
          firstFewIds: issueIds.slice(0, 5),
          lastFewIds: issueIds.slice(-5),
          currentAddressesCount: Object.keys(addresses).length,
          sampleMissing: missingIssueIds.slice(0, 5)
        });
        
        // Skip API call if we already have all addresses
        if (missingIssueIds.length === 0) {
          console.log('🏠 All addresses already cached, skipping fetch');
          setAddressesLoaded(true);
          return;
        }
        
        // Set fetching state at the start
        setAddressesFetching(true);
        setAddressesLoaded(false);
        
        // Batch the address fetching to avoid server limits
        const BATCH_SIZE = 100; // Fetch addresses in batches of 100
        const allAddresses: any[] = [];
        
        for (let i = 0; i < missingIssueIds.length; i += BATCH_SIZE) {
          const batch = missingIssueIds.slice(i, i + BATCH_SIZE);
          console.log(`🏠 Fetching address batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(missingIssueIds.length / BATCH_SIZE)}: ${batch.length} addresses`);
          
          try {
            const batchAddresses = await getAddressesByIssueIds(batch).unwrap();
            allAddresses.push(...batchAddresses);
            console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} completed: ${batchAddresses.length} addresses received`);
          } catch (batchError) {
            console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, batchError);
            // Continue with next batch even if one fails
          }
        }
        
        const addressList = allAddresses;
        
        console.log('🏠 All batches completed:', {
          requestedCount: missingIssueIds.length,
          receivedCount: addressList.length,
          successRate: `${((addressList.length / missingIssueIds.length) * 100).toFixed(1)}%`,
          sampleAddresses: addressList.slice(0, 3).map(a => ({ id: a.issue_id, address: a.address }))
        });
        
        const newAddressMap = Object.fromEntries(
          addressList.map((a) => [a.issue_id, a])
        );
        
        // MERGE with existing addresses instead of replacing
        setAddresses(prev => {
          const merged = { ...prev, ...newAddressMap };
          console.log('🏠 Address map updated:', {
            previousCount: Object.keys(prev).length,
            newCount: Object.keys(newAddressMap).length,
            finalCount: Object.keys(merged).length
          });
          return merged;
        });
        
        // Track which addresses we've fetched
        missingIssueIds.forEach(id => fetchedAddressIds.current.add(id));
        
        // Mark as completed only after ALL batches are done
        setAddressesFetching(false);
        setAddressesLoaded(true);
        
        console.log('🎉 Address fetching completed! All addresses should now be available for grouping.');
      } catch (err) {
        console.error("Failed to fetch batch addresses", err);
      }
    };

    fetchAddresses();
  }, [issues]);

  const isDataReady = !isLoading && issues && addressesLoaded && !addressesFetching;

  // Background grouping effect - precompute grouping when data is ready
  useEffect(() => {
    if (!isDataReady || backgroundGroupingComplete) return;

    // Small delay to not block initial render
    const timeoutId = setTimeout(() => {
      const backgroundCacheKey = getGroupedCacheKey({
        search: searchQuery,
        city: selectedCity,
        state: selectedState,
        type: selectedType,
        issueIds: issues.map(i => i.id).sort(),
        refreshKey: cacheRefreshKey
      });

      const { data: cachedGroups } = getCache(backgroundCacheKey, 'grouped');
      
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
        setCache(backgroundCacheKey, groups, 'grouped');
        
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
    console.log('🔍 Grouping condition check:', { 
      groupByAddress, 
      isDataReady, 
      isLoading, 
      addressesLoaded,
      addressesFetching,
      issuesCount: issues.length,
      unassignedIssuesCount: issues.filter(i => i.vendor_id === null).length,
      currentPage,
      addressesCount: Object.keys(addresses).length,
      sampleIssueIds: issues.slice(0, 3).map(i => i.id)
    });
    
    if (!groupByAddress) {
      // Use ungrouped cache for regular issue filtering
      const ungroupedCacheKey = getUngroupedCacheKey({
        search: searchQuery,
        city: selectedCity,
        state: selectedState,
        type: selectedType,
        issueIds: issues.map(i => i.id).sort(),
        refreshKey: cacheRefreshKey
      });

      const { data: cachedFilteredIssues } = getCache(ungroupedCacheKey, 'ungrouped');
      
      if (cachedFilteredIssues) {
        console.log('📦 Using cached filtered issues from ungrouped cache');
        return { 
          processedIssues: cachedFilteredIssues, 
          allAddressGroups: [] 
        };
      }

      const filteredIssues = issues.filter((issue) => issue.vendor_id === null);
      setCache(ungroupedCacheKey, filteredIssues, 'ungrouped');
      
      console.log(`✅ Cached ${filteredIssues.length} filtered issues to ungrouped cache`);
      
      return { 
        processedIssues: filteredIssues, 
        allAddressGroups: [] 
      };
    }
    
    // When grouping is enabled, wait for data to be ready
    if (!isDataReady) {
      console.log('⏳ Waiting for addresses to load before grouping...');
      return { 
        processedIssues: [], 
        allAddressGroups: [] 
      };
    }

    // Generate cache key for current state
    const cacheKey = getGroupedCacheKey({
      search: searchQuery,
      city: selectedCity,
      state: selectedState,
      type: selectedType,
      issueIds: issues.map(i => i.id).sort(),
      refreshKey: cacheRefreshKey
    });

    // ALWAYS compute fresh groups when grouping is first enabled
    // Only use cache for subsequent re-renders to avoid race conditions
    const { data: cachedGroups, isExpired } = getCache(cacheKey, 'grouped');
    
    // Skip cache if grouping was just toggled (force fresh computation)
    // or if we don't have any cached groups yet (avoids race condition)
    if (cachedGroups && !isExpired && cachedGroups.length > 0 && !groupingJustToggled) {
      console.log('📦 Using cached address groups from grouped cache');
      return {
        processedIssues: [],
        allAddressGroups: cachedGroups
      };
    }
    
    if (isExpired) {
      console.log('⏰ Grouped cache expired, refreshing automatically');
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
    
    // Cache the result in the grouped cache
    setCache(cacheKey, groups, 'grouped');
    
    // Reset the toggle flag since we just computed fresh groups
    if (groupingJustToggled) {
      setGroupingJustToggled(false);
    }
    
    const duration = performance.now() - startTime;
    console.log(`✅ Grouped ${issues.length} issues into ${groups.length} addresses in ${duration.toFixed(2)}ms`);
    
    return { 
      processedIssues: [], // Empty when grouping 
      allAddressGroups: groups
    };
  }, [groupByAddress, isDataReady, issues, addresses, searchQuery, selectedCity, selectedState, selectedType, cacheRefreshKey, groupingJustToggled]);

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
      // For regular view: API handles pagination, just return the issues
      return {
        displayItems: processedIssues,
        totalCount: totalItems
      };
    }
  }, [groupByAddress, allAddressGroups, processedIssues, totalItems, currentPage, itemsPerPage]);

  // Calculate total pages based on current view mode
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Debug logging to verify pagination fix
  const cacheStats = getCacheStats();
  console.log('Marketplace Debug:', {
    groupByAddress,
    apiParams: { 
      offset: groupByAddress ? 0 : offset, 
      limit: groupByAddress ? 1000 : itemsPerPage 
    },
    totalIssues: issues.length,
    totalItemsFromAPI: totalItems,
    processedIssuesCount: processedIssues.length,
    displayItemsCount: displayItems.length,
    totalCount,
    currentPage,
    itemsPerPage,
    totalPages,
    allAddressGroupsCount: allAddressGroups.length,
    paginationRange: groupByAddress ? 
      `Groups ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, allAddressGroups.length)} of ${allAddressGroups.length}` :
      `Issues ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems}`,
    firstDisplayItem: displayItems[0] ? (groupByAddress ? 'Address Group' : 'Issue') : 'None',
    sampleDisplayItem: displayItems[0] ? (groupByAddress ? 
      `Address: ${(displayItems[0] as any).address?.address}, Issues: ${(displayItems[0] as any).issues?.length}` : 
      `Issue: ${(displayItems[0] as any).id}, Type: ${(displayItems[0] as any).type}`
    ) : 'N/A',
    addressLoadingState: {
      addressesLoaded,
      addressesFetching,
      isDataReady,
      totalAddressesLoaded: Object.keys(addresses).length
    },
    cacheStats: {
      ...cacheStats,
      message: `${cacheStats.groupedEntries} grouped + ${cacheStats.ungroupedEntries} ungrouped = ${cacheStats.totalEntries} total (${cacheStats.estimatedSizeKB}KB)`
    }
  });

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
    clearCache('all'); // Clear both caches when search changes
  };

  // Reset background grouping when filters change
  useEffect(() => {
    setBackgroundGroupingComplete(false);
  }, [searchQuery, selectedCity, selectedState, selectedType]);

  // Clear cache when filters change
  useEffect(() => {
    clearCache('all'); // Clear both caches when filters change
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
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
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
                  const newGroupByAddress = e.target.checked;
                  setGroupByAddress(newGroupByAddress);
                  setGroupingJustToggled(true); // Force fresh computation
                  setCurrentPage(1); // Reset to first page when toggling
                  
                  // Smart cache management: don't clear the cache we might want to switch back to
                  // Just let the component handle cache lookup naturally
                  console.log(`🔄 Switched to ${newGroupByAddress ? 'grouped' : 'ungrouped'} view - preserving both caches`);
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

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                className={`flex items-center justify-center h-8 w-8 rounded-lg border-0 font-semibold ${
                  currentPage <= 5 
                    ? "bg-neutral-200 text-gray-400 cursor-not-allowed opacity-50" 
                    : "bg-neutral-200 text-gray-700 hover:bg-neutral-300"
                }`}
                onClick={handleJumpBackward}
                disabled={currentPage <= 5}
                title="Go back 5 pages"
              >
                <FontAwesomeIcon icon={faAngleDoubleLeft} className="text-sm" />
              </button>

              {/* Previous Page */}
              <button
                className={`flex items-center justify-center h-8 w-8 rounded-lg border-0 font-semibold ${
                  currentPage === 1 
                    ? "bg-neutral-200 text-gray-400 cursor-not-allowed opacity-50" 
                    : "bg-neutral-200 text-gray-700 hover:bg-neutral-300"
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
                    className={`flex items-center justify-center h-8 w-8 rounded-lg border-0 font-semibold ${
                      currentPage === page
                        ? "bg-blue-400 text-white"
                        : "bg-neutral-200 text-gray-700 hover:bg-neutral-300"
                    }`}
                    onClick={() => handlePageClick(page)}
                  >
                    {page}
                  </button>
                )
              )}

              {/* Next Page */}
              <button
                className={`flex items-center justify-center h-8 w-8 rounded-lg border-0 font-semibold ${
                  currentPage === totalPages 
                    ? "bg-neutral-200 text-gray-400 cursor-not-allowed opacity-50" 
                    : "bg-neutral-200 text-gray-700 hover:bg-neutral-300"
                }`}
                onClick={handleNext}
                disabled={currentPage === totalPages}
                title="Next page"
              >
                <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
              </button>

              {/* Jump Forward by 5 */}
              <button
                className={`flex items-center justify-center h-8 w-8 rounded-lg border-0 font-semibold ${
                  currentPage > totalPages - 5 
                    ? "bg-neutral-200 text-gray-400 cursor-not-allowed opacity-50" 
                    : "bg-neutral-200 text-gray-700 hover:bg-neutral-300"
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
