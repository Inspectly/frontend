import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBolt,
  faBriefcase,
  faBuilding,
  faBroom,
  faCalendarCheck,
  faCheck,
  faCheckCircle,
  faChevronLeft,
  faChevronRight,
  faClock,
  faFire,
  faGripLines,
  faHammer,
  faHouse,
  faLayerGroup,
  faLeaf,
  faListUl,
  faPaintRoller,
  faQuestionCircle,
  faRocket,
  faSearch,
  faSnowflake,
  faStar,
  faTimes,
  faTint,
  faTrophy,
  faWind,
  faWrench,
} from "@fortawesome/free-solid-svg-icons";
import { User, IssueOfferStatus, IssueType, Listing } from "../types";
import { useGetIssuesQuery } from "../features/api/issuesApi";
import { useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";
import { useGetOffersByVendorIdQuery, getOffersByIssueId } from "../features/api/issueOffersApi";
import { useGetListingsQuery } from "../features/api/listingsApi";
import { store } from "../store/store";
import ImageComponent from "../components/ImageComponent";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";
import IssueDetails from "../components/IssueDetails";

// Issue type icons mapping
const issueIcons: Record<string, any> = {
  general: faWrench,
  structural: faBuilding,
  electrician: faBolt,
  electrical: faBolt,
  plumber: faTint,
  plumbing: faTint,
  painter: faPaintRoller,
  painting: faPaintRoller,
  cleaner: faBroom,
  hvac: faWind,
  roofing: faHouse,
  insulation: faSnowflake,
  drywall: faGripLines,
  plaster: faLayerGroup,
  carpentry: faHammer,
  landscaping: faLeaf,
  other: faQuestionCircle,
};

function pickIcon(type?: string) {
  const key = String(type || "").toLowerCase();
  return issueIcons[key] || faWrench;
}

// Helper to get relative time string
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

interface DashboardProps {
  user: User;
}

const VendorDashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  
  // UI State
  const [activeTab, setActiveTab] = useState<"priority" | "new" | "bidding">("priority");
  const [projectSlide, setProjectSlide] = useState(0);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(() => {
    return localStorage.getItem('vendor_welcome_banner_dismissed') !== 'true';
  });

  const dismissWelcomeBanner = () => {
    setShowWelcomeBanner(false);
    localStorage.setItem('vendor_welcome_banner_dismissed', 'true');
  };
  
  // Modal state for issue details
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);

  // Real data queries
  const { data: vendor, isLoading: isVendorLoading, error: vendorError } = useGetVendorByVendorUserIdQuery(String(user.id));
  const { data: vendorOffers = [] } = useGetOffersByVendorIdQuery(Number(user.id), { skip: !user.id });
  const { data: issues, error: issuesError } = useGetIssuesQuery();
  const { data: listings = [] } = useGetListingsQuery();

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
  const openIssueModal = (issueId: number, defaultTab: "details" | "offers" = "details") => {
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

  // Get vendor specialties for filtering
  const vendorSpecialties = useMemo(() => {
    if (!vendor?.vendor_types) return [];
    return vendor.vendor_types.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
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
    }>
  >([]);

  // Filter and fetch marketplace opportunities
  useEffect(() => {
    const fetchOpportunities = async () => {
      if (!issues) return;

      const available = issues.filter((i) => i.status === "Status.OPEN" && !i.vendor_id && i.active);
      
      const filtered = vendorSpecialties.length > 0
        ? available.filter((i) => {
            const issueType = (i.type || '').toLowerCase();
            return vendorSpecialties.some(specialty => 
              issueType.includes(specialty) || specialty.includes(issueType) || specialty === 'general'
            );
          })
        : available;
      
      const sorted = [...filtered].sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        return (severityOrder[a.severity as keyof typeof severityOrder] || 2) -
               (severityOrder[b.severity as keyof typeof severityOrder] || 2);
      });

      const jobsWithBids = await Promise.all(
        sorted.slice(0, 10).map(async (issue) => {
          let bidCount = 0;
          try {
            const result = await store.dispatch(getOffersByIssueId.initiate(issue.id));
            bidCount = result.data?.length || 0;
          } catch {}
          
          const listing = listingsMap[issue.listing_id];
          
          return {
            id: issue.id,
            type: issue.type || "General",
            summary: issue.summary || "View details",
            severity: issue.severity,
            bidCount,
            listing,
            isHot: issue.severity === 'high' || bidCount === 0,
          };
        })
      );

      setMarketplaceJobs(jobsWithBids);
    };

    fetchOpportunities();
  }, [issues, vendorSpecialties, listingsMap]);

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

  // Pending bids
  const pendingBids = useMemo(() => {
    return vendorOffers
      .filter((o) => o.status === IssueOfferStatus.RECEIVED)
      .map((o) => {
        const issue = issuesMap[o.issue_id];
        const listing = issue ? listingsMap[issue.listing_id] : undefined;
        return { offer: o, issue, listing };
      })
      .filter((b) => b.issue);
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

  // Pending bids count (we don't have expiry dates currently)
  const pendingBidsCount = pendingBids.length;

  // Recent activity - derived from actual offers/jobs data
  const recentActivity = useMemo(() => {
    const activities: Array<{ id: number; action: string; category: string; time: string }> = [];
    
    // Add accepted offers as activity
    vendorOffers
      .filter(o => o.status === IssueOfferStatus.ACCEPTED)
      .slice(0, 3)
      .forEach((offer, idx) => {
        const issue = issuesMap[offer.issue_id];
        if (issue) {
          activities.push({
            id: offer.id,
            action: `Quote accepted for ${issue.summary || normalizeAndCapitalize(issue.type || '')}`,
            category: normalizeAndCapitalize(issue.type || 'Job'),
            time: offer.updated_at ? getRelativeTime(new Date(offer.updated_at)) : 'Recently',
          });
        }
      });
    
    return activities;
  }, [vendorOffers, issuesMap]);

  // Project slideshow auto-rotate (sliding window - shows 2 items, slides by 1)
  useEffect(() => {
    if (activeJobs.length <= 2) return;
    const maxSlide = activeJobs.length - 2;
    const timer = setInterval(() => {
      setProjectSlide((prev) => (prev >= maxSlide ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [activeJobs.length]);

  // Loading/Error states
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

  // Priority scoring for jobs (higher = more priority)
  const getPriorityScore = (job: typeof marketplaceJobs[0]) => {
    let score = 0;
    
    // High severity is more urgent
    if (job.severity === 'high') score += 100;
    else if (job.severity === 'medium') score += 50;
    
    // Fewer bids = better opportunity
    if (job.bidCount === 0) score += 80; // Hot - be first!
    else if (job.bidCount === 1) score += 40;
    else if (job.bidCount === 2) score += 20;
    // 3+ bids = harder to win, lower priority
    
    return score;
  };

  // Priority list items based on active tab
  const getPriorityItems = () => {
    switch (activeTab) {
      case "new":
        // All marketplace jobs vendor hasn't bid on yet (max 5)
        return marketplaceJobs.filter(j => !alreadyBidOnIds.has(j.id)).slice(0, 5);
      
      case "bidding":
        // Vendor's pending bids (max 5)
        return pendingBids.slice(0, 5).map(b => ({
          id: b.issue?.id || 0,
          type: b.issue?.type || "General",
          summary: b.issue?.summary || "",
          severity: b.issue?.severity || "medium",
          bidCount: 1,
          listing: b.listing,
          isHot: false,
          myBid: b.offer.price,
        }));
      
      default:
        // Priority List: Jobs to bid on, ranked by opportunity (max 5)
        // Exclude jobs already bid on, prioritize high severity + low competition
        const availableJobs = marketplaceJobs
          .filter(j => !alreadyBidOnIds.has(j.id)) // Haven't bid yet
          .filter(j => j.bidCount < 3) // Still winnable (less than 3 bids)
          .map(j => ({
            ...j,
            priorityScore: getPriorityScore(j),
            isHot: j.severity === 'high' || j.bidCount === 0,
          }))
          .sort((a, b) => b.priorityScore - a.priorityScore) // Highest priority first
          .slice(0, 5); // Limit to 5 items
        
        return availableJobs;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-100">
      <div className="w-full max-w-[1800px] mx-auto px-4 py-4 lg:px-6">
        
        {/* New Vendor Welcome Banner */}
        {isNewVendor && showWelcomeBanner && (
          <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 relative">
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
          {/* New Job Alert */}
          <div 
            onClick={() => { setActiveTab("new"); }}
            className="bg-white rounded-xl p-5 cursor-pointer border-l-4 border-transparent hover:border-amber-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-4xl font-bold text-amber-500">{availableCount}</span>
              {availableCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded">
                  hot <FontAwesomeIcon icon={faFire} className="ml-0.5" />
                </span>
              )}
            </div>
            <div className="text-sm font-semibold text-gray-900">New Job Alert</div>
            {availableCount > 0 && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                Be first to bid
              </div>
            )}
          </div>

          {/* Active Jobs */}
          <div 
            onClick={() => navigate("/vendor/jobs?tab=active")}
            className="bg-white rounded-xl p-5 cursor-pointer border-l-4 border-transparent hover:border-amber-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-4xl font-bold text-gray-900">
                {vendorMetrics.activeJobs > 0 ? vendorMetrics.activeJobs : "—"}
              </span>
              <FontAwesomeIcon icon={faChevronRight} className="text-gray-400" />
            </div>
            <div className="text-sm font-semibold text-gray-900">Active Jobs</div>
            <div className="text-xs text-gray-500 mt-1">
              {vendorMetrics.activeJobs > 0 
                ? `$${activeJobs.reduce((sum, j) => sum + (j.offer.price || 0), 0).toLocaleString()} In Progress`
                : "Win a bid to start"
              }
            </div>
          </div>

          {/* Jobs Bidding */}
          <div 
            onClick={() => { setActiveTab("bidding"); }}
            className="bg-white rounded-xl p-5 cursor-pointer border-l-4 border-transparent hover:border-amber-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-4xl font-bold text-gray-900">
                {vendorMetrics.pendingBids > 0 ? vendorMetrics.pendingBids : "—"}
              </span>
              <FontAwesomeIcon icon={faChevronRight} className="text-gray-400" />
            </div>
            <div className="text-sm font-semibold text-gray-900">My Bids</div>
            <div className="text-xs mt-1">
              {pendingBidsCount > 0 ? (
                <span className="text-amber-600">Awaiting response</span>
              ) : (
                <span className="text-gray-500">Place your first bid</span>
              )}
            </div>
          </div>

          {/* Earnings & Performance - Dark Card */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-5 text-white">
            <div className="text-sm font-medium text-gray-400 mb-3">Earnings & Performance</div>
            {vendorMetrics.totalEarnings === 0 && vendorMetrics.thisMonthEarnings === 0 && vendorMetrics.outstandingBids === 0 ? (
              // New vendor - show encouraging message
              <div className="text-center py-2">
                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FontAwesomeIcon icon={faRocket} className="text-amber-400 text-lg" />
                </div>
                <div className="text-base font-semibold text-white mb-1">Start Earning</div>
                <div className="text-xs text-gray-400">Win your first bid to see your earnings here</div>
              </div>
            ) : (
              // Existing vendor - show earnings
              <>
                <div className="flex justify-between items-start mb-3">
                  <div className="text-left">
                    <div className="text-2xl font-bold">${vendorMetrics.thisMonthEarnings.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">This Month</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">${vendorMetrics.totalEarnings.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">Year To Date</div>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-700 text-center">
                  <div className="text-xl font-bold">${vendorMetrics.outstandingBids.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Outstanding Bids</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Column - Priority List */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white rounded-xl overflow-hidden">
              {/* Priority List Header with Tabs */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    {/* Tabs */}
                    <button
                      onClick={() => setActiveTab("priority")}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === "priority" 
                          ? "bg-gray-900 text-white" 
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <FontAwesomeIcon icon={faListUl} />
                      Priority List
                    </button>
                    <button
                      onClick={() => setActiveTab("new")}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === "new" 
                          ? "bg-gray-900 text-white" 
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <FontAwesomeIcon icon={faBriefcase} />
                      New Jobs
                    </button>
                    <button
                      onClick={() => setActiveTab("bidding")}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === "bidding" 
                          ? "bg-gray-900 text-white" 
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <FontAwesomeIcon icon={faClock} />
                      My Bids
                      {vendorMetrics.pendingBids > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                          {vendorMetrics.pendingBids}+
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Priority List Items */}
              <div className="divide-y divide-gray-100">
                {getPriorityItems().length > 0 ? (
                  getPriorityItems().map((item: any, index) => (
                    <div key={item.id || index}>
                      {/* Job Row */}
                      <div 
                        onClick={() => openIssueModal(item.id, activeTab === "bidding" ? "offers" : "details")}
                        className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 border-transparent hover:border-amber-500"
                      >
                        <div className="flex items-center gap-4">
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            item.isHot ? "bg-amber-100" : "bg-gray-100"
                          }`}>
                            <FontAwesomeIcon 
                              icon={pickIcon(item.type)} 
                              className={item.isHot ? "text-amber-600" : "text-gray-600"} 
                            />
                          </div>
                          
                          {/* Job Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {item.isHot && (
                                <span className="text-xs font-bold text-amber-600">hot</span>
                              )}
                              <span className="font-semibold text-gray-900 truncate max-w-[300px]">
                                {item.summary || `${normalizeAndCapitalize(item.type)} Issue`}
                              </span>
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded flex-shrink-0">
                                {normalizeAndCapitalize(item.type)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {item.listing?.address || "View location"}
                            </div>
                          </div>
                        </div>

                        {/* Right side info */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {item.myBid ? (
                            <span className="text-lg font-bold text-gray-900">
                              ${item.myBid.toLocaleString()}
                            </span>
                          ) : item.bidCount === 0 ? (
                            <span className="text-xs font-medium text-emerald-600 whitespace-nowrap bg-emerald-50 px-2 py-1 rounded">Be first!</span>
                          ) : (
                            <span className="text-xs text-gray-500 whitespace-nowrap">{item.bidCount} bid{item.bidCount !== 1 ? 's' : ''}</span>
                          )}
                          <button 
                            className="px-3 py-1.5 bg-amber-500 text-gray-900 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors flex items-center gap-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              openIssueModal(item.id, activeTab === "bidding" ? "offers" : "details");
                            }}
                          >
                            {activeTab === "bidding" ? "View Bid" : "View & Bid"}
                            <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <FontAwesomeIcon icon={faBriefcase} className="text-gray-400 text-2xl" />
                    </div>
                    <p className="text-gray-600 font-medium mb-2">
                      {activeTab === "bidding" ? "No pending bids" : "No jobs available"}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      {activeTab === "bidding" 
                        ? "Submit bids on jobs to see them here" 
                        : "Check back later for new opportunities"}
                    </p>
                    <Link
                      to="/marketplace"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-gray-900 rounded-lg font-semibold text-sm hover:bg-amber-400 transition-colors"
                    >
                      <FontAwesomeIcon icon={faSearch} />
                      Browse Marketplace
                    </Link>
                  </div>
                )}

                {/* Prominent Marketplace Button */}
                {(activeTab === "priority" || activeTab === "new") && (
                  <div className="px-5 py-4 border-t border-gray-100">
                    <Link
                      to="/marketplace"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-gray-900 rounded-lg font-semibold text-sm hover:bg-amber-400 transition-colors"
                    >
                      <FontAwesomeIcon icon={faSearch} />
                      Explore Marketplace
                      <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                    </Link>
                  </div>
                )}
                {activeTab === "bidding" && (
                  <div className="px-5 py-4 border-t border-gray-100">
                    <Link
                      to="/vendor/jobs?tab=pending"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-900 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-colors"
                    >
                      View all pending bids
                      <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Active Projects Slideshow - Inside left column */}
            <div className="bg-white rounded-xl overflow-hidden mt-6">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faBriefcase} className="text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">Active Projects</span>
                  </div>
                  
                  {/* Slideshow Navigation - only show when more than 2 items */}
                  {activeJobs.length > 2 && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: activeJobs.length - 1 }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setProjectSlide(i)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              i === projectSlide ? "bg-gray-900" : "bg-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setProjectSlide(Math.max(0, projectSlide - 1))}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <button
                          onClick={() => setProjectSlide(Math.min(Math.max(0, activeJobs.length - 2), projectSlide + 1))}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-5">
                {activeJobs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeJobs.slice(projectSlide, projectSlide + 2).map(({ offer, issue, listing }) => (
                      <div 
                        key={offer.id}
                        className="rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => issue?.id && openIssueModal(issue.id, "details")}
                      >
                        {/* Project Image */}
                        <div className="relative h-32 bg-gray-200">
                          {listing?.image_url ? (
                            <ImageComponent
                              src={listing.image_url}
                              alt={listing.address || "Project"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                              <FontAwesomeIcon icon={faHouse} className="text-gray-400 text-3xl" />
                            </div>
                          )}
                          {/* Overlay with title */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                            <div className="font-semibold text-white text-sm truncate">
                              {issue?.summary || `${normalizeAndCapitalize(issue?.type || "")} Project`}
                            </div>
                            <div className="text-xs text-white/80 truncate">
                              {listing?.address?.split(',')[0]}
                            </div>
                          </div>
                          {/* Avatar */}
                          <div className="absolute bottom-3 right-3">
                            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                              {vendor?.name?.[0] || "V"}
                            </div>
                          </div>
                        </div>
                        
                        {/* Project Details */}
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                              {normalizeAndCapitalize(issue?.type || "")}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              ${offer.price?.toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-xs text-amber-600">
                            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                            In progress
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <FontAwesomeIcon icon={faBriefcase} className="text-amber-500 text-2xl" />
                    </div>
                    <p className="text-gray-900 font-semibold mb-1">No active projects yet</p>
                    <p className="text-sm text-gray-500 mb-4">Browse jobs and submit your first bid to get started</p>
                    <Link
                      to="/marketplace"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-gray-900 rounded-lg font-semibold text-sm hover:bg-amber-400 transition-colors"
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

          {/* Right Column - Sidebar (Performance + Recent Activity) */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Performance Card */}
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <FontAwesomeIcon icon={faTrophy} className="text-amber-600" />
                  </div>
                  <span className="font-semibold text-gray-900">Performance</span>
                </div>
              </div>
              
              <div className="p-5">
                {/* Win Rate Circle */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <svg className="w-28 h-28 transform -rotate-90">
                      <circle cx="56" cy="56" r="48" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                      <circle 
                        cx="56" cy="56" r="48" 
                        stroke="#3b82f6" 
                        strokeWidth="8" 
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${winRate * 3.01} 301`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">{winRate}%</div>
                        <div className="text-xs text-gray-500">Win Rate</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{vendorMetrics.totalBids}</div>
                    <div className="text-xs text-gray-500">Total Bids</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-emerald-600">{vendorMetrics.acceptedCount}</div>
                    <div className="text-xs text-gray-500">Won</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{vendorMetrics.completedJobs}</div>
                    <div className="text-xs text-gray-500">Completed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faCalendarCheck} className="text-gray-600" />
                    </div>
                    <span className="font-semibold text-gray-900">Recent Activity</span>
                  </div>
                  <FontAwesomeIcon icon={faChevronRight} className="text-gray-400" />
                </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0">
                          <FontAwesomeIcon icon={faCheck} className="text-xs" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900">{activity.action}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{activity.category}</div>
                        </div>
                        <div className="text-xs text-gray-400 flex-shrink-0">{activity.time}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <FontAwesomeIcon icon={faCalendarCheck} className="text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium text-sm mb-1">No recent activity</p>
                    <p className="text-xs text-gray-500">Activity will appear as you win bids</p>
                  </div>
                )}
              </div>
            </div>
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
