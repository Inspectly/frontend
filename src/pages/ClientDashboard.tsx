import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import UserCalendar from "../components/UserCalendar";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";
import { useUploadReportFileMutation, useGetReportsByUserIdQuery } from "../features/api/reportsApi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBolt,
  faBuilding,
  faCalendarAlt,
  faCheckCircle,
  faChevronRight,
  faClipboardList,
  faClock,
  faExclamationTriangle,
  faFileAlt,
  faHome,
  faMapMarkerAlt,
  faPlus,
  faRocket,
  faTrophy,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import {
  CalendarReadyAssessment,
  IssueAssessmentStatus,
  IssueOffer,
  IssueOfferStatus,
  User,
} from "../types";
import VendorMap from "../components/VendorMap";
import ImageComponent from "../components/ImageComponent";
import { useGetIssuesQuery } from "../features/api/issuesApi";
import { useCreateListingMutation, useGetListingByUserIdQuery } from "../features/api/listingsApi";
import { useGetClientsQuery } from "../features/api/clientsApi";
import { useGetAssessmentsByClientIdUsersInteractionIdQuery } from "../features/api/issueAssessmentsApi";
import { getOffersByIssueId } from "../features/api/issueOffersApi";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store/store";
import AddListingByReportModal, { ListingByReportFormData } from "../components/AddListingByReportModal";
import { handleAddListingWithReport } from "../utils/reportUtil";
import CreateIssueModal from "../components/CreateIssueModal";

interface DashboardProps {
  user: User;
}

