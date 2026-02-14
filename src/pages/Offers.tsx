import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  faRocket,
  faArrowRight,
  faHome,
  faBolt,
  faShieldAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useGetIssuesQuery, useUpdateIssueMutation } from "../features/api/issuesApi";
import { useGetReportsByUserIdQuery } from "../features/api/reportsApi";
import { useGetListingByUserIdQuery } from "../features/api/listingsApi";
import { useGetClientByUserIdQuery } from "../features/api/clientsApi";
import { issueOffersApi, useUpdateOfferMutation } from "../features/api/issueOffersApi";
import { useCreateCheckoutSessionMutation } from "../features/api/stripePaymentsApi";
import { IssueOffer, IssueOfferStatus, IssueType, Listing, Report } from "../types";
import { normalizeAndCapitalize, getIssueTypeIcon } from "../utils/typeNormalizer";
import { buildIssueUpdateBody } from "../utils/issueUpdateHelper";
import { shallowEqual } from "react-redux";
import { toast } from "react-hot-toast";
import confetti from "canvas-confetti";

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
  const navigate = useNavigate();
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: issues = [], isLoading: isLoadingIssues, refetch: refetchIssues } = useGetIssuesQuery();
  const { data: reports = [], isLoading: isLoadingReports } = useGetReportsByUserIdQuery(userId, { skip: !userId });
  const { data: listings = [] } = useGetListingByUserIdQuery(userId, { skip: !userId });
  const { data: client } = useGetClientByUserIdQuery(String(userId ?? ""), { skip: !userId });
  
  const [updateOffer] = useUpdateOfferMutation();
  const [updateIssue] = useUpdateIssueMutation();
  const [createCheckoutSession] = useCreateCheckoutSessionMutation();

  const [paymentVerified, setPaymentVerified] = useState(false);
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const pendingPaymentStr = localStorage.getItem("pending_offer_payment");
    const pendingPayment = pendingPaymentStr ? JSON.parse(pendingPaymentStr) : null;
    
    if (sessionId && !paymentVerified && pendingPayment) {
      setPaymentVerified(true);
      
      (async () => {
        try {
          await updateOffer({
            id: pendingPayment.offer_id,
            issue_id: pendingPayment.issue_id,
            vendor_id: pendingPayment.vendor_id,
            price: pendingPayment.price,
            status: "accepted",
            user_last_viewed: new Date().toISOString(),
            comment_vendor: pendingPayment.comment_vendor || "",
            comment_client: pendingPayment.comment_client || "",
          }).unwrap();
          
          const issueId = Number(pendingPayment.issue_id);
          const issue = issues.find(i => i.id === issueId);
          if (issue) {
            const report = reports.find(r => r.id === issue.report_id);
            const listing = listings.find(l => l.id === report?.listing_id);
            try {
              await updateIssue(buildIssueUpdateBody(issue, { 
                vendor_id: pendingPayment.vendor_id,
                status: "in_progress"
              }, listing?.id)).unwrap();
            } catch {
              // Offer accepted, issue update failed silently
            }
          }
          
          toast.success(`Offer accepted for ${issue?.summary || "issue"}!`);
          localStorage.removeItem("pending_offer_payment");
          refetchIssues();
        } catch {
          toast.error("Payment completed but status update failed. Please refresh.");
        }
        
        searchParams.delete("session_id");
        setSearchParams(searchParams, { replace: true });
      })();
    }
  }, [searchParams, paymentVerified, refetchIssues, setSearchParams, updateOffer, updateIssue, issues, reports, listings]);

  // Read initial filter from URL params
  const initialFilter = (): FilterType => {
    const param = searchParams.get("filter");
    if (param === "review" || param === "in-review") return "in-review";
    if (param === "pending") return "pending";
    if (param === "accepted") return "accepted";
    if (param === "rejected") return "rejected";
    return "all";
  };

  const [filterStatus, setFilterStatus] = useState<FilterType>(initialFilter);
  const [filterProperty, setFilterProperty] = useState<string>("all");
  const [filterIssueType, setFilterIssueType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortType>("date-desc");
  const [visibleCount, setVisibleCount] = useState(10); // Show 10 issues at a time

  // Modal state for issue details
  const [selectedIssue, setSelectedIssue] = useState<{ issue: IssueType; listing?: Listing; defaultTab?: "details" | "offers" | "assessments" } | null>(null);

  // Modal state for approve/request changes
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRequestChangesModal, setShowRequestChangesModal] = useState(false);
  const [selectedIssueForAction, setSelectedIssueForAction] = useState<{ issue: IssueType; listing?: Listing } | null>(null);
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
      const pendingData = {
        offer_id: offer.id,
        issue_id: offer.issue_id,
        vendor_id: offer.vendor_id,
        price: offer.price,
        comment_vendor: offer.comment_vendor || "",
        comment_client: offer.comment_client || "",
      };
      localStorage.setItem("pending_offer_payment", JSON.stringify(pendingData));
      
      const response = await createCheckoutSession({
        client_id: (client?.id ?? userId)!,
        vendor_id: offer.vendor_id,
        offer_id: offer.id,
      }).unwrap();
      window.location.href = response.session_url;
    } catch (err: any) {
      console.error("Stripe error", err);
      localStorage.removeItem("pending_offer_payment");
      const errorDetail = err?.data?.detail || "";
      if (errorDetail.includes("Stripe Information not found")) {
        toast.error("Payment setup required. Add a payment method in Settings (gear icon → Payment Settings), or the vendor may need to complete Stripe setup.");
      } else {
        toast.error("Could not start payment session. Please try again.");
      }
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
      toast.error("Failed to reject offer. Please try again.");
    }
  };

  const handleApproveWork = async () => {
    if (!selectedIssueForAction) return;
    try {
      await updateIssue(buildIssueUpdateBody(selectedIssueForAction.issue, { 
        status: "completed",
        review_status: "completed",
      }, selectedIssueForAction.listing?.id)).unwrap();
      setShowApproveModal(false);
      setSelectedIssueForAction(null);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success(`Work approved for ${selectedIssueForAction.issue.summary || "issue"}!`);
    } catch (err) {
      console.error("Failed to approve work", err);
      toast.error("Failed to approve work. Please try again.");
    }
  };

  const handleRequestChanges = async () => {
    if (!selectedIssueForAction || !changeRequestMessage.trim()) return;
    try {
      await updateIssue(buildIssueUpdateBody(selectedIssueForAction.issue, { status: "in_progress" }, selectedIssueForAction.listing?.id)).unwrap();
      // TODO: Post changeRequestMessage as a comment with "Change Request" flag
      setShowRequestChangesModal(false);
      setSelectedIssueForAction(null);
      setChangeRequestMessage("");
      toast.success("Changes requested! The vendor will be notified.");
    } catch (err) {
      console.error("Failed to request changes", err);
      toast.error("Failed to request changes. Please try again.");
    }
  };

  if (!userId) {
    return <div className="p-6">Please log in to view offers.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-[1600px] mx-auto px-4 py-5 lg:px-8 lg:py-6">
        
        {/* Header - Clean like dashboard */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Offers & Approvals
            </h1>
          </div>

          {/* Stat Cards Row - Only show if user has listings */}
          {listings.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div 
                onClick={() => setFilterStatus("all")}
                className={`bg-white rounded-xl p-5 cursor-pointer border-l-4 border-transparent hover:border-gold hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${filterStatus === 'all' ? 'ring-2 ring-gray-900' : ''}`}
              >
                <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalOffers}</div>
                <div className="text-sm font-semibold text-gray-900">Total Offers</div>
              </div>

              <div 
                onClick={() => setFilterStatus("in-review")}
                className={`bg-white rounded-xl p-5 cursor-pointer border-l-4 border-transparent hover:border-gold hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${filterStatus === 'in-review' ? 'ring-2 ring-gray-900' : ''}`}
              >
                <div className="text-3xl font-bold text-gray-900 mb-1">{stats.inReviewCount}</div>
                <div className="text-sm font-semibold text-gray-900">Awaiting Approval</div>
                {stats.inReviewCount > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-gold">
                    <span className="w-2 h-2 bg-gold rounded-full"></span>
                    Needs action
                  </div>
                )}
              </div>

              <div 
                onClick={() => setFilterStatus("pending")}
                className={`bg-white rounded-xl p-5 cursor-pointer border-l-4 border-transparent hover:border-gold hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${filterStatus === 'pending' ? 'ring-2 ring-gray-900' : ''}`}
              >
                <div className="text-3xl font-bold text-gray-900 mb-1">{stats.pendingOffers}</div>
                <div className="text-sm font-semibold text-gray-900">Pending Quotes</div>
              </div>

              <div 
                onClick={() => setFilterStatus("accepted")}
                className={`bg-white rounded-xl p-5 cursor-pointer border-l-4 border-transparent hover:border-gold hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${filterStatus === 'accepted' ? 'ring-2 ring-gray-900' : ''}`}
              >
                <div className="text-3xl font-bold text-gray-900 mb-1">{stats.acceptedOffers}</div>
                <div className="text-sm font-semibold text-gray-900">Accepted</div>
              </div>
            </div>
          )}
        </div>

        {/* Filters Card - Only show if user has listings */}
        {listings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          {/* Status Tabs */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { value: 'all', label: 'All' },
                { value: 'in-review', label: 'In Review', count: stats.inReviewCount },
                { value: 'pending', label: 'Pending', count: stats.pendingOffers },
                { value: 'accepted', label: 'Accepted', count: stats.acceptedOffers },
                { value: 'rejected', label: 'Rejected' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilterStatus(tab.value as FilterType)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                    filterStatus === tab.value 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-600 hover:bg-foreground hover:text-background'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                      filterStatus === tab.value ? 'bg-gold text-white' : 'bg-gold-200 text-gold-700'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Filters */}
          <div className="px-5 py-3 flex flex-wrap items-center gap-3">
            <select
              value={filterProperty}
              onChange={(e) => setFilterProperty(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="all">All Properties</option>
              {uniqueProperties.map(([id, address]) => (
                <option key={id} value={id}>
                  {address}
                </option>
              ))}
            </select>

            <select
              value={filterIssueType}
              onChange={(e) => setFilterIssueType(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="all">All Issue Types</option>
              {uniqueIssueTypes.map((type) => (
                <option key={type} value={type}>
                  {normalizeAndCapitalize(type)}
                </option>
              ))}
            </select>

            <div className="ml-auto flex items-center gap-2">
              <FontAwesomeIcon icon={faSort} className="text-gray-400 w-4 h-4" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
        )}

      {/* Offers List - One row per issue */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading offers...</h3>
            <p className="text-gray-500">Please wait while we fetch your offers</p>
          </div>
        ) : sortedIssues.length === 0 ? (
          <div className="p-8">
            {filterStatus !== "all" || filterProperty !== "all" || filterIssueType !== "all" ? (
              // Filtered empty state
              <div className="text-center py-8">
                <FontAwesomeIcon
                  icon={faFilter}
                  className="w-12 h-12 text-gray-300 mb-4 mx-auto"
                />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No matching offers</h3>
                <p className="text-gray-500 mb-4">Try adjusting your filters to see more results</p>
                <button
                  onClick={() => {
                    setFilterStatus("all");
                    setFilterProperty("all");
                    setFilterIssueType("all");
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition"
                >
                  Clear all filters
                </button>
              </div>
            ) : listings.length === 0 ? (
              // New user - no properties
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 lg:p-10">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
                  <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/20 text-gold rounded-full text-sm font-medium mb-4">
                      <FontAwesomeIcon icon={faRocket} />
                      Get Started
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                      Ready to receive quotes?
                    </h2>
                    <p className="text-gray-400 text-base mb-6 max-w-lg">
                      Upload your inspection report and post issues to the marketplace. Verified contractors will send you competitive quotes.
                    </p>
                    
                    <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-6">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <FontAwesomeIcon icon={faShieldAlt} className="text-gold" />
                        Verified pros only
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <FontAwesomeIcon icon={faBolt} className="text-gold" />
                        Fast responses
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-gold" />
                        Compare & save
                      </div>
                    </div>
                    
                    <button
                      onClick={() => navigate("/dashboard")}
                      className="inline-flex items-center gap-3 px-6 py-3 bg-gold text-white rounded-xl font-bold text-base hover:bg-foreground hover:text-background transition-all shadow-lg hover:shadow-gold/25 hover:-translate-y-0.5"
                    >
                      <FontAwesomeIcon icon={faHome} />
                      Add Your First Property
                      <FontAwesomeIcon icon={faArrowRight} />
                    </button>
                  </div>
                  
                  {/* Visual illustration */}
                  <div className="hidden lg:flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute -top-2 -left-2 w-36 h-44 bg-gray-700/50 rounded-2xl rotate-6 border border-gray-600/30"></div>
                      <div className="absolute -top-1 -left-1 w-36 h-44 bg-gray-600/50 rounded-2xl rotate-3 border border-gray-500/30"></div>
                      <div className="relative w-36 h-44 bg-white rounded-2xl shadow-2xl flex flex-col items-center justify-center p-4">
                        <div className="w-14 h-14 bg-gold-200 rounded-xl flex items-center justify-center mb-3">
                          <FontAwesomeIcon icon={faClipboardList} className="text-xl text-gold" />
                        </div>
                        <div className="h-2 w-20 bg-gray-200 rounded mb-2"></div>
                        <div className="h-2 w-16 bg-gray-100 rounded mb-2"></div>
                        <div className="h-2 w-12 bg-gray-100 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Has properties but no offers yet
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FontAwesomeIcon icon={faClipboardList} className="text-3xl text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No offers yet</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Once you post issues to the marketplace, contractors will send you quotes. Make sure your issues are visible to vendors.
                </p>
                <button
                  onClick={() => navigate("/listings")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-gray-800 transition"
                >
                  View Your Properties
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {sortedIssues.slice(0, visibleCount).map(({ issue, offers, listing }) => {
                const pendingOffers = offers.filter((o) => o.status === IssueOfferStatus.RECEIVED);
                const acceptedOffer = offers.find((o) => o.status === IssueOfferStatus.ACCEPTED);
                const isInReview = issue.status === "Status.REVIEW";
                const isCompleted = (issue.status || "").toUpperCase().includes("COMPLETED");
                const lowestPendingOffer = pendingOffers.length > 0 
                  ? pendingOffers.reduce((min, o) => (o.price || 0) < (min.price || 0) ? o : min, pendingOffers[0])
                  : null;

                return (
                  <div
                    key={issue.id}
                    className="flex items-center justify-between px-5 py-4 border-l-4 border-transparent hover:border-gold hover:bg-gray-50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                    onClick={() => setSelectedIssue({ issue, listing, defaultTab: "offers" })}
                  >
                    {/* Left side - Issue info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        issue.severity === 'high' ? 'bg-red-100' :
                        issue.severity === 'medium' ? 'bg-gold-200' : 'bg-gray-100'
                      }`}>
                        <FontAwesomeIcon 
                          icon={getIssueTypeIcon(issue.type)} 
                          className={
                            issue.severity === 'high' ? 'text-red-600' :
                            issue.severity === 'medium' ? 'text-gold' : 'text-gray-600'
                          } 
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 truncate">
                          {issue.summary || `${normalizeAndCapitalize(issue.type)} Issue`}
                        </div>
                        {listing && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3" />
                            <span className="truncate">{listing.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right side - Price, count, action */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {/* Show price and quote count */}
                      {isCompleted && acceptedOffer ? (
                        <div className="text-right min-w-[80px]">
                          <div className="text-lg font-bold text-gray-900">${acceptedOffer.price.toLocaleString()}</div>
                          <div className="text-xs text-emerald-600">Completed</div>
                        </div>
                      ) : isInReview && acceptedOffer ? (
                        <div className="text-right min-w-[80px]">
                          <div className="text-lg font-bold text-gray-900">${acceptedOffer.price.toLocaleString()}</div>
                          <div className="text-xs text-gold">Work completed</div>
                        </div>
                      ) : lowestPendingOffer ? (
                        <div className="text-right min-w-[80px]">
                          <div className="text-lg font-bold text-gray-900">${lowestPendingOffer.price.toLocaleString()}</div>
                          {pendingOffers.length > 1 && (
                            <div className="text-xs text-gray-500">{pendingOffers.length} quotes</div>
                          )}
                        </div>
                      ) : acceptedOffer ? (
                        <div className="text-right min-w-[80px]">
                          <div className="text-lg font-bold text-gray-900">${acceptedOffer.price.toLocaleString()}</div>
                          <div className="text-xs text-emerald-600">Accepted</div>
                        </div>
                      ) : null}

                      {/* Action button - only positive actions */}
                      {isInReview && acceptedOffer ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIssueForAction({ issue, listing });
                            setShowApproveModal(true);
                          }}
                          className="min-w-[90px] px-4 py-2 bg-gold text-white text-sm font-semibold rounded-lg hover:bg-foreground hover:text-background transition-colors text-center"
                        >
                          Approve
                        </button>
                      ) : pendingOffers.length === 1 && !acceptedOffer ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptOffer(pendingOffers[0]);
                          }}
                          className="min-w-[90px] px-4 py-2 bg-gold text-white text-sm font-semibold rounded-lg hover:bg-foreground hover:text-background transition-colors text-center"
                        >
                          Accept
                        </button>
                      ) : acceptedOffer ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIssue({ issue, listing, defaultTab: "offers" });
                          }}
                          className="min-w-[90px] px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors text-center"
                        >
                          View
                        </button>
                      ) : pendingOffers.length > 1 ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIssue({ issue, listing, defaultTab: "offers" });
                          }}
                          className="min-w-[90px] px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors text-center"
                        >
                          Compare
                        </button>
                      ) : (
                        <button
                          className="min-w-[90px] px-4 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-lg text-center"
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {visibleCount < sortedIssues.length && (
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 10)}
                  className="w-full py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Load more ({sortedIssues.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
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
                <div className="bg-gold-50 border border-gold-200 rounded-lg p-3">
                  <p className="text-xs text-gold-700 font-medium flex items-start gap-2">
                    <svg className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="flex items-center justify-center w-10 h-10 bg-gold-200 rounded-full flex-shrink-0">
                <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
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
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold bg-gold hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              key={`${selectedIssue.issue.id}-${selectedIssue.defaultTab}`}
              issue={(issues || []).find(i => i.id === selectedIssue.issue.id) ?? selectedIssue.issue}
              listing={selectedIssue.listing}
              onClose={() => setSelectedIssue(null)}
              defaultTab={selectedIssue.defaultTab || "details"}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Offers;
