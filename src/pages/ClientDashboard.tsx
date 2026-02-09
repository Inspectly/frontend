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
import { normalizeAndCapitalize, getIssueTypeIcon } from "../utils/typeNormalizer";
import { useUploadReportFileMutation, useGetReportsByUserIdQuery } from "../features/api/reportsApi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBuilding,
  faCalendarAlt,
  faCheck,
  faCheckCircle,
  faChevronRight,
  faBriefcase,
  faClipboardList,
  faClock,
  faEdit,
  faFileAlt,
  faHome,
  faMapMarkerAlt,
  faPlus,
  faMagic,
  faTimes,
  faTrophy,
  faUpload,
  faTrash,
  faUser,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import {
  CalendarReadyAssessment,
  IssueAssessmentStatus,
  IssueOffer,
  IssueOfferStatus,
  IssueType,
  Listing,
  ReportType,
  User,
  Vendor,
} from "../types";
import ImageComponent from "../components/ImageComponent";
import { getIssueById, useGetIssuesQuery } from "../features/api/issuesApi";
import { useCreateListingMutation, useGetListingByUserIdQuery } from "../features/api/listingsApi";
import { useGetClientsQuery } from "../features/api/clientsApi";
import { useGetAssessmentsByClientIdUsersInteractionIdQuery, useUpdateAssessmentMutation, useDeleteAssessmentMutation, useCreateAssessmentMutation } from "../features/api/issueAssessmentsApi";
import { getOffersByIssueId, issueOffersApi } from "../features/api/issueOffersApi";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store/store";
import { getVendorById, useGetVendorsQuery } from "../features/api/vendorsApi";
import AddListingByReportModal, { ListingByReportFormData } from "../components/AddListingByReportModal";
import { handleAddListingWithReport } from "../utils/reportUtil";
import CreateIssueModal from "../components/CreateIssueModal";
import HomeownerIssueCard from "../components/HomeownerIssueCard";
import { BUTTON_HOVER } from "../styles/shared";
import { toast } from "react-hot-toast";
import { parseAsUTC } from "../utils/calendarUtils";

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
  useGetClientsQuery();

  const { data: assessments = [], refetch: refetchAssessments } =
    useGetAssessmentsByClientIdUsersInteractionIdQuery(user.id, { skip: !user?.id });
  const { data: allVendors = [] } = useGetVendorsQuery();

  const [createListing] = useCreateListingMutation();
  const [uploadReportFile] = useUploadReportFileMutation();
  const [updateAssessment, { isLoading: isUpdatingAssessment }] = useUpdateAssessmentMutation();
  const [deleteAssessment, { isLoading: isDeletingAssessment }] = useDeleteAssessmentMutation();
  const [createAssessment, { isLoading: isCreatingAssessment }] = useCreateAssessmentMutation();

  // State for propose time modal - now supports up to 3 time slots
  const [proposeTimeModal, setProposeTimeModal] = useState<{
    isOpen: boolean;
    assessment: (CalendarReadyAssessment & { issue?: IssueType }) | null;
  }>({ isOpen: false, assessment: null });
  const [proposedTimes, setProposedTimes] = useState<string[]>([""]);
  
  // State for full schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);

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

  const [, setIssueMap] = useState<Record<number, IssueType>>({});
  const [, setVendorMap] = useState<Record<number, Vendor>>({});
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

  // Calendar events - include full assessment data for status and actions
  const calendarEvents = useMemo(() => {
    const issuesMap = filteredIssuesByUser.reduce((acc, issue) => {
      acc[issue.id] = issue;
      return acc;
    }, {} as Record<number, typeof filteredIssuesByUser[0]>);

    // Create listings map for quick lookup
    const listingsMap = (_listings || []).reduce((acc, listing) => {
      acc[listing.id] = listing;
      return acc;
    }, {} as Record<number, Listing>);

    // Create reports map to link issues to listings
    const reportsMap = (reports || []).reduce((acc, report) => {
      acc[report.id] = report;
      return acc;
    }, {} as Record<number, ReportType>);

    // Create vendors map for quick lookup (by vendor id, since users_interaction_id uses vendor.id)
    const vendorsMap = allVendors.reduce((acc, vendor) => {
      acc[vendor.id] = vendor;
      return acc;
    }, {} as Record<number, Vendor>);
    
    return assessments
      .filter((a) => parseAsUTC(a.start_time) > new Date())
      .map((a) => {
        const issue = issuesMap[a.issue_id];
        const report = issue ? reportsMap[issue.report_id] : undefined;
        const listing = report ? listingsMap[report.listing_id] : undefined;
        
        // Extract vendor id from users_interaction_id (format: clientUserId_vendorId_issueId)
        const parts = a.users_interaction_id?.split("_") ?? [];
        const vendorId = parts.length > 1 ? parseInt(parts[1], 10) : NaN;
        const vendor = Number.isFinite(vendorId) ? vendorsMap[vendorId] : undefined;
        
        return {
          ...a, // Include full assessment data
          id: a.id,
          title: issue?.summary || normalizeAndCapitalize(issue?.type || "") + " Issue",
          start: parseAsUTC(a.start_time),
          end: parseAsUTC(a.end_time),
          user_id: a.user_id,
          issue, // Include issue for context
          listing, // Include listing for property address
          vendor, // Include vendor for name/rating
        };
      })
      // Sort by start time ascending (nearest first)
      .sort((a, b) => a.start.getTime() - b.start.getTime()) as (CalendarReadyAssessment & { issue?: IssueType; listing?: Listing; vendor?: Vendor })[];
  }, [assessments, filteredIssuesByUser, _listings, reports, allVendors]);

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
        listing_id: report.listing_id,
        name: `${listing?.address || 'Unknown Property'} - ${report.name || 'Report'}`
      };
    });
  }, [reports, _listings]);

  // Determine user state
  const isNewUser = realMetrics.totalListings === 0;
  const resolutionRate = realMetrics.totalIssues > 0 ? Math.round((realMetrics.completedIssues / realMetrics.totalIssues) * 100) : 0;
  
  // Separate pending vs confirmed assessments
  const pendingAssessments = calendarEvents.filter(e => e.status === IssueAssessmentStatus.RECEIVED);
  const confirmedAssessments = calendarEvents.filter(e => e.status === IssueAssessmentStatus.ACCEPTED);

  // Handle accepting an assessment
  const handleAcceptAssessment = async (assessment: CalendarReadyAssessment) => {
    try {
      // Only send fields the backend expects
      const payload = {
        id: assessment.id,
        issue_id: assessment.issue_id,
        user_id: assessment.user_id,
        user_type: assessment.user_type,
        interaction_id: assessment.users_interaction_id,
        users_interaction_id: assessment.users_interaction_id,
        start_time: assessment.start_time,
        end_time: assessment.end_time,
        status: "accepted",
        min_assessment_time: assessment.min_assessment_time,
        user_last_viewed: new Date().toISOString(), // Required by backend
      };
      await updateAssessment(payload).unwrap();
      // Refetch to update the UI
      refetchAssessments();
    } catch (err) {
      console.error("Failed to accept assessment:", err);
      toast.error("Failed to accept the visit. Please try again.");
    }
  };

  // Handle proposing new times - CREATE new assessments for each proposed time slot
  const handleProposeNewTime = async () => {
    const validTimes = proposedTimes.filter(t => t.trim() !== "");
    if (!proposeTimeModal.assessment || validTimes.length === 0) return;
    
    const assessment = proposeTimeModal.assessment;
    // Default to 30 minutes for assessment duration
    const minTime = 30;
    
    try {
      // Create an assessment for each proposed time slot
      await Promise.all(
        validTimes.map(timeStr => {
          const newStart = new Date(timeStr);
          const newEnd = new Date(newStart.getTime() + minTime * 60 * 1000);
          
          return createAssessment({
            issue_id: assessment.issue_id,
            user_id: user.id, // Client's user ID - vendor will see this as a counter-proposal
            user_type: "client",
            interaction_id: assessment.users_interaction_id,
            users_interaction_id: assessment.users_interaction_id,
            start_time: newStart.toISOString(),
            end_time: newEnd.toISOString(),
            status: "received",
            min_assessment_time: minTime,
          }).unwrap();
        })
      );
      
      toast.success(`${validTimes.length} time${validTimes.length > 1 ? 's' : ''} proposed successfully!`);
      setProposeTimeModal({ isOpen: false, assessment: null });
      setProposedTimes([""]);
      // Refetch to update the UI
      await refetchAssessments();
    } catch (err: any) {
      console.error("Failed to propose new time:", err);
      console.error("Error details:", err?.data || err?.message || err);
      toast.error("Failed to propose times. Please try again.");
    }
  };

  // Open propose time modal
  const openProposeTimeModal = (assessment: CalendarReadyAssessment & { issue?: IssueType }) => {
    // Start with one empty time slot
    setProposedTimes([""]);
    setProposeTimeModal({ isOpen: true, assessment });
  };
  
  // Add a new time slot (max 3)
  const addTimeSlot = () => {
    if (proposedTimes.length < 3) {
      setProposedTimes([...proposedTimes, ""]);
    }
  };
  
  // Remove a time slot
  const removeTimeSlot = (index: number) => {
    if (proposedTimes.length > 1) {
      setProposedTimes(proposedTimes.filter((_, i) => i !== index));
    }
  };
  
  // Update a specific time slot
  const updateTimeSlot = (index: number, value: string) => {
    const newTimes = [...proposedTimes];
    newTimes[index] = value;
    setProposedTimes(newTimes);
  };

  // Handle canceling/deleting a client's own proposal
  const handleCancelProposal = async (assessment: CalendarReadyAssessment) => {
    try {
      await deleteAssessment({
        id: Number(assessment.id),
        issue_id: assessment.issue_id,
        interaction_id: assessment.users_interaction_id,
      }).unwrap();
      toast.success("Proposal cancelled successfully");
      await refetchAssessments();
    } catch (err: any) {
      console.error("Failed to cancel proposal:", err);
      toast.error("Failed to cancel proposal. Please try again.");
    }
  };

  // Tab state for Priority Inbox
  const [activeInboxTab, setActiveInboxTab] = useState<'approvals' | 'quotes' | 'visits'>('approvals');
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
                className="group inline-flex items-center gap-2 px-5 py-3 bg-gold text-white rounded-xl font-bold text-sm hover:bg-foreground hover:text-background transition-all shadow-sm"
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
                className="bg-white rounded-xl p-5 cursor-pointer border-l-4 border-transparent hover:border-gold hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="text-3xl font-bold text-gray-900 mb-1">{approvalItems.length + quoteItems.length}</div>
                <div className="text-sm font-semibold text-gray-900">Approvals Needed</div>
                {(approvalItems.length + quoteItems.length) > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-gold">
                    <span className="w-2 h-2 bg-gold rounded-full"></span>
                    Action needed
                  </div>
                )}
              </div>

              {/* Quotes to Compare */}
              <div 
                onClick={() => navigate("/offers")}
                className="bg-white rounded-xl p-5 cursor-pointer border-l-4 border-transparent hover:border-gold hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="text-3xl font-bold text-gray-900 mb-1">{quoteItems.length}</div>
                <div className="text-sm font-semibold text-gray-900">Quotes to Compare</div>
                {quoteItems.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-gold">
                    <span className="w-2 h-2 bg-gold rounded-full"></span>
                    Review pending
                  </div>
                )}
              </div>

              {/* Visit Scheduled */}
              <div className="bg-white rounded-xl p-5 border-l-4 border-transparent hover:border-gold hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                <div className="text-3xl font-bold text-gray-900 mb-1">{calendarEvents.length}</div>
                <div className="text-sm font-semibold text-gray-900">Visit Scheduled</div>
                {calendarEvents.length > 0 && (
                  <div className="text-xs text-gray-500 mt-2">
                    {calendarEvents[0]?.start.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })} →
                  </div>
                )}
              </div>

              {/* Budget / Spend */}
              <div className="bg-white rounded-xl p-5 cursor-pointer border-l-4 border-transparent hover:border-gold hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-9 h-9 bg-gold-200 rounded-lg flex items-center justify-center">
                    <span className="text-gold font-bold">$</span>
                  </span>
                  <div>
                    <div className="text-xl font-bold text-gray-900">
                      ${Object.values(offersByIssueId).flat().filter(o => o.status === IssueOfferStatus.ACCEPTED).reduce((sum, o) => sum + (o.price || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Spent on repairs</div>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-gold-400 to-gold rounded-full" style={{ width: '45%' }}></div>
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
              <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
              <div className="absolute top-10 right-10 w-20 h-20 border border-gold/20 rounded-xl rotate-12"></div>
              <div className="absolute bottom-10 right-32 w-12 h-12 border border-white/10 rounded-lg -rotate-6"></div>
              
              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-1 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/20 text-gold rounded-full text-sm font-medium mb-4">
                    <FontAwesomeIcon icon={faMagic} className="text-gold" />
                    Welcome to Inspectly
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                    Let's get your home project started
                  </h2>
                  <p className="text-gray-400 text-base mb-6 max-w-lg">
                    Post a job to get quotes from verified contractors, or upload your inspection report for AI-powered analysis.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setIsCreateIssueModalOpen(true)}
                      className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-gold text-white rounded-xl font-bold text-base hover:bg-foreground hover:text-background transition-all shadow-lg hover:shadow-gold/25 hover:-translate-y-0.5"
                    >
                      <FontAwesomeIcon icon={faBriefcase} />
                      Post a Job
                      <FontAwesomeIcon icon={faArrowRight} />
                    </button>
                    <button
                      onClick={() => setIsAddListingModalOpen(true)}
                      className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-white/10 text-white rounded-xl font-bold text-base hover:bg-white/20 transition-all border border-white/20"
                    >
                      <FontAwesomeIcon icon={faUpload} />
                      Upload Report
                    </button>
                  </div>
                </div>
                
                {/* Visual illustration */}
                <div className="hidden lg:flex items-center justify-center">
                  <div className="relative">
                    {/* Stacked cards effect */}
                    <div className="absolute -top-3 -left-3 w-40 h-48 bg-gray-700/50 rounded-2xl rotate-6 border border-gray-600/30"></div>
                    <div className="absolute -top-1 -left-1 w-40 h-48 bg-gray-600/50 rounded-2xl rotate-3 border border-gray-500/30"></div>
                    <div className="relative w-40 h-48 bg-white rounded-2xl shadow-2xl flex flex-col items-center justify-center p-4">
                      <div className="w-16 h-16 bg-gold-200 rounded-xl flex items-center justify-center mb-3">
                        <FontAwesomeIcon icon={faHome} className="text-2xl text-gold" />
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
                   onClick={() => setIsCreateIssueModalOpen(true)}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gold-200 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-gold transition-colors">
                    <span className="text-gold font-bold group-hover:text-white transition-colors">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Post a Job</h3>
                    <p className="text-sm text-gray-500">Describe what you need fixed or upload a report</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-5 border border-gray-200 opacity-60">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-400 font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Get Quotes</h3>
                    <p className="text-sm text-gray-500">Verified contractors send you competitive bids</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-5 border border-gray-200 opacity-60">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-400 font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Hire & Track</h3>
                    <p className="text-sm text-gray-500">Choose a pro and track your project to completion</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MAIN GRID LAYOUT */}
        {!isNewUser && (
          <div className="grid grid-cols-12 gap-5 w-full min-w-0 overflow-hidden">
            
            {/* LEFT COLUMN - Priority Inbox + Active Properties stacked */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-5 min-w-0">
            
            {/* PRIORITY INBOX - Main Card */}
            <div className="min-w-0">
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
                          : 'text-gray-600 hover:bg-foreground hover:text-background'
                      }`}
                    >
                      Approvals
                      {approvalItems.length > 0 && (
                        <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                          activeInboxTab === 'approvals' ? 'bg-gold text-white' : 'bg-gold-200 text-gold-700'
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
                          : 'text-gray-600 hover:bg-foreground hover:text-background'
                      }`}
                    >
                      Quotes
                      {quoteItems.length > 0 && (
                        <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                          activeInboxTab === 'quotes' ? 'bg-gold text-white' : 'bg-gold-200 text-gold-700'
                        }`}>
                          {quoteItems.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveInboxTab('visits')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                        activeInboxTab === 'visits' 
                          ? 'bg-gray-900 text-white' 
                          : 'text-gray-600 hover:bg-foreground hover:text-background'
                      }`}
                    >
                      Visit Requests
                      {pendingAssessments.length > 0 && (
                        <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                          activeInboxTab === 'visits' ? 'bg-gold text-white' : 'bg-gold-200 text-gold-700'
                        }`}>
                          {pendingAssessments.length}
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
                                className="group flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer border-l-4 border-transparent hover:border-gold hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gold-100">
                                    <FontAwesomeIcon icon={getIssueTypeIcon(item.type)} className="text-gray-600 group-hover:text-gold" />
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
                                  <button className="px-4 py-2 bg-gold text-white font-semibold rounded-lg hover:bg-foreground hover:text-background transition-colors flex items-center gap-2">
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
                                className="group flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer border-l-4 border-transparent hover:border-gold hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gold-100">
                                    <FontAwesomeIcon icon={getIssueTypeIcon(item.type)} className="text-gray-600 group-hover:text-gold" />
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
                                    <button className="px-4 py-2 bg-gold text-white font-semibold rounded-lg hover:bg-foreground hover:text-background transition-colors flex items-center gap-2">
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

                  {/* Visit Requests Tab */}
                  {activeInboxTab === 'visits' && (
                    <div className="space-y-3">
                      {pendingAssessments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FontAwesomeIcon icon={faCalendarAlt} className="text-3xl text-gray-300 mb-2" />
                          <p>No visit requests pending</p>
                        </div>
                      ) : (
                        <>
                          {pendingAssessments.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className="group p-4 bg-gray-50 rounded-xl cursor-pointer border-l-4 border-transparent hover:border-gold hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                            >
                              <div className="flex items-start gap-4">
                                {/* Issue type icon */}
                                <div className="w-10 h-10 bg-gold-200 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-gold-300">
                                  <FontAwesomeIcon 
                                    icon={getIssueTypeIcon(event.issue?.type)} 
                                    className="text-gold" 
                                  />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  {/* Issue title */}
                                  <div className="font-semibold text-gray-900 mb-1 truncate">
                                    {event.title}
                                  </div>
                                  
                                  {/* Vendor name and rating */}
                                  {event.vendor && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                      <FontAwesomeIcon icon={faUser} className="text-xs text-gray-400" />
                                      <span className="font-medium">{event.vendor.name || "Vendor"}</span>
                                      <span className="flex items-center gap-0.5 text-gold">
                                        <FontAwesomeIcon icon={faStar} className="text-xs" />
                                        <span className="text-gray-600">{event.vendor.rating || "New"}</span>
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Property address */}
                                  {event.listing && (
                                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
                                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs" />
                                      <span className="truncate">
                                        {event.listing.address?.split(',')[0] || event.listing.address}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Date and time */}
                                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                                    <FontAwesomeIcon icon={faClock} className="text-xs" />
                                    <span>
                                      {event.start.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })}
                                      {' · '}
                                      {event.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                    </span>
                                  </div>
                                  
                                  {/* Action buttons - different based on who proposed */}
                                  <div className="flex items-center gap-2">
                                    {event.user_id === user.id ? (
                                      // Client's own proposal - show cancel option
                                      <>
                                        <span className="text-xs text-gold-600 font-medium bg-gold-100 px-2 py-1 rounded">
                                          Your proposal
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCancelProposal(event);
                                          }}
                                          disabled={isDeletingAssessment}
                                          className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 bg-red-50 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                        >
                                          <FontAwesomeIcon icon={faTrash} />
                                          {isDeletingAssessment ? "Cancelling..." : "Cancel"}
                                        </button>
                                      </>
                                    ) : (
                                      // Vendor's proposal - show accept/propose options
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAcceptAssessment(event);
                                          }}
                                          disabled={isUpdatingAssessment}
                                          className={`flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg ${BUTTON_HOVER} disabled:opacity-50`}
                                        >
                                          <FontAwesomeIcon icon={faCheck} />
                                          {isUpdatingAssessment ? "Accepting..." : "Accept"}
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openProposeTimeModal(event);
                                          }}
                                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                          <FontAwesomeIcon icon={faEdit} />
                                          Propose New Time
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {pendingAssessments.length > 3 && (
                            <button
                              onClick={() => setShowScheduleModal(true)}
                              className="w-full text-center py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                            >
                              View all {pendingAssessments.length} visit requests →
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* ACTIVE PROPERTIES - Inside left column */}
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
                                      <span className="text-sm text-gold font-medium">
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
                                      openCount > 0 ? 'bg-gold' : 'bg-emerald-500'
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

            </div> {/* End LEFT COLUMN */}

            {/* RIGHT COLUMN - Project Health + Schedule stacked */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-5 min-w-0">
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
                        className="h-full bg-gradient-to-r from-gold-400 to-gold rounded-full transition-all duration-500" 
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

            {/* UPCOMING VISITS CARD - Only confirmed visits (informational) */}
            {confirmedAssessments.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-emerald-600" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">Upcoming Visits</h2>
                    </div>
                    {confirmedAssessments.length > 3 && (
                      <button
                        onClick={() => setShowScheduleModal(true)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        View all
                      </button>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {confirmedAssessments.slice(0, 3).map((event) => (
                        <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FontAwesomeIcon 
                              icon={getIssueTypeIcon(event.issue?.type)} 
                              className="text-gray-600 text-sm" 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {event.title}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {event.listing?.address?.split(',')[0] || 'Property'}
                              {' · '}
                              {event.start.toLocaleDateString("en-US", { weekday: 'short' })}
                              {' '}
                              {event.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {confirmedAssessments.length === 0 && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No confirmed visits scheduled
                      </div>
                    )}
                  </div>
                </div>
            )}

            </div> {/* End RIGHT COLUMN */}
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

      {/* Propose New Time Modal */}
      {proposeTimeModal.isOpen && proposeTimeModal.assessment && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold-200 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-gold" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Propose Times</h3>
                  <p className="text-xs text-gray-500">Add up to 3 time options</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setProposeTimeModal({ isOpen: false, assessment: null });
                  setProposedTimes([""]);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Issue context */}
              <div className="mb-5 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">For issue:</p>
                <p className="font-medium text-gray-900 text-sm">
                  {proposeTimeModal.assessment.issue?.summary || proposeTimeModal.assessment.title}
                </p>
              </div>

              {/* Time slots */}
              <div className="space-y-3 mb-5">
                <label className="block text-sm font-medium text-gray-700">
                  Select your preferred times (30 min each)
                </label>
                
                {proposedTimes.map((time, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gold-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-gold-700">{index + 1}</span>
                    </div>
                    <input
                      type="datetime-local"
                      value={time}
                      onChange={(e) => updateTimeSlot(index, e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold text-gray-900 text-sm"
                    />
                    {proposedTimes.length > 1 && (
                      <button
                        onClick={() => removeTimeSlot(index)}
                        className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-sm" />
                      </button>
                    )}
                  </div>
                ))}
                
                {proposedTimes.length < 3 && (
                  <button
                    onClick={addTimeSlot}
                    className="flex items-center gap-2 text-sm text-gold-600 font-medium hover:text-gold-700 transition-colors mt-2"
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-xs" />
                    Add another time option
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 mb-6">
                The contractor will be able to accept one of your proposed times or suggest alternatives.
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setProposeTimeModal({ isOpen: false, assessment: null });
                    setProposedTimes([""]);
                  }}
                  className={`flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg ${BUTTON_HOVER}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleProposeNewTime}
                  disabled={proposedTimes.every(t => !t.trim()) || isCreatingAssessment}
                  className={`flex-1 px-4 py-3 bg-gold text-white font-semibold rounded-lg ${BUTTON_HOVER} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isCreatingAssessment ? "Proposing..." : `Propose ${proposedTimes.filter(t => t.trim()).length || ""} Time${proposedTimes.filter(t => t.trim()).length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold-200 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-gold" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">All Scheduled Visits</h3>
                  <p className="text-sm text-gray-500">
                    {pendingAssessments.length} pending · {confirmedAssessments.length} confirmed
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Pending Section */}
              {pendingAssessments.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gold-700 uppercase tracking-wide mb-3">
                    Awaiting Your Response ({pendingAssessments.length})
                  </h4>
                  <div className="space-y-3">
                    {pendingAssessments.map((event) => (
                      <div key={event.id} className="p-4 bg-gold-50 rounded-xl border border-gold-200">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                            <FontAwesomeIcon 
                              icon={getIssueTypeIcon(event.issue?.type)} 
                              className="text-gold" 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 mb-1">{event.title}</div>
                            {/* Vendor name and rating */}
                            {event.vendor && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                <FontAwesomeIcon icon={faUser} className="text-xs text-gray-400" />
                                <span className="font-medium">{event.vendor.name || "Vendor"}</span>
                                <span className="flex items-center gap-0.5 text-gold">
                                  <FontAwesomeIcon icon={faStar} className="text-xs" />
                                  <span className="text-gray-600">{event.vendor.rating || "New"}</span>
                                </span>
                              </div>
                            )}
                            {event.listing && (
                              <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs text-gray-400" />
                                {event.listing.address}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
                              <FontAwesomeIcon icon={faClock} className="text-xs text-gray-400" />
                              {event.start.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' })}
                              {' at '}
                              {event.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </div>
                            <div className="flex items-center gap-2">
                              {event.user_id === user.id ? (
                                // Client's own proposal
                                <>
                                  <span className="text-xs text-gold-600 font-medium bg-gold-100 px-2 py-1 rounded">
                                    Your proposal
                                  </span>
                                  <button
                                    onClick={() => handleCancelProposal(event)}
                                    disabled={isDeletingAssessment}
                                    className="flex items-center gap-1.5 px-4 py-2 text-red-600 bg-red-50 text-sm font-semibold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                    {isDeletingAssessment ? "Cancelling..." : "Cancel"}
                                  </button>
                                </>
                              ) : (
                                // Vendor's proposal
                                <>
                                  <button
                                    onClick={() => handleAcceptAssessment(event)}
                                    disabled={isUpdatingAssessment}
                                    className={`flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg ${BUTTON_HOVER} disabled:opacity-50 disabled:cursor-not-allowed`}
                                  >
                                    <FontAwesomeIcon icon={faCheck} />
                                    {isUpdatingAssessment ? "Accepting..." : "Accept"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShowScheduleModal(false);
                                      openProposeTimeModal(event);
                                    }}
                                    className={`flex items-center gap-1.5 px-4 py-2 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 ${BUTTON_HOVER}`}
                                  >
                                    <FontAwesomeIcon icon={faEdit} />
                                    Propose New Time
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confirmed Section */}
              {confirmedAssessments.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-emerald-700 uppercase tracking-wide mb-3">
                    Confirmed Visits ({confirmedAssessments.length})
                  </h4>
                  <div className="space-y-2">
                    {confirmedAssessments.map((event) => (
                      <div key={event.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-600 text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">{event.title}</div>
                          <div className="text-xs text-gray-500">
                            {event.vendor?.name && (
                              <span className="font-medium text-gray-700">{event.vendor.name} · </span>
                            )}
                            {event.listing?.address?.split(',')[0] || 'Property'}
                            {' · '}
                            {event.start.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })}
                            {' · '}
                            {event.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {calendarEvents.length === 0 && (
                <div className="text-center py-12">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-4xl text-gray-300 mb-3" />
                  <p className="text-gray-500">No scheduled visits</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
