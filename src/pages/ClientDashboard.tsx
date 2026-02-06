import React, { useEffect, useMemo, useRef, useState } from "react";

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
import { useNavigate, Link } from "react-router-dom";
import UserCalendar from "../components/UserCalendar";
import { normalizeAndCapitalize, getIssueTypeIcon } from "../utils/typeNormalizer";
import { useUploadReportFileMutation, useGetReportsByUserIdQuery } from "../features/api/reportsApi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faExternalLinkAlt,
  faBolt,
  faBuilding,
  faCalendarAlt,
  faCheckCircle,
  faChevronRight,
  faClipboardList,
  faClock,
  faFileAlt,
  faHome,
  faMapMarkerAlt,
  faPlus,
  faRocket,
  faMagic,
  faTrophy,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import {
  CalendarReadyAssessment,
  IssueAssessmentStatus,
  IssueOffer,
  IssueOfferStatus,
  IssueType,
  User,
  Vendor,
} from "../types";
import VendorMap from "../components/VendorMap";
import ImageComponent from "../components/ImageComponent";
import { getIssueById, useGetIssuesQuery } from "../features/api/issuesApi";
import { useCreateListingMutation, useGetListingByUserIdQuery } from "../features/api/listingsApi";
import { useGetClientsQuery } from "../features/api/clientsApi";
import { useGetAssessmentsByClientIdUsersInteractionIdQuery } from "../features/api/issueAssessmentsApi";
import { getOffersByIssueId, issueOffersApi } from "../features/api/issueOffersApi";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store/store";
import { getVendorById } from "../features/api/vendorsApi";
import AddListingByReportModal, { ListingByReportFormData } from "../components/AddListingByReportModal";
import { handleAddListingWithReport } from "../utils/reportUtil";
import CreateIssueModal from "../components/CreateIssueModal";
import HomeownerIssueCard from "../components/HomeownerIssueCard";

interface DashboardProps {
  user: User;
}

