import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faChevronRight,
  faRocket,
  faSearch,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { User, IssueOfferStatus, IssueType, Listing, IssueAssessment } from "../types";
import { useGetIssuesQuery } from "../features/api/issuesApi";
import { useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";
import { useGetOffersByVendorIdQuery, getOffersByIssueId } from "../features/api/issueOffersApi";
import { useGetListingsQuery } from "../features/api/listingsApi";
import { useGetAssessmentsByUserIdQuery, useLazyGetAssessmentsByUsersInteractionIdQuery } from "../features/api/issueAssessmentsApi";
import { store } from "../store/store";
import DashboardStatCard from "../components/dashboard/DashboardStatCard";
import CardSectionHeader from "../components/dashboard/CardSectionHeader";
import PropertyThumbnail from "../components/dashboard/PropertyThumbnail";
import { useGetVendorReviewsByVendorUserIdQuery } from "../features/api/vendorReviewsApi";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";
import { parseAsUTC } from "../utils/calendarUtils";
import { getRelativeTime } from "../utils/dateUtils";
import IssueDetails from "../components/IssueDetails";
import { Briefcase, Calendar, CalendarCheck, MapPin, Star, TrendingUp, Zap } from "lucide-react";

// Static lookup: vendor type → matching issue type keywords
const VENDOR_TO_ISSUE_TYPE_MAP: Record<string, string[]> = {
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

    // Calculate earnings this month and this week
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const thisMonth = acceptedOffers
      .filter(o => {
        const issue = issuesMap[o.issue_id];
        if (!issue) return false;
        const created = new Date(issue.created_at || '');
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      })
      .reduce((sum, o) => sum + (o.price || 0), 0);

    const thisWeek = acceptedOffers
      .filter(o => {
        const issue = issuesMap[o.issue_id];
        if (!issue) return false;
        const created = new Date(issue.created_at || '');
        return created >= weekAgo;
      })
      .reduce((sum, o) => sum + (o.price || 0), 0);

    return {
      activeJobs,
      completedJobs,
      totalEarnings,
      thisMonthEarnings: thisMonth,
      thisWeekEarnings: thisWeek,
      pendingBids: pendingOffers.length,
      totalBids: vendorOffers.length,
      acceptedCount: acceptedOffers.length,
      outstandingBids: pendingOffers.reduce((sum, o) => sum + (o.price || 0), 0),
    };
  }, [vendorOffers, issuesMap]);

  // Marketplace link with vendor type/city pre-filled
  const marketplaceLink = useMemo(() => {
    if (vendor) {
      const type = vendor.vendor_types?.split(",")[0]?.trim() || "";
      const city = vendor.city || "";
      return `/marketplace?type=${encodeURIComponent(type)}&city=${encodeURIComponent(city)}`;
    }
    return "/marketplace";
  }, [vendor]);

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
      const mappedTypes = VENDOR_TO_ISSUE_TYPE_MAP[type] || [];
      mappedTypes.forEach(t => expanded.add(t));
    });

    return Array.from(expanded);
  }, [vendor?.vendor_types]);

  // Available opportunities from marketplace with bid info
  const [marketplaceJobs, setMarketplaceJobs] = useState<
    Array<{
      id: number;
      type: string;
      summary: string;
      severity: string;
      bidCount: number;
      listing?: Listing;
      isHot: boolean;
      estimatedPrice?: number;
      distance?: string;
      created_at?: string;
    }>
  >([]);


  // Helper to check if issue matches vendor specialty
  const matchesSpecialty = (issue: IssueType) => {
    if (vendorSpecialties.length === 0) return true;
    const issueType = (issue.type || '').toLowerCase();
    return vendorSpecialties.some(specialty =>
      issueType.includes(specialty) || specialty.includes(issueType) || specialty === 'general'
    );
  };

  // Helper to check if issue is in vendor's city
  const matchesCity = (issue: IssueType) => {
    if (!vendor?.city) return true; // If no vendor city, match all
    const listing = listingsMap[issue.listing_id];
    if (!listing?.city) return false;
    return listing.city.toLowerCase() === vendor.city.toLowerCase();
  };

  // Filter and fetch marketplace opportunities with smart fallbacks
  useEffect(() => {
    const fetchOpportunities = async () => {
      if (!issues) return;

      const available = issues.filter((i) => i.status === "Status.OPEN" && !i.vendor_id && i.active);

      // Try different filter combinations with fallbacks
      let filtered: IssueType[] = [];

      // 1. Best match: specialty + city
      const exactMatch = available.filter((i) => matchesSpecialty(i) && matchesCity(i));

      if (exactMatch.length > 0) {
        filtered = exactMatch;
      } else {
        // 2. Fallback A: specialty only (any location)
        const specialtyOnly = available.filter((i) => matchesSpecialty(i));

        if (specialtyOnly.length > 0) {
          filtered = specialtyOnly;
        } else {
          // 3. Fallback B: city only (any specialty)
          const cityOnly = available.filter((i) => matchesCity(i));

          if (cityOnly.length > 0) {
            filtered = cityOnly;
          } else {
            // 4. Fallback C: show all available
            filtered = available;
          }
        }
      }


      // Sort by severity for Priority List (high → medium → low)
      const sortedBySeverity = [...filtered].sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        return (severityOrder[a.severity as keyof typeof severityOrder] || 2) -
          (severityOrder[b.severity as keyof typeof severityOrder] || 2);
      });

      // Show jobs immediately without waiting for bid counts
      const top20 = sortedBySeverity.slice(0, 20);
      const jobsWithoutBids = top20.map((issue) => {
        const listing = listingsMap[issue.listing_id];
        return {
          id: issue.id,
          type: issue.type || "General",
          summary: issue.summary || "View details",
          severity: issue.severity,
          bidCount: 0,
          listing,
          isHot: issue.severity === 'high',
          created_at: issue.created_at,
        };
      });
      setMarketplaceJobs(jobsWithoutBids);

      // Fetch bid counts in background (non-blocking, progressive)
      top20.forEach((issue) => {
        store.dispatch(getOffersByIssueId.initiate(issue.id, { forceRefetch: false }))
          .then((result) => {
            const bidCount = result.data?.length || 0;
            setMarketplaceJobs((prev) => {
              const updated = [...prev];
              const jobIdx = updated.findIndex(j => j.id === issue.id);
              if (jobIdx !== -1) {
                updated[jobIdx] = { ...updated[jobIdx], bidCount, isHot: issue.severity === 'high' || bidCount === 0 };
              }
              return updated;
            });
          })
          .catch(() => { });
      });
    };

    fetchOpportunities();
  }, [issues, vendorSpecialties, listingsMap, vendor?.city]);

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

  const winRate = vendorMetrics.totalBids > 0 ? Math.round((vendorMetrics.acceptedCount / vendorMetrics.totalBids) * 100) : 0;
  const isNewVendor = vendorMetrics.totalBids === 0;

  // IDs of jobs vendor has already bid on
  const alreadyBidOnIds = useMemo(() => {
    return new Set(vendorOffers.map(o => o.issue_id));
  }, [vendorOffers]);

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

  // Today's confirmed schedule
  const todaysSchedule = useMemo(() => {
    const today = new Date();
    return processedVisits
      .filter(v => {
        if (v.category !== "confirmed") return false;
        const d = v.startTime;
        return (
          d.getDate() === today.getDate() &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear()
        );
      })
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [processedVisits]);

  // Loading/Error states - AFTER all hooks
  if (issuesError) return <p>Error loading dashboard data</p>;
  if (isVendorLoading) {
    return (
      <div className="min-h-screen w-full bg-background p-6">
        <div className="w-full max-w-[1800px] mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-16 bg-muted rounded-xl w-full"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-muted rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-muted rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }
  if (vendorError) return <p>Failed to load vendor data.</p>;
  if (!vendor) return <p>Vendor not found.</p>;

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="w-full max-w-[1800px] mx-auto px-4 py-5 lg:px-8 lg:py-6">

        {/* Greeting Header */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            {vendor?.profile_image_url ? (
              <img src={vendor.profile_image_url} alt={vendor.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0">
                {(vendor?.name || "V")[0].toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
                {(() => {
                  const hour = new Date().getHours();
                  const firstName = vendor?.name?.split(/\s+/)[0] || "";
                  if (hour >= 5 && hour < 12) return `Good morning, ${firstName}`;
                  if (hour >= 12 && hour < 17) return `Good afternoon, ${firstName}`;
                  return `Good evening, ${firstName}`;
                })()}
              </h1>
              <p className="text-sm text-muted-foreground">Here's what's happening today</p>
            </div>
          </div>

          {/* Browse Jobs CTA */}
          <Link
            to={marketplaceLink}
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-sm flex-shrink-0"
          >
            <FontAwesomeIcon icon={faSearch} className="text-xs" />
            <span>Browse Jobs</span>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <DashboardStatCard
            iconBg="bg-amber-100"
            icon={<Briefcase className="w-4 h-4 text-amber-600" />}
            value={vendorMetrics.activeJobs}
            label="Active Projects"
            subtitle={activeProjectsThisWeek > 0 ? `+${activeProjectsThisWeek} this week` : undefined}
            onClick={() => navigate("/vendor/jobs?tab=active")}
          />
          <DashboardStatCard
            iconBg="bg-emerald-100"
            icon={<span className="text-emerald-600 font-bold text-sm">$</span>}
            value={`$${vendorMetrics.thisMonthEarnings.toLocaleString()}`}
            label="This Month"
            subtitle={(() => {
              const last = earningsBreakdown.lastMonth;
              const curr = vendorMetrics.thisMonthEarnings;
              if (last === 0) return curr > 0 ? "First earnings!" : undefined;
              const pct = Math.round(((curr - last) / last) * 100);
              return `${pct >= 0 ? "+" : ""}${pct}% vs last month`;
            })()}
          />
          <DashboardStatCard
            iconBg="bg-orange-100"
            icon={<Star className="w-4 h-4 text-orange-500" />}
            value={reviewStats.rating > 0 ? reviewStats.rating.toFixed(1) : "—"}
            label="Avg. Rating"
            subtitle={reviewStats.count > 0 ? `${reviewStats.count} review${reviewStats.count === 1 ? "" : "s"}` : undefined}
            onClick={() => navigate("/vendor/reviews")}
          />
          <DashboardStatCard
            iconBg="bg-blue-100"
            icon={<Zap className="w-4 h-4 text-blue-600" />}
            value={`${winRate}%`}
            label="Win Rate"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-5">

          {/* Left Column - Active Projects + Job Opportunities */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-5 min-w-0">

            {/* ACTIVE PROJECTS LIST */}
            <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
              <CardSectionHeader
                iconBg="bg-amber-100"
                icon={<Briefcase className="w-5 h-5 text-amber-600" />}
                title="Active Projects"
                viewAllHref="/vendor/jobs?tab=active"
              />

              <div className="divide-y divide-border">
                {activeJobs.length > 0 ? (
                  activeJobs.slice(0, 5).map(({ offer, issue, listing }) => {
                    const statusLabel =
                      issue?.status === "Status.IN_PROGRESS"
                        ? "In Progress"
                        : issue?.status === "Status.REVIEW"
                          ? "In Review"
                          : "Active";
                    return (
                      <div
                        key={offer.id}
                        onClick={() => issue?.id && openIssueModal(issue.id, "details")}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40 cursor-pointer transition-colors"
                      >
                        {/* Thumbnail */}
                        <PropertyThumbnail imageUrl={listing?.image_url} size="lg" />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground truncate">
                            {issue?.summary || `${normalizeAndCapitalize(issue?.type || "")} Project`}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {(() => { const a = listing?.address?.split(",")[0]; return (a && a !== "None") ? a : "Property"; })()}
                          </div>
                          {/* Progress indicator */}
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{
                                  width:
                                    issue?.status === "Status.COMPLETED"
                                      ? "100%"
                                      : issue?.status === "Status.IN_PROGRESS"
                                        ? "60%"
                                        : issue?.status === "Status.REVIEW"
                                          ? "85%"
                                          : "30%",
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{statusLabel}</span>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-foreground">${offer.price?.toLocaleString()}</div>
                          <FontAwesomeIcon icon={faChevronRight} className="text-muted-foreground text-xs mt-1" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-10 text-center">
                    <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Briefcase className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-foreground font-semibold mb-1">No active projects yet</p>
                    <p className="text-sm text-muted-foreground mb-4">Browse jobs and submit a bid to get started</p>
                    <Link
                      to={marketplaceLink}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-colors"
                    >
                      <FontAwesomeIcon icon={faSearch} />
                      Find Your First Project
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* JOB OPPORTUNITIES */}
            <div className="bg-card rounded-xl overflow-hidden shadow-soft border border-border">
              <CardSectionHeader
                iconBg="bg-gold-200"
                icon={<Zap className="w-5 h-5 text-gold" />}
                title="New Job Opportunities"
                viewAllHref={marketplaceLink}
              />

              {/* Job List */}
              {(() => {
                const jobs = marketplaceJobs.filter(j => !alreadyBidOnIds.has(j.id)).slice(0, 5);
                if (jobs.length === 0) {
                  return (
                    <div className="py-10 px-5 text-center">
                      <p className="text-foreground font-medium mb-1">No matching jobs right now</p>
                      <p className="text-sm text-muted-foreground mb-5">
                        Browse the marketplace to find opportunities near you
                      </p>
                      <Link
                        to={marketplaceLink}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
                      >
                        <FontAwesomeIcon icon={faSearch} />
                        Browse Marketplace
                      </Link>
                    </div>
                  );
                }
                return (
                  <div className="divide-y divide-border">
                    {jobs.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => openIssueModal(item.id, "details")}
                        className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 cursor-pointer transition-colors"
                      >
                        {/* Thumbnail */}
                        <PropertyThumbnail imageUrl={item.listing?.image_url} size="md" />

                        {/* Job Info */}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {item.summary || `${normalizeAndCapitalize(item.type)} Issue`}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                            {item.listing?.city && (
                              <>
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                {item.listing.city}
                              </>
                            )}
                            {item.created_at && <> · Posted {getRelativeTime(item.created_at)}</>}
                          </p>
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            {item.bidCount === 0 ? (
                              <p className="text-xs font-medium text-emerald-600">Be first!</p>
                            ) : (
                              <p className="text-xs text-muted-foreground">{item.bidCount} bid{item.bidCount !== 1 ? 's' : ''}</p>
                            )}
                          </div>
                          <FontAwesomeIcon icon={faChevronRight} className="text-muted-foreground text-xs" />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

          </div> {/* End LEFT COLUMN */}

          {/* Right Column — Earnings + Today's Schedule */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-5 min-w-0">

            {/* Earnings Card */}
            <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
              <CardSectionHeader
                iconBg="bg-emerald-100"
                icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                title="Earnings"
              />

              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">This Week</span>
                  <span className="text-sm font-semibold text-foreground">
                    ${vendorMetrics.thisWeekEarnings.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">This Month</span>
                  <span className="text-sm font-semibold text-foreground">
                    ${vendorMetrics.thisMonthEarnings.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Total Earned</span>
                  <span className="text-base font-bold text-foreground">
                    ${vendorMetrics.totalEarnings.toLocaleString()}
                  </span>
                </div>

                <Link
                  to="/vendor/jobs"
                  className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-foreground font-semibold text-sm rounded-lg hover:bg-muted transition-colors"
                >
                  View Earnings Details
                </Link>
              </div>
            </div>

            {/* Today's Schedule Card */}
            <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
              <CardSectionHeader
                iconBg="bg-blue-100"
                icon={<CalendarCheck className="w-5 h-5 text-blue-600" />}
                title="Today's Schedule"
              />

              <div className="divide-y divide-border">
                {todaysSchedule.length > 0 ? (
                  todaysSchedule.map((visit) => (
                    <div
                      key={visit.id}
                      onClick={() => openIssueModal(visit.issueId, "assessments")}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      {/* Thumbnail */}
                      <PropertyThumbnail
                        imageUrl={visit.listing?.image_url}
                        size="sm"
                        fallbackIcon={<Calendar className="w-4 h-4 text-muted-foreground" />}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground">
                          {visit.startTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          {" — "}
                          {visit.issue?.summary || normalizeAndCapitalize(visit.issue?.type || "Visit")}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {(() => { const a = visit.listing?.address?.split(",")[0]; return (a && a !== "None") ? a : "Property"; })()}
                          {visit.listing?.city ? ` · ${visit.listing.city}` : ""}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">No confirmed visits scheduled</p>
                  </div>
                )}
              </div>
            </div>

          </div> {/* End RIGHT COLUMN */}

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
            <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={closeIssueModal}
                className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/70 transition-colors"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faTimes} className="text-muted-foreground" />
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
