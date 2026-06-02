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
import { MapPin } from "lucide-react";
import { PROPERTY_FALLBACK_IMAGE } from "../constants/assets";
import CardSectionHeader from "../components/dashboard/CardSectionHeader";
import HeroBand from "../components/dashboard/HeroBand";
import ActiveProjectsCard from "../components/dashboard/ActiveProjectsCard";
import MoneyPictureCard from "../components/dashboard/MoneyPictureCard";
import TrustedVendorsCard from "../components/dashboard/TrustedVendorsCard";
import ActiveSummaryCards from "../components/dashboard/ActiveSummaryCards";
import ScheduleCard from "../components/dashboard/ScheduleCard";
// Notifications dropdown + activity feed are temporarily hidden — re-enable by
// restoring the import, the `activityItems` memo, and the <NotificationsDropdown />
// render in the top-right toolbar.
// import NotificationsDropdown from "../components/dashboard/NotificationsDropdown";
// import { buildDashboardActivity } from "../utils/dashboardActivity";
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
  faClock,
  faEdit,
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
import { Briefcase, Upload as UploadIcon } from "lucide-react";
import ImageComponent from "../components/ImageComponent";
import { useIssuesByListings } from "../hooks/useIssuesByListings";
import { useCreateListingMutation, useGetListingByUserIdQuery } from "../features/api/listingsApi";
import { useGetClientByUserIdQuery } from "../features/api/clientsApi";
// useGetClientsQuery removed — was fetching all clients but result was never used
import { useGetAssessmentsByClientIdUsersInteractionIdQuery, useUpdateAssessmentMutation, useDeleteAssessmentMutation, useCreateAssessmentMutation } from "../features/api/issueAssessmentsApi";
import { issueOffersApi } from "../features/api/issueOffersApi";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import { useGetVendorsQuery } from "../features/api/vendorsApi";
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
  const { data: issues = [] } = useIssuesByListings(_listings?.map((l) => l.id));
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

  const [isAddListingModalOpen, setIsAddListingModalOpen] = useState<boolean>(false);
  const [isCreateIssueModalOpen, setIsCreateIssueModalOpen] = useState<boolean>(false);
  // Bumped to push the Active Projects card to a specific tab from outside (e.g. summary card clicks)
  const [activeProjectsTabRequest, setActiveProjectsTabRequest] = useState<{
    tab: "approvals" | "quotes" | "visits";
    nonce: number;
  } | undefined>(undefined);
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

  // Read offers from RTK Query cache — populated and kept fresh by the subscriptions below.
  const offersByIssueId = useSelector((state: RootState) => {
    if (filteredIssuesByUser.length === 0) return {} as Record<number, IssueOffer[]>;
    const map: Record<number, IssueOffer[]> = {};
    filteredIssuesByUser.forEach((issue) => {
      const result = issueOffersApi.endpoints.getOffersByIssueId.select(issue.id)(state);
      if (result.data) map[issue.id] = result.data;
    });
    return map;
  }, shallowEqual);

  // Subscribe to offers for all user issues — persists across navigations via window map.
  // RTK Query handles polling (30s) and cache management; no manual setInterval needed.
  useEffect(() => {
    if (filteredIssuesByUser.length === 0) return;

    const subs = getGlobalSubscriptions();
    const issuesNeedingSubscription = filteredIssuesByUser.filter(issue => !subs.has(issue.id));
    if (issuesNeedingSubscription.length === 0) return;

    issuesNeedingSubscription.forEach((issue) => {
      const subscription = dispatch(issueOffersApi.endpoints.getOffersByIssueId.initiate(issue.id, {
        subscribe: true,
        forceRefetch: false,
      }));
      subscription.updateSubscriptionOptions({ pollingInterval: 30000 });
      subs.set(issue.id, subscription);
    });
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


  // Determine user state
  const isNewUser = realMetrics.totalListings === 0;
  
  // Separate pending vs confirmed assessments
  const pendingAssessments = calendarEvents.filter(e => e.status === IssueAssessmentStatus.RECEIVED);
  const confirmedAssessments = calendarEvents.filter(e => e.status === IssueAssessmentStatus.ACCEPTED);

  // Time-of-day greeting
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

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

  const [activePropertyIndex, setActivePropertyIndex] = useState(0);

  // Unified schedule: pending + confirmed visits, future only, sorted ascending
  const scheduleEvents = useMemo(
    () => calendarEvents.filter(e =>
      e.status === IssueAssessmentStatus.RECEIVED ||
      e.status === IssueAssessmentStatus.ACCEPTED
    ),
    [calendarEvents]
  );

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

  // Dynamic header summary — what does the user need to know right now?
  const headerSummary = useMemo(() => {
    if (isNewUser) return "Let's get your first project posted.";

    const parts: string[] = [];
    const pluralize = (n: number, single: string, plural: string) => `${n} ${n === 1 ? single : plural}`;

    if (approvalItems.length > 0) {
      parts.push(`${pluralize(approvalItems.length, "approval", "approvals")} ready to sign off`);
    }
    if (quoteItems.length > 0) {
      parts.push(`${pluralize(quoteItems.length, "quote", "quotes")} pending decision`);
    }
    if (pendingAssessments.length > 0) {
      parts.push(`${pluralize(pendingAssessments.length, "visit request", "visit requests")}`);
    }

    const nextVisit = confirmedAssessments[0];
    if (nextVisit) {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isToday = nextVisit.start.toDateString() === today.toDateString();
      const isTomorrow = nextVisit.start.toDateString() === tomorrow.toDateString();
      const dateLabel = isToday
        ? "today"
        : isTomorrow
        ? "tomorrow"
        : nextVisit.start.toLocaleDateString("en-US", { weekday: "long" });
      const time = nextVisit.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      parts.push(`visit ${dateLabel} at ${time}`);
    }

    if (parts.length === 0) return "You're all caught up — nothing needs your attention right now.";
    // Capitalize the first part
    parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    return parts.join(" · ");
  }, [isNewUser, approvalItems.length, quoteItems.length, pendingAssessments.length, confirmedAssessments]);

  // Summary cards: three KPIs above Active Projects (Active Issues / Pending Quotes / Active Projects)
  const summaryMetrics = useMemo(() => {
    const isInFlight = (s: string) =>
      s === "Status.OPEN" || s === "Status.IN_PROGRESS" || s === "Status.REVIEW";

    const activeIssues = filteredIssuesByUser.filter((i) =>
      isInFlight(typeof i.status === "string" ? i.status : "")
    );

    // "Needs attention" = approvals + pending-quote decisions (the two user-blocked buckets)
    const needsAttentionCount = approvalItems.length + quoteItems.length;

    // Pending quote $ exposure — sum of every pending offer price across all quote items
    let pendingQuotesAmount = 0;
    quoteItems.forEach((issue) => {
      const offers = offersByIssueId[issue.id] || [];
      offers.forEach((o) => {
        if (o.status === IssueOfferStatus.RECEIVED && typeof o.price === "number") {
          pendingQuotesAmount += o.price;
        }
      });
    });

    // Active projects = in-flight issues that have an accepted/assigned vendor (contracted work)
    const activeProjects = activeIssues.filter((i) => {
      const offers = offersByIssueId[i.id] || [];
      const hasAccepted = offers.some((o) => o.status === IssueOfferStatus.ACCEPTED);
      return hasAccepted || !!i.vendor_id;
    });

    const inProgressCount = activeProjects.filter((i) => i.status === "Status.IN_PROGRESS").length;

    return {
      activeIssuesTotal: activeIssues.length,
      needsAttentionCount,
      pendingQuotesTotal: quoteItems.length,
      pendingQuotesAmount,
      activeProjectsTotal: activeProjects.length,
      inProgressCount,
    };
  }, [filteredIssuesByUser, approvalItems, quoteItems, offersByIssueId]);

  // Home Health Score inputs — derived from issue + user-blocked workload
  const homeHealthInputs = useMemo(() => {
    const isOpen = (s: string) =>
      s === "Status.OPEN" || s === "Status.IN_PROGRESS" || s === "Status.REVIEW";

    const open = filteredIssuesByUser.filter((i) => isOpen(typeof i.status === "string" ? i.status : ""));
    const highSeverityOpen = open.filter(
      (i) => (i.severity || "").toLowerCase() === "high" || i.severity === "Severity.HIGH"
    ).length;
    const resolvedIssues = filteredIssuesByUser.filter((i) => i.status === "Status.COMPLETED").length;

    // Overdue: user-blocked items idle >3 days
    const now = Date.now();
    const userBlockedIds = new Set<number>();
    approvalItems.forEach((i) => userBlockedIds.add(i.id));
    quoteItems.forEach((i) => userBlockedIds.add(i.id));
    let overdueCount = 0;
    userBlockedIds.forEach((id) => {
      const issue = filteredIssuesByUser.find((i) => i.id === id);
      if (!issue) return;
      const stamp = new Date(issue.updated_at || issue.created_at || 0).getTime();
      if (!stamp) return;
      const days = (now - stamp) / (1000 * 60 * 60 * 24);
      if (days > 3) overdueCount += 1;
    });

    return {
      totalIssues: filteredIssuesByUser.length,
      openIssues: open.length,
      resolvedIssues,
      highSeverityOpen,
      overdueCount,
    };
  }, [filteredIssuesByUser, approvalItems, quoteItems]);

  // Activity feed memo lives with the Notifications dropdown — both are
  // temporarily hidden. See the import block at the top of this file for how
  // to bring them back.
  // const activityItems = useMemo(
  //   () =>
  //     buildDashboardActivity({
  //       issues: filteredIssuesByUser,
  //       offersByIssueId,
  //       calendarEvents,
  //       reports: reports || [],
  //       listings: _listings || [],
  //       vendorMap: globalVendorsMap,
  //       currentUserId: user.id,
  //       onOpenIssue: (issue) => openIssueModal(issue, "details"),
  //       limit: 20,
  //     }),
  //   [
  //     filteredIssuesByUser,
  //     offersByIssueId,
  //     calendarEvents,
  //     reports,
  //     _listings,
  //     globalVendorsMap,
  //     user.id,
  //   ]
  // );

  // "All caught up" chip — show the sparkle next to the greeting whenever
  // there's no user-blocking work left.
  const isHeroQuiet =
    quoteItems.length === 0 &&
    approvalItems.length === 0 &&
    pendingAssessments.length === 0 &&
    !isNewUser;

  // Create dropdown — rendered as the Hero's CTA slot (replaces the previous
  // contextual "Review your quote" / "Approve work" / etc. button). The button
  // gets a pulsing gold halo + a left-to-right gold sweep to draw the eye
  // toward the primary action, especially on first load.
  const heroCreateCta = (
    <div className="relative" ref={createDropdownRef}>
      {/* Inner wrapper scopes the gold halo to just the button (so it doesn't
          balloon when the dropdown opens below). */}
      <div className="relative inline-flex">
        {/* Pulsing gold halo behind the button */}
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-[6px] rounded-2xl
                     bg-primary/40 blur-md animate-cta-halo"
        />

        <button
          onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
          className="group relative overflow-hidden inline-flex items-center gap-2.5 px-5 py-3 rounded-xl
                     bg-foreground text-background font-semibold text-sm
                     hover:bg-foreground/90 hover:-translate-y-0.5
                     active:translate-y-0
                     transition-all shadow-card hover:shadow-card-hover
                     ring-1 ring-primary/30"
        >
          {/* Left-to-right gold sweep (clipped by the button's overflow-hidden) */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3
                       bg-gradient-to-r from-transparent via-primary/70 to-transparent
                       animate-cta-sweep"
          />

          <FontAwesomeIcon icon={faPlus} className="text-xs relative z-10" />
          <span className="relative z-10">Create</span>
          <FontAwesomeIcon
            icon={faChevronRight}
            className={`text-xs transition-transform relative z-10 ${isCreateDropdownOpen ? "rotate-90" : ""}`}
          />
        </button>
      </div>

      {isCreateDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-card rounded-xl shadow-card border border-border py-2 z-50">
          <button
            onClick={() => {
              setIsCreateIssueModalOpen(true);
              setIsCreateDropdownOpen(false);
            }}
            className="w-full px-4 py-3 text-left text-sm hover:bg-muted flex items-start gap-3"
          >
            <Briefcase className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            <div>
              <div className="font-semibold text-foreground">Post a Job</div>
              <div className="text-xs text-muted-foreground">Describe an issue and get quotes</div>
            </div>
          </button>
          <button
            onClick={() => {
              setIsAddListingModalOpen(true);
              setIsCreateDropdownOpen(false);
            }}
            className="w-full px-4 py-3 text-left text-sm hover:bg-muted flex items-start gap-3"
          >
            <UploadIcon className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div>
              <div className="font-semibold text-foreground">Upload Inspection Report</div>
              <div className="text-xs text-muted-foreground">We'll extract issues for you</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-dashboard">
      <div className="w-full max-w-[1800px] mx-auto px-4 py-5 lg:px-8 lg:py-6">
        
        {/* Hero band — the focal point of the page. The Create dropdown
            lives in the hero's CTA slot (replaces the previous contextual
            "Review your quote" CTA). */}
        {!isNewUser && (
          <HeroBand
            greeting={greeting}
            firstName={clientProfile?.first_name}
            summary={headerSummary}
            isQuiet={isHeroQuiet}
            cta={heroCreateCta}
          />
        )}

        {/* NEW USER: Welcome CTA */}
        {isNewUser && (
          <div className="mb-6">
            {/* Hero Welcome Card */}
            <div className="relative overflow-hidden rounded-2xl bg-foreground p-8 lg:p-10 shadow-lg">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
              <div className="absolute top-10 right-10 w-20 h-20 border border-primary/20 rounded-xl rotate-12"></div>
              <div className="absolute bottom-10 right-32 w-12 h-12 border border-background/10 rounded-lg -rotate-6"></div>
              
              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-1 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary rounded-full text-sm font-medium mb-4">
                    <FontAwesomeIcon icon={faMagic} />
                    Welcome to Inspectly
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-background mb-3">
                    Let's get your home project started
                  </h2>
                  <p className="text-background/70 text-base mb-6 max-w-lg">
                    Post a job to get quotes from verified contractors, or upload your inspection report for AI-powered analysis.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setIsCreateIssueModalOpen(true)}
                      className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-base hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5"
                    >
                      <FontAwesomeIcon icon={faBriefcase} />
                      Post a Job
                      <FontAwesomeIcon icon={faArrowRight} />
                    </button>
                    <button
                      onClick={() => setIsAddListingModalOpen(true)}
                      className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-background/10 text-background rounded-xl font-bold text-base hover:bg-background/20 transition-all border border-background/20"
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
                    <div className="absolute -top-3 -left-3 w-40 h-48 bg-background/10 rounded-2xl rotate-6 border border-background/10"></div>
                    <div className="absolute -top-1 -left-1 w-40 h-48 bg-background/15 rounded-2xl rotate-3 border border-background/10"></div>
                    <div className="relative w-40 h-48 bg-card rounded-2xl shadow-2xl flex flex-col items-center justify-center p-4">
                      <div className="w-16 h-16 bg-primary/15 rounded-xl flex items-center justify-center mb-3">
                        <FontAwesomeIcon icon={faHome} className="text-2xl text-primary" />
                      </div>
                      <div className="h-2 w-24 bg-muted rounded mb-2"></div>
                      <div className="h-2 w-20 bg-muted/60 rounded mb-2"></div>
                      <div className="h-2 w-16 bg-muted/60 rounded"></div>
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
          <div className="grid grid-cols-12 gap-5 w-full min-w-0 overflow-hidden items-stretch">
            
            {/* LEFT COLUMN - Priority Inbox + Active Properties stacked */}
            <div className="col-span-12 lg:col-span-7 flex flex-col gap-5 min-w-0">
            
            {/* TOP ROW — Active Projects (dominant) + Summary KPI stack
                xl: side-by-side (AP 2/3, summary 1/3 stacked vertically)
                below xl: AP on top full-width, summary 3-up below
                Height pinning at xl: the AP wrapper uses absolute-fill so its
                natural height is 0 — the row sizes off the summary stack and
                AP's body scrolls within the locked height. */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 xl:gap-4 items-stretch">
              {/* ACTIVE PROJECTS */}
              <div
                id="active-projects"
                className="xl:col-span-2 min-w-0 scroll-mt-6 xl:relative xl:overflow-hidden"
              >
                <div className="xl:absolute xl:inset-0 xl:flex xl:flex-col">
                  <ActiveProjectsCard
                    issues={filteredIssuesByUser}
                    listings={_listings || []}
                    reports={reports || []}
                    offersByIssueId={offersByIssueId}
                    calendarEvents={calendarEvents}
                    vendorMap={globalVendorsMap}
                    onOpenIssue={(issue, tab) => openIssueModal(issue, tab ?? "details")}
                    onPostJob={() => setIsCreateIssueModalOpen(true)}
                    onAcceptVisit={handleAcceptAssessment}
                    onDeclineVisit={handleCancelProposal}
                    externalTabRequest={activeProjectsTabRequest}
                  />
                </div>
              </div>

              {/* SUMMARY KPI CARDS — now 4-up (3 KPIs + Home Health).
                  Cards are compact so the stack ≈ previous 3-card height; AP
                  auto-matches via the absolute-fill wrapper above. */}
              <div className="xl:col-span-1 min-w-0">
                <ActiveSummaryCards
                  activeIssuesTotal={summaryMetrics.activeIssuesTotal}
                  needsAttentionCount={summaryMetrics.needsAttentionCount}
                  pendingQuotesTotal={summaryMetrics.pendingQuotesTotal}
                  pendingQuotesAmount={summaryMetrics.pendingQuotesAmount}
                  activeProjectsTotal={summaryMetrics.activeProjectsTotal}
                  inProgressCount={summaryMetrics.inProgressCount}
                  homeHealth={{
                    totalIssues: homeHealthInputs.totalIssues,
                    openIssues: homeHealthInputs.openIssues,
                    highSeverityOpen: homeHealthInputs.highSeverityOpen,
                    overdueCount: homeHealthInputs.overdueCount,
                  }}
                  onClickActiveIssues={() => {
                    // Land on the Offers page filtered to accepted offers so
                    // the user sees the issues that have a chosen vendor
                    // (i.e. actively in-flight work).
                    navigate("/offers?filter=accepted");
                  }}
                  onClickPendingQuotes={() => {
                    setActiveProjectsTabRequest({ tab: "quotes", nonce: Date.now() });
                    document
                      .getElementById("active-projects")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  onClickActiveProjects={() => {
                    document
                      .getElementById("active-projects")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  onClickHomeHealth={() => {
                    document
                      .getElementById("active-projects")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                />
              </div>
            </div>

            {/* YOUR PROPERTIES */}
            <div className="bg-card rounded-2xl shadow-card border border-border/60 overflow-hidden">
              <CardSectionHeader
                iconBg="bg-primary/10"
                icon={<FontAwesomeIcon icon={faHome} className="text-primary" />}
                title="Your Properties"
                right={
                  <div className="flex items-center gap-3">
                    {_listings && _listings.length > 3 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setActivePropertyIndex((prev) => Math.max(0, prev - 1))}
                          disabled={activePropertyIndex === 0}
                          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Previous"
                        >
                          <FontAwesomeIcon icon={faChevronRight} className="text-xs rotate-180" />
                        </button>
                        <span className="text-xs text-muted-foreground tabular-nums px-1">
                          {activePropertyIndex + 1}/{Math.ceil(_listings.length / 3)}
                        </span>
                        <button
                          onClick={() => setActivePropertyIndex((prev) => Math.min(Math.ceil(_listings.length / 3) - 1, prev + 1))}
                          disabled={activePropertyIndex >= Math.ceil(_listings.length / 3) - 1}
                          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Next"
                        >
                          <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                        </button>
                      </div>
                    )}
                    <Link to="/listings" className="text-sm font-medium text-primary hover:text-primary/80">
                      View all
                    </Link>
                  </div>
                }
              />
                
                <div className="p-5">
                  {_listings && _listings.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {(() => {
                        const pageSize = 3;
                        const startIdx = activePropertyIndex * pageSize;
                        const visibleListings = _listings.slice(startIdx, startIdx + pageSize);

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
                          
                          const addressShort = listing.address?.split(",")[0] || listing.address || "Property";
                          return (
                            <div
                              key={listing.id}
                              onClick={() => navigate(`/listings/${listing.id}`)}
                              className="group rounded-2xl overflow-hidden cursor-pointer bg-card border border-border/60 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
                            >
                              {/* Property image area */}
                              <div className="h-40 relative overflow-hidden bg-muted">
                                <ImageComponent
                                  src={listing.image_url}
                                  fallback={PROPERTY_FALLBACK_IMAGE}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                                {/* Open-issues badge top-right */}
                                {openCount > 0 && (
                                  <div className="absolute top-2.5 right-2.5">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-wide shadow-sm">
                                      {openCount} open
                                    </span>
                                  </div>
                                )}

                                {/* Address overlay */}
                                <div className="absolute bottom-3 left-3 right-3">
                                  <h3 className="font-display font-bold text-white text-base leading-tight drop-shadow-lg truncate">
                                    {addressShort}
                                  </h3>
                                  <p className="text-white/85 text-xs drop-shadow-md">
                                    {listing.city}{listing.state ? `, ${listing.state}` : ""}
                                  </p>
                                </div>
                              </div>

                              {/* Body */}
                              <div className="p-3.5">
                                <div className="flex items-center justify-between gap-2">
                                  {openCount > 0 ? (
                                    <span className="text-xs font-semibold text-foreground">
                                      {openCount} open issue{openCount !== 1 ? "s" : ""}
                                    </span>
                                  ) : listingIssues.length > 0 ? (
                                    <span className="text-xs text-emerald-700 font-semibold">All clear</span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">No issues yet</span>
                                  )}
                                  <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                                    View <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
                                  </span>
                                </div>

                                {listingIssues.length > 0 && (
                                  <div className="mt-2.5 h-1 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        openCount > 0 ? "bg-primary" : "bg-emerald-500"
                                      }`}
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </div>
                                )}
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

            {/* RIGHT COLUMN — Spending, Schedule (flex-1 shock absorber),
                Vendors + Recent Activity (2-up bottom row).
                The column stretches to match the left column's height
                (items-stretch on the parent grid) and Schedule absorbs
                whatever vertical slack remains — so toggling its view never
                changes the column height. */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-5 min-w-0 lg:h-full">

              {/* SPENDING — auto-hides if no offer signal */}
              <MoneyPictureCard offersByIssueId={offersByIssueId} issues={filteredIssuesByUser} />

              {/* YOUR SCHEDULE — list + month-calendar views (toggle in header).
                  Wrapped with lg:flex-1 lg:min-h-0 so the card stretches to
                  fill remaining vertical space; both views share that space
                  internally, keeping the column height stable across toggles. */}
              <div className="lg:flex-1 lg:min-h-0 min-w-0">
                <ScheduleCard
                  events={scheduleEvents}
                  currentUserId={user.id}
                  isUpdatingAssessment={isUpdatingAssessment}
                  isDeletingAssessment={isDeletingAssessment}
                  onAccept={handleAcceptAssessment}
                  onProposeTime={openProposeTimeModal}
                  onCancelProposal={handleCancelProposal}
                  onViewAll={() => setShowScheduleModal(true)}
                />
              </div>

              {/* YOUR VENDORS — full column width at bottom; the card itself
                  uses an internal 2-column grid for vendor tiles so the width
                  is well utilized regardless of vendor count. */}
              <div className="flex-shrink-0 min-w-0">
                <TrustedVendorsCard
                  offersByIssueId={offersByIssueId}
                  vendorMap={globalVendorsMap}
                  issues={filteredIssuesByUser}
                  onVendorClick={(issue) => openIssueModal(issue, "details")}
                  currentUserId={user?.id}
                />
              </div>

              {/* NOTE: Recent Activity now lives in the header Notifications
                  dropdown; Home Health Score is the 4th summary KPI card. */}

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

