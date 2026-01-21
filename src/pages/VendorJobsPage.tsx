import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBriefcase,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faFilter,
  faSearch,
  faBolt,
  faTint,
  faWind,
  faHouse,
  faHammer,
  faPaintRoller,
  faBroom,
  faBuilding,
  faSnowflake,
  faLeaf,
  faWrench,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { IssueOffer, IssueOfferStatus, IssueType, Listing } from "../types";
import { useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";
import { useGetOffersByVendorIdQuery } from "../features/api/issueOffersApi";
import { useGetIssuesQuery } from "../features/api/issuesApi";
import { useGetListingsQuery } from "../features/api/listingsApi";
import { useGetReportsQuery } from "../features/api/reportsApi";
import ImageComponent from "../components/ImageComponent";

type TabType = "all" | "active" | "completed" | "pending" | "rejected";
type SortBy = "date" | "price" | "status";

// Helper function to check if issue is completed (handles both FE and BE status formats)
const isIssueCompleted = (issueStatus?: string): boolean => {
  if (!issueStatus) return false;
  // Backend might send "completed", "COMPLETED", or frontend might have "Status.COMPLETED"
  const normalizedStatus = issueStatus.toUpperCase();
  return normalizedStatus === "COMPLETED" || normalizedStatus === "STATUS.COMPLETED";
};

// Helper function to check if issue is active (in progress or under review)
const isIssueActive = (issueStatus?: string): boolean => {
  if (!issueStatus) return false;
  const normalizedStatus = issueStatus.toUpperCase();
  return normalizedStatus === "IN_PROGRESS" || 
         normalizedStatus === "STATUS.IN_PROGRESS" ||
         normalizedStatus === "REVIEW" || 
         normalizedStatus === "STATUS.REVIEW";
};

const VendorJobsPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  
  // State
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [searchQuery, setSearchQuery] = useState("");

  // Queries
  const { data: vendor } = useGetVendorByVendorUserIdQuery(String(user?.id), {
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
      // Completed: Accepted offers where issue is completed
      filtered = filtered.filter((offer) => {
        if (offer.status !== IssueOfferStatus.ACCEPTED) return false;
        const issue = issuesMap[offer.issue_id];
        return isIssueCompleted(issue?.status);
      });
    } else if (activeTab === "pending") {
      filtered = filtered.filter((offer) => offer.status === IssueOfferStatus.RECEIVED);
    } else if (activeTab === "rejected") {
      filtered = filtered.filter((offer) => offer.status === IssueOfferStatus.REJECTED);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((offer) => {
        const issue = issuesMap[offer.issue_id];
        const searchLower = searchQuery.toLowerCase();
        return (
          issue?.type?.toLowerCase().includes(searchLower) ||
          issue?.summary?.toLowerCase().includes(searchLower) ||
          offer.issue_id.toString().includes(searchLower)
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
  }, [vendorOffers, activeTab, searchQuery, sortBy, issuesMap]);

  // Calculate statistics
  const stats = useMemo(() => {
    const acceptedOffers = vendorOffers.filter((o) => o.status === IssueOfferStatus.ACCEPTED);
    
    // Separate active and completed based on issue status
    const active = acceptedOffers.filter((offer) => {
      const issue = issuesMap[offer.issue_id];
      return !isIssueCompleted(issue?.status);
    });
    
    const completed = acceptedOffers.filter((offer) => {
      const issue = issuesMap[offer.issue_id];
      return isIssueCompleted(issue?.status);
    });
    
    const pending = vendorOffers.filter((o) => o.status === IssueOfferStatus.RECEIVED);
    const rejected = vendorOffers.filter((o) => o.status === IssueOfferStatus.REJECTED);
    
    const activeRevenue = active.reduce((sum, offer) => sum + (offer.price || 0), 0);
    const completedRevenue = completed.reduce((sum, offer) => sum + (offer.price || 0), 0);
    const potentialRevenue = pending.reduce((sum, offer) => sum + (offer.price || 0), 0);

    return {
      activeCount: active.length,
      completedCount: completed.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      activeRevenue,
      completedRevenue,
      totalRevenue: activeRevenue + completedRevenue,
      potentialRevenue,
      totalOffers: vendorOffers.length,
    };
  }, [vendorOffers, issuesMap]);

  // Icon mapping for issue types
  const getIssueIcon = (type?: string): IconDefinition => {
    const typeMap: Record<string, IconDefinition> = {
      electrical: faBolt,
      plumbing: faTint,
      plumber: faTint,
      hvac: faWind,
      roofing: faHouse,
      structural: faHammer,
      painting: faPaintRoller,
      painter: faPaintRoller,
      flooring: faBroom,
      windows: faBuilding,
      doors: faBuilding,
      insulation: faSnowflake,
      landscaping: faLeaf,
    };
    return typeMap[type?.toLowerCase() || ""] || faWrench;
  };

  const getStatusBadge = (status: IssueOfferStatus) => {
    const badges = {
      [IssueOfferStatus.ACCEPTED]: {
        icon: faCheckCircle,
        color: "bg-green-100 text-green-700 border-green-200",
        label: "Active",
      },
      [IssueOfferStatus.RECEIVED]: {
        icon: faClock,
        color: "bg-yellow-100 text-yellow-700 border-yellow-200",
        label: "Pending",
      },
      [IssueOfferStatus.REJECTED]: {
        icon: faTimesCircle,
        color: "bg-red-100 text-red-700 border-red-200",
        label: "Rejected",
      },
    };

    const badge = badges[status];
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border ${badge.color}`}
      >
        <FontAwesomeIcon icon={badge.icon} className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const getSeverityBadge = (severity?: string) => {
    const severityColors = {
      high: "bg-red-100 text-red-700 border-red-200",
      medium: "bg-orange-100 text-orange-700 border-orange-200",
      low: "bg-blue-100 text-blue-700 border-blue-200",
    };
    const color = severityColors[severity?.toLowerCase() as keyof typeof severityColors] || "bg-gray-100 text-gray-700 border-gray-200";
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded border ${color}`}>
        {severity || "N/A"}
      </span>
    );
  };

  const getIssueStatusBadge = (issueStatus?: string) => {
    // Map issue status to readable labels and colors
    const statusMap: Record<string, { label: string; color: string }> = {
      "Status.OPEN": { label: "Open", color: "bg-gray-100 text-gray-700 border-gray-200" },
      "Status.IN_PROGRESS": { label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200" },
      "Status.REVIEW": { label: "In Review", color: "bg-purple-100 text-purple-700 border-purple-200" },
      "Status.COMPLETED": { label: "Completed", color: "bg-green-100 text-green-700 border-green-200" },
    };
    
    const status = statusMap[issueStatus || ""] || { label: issueStatus || "Unknown", color: "bg-gray-100 text-gray-700 border-gray-200" };
    
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded border ${status.color}`}>
        {status.label}
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Jobs</h1>
        <p className="text-gray-600">
          Manage your active jobs and track pending offers
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Active Jobs</div>
            <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.activeCount}</div>
          <div className="text-sm text-gray-500 mt-1">
            ${stats.activeRevenue.toLocaleString()} value
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Completed</div>
            <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.completedCount}</div>
          <div className="text-sm text-gray-500 mt-1">
            ${stats.completedRevenue.toLocaleString()} earned
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Pending Offers</div>
            <FontAwesomeIcon icon={faClock} className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.pendingCount}</div>
          <div className="text-sm text-gray-500 mt-1">
            ${stats.potentialRevenue.toLocaleString()} potential
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Bids</div>
            <FontAwesomeIcon icon={faBriefcase} className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalOffers}</div>
          <div className="text-sm text-gray-500 mt-1">All time</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Win Rate</div>
            <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.totalOffers > 0
              ? Math.round(((stats.activeCount + stats.completedCount) / stats.totalOffers) * 100)
              : 0}
            %
          </div>
          <div className="text-sm text-gray-500 mt-1">Success rate</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "active", "completed", "pending", "rejected"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab !== "all" && (
                  <span className="ml-2 opacity-75">
                    (
                    {tab === "active"
                      ? stats.activeCount
                      : tab === "completed"
                      ? stats.completedCount
                      : tab === "pending"
                      ? stats.pendingCount
                      : stats.rejectedCount}
                    )
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
            />
            <input
              type="text"
              placeholder="Search by issue type, ID, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <FontAwesomeIcon
              icon={faFilter}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="date">Sort by Date</option>
              <option value="price">Sort by Price</option>
              <option value="status">Sort by Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
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
                className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
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
                onClick={() => navigate(`/marketplace/${offer.issue_id}`)}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 transition-colors cursor-pointer"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Property Image */}
                  {listing && (
                    <div className="w-full lg:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <ImageComponent
                        src={listing.image_url}
                        fallback="/images/property_card_holder.jpg"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Job Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FontAwesomeIcon
                          icon={getIssueIcon(issue?.type)}
                          className="w-5 h-5 text-gray-600"
                        />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {issue?.type || "Issue"} #{offer.issue_id}
                        </h3>
                        {getSeverityBadge(issue?.severity)}
                        {issue?.status && getIssueStatusBadge(issue.status)}
                      </div>
                      {getStatusBadge(offer.status)}
                    </div>

                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {issue?.summary || "No description available"}
                    </p>

                    {listing && (
                      <div className="text-sm text-gray-500 mb-3">
                        <span className="font-medium">Location:</span> {listing.address},{" "}
                        {listing.city}, {listing.state}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Your Bid:</span>
                        <span className="text-xl font-bold text-gray-900">
                          ${offer.price?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="text-gray-500">
                        Submitted {new Date(offer.created_at).toLocaleDateString()}
                      </div>
                      {offer.comment_vendor && (
                        <div className="text-gray-500 italic">
                          Note: {offer.comment_vendor.substring(0, 50)}
                          {offer.comment_vendor.length > 50 ? "..." : ""}
                        </div>
                      )}
                    </div>

                    {offer.status === IssueOfferStatus.REJECTED && offer.comment_client && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">
                          <span className="font-medium">Client feedback:</span>{" "}
                          {offer.comment_client}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default VendorJobsPage;