const ClientDashboard: React.FC<DashboardProps> = ({ user }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [issueMap, setIssueMap] = useState<Record<number, IssueType>>({});
  const [vendorMap, setVendorMap] = useState<Record<number, Vendor>>({});
  const [offersByIssueId, setOffersByIssueId] = useState<Record<number, IssueOffer[]>>({});
  const [isAddListingModalOpen, setIsAddListingModalOpen] = useState<boolean>(false);
  const [isCreateIssueModalOpen, setIsCreateIssueModalOpen] = useState<boolean>(false);
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState<boolean>(false);
  const createDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (createDropdownRef.current && !createDropdownRef.current.contains(event.target as Node)) {
        setIsCreateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Issues for this user
  const filteredIssuesByUser = useMemo(() => {
    if (!issues || !reports) return [];
    const userReportIds = reports.filter((r) => r.user_id === user.id).map((r) => r.id);
    return issues.filter((issue) => userReportIds.includes(issue.report_id));
  }, [issues, reports, user.id]);

  // Create stable key for dashboard prefetch
  const issueIdsForPrefetch = useMemo(
    () => filteredIssuesByUser.map(i => i.id).sort().join(','),
    [filteredIssuesByUser]
  );

  // Prefetch offers for all user issues (improves Offers page load time)
  // Uses window-level storage so subscriptions persist across navigations
  useEffect(() => {
    if (filteredIssuesByUser.length === 0) return;
    
    const subs = getGlobalSubscriptions();
    
    // Check which issues already have subscriptions
    const issuesNeedingSubscription = filteredIssuesByUser.filter(
      issue => !subs.has(issue.id)
    );
    
    if (issuesNeedingSubscription.length === 0) return;
    
    // Initiate fetches WITH subscriptions to ensure data stays in cache
    issuesNeedingSubscription.forEach((issue) => {
      const subscription = dispatch(issueOffersApi.endpoints.getOffersByIssueId.initiate(issue.id, {
        forceRefetch: false,
        subscribe: true,
      }));
      subs.set(issue.id, subscription);
    });
    
    // NO cleanup! Subscriptions persist at module level
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueIdsForPrefetch, dispatch]);

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
        const issueResults = await Promise.all(
          issueIds.map((id) => dispatch(getIssueById.initiate(String(id))))
        );
        const vendorResults = await Promise.all(
          vendorIds.map((id) => dispatch(getVendorById.initiate(String(id))))
        );

        setIssueMap(Object.fromEntries(issueResults.map((res, i) => [issueIds[i], res.data as IssueType])));
        setVendorMap(Object.fromEntries(vendorResults.map((res, i) => [vendorIds[i], res.data as Vendor])));

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

  // Auto-rotate properties slideshow (cycles through pages of 2)
  useEffect(() => {
    if (!_listings || _listings.length <= 2) return;
    const totalPages = Math.ceil(_listings.length / 2);
    const interval = setInterval(() => {
      setActivePropertyIndex((prev) => (prev + 1) % totalPages);
    }, 5000); // Rotate every 5 seconds
    return () => clearInterval(interval);
  }, [_listings]);

  // Issue collections for CreateIssueModal (reports the user can add issues to)
  const issueCollections = useMemo(() => {
    if (!reports || !_listings) return [];
    return reports.map((report) => {
      const listing = _listings.find((l) => l.id === report.listing_id);
      return {
        id: report.id,
        name: `${listing?.address || 'Unknown Property'} - ${report.report_type || 'Report'}`
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

  // Tab state for Priority Inbox
  const [activeInboxTab, setActiveInboxTab] = useState<'approvals' | 'quotes'>('approvals');
  const [activePropertyIndex, setActivePropertyIndex] = useState(0);

  // Get items needing approval (issues in review status)
  const approvalItems = useMemo(() => {
    return filteredIssuesByUser.filter(i => i.status === "Status.REVIEW");
  }, [filteredIssuesByUser]);

  // Get items with pending quotes
  const quoteItems = useMemo(() => {
    return filteredIssuesByUser.filter(i => {
      const offers = offersByIssueId[i.id] || [];
      return offers.some(o => o.status === IssueOfferStatus.RECEIVED);
    });
  }, [filteredIssuesByUser, offersByIssueId]);

  // Get open issues
  const openIssueItems = useMemo(() => {
    return filteredIssuesByUser.filter(i => 
      i.status === "Status.OPEN" || i.status === "Status.IN_PROGRESS"
    );
  }, [filteredIssuesByUser]);

  // State for issue detail modal
  const [selectedIssueForModal, setSelectedIssueForModal] = useState<IssueType | null>(null);
  const [selectedListingForModal, setSelectedListingForModal] = useState<any>(null);
  const [modalDefaultTab, setModalDefaultTab] = useState<"details" | "offers" | "assessments">("details");

  // Helper to open issue in modal
  const openIssueModal = (issue: IssueType, defaultTab: "details" | "offers" | "assessments" = "details") => {
    const report = reports?.find((r) => r.id === issue.report_id);
    const listing = _listings?.find((l) => l.id === report?.listing_id);
    setSelectedIssueForModal(issue);
    setSelectedListingForModal(listing || null);
    setModalDefaultTab(defaultTab);
  };

  return (
    <div className="min-h-screen w-full bg-gray-100">
      <div className="w-full max-w-[1800px] mx-auto px-4 py-5 lg:px-8 lg:py-6">
        
        {/* TODAY AT A GLANCE - Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Today at a glance
            </h1>
            
            {/* Create Dropdown */}
            <div className="relative" ref={createDropdownRef}>
              <button
                onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
                className="group inline-flex items-center gap-2 px-5 py-3 bg-amber-500 text-gray-900 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all shadow-sm"
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Create</span>
                <FontAwesomeIcon icon={faChevronRight} className={`text-xs transition-transform ${isCreateDropdownOpen ? 'rotate-90' : ''}`} />
              </button>
              
              {isCreateDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => { setIsCreateIssueModalOpen(true); setIsCreateDropdownOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <FontAwesomeIcon icon={faClipboardList} className="text-gray-400 w-4" />
                    Post a Job
                  </button>
                  <button
                    onClick={() => { setIsAddListingModalOpen(true); setIsCreateDropdownOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <FontAwesomeIcon icon={faUpload} className="text-gray-400 w-4" />
                    Upload Report
                  </button>
                  <button
                    onClick={() => { navigate('/listings?action=add'); setIsCreateDropdownOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <FontAwesomeIcon icon={faHome} className="text-gray-400 w-4" />
                    Add Property
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stat Cards Row - Only show for existing users */}
          {!isNewUser && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* Approvals Needed */}
              <div 
                onClick={() => navigate("/offers")}
                className="bg-white rounded-xl p-5 cursor-pointer border-l-4 border-transparent hover:border-amber-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="text-3xl font-bold text-gray-900 mb-1">{approvalItems.length + quoteItems.length}</div>
                <div className="text-sm font-semibold text-gray-900">Approvals Needed</div>
                {(approvalItems.length + quoteItems.length) > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    {approvalItems.length > 0 ? `${approvalItems.length} overdue` : 'Review pending'}
                  </div>
                )}
              </div>

              {/* Quotes to Compare */}
              <div 
                onClick={() => navigate("/offers")}
                className="bg-white rounded-xl p-5 cursor-pointer border-l-4 border-transparent hover:border-amber-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="text-3xl font-bold text-gray-900 mb-1">{quoteItems.length}</div>
                <div className="text-sm font-semibold text-gray-900">Quotes to Compare</div>
                <div className="text-xs text-gray-500 mt-2">
                  Avg. response time: 6h
                </div>
              </div>

              {/* Visit Scheduled */}
              <div className="bg-white rounded-xl p-5 border-l-4 border-transparent hover:border-amber-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                <div className="text-3xl font-bold text-gray-900 mb-1">{calendarEvents.length}</div>
                <div className="text-sm font-semibold text-gray-900">Visit Scheduled</div>
                {calendarEvents.length > 0 && (
                  <div className="text-xs text-gray-500 mt-2">
                    {calendarEvents[0]?.start.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })} →
                  </div>
                )}
              </div>

              {/* Budget / Spend */}
              <div className="bg-white rounded-xl p-5 cursor-pointer border-l-4 border-transparent hover:border-amber-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                    <span className="text-amber-600 font-bold">$</span>
                  </span>
                  <div>
                    <div className="text-xl font-bold text-gray-900">
                      ${Object.values(offersByIssueId).flat().filter(o => o.status === IssueOfferStatus.ACCEPTED).reduce((sum, o) => sum + (o.price || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Spent on repairs</div>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* NEW USER: Welcome CTA */}
        {isNewUser && (
          <div className="mb-6">
            {/* Hero Welcome Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 lg:p-10">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
              <div className="absolute top-10 right-10 w-20 h-20 border border-amber-500/20 rounded-xl rotate-12"></div>
              <div className="absolute bottom-10 right-32 w-12 h-12 border border-white/10 rounded-lg -rotate-6"></div>
              
              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-1 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium mb-4">
                    <FontAwesomeIcon icon={faMagic} className="text-amber-400" />
                    Welcome to Inspectly
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                    Let's get your home project started
                  </h2>
                  <p className="text-gray-400 text-base mb-6 max-w-lg">
                    Upload your inspection report and our AI will analyze it instantly, then connect you with verified contractors who can help.
                  </p>
                  
                  <button
                    onClick={() => setIsAddListingModalOpen(true)}
                    className="inline-flex items-center gap-3 px-6 py-3 bg-amber-500 text-gray-900 rounded-xl font-bold text-base hover:bg-amber-400 transition-all shadow-lg hover:shadow-amber-500/25 hover:-translate-y-0.5"
                  >
                    <FontAwesomeIcon icon={faUpload} />
                    Upload Your Report
                    <FontAwesomeIcon icon={faArrowRight} />
                  </button>
                </div>
                
                {/* Visual illustration */}
                <div className="hidden lg:flex items-center justify-center">
                  <div className="relative">
                    {/* Stacked cards effect */}
                    <div className="absolute -top-3 -left-3 w-40 h-48 bg-gray-700/50 rounded-2xl rotate-6 border border-gray-600/30"></div>
                    <div className="absolute -top-1 -left-1 w-40 h-48 bg-gray-600/50 rounded-2xl rotate-3 border border-gray-500/30"></div>
                    <div className="relative w-40 h-48 bg-white rounded-2xl shadow-2xl flex flex-col items-center justify-center p-4">
                      <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
                        <FontAwesomeIcon icon={faHome} className="text-2xl text-amber-600" />
                      </div>
                      <div className="h-2 w-24 bg-gray-200 rounded mb-2"></div>
                      <div className="h-2 w-20 bg-gray-100 rounded mb-2"></div>
                      <div className="h-2 w-16 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Start Steps */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                   onClick={() => setIsAddListingModalOpen(true)}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500 transition-colors">
                    <span className="text-amber-600 font-bold group-hover:text-white transition-colors">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Upload Report</h3>
                    <p className="text-sm text-gray-500">Add your property and upload an inspection report</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-5 border border-gray-200 opacity-60">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-400 font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Review Issues</h3>
                    <p className="text-sm text-gray-500">AI extracts and prioritizes repair items</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-5 border border-gray-200 opacity-60">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-400 font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Get Quotes</h3>
                    <p className="text-sm text-gray-500">Receive competitive quotes from verified pros</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MAIN GRID LAYOUT */}
        {!isNewUser && (
          <div className="grid grid-cols-12 gap-5 w-full min-w-0 overflow-hidden">
            
            {/* PRIORITY INBOX - Main Card */}
            <div className="col-span-12 lg:col-span-8 min-w-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                {/* Header with icon and tabs */}
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faClipboardList} className="text-gray-600 text-lg" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">Priority Inbox</h2>
                      <FontAwesomeIcon icon={faChevronRight} className="text-gray-400 text-sm" />
                    </div>
                  </div>
                  
                  {/* Tabs */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveInboxTab('approvals')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                        activeInboxTab === 'approvals' 
                          ? 'bg-gray-900 text-white' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Approvals
                      {approvalItems.length > 0 && (
                        <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                          activeInboxTab === 'approvals' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {approvalItems.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveInboxTab('quotes')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                        activeInboxTab === 'quotes' 
                          ? 'bg-gray-900 text-white' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Quotes
                      {quoteItems.length > 0 && (
                        <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                          activeInboxTab === 'quotes' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {quoteItems.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-4">
                  {/* Approvals Tab */}
                  {activeInboxTab === 'approvals' && (
                    <div className="space-y-3">
                      {approvalItems.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FontAwesomeIcon icon={faCheckCircle} className="text-3xl text-gray-300 mb-2" />
                          <p>No approvals pending</p>
                        </div>
                      ) : (
                        <>
                          {approvalItems.slice(0, 2).map((item) => {
                            const report = reports?.find((r) => r.id === item.report_id);
                            const listing = _listings?.find((l) => l.id === report?.listing_id);
                            const offers = offersByIssueId[item.id] || [];
                            const acceptedOffer = offers.find(o => o.status === IssueOfferStatus.ACCEPTED);
                            
                            return (
                              <div
                                key={item.id}
                                onClick={() => openIssueModal(item)}
                                className="group flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer border-l-4 border-transparent hover:border-amber-500 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-amber-50">
                                    <FontAwesomeIcon icon={getIssueTypeIcon(item.type)} className="text-gray-600 group-hover:text-amber-600" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">
                                      {item.summary || `${normalizeAndCapitalize(item.type)} Issue`}
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs" />
                                      {listing?.address || "Property"}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {acceptedOffer && (
                                    <span className="text-lg font-bold text-gray-900">${acceptedOffer.price?.toLocaleString()}</span>
                                  )}
                                  <button className="px-4 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-2">
                                    Approve <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          {approvalItems.length > 2 && (
                            <button
                              onClick={() => navigate("/offers?filter=review")}
                              className="w-full text-center py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                            >
                              View all {approvalItems.length} approvals →
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Quotes Tab */}
                  {activeInboxTab === 'quotes' && (
                    <div className="space-y-3">
                      {quoteItems.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FontAwesomeIcon icon={faFileAlt} className="text-3xl text-gray-300 mb-2" />
                          <p>No quotes to review</p>
                        </div>
                      ) : (
                        <>
                          {quoteItems.slice(0, 2).map((item) => {
                            const report = reports?.find((r) => r.id === item.report_id);
                            const listing = _listings?.find((l) => l.id === report?.listing_id);
                            const offers = offersByIssueId[item.id] || [];
                            const pendingOffers = offers.filter(o => o.status === IssueOfferStatus.RECEIVED);
                            const lowestOffer = pendingOffers.length > 0 
                              ? pendingOffers.reduce((min, o) => (o.price || 0) < (min.price || 0) ? o : min, pendingOffers[0])
                              : null;
                            
                            return (
                              <div
                                key={item.id}
                                onClick={() => openIssueModal(item, "offers")}
                                className="group flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer border-l-4 border-transparent hover:border-amber-500 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-amber-50">
                                    <FontAwesomeIcon icon={getIssueTypeIcon(item.type)} className="text-gray-600 group-hover:text-amber-600" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">
                                      {item.summary || `${normalizeAndCapitalize(item.type)} Issue`}
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs" />
                                      {listing?.address || "Property"}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {lowestOffer && (
                                    <div className="text-right">
                                      <span className="text-lg font-bold text-gray-900">${lowestOffer.price?.toLocaleString()}</span>
                                      {pendingOffers.length > 1 && (
                                        <div className="text-xs text-gray-500">{pendingOffers.length} quotes</div>
                                      )}
                                    </div>
                                  )}
                                  {pendingOffers.length === 1 ? (
                                    <button className="px-4 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-2">
                                      Accept <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                                    </button>
                                  ) : (
                                    <button className="px-4 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
                                      Compare <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {quoteItems.length > 2 && (
                            <button
                              onClick={() => navigate("/offers?filter=pending")}
                              className="w-full text-center py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                            >
                              View all {quoteItems.length} quotes →
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* PROJECT HEALTH - Sidebar Card */}
            <div className="col-span-12 lg:col-span-4 min-w-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faTrophy} className="text-gray-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Project Health</h2>
                  </div>
                  <FontAwesomeIcon icon={faChevronRight} className="text-gray-400" />
                </div>
                
                <div className="p-5 space-y-5">
                  {/* Resolution Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Resolution Rate</span>
                      <span className="text-sm font-bold text-gray-900">{resolutionRate}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500" 
                        style={{ width: `${resolutionRate}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Next Visit */}
                  {calendarEvents.length > 0 && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-1">Next Visit</div>
                      <div className="text-sm font-bold text-gray-900">
                        {calendarEvents[0]?.start.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-xs text-gray-500">{calendarEvents[0]?.title}</div>
                    </div>
                  )}

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xl font-bold text-gray-900">{realMetrics.totalIssues}</div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xl font-bold text-gray-900">{realMetrics.openIssues}</div>
                      <div className="text-xs text-gray-500">Open</div>
                    </div>
                    <div className="text-center p-3 bg-emerald-50 rounded-lg">
                      <div className="text-xl font-bold text-emerald-600">{realMetrics.completedIssues}</div>
                      <div className="text-xs text-gray-500">Done</div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* ACTIVE PROPERTIES - Like "Active Renovations" in mockup */}
            <div className="col-span-12">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faHome} className="text-gray-600" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">Active Properties</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      {_listings && _listings.length > 2 && (
                        <div className="flex gap-1">
                          {Array.from({ length: Math.ceil(_listings.length / 2) }).map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActivePropertyIndex(idx)}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                idx === activePropertyIndex ? 'bg-gray-900' : 'bg-gray-300 hover:bg-gray-400'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      <Link to="/listings" className="ml-2 text-gray-400 hover:text-gray-600">
                        <FontAwesomeIcon icon={faChevronRight} />
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="p-5">
                  {_listings && _listings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {(() => {
                        // Show 2 properties at a time, starting from activePropertyIndex
                        const startIdx = (activePropertyIndex * 2) % _listings.length;
                        const visibleListings = [];
                        for (let i = 0; i < Math.min(2, _listings.length); i++) {
                          visibleListings.push(_listings[(startIdx + i) % _listings.length]);
                        }
                        
                        return visibleListings.map((listing) => {
                          const listingReports = reports?.filter((r) => r.listing_id === listing.id) || [];
                          const listingIssues = filteredIssuesByUser.filter((i) =>
                            listingReports.some((r) => r.id === i.report_id)
                          );
                          const openCount = listingIssues.filter(
                            (i) => i.status === "Status.OPEN" || i.status === "Status.IN_PROGRESS"
                          ).length;
                          const completedCount = listingIssues.filter(
                            (i) => i.status === "Status.COMPLETED"
                          ).length;
                          const progressPercent = listingIssues.length > 0 
                            ? Math.round((completedCount / listingIssues.length) * 100) 
                            : 0;
                          
                          return (
                            <div
                              key={listing.id}
                              onClick={() => navigate(`/listings/${listing.id}`)}
                              className="group rounded-xl overflow-hidden cursor-pointer bg-white border border-gray-200 hover:shadow-xl transition-all duration-300"
                            >
                              {/* Large Image */}
                              <div className="h-44 bg-gray-200 relative overflow-hidden">
                                <ImageComponent
                                  src={listing.image_url}
                                  fallback="/images/property_card_holder.jpg"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                                
                                {/* Title overlay */}
                                <div className="absolute bottom-4 left-4 right-4">
                                  <h3 className="font-bold text-white text-xl mb-1 drop-shadow-lg">
                                    {listing.address?.split(',')[0] || listing.address}
                                  </h3>
                                  <p className="text-white/80 text-sm">
                                    {listing.city}, {listing.state}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Footer with progress */}
                              <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    {openCount > 0 ? (
                                      <span className="text-sm text-amber-600 font-medium">
                                        {openCount} open issue{openCount !== 1 ? 's' : ''}
                                      </span>
                                    ) : (
                                      <span className="text-sm text-gray-500">
                                        {listingIssues.length} issue{listingIssues.length !== 1 ? 's' : ''} tracked
                                      </span>
                                    )}
                                  </div>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); navigate(`/listings/${listing.id}`); }}
                                    className="text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1"
                                  >
                                    View Property <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                                  </button>
                                </div>
                                
                                {/* Progress bar */}
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      openCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${progressPercent}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <FontAwesomeIcon icon={faBuilding} className="text-gray-400 text-2xl" />
                      </div>
                      <p className="text-gray-900 mb-1 font-semibold">No properties yet</p>
                      <p className="text-sm text-gray-500 mb-4">Add your first property to get started</p>
                      <button
                        onClick={() => setIsAddListingModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-gray-800 transition"
                      >
                        Add property <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SCHEDULE CARD - Only shown if there are upcoming events */}
            {hasUpcomingAssessments && (
              <div className="col-span-12 lg:col-span-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-600" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">Schedule</h2>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {calendarEvents.slice(0, 2).map((event) => (
                        <div key={event.id} className="group flex items-center gap-3 p-3 bg-gray-50 rounded-xl border-l-4 border-transparent hover:border-amber-500 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                          <div className="w-12 h-14 bg-white rounded-lg shadow-sm flex flex-col items-center justify-center flex-shrink-0 border border-gray-200">
                            <span className="text-xs font-semibold text-gray-500 uppercase">
                              {event.start.toLocaleDateString("en-US", { month: "short" })}
                            </span>
                            <span className="text-lg font-bold text-gray-900">{event.start.getDate()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-900 truncate">{event.title}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1.5">
                              <FontAwesomeIcon icon={faClock} />
                              {event.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
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

      {/* Issue Detail Modal */}
      {selectedIssueForModal && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center">
          <div className="relative w-[1100px] h-[80vh] mx-auto overflow-hidden rounded-2xl shadow-xl bg-white">
            <button
              onClick={() => setSelectedIssueForModal(null)}
              className="absolute -top-10 right-0 text-white text-3xl leading-none px-2 hover:text-gray-300 transition-colors"
            >
              &times;
            </button>
            <HomeownerIssueCard
              key={`${selectedIssueForModal.id}-${modalDefaultTab}`}
              issue={selectedIssueForModal}
              listing={selectedListingForModal}
              onClose={() => setSelectedIssueForModal(null)}
              defaultTab={modalDefaultTab}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