const ClientDashboard: React.FC<DashboardProps> = ({ user }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Queries - all real data
  const { data: _listings } = useGetListingByUserIdQuery(user?.id, { skip: !user?.id });
  const { data: reports, refetch: refetchReports } = useGetReportsByUserIdQuery(user?.id, { skip: !user?.id });
  const { data: issues } = useGetIssuesQuery();
  const { data: clients } = useGetClientsQuery();
  const client = clients?.find((c) => c.user_id === user.id);

  const { data: assessments = [] } =
    useGetAssessmentsByClientIdUsersInteractionIdQuery(user.id);

  const [createListing] = useCreateListingMutation();
  const [uploadReportFile] = useUploadReportFileMutation();

  // Parse accepted assessments
  const acceptedAssessments = useMemo(() => {
    return assessments
      .filter((a) => a.status === IssueAssessmentStatus.ACCEPTED)
      .map((a) => {
        const parts = a.users_interaction_id?.split("_") ?? [];
        const vendor_id = parts.length > 1 ? parseInt(parts[1], 10) : NaN;
        return { ...a, vendor_id: Number.isFinite(vendor_id) ? vendor_id : null };
      })
      .filter((a) => a.vendor_id !== null) as Array<(typeof assessments)[number] & { vendor_id: number }>;
  }, [assessments]);

  const issueIds = useMemo(() => [...new Set(acceptedAssessments.map((a) => a.issue_id))], [acceptedAssessments]);
  const vendorIds = useMemo(() => [...new Set(acceptedAssessments.map((a) => a.vendor_id))], [acceptedAssessments]);

  const [offersByIssueId, setOffersByIssueId] = useState<Record<number, IssueOffer[]>>({});
  const [isAddListingModalOpen, setIsAddListingModalOpen] = useState<boolean>(false);
  const [isCreateIssueModalOpen, setIsCreateIssueModalOpen] = useState<boolean>(false);

  // Issues for this user
  const filteredIssuesByUser = useMemo(() => {
    if (!issues || !reports) return [];
    const userReportIds = reports.filter((r) => r.user_id === user.id).map((r) => r.id);
    return issues.filter((issue) => userReportIds.includes(issue.report_id));
  }, [issues, reports, user.id]);

  // Real metrics
  const realMetrics = useMemo(() => {
    const totalIssues = filteredIssuesByUser.length;
    const openIssues = filteredIssuesByUser.filter(
      (i) => i.status === "Status.OPEN" || i.status === "Status.IN_PROGRESS"
    ).length;
    const completedIssues = filteredIssuesByUser.filter((i) => i.status === "Status.COMPLETED").length;
    const inProgressIssues = filteredIssuesByUser.filter((i) => i.status === "Status.IN_PROGRESS").length;
    const reviewIssues = filteredIssuesByUser.filter((i) => i.status === "Status.REVIEW").length;
    const totalReports = reports?.length || 0;
    const totalListings = _listings?.length || 0;
    const totalOffersReceived = Object.values(offersByIssueId).flat().length;
    const pendingOffers = Object.values(offersByIssueId)
      .flat()
      .filter((o) => o.status === IssueOfferStatus.RECEIVED).length;

    return { totalIssues, openIssues, completedIssues, inProgressIssues, reviewIssues, totalReports, totalListings, totalOffersReceived, pendingOffers };
  }, [filteredIssuesByUser, reports, _listings, offersByIssueId]);

  // Issues with pending offers (for action items)
  const issuesWithPendingOffers = useMemo(() => {
    return filteredIssuesByUser
      .filter((issue) => {
        const offers = offersByIssueId[issue.id] ?? [];
        return offers.some((o) => o.status === IssueOfferStatus.RECEIVED);
      })
      .slice(0, 5);
  }, [filteredIssuesByUser, offersByIssueId]);

  // Issues requiring review (vendor completed work)
  const issuesAwaitingReview = useMemo(() => {
    return filteredIssuesByUser
      .filter((issue) => issue.status === "Status.REVIEW")
      .slice(0, 5);
  }, [filteredIssuesByUser]);

  // Combined action items
  const actionRequiredItems = useMemo(() => {
    const items = [
      ...issuesAwaitingReview.map(issue => ({ ...issue, actionType: 'review' as const })),
      ...issuesWithPendingOffers.map(issue => ({ ...issue, actionType: 'offers' as const }))
    ];
    return items.slice(0, 5);
  }, [issuesAwaitingReview, issuesWithPendingOffers]);

  // Calendar events
  const calendarEvents = useMemo(() => {
    const issuesMap = filteredIssuesByUser.reduce((acc, issue) => {
      acc[issue.id] = issue;
      return acc;
    }, {} as Record<number, typeof filteredIssuesByUser[0]>);
    
    return assessments
      .filter((a) => new Date(a.start_time) > new Date())
      .map((a) => {
        const issue = issuesMap[a.issue_id];
        return {
          id: a.id,
          title: `Assessment - ${issue?.summary || normalizeAndCapitalize(issue?.type || "") + " Issue"}`,
          start: new Date(a.start_time),
          end: new Date(a.end_time),
          user_id: a.user_id,
        };
      }) as CalendarReadyAssessment[];
  }, [assessments, filteredIssuesByUser]);

  // Fetch offers for user's issues
  useEffect(() => {
    const run = async () => {
      try {
        const allIssueIds = filteredIssuesByUser.map((i) => i.id);
        const offerResults = await Promise.all(
          allIssueIds.map((id) => dispatch(getOffersByIssueId.initiate(id)))
        );
        setOffersByIssueId(Object.fromEntries(offerResults.map((res, i) => [allIssueIds[i], (res.data as IssueOffer[]) || []])));
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    if (issueIds.length || vendorIds.length || filteredIssuesByUser.length) run();
  }, [dispatch, issueIds, vendorIds, filteredIssuesByUser]);

  // Issue collections for CreateIssueModal (reports the user can add issues to)
  const issueCollections = useMemo(() => {
    if (!reports || !_listings) return [];
    return reports.map((report) => {
      const listing = _listings.find((l) => l.id === report.listing_id);
      return {
        id: report.id,
        name: `${listing?.address || 'Unknown Property'} - Report`
      };
    });
  }, [reports, _listings]);

  // Determine user state
  const isNewUser = realMetrics.totalListings === 0;
  const hasPendingOffers = realMetrics.pendingOffers > 0;
  const hasActionRequired = realMetrics.pendingOffers > 0 || realMetrics.reviewIssues > 0;
  const hasUpcomingAssessments = calendarEvents.length > 0;
  const resolutionRate = realMetrics.totalIssues > 0 ? Math.round((realMetrics.completedIssues / realMetrics.totalIssues) * 100) : 0;

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full max-w-[1800px] mx-auto px-4 py-3 lg:px-8 lg:py-4">
        
        {/* Hero Section - Compact */}
        <div className="relative mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-white/10 via-white/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
          
          <div className="relative px-5 py-4 lg:px-6 lg:py-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-xl lg:text-2xl font-bold mb-1">
                  {getGreeting()}, {client?.first_name || "there"}!
                </h1>
                <p className="text-blue-100 text-sm max-w-xl">
                  {isNewUser
                    ? "Ready to take control of your home maintenance journey."
                    : hasActionRequired
                    ? realMetrics.reviewIssues > 0 && realMetrics.pendingOffers > 0
                      ? `You have ${realMetrics.reviewIssues} review${realMetrics.reviewIssues !== 1 ? 's' : ''} and ${realMetrics.pendingOffers} offer${realMetrics.pendingOffers !== 1 ? 's' : ''} waiting for your attention!`
                      : realMetrics.reviewIssues > 0
                      ? `You have ${realMetrics.reviewIssues} completed job${realMetrics.reviewIssues !== 1 ? 's' : ''} waiting for your review!`
                      : `You have ${realMetrics.pendingOffers} vendor offer${realMetrics.pendingOffers !== 1 ? 's' : ''} waiting for your review!`
                    : `Managing ${realMetrics.totalListings} ${realMetrics.totalListings === 1 ? 'property' : 'properties'} like a pro.`}
                </p>
              </div>
              
              <button
                onClick={() => setIsCreateIssueModalOpen(true)}
                className="group inline-flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-all shadow-lg shadow-blue-900/10 hover:shadow-xl hover:scale-[1.02]"
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Post a Job</span>
                <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            {/* Quick Stats Row - Clean Pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              <div 
                onClick={() => navigate("/listings")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full border border-white/20 cursor-pointer hover:bg-white/25 transition-colors"
              >
                <span className="stat-value text-base text-white">{realMetrics.totalListings}</span>
                <span className="text-blue-100 text-xs">Properties</span>
              </div>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full border border-white/20">
                <span className="stat-value text-base text-white">{realMetrics.totalReports}</span>
                <span className="text-blue-100 text-xs">Reports</span>
              </div>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full border border-white/20">
                <span className="stat-value text-base text-white">{realMetrics.openIssues}</span>
                <span className="text-blue-100 text-xs">Open Issues</span>
              </div>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full border border-white/20">
                <span className="stat-value text-base text-white">
                  {realMetrics.pendingOffers + realMetrics.reviewIssues}
                </span>
                <span className="text-blue-100 text-xs">Action Required</span>
              </div>
            </div>
          </div>
        </div>

        {/* NEW USER: Welcome CTA */}
        {isNewUser && (
          <div className="mb-4 p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="flex flex-col lg:flex-row items-center gap-5">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium mb-3">
                  <FontAwesomeIcon icon={faRocket} />
                  Get Started
                </div>
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">
                  Upload Your First Inspection Report
                </h2>
                <p className="text-gray-600 text-sm mb-4 max-w-lg">
                  Our AI analyzes your report instantly and connects you with verified contractors who can help.
                </p>
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <FontAwesomeIcon icon={faBolt} className="text-blue-500" />
                    AI-powered analysis
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-blue-500" />
                    Verified contractors
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <FontAwesomeIcon icon={faClipboardList} className="text-blue-500" />
                    Competitive quotes
                  </div>
                </div>
                <button
                  onClick={() => setIsAddListingModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition shadow-md"
                >
                  <FontAwesomeIcon icon={faUpload} />
                  Upload Report
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
              </div>
              <div className="hidden lg:flex items-center justify-center">
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl rotate-6 opacity-20"></div>
                  <div className="absolute inset-0 w-32 h-32 bg-white rounded-2xl shadow-lg border border-gray-200 flex items-center justify-center">
                    <FontAwesomeIcon icon={faHome} className="text-4xl text-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EXISTING USER: Bento Grid Layout */}
        {!isNewUser && (
          <div className="grid grid-cols-12 gap-4 w-full min-w-0 overflow-hidden">
            
            {/* Action Row: Action Required + Upload CTA */}
            {hasActionRequired && (
              <>
                <div className="col-span-12 lg:col-span-7 min-w-0">
                  <div className="dashboard-card h-full overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                            <FontAwesomeIcon icon={faClipboardList} className="text-white text-sm" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm text-gray-900">Action Required</h3>
                            <p className="text-xs text-gray-600">
                              {realMetrics.reviewIssues > 0 && realMetrics.pendingOffers > 0 
                                ? `${realMetrics.reviewIssues} review${realMetrics.reviewIssues !== 1 ? 's' : ''} & ${realMetrics.pendingOffers} offer${realMetrics.pendingOffers !== 1 ? 's' : ''} waiting`
                                : realMetrics.reviewIssues > 0
                                ? `${realMetrics.reviewIssues} review${realMetrics.reviewIssues !== 1 ? 's' : ''} waiting for approval`
                                : `${realMetrics.pendingOffers} offer${realMetrics.pendingOffers !== 1 ? 's' : ''} waiting for decision`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="space-y-1.5">
                        {actionRequiredItems.slice(0, 3).map((item) => {
                          const report = reports?.find((r) => r.id === item.report_id);
                          const listing = _listings?.find((l) => l.id === report?.listing_id);

                          if (item.actionType === 'review') {
                            return (
                              <div
                                key={item.id}
                                onClick={() => navigate(`/listings/${report?.listing_id}/reports/${item.report_id}/issues/${item.id}`)}
                                className="group flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all"
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                    item.severity === "high" ? "bg-red-500" : 
                                    item.severity === "medium" ? "bg-amber-500" : "bg-emerald-500"
                                  }`}></div>
                                  <div className="min-w-0">
                                    <div className="font-medium text-xs text-gray-900 truncate group-hover:text-gray-700 transition-colors">
                                      {item.summary || `${normalizeAndCapitalize(item.type)} Issue`}
                                    </div>
                                    <div className="text-xs text-gray-600 truncate">{listing?.address || "Property"}</div>
                                  </div>
                                </div>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                  Review Work
                                </span>
                              </div>
                            );
                          } else {
                            const offers = offersByIssueId[item.id] ?? [];
                            const pendingCount = offers.filter((o) => o.status === IssueOfferStatus.RECEIVED).length;
                            
                            return (
                              <div
                                key={item.id}
                                onClick={() => navigate(`/listings/${report?.listing_id}/reports/${item.report_id}/issues/${item.id}?tab=offers`)}
                                className="group flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all"
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                    item.severity === "high" ? "bg-red-500" : 
                                    item.severity === "medium" ? "bg-amber-500" : "bg-emerald-500"
                                  }`}></div>
                                  <div className="min-w-0">
                                    <div className="font-medium text-xs text-gray-900 truncate group-hover:text-gray-700 transition-colors">
                                      {item.summary || `${normalizeAndCapitalize(item.type)} Issue`}
                                    </div>
                                    <div className="text-xs text-gray-600 truncate">{listing?.address || "Property"}</div>
                                  </div>
                                </div>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                  {pendingCount} offer{pendingCount !== 1 ? "s" : ""}
                                </span>
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Upload CTA - paired with offers */}
                <div className="col-span-12 lg:col-span-5 min-w-0">
                  <div className="dashboard-card h-full overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                          <FontAwesomeIcon icon={faUpload} className="text-white text-sm" />
                        </div>
                        <h3 className="font-semibold text-sm text-gray-900">Upload New Report</h3>
                      </div>
                    </div>
                    <div className="p-3 flex flex-col justify-between h-[calc(100%-52px)]">
                      <p className="text-xs text-gray-600 mb-3">
                        Get AI analysis and vendor quotes instantly
                      </p>
                      <button
                        onClick={() => setIsAddListingModalOpen(true)}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Upload Now <FontAwesomeIcon icon={faArrowRight} />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Properties Grid - Main Card */}
            <div className="col-span-12 lg:col-span-7 min-w-0">
              <div className="dashboard-card overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faHome} className="text-white text-sm" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-gray-900">Your Properties</h3>
                        <p className="text-xs text-gray-600">{realMetrics.totalListings} total</p>
                      </div>
                    </div>
                    <Link to="/listings" className="text-gray-600 hover:text-gray-900 text-xs font-medium flex items-center gap-1">
                      View All <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                    </Link>
                  </div>
                </div>
                
                <div className="p-3">
                  {_listings && _listings.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {[..._listings]
                        .map((listing) => {
                          const listingReports = reports?.filter((r) => r.listing_id === listing.id) || [];
                          const listingIssues = filteredIssuesByUser.filter((i) =>
                            listingReports.some((r) => r.id === i.report_id)
                          );
                          const openCount = listingIssues.filter(
                            (i) => i.status === "Status.OPEN" || i.status === "Status.IN_PROGRESS"
                          ).length;
                          return { listing, listingReports, listingIssues, openCount };
                        })
                        .sort((a, b) => {
                          // Properties with open issues first, then by created date
                          if (a.openCount > 0 && b.openCount === 0) return -1;
                          if (a.openCount === 0 && b.openCount > 0) return 1;
                          // If both have or don't have open issues, sort by open count (desc), then created date
                          if (a.openCount !== b.openCount) return b.openCount - a.openCount;
                          return new Date(b.listing.created_at).getTime() - new Date(a.listing.created_at).getTime();
                        })
                        .slice(0, 4)
                        .map(({ listing, listingReports, listingIssues, openCount }) => (
                            <div
                              key={listing.id}
                              onClick={() => navigate(`/listings/${listing.id}`)}
                              className="group rounded-xl overflow-hidden cursor-pointer bg-gray-50 hover:bg-white border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all"
                            >
                              <div className="h-28 bg-gray-200 relative overflow-hidden">
                                <ImageComponent
                                  src={listing.image_url}
                                  fallback="/images/property_card_holder.jpg"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                {openCount > 0 && (
                                  <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                                    {openCount} open
                                  </div>
                                )}
                                <div className="absolute bottom-2 left-2 right-2">
                                  <h4 className="font-semibold text-white truncate text-sm drop-shadow-lg">
                                    {listing.address}
                                  </h4>
                                </div>
                              </div>
                              <div className="p-2.5">
                                <p className="text-xs text-gray-600 flex items-center gap-1 mb-1.5">
                                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400 text-xs" />
                                  {listing.city}, {listing.state}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <FontAwesomeIcon icon={faFileAlt} className="text-gray-400 text-xs" />
                                    {listingReports.length} report{listingReports.length !== 1 ? "s" : ""}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-gray-400 text-xs" />
                                    {listingIssues.length} issue{listingIssues.length !== 1 ? "s" : ""}
                                  </div>
                                </div>
                              </div>
                            </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <FontAwesomeIcon icon={faBuilding} className="text-gray-400 text-xl" />
                      </div>
                      <p className="text-gray-600 mb-1 font-medium text-sm">No properties yet</p>
                      <p className="text-xs text-gray-600 mb-3">Add your first property to get started</p>
                      <button
                        onClick={() => setIsAddListingModalOpen(true)}
                        className="inline-flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium text-sm"
                      >
                        Add property <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Side Column */}
            <div className="col-span-12 lg:col-span-5 space-y-4 min-w-0">
              {/* Upload CTA Card - Only show when not in action row */}
              {!hasActionRequired && (
                <div className="dashboard-card">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faUpload} className="text-white text-sm" />
                      </div>
                      <h3 className="font-semibold text-sm text-gray-900">Upload New Report</h3>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-600 mb-3">
                      Get AI analysis and vendor quotes instantly
                    </p>
                    <button
                      onClick={() => setIsAddListingModalOpen(true)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Upload Now <FontAwesomeIcon icon={faArrowRight} />
                    </button>
                  </div>
                </div>
              )}

              {/* Progress Card */}
              <div className="dashboard-card">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faTrophy} className="text-white text-sm" />
                      </div>
                      <h3 className="font-semibold text-sm text-gray-900">Resolution Progress</h3>
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
                          stroke="url(#gradientBlueClient)" 
                          strokeWidth="8" 
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${resolutionRate * 2.64} 264`}
                        />
                        <defs>
                          <linearGradient id="gradientBlueClient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#6366f1" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div>
                          <div className="stat-value text-2xl text-gray-900">{resolutionRate}%</div>
                          <div className="text-xs text-gray-600">Resolved</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
                    <div className="text-center">
                      <div className="stat-value text-lg text-gray-900">{realMetrics.totalIssues}</div>
                      <div className="text-xs text-gray-600">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="stat-value text-lg text-yellow-600">{realMetrics.openIssues}</div>
                      <div className="text-xs text-gray-600">Open</div>
                    </div>
                    <div className="text-center">
                      <div className="stat-value text-lg text-emerald-600">{realMetrics.completedIssues}</div>
                      <div className="text-xs text-gray-600">Done</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Assessments */}
              <div className="dashboard-card">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-white text-sm" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">Schedule</h3>
                      <p className="text-xs text-gray-600">
                        {hasUpcomingAssessments ? `${calendarEvents.length} upcoming` : 'No appointments'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  {hasUpcomingAssessments ? (
                    <div className="space-y-2">
                      {calendarEvents.slice(0, 3).map((event) => (
                        <div key={event.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <div className="w-10 h-12 bg-white rounded-md shadow-sm flex flex-col items-center justify-center flex-shrink-0 border border-gray-100">
                            <span className="text-xs font-medium text-gray-600">
                              {event.start.toLocaleDateString("en-US", { month: "short" })}
                            </span>
                            <span className="text-sm font-bold text-gray-900">{event.start.getDate()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs text-gray-900 truncate">{event.title}</div>
                            <div className="text-xs text-gray-600 flex items-center gap-1">
                              <FontAwesomeIcon icon={faClock} className="text-xs" />
                              {event.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 text-lg" />
                      </div>
                      <p className="text-xs text-gray-600">No scheduled assessments</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Vendor Map - Smaller, less prominent */}
            <div className="col-span-12 lg:col-span-7">
              <div className="dashboard-card">
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-white text-xs" />
                      </div>
                      <h3 className="font-semibold text-sm text-gray-900">Vendor Network</h3>
                    </div>
                    <span className="text-xs text-gray-600">Verified professionals near you</span>
                  </div>
                </div>
                <div className="p-2">
                  <div className="rounded-lg overflow-hidden h-[180px]">
                    <VendorMap />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Listing Modal */}
      <AddListingByReportModal
        isOpen={isAddListingModalOpen}
        onClose={() => setIsAddListingModalOpen(false)}
        onSubmit={async (formData: ListingByReportFormData) => {
          try {
            await handleAddListingWithReport({
              formData,
              user_id: user.id,
              createListing,
              uploadReportFile,
              refetch: refetchReports,
              onClose: () => setIsAddListingModalOpen(false),
            });
          } catch (err) {
            console.error("Failed to create listing:", err);
          }
        }}
      />

      {/* Create Issue Modal (Post a Job) */}
      <CreateIssueModal
        open={isCreateIssueModalOpen}
        onClose={() => setIsCreateIssueModalOpen(false)}
        onCreated={() => {
          // Optionally refetch issues or show success
        }}
        issueCollections={issueCollections}
      />
    </div>
  );
};

export default ClientDashboard;
