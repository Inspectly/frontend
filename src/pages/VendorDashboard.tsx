import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faArrowTrendUp,
  faBolt,
  faBriefcase,
  faCalendarAlt,
  faChevronRight,
  faClock,
  faDollarSign,
  faHouse,
  faMapMarkerAlt,
  faRocket,
  faSearch,
  faStar,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { User, IssueOfferStatus, IssueType, Listing, IssueAssessment } from "../types";
import { useGetIssuesQuery } from "../features/api/issuesApi";
import { useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";
import { useGetOffersByVendorIdQuery } from "../features/api/issueOffersApi";
import { useGetListingsQuery } from "../features/api/listingsApi";
import { useGetAssessmentsByUserIdQuery, useLazyGetAssessmentsByUsersInteractionIdQuery } from "../features/api/issueAssessmentsApi";
import { useGetVendorReviewsByVendorUserIdQuery } from "../features/api/vendorReviewsApi";
import ImageComponent from "../components/ImageComponent";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";
import { parseAsUTC } from "../utils/calendarUtils";
import IssueDetails from "../components/IssueDetails";

// "Posted Xm/Xh/Xd ago" string
function getPostedAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

interface DashboardProps {
  user: User;
}

const VendorDashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  
  // UI State
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(() => {
    return localStorage.getItem('vendor_welcome_banner_dismissed') !== 'true';
  });

  const dismissWelcomeBanner = () => {
    setShowWelcomeBanner(false);
    localStorage.setItem('vendor_welcome_banner_dismissed', 'true');
  };
  
  // Modal state for issue details
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);

  // Real data queries (poll every 20s so vendor sees updates when client accepts/rejects offers, approves work, etc.)
  const { data: vendor, isLoading: isVendorLoading, error: vendorError } = useGetVendorByVendorUserIdQuery(String(user.id));
  const { data: vendorOffers = [] } = useGetOffersByVendorIdQuery(Number(user.id), { skip: !user.id });
  const { data: issues, error: issuesError } = useGetIssuesQuery();
  const { data: listings = [] } = useGetListingsQuery();
  const { data: vendorReviewsData = [] } = useGetVendorReviewsByVendorUserIdQuery(Number(user.id), { skip: !user.id });
  
  // Vendor assessments - use user.id since that's what's stored in the assessment records
  const { data: vendorAssessments = [] } = useGetAssessmentsByUserIdQuery(
    user.id,
    { skip: !user?.id }
  );
  const [fetchAssessmentsByInteraction] = useLazyGetAssessmentsByUsersInteractionIdQuery();

  // State to hold ALL assessments for vendor's interactions (including client counter-proposals)
  const [allAssessments, setAllAssessments] = useState<IssueAssessment[]>([]);

  // Get unique interaction IDs - memoized to prevent infinite loops
  const uniqueInteractionIds = useMemo(() => {
    return [...new Set(vendorAssessments.map(a => a.users_interaction_id).filter(Boolean))].sort();
  }, [vendorAssessments]);
  
  // Stable key for the interaction IDs
  const interactionIdsKey = uniqueInteractionIds.join(",");

  // Fetch all assessments for the vendor's interaction IDs (to include client counter-proposals)
  useEffect(() => {
    let isMounted = true;
    
    const fetchAllAssessments = async () => {
      if (uniqueInteractionIds.length === 0) {
        if (isMounted) setAllAssessments(vendorAssessments);
        return;
      }
      
      try {
        // Fetch ALL assessments for each interaction ID
        const results = await Promise.all(
          uniqueInteractionIds.map(id => fetchAssessmentsByInteraction(id).unwrap())
        );
        
        if (!isMounted) return;
        
        // Flatten and dedupe by assessment ID
        const allResults = results.flat();
        const uniqueAssessments = Array.from(
          new Map(allResults.map(a => [a.id, a])).values()
        ) as IssueAssessment[];
        
        setAllAssessments(uniqueAssessments);
      } catch (err) {
        console.error("Failed to fetch all assessments:", err);
        // Fall back to just vendor's assessments
        if (isMounted) setAllAssessments(vendorAssessments);
      }
    };
    
    fetchAllAssessments();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactionIdsKey]);

  // Listings map for lookups
  const listingsMap = useMemo(() => {
    return listings.reduce((acc, listing) => {
      acc[listing.id] = listing;
      return acc;
    }, {} as Record<number, Listing>);
  }, [listings]);

  // Issues map for lookups
  const issuesMap = useMemo(() => {
    if (!issues) return {};
    return issues.reduce((acc, issue) => {
      acc[issue.id] = issue;
      return acc;
    }, {} as Record<number, IssueType>);
  }, [issues]);

  // Selected issue data for modal (derived from existing data)
  const selectedIssue = selectedIssueId ? issuesMap[selectedIssueId] : null;
  const selectedIssueListing = selectedIssue ? listingsMap[selectedIssue.listing_id] : undefined;
  
  // Open issue modal
  const openIssueModal = (
    issueId: number,
    defaultTab: "details" | "offers" | "assessments" | "dispute" = "details"
  ) => {
    setSelectedIssueId(issueId);
    // Update URL to set the tab for IssueDetails
    navigate(`?tab=${defaultTab}`, { replace: true });
  };
  
  // Close issue modal
  const closeIssueModal = () => {
    setSelectedIssueId(null);
    navigate(window.location.pathname, { replace: true }); // Clear query params
  };

  // Real vendor metrics
  const vendorMetrics = useMemo(() => {
    const acceptedOffers = vendorOffers.filter((o) => o.status === IssueOfferStatus.ACCEPTED);
    const pendingOffers = vendorOffers.filter((o) => o.status === IssueOfferStatus.RECEIVED);
    const totalEarnings = acceptedOffers.reduce((sum, o) => sum + (o.price || 0), 0);

    const completedJobs = acceptedOffers.filter((o) => {
      const issue = issuesMap[o.issue_id];
      return issue?.status === "Status.COMPLETED";
    }).length;

    const activeJobs = acceptedOffers.filter((o) => {
      const issue = issuesMap[o.issue_id];
      return issue && issue.status !== "Status.COMPLETED";
    }).length;

    // Calculate earnings this month
    const now = new Date();
    const thisMonth = acceptedOffers
      .filter(o => {
        const issue = issuesMap[o.issue_id];
        if (!issue) return false;
        const created = new Date(issue.created_at || '');
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      })
      .reduce((sum, o) => sum + (o.price || 0), 0);

    return {
      activeJobs,
      completedJobs,
      totalEarnings,
      thisMonthEarnings: thisMonth,
      pendingBids: pendingOffers.length,
      totalBids: vendorOffers.length,
      acceptedCount: acceptedOffers.length,
      outstandingBids: pendingOffers.reduce((sum, o) => sum + (o.price || 0), 0),
    };
  }, [vendorOffers, issuesMap]);

  // Review stats - average rating and count
  const reviewStats = useMemo(() => {
    const count = vendorReviewsData.length;
    if (count === 0) {
      const fallback = parseFloat(vendor?.rating || "0") || 0;
      return { rating: fallback, count: 0 };
    }
    const sum = vendorReviewsData.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return { rating: Math.round((sum / count) * 10) / 10, count };
  }, [vendorReviewsData, vendor?.rating]);

  // Earnings segmented by this week and last month for trends
  const earningsBreakdown = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const accepted = vendorOffers.filter((o) => o.status === IssueOfferStatus.ACCEPTED);
    const thisWeek = accepted
      .filter((o) => {
        const d = new Date(o.updated_at || o.created_at || "");
        return d >= weekStart;
      })
      .reduce((sum, o) => sum + (o.price || 0), 0);
    const lastMonth = accepted
      .filter((o) => {
        const d = new Date(o.updated_at || o.created_at || "");
        return d >= lastMonthStart && d < thisMonthStart;
      })
      .reduce((sum, o) => sum + (o.price || 0), 0);
    return { thisWeek, lastMonth };
  }, [vendorOffers]);

  // Count of active projects started this week
  const activeProjectsThisWeek = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return vendorOffers.filter((o) => {
      if (o.status !== IssueOfferStatus.ACCEPTED) return false;
      const issue = issuesMap[o.issue_id];
      if (!issue || issue.status === "Status.COMPLETED") return false;
      const d = new Date(o.updated_at || o.created_at || "");
      return d >= weekStart;
    }).length;
  }, [vendorOffers, issuesMap]);

  // Mapping from vendor types to issue types they can handle
  const vendorToIssueTypeMap: Record<string, string[]> = {
    electrician: ['electrical', 'electrician', 'electric', 'wiring'],
    plumber: ['plumbing', 'plumber', 'pipe', 'water', 'drain'],
    painter: ['painting', 'painter', 'paint', 'interior', 'exterior'],
    hvac: ['hvac', 'heating', 'cooling', 'ventilation', 'ac'],
    roofer: ['roofing', 'roof', 'roofer', 'shingle', 'gutter'],
    carpenter: ['carpentry', 'carpenter', 'wood', 'cabinet', 'trim'],
    landscaper: ['landscaping', 'landscaper', 'lawn', 'garden', 'yard'],
    cleaner: ['cleaning', 'cleaner', 'janitorial'],
    general: ['general', 'other', 'misc', 'interior', 'exterior'],
  };

  // Get vendor specialties for filtering
  const vendorSpecialties = useMemo(() => {
    if (!vendor?.vendor_types) return [];
    const rawTypes = vendor.vendor_types.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    
    // Expand to include all matching issue types
    const expanded = new Set<string>();
    rawTypes.forEach(type => {
      // Add the original type
      expanded.add(type);
      // Add mapped issue types
      const mappedTypes = vendorToIssueTypeMap[type] || [];
      mappedTypes.forEach(t => expanded.add(t));
    });
    
    return Array.from(expanded);
  }, [vendor?.vendor_types]);

  // Active jobs (accepted offers)
  const activeJobs = useMemo(() => {
    return vendorOffers
      .filter((o) => o.status === IssueOfferStatus.ACCEPTED)
      .map((o) => {
        const issue = issuesMap[o.issue_id];
        const listing = issue ? listingsMap[issue.listing_id] : undefined;
        return { offer: o, issue, listing };
      })
      .filter((j) => j.issue && j.issue.status !== "Status.COMPLETED");
  }, [vendorOffers, issuesMap, listingsMap]);

  // Count available jobs matching vendor specialty
  const availableCount = useMemo(() => {
    if (!issues) return 0;
    const available = issues.filter((i) => i.status === "Status.OPEN" && !i.vendor_id && i.active);
    if (vendorSpecialties.length === 0) return available.length;

    return available.filter((i) => {
      const issueType = (i.type || '').toLowerCase();
      return vendorSpecialties.some(specialty =>
        issueType.includes(specialty) || specialty.includes(issueType) || specialty === 'general'
      );
    }).length;
  }, [issues, vendorSpecialties]);

  // New job opportunities - open issues matching vendor specialty or all if none match
  const newJobOpportunities = useMemo(() => {
    if (!issues) return [];
    const alreadyBid = new Set(vendorOffers.map((o) => o.issue_id));
    const open = issues.filter(
      (i) => i.status === "Status.OPEN" && !i.vendor_id && i.active && !alreadyBid.has(i.id)
    );
    const specialtyMatch = (issue: IssueType) => {
      if (vendorSpecialties.length === 0) return true;
      const issueType = (issue.type || "").toLowerCase();
      return vendorSpecialties.some(
        (s) => issueType.includes(s) || s.includes(issueType) || s === "general"
      );
    };
    const matched = open.filter(specialtyMatch);
    const pool = matched.length > 0 ? matched : open;
    return [...pool]
      .sort((a, b) => {
        const ta = new Date(a.created_at || 0).getTime();
        const tb = new Date(b.created_at || 0).getTime();
        return tb - ta;
      })
      .slice(0, 5)
      .map((issue) => ({
        issue,
        listing: listingsMap[issue.listing_id],
      }));
  }, [issues, vendorOffers, vendorSpecialties, listingsMap]);
  
  const winRate = vendorMetrics.totalBids > 0 ? Math.round((vendorMetrics.acceptedCount / vendorMetrics.totalBids) * 100) : 0;
  const isNewVendor = vendorMetrics.totalBids === 0;

  // Process ALL assessments (including client counter-proposals) into categorized visits - GROUPED BY ISSUE
  // NOTE: This useMemo must be BEFORE any early returns to comply with Rules of Hooks
  const processedVisits = useMemo(() => {
    // Group assessments by issue_id
    const groupedByIssue: Record<number, IssueAssessment[]> = {};
    allAssessments.forEach(assessment => {
      if (!groupedByIssue[assessment.issue_id]) {
        groupedByIssue[assessment.issue_id] = [];
      }
      groupedByIssue[assessment.issue_id].push(assessment);
    });

    // Process each issue group
    const visits = Object.entries(groupedByIssue).map(([issueIdStr, assessments]) => {
      const issueId = Number(issueIdStr);
      const issue = issuesMap[issueId];
      const listing = issue ? listingsMap[issue.listing_id] : undefined;
      
      // Check if there's an accepted assessment
      // Note: Backend may return status as lowercase "accepted" or as enum "Assessment_Status.ACCEPTED"
      const acceptedAssessment = assessments.find(a => {
        const status = (a.status as string)?.toLowerCase() || "";
        return status === "accepted" || status.includes("accepted");
      });
      
      // Helper to check if status is "received" (pending)
      const isReceivedStatus = (status: string) => {
        if (!status) return false;
        const lowerStatus = status.toLowerCase();
        return lowerStatus === "received" || lowerStatus.includes("received");
      };

      // Check if there are pending assessments from client (action required for vendor)
      const actionRequiredAssessments = assessments.filter(a => 
        isReceivedStatus(a.status as string) && a.user_id !== user.id
      );
      
      // Check if there are pending assessments from vendor (waiting for client)
      const pendingAssessments = assessments.filter(a => 
        isReceivedStatus(a.status as string) && a.user_id === user.id
      );

      // Determine the primary category for this issue
      let category: "action_required" | "pending" | "confirmed" = "pending";
      let primaryAssessment: IssueAssessment | undefined;
      let proposalCount = 0;

      if (acceptedAssessment) {
        category = "confirmed";
        primaryAssessment = acceptedAssessment;
      } else if (actionRequiredAssessments.length > 0) {
        category = "action_required";
        // Use the earliest proposed time
        primaryAssessment = actionRequiredAssessments.sort(
          (a, b) => parseAsUTC(a.start_time).getTime() - parseAsUTC(b.start_time).getTime()
        )[0];
        proposalCount = actionRequiredAssessments.length;
      } else if (pendingAssessments.length > 0) {
        category = "pending";
        primaryAssessment = pendingAssessments.sort(
          (a, b) => parseAsUTC(a.start_time).getTime() - parseAsUTC(b.start_time).getTime()
        )[0];
        proposalCount = pendingAssessments.length;
      }

      if (!primaryAssessment) return null;

      return {
        id: issueId, // Use issue ID as the key for grouping
        issueId,
        issue,
        listing,
        category,
        startTime: parseAsUTC(primaryAssessment.start_time),
        endTime: parseAsUTC(primaryAssessment.end_time),
        proposalCount,
        acceptedAssessment,
      };
    }).filter(Boolean) as Array<{
      id: number;
      issueId: number;
      issue: IssueType | undefined;
      listing: Listing | undefined;
      category: "action_required" | "pending" | "confirmed";
      startTime: Date;
      endTime: Date;
      proposalCount: number;
      acceptedAssessment?: IssueAssessment;
    }>;

    // Filter to relevant visits - exclude past confirmed visits
    const now = new Date();
    const relevantVisits = visits.filter(v => {
      if (v.category === "confirmed") {
        // Only show future confirmed visits
        return v.startTime >= now;
      }
      // Show all pending and action required (these need response regardless of proposed time)
      return true;
    });

    // Sort: action required first, then confirmed, then pending, then by date
    return relevantVisits.sort((a, b) => {
      if (a.category === "action_required" && b.category !== "action_required") return -1;
      if (b.category === "action_required" && a.category !== "action_required") return 1;
      if (a.category === "confirmed" && b.category !== "confirmed") return -1;
      if (b.category === "confirmed" && a.category !== "confirmed") return 1;
      return a.startTime.getTime() - b.startTime.getTime();
    });
  }, [allAssessments, issuesMap, listingsMap, user.id]);

  // Today's schedule - visits starting today
  const todaySchedule = useMemo(() => {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return processedVisits
      .filter(v => v.startTime >= dayStart && v.startTime < dayEnd)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [processedVisits]);

  // Loading/Error states - AFTER all hooks
  if (issuesError) return <p>Error loading dashboard data</p>;
  if (isVendorLoading) {
    return (
      <div className="min-h-screen w-full bg-gray-100 p-6">
        <div className="w-full max-w-[1800px] mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-16 bg-gray-200 rounded-xl w-full"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }
  if (vendorError) return <p>Failed to load vendor data.</p>;
  if (!vendor) return <p>Vendor not found.</p>;

  return (
    <div className="min-h-screen w-full bg-gray-100">
      <div className="w-full max-w-[1800px] mx-auto px-4 py-4 lg:px-6">

        {/* Greeting Header */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            {vendor?.profile_image_url ? (
              <img src={vendor.profile_image_url} alt={vendor.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0">
                {(vendor?.name || "V")[0].toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-3xl lg:text-4xl font-display font-bold text-gray-900">
                {(() => {
                  const hour = new Date().getHours();
                  const firstName = vendor?.name?.split(/\s+/)[0] || "";
                  if (hour >= 5 && hour < 12) return `Good morning, ${firstName}`;
                  if (hour >= 12 && hour < 17) return `Good afternoon, ${firstName}`;
                  if (hour >= 17 && hour < 21) return `Good evening, ${firstName}`;
                  return `Hello, ${firstName}`;
                })()}
              </h1>
              <p className="text-sm text-gray-500">Here's what's happening today</p>
            </div>
          </div>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 px-5 py-3 bg-gold text-white rounded-lg font-semibold hover:bg-foreground hover:text-background transition-colors shadow-sm"
          >
            <FontAwesomeIcon icon={faBriefcase} />
            Browse Jobs
          </Link>
        </div>
        
        {/* New Vendor Welcome Banner */}
        {isNewVendor && showWelcomeBanner && (
          <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-gold to-gold-400 relative">
            <div className="flex flex-col lg:flex-row items-center gap-5">
              {/* Icon */}
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faRocket} className="text-gray-900 text-2xl" />
              </div>
              
              {/* Content */}
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Welcome! Let's find your first project
                </h2>
                <p className="text-gray-800 text-sm mb-0 lg:mb-0">
                  {availableCount} jobs available in your area • Browse, bid, and start earning today
                </p>
              </div>
              
              {/* CTA */}
              <Link
                to="/marketplace"
                className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                <FontAwesomeIcon icon={faSearch} />
                Explore Marketplace
                <FontAwesomeIcon icon={faArrowRight} />
              </Link>
              
              {/* Dismiss Button */}
              <button
                onClick={dismissWelcomeBanner}
                className="flex-shrink-0 w-8 h-8 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors shadow-sm"
                aria-label="Dismiss"
              >
                <FontAwesomeIcon icon={faTimes} className="text-gray-600 text-sm" />
              </button>
            </div>
          </div>
        )}

        {/* Top Stat Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Active Projects */}
          <div
            onClick={() => navigate("/vendor/jobs?tab=active")}
            className="bg-white rounded-xl p-5 cursor-pointer shadow-lg hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center mb-4">
              <FontAwesomeIcon icon={faBriefcase} className="text-gold" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{vendorMetrics.activeJobs}</div>
            <div className="text-sm text-gray-500 mt-0.5">Active Projects</div>
            <div className="flex items-center gap-1 mt-2 text-xs text-gold font-medium">
              <FontAwesomeIcon icon={faArrowTrendUp} />
              {activeProjectsThisWeek > 0 ? `+${activeProjectsThisWeek} this week` : "No change this week"}
            </div>
          </div>

          {/* This Month */}
          <div
            onClick={() => navigate("/vendor/jobs?tab=active")}
            className="bg-white rounded-xl p-5 cursor-pointer shadow-lg hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <FontAwesomeIcon icon={faDollarSign} className="text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">${vendorMetrics.thisMonthEarnings.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-0.5">This Month</div>
            <div className="flex items-center gap-1 mt-2 text-xs text-gold font-medium">
              <FontAwesomeIcon icon={faArrowTrendUp} />
              {(() => {
                const last = earningsBreakdown.lastMonth;
                const curr = vendorMetrics.thisMonthEarnings;
                if (last === 0) return curr > 0 ? "First earnings" : "No earnings yet";
                const pct = Math.round(((curr - last) / last) * 100);
                return `${pct >= 0 ? "+" : ""}${pct}% vs last`;
              })()}
            </div>
          </div>

          {/* Avg. Rating */}
          <div className="bg-white rounded-xl p-5 shadow-lg">
            <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center mb-4">
              <FontAwesomeIcon icon={faStar} className="text-gold" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {reviewStats.count > 0 ? reviewStats.rating.toFixed(1) : "—"}
            </div>
            <div className="text-sm text-gray-500 mt-0.5">Avg. Rating</div>
            <div className="flex items-center gap-1 mt-2 text-xs text-gold font-medium">
              <FontAwesomeIcon icon={faArrowTrendUp} />
              {reviewStats.count > 0
                ? `${reviewStats.count} review${reviewStats.count === 1 ? "" : "s"}`
                : "No reviews yet"}
            </div>
          </div>

          {/* Response Rate */}
          <div className="bg-white rounded-xl p-5 shadow-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <FontAwesomeIcon icon={faBolt} className="text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {vendorMetrics.totalBids > 0 ? `${winRate}%` : "—"}
            </div>
            <div className="text-sm text-gray-500 mt-0.5">Response Rate</div>
            <div className="flex items-center gap-1 mt-2 text-xs text-gold font-medium">
              <FontAwesomeIcon icon={faArrowTrendUp} />
              {vendorMetrics.totalBids > 0
                ? `${vendorMetrics.acceptedCount} of ${vendorMetrics.totalBids} bids`
                : "Place your first bid"}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Column - Active Projects */}
          <div className="col-span-12 lg:col-span-8 flex flex-col">

            {/* Active Projects - mockup style */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg flex-1 flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faBriefcase} className="text-gray-700" />
                    </div>
                    <span className="font-semibold text-gray-900">Active Projects</span>
                  </div>
                  {activeJobs.length > 0 && (
                    <Link
                      to="/vendor/jobs?tab=active"
                      className="text-sm text-gold font-medium hover:underline flex items-center gap-1"
                    >
                      View all
                      <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                    </Link>
                  )}
                </div>
              </div>

              <div className="p-4 flex-1">
                {activeJobs.length > 0 ? (
                  <div className="space-y-2">
                    {activeJobs.slice(0, 3).map(({ offer, issue, listing }) => {
                      const progress =
                        issue?.status === "Status.REVIEW" ? 90
                        : issue?.status === "Status.IN_PROGRESS" ? 55
                        : 25;
                      const acceptedAt = new Date(offer.updated_at || offer.created_at || Date.now());
                      const dueAt = new Date(acceptedAt);
                      dueAt.setDate(dueAt.getDate() + 7);
                      const msDay = 1000 * 60 * 60 * 24;
                      const daysRemaining = Math.ceil((dueAt.getTime() - Date.now()) / msDay);
                      const dueText =
                        daysRemaining <= 0 ? "Due Today"
                        : daysRemaining === 1 ? "Due 1 day"
                        : `Due ${daysRemaining} days`;
                      const initial = (vendor?.name || "V")[0].toUpperCase();
                      return (
                        <div
                          key={offer.id}
                          onClick={() => issue?.id && openIssueModal(issue.id, "details")}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {listing?.image_url ? (
                              <ImageComponent
                                src={listing.image_url}
                                fallback="/images/property_card_holder.jpg"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                                <FontAwesomeIcon icon={faHouse} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate">
                              {issue?.summary || `${normalizeAndCapitalize(issue?.type || "")} Project`}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5 truncate">
                              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs flex-shrink-0" />
                              <span className="truncate">{listing?.address || "No address"}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {vendor?.profile_image_url ? (
                                <img
                                  src={vendor.profile_image_url}
                                  alt={vendor.name}
                                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                  {initial}
                                </div>
                              )}
                              <span className="text-xs text-gray-700 font-medium whitespace-nowrap">
                                {vendor?.name?.split(/\s+/)[0] || "You"}
                              </span>
                              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden min-w-[60px]">
                                <div className="h-full bg-gold transition-all" style={{ width: `${progress}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">{progress}%</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-lg font-bold text-gray-900">
                              ${offer.price?.toLocaleString()}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 whitespace-nowrap">
                              <FontAwesomeIcon icon={faClock} className="text-xs" />
                              {dueText}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <div className="w-14 h-14 bg-gold-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <FontAwesomeIcon icon={faBriefcase} className="text-gold text-2xl" />
                    </div>
                    <p className="text-gray-900 font-semibold mb-1">No active projects yet</p>
                    <p className="text-sm text-gray-500 mb-4">Browse jobs and submit your first bid to get started</p>
                    <Link
                      to="/marketplace"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg font-semibold text-sm hover:bg-foreground hover:text-background transition-colors"
                    >
                      <FontAwesomeIcon icon={faSearch} />
                      Find Your First Project
                      <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column - Sidebar (Earnings + Schedule) */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Earnings Summary */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <FontAwesomeIcon icon={faArrowTrendUp} className="text-emerald-600" />
                  </div>
                  <span className="font-semibold text-gray-900">Earnings</span>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">This Week</span>
                  <span className="text-base font-semibold text-gray-900">
                    ${earningsBreakdown.thisWeek.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">This Month</span>
                  <span className="text-base font-semibold text-gray-900">
                    ${vendorMetrics.thisMonthEarnings.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total Earned</span>
                  <span className="text-base font-semibold text-gray-900">
                    ${vendorMetrics.totalEarnings.toLocaleString()}
                  </span>
                </div>
                {vendorMetrics.outstandingBids > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-500">Outstanding Bids</span>
                    <span className="text-base font-semibold text-gold">
                      ${vendorMetrics.outstandingBids.toLocaleString()}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => navigate("/vendor/earnings")}
                  className="w-full mt-2 px-4 py-2.5 border-2 border-gray-900 text-gray-900 rounded-lg font-semibold text-sm hover:bg-gray-900 hover:text-white transition-colors"
                >
                  View Earnings Details
                </button>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-600" />
                    </div>
                    <span className="font-semibold text-gray-900">Today's Schedule</span>
                  </div>
                  {processedVisits.length > 0 && (
                    <Link
                      to="/vendor/jobs?tab=visits"
                      className="text-sm text-gold font-medium hover:underline flex items-center gap-1"
                    >
                      See All ({processedVisits.length})
                      <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                    </Link>
                  )}
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {todaySchedule.length > 0 ? (
                  todaySchedule.slice(0, 4).map((visit) => (
                    <div
                      key={`today-${visit.issueId}`}
                      onClick={() => openIssueModal(visit.issueId, "assessments")}
                      className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {visit.listing?.image_url ? (
                          <ImageComponent
                            src={visit.listing.image_url}
                            fallback="/images/property_card_holder.jpg"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FontAwesomeIcon icon={faHouse} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {visit.startTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          {" — "}
                          {visit.issue?.summary || normalizeAndCapitalize(visit.issue?.type || "Visit")}
                        </div>
                        <div className="text-xs text-gray-500 truncate mt-0.5">
                          {visit.listing?.address?.split(",")[0] || "Location TBD"}
                          {visit.issue?.type && ` · ${normalizeAndCapitalize(visit.issue.type)}`}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium text-sm mb-1">Nothing scheduled today</p>
                    <p className="text-xs text-gray-500">Confirmed visits will appear here</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* New Job Opportunities - full width */}
        <div className="bg-white rounded-xl overflow-hidden shadow-lg mt-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faBolt} className="text-gold" />
                </div>
                <span className="font-semibold text-gray-900">New Job Opportunities</span>
              </div>
              <Link
                to="/marketplace"
                className="text-sm text-gold font-medium hover:underline flex items-center gap-1"
              >
                View all
                <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {newJobOpportunities.length > 0 ? (
              newJobOpportunities.map(({ issue, listing }) => {
                const isUrgent = (issue.severity || "").toLowerCase() === "high";
                const cityState = listing
                  ? [listing.city, listing.state].filter(Boolean).join(", ")
                  : "";
                const posted = issue.created_at
                  ? getPostedAgo(new Date(issue.created_at))
                  : "";
                const title =
                  issue.summary ||
                  `${normalizeAndCapitalize(issue.type || "")} Job`;
                return (
                  <div
                    key={issue.id}
                    onClick={() => openIssueModal(issue.id, "offers")}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {listing?.image_url ? (
                        <ImageComponent
                          src={listing.image_url}
                          fallback="/images/property_card_holder.jpg"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FontAwesomeIcon icon={faHouse} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 truncate">{title}</span>
                        {isUrgent && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">
                            Urgent
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5 truncate">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs flex-shrink-0" />
                        <span className="truncate">
                          {cityState || "Location TBD"}
                          {issue.type && ` · ${normalizeAndCapitalize(issue.type)}`}
                          {posted && ` · Posted ${posted}`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openIssueModal(issue.id, "offers");
                      }}
                      className="flex-shrink-0 px-4 py-2 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-foreground hover:text-background transition-colors"
                    >
                      Bid
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FontAwesomeIcon icon={faBolt} className="text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium text-sm mb-1">No new opportunities</p>
                <p className="text-xs text-gray-500">Check back soon for fresh jobs in your area</p>
              </div>
            )}
          </div>
        </div>

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
                <IssueDetails issue={selectedIssue} listing={selectedIssueListing} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
