import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faExternalLinkAlt,
  faBolt,
  faBriefcase,
  faBuilding,
  faBroom,
  faCalendarAlt,
  faCheckCircle,
  faChevronRight,
  faClock,
  faDollarSign,
  faFire,
  faGripLines,
  faHammer,
  faHouse,
  faLayerGroup,
  faLeaf,
  faPaintRoller,
  faQuestionCircle,
  faRocket,
  faSearch,
  faSnowflake,
  faStar,
  faTint,
  faTools,
  faTrophy,
  faWind,
  faWrench,
} from "@fortawesome/free-solid-svg-icons";
import { User, IssueOfferStatus, IssueType } from "../types";
import UserCalendar from "../components/UserCalendar";
import { useGetIssuesQuery } from "../features/api/issuesApi";
import { useGetAssessmentsByUserIdQuery } from "../features/api/issueAssessmentsApi";
import { useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";
import { useGetOffersByVendorIdQuery, getOffersByIssueId } from "../features/api/issueOffersApi";
import { store } from "../store/store";

// Issue type icons mapping
const issueIcons: Record<string, any> = {
  general: faWrench,
  structural: faBuilding,
  electrician: faBolt,
  plumber: faTint,
  painter: faPaintRoller,
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

interface DashboardProps {
  user: User;
}

const VendorDashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();

  // Real data queries
  const { data: vendor, isLoading: isVendorLoading, error: vendorError } = useGetVendorByVendorUserIdQuery(String(user.id));
  const { data: assessments = [] } = useGetAssessmentsByUserIdQuery(Number(vendor?.id), { skip: !vendor?.id });
  const { data: vendorOffers = [] } = useGetOffersByVendorIdQuery(Number(user.id), { skip: !user.id });
  const { data: issues, error: issuesError } = useGetIssuesQuery();

  // Issues map for lookups
  const issuesMap = useMemo(() => {
    if (!issues) return {};
    return issues.reduce((acc, issue) => {
      acc[issue.id] = issue;
      return acc;
    }, {} as Record<number, IssueType>);
  }, [issues]);

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

    return {
      activeJobs,
      completedJobs,
      totalEarnings,
      pendingBids: pendingOffers.length,
      totalBids: vendorOffers.length,
      acceptedCount: acceptedOffers.length,
    };
  }, [vendorOffers, issuesMap]);

  // Calendar events from real assessments
  const calendarEvents = useMemo(() => {
    return assessments
      .filter((a) => new Date(a.start_time) > new Date())
      .map((a) => {
        const issue = issuesMap[a.issue_id];
        return {
          id: String(a.id),
          title: `Assessment - ${issue?.summary || normalizeAndCapitalize(issue?.type || "") + " Issue"}`,
          start: new Date(a.start_time),
          end: new Date(a.end_time),
          user_id: a.user_id,
        };
      });
  }, [assessments, issuesMap]);

  // Available opportunities from marketplace
  const [marketplaceOpportunities, setMarketplaceOpportunities] = useState<
    Array<{
      id: number;
      type: string;
      summary: string;
      severity: string;
      bidCount: number;
    }>
  >([]);

  // Get vendor specialties for filtering
  const vendorSpecialties = useMemo(() => {
    if (!vendor?.vendor_types) return [];
    // Parse comma-separated vendor types (e.g., "plumber, electrician")
    return vendor.vendor_types.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  }, [vendor?.vendor_types]);

  // Filter and fetch marketplace opportunities matching vendor specialty
  useEffect(() => {
    const fetchOpportunities = async () => {
      if (!issues) return;

      const available = issues.filter((i) => i.status === "Status.OPEN" && !i.vendor_id && i.active);
      
      // Filter by vendor specialty if they have specialties defined
      const filtered = vendorSpecialties.length > 0
        ? available.filter((i) => {
            const issueType = (i.type || '').toLowerCase();
            // Match if issue type contains any of vendor's specialties
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

      const top5 = await Promise.all(
        sorted.slice(0, 5).map(async (issue) => {
          let bidCount = 0;
          try {
            const result = await store.dispatch(getOffersByIssueId.initiate(issue.id));
            bidCount = result.data?.length || 0;
          } catch {}
          return {
            id: issue.id,
            type: issue.type || "General",
            summary: issue.summary || "View details",
            severity: issue.severity,
            bidCount,
          };
        })
      );

      setMarketplaceOpportunities(top5);
    };

    fetchOpportunities();
  }, [issues, vendorSpecialties]);

  // Active jobs (accepted offers) - limit to 3 for dashboard
  const activeJobs = useMemo(() => {
    return vendorOffers
      .filter((o) => o.status === IssueOfferStatus.ACCEPTED)
      .map((o) => {
        const issue = issuesMap[o.issue_id];
        return { offer: o, issue };
      })
      .filter((j) => j.issue && j.issue.status !== "Status.COMPLETED")
      .slice(0, 3);
  }, [vendorOffers, issuesMap]);

  // Pending bids
  const pendingBids = useMemo(() => {
    return vendorOffers
      .filter((o) => o.status === IssueOfferStatus.RECEIVED)
      .map((o) => {
        const issue = issuesMap[o.issue_id];
        return { offer: o, issue };
      })
      .filter((b) => b.issue)
      .slice(0, 3);
  }, [vendorOffers, issuesMap]);

  // User state
  const isNewVendor = vendorMetrics.totalBids === 0;
  const hasPendingBids = vendorMetrics.pendingBids > 0;
  const hasUpcomingAssessments = calendarEvents.length > 0;
  
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

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Loading/Error states
  if (issuesError) return <p>Error loading dashboard data</p>;
  if (isVendorLoading) {
    return (
      <div className="min-h-screen w-full bg-gray-50 p-8">
        <div className="w-full max-w-[1800px] mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded-xl w-1/3"></div>
            <div className="h-48 bg-gray-200 rounded-2xl"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (vendorError) return <p>Failed to load vendor data.</p>;
  if (!vendor) return <p>Vendor not found.</p>;

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full max-w-[1800px] mx-auto px-4 py-3 lg:px-8 lg:py-4">
        
        {/* Hero Section - Dark for Impact */}
        <div className="relative mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-lg">
          
          <div className="relative px-5 py-4 lg:px-6 lg:py-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-xl lg:text-2xl font-bold mb-1 text-white">
                  {getGreeting()}, {vendor.name?.split(' ')[0] || "there"}!
                </h1>
                <p className="text-gray-400 text-sm max-w-xl">
                  {isNewVendor
                    ? "Welcome aboard! Your journey to finding great projects starts here."
                    : vendorMetrics.activeJobs > 0
                    ? `You're crushing it with ${vendorMetrics.activeJobs} active ${vendorMetrics.activeJobs === 1 ? 'job' : 'jobs'}.`
                    : "Ready to find your next project?"}
                </p>
              </div>
              
              <Link
                to={`/marketplace?type=${encodeURIComponent(vendor?.vendor_types?.split(',')[0]?.trim() || '')}&city=${encodeURIComponent(vendor?.city || '')}`}
                className="group inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-gray-900 rounded-xl font-semibold text-sm hover:bg-amber-400 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
              >
                <FontAwesomeIcon icon={faSearch} />
                <span>Find Work</span>
                <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {/* Quick Stats Row - Clean Pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
                <span className="stat-value text-base text-white">{vendorMetrics.activeJobs}</span>
                <span className="text-gray-300 text-xs">Active</span>
              </div>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
                <span className="stat-value text-base text-white">{vendorMetrics.pendingBids}</span>
                <span className="text-gray-300 text-xs">Pending</span>
              </div>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
                <span className="stat-value text-base text-white">${(vendorMetrics.totalEarnings / 1000).toFixed(1)}k</span>
                <span className="text-gray-300 text-xs">Earned</span>
              </div>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
                <span className="stat-value text-base text-white">{vendorMetrics.completedJobs}</span>
                <span className="text-gray-300 text-xs">Completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* NEW VENDOR: Welcome CTA */}
        {isNewVendor && (
          <div className="mb-8 p-8 rounded-3xl bg-white border border-gray-200 shadow-sm">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mb-4">
                  <FontAwesomeIcon icon={faBolt} />
                  Get Started
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                  Find Your First Project
                </h2>
                <p className="text-gray-600 text-lg mb-6 max-w-lg">
                  Browse {availableCount} available jobs, submit competitive bids, and start building your reputation.
                </p>
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-yellow-500" />
                    Verified homeowners
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-yellow-500" />
                    Set your own rates
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-yellow-500" />
                    Get paid securely
                  </div>
                </div>
                <Link
                  to="/marketplace"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition shadow-lg"
                >
                  <FontAwesomeIcon icon={faRocket} />
                  Explore Marketplace
                  <FontAwesomeIcon icon={faArrowRight} />
                </Link>
              </div>
              <div className="hidden lg:flex items-center justify-center">
                <div className="relative">
                  <div className="w-48 h-48 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl rotate-6 opacity-20"></div>
                  <div className="absolute inset-0 w-48 h-48 bg-white rounded-3xl shadow-xl border border-gray-200 flex items-center justify-center">
                    <FontAwesomeIcon icon={faBriefcase} className="text-6xl text-yellow-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EXISTING VENDOR: Bento Grid Layout */}
        {!isNewVendor && (
          <div className="grid grid-cols-12 gap-4">
            
            {/* LEFT COLUMN - Active Jobs + Awaiting Response */}
            <div className="col-span-12 lg:col-span-7 space-y-4">
              {/* Active Jobs Card */}
              <div className="dashboard-card">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faBriefcase} className="text-white text-sm" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-gray-900">Active Jobs</h3>
                        <p className="text-xs text-gray-600">{activeJobs.length} in progress</p>
                      </div>
                    </div>
                    {activeJobs.length > 0 && (
                      <Link to="/vendor/jobs" className="text-gray-600 hover:text-gray-900 text-xs font-medium flex items-center gap-1">
                        View All <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                      </Link>
                    )}
                  </div>
                </div>
                
                <div className="p-2">
                  {activeJobs.length > 0 ? (
                    <div className="grid gap-1.5">
                      {activeJobs.map(({ offer, issue }) => (
                        <div
                          key={offer.id}
                          onClick={() => navigate(`/marketplace/${issue?.id}`)}
                          className="group flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-100 hover:border-gray-300 cursor-pointer transition-all hover:shadow-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gray-100 rounded-md flex items-center justify-center">
                              <FontAwesomeIcon icon={pickIcon(issue?.type)} className="text-gray-700 text-xs" />
                            </div>
                            <div>
                              <div className="font-medium text-xs text-gray-900 group-hover:text-gray-700 transition-colors">
                                {issue?.summary || `${normalizeAndCapitalize(issue?.type || "")} Issue`}
                              </div>
                              <div className="text-xs text-gray-600 max-w-xs truncate capitalize">{issue?.type || "Job"}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="font-mono font-semibold text-xs text-gray-900">${offer.price?.toLocaleString()}</div>
                              <div className="text-xs text-emerald-600 font-medium">Accepted</div>
                            </div>
                            <FontAwesomeIcon icon={faArrowRight} className="text-gray-300 group-hover:text-gray-600 group-hover:translate-x-1 transition-all text-xs" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <FontAwesomeIcon icon={faBriefcase} className="text-gray-400 text-lg" />
                      </div>
                      <p className="text-gray-600 mb-1 font-medium text-xs">No active jobs yet</p>
                      <p className="text-xs text-gray-600 mb-2">Win a bid to start your first project</p>
                      <Link
                        to="/marketplace"
                        className="inline-flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium text-xs"
                      >
                        Browse marketplace <FontAwesomeIcon icon={faArrowRight} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Pending Bids - Awaiting Response - Inside left column */}
              {hasPendingBids && (
                <div className="dashboard-card">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faClock} className="text-white text-sm" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-gray-900">Awaiting Response</h3>
                        <p className="text-xs text-gray-600">{pendingBids.length} bids under review</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 space-y-1.5">
                    {pendingBids.map(({ offer, issue }) => (
                      <div
                        key={offer.id}
                        onClick={() => navigate(`/marketplace/${issue?.id}`)}
                        className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-yellow-100 rounded-md flex items-center justify-center">
                            <FontAwesomeIcon icon={pickIcon(issue?.type)} className="text-yellow-600 text-xs" />
                          </div>
                          <div>
                            <div className="font-medium text-xs text-gray-900 capitalize">{issue?.type}</div>
                            <div className="text-xs text-gray-600 truncate max-w-xs">{issue?.summary}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-semibold text-xs text-gray-900">${offer.price?.toLocaleString()}</div>
                          <div className="text-xs text-yellow-600 font-medium">Pending</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Schedule Card - Inside left column */}
              <div className="dashboard-card">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-white text-sm" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">Schedule</h3>
                      <p className="text-xs text-gray-600">
                        {hasUpcomingAssessments ? `${calendarEvents.length} upcoming` : 'No scheduled assessments'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  {hasUpcomingAssessments ? (
                    <div className="min-h-[200px]">
                      <UserCalendar events={calendarEvents as any} />
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 text-lg" />
                      </div>
                      <p className="text-gray-600 mb-1 font-medium text-xs">No assessments scheduled</p>
                      <p className="text-xs text-gray-600">Win bids to schedule on-site visits</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Side Cards - Hot Opportunities first, then Performance */}
            <div className="col-span-12 lg:col-span-5 space-y-4">
              {/* Available Jobs Preview - FIRST */}
              <div className="dashboard-card">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faFire} className="text-white text-sm" />
                      </div>
                      <h3 className="font-semibold text-sm text-gray-900">Hot Opportunities</h3>
                    </div>
                    <span className="px-2 py-0.5 bg-gray-900 text-white rounded-full text-xs font-bold">
                      {availableCount} jobs
                    </span>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  {marketplaceOpportunities.slice(0, 3).map((opp) => (
                    <div
                      key={opp.id}
                      onClick={() => navigate(`/marketplace/${opp.id}`)}
                      className="group p-2.5 rounded-lg bg-gray-50 hover:bg-white border border-gray-100 hover:border-gray-300 cursor-pointer transition-all hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-medium text-xs text-gray-900 group-hover:text-gray-700 capitalize">
                          {opp.type}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          opp.severity === "high" ? "bg-red-100 text-red-700" :
                          opp.severity === "medium" ? "bg-yellow-100 text-yellow-700" :
                          "bg-emerald-100 text-emerald-700"
                        }`}>
                          {opp.severity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{opp.summary}</p>
                      <div className="flex items-center justify-between mt-1.5 text-xs">
                        <span className="text-gray-400">
                          {opp.bidCount === 0 ? "Be first to bid!" : `${opp.bidCount} bid${opp.bidCount !== 1 ? 's' : ''}`}
                        </span>
                        <span className="text-gray-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          View <FontAwesomeIcon icon={faExternalLinkAlt} />
                        </span>
                      </div>
                    </div>
                  ))}
                  <Link
                    to="/marketplace"
                    className="block text-center py-2 text-xs font-medium text-gray-900 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200"
                  >
                    See All Jobs →
                  </Link>
                </div>
              </div>

              {/* Win Rate Card - SECOND */}
              <div className="dashboard-card">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faTrophy} className="text-white text-sm" />
                      </div>
                      <h3 className="font-semibold text-sm text-gray-900">Performance</h3>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FontAwesomeIcon 
                          key={star} 
                          icon={faStar} 
                          className={`text-xs ${star <= 4 ? "text-amber-400" : "text-gray-200"}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-center py-2">
                    <div className="relative inline-flex">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle cx="48" cy="48" r="42" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                        <circle 
                          cx="48" cy="48" r="42" 
                          stroke="url(#gradientBlue)" 
                          strokeWidth="8" 
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${winRate * 2.64} 264`}
                        />
                        <defs>
                          <linearGradient id="gradientBlue" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#6366f1" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div>
                          <div className="stat-value text-2xl text-gray-900">{winRate}%</div>
                          <div className="text-xs text-gray-600">Win Rate</div>
                        </div>
                      </div>
                    </div>
                  </div>
                
                  <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
                    <div className="text-center">
                      <div className="stat-value text-lg text-gray-900">{vendorMetrics.totalBids}</div>
                      <div className="text-xs text-gray-600">Total Bids</div>
                    </div>
                    <div className="text-center">
                      <div className="stat-value text-lg text-emerald-600">{vendorMetrics.acceptedCount}</div>
                      <div className="text-xs text-gray-600">Won</div>
                    </div>
                    <div className="text-center">
                      <div className="stat-value text-lg text-emerald-600">{vendorMetrics.completedJobs}</div>
                      <div className="text-xs text-gray-600">Done</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions - if no pending bids */}
            {!hasPendingBids && (
              <div className="col-span-12 lg:col-span-5">
                <div className="dashboard-card h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white border-0 relative overflow-hidden">
                  <div className="relative p-6 h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                        <FontAwesomeIcon icon={faFire} className="text-white" />
                      </div>
                      <h3 className="font-semibold">Grow Your Business</h3>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <Link
                        to="/marketplace"
                        className="block p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FontAwesomeIcon icon={faRocket} className="text-gray-400" />
                          <div className="flex-1">
                            <div className="font-medium">Find New Jobs</div>
                            <div className="text-sm text-gray-400">{availableCount} opportunities</div>
                          </div>
                          <FontAwesomeIcon icon={faChevronRight} className="text-gray-500" />
                        </div>
                      </Link>
                      
                      <Link
                        to="/vendor/jobs"
                        className="block p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FontAwesomeIcon icon={faBriefcase} className="text-gray-400" />
                          <div className="flex-1">
                            <div className="font-medium">Manage Jobs</div>
                            <div className="text-sm text-gray-400">View all your work</div>
                          </div>
                          <FontAwesomeIcon icon={faChevronRight} className="text-gray-500" />
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;
