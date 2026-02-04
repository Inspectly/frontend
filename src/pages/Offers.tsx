import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import HomeownerIssueCard from "../components/HomeownerIssueCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Use a unique key to avoid any conflicts
const SUBS_KEY = '__INSPECTLY_OFFER_SUBS__';

// Helper to get/create the global subscriptions map (survives HMR)
const getGlobalSubscriptions = (): Map<number, any> => {
  const w = window as any;
  if (!w[SUBS_KEY]) {
    w[SUBS_KEY] = new Map<number, any>();
  }
  return w[SUBS_KEY];
};
import {
  faFilter,
  faSort,
  faCheckCircle,
  faTimesCircle,
  faClipboardList,
  faMapMarkerAlt,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { useGetIssuesQuery, useUpdateIssueMutation } from "../features/api/issuesApi";
import { useGetReportsByUserIdQuery } from "../features/api/reportsApi";
import { useGetListingByUserIdQuery } from "../features/api/listingsApi";
import { issueOffersApi, useUpdateOfferMutation } from "../features/api/issueOffersApi";
import { useCreateCheckoutSessionMutation } from "../features/api/stripePaymentsApi";
import { IssueOffer, IssueOfferStatus, IssueType, Listing, Report } from "../types";
import VendorName from "../components/VendorName";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";
import { shallowEqual } from "react-redux";

type FilterType = "all" | "pending" | "accepted" | "rejected" | "in-review";
type SortType = "date-desc" | "date-asc" | "price-low" | "price-high";

interface IssueWithOffers {
  issue: IssueType;
  offers: IssueOffer[];
  report?: Report;
  listing?: Listing;
}

const Offers: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const userId = useSelector((state: RootState) => state.auth.user?.id);

  const { data: issues = [], isLoading: isLoadingIssues } = useGetIssuesQuery();
  const { data: reports = [], isLoading: isLoadingReports } = useGetReportsByUserIdQuery(userId, { skip: !userId });
  const { data: listings = [] } = useGetListingByUserIdQuery(userId, { skip: !userId });
  
  const [updateOffer] = useUpdateOfferMutation();
  const [updateIssue] = useUpdateIssueMutation();
  const [createCheckoutSession] = useCreateCheckoutSessionMutation();

  const [filterStatus, setFilterStatus] = useState<FilterType>("all");
  const [filterProperty, setFilterProperty] = useState<string>("all");
  const [filterIssueType, setFilterIssueType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortType>("date-desc");

  // Modal state for issue details
  const [selectedIssue, setSelectedIssue] = useState<{ issue: IssueType; listing?: Listing } | null>(null);

  // Modal state for approve/request changes
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRequestChangesModal, setShowRequestChangesModal] = useState(false);
  const [selectedIssueForAction, setSelectedIssueForAction] = useState<IssueType | null>(null);
  const [changeRequestMessage, setChangeRequestMessage] = useState("");

  // Get user's issues
  const userIssues = useMemo(() => {
    const userReportIds = reports.filter((r) => r.user_id === userId).map((r) => r.id);
    return issues.filter((issue) => userReportIds.includes(issue.report_id));
  }, [issues, reports, userId]);

  // Trigger fetches for issues that don't have cached data
  const issueIdsKey = userIssues.map(i => i.id).sort().join(',');
  
  useEffect(() => {
    if (isLoadingIssues || isLoadingReports || userIssues.length === 0) return;
    
    const subs = getGlobalSubscriptions();
    
    // Check which issues already have subscriptions
    const issuesNeedingSubscription = userIssues.filter(
      issue => !subs.has(issue.id)
    );
    
    if (issuesNeedingSubscription.length === 0) return;
    
    // Trigger fetches for all issues (RTK Query will use cache if available)
    issuesNeedingSubscription.forEach((issue) => {
      const subscription = dispatch(
        issueOffersApi.endpoints.getOffersByIssueId.initiate(issue.id, {
          subscribe: true,
          forceRefetch: false,
        })
      );
      subs.set(issue.id, subscription);
    });
    
    // NO cleanup! Subscriptions persist at module level
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueIdsKey, dispatch, isLoadingIssues, isLoadingReports]);

  // Access offers directly from Redux cache (synchronous and FAST!)
  const offersByIssueId = useSelector((state: RootState) => {
    if (userIssues.length === 0) return {};
    
    const offersMap: Record<number, IssueOffer[]> = {};
    
    // Read directly from cache - synchronous operation
    userIssues.forEach((issue) => {
      const select = issueOffersApi.endpoints.getOffersByIssueId.select(issue.id);
      const result = select(state);
      
      if (result.data) {
        offersMap[issue.id] = result.data;
      }
    });
    
    return offersMap;
  }, shallowEqual); // Use shallowEqual to prevent unnecessary rerenders

  // Check if any offers are still loading
  const loadingStates = useSelector((state: RootState) => {
    return userIssues.map((issue) => {
      const select = issueOffersApi.endpoints.getOffersByIssueId.select(issue.id);
      const result = select(state);
      return result.isLoading;
    });
  }, shallowEqual);
  
  const isFetchingOffers = loadingStates.some(loading => loading);
  const isLoading = isLoadingIssues || isLoadingReports || isFetchingOffers;

  // Combine issues with their offers, reports, and listings
  const issuesWithOffers: IssueWithOffers[] = useMemo(() => {
    return userIssues
      .map((issue) => {
        const offers = offersByIssueId[issue.id] || [];
        const report = reports.find((r) => r.id === issue.report_id);
        const listing = listings.find((l) => l.id === report?.listing_id);
        return { issue, offers, report, listing };
      })
      .filter((item) => item.offers.length > 0); // Only show issues with offers
  }, [userIssues, offersByIssueId, reports, listings]);

  // Get unique properties and issue types for filters
  const uniqueProperties = useMemo(() => {
    const props = new Map<number, string>();
    issuesWithOffers.forEach(({ listing }) => {
      if (listing) {
        props.set(listing.id, listing.address);
      }
    });
    return Array.from(props.entries());
  }, [issuesWithOffers]);

  const uniqueIssueTypes = useMemo(() => {
    const types = new Set<string>();
    issuesWithOffers.forEach(({ issue }) => {
      types.add(issue.type);
    });
    return Array.from(types);
  }, [issuesWithOffers]);

  // Apply filters
  const filteredIssues = useMemo(() => {
    return issuesWithOffers.filter(({ issue, offers, listing }) => {
      // Filter by status
      if (filterStatus !== "all") {
        // Handle "in-review" filter separately (it's an issue status, not offer status)
        if (filterStatus === "in-review") {
          if (issue.status !== "Status.REVIEW") return false;
        } else {
          // Map filter status to actual enum values
          const statusMap: Record<string, string> = {
            "pending": IssueOfferStatus.RECEIVED,
            "accepted": IssueOfferStatus.ACCEPTED,
            "rejected": IssueOfferStatus.REJECTED,
          };
          const targetStatus = statusMap[filterStatus];
          const hasMatchingStatus = offers.some((o) => o.status === targetStatus);
          if (!hasMatchingStatus) return false;
        }
      }

      // Filter by property
      if (filterProperty !== "all" && listing?.id !== Number(filterProperty)) {
        return false;
      }

      // Filter by issue type
      if (filterIssueType !== "all" && issue.type !== filterIssueType) {
        return false;
      }

      return true;
    });
  }, [issuesWithOffers, filterStatus, filterProperty, filterIssueType]);

  // Apply sorting - items needing client action at top, then by selected sort
  const sortedIssues = useMemo(() => {
    return [...filteredIssues].sort((a, b) => {
      // Check if issues need client action
      const aHasPending = a.offers.some((o) => o.status === IssueOfferStatus.RECEIVED);
      const bHasPending = b.offers.some((o) => o.status === IssueOfferStatus.RECEIVED);
      const aInReview = a.issue.status === "Status.REVIEW";
      const bInReview = b.issue.status === "Status.REVIEW";
      
      // Prioritize: issues in review first (vendor completed work), then pending offers
      const aNeedsAction = aInReview || aHasPending;
      const bNeedsAction = bInReview || bHasPending;
      
      if (aNeedsAction && !bNeedsAction) return -1;
      if (!aNeedsAction && bNeedsAction) return 1;
      
      // Within action-needed items, review items come before pending offers
      if (aNeedsAction && bNeedsAction) {
        if (aInReview && !bInReview) return -1;
        if (!aInReview && bInReview) return 1;
      }
      
      // Then apply selected sort order
      if (sortBy === "date-desc" || sortBy === "date-asc") {
        const aDate = Math.max(...a.offers.map((o) => new Date(o.created_at).getTime()));
        const bDate = Math.max(...b.offers.map((o) => new Date(o.created_at).getTime()));
        return sortBy === "date-desc" ? bDate - aDate : aDate - bDate;
      } else if (sortBy === "price-low" || sortBy === "price-high") {
        const aPrice = Math.min(...a.offers.map((o) => o.price));
        const bPrice = Math.min(...b.offers.map((o) => o.price));
        return sortBy === "price-low" ? aPrice - bPrice : bPrice - aPrice;
      }
      return 0;
    });
  }, [filteredIssues, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    let totalOffers = 0;
    let pendingOffers = 0;
    let acceptedOffers = 0;
    let inReviewCount = 0;

    issuesWithOffers.forEach(({ issue, offers }) => {
      totalOffers += offers.length;
      pendingOffers += offers.filter((o) => o.status === IssueOfferStatus.RECEIVED).length;
      acceptedOffers += offers.filter((o) => o.status === IssueOfferStatus.ACCEPTED).length;
      if (issue.status === "Status.REVIEW") {
        inReviewCount++;
      }
    });

    return { totalOffers, pendingOffers, acceptedOffers, inReviewCount };
  }, [issuesWithOffers]);

  const handleAcceptOffer = async (offer: IssueOffer) => {
    try {
      const response = await createCheckoutSession({
        client_id: userId!,
        vendor_id: offer.vendor_id,
        offer_id: offer.id,
      }).unwrap();
      window.location.href = response.session_url;
    } catch (err) {
      console.error("Stripe error", err);
      alert("Could not start payment session. Please try again.");
    }
  };

  const handleRejectOffer = async (offer: IssueOffer) => {
    try {
      await updateOffer({
        id: offer.id,
        issue_id: offer.issue_id,
        vendor_id: offer.vendor_id,
        price: offer.price,
        status: "rejected",
        user_last_viewed: new Date().toISOString(),
        comment_vendor: offer.comment_vendor || "",
        comment_client: offer.comment_client || "",
      }).unwrap();
      
      // Refresh offers in cache
      await dispatch(
        issueOffersApi.endpoints.getOffersByIssueId.initiate(offer.issue_id, { 
          forceRefetch: true,
          subscribe: false 
        })
      );
    } catch (err) {
      console.error("Failed to reject offer", err);
      alert("Failed to reject offer. Please try again.");
    }
  };

  const handleApproveWork = async () => {
    if (!selectedIssueForAction) return;
    try {
      await updateIssue({
        ...selectedIssueForAction,
        status: "completed",
      }).unwrap();
      setShowApproveModal(false);
      setSelectedIssueForAction(null);
    } catch (err) {
      console.error("Failed to approve work", err);
      alert("Failed to approve work. Please try again.");
    }
  };

  const handleRequestChanges = async () => {
    if (!selectedIssueForAction || !changeRequestMessage.trim()) return;
    try {
      await updateIssue({
        ...selectedIssueForAction,
        status: "in_progress",
      }).unwrap();
      // TODO: Post changeRequestMessage as a comment with "Change Request" flag
      setShowRequestChangesModal(false);
      setSelectedIssueForAction(null);
      setChangeRequestMessage("");
    } catch (err) {
      console.error("Failed to request changes", err);
      alert("Failed to request changes. Please try again.");
    }
  };

  const getStatusBadge = (offerStatus: string, issueStatus?: string) => {
    // If issue is in review, show "In Review" instead of offer status
    if (issueStatus === "Status.REVIEW") {
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded border bg-purple-100 text-purple-800 border-purple-200">
          In Review
        </span>
      );
    }
    
    const badges = {
      [IssueOfferStatus.RECEIVED]: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      [IssueOfferStatus.ACCEPTED]: { label: "Accepted", color: "bg-green-100 text-green-800 border-green-200" },
      [IssueOfferStatus.REJECTED]: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200" },
      [IssueOfferStatus.EXPIRED]: { label: "Expired", color: "bg-gray-100 text-gray-800 border-gray-200" },
    };
    const badge = badges[offerStatus as keyof typeof badges] || badges[IssueOfferStatus.RECEIVED];
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded border ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  if (!userId) {
    return <div className="p-6">Please log in to view offers.</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Offers</h1>
        <p className="text-gray-600">
          Review and manage offers from vendors for your property issues
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Offers</div>
            <FontAwesomeIcon icon={faClipboardList} className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalOffers}</div>
        </div>

        {/* In Review - most urgent, vendor has completed work */}
        <div className={`rounded-xl border p-6 ${stats.inReviewCount > 0 ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Awaiting Approval</div>
            <svg className={`w-5 h-5 ${stats.inReviewCount > 0 ? 'text-purple-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className={`text-3xl font-bold ${stats.inReviewCount > 0 ? 'text-purple-700' : 'text-gray-900'}`}>{stats.inReviewCount}</div>
          {stats.inReviewCount > 0 && (
            <div className="text-xs text-purple-600 mt-1">Work completed - needs your approval</div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Pending Offers</div>
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.pendingOffers}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Accepted</div>
            <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.acceptedOffers}</div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faFilter} className="text-gray-400 w-4 h-4" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterType)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="in-review">In Review</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Property Filter */}
          <select
            value={filterProperty}
            onChange={(e) => setFilterProperty(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Properties</option>
            {uniqueProperties.map(([id, address]) => (
              <option key={id} value={id}>
                {address}
              </option>
            ))}
          </select>

          {/* Issue Type Filter */}
          <select
            value={filterIssueType}
            onChange={(e) => setFilterIssueType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Issue Types</option>
            {uniqueIssueTypes.map((type) => (
              <option key={type} value={type}>
                {normalizeAndCapitalize(type)}
              </option>
            ))}
          </select>

          {/* Sort */}
          <div className="flex items-center gap-2 ml-auto">
            <FontAwesomeIcon icon={faSort} className="text-gray-400 w-4 h-4" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Offers List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading offers...</h3>
            <p className="text-gray-500">Please wait while we fetch your offers</p>
          </div>
        ) : sortedIssues.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FontAwesomeIcon
              icon={faClipboardList}
              className="w-16 h-16 text-gray-300 mb-4 mx-auto"
            />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No offers found</h3>
            <p className="text-gray-500 mb-6">
              {filterStatus !== "all" || filterProperty !== "all" || filterIssueType !== "all"
                ? "Try adjusting your filters"
                : "You don't have any offers yet"}
            </p>
          </div>
        ) : (
          sortedIssues.map(({ issue, offers, listing }) => {
            const pendingOffers = offers.filter((o) => o.status === IssueOfferStatus.RECEIVED);
            const hasAcceptedOffer = offers.some((o) => o.status === IssueOfferStatus.ACCEPTED);

            return (
              <div key={issue.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Issue Header */}
                <div
                  className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedIssue({ issue, listing })}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {normalizeAndCapitalize(issue.type)}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          issue.severity === "high"
                            ? "bg-red-100 text-red-800"
                            : issue.severity === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}>
                          {issue.severity}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {issue.summary || `${normalizeAndCapitalize(issue.type)} Issue`}
                      </h3>
                      {listing && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3" />
                          <span>{listing.address}, {listing.city}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-600">
                        {offers.length} offer{offers.length !== 1 ? "s" : ""}
                      </div>
                      {pendingOffers.length > 0 && (
                        <div className="text-xs text-yellow-600 font-medium">
                          {pendingOffers.length} pending
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Offers Table */}
                <div className="p-4">
                  <div className="space-y-3">
                    {offers.map((offer) => (
                      <div
                        key={offer.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <VendorName
                              vendorId={offer.vendor_id}
                              isVendorId={false}
                              showRating
                            />
                            {getStatusBadge(offer.status, issue.status)}
                          </div>
                          {offer.comment_vendor && (
                            <p className="text-sm text-gray-600 mt-1">
                              "{offer.comment_vendor}"
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Submitted {new Date(offer.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              ${offer.price.toLocaleString()}
                            </div>
                          </div>
                          {/* Pending offers - Accept/Reject buttons */}
                          {offer.status === IssueOfferStatus.RECEIVED && !hasAcceptedOffer && (
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcceptOffer(offer);
                                }}
                                className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                              >
                                <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                                Accept
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectOffer(offer);
                                }}
                                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                              >
                                <FontAwesomeIcon icon={faTimesCircle} className="mr-1" />
                                Reject
                              </button>
                            </div>
                          )}
                          {/* In Review issues - Approve/Revise buttons */}
                          {issue.status === "Status.REVIEW" && offer.status === IssueOfferStatus.ACCEPTED && (
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedIssueForAction(issue);
                                  setShowApproveModal(true);
                                }}
                                className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                              >
                                <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedIssueForAction(issue);
                                  setShowRequestChangesModal(true);
                                }}
                                className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
                              >
                                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Revise
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedIssueForAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowApproveModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Approve Work?</h3>
                <p className="text-sm text-gray-600 mb-3">
                  This will mark the work as complete and finalize the project. Make sure you're satisfied with the work quality before approving.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800 font-medium flex items-start gap-2">
                    <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Once approved, this action cannot be undone.</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button 
                className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 transition-colors" 
                onClick={() => setShowApproveModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold bg-green-600 hover:bg-green-700 transition-colors"
                onClick={handleApproveWork}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revise Modal */}
      {showRequestChangesModal && selectedIssueForAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowRequestChangesModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-amber-100 rounded-full flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Revise</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Describe what needs to be corrected or improved. The vendor will be notified and the work will return to "In Progress".
                </p>
              </div>
            </div>
            
            <textarea
              value={changeRequestMessage}
              onChange={(e) => setChangeRequestMessage(e.target.value)}
              placeholder="Describe what changes are needed..."
              className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            />
            
            <div className="flex justify-end gap-2 mt-4">
              <button 
                className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 transition-colors" 
                onClick={() => {
                  setShowRequestChangesModal(false);
                  setChangeRequestMessage("");
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold bg-amber-600 hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!changeRequestMessage.trim()}
                onClick={handleRequestChanges}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Details Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center">
          <div className="relative w-[1100px] h-[80vh] mx-auto overflow-hidden rounded-2xl shadow-xl bg-white">
            <button
              onClick={() => setSelectedIssue(null)}
              className="absolute -top-10 right-0 text-white text-3xl leading-none px-2"
            >
              &times;
            </button>
            <HomeownerIssueCard
              issue={selectedIssue.issue}
              listing={selectedIssue.listing}
              onClose={() => setSelectedIssue(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Offers;
