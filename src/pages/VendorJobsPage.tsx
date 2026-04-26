import React, { useEffect, useMemo, useState } from "react";
import { PROPERTY_FALLBACK_IMAGE } from "../constants/assets";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBriefcase,
  faCheckCircle,
  faTimesCircle,
  faSearch,
  faChevronDown,
  faPlus,
  faChevronRight,
  faPaperPlane,
  faHourglass,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { IssueOffer, IssueOfferStatus, IssueType, Listing } from "../types";
import { useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";
import { useGetOffersByVendorIdQuery } from "../features/api/issueOffersApi";
import { useGetIssuesQuery } from "../features/api/issuesApi";
import { useGetListingsQuery } from "../features/api/listingsApi";
import { useGetReportsQuery } from "../features/api/reportsApi";
import { useGetAssessmentsByUserIdQuery, useLazyGetAssessmentsByUsersInteractionIdQuery } from "../features/api/issueAssessmentsApi";
import { useLazyGetDisputesByIssueOfferIdQuery } from "../features/api/issueDisputesApi";
import { IssueAssessment, IssueDispute } from "../types";
import { faCalendarAlt } from "@fortawesome/free-regular-svg-icons";
import ImageComponent from "../components/ImageComponent";
import IssueDetails from "../components/IssueDetails";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";
import { parseAsUTC } from "../utils/calendarUtils";

type TabType = "all" | "active" | "completed" | "pending" | "rejected" | "disputed";
type SortBy = "date" | "price" | "status";

// Helper function to check if issue is completed (handles both FE and BE status formats)
const isIssueCompleted = (issueStatus?: string): boolean => {
  if (!issueStatus) return false;
  // Backend might send "completed", "COMPLETED", or frontend might have "Status.COMPLETED"
  const normalizedStatus = issueStatus.toUpperCase();
  return normalizedStatus === "COMPLETED" || normalizedStatus === "STATUS.COMPLETED";
};

const VendorJobsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useSelector((state: RootState) => state.auth.user);
  
  // State - initialize tab from URL if provided
  const initialTab = (searchParams.get("tab") as TabType) || "all";
  const [activeTab, setActiveTab] = useState<TabType>(
    ["all", "active", "completed", "pending", "rejected", "disputed"].includes(initialTab) ? initialTab : "all"
  );
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal state
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);

  // Queries
  useGetVendorByVendorUserIdQuery(String(user?.id), {
    skip: !user?.id,
  });

  // Note: Backend's vendor_id field actually stores vendor_user_id, not vendor table id
  const { data: vendorOffers = [], isLoading } = useGetOffersByVendorIdQuery(
    Number(user?.id),  // Use user.id, not vendor.id
    { skip: !user?.id }
  );
  const { data: issues = [] } = useGetIssuesQuery();
  const { data: listings = [] } = useGetListingsQuery();
  const { data: reports = [] } = useGetReportsQuery();
  const { data: vendorAssessments = [] } = useGetAssessmentsByUserIdQuery(
    user?.id || 0,
    { skip: !user?.id }
  );
  const [fetchAssessmentsByInteraction] = useLazyGetAssessmentsByUsersInteractionIdQuery();
  const [fetchDisputesByOfferId] = useLazyGetDisputesByIssueOfferIdQuery();

  // State to hold ALL assessments (including client counter-proposals)
  const [allAssessments, setAllAssessments] = useState<IssueAssessment[]>([]);

  // Track which offer IDs have disputes
  const [disputedOfferIds, setDisputedOfferIds] = useState<Set<number>>(new Set());

  // Get unique interaction IDs from vendor's assessments
  const uniqueInteractionIds = useMemo(() => {
    return [...new Set(vendorAssessments.map(a => a.users_interaction_id).filter(Boolean))].sort();
  }, [vendorAssessments]);
  
  const interactionIdsKey = uniqueInteractionIds.join(",");

  // Fetch all assessments for each interaction ID (to include client counter-proposals)
  useEffect(() => {
    let isMounted = true;
    
    const fetchAll = async () => {
      if (uniqueInteractionIds.length === 0) {
        if (isMounted) setAllAssessments(vendorAssessments);
        return;
      }
      
      try {
        const results = await Promise.all(
          uniqueInteractionIds.map(id => fetchAssessmentsByInteraction(id).unwrap())
        );
        
        if (!isMounted) return;
        
        const allResults = results.flat();
        const uniqueAssessments = Array.from(
          new Map(allResults.map(a => [a.id, a])).values()
        ) as IssueAssessment[];
        
        setAllAssessments(uniqueAssessments);
      } catch (err) {
        console.error("Failed to fetch all assessments:", err);
        if (isMounted) setAllAssessments(vendorAssessments);
      }
    };
    
    fetchAll();
    
    return () => { isMounted = false; };
    // Note: fetchAssessmentsByInteraction is a stable RTK Query hook, not included to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactionIdsKey]);

  // Fetch disputes for all offers to identify disputed jobs
  const allOfferIds = useMemo(() => {
    return vendorOffers.map((o) => o.id);
  }, [vendorOffers]);

  const allOfferIdsKey = allOfferIds.join(",");

  useEffect(() => {
    let isMounted = true;

    const fetchDisputes = async () => {
      if (allOfferIds.length === 0) {
        if (isMounted) setDisputedOfferIds(new Set());
        return;
      }

      try {
        const results = await Promise.all(
          allOfferIds.map((id) =>
            fetchDisputesByOfferId(id)
              .unwrap()
              .then((disputes) => ({ offerId: id, disputes }))
              .catch(() => ({ offerId: id, disputes: [] as IssueDispute[] }))
          )
        );

        if (!isMounted) return;

        const idsWithDisputes = new Set(
          results
            .filter((r) => r.disputes.length > 0)
            .map((r) => r.offerId)
        );
        setDisputedOfferIds(idsWithDisputes);
      } catch {
        if (isMounted) setDisputedOfferIds(new Set());
      }
    };

    fetchDisputes();

    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allOfferIdsKey]);

  // Create maps for quick lookups
  const issuesMap = useMemo(() => {
    return issues.reduce((acc, issue) => {
      acc[issue.id] = issue;
      return acc;
    }, {} as Record<number, IssueType>);
  }, [issues]);

  const reportsMap = useMemo(() => {
    return reports.reduce((acc, report) => {
      acc[report.id] = report;
      return acc;
    }, {} as Record<number, any>);
  }, [reports]);

  const listingsMap = useMemo(() => {
    return listings.reduce((acc, listing) => {
      acc[listing.id] = listing;
      return acc;
    }, {} as Record<number, Listing>);
  }, [listings]);

  // Map assessments by issue_id with status context (uses allAssessments to include client counter-proposals)
  const assessmentInfoByIssueId = useMemo(() => {
    const now = new Date();
    const result: Record<number, {
      assessment: IssueAssessment;
      status: "confirmed" | "proposed" | "action_required";
    }> = {};

    // Group assessments by issue_id first
    const groupedByIssue: Record<number, IssueAssessment[]> = {};
    allAssessments.forEach(assessment => {
      if (!assessment.issue_id) return;
      if (!groupedByIssue[assessment.issue_id]) {
        groupedByIssue[assessment.issue_id] = [];
      }
      groupedByIssue[assessment.issue_id].push(assessment);
    });

    // Process each issue's assessments
    Object.entries(groupedByIssue).forEach(([issueIdStr, assessments]) => {
      const issueId = Number(issueIdStr);
      
      // Check for accepted assessment
      const acceptedAssessment = assessments.find(a => {
        const status = (a.status as string)?.toLowerCase() || "";
        return status === "accepted" || status.includes("accepted");
      });

      if (acceptedAssessment) {
        const startTime = parseAsUTC(acceptedAssessment.start_time);
        if (startTime > now) {
          result[issueId] = { assessment: acceptedAssessment, status: "confirmed" };
        }
        return;
      }

      // Check for pending assessments
      const pendingAssessments = assessments.filter(a => {
        const status = (a.status as string)?.toLowerCase() || "";
        return status === "received" || status.includes("received");
      });

      if (pendingAssessments.length === 0) return;

      // Check if client has counter-proposed (assessment from someone other than vendor)
      const clientProposals = pendingAssessments.filter(a => a.user_type === "client");
      const vendorProposals = pendingAssessments.filter(a => a.user_type === "vendor");

      if (clientProposals.length > 0) {
        // Client has counter-proposed - action required
        const earliestClientProposal = clientProposals.sort(
          (a, b) => parseAsUTC(a.start_time).getTime() - parseAsUTC(b.start_time).getTime()
        )[0];
        result[issueId] = { assessment: earliestClientProposal, status: "action_required" };
      } else if (vendorProposals.length > 0) {
        // Only vendor proposals - pending
        const earliestVendorProposal = vendorProposals.sort(
          (a, b) => parseAsUTC(a.start_time).getTime() - parseAsUTC(b.start_time).getTime()
        )[0];
        const startTime = parseAsUTC(earliestVendorProposal.start_time);
        if (startTime > now) {
          result[issueId] = { assessment: earliestVendorProposal, status: "proposed" };
        }
      }
    });

    return result;
  }, [allAssessments]);

  // Selected issue for modal
  const selectedIssue = selectedIssueId ? issuesMap[selectedIssueId] : null;
  const selectedIssueReport = selectedIssue ? reportsMap[selectedIssue.report_id] : null;
  const selectedIssueListing = selectedIssueReport ? listingsMap[selectedIssueReport.listing_id] : undefined;

  // Modal functions
  const openIssueModal = (issueId: number) => {
    setSelectedIssueId(issueId);
  };

  const closeIssueModal = () => {
    setSelectedIssueId(null);
  };

  // Filter and sort offers
  const filteredOffers = useMemo(() => {
    let filtered = [...vendorOffers];

    // Filter by tab
    if (activeTab === "active") {
      // Active: Accepted offers that are NOT completed
      filtered = filtered.filter((offer) => {
        if (offer.status !== IssueOfferStatus.ACCEPTED) return false;
        const issue = issuesMap[offer.issue_id];
        return !isIssueCompleted(issue?.status);
      });
    } else if (activeTab === "completed") {
      // Completed: any offer where the issue is completed, excluding disputed
      filtered = filtered.filter((offer) => {
        const issue = issuesMap[offer.issue_id];
        return isIssueCompleted(issue?.status) && !disputedOfferIds.has(offer.id);
      });
    } else if (activeTab === "pending") {
      filtered = filtered.filter((offer) => {
        if (offer.status !== IssueOfferStatus.RECEIVED) return false;
        const issue = issuesMap[offer.issue_id];
        return !isIssueCompleted(issue?.status);
      });
    } else if (activeTab === "rejected") {
      filtered = filtered.filter((offer) => offer.status === IssueOfferStatus.REJECTED);
    } else if (activeTab === "disputed") {
      filtered = filtered.filter((offer) => disputedOfferIds.has(offer.id));
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((offer) => {
        const issue = issuesMap[offer.issue_id];
        const searchLower = searchQuery.toLowerCase();
        return (
          issue?.type?.toLowerCase().includes(searchLower) ||
          issue?.summary?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === "price") {
        return (b.price || 0) - (a.price || 0);
      } else if (sortBy === "status") {
        // Priority-based status sorting (most urgent first)
        const getPriority = (offer: IssueOffer): number => {
          if (offer.status === IssueOfferStatus.RECEIVED) return 1; // Pending - highest priority
          if (offer.status === IssueOfferStatus.ACCEPTED) {
            const issue = issuesMap[offer.issue_id];
            const issueStatus = issue?.status?.toUpperCase() || "";
            if (issueStatus.includes("IN_PROGRESS")) return 2; // Active work
            if (issueStatus.includes("REVIEW")) return 3; // Waiting on client
            if (issueStatus.includes("COMPLETED")) return 4; // Done
            return 2; // Default to active if status unclear
          }
          if (offer.status === IssueOfferStatus.REJECTED) return 5; // Rejected - lowest priority
          return 6; // Unknown status
        };
        
        const priorityA = getPriority(a);
        const priorityB = getPriority(b);
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB; // Lower number = higher priority
        }
        
        // If same priority, sort by date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });

    return filtered;
  }, [vendorOffers, activeTab, searchQuery, sortBy, issuesMap, disputedOfferIds]);

  // Calculate statistics
  const stats = useMemo(() => {
    const acceptedOffers = vendorOffers.filter((o) => o.status === IssueOfferStatus.ACCEPTED);
    
    // Separate active and completed based on issue status
    const active = acceptedOffers.filter((offer) => {
      const issue = issuesMap[offer.issue_id];
      return !isIssueCompleted(issue?.status);
    });
    
    const completed = vendorOffers.filter((offer) => {
      const issue = issuesMap[offer.issue_id];
      return isIssueCompleted(issue?.status) && !disputedOfferIds.has(offer.id);
    });
    
    const pending = vendorOffers.filter((o) => {
      if (o.status !== IssueOfferStatus.RECEIVED) return false;
      const issue = issuesMap[o.issue_id];
      return !isIssueCompleted(issue?.status);
    });
    const rejected = vendorOffers.filter((o) => o.status === IssueOfferStatus.REJECTED);
    const disputed = vendorOffers.filter((o) => disputedOfferIds.has(o.id));

    const activeRevenue = active.reduce((sum, offer) => sum + (offer.price || 0), 0);
    const completedRevenue = completed.reduce((sum, offer) => sum + (offer.price || 0), 0);
    const potentialRevenue = pending.reduce((sum, offer) => sum + (offer.price || 0), 0);

    return {
      activeCount: active.length,
      completedCount: completed.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      disputedCount: disputed.length,
      activeRevenue,
      completedRevenue,
      totalRevenue: activeRevenue + completedRevenue,
      potentialRevenue,
      totalOffers: vendorOffers.length,
    };
  }, [vendorOffers, issuesMap, disputedOfferIds]);


  const getOfferStatusBadge = (offer: IssueOffer, issueStatus?: string) => {
    // Show disputed badge if offer has a dispute
    if (disputedOfferIds.has(offer.id)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-orange-50 text-orange-600 border border-orange-200">
          <FontAwesomeIcon icon={faTimesCircle} className="w-3 h-3" />
          Disputed
        </span>
      );
    }

    // Determine the appropriate status based on offer and issue status
    if (offer.status === IssueOfferStatus.REJECTED) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-red-50 text-red-600 border border-red-200">
          <FontAwesomeIcon icon={faTimesCircle} className="w-3 h-3" />
          Rejected
        </span>
      );
    }
    
    if (offer.status === IssueOfferStatus.ACCEPTED) {
      // Check if work is completed (client approved)
      if (isIssueCompleted(issueStatus)) {
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
            <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
            Completed
          </span>
        );
      }
      // Check if awaiting approval (issue in review)
      if (issueStatus?.toUpperCase().includes("REVIEW")) {
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
            <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
            Awaiting Approval
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-600 border border-blue-200">
          <FontAwesomeIcon icon={faHourglass} className="w-3 h-3" />
          Work in Progress
        </span>
      );
    }
    
    // RECEIVED - Bid sent, awaiting response
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-gold-100 text-gold-700 border border-gold-200">
        <FontAwesomeIcon icon={faPaperPlane} className="w-3 h-3" />
        Bid Sent
      </span>
    );
  };


  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">My Jobs</h1>
          <p className="text-gray-500">
            Manage your jobs and track pending offers.
          </p>
        </div>
        <button
          onClick={() => navigate("/marketplace")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-white font-semibold rounded-lg hover:bg-foreground hover:text-background transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
          Find Jobs
          <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
        {/* Tabs */}
        <div className="flex gap-1 flex-wrap">
          {(["all", "active", "completed", "pending", "rejected", "disputed"] as TabType[]).map((tab) => {
            const count = tab === "active" ? stats.activeCount
              : tab === "completed" ? stats.completedCount
              : tab === "pending" ? stats.pendingCount
              : tab === "rejected" ? stats.rejectedCount
              : tab === "disputed" ? stats.disputedCount
              : null;
            
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  activeTab === tab
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-foreground hover:text-background"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {count !== null && (
                  <span className={`ml-1.5 ${activeTab === tab ? 'text-white/70' : 'text-gold font-semibold'}`}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
          />
          <input
            type="text"
            placeholder="Search by issue type or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-gold focus:border-transparent text-sm"
          />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent appearance-none bg-white text-sm font-medium text-gray-700 cursor-pointer"
          >
            <option value="date">Sort by Date</option>
            <option value="price">Sort by Price</option>
            <option value="status">Sort by Priority</option>
          </select>
          <FontAwesomeIcon
            icon={faChevronDown}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none"
          />
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        {filteredOffers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FontAwesomeIcon
              icon={faBriefcase}
              className="w-16 h-16 text-gray-300 mb-4 mx-auto"
            />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? "No jobs found" : "No jobs yet"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "Start bidding on projects to see them here"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate("/marketplace")}
                className="px-6 py-3 bg-gold text-white font-medium rounded-lg hover:bg-foreground hover:text-background transition-colors"
              >
                Browse Opportunities
              </button>
            )}
          </div>
        ) : (
          filteredOffers.map((offer) => {
            const issue = issuesMap[offer.issue_id];
            const report = issue ? reportsMap[issue.report_id] : null;
            const listing = report ? listingsMap[report.listing_id] : null;

            return (
              <div
                key={offer.id}
                onClick={() => openIssueModal(offer.issue_id)}
                className="group bg-white rounded-xl border border-gray-200 p-4 border-l-4 border-l-transparent hover:border-l-gold hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                <div className="flex gap-4">
                  {/* Property Thumbnail */}
                  <div className="w-24 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <ImageComponent
                      src={issue?.image_urls || listing?.image_url}
                      fallback={PROPERTY_FALLBACK_IMAGE}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {issue?.summary || `${normalizeAndCapitalize(issue?.type || "")} Issue`}
                      </h3>
                      <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600 border border-gray-200">
                        {normalizeAndCapitalize(issue?.type || "General")}
                      </span>
                    </div>
                    
                    {/* Only show address for accepted offers */}
                    {offer.status === IssueOfferStatus.ACCEPTED && listing && (
                      <p className="text-sm text-gray-600 mb-2">
                        {listing.address}, {listing.city}, {listing.state}
                      </p>
                    )}

                    {/* Show assessment status if exists */}
                    {assessmentInfoByIssueId[offer.issue_id] && (() => {
                      const info = assessmentInfoByIssueId[offer.issue_id];
                      const dateStr = parseAsUTC(info.assessment.start_time).toLocaleDateString("en-US", { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      });
                      
                      if (info.status === "confirmed") {
                        return (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                            <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3" />
                            Visit: {dateStr}
                          </div>
                        );
                      } else if (info.status === "action_required") {
                        // Client has counter-proposed - show their proposed time
                        return (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gold-50 text-gold-700 rounded-full text-xs font-medium border border-gold-200">
                            <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3" />
                            Client proposed: {dateStr}
                          </div>
                        );
                      } else {
                        // Vendor's proposal awaiting response
                        return (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3" />
                            Proposed: {dateStr}
                          </div>
                        );
                      }
                    })()}
                  </div>

                  {/* Price & Status */}
                  <div className="flex flex-col items-end justify-between flex-shrink-0 gap-2">
                    <div className="flex items-center gap-3">
                      <div className="text-xl font-bold text-gray-900">
                        ${offer.price?.toLocaleString() || 0}
                      </div>
                      {getOfferStatusBadge(offer, issue?.status)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Submitted {new Date(offer.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                </div>

                {/* Client feedback for rejected offers */}
                {offer.status === IssueOfferStatus.REJECTED && offer.comment_client && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">
                      <span className="font-medium">Client feedback:</span>{" "}
                      {offer.comment_client}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Issue Details Modal */}
      {selectedIssueId && selectedIssue && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={closeIssueModal}
          />
          
          {/* Modal Content */}
          <div className="relative min-h-screen flex items-start justify-center p-4 pt-16">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={closeIssueModal}
                className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-gray-600" />
              </button>
              
              {/* Issue Details Component */}
              <div className="p-6">
                <IssueDetails issue={selectedIssue} listing={selectedIssueListing ?? undefined} defaultTab="details" autoOpenDispute={false} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorJobsPage;
