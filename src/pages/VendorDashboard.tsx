import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faRocket,
  faSearch,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { User, IssueOfferStatus, IssueType, Listing, IssueAssessment } from "../types";
import { useGetPaginatedIssuesQuery } from "../features/api/issuesApi";
import { useIssuesByIds } from "../hooks/useIssuesByIds";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";
import { useGetOffersByVendorIdQuery, getOffersByIssueId } from "../features/api/issueOffersApi";
import { useGetListingsQuery } from "../features/api/listingsApi";
import {
  useGetAssessmentsByUserIdQuery,
  useLazyGetAssessmentsByUsersInteractionIdQuery,
  useUpdateAssessmentMutation,
  useDeleteAssessmentMutation,
} from "../features/api/issueAssessmentsApi";
import { store } from "../store/store";
import CardSectionHeader from "../components/dashboard/CardSectionHeader";
import PropertyThumbnail from "../components/dashboard/PropertyThumbnail";
import { useGetVendorReviewsByVendorUserIdQuery } from "../features/api/vendorReviewsApi";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";
import { parseAsUTC } from "../utils/calendarUtils";
import { getRelativeTime } from "../utils/dateUtils";
import HomeownerIssueCard from "../components/HomeownerIssueCard";
import { MapPin, Zap } from "lucide-react";
import HeroBand from "../components/dashboard/HeroBand";
import VendorActiveJobsCard from "../components/dashboard/VendorActiveJobsCard";
import VendorSummaryCards from "../components/dashboard/VendorSummaryCards";
import VendorEarningsCard from "../components/dashboard/VendorEarningsCard";
import ScheduleCard, { ScheduleEvent } from "../components/dashboard/ScheduleCard";

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
  const [selectedTab, setSelectedTab] = useState<"details" | "offers" | "assessments" | "dispute">("details");

  // Real data queries (poll every 20s so vendor sees updates when client accepts/rejects offers, approves work, etc.)
  const { data: vendor, isLoading: isVendorLoading, error: vendorError } = useGetVendorByVendorUserIdQuery(String(user.id));
  const { data: vendorOffers = [] } = useGetOffersByVendorIdQuery(Number(user.id), { skip: !user.id, pollingInterval: 20000 });

  // Per-issue fetch for the vendor's own offer issues (active jobs, schedule, metrics)
  const { data: offerIssues = [], refetch: refetchOfferIssues } = useIssuesByIds(vendorOffers.length > 0 ? vendorOffers.map((o) => o.issue_id) : undefined);

  // When offers refresh (polling detects a status change), refresh the issue data too
  const vendorOffersKey = vendorOffers.map((o) => `${o.id}:${o.status}`).join(",");
  useEffect(() => {
    if (vendorOffers.length > 0) refetchOfferIssues();
  }, [vendorOffersKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // vendor_types is a comma-separated string of backend type names e.g. "electrician"
  const vendorPrimaryType = vendor?.vendor_types?.toLowerCase().split(",")[0]?.trim() ?? "";

  // Targeted opportunity query: vendor's specialty + city, backend-filtered (replaces the
  // old fetch-all-issues-then-filter-client-side approach).
  const { data: opportunityData, isLoading: isLoadingOpportunities } = useGetPaginatedIssuesQuery(
    vendor ? { page: 1, size: 20, type: vendorPrimaryType, city: vendor.city || "", vendor_assigned: false } : skipToken
  );
  // Fallback: if specialty+city returns nothing, retry specialty-only (any city).
  const needsOpportunityFallback = !isLoadingOpportunities && (opportunityData?.total ?? 0) === 0 && !!vendor?.city;
  const { data: fallbackOpportunityData } = useGetPaginatedIssuesQuery(
    needsOpportunityFallback ? { page: 1, size: 20, type: vendorPrimaryType, city: "", vendor_assigned: false } : skipToken
  );
  const activeOpportunityData = (needsOpportunityFallback && (fallbackOpportunityData?.total ?? 0) > 0)
    ? fallbackOpportunityData : opportunityData;

  const { data: listings = [] } = useGetListingsQuery();
  const { data: vendorReviewsData = [] } = useGetVendorReviewsByVendorUserIdQuery(Number(user.id), { skip: !user.id });

  // Vendor assessments - use user.id since that's what's stored in the assessment records
  const { data: vendorAssessments = [], refetch: refetchVendorAssessments } =
    useGetAssessmentsByUserIdQuery(user.id, { skip: !user?.id });
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

  // Force-refetch every assessment list the dashboard depends on. Used by
  // child cards after an accept/decline mutation so the UI updates without
  // waiting for the next poll. Both the per-user list and the per-interaction
  // fan-out need a kick — RTK Query won't re-run the lazy fan-out on its own.
  const refetchAllAssessments = async () => {
    try {
      await refetchVendorAssessments();
      await Promise.all(
        uniqueInteractionIds.map((id) =>
          fetchAssessmentsByInteraction(id, true).unwrap()
        )
      );
    } catch (err) {
      console.error("Failed to refetch assessments:", err);
    }
  };

  // ── Assessment mutations (used by ScheduleCard inline actions) ────────────
  const [updateAssessment, { isLoading: isUpdatingAssessment }] = useUpdateAssessmentMutation();
  const [deleteAssessment, { isLoading: isDeletingAssessment }] = useDeleteAssessmentMutation();

  /** Accept a client-proposed visit (counter-proposal) — flips status to ACCEPTED.
   *  Mirrors the homeowner's handleAcceptAssessment but from the vendor's seat,
   *  so the visit moves out of "needs action" and onto the confirmed schedule. */
  const handleAcceptScheduleEvent = async (event: ScheduleEvent) => {
    try {
      await updateAssessment({
        id: event.id,
        issue_id: event.issue_id,
        user_id: event.user_id,
        user_type: event.user_type,
        interaction_id: event.users_interaction_id,
        users_interaction_id: event.users_interaction_id,
        start_time: event.start_time,
        end_time: event.end_time,
        status: "accepted",
        min_assessment_time: event.min_assessment_time,
        user_last_viewed: new Date().toISOString(),
      }).unwrap();
      toast.success("Visit accepted");
      await refetchAllAssessments();
    } catch (err) {
      console.error("Failed to accept assessment:", err);
      toast.error("Failed to accept the visit. Please try again.");
    }
  };

  /** Cancel the vendor's own pending proposal — deletes the assessment. */
  const handleCancelScheduleProposal = async (event: ScheduleEvent) => {
    try {
      await deleteAssessment({
        id: Number(event.id),
        issue_id: event.issue_id,
        interaction_id: event.users_interaction_id,
      }).unwrap();
      toast.success("Proposal cancelled");
      await refetchAllAssessments();
    } catch (err) {
      console.error("Failed to cancel proposal:", err);
      toast.error("Failed to cancel proposal. Please try again.");
    }
  };

  /** "Propose new time" from the ScheduleCard — defer to the issue modal's
   *  Assessments tab where the vendor's full propose-time UX lives. Building
   *  a separate inline propose-time modal here would duplicate that flow. */
  const handleProposeScheduleTime = (event: ScheduleEvent) => {
    openIssueModal(event.issue_id, "assessments");
  };

  // Listings map for lookups
  const listingsMap = useMemo(() => {
    return listings.reduce((acc, listing) => {
      acc[listing.id] = listing;
      return acc;
    }, {} as Record<number, Listing>);
  }, [listings]);

  // Issues map: vendor's own job issues + current opportunity items (covers modal,
  // metrics, schedule, and the opportunities list off a single targeted dataset).
  const issuesMap = useMemo(() => {
    const map: Record<number, IssueType> = {};
    offerIssues.forEach((i) => { map[i.id] = i; });
    (activeOpportunityData?.items ?? []).forEach((i: IssueType) => { if (!map[i.id]) map[i.id] = i; });
    return map;
  }, [offerIssues, activeOpportunityData?.items]);

  // Selected issue data for modal (derived from existing data)
  const selectedIssue = selectedIssueId ? issuesMap[selectedIssueId] : null;
  const selectedIssueListing = selectedIssue ? listingsMap[selectedIssue.listing_id] : undefined;

  // Open issue modal
  const openIssueModal = (
    issueId: number,
    defaultTab: "details" | "offers" | "assessments" | "dispute" = "details"
  ) => {
    setSelectedIssueId(issueId);
    setSelectedTab(defaultTab);
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
      /** Photos uploaded with the issue itself — preferred over the
       *  listing's stock photo so the vendor previews the actual problem. */
      image_urls?: string[];
    }>
  >([]);


  // Build opportunity jobs from the backend-filtered query results. The backend already
  // scopes to the vendor's specialty + city (with a specialty-only fallback above), so we
  // only sort + slice here rather than filtering the whole platform client-side.
  useEffect(() => {
    const available = (activeOpportunityData?.items ?? []).filter(
      (i: IssueType) => i.status === "Status.OPEN" && !i.vendor_id && i.active
    );

    // Sort newest-first so the dashboard surfaces the freshest opportunities.
    // Severity (high → medium → low) is only a tiebreaker for same-instant posts.
    const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const sortedByRecency = [...available].sort((a, b) => {
      const at = new Date(a.created_at || 0).getTime();
      const bt = new Date(b.created_at || 0).getTime();
      if (bt !== at) return bt - at;
      return (severityOrder[a.severity] ?? 2) - (severityOrder[b.severity] ?? 2);
    });

    // Show jobs immediately without waiting for bid counts
    const top20 = sortedByRecency.slice(0, 20);
    setMarketplaceJobs(
      top20.map((issue) => ({
        id: issue.id,
        type: issue.type || "General",
        summary: issue.summary || "View details",
        severity: issue.severity,
        bidCount: 0,
        listing: listingsMap[issue.listing_id],
        isHot: issue.severity === "high",
        created_at: issue.created_at,
        image_urls: issue.image_urls,
      }))
    );

    // Fetch bid counts in background (non-blocking, progressive)
    top20.forEach((issue) => {
      store.dispatch(getOffersByIssueId.initiate(issue.id, { forceRefetch: false }))
        .then((result) => {
          const bidCount = result.data?.length || 0;
          setMarketplaceJobs((prev) => {
            const updated = [...prev];
            const jobIdx = updated.findIndex((j) => j.id === issue.id);
            if (jobIdx !== -1) {
              updated[jobIdx] = { ...updated[jobIdx], bidCount, isHot: issue.severity === "high" || bidCount === 0 };
            }
            return updated;
          });
        })
        .catch(() => { });
    });
  }, [activeOpportunityData?.items, listingsMap]);

  // Count available opportunities from the backend-filtered query
  const availableCount = activeOpportunityData?.total ?? 0;

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
        // Expose the full assessment group so the Active Jobs card can target
        // the specific client-proposed assessment for accept / decline.
        allAssessments: assessments,
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
      allAssessments: IssueAssessment[];
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

  // Upcoming CONFIRMED visits for ScheduleCard.  Your Schedule is purely a
  // calendar of "when am I where?" — pending / counter-proposed assessments
  // belong in Active Jobs → Visits where the vendor can act on them.  Status
  // string can arrive as the enum value ("Assessment_Status.ACCEPTED") or
  // lowercase ("accepted"), so we normalize before matching.
  const scheduleEvents = useMemo<ScheduleEvent[]>(() => {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    const isAccepted = (status: unknown): boolean => {
      const s = (status as string)?.toLowerCase() || "";
      return s === "accepted" || s.includes("accepted");
    };
    return allAssessments
      .filter((a) => isAccepted(a.status))
      .map((a) => {
        const start = parseAsUTC(a.start_time);
        const end = parseAsUTC(a.end_time);
        const issue = issuesMap[a.issue_id];
        const listing = issue ? listingsMap[issue.listing_id] : undefined;
        return {
          ...a,
          id: a.id,
          title: issue?.summary || `${normalizeAndCapitalize(issue?.type || "")} Visit`,
          start,
          end,
          issue,
          listing,
        } as ScheduleEvent;
      })
      .filter((e) => e.start >= cutoff)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [allAssessments, issuesMap, listingsMap]);

  // First name for the hero greeting
  const firstName = vendor?.name?.split(/\s+/)[0] || "";
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // Forward-looking summary for the hero — what's on the vendor's plate.
  const heroSummary = useMemo(() => {
    const actionRequiredVisits = processedVisits.filter(v => v.category === "action_required").length;
    const todaysVisits = todaysSchedule.length;
    const pendingBids = vendorMetrics.pendingBids;
    const newOpportunities = marketplaceJobs.filter(j => !alreadyBidOnIds.has(j.id)).length;

    const parts: string[] = [];
    if (actionRequiredVisits > 0) {
      parts.push(`${actionRequiredVisits} visit${actionRequiredVisits === 1 ? "" : "s"} need${actionRequiredVisits === 1 ? "s" : ""} your reply`);
    }
    if (todaysVisits > 0) {
      parts.push(`${todaysVisits} visit${todaysVisits === 1 ? "" : "s"} today`);
    }
    if (pendingBids > 0) {
      parts.push(`${pendingBids} quote${pendingBids === 1 ? "" : "s"} awaiting client`);
    }
    if (parts.length === 0 && newOpportunities > 0) {
      parts.push(`${newOpportunities} new job${newOpportunities === 1 ? "" : "s"} matching your service`);
    }

    if (parts.length === 0) {
      if (vendorMetrics.activeJobs > 0) {
        return `${vendorMetrics.activeJobs} project${vendorMetrics.activeJobs === 1 ? "" : "s"} in progress — keep up the great work.`;
      }
      return "Your plate is clear. Browse new jobs to keep the pipeline flowing.";
    }

    // Cap to first two items so the headline stays scannable.
    return parts.slice(0, 2).join(" · ") + ".";
  }, [processedVisits, todaysSchedule, vendorMetrics, marketplaceJobs, alreadyBidOnIds]);

  const isHeroQuiet = useMemo(() => {
    const actionRequired = processedVisits.filter(v => v.category === "action_required").length;
    return (
      actionRequired === 0 &&
      todaysSchedule.length === 0 &&
      vendorMetrics.pendingBids === 0
    );
  }, [processedVisits, todaysSchedule, vendorMetrics]);

  // Browse Jobs CTA with gold halo + sweep animation (mirrors the homeowner's Create CTA).
  const heroCta = (
    <div className="relative inline-flex">
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-[6px] rounded-2xl bg-primary/40 blur-md animate-cta-halo"
      />
      <Link
        to={marketplaceLink}
        className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                   bg-primary text-primary-foreground font-bold text-sm
                   shadow-md hover:shadow-lg hover:opacity-95 transition-all
                   overflow-hidden"
      >
        {/* Sweep span — 1/3 the button width, swept left→right by keyframes. */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 -left-1/3 h-full w-1/3
                     bg-gradient-to-r from-transparent via-white/40 to-transparent
                     animate-cta-sweep"
        />
        <FontAwesomeIcon icon={faSearch} className="text-xs relative z-10" />
        <span className="relative z-10">Browse Jobs</span>
      </Link>
    </div>
  );

  // Loading/Error states - AFTER all hooks
  if (vendorError) return <p>Error loading dashboard data</p>;
  if (isVendorLoading) {
    return (
      <div className="min-h-screen w-full bg-dashboard p-6">
        <div className="w-full max-w-[1800px] mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-24 bg-card/60 rounded-2xl w-full shadow-card"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-card/60 rounded-2xl shadow-card"></div>
              ))}
            </div>
            <div className="h-96 bg-card/60 rounded-2xl shadow-card"></div>
          </div>
        </div>
      </div>
    );
  }
  if (vendorError) return <p>Failed to load vendor data.</p>;
  if (!vendor) return <p>Vendor not found.</p>;

  return (
    <div className="min-h-screen w-full bg-dashboard">
      <div className="w-full max-w-[1800px] mx-auto px-4 py-5 lg:px-8 lg:py-6">

        {/* HERO BAND — greeting + actionable summary + animated Browse Jobs CTA */}
        <HeroBand
          greeting={greeting}
          firstName={firstName}
          summary={heroSummary}
          cta={heroCta}
          isQuiet={isHeroQuiet}
        />

        {/* New Vendor Welcome Banner */}
        {isNewVendor && showWelcomeBanner && (
          <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-gold to-gold-400 relative shadow-hero">
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

        {/* MAIN GRID — 7/5 split.  items-stretch lets the right column
            match the left column's height; the schedule card uses flex-1 to
            absorb whatever remains so the bottom of both columns line up. */}
        <div className="grid grid-cols-12 gap-5 w-full min-w-0 items-stretch">

          {/* LEFT COLUMN — Active Jobs (+ KPI sidebar) + Job Opportunities */}
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-5 min-w-0">

            {/* TOP ROW — Active Jobs (dominant) + Vendor KPI stack
                xl: side-by-side (Jobs 2/3, KPIs 1/3 stacked vertically)
                below xl: Jobs on top full-width, KPIs 4-up below
                Height pinning at xl: the Jobs wrapper uses absolute-fill so
                its natural height is 0 — the row sizes off the KPI stack and
                Jobs' body scrolls within the locked height. */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 xl:gap-4 items-stretch">
              {/* ACTIVE JOBS — tabbed (Awaiting Client / Visits / In Progress / Submitted)
                  with per-row step tracker, "Needs you" badges, overdue surfacing,
                  and inline Accept / Decline / Withdraw actions. */}
              <div
                id="active-jobs"
                className="xl:col-span-2 min-w-0 scroll-mt-6 xl:relative xl:overflow-hidden"
              >
                <div className="xl:absolute xl:inset-0 xl:flex xl:flex-col">
                  <VendorActiveJobsCard
                    vendorOffers={vendorOffers}
                    issuesMap={issuesMap}
                    listingsMap={listingsMap}
                    processedVisits={processedVisits}
                    onOpenIssue={openIssueModal}
                    onBrowseJobs={() => navigate(marketplaceLink)}
                    refetchAssessments={refetchAllAssessments}
                  />
                </div>
              </div>

              {/* VENDOR KPI SIDEBAR — 4 compact tiles (Active Jobs / Quotes Out /
                  This Month / Avg Rating).  At xl they stack vertically and the
                  natural stack height drives the row; below xl they wrap into a
                  4-up strip underneath the jobs card. */}
              <div className="xl:col-span-1 min-w-0">
                <VendorSummaryCards
                  activeJobsTotal={vendorMetrics.activeJobs}
                  activeJobsThisWeek={activeProjectsThisWeek}
                  quotesOutTotal={vendorMetrics.pendingBids}
                  quotesOutAmount={vendorMetrics.outstandingBids}
                  thisMonthEarnings={vendorMetrics.thisMonthEarnings}
                  lastMonthEarnings={earningsBreakdown.lastMonth}
                  avgRating={reviewStats.rating}
                  reviewCount={reviewStats.count}
                  onClickActiveJobs={() => {
                    document
                      .getElementById("active-jobs")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  onClickQuotesOut={() => navigate("/vendor/bids?status=pending")}
                  onClickEarnings={() => navigate("/vendor/earnings")}
                  onClickRating={() => navigate("/vendor/reviews")}
                />
              </div>
            </div>

            {/* JOB OPPORTUNITIES */}
            <div className="bg-card rounded-2xl overflow-hidden shadow-card border border-border/60">
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
                        {/* Thumbnail — prefer the issue's own photo when one
                            exists (gives the vendor a real preview of the
                            problem); fall back to the property/listing image
                            otherwise. `ImageComponent` resolves arrays and
                            JSON-encoded string arrays out of the box. */}
                        <PropertyThumbnail
                          imageUrl={
                            item.image_urls && item.image_urls.length > 0
                              ? item.image_urls
                              : item.listing?.image_url
                          }
                          size="md"
                        />

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

                        {/* Right side — clicking bid/be-first goes straight to offers tab */}
                        <button
                          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs w-24 ${
                            item.bidCount === 0 ? "btn-gold" : "btn-dark"
                          }`}
                          onClick={(e) => { e.stopPropagation(); openIssueModal(item.id, "offers"); }}
                        >
                          {item.bidCount === 0 ? "Be first!" : "Quote"}
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

          </div> {/* End LEFT COLUMN */}

          {/* RIGHT COLUMN — Earnings (fixed) + Today's Schedule (flex-1 to fill).
              `lg:h-full flex flex-col` lets the column stretch to match the left
              side; the schedule card absorbs leftover space, so the bottom of
              the right column lines up with the bottom of the left. */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-5 min-w-0 lg:h-full">

            {/* EARNINGS — area chart with This Year / Last 12 Months toggle,
                total earned, pending pipeline summary, and top earning categories.
                Mirrors the homeowner's Spending Overview shape so the two dashboards
                feel like the same product. */}
            <div className="flex-shrink-0">
              <VendorEarningsCard
                vendorOffers={vendorOffers}
                issuesMap={issuesMap}
                paymentsHref="/vendor/earnings"
              />
            </div>

            {/* SCHEDULE — list / calendar toggle, mirrors the homeowner's
                "Your Schedule".  Wraps in `lg:flex-1 lg:min-h-0` so the
                column's bottom lines up with the left side regardless of which
                view (list vs. calendar) is active — the card stretches to
                absorb whatever height remains. */}
            <div className="lg:flex-1 lg:min-h-0 min-h-0">
              <ScheduleCard
                events={scheduleEvents}
                currentUserId={user.id}
                isUpdatingAssessment={isUpdatingAssessment}
                isDeletingAssessment={isDeletingAssessment}
                onAccept={handleAcceptScheduleEvent}
                onProposeTime={handleProposeScheduleTime}
                onCancelProposal={handleCancelScheduleProposal}
                onViewAll={() => navigate("/vendor/schedule")}
              />
            </div>

          </div> {/* End RIGHT COLUMN */}

        </div>

      </div>

      {/* Issue Details Modal */}
      {selectedIssueId && selectedIssue && (
        <div
          className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center"
          onClick={closeIssueModal}
        >
          <div
            className="relative w-[45vw] max-w-2xl min-w-[340px] h-[85vh] overflow-hidden rounded-2xl shadow-card-hover bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <HomeownerIssueCard
              key={selectedIssueId}
              issue={selectedIssue}
              listing={selectedIssueListing}
              onClose={closeIssueModal}
              defaultTab={selectedTab}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
