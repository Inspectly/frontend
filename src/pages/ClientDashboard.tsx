import React, { useEffect, useMemo, useRef, useState } from "react";

// Use a unique key to avoid any conflicts
const SUBS_KEY = '__INSPECTLY_OFFER_SUBS__';

// Helper to get/create the global subscriptions map (survives HMR)
const getGlobalSubscriptions = (): Map<number, unknown> => {
  const w = (window as unknown) as Window & { [key: string]: unknown };
  if (!w[SUBS_KEY]) {
    w[SUBS_KEY] = new Map<number, unknown>();
  }
  return w[SUBS_KEY] as Map<number, unknown>;
};
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Calendar, ClipboardList, FileText, MapPin, TrendingUp } from "lucide-react";
import { PROPERTY_FALLBACK_IMAGE } from "../constants/assets";
import DashboardStatCard from "../components/dashboard/DashboardStatCard";
import CardSectionHeader from "../components/dashboard/CardSectionHeader";
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
  faPlus,
  faMagic,
  faTimes,
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
import { useGetClientByUserIdQuery } from "../features/api/clientsApi";
// useGetClientsQuery removed — was fetching all clients but result was never used
import { useGetAssessmentsByClientIdUsersInteractionIdQuery, useUpdateAssessmentMutation, useDeleteAssessmentMutation, useCreateAssessmentMutation } from "../features/api/issueAssessmentsApi";
import { getOffersByIssueId, issueOffersApi } from "../features/api/issueOffersApi";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store/store";
import { getVendorById, useGetVendorsQuery } from "../features/api/vendorsApi";
import AddListingByReportModal, { ListingByReportFormData } from "../components/AddListingByReportModal";
import { handleAddListingWithReport } from "../utils/reportUtil";
import PostJobWizard from "../components/PostJobWizard";
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
  const [searchParams] = useSearchParams();

  // If returning from Stripe on the dashboard, redirect to Offers page which handles payment
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const paymentStatus = searchParams.get("payment");
    const pendingPaymentStr = localStorage.getItem("pending_offer_payment");
    if ((sessionId || paymentStatus === "success") && pendingPaymentStr) {
      const params = new URLSearchParams();
      if (sessionId) params.set("session_id", sessionId);
      params.set("payment", "success");
      params.set("filter", "accepted");
      navigate(`/offers?${params.toString()}`, { replace: true });
    }
  }, [searchParams, navigate]);

  // Queries - all real data
  const { data: _listings } = useGetListingByUserIdQuery(user?.id, { skip: !user?.id });
  const { data: reports, refetch: refetchReports } = useGetReportsByUserIdQuery(user?.id, { skip: !user?.id });
  const { data: issues } = useGetIssuesQuery();
  const { data: clientProfile } = useGetClientByUserIdQuery(String(user?.id), { skip: !user?.id });

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
  // Polling tick to refetch offers periodically (client sees new offers when vendor creates them)
  const [pollTick, setPollTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPollTick((t) => t + 1), 20000);
    return () => clearInterval(id);
  }, []);

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
          allIssueIds.map((id) => dispatch(getOffersByIssueId.initiate(id, { forceRefetch: true })))
        );
        setOffersByIssueId(Object.fromEntries(offerResults.map((res, i) => [allIssueIds[i], (res.data as IssueOffer[]) || []])));
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    if (issueIds.length || vendorIds.length || filteredIssuesByUser.length) run();
  }, [dispatch, issueIds, vendorIds, filteredIssuesByUser, pollTick]);

  // Auto-rotate properties slideshow (cycles through pages of 2)
  useEffect(() => {
    if (!_listings || _listings.length <= 2) return;
    const totalPages = Math.ceil(_listings.length / 2);
    const interval = setInterval(() => {
      setActivePropertyIndex((prev) => (prev + 1) % totalPages);
    }, 5000); // Rotate every 5 seconds
    return () => clearInterval(interval);
  }, [_listings]);

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
    } catch (err: unknown) {
      console.error("Failed to propose new time:", err);
      const errObj = err as Record<string, unknown>;
      console.error("Error details:", errObj?.data || errObj?.message || err);
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
    } catch (err: unknown) {
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

  // Vendors map for quick lookup by vendor_user_id
  const globalVendorsMap = useMemo(() => {
    return (Array.isArray(allVendors) ? allVendors : []).reduce((acc, v) => {
      acc[v.vendor_user_id] = v;
      acc[v.id] = v;
      return acc;
    }, {} as Record<number, Vendor>);
  }, [allVendors]);

  // Get items with pending quotes (no offer accepted yet - client still needs to choose)
  const quoteItems = useMemo(() => {
    return filteredIssuesByUser.filter(i => {
      const offers = offersByIssueId[i.id] || [];
      const hasPendingOffer = offers.some(o => o.status === IssueOfferStatus.RECEIVED);
      const hasAcceptedOffer = offers.some(o => o.status === IssueOfferStatus.ACCEPTED) || !!i.vendor_id;
      return hasPendingOffer && !hasAcceptedOffer;
    });
  }, [filteredIssuesByUser, offersByIssueId]);

  // State for issue detail modal
  const [selectedIssueForModal, setSelectedIssueForModal] = useState<IssueType | null>(null);
  const [selectedListingForModal, setSelectedListingForModal] = useState<Listing | undefined>(undefined);
  const [modalDefaultTab, setModalDefaultTab] = useState<
    "details" | "offers" | "assessments" | "dispute"
  >("details");

  // Helper to open issue in modal
  const openIssueModal = (
    issue: IssueType,
    defaultTab: "details" | "offers" | "assessments" | "dispute" = "details"
  ) => {
    const report = reports?.find((r) => r.id === issue.report_id);
    const listing = _listings?.find((l) => l.id === report?.listing_id);
    setSelectedIssueForModal(issue);
    setSelectedListingForModal(listing || undefined);
    setModalDefaultTab(defaultTab);
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="w-full max-w-[1800px] mx-auto px-4 py-5 lg:px-8 lg:py-6">
        
        {/* Welcome Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary flex-shrink-0">
                {clientProfile?.first_name?.[0]?.toUpperCase() || user?.id?.toString()?.[0] || "U"}
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
                  Today at a glance
                </h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back{clientProfile?.first_name ? `, ${clientProfile.first_name}` : ""}
                </p>
              </div>
            </div>
            
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
                <div className="absolute right-0 top-full mt-2 w-48 bg-card rounded-xl shadow-lg border border-border py-2 z-50">
                  <button
                    onClick={() => { setIsCreateIssueModalOpen(true); setIsCreateDropdownOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3"
                  >
                    <FontAwesomeIcon icon={faClipboardList} className="text-muted-foreground w-4" />
                    Post a Job
                  </button>
                  <button
                    onClick={() => { setIsAddListingModalOpen(true); setIsCreateDropdownOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3"
                  >
                    <FontAwesomeIcon icon={faUpload} className="text-muted-foreground w-4" />
                    Upload Report
                  </button>
                  <button
                    onClick={() => { navigate('/listings?action=add'); setIsCreateDropdownOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3"
                  >
                    <FontAwesomeIcon icon={faHome} className="text-muted-foreground w-4" />
                    Add Property
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stat Cards Row - Only show for existing users */}
          {!isNewUser && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <DashboardStatCard
                iconBg="bg-amber-100"
                icon={<ClipboardList className="w-4 h-4 text-amber-600" />}
                value={approvalItems.length}
                label="Approvals Needed"
                onClick={() => navigate("/offers")}
              />
              <DashboardStatCard
                iconBg="bg-blue-100"
                icon={<FileText className="w-4 h-4 text-blue-600" />}
                value={quoteItems.length}
                label="Quotes to Compare"
                onClick={() => navigate("/offers")}
              />
              <DashboardStatCard
                iconBg="bg-emerald-100"
                icon={<Calendar className="w-4 h-4 text-emerald-600" />}
                value={calendarEvents.length}
                label="Visits Scheduled"
              />
              <DashboardStatCard
                iconBg="bg-gold-200"
                icon={<span className="text-gold font-bold text-sm">$</span>}
                value={`$${Object.values(offersByIssueId).flat().filter(o => o.status === IssueOfferStatus.ACCEPTED).reduce((sum, o) => sum + (o.price || 0), 0).toLocaleString()}`}
                label="Spent on Repairs"
              />
            </div>
          )}
        </div>

        {/* NEW USER: Welcome CTA */}
        {isNewUser && (
          <div className="mb-6">
            {/* Hero Welcome Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 lg:p-10 shadow-lg">
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
              <div className="bg-card rounded-xl p-5 border border-border shadow-lg hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                   onClick={() => setIsCreateIssueModalOpen(true)}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gold-200 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-gold transition-colors">
                    <span className="text-gold font-bold group-hover:text-white transition-colors">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Post a Job</h3>
                    <p className="text-sm text-muted-foreground">Describe what you need fixed or upload a report</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card rounded-xl p-5 border border-border shadow-lg opacity-60">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-muted-foreground font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Get Quotes</h3>
                    <p className="text-sm text-muted-foreground">Verified contractors send you competitive bids</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card rounded-xl p-5 border border-border shadow-lg opacity-60">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-muted-foreground font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Hire & Track</h3>
                    <p className="text-sm text-muted-foreground">Choose a pro and track your project to completion</p>
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
              <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden transition-shadow duration-300">
                <CardSectionHeader
                  iconBg="bg-muted"
                  icon={<FontAwesomeIcon icon={faClipboardList} className="text-muted-foreground text-lg" />}
                  title="Priority Inbox"
                  viewAllHref="/offers"
                >
                  {/* Tabs — plain text style, underline on active */}
                  <div className="flex items-center gap-1 border-b border-border -mb-4 pb-0">
                    <button
                      onClick={() => setActiveInboxTab('approvals')}
                      className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 -mb-px ${
                        activeInboxTab === 'approvals'
                          ? 'border-primary text-foreground'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Approvals
                      {approvalItems.length > 0 && (
                        <span className="px-1.5 py-0.5 text-xs rounded-full bg-gold-200 text-gold-700">
                          {approvalItems.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveInboxTab('quotes')}
                      className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 -mb-px ${
                        activeInboxTab === 'quotes'
                          ? 'border-primary text-foreground'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Quotes
                      {quoteItems.length > 0 && (
                        <span className="px-1.5 py-0.5 text-xs rounded-full bg-gold-200 text-gold-700">
                          {quoteItems.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveInboxTab('visits')}
                      className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 -mb-px ${
                        activeInboxTab === 'visits'
                          ? 'border-primary text-foreground'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Visit Requests
                      {pendingAssessments.length > 0 && (
                        <span className="px-1.5 py-0.5 text-xs rounded-full bg-gold-200 text-gold-700">
                          {pendingAssessments.length}
                        </span>
                      )}
                    </button>
                  </div>
                </CardSectionHeader>

                {/* Tab Content */}
                <div className="p-4">
                  {/* Approvals Tab */}
                  {activeInboxTab === 'approvals' && (
                    <div className="space-y-3">
                      {approvalItems.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FontAwesomeIcon icon={faCheckCircle} className="text-3xl text-muted-foreground/50 mb-2" />
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
                                className="group flex items-center justify-between p-4 bg-muted/40 rounded-xl cursor-pointer border-l-4 border-transparent hover:border-primary hover:bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center group-hover:bg-gold-100">
                                    <FontAwesomeIcon icon={getIssueTypeIcon(item.type)} className="text-muted-foreground group-hover:text-gold" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-foreground">
                                      {item.summary || `${normalizeAndCapitalize(item.type)} Issue`}
                                    </div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                                      <MapPin className="w-3 h-3 flex-shrink-0" />
                                      {listing?.address || "Property"}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {acceptedOffer && (
                                    <span className="text-sm font-semibold text-foreground">${acceptedOffer.price?.toLocaleString()}</span>
                                  )}
                                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
                                    Pending
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                          {approvalItems.length > 2 && (
                            <button
                              onClick={() => navigate("/offers?filter=review")}
                              className="w-full text-center py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
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
                        <div className="text-center py-8 text-muted-foreground">
                          <FontAwesomeIcon icon={faFileAlt} className="text-3xl text-muted-foreground/50 mb-2" />
                          <p>No quotes to review</p>
                        </div>
                      ) : (
                        <>
                          {quoteItems.slice(0, 4).flatMap((item) => {
                            const report = reports?.find((r) => r.id === item.report_id);
                            const listing = _listings?.find((l) => l.id === report?.listing_id);
                            const offers = offersByIssueId[item.id] || [];
                            const pendingOffers = offers.filter(o => o.status === IssueOfferStatus.RECEIVED);
                            
                            return pendingOffers.map((offer) => {
                              const vendor = globalVendorsMap[offer.vendor_id];
                              const vendorName = vendor?.company_name || vendor?.name || "Vendor";
                              const vendorInitials = vendorName.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "V";
                              const vendorRating = vendor?.rating ? parseFloat(vendor.rating) : null;
                              const address = listing?.address?.split(",")[0] || listing?.address || "Property";

                              return (
                                <div
                                  key={offer.id}
                                  className="flex items-center justify-between p-4 border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors cursor-pointer"
                                  onClick={() => openIssueModal(item, "offers")}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    {vendor?.profile_image_url ? (
                                      <img
                                        src={vendor.profile_image_url}
                                        alt={vendorName}
                                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                      />
                                    ) : null}
                                    <div className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0 ${vendor?.profile_image_url ? "hidden" : ""}`}>
                                      {vendorInitials}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-foreground text-sm truncate">{vendorName}</span>
                                        {vendorRating && vendorRating > 0 && (
                                          <span className="flex items-center gap-0.5 text-xs text-amber-600">
                                            <FontAwesomeIcon icon={faStar} className="text-[10px]" />
                                            {vendorRating.toFixed(1)}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate">
                                        {item.summary || normalizeAndCapitalize(item.type)} · {address}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                    <span className="text-lg font-bold text-foreground">${offer.price?.toLocaleString()}</span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); openIssueModal(item, "offers"); }}
                                      className="px-3 py-1.5 text-xs font-semibold border-2 border-foreground rounded-lg hover:bg-muted transition-colors"
                                    >
                                      Decline
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); openIssueModal(item, "offers"); }}
                                      className="px-3 py-1.5 text-xs font-semibold bg-gold text-white rounded-lg hover:bg-foreground hover:text-background transition-colors"
                                    >
                                      Accept
                                    </button>
                                  </div>
                                </div>
                              );
                            });
                          })}
                          {quoteItems.length > 2 && (
                            <button
                              onClick={() => navigate("/offers?filter=pending")}
                              className="w-full text-center py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
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
                        <div className="text-center py-8 text-muted-foreground">
                          <FontAwesomeIcon icon={faCalendarAlt} className="text-3xl text-muted-foreground/50 mb-2" />
                          <p>No visit requests pending</p>
                        </div>
                      ) : (
                        <>
                          {pendingAssessments.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className="group p-4 bg-muted/40 rounded-xl cursor-pointer border-l-4 border-transparent hover:border-gold hover:bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
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
                                  <div className="font-semibold text-foreground mb-1 truncate">
                                    {event.title}
                                  </div>
                                  
                                  {/* Vendor name and rating */}
                                  {event.vendor && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                      <FontAwesomeIcon icon={faUser} className="text-xs text-muted-foreground" />
                                      <span className="font-medium">{event.vendor.name || "Vendor"}</span>
                                      <span className="flex items-center gap-0.5 text-gold">
                                        <FontAwesomeIcon icon={faStar} className="text-xs" />
                                        <span className="text-muted-foreground">{event.vendor.rating || "New"}</span>
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Property address */}
                                  {event.listing && (
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                                      <MapPin className="w-3 h-3 flex-shrink-0" />
                                      <span className="truncate">
                                        {event.listing.address?.split(',')[0] || event.listing.address}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Date and time */}
                                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
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
                                          className={`flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background text-xs font-semibold rounded-lg ${BUTTON_HOVER} disabled:opacity-50`}
                                        >
                                          <FontAwesomeIcon icon={faCheck} />
                                          {isUpdatingAssessment ? "Accepting..." : "Accept"}
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openProposeTimeModal(event);
                                          }}
                                          className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground text-xs font-semibold rounded-lg hover:bg-muted/80 transition-colors"
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
                              className="w-full text-center py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
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
            <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden transition-shadow duration-300">
              <CardSectionHeader
                iconBg="bg-muted"
                icon={<FontAwesomeIcon icon={faHome} className="text-muted-foreground" />}
                title="Active Properties"
                right={
                  <div className="flex items-center gap-2">
                    {_listings && _listings.length > 2 && (
                      <div className="flex gap-1">
                        {Array.from({ length: Math.ceil(_listings.length / 2) }).map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActivePropertyIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              idx === activePropertyIndex ? 'bg-foreground' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    <Link to="/listings" className="ml-2 text-muted-foreground hover:text-foreground">
                      <FontAwesomeIcon icon={faChevronRight} />
                    </Link>
                  </div>
                }
              />
                
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
                              className="group rounded-xl overflow-hidden cursor-pointer bg-card border border-border shadow-soft hover:shadow-md transition-all duration-300"
                            >
                              {/* Large Image */}
                              <div className="h-44 bg-muted relative overflow-hidden">
                                <ImageComponent
                                  src={listing.image_url}
                                  fallback={PROPERTY_FALLBACK_IMAGE}
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
                                      <span className="text-sm text-muted-foreground">
                                        {listingIssues.length} issue{listingIssues.length !== 1 ? 's' : ''} tracked
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); navigate(`/listings/${listing.id}`); }}
                                    className="text-sm font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
                                  >
                                    View Property <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                                  </button>
                                </div>
                                
                                {/* Progress bar */}
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
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
                      <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4">
                        <FontAwesomeIcon icon={faBuilding} className="text-muted-foreground text-2xl" />
                      </div>
                      <p className="text-foreground mb-1 font-semibold">No properties yet</p>
                      <p className="text-sm text-muted-foreground mb-4">Add your first property to get started</p>
                      <button
                        onClick={() => setIsAddListingModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg font-medium text-sm hover:opacity-90 transition"
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
              <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden transition-shadow duration-300">
                <CardSectionHeader
                  iconBg="bg-gold-200"
                  icon={<TrendingUp className="w-5 h-5 text-gold" />}
                  title="Project Health"
                />
                
                <div className="p-5 space-y-5">
                  {/* Resolution Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Resolution Rate</span>
                      <span className="text-sm font-bold text-foreground">{resolutionRate}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${resolutionRate}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-xl font-bold text-foreground">{realMetrics.totalIssues}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-xl font-bold text-primary">{realMetrics.openIssues}</div>
                      <div className="text-xs text-muted-foreground">Open</div>
                    </div>
                    <div className="text-center p-3 bg-emerald-50 rounded-lg">
                      <div className="text-xl font-bold text-emerald-600">{realMetrics.completedIssues}</div>
                      <div className="text-xs text-muted-foreground">Done</div>
                    </div>
                  </div>

                </div>
              </div>

            {/* UPCOMING VISITS CARD - Confirmed upcoming assessments, max 5, closest at top */}
            <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden transition-shadow duration-300">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-emerald-600" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Upcoming Visits</h2>
                </div>
                {confirmedAssessments.length > 5 && (
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    View all
                  </button>
                )}
              </div>
              <div className="p-4">
                {confirmedAssessments.length > 0 ? (
                  <div className="space-y-2">
                    {confirmedAssessments.slice(0, 5).map((event) => (
                      <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors">
                        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                          <FontAwesomeIcon 
                            icon={getIssueTypeIcon(event.issue?.type)} 
                            className="text-muted-foreground text-sm" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">
                            {event.title}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
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
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No confirmed visits scheduled
                  </div>
                )}
              </div>
            </div>

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

      {/* Post a Job Wizard */}
      <PostJobWizard
        open={isCreateIssueModalOpen}
        onClose={() => setIsCreateIssueModalOpen(false)}
        listings={Array.isArray(_listings) ? _listings : []}
        reports={Array.isArray(reports) ? reports : []}
      />

      {/* Issue Detail Modal */}
      {selectedIssueForModal && (
        <div
          className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center"
          onClick={() => setSelectedIssueForModal(null)}
        >
          <div
            className="relative w-[1100px] h-[80vh] mx-auto overflow-hidden rounded-2xl shadow-xl bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedIssueForModal(null)}
              className="absolute -top-10 right-0 text-white text-3xl leading-none px-2 hover:text-white/70 transition-colors"
            >
              &times;
            </button>
            <HomeownerIssueCard
              key={`${selectedIssueForModal.id}-${modalDefaultTab}`}
              issue={(issues || []).find(i => i.id === selectedIssueForModal.id) ?? selectedIssueForModal}
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
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold-200 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-gold" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Propose Times</h3>
                  <p className="text-xs text-muted-foreground">Add up to 3 time options</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setProposeTimeModal({ isOpen: false, assessment: null });
                  setProposedTimes([""]);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Issue context */}
              <div className="mb-5 p-3 bg-muted/40 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">For issue:</p>
                <p className="font-medium text-foreground text-sm">
                  {proposeTimeModal.assessment.issue?.summary || proposeTimeModal.assessment.title}
                </p>
              </div>

              {/* Time slots */}
              <div className="space-y-3 mb-5">
                <label className="block text-sm font-medium text-foreground">
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
                      className="flex-1 px-4 py-2.5 border border-border bg-card rounded-lg focus:ring-2 focus:ring-gold focus:border-gold text-foreground text-sm"
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

              <p className="text-xs text-muted-foreground mb-6">
                The contractor will be able to accept one of your proposed times or suggest alternatives.
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setProposeTimeModal({ isOpen: false, assessment: null });
                    setProposedTimes([""]);
                  }}
                  className={`flex-1 px-4 py-3 border border-border text-foreground font-semibold rounded-lg ${BUTTON_HOVER}`}
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
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold-200 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-gold" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">All Scheduled Visits</h3>
                  <p className="text-sm text-muted-foreground">
                    {pendingAssessments.length} pending · {confirmedAssessments.length} confirmed
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-muted-foreground" />
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
                          <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                            <FontAwesomeIcon 
                              icon={getIssueTypeIcon(event.issue?.type)} 
                              className="text-gold" 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-foreground mb-1">{event.title}</div>
                            {/* Vendor name and rating */}
                            {event.vendor && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <FontAwesomeIcon icon={faUser} className="text-xs text-muted-foreground" />
                                <span className="font-medium">{event.vendor.name || "Vendor"}</span>
                                <span className="flex items-center gap-0.5 text-gold">
                                  <FontAwesomeIcon icon={faStar} className="text-xs" />
                                  <span className="text-muted-foreground">{event.vendor.rating || "New"}</span>
                                </span>
                              </div>
                            )}
                            {event.listing && (
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                                <MapPin className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
                                {event.listing.address}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                              <FontAwesomeIcon icon={faClock} className="text-xs text-muted-foreground" />
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
                                    className={`flex items-center gap-1.5 px-4 py-2 bg-foreground text-background text-sm font-semibold rounded-lg ${BUTTON_HOVER} disabled:opacity-50 disabled:cursor-not-allowed`}
                                  >
                                    <FontAwesomeIcon icon={faCheck} />
                                    {isUpdatingAssessment ? "Accepting..." : "Accept"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShowScheduleModal(false);
                                      openProposeTimeModal(event);
                                    }}
                                    className={`flex items-center gap-1.5 px-4 py-2 bg-card text-foreground text-sm font-semibold rounded-lg border border-border ${BUTTON_HOVER}`}
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
                      <div key={event.id} className="p-3 bg-muted/40 rounded-xl border border-border flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-600 text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-foreground truncate">{event.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {event.vendor?.name && (
                              <span className="font-medium text-foreground">{event.vendor.name} · </span>
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
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-4xl text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No scheduled visits</p>
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
