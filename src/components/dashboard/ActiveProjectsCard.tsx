import React, { useMemo, useState, useEffect } from "react";
import { Briefcase, ChevronRight, Check, Sparkles, Clock, FileText, Calendar, X, ArrowRight } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast } from "react-toastify";
import {
  IssueType,
  Listing,
  ReportType,
  IssueOffer,
  IssueOfferStatus,
  CalendarReadyAssessment,
  IssueAssessmentStatus,
  Vendor,
} from "../../types";
import { getIssueTypeIcon, normalizeAndCapitalize } from "../../utils/typeNormalizer";
import { MapPin } from "lucide-react";
import StepTracker, { TrackerStep } from "./StepTracker";
import { useUpdateOfferMutation } from "../../features/api/issueOffersApi";

type ProjectStage =
  | "awaiting-approval"
  | "quotes-received"
  | "visit-pending"
  | "visit-confirmed"
  | "in-progress"
  | "awaiting-quotes";

interface Project {
  issue: IssueType;
  listing?: Listing;
  stage: ProjectStage;
  step: TrackerStep;
  isUserBlocked: boolean;
  daysWaiting: number | null;
  isOverdue: boolean;
  pendingOfferCount: number;
  pendingOffers: IssueOffer[];
  acceptedOffer?: IssueOffer;
  quoteSpread?: { min: number; max: number };
  visitEvent?: CalendarReadyAssessment & { listing?: Listing; vendor?: Vendor };
  /** The vendor-proposed visit awaiting homeowner accept/decline. */
  pendingVisitEvent?: CalendarReadyAssessment & { listing?: Listing; vendor?: Vendor };
  vendor?: Vendor;
  sortKey: number;
}

// Stage → step in the 5-stage tracker
const STAGE_TO_STEP: Record<ProjectStage, TrackerStep> = {
  "awaiting-quotes": 1,
  "quotes-received": 2,
  "visit-pending": 2,
  "visit-confirmed": 3,
  "in-progress": 4,
  "awaiting-approval": 5,
};

// "Waiting too long" thresholds in days for user-blocked stages
const OVERDUE_THRESHOLDS: Partial<Record<ProjectStage, number>> = {
  "quotes-received": 3,
  "visit-pending": 2,
  "awaiting-approval": 5,
};

const USER_BLOCKED_STAGES = new Set<ProjectStage>([
  "awaiting-approval",
  "quotes-received",
  "visit-pending",
]);

interface ActiveProjectsCardProps {
  issues: IssueType[];
  listings: Listing[];
  reports: ReportType[];
  offersByIssueId: Record<number, IssueOffer[]>;
  calendarEvents: (CalendarReadyAssessment & { listing?: Listing; vendor?: Vendor })[];
  vendorMap: Record<number, Vendor>;
  onOpenIssue: (issue: IssueType, tab?: "details" | "offers" | "assessments") => void;
  onPostJob: () => void;
  /** Accept a vendor-proposed visit. Wired to the parent's
   *  `useUpdateAssessmentMutation` (sets status=accepted, adds to schedule). */
  onAcceptVisit: (assessment: CalendarReadyAssessment) => Promise<void> | void;
  /** Decline a vendor-proposed visit. Wired to the parent's
   *  `useDeleteAssessmentMutation`. */
  onDeclineVisit: (assessment: CalendarReadyAssessment) => Promise<void> | void;
  /** Bumped externally to force a tab switch (e.g. when summary card is clicked) */
  externalTabRequest?: { tab: "approvals" | "quotes" | "visits"; nonce: number };
}

const STAGE_ORDER: Record<ProjectStage, number> = {
  "awaiting-approval": 0,
  "quotes-received": 1,
  "visit-pending": 2,
  "visit-confirmed": 3,
  "in-progress": 4,
  "awaiting-quotes": 5,
};

const STAGE_ACCENT: Record<ProjectStage, string> = {
  "awaiting-approval": "border-l-amber-400",
  "quotes-received": "border-l-primary",
  "visit-pending": "border-l-amber-400",
  "visit-confirmed": "border-l-emerald-400",
  "in-progress": "border-l-blue-400",
  "awaiting-quotes": "border-l-muted-foreground/30",
};

const OVERDUE_ACCENT = "border-l-primary";

const STAGE_PILL: Record<ProjectStage, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  "awaiting-approval": {
    label: "Approve completed work",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Check,
  },
  "quotes-received": {
    label: "Quotes received",
    cls: "bg-primary/10 text-primary border-primary/20",
    icon: FileText,
  },
  "visit-pending": {
    label: "Visit pending",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Calendar,
  },
  "visit-confirmed": {
    label: "Visit confirmed",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: Calendar,
  },
  "in-progress": {
    label: "In progress",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Clock,
  },
  "awaiting-quotes": {
    label: "Awaiting quotes",
    cls: "bg-muted text-muted-foreground border-border",
    icon: Clock,
  },
};

const STAGE_CTA: Record<ProjectStage, { label: string; tab: "details" | "offers" | "assessments" } | null> = {
  "awaiting-approval": { label: "Approve", tab: "offers" },
  "quotes-received": { label: "Review", tab: "offers" },
  "visit-pending": { label: "Confirm", tab: "assessments" },
  "visit-confirmed": { label: "View", tab: "details" },
  "in-progress": { label: "View", tab: "details" },
  "awaiting-quotes": null,
};

const formatMoney = (n: number) => `$${n.toLocaleString()}`;

const formatRelativeTime = (ts?: string | null): string | null => {
  if (!ts) return null;
  const then = new Date(ts);
  if (Number.isNaN(then.getTime())) return null;
  const diffMs = Date.now() - then.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const ActiveProjectsCard: React.FC<ActiveProjectsCardProps> = ({
  issues,
  listings,
  reports,
  offersByIssueId,
  calendarEvents,
  vendorMap,
  onOpenIssue,
  onPostJob,
  onAcceptVisit,
  onDeclineVisit,
  externalTabRequest,
}) => {
  const [updateOffer] = useUpdateOfferMutation();
  // Per-issue id of the in-flight "decline all" action so we can disable the button.
  const [decliningIssueId, setDecliningIssueId] = useState<number | null>(null);
  // Per-assessment id for in-flight visit accept / decline so the spinner is local.
  const [pendingVisitActionId, setPendingVisitActionId] = useState<number | null>(null);

  const handleDeclineAllQuotes = async (project: Project) => {
    if (project.pendingOffers.length === 0) return;
    setDecliningIssueId(project.issue.id);
    try {
      await Promise.all(
        project.pendingOffers.map((offer) =>
          updateOffer({
            id: offer.id,
            issue_id: offer.issue_id,
            vendor_id: offer.vendor_id,
            price: offer.price,
            status: "rejected",
            user_last_viewed: new Date().toISOString(),
            comment_vendor: (offer as any).comment_vendor || "",
            comment_client: (offer as any).comment_client || "",
          }).unwrap()
        )
      );
      toast.success(
        project.pendingOffers.length === 1
          ? "Quote declined"
          : `${project.pendingOffers.length} quotes declined`
      );
    } catch (err) {
      console.error("Failed to decline quotes:", err);
      toast.error("Couldn't decline. Please try again.");
    } finally {
      setDecliningIssueId(null);
    }
  };

  const handleAcceptVisitClick = async (visit: CalendarReadyAssessment) => {
    setPendingVisitActionId(Number(visit.id));
    try {
      await onAcceptVisit(visit);
    } finally {
      setPendingVisitActionId(null);
    }
  };

  const handleDeclineVisitClick = async (visit: CalendarReadyAssessment) => {
    setPendingVisitActionId(Number(visit.id));
    try {
      await onDeclineVisit(visit);
    } finally {
      setPendingVisitActionId(null);
    }
  };
  const projects = useMemo<Project[]>(() => {
    const inFlight = issues.filter(
      (i) =>
        i.status === "Status.OPEN" ||
        i.status === "Status.IN_PROGRESS" ||
        i.status === "Status.REVIEW"
    );

    return inFlight
      .map<Project>((issue) => {
        const report = reports.find((r) => r.id === issue.report_id);
        const listing = listings.find((l) => l.id === report?.listing_id);
        const offers = offersByIssueId[issue.id] || [];
        const pendingOffers = offers.filter((o) => o.status === IssueOfferStatus.RECEIVED);
        const acceptedOffer = offers.find((o) => o.status === IssueOfferStatus.ACCEPTED);
        const issueVisits = calendarEvents.filter((e) => e.issue_id === issue.id);
        const confirmedVisit = issueVisits.find((e) => e.status === IssueAssessmentStatus.ACCEPTED);
        const pendingVisit = issueVisits.find((e) => e.status === IssueAssessmentStatus.RECEIVED);
        const vendor =
          (acceptedOffer && vendorMap[acceptedOffer.vendor_id]) ||
          (issue.vendor_id ? vendorMap[issue.vendor_id] : undefined);

        // A vendor-proposed visit awaiting the homeowner's confirm/decline is
        // actionable on its own — even before any quote exists (the common
        // marketplace flow is "propose a visit, then quote after assessing").
        const vendorPendingVisit =
          !!pendingVisit && pendingVisit.user_type === "vendor";

        let stage: ProjectStage;
        if (issue.status === "Status.REVIEW") {
          stage = "awaiting-approval";
        } else if (vendorPendingVisit) {
          stage = "visit-pending";
        } else if (pendingOffers.length > 0 && !acceptedOffer) {
          stage = "quotes-received";
        } else if (acceptedOffer && pendingVisit) {
          stage = "visit-pending";
        } else if (acceptedOffer && confirmedVisit) {
          stage = "visit-confirmed";
        } else if (acceptedOffer || issue.status === "Status.IN_PROGRESS") {
          stage = "in-progress";
        } else {
          stage = "awaiting-quotes";
        }

        let quoteSpread: Project["quoteSpread"];
        if (stage === "quotes-received" && pendingOffers.length > 0) {
          const prices = pendingOffers
            .map((o) => o.price)
            .filter((p): p is number => typeof p === "number" && p > 0);
          if (prices.length > 0) {
            quoteSpread = { min: Math.min(...prices), max: Math.max(...prices) };
          }
        }

        const visitEvent = pendingVisit || confirmedVisit;
        const isUserBlocked = USER_BLOCKED_STAGES.has(stage);

        // Days the user has been blocking — pick the most relevant timestamp per stage
        let daysWaiting: number | null = null;
        if (isUserBlocked) {
          let referenceTs: string | undefined;
          if (stage === "quotes-received") {
            // Oldest pending offer's arrival date
            const oldest = [...pendingOffers]
              .map((o) => ((o as any).created_at as string) || "")
              .filter(Boolean)
              .sort()[0];
            referenceTs = oldest;
          } else if (stage === "visit-pending" && pendingVisit) {
            referenceTs = (pendingVisit as any).created_at;
          } else if (stage === "awaiting-approval") {
            referenceTs = issue.updated_at || issue.created_at;
          }
          if (referenceTs) {
            const ms = Date.now() - new Date(referenceTs).getTime();
            if (!Number.isNaN(ms) && ms > 0) {
              daysWaiting = Math.floor(ms / (1000 * 60 * 60 * 24));
            }
          }
        }

        const threshold = OVERDUE_THRESHOLDS[stage];
        const isOverdue = !!(threshold && daysWaiting !== null && daysWaiting >= threshold);

        const sortKey = STAGE_ORDER[stage] * 1e12 - new Date(issue.updated_at || issue.created_at || 0).getTime();

        return {
          issue,
          listing,
          stage,
          step: STAGE_TO_STEP[stage],
          isUserBlocked,
          daysWaiting,
          isOverdue,
          pendingOfferCount: pendingOffers.length,
          pendingOffers,
          acceptedOffer,
          quoteSpread,
          visitEvent,
          pendingVisitEvent: pendingVisit
            ? (pendingVisit as CalendarReadyAssessment & { listing?: Listing; vendor?: Vendor })
            : undefined,
          vendor,
          sortKey,
        };
      })
      .sort((a, b) => {
        // Overdue items bubble to the top
        if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
        return a.sortKey - b.sortKey;
      });
  }, [issues, listings, reports, offersByIssueId, calendarEvents, vendorMap]);

  type Tab = "approvals" | "quotes" | "visits";

  const approvalsCount = useMemo(
    () => projects.filter((p) => p.stage === "awaiting-approval").length,
    [projects]
  );
  const quotesCount = useMemo(
    () => projects.filter((p) => p.stage === "quotes-received").length,
    [projects]
  );
  // Visits tab only surfaces VENDOR-PROPOSED visits (the homeowner needs to
  // accept or decline). User-proposed pending visits stay on the schedule
  // card where they can be cancelled.
  const visitsCount = useMemo(
    () =>
      projects.filter(
        (p) =>
          p.stage === "visit-pending" &&
          p.pendingVisitEvent?.user_type === "vendor"
      ).length,
    [projects]
  );

  // Default tab — show the first tab with actionable content. If everything
  // is empty, default to Approvals (we render a contextual empty state there).
  const initialTab: Tab =
    approvalsCount > 0
      ? "approvals"
      : quotesCount > 0
      ? "quotes"
      : visitsCount > 0
      ? "visits"
      : "approvals";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [showAllModal, setShowAllModal] = useState(false);

  // Respond to external tab requests (e.g. summary card clicks)
  useEffect(() => {
    if (externalTabRequest) {
      setActiveTab(externalTabRequest.tab);
    }
  }, [externalTabRequest]);

  const filteredProjects = useMemo(() => {
    if (activeTab === "approvals") return projects.filter((p) => p.stage === "awaiting-approval");
    if (activeTab === "visits") {
      return projects.filter(
        (p) =>
          p.stage === "visit-pending" &&
          p.pendingVisitEvent?.user_type === "vendor"
      );
    }
    return projects.filter((p) => p.stage === "quotes-received");
  }, [projects, activeTab]);

  const visibleProjects = filteredProjects.slice(0, 5);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!showAllModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [showAllModal]);

  // Close modal on Escape
  useEffect(() => {
    if (!showAllModal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowAllModal(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAllModal]);

  // Single source of truth for a project row — used in the card list and the View-all modal
  const renderProjectRow = (p: Project, opts?: { hideTracker?: boolean }) => {
    const pill = STAGE_PILL[p.stage];
    const PillIcon = pill.icon;
    const cta = STAGE_CTA[p.stage];
    const title = p.issue.summary || `${normalizeAndCapitalize(p.issue.type)} Issue`;
    const addressShort = p.listing?.address?.split(",")[0] || "Property";

    let contextLine: React.ReactNode = null;
    if (p.stage === "quotes-received" && p.quoteSpread) {
      contextLine = (
        <span>
          <span className="font-semibold tabular-nums text-foreground">
            {p.pendingOfferCount} quote{p.pendingOfferCount !== 1 ? "s" : ""}
          </span>
          <span className="text-muted-foreground/60"> · </span>
          <span className="font-semibold tabular-nums text-foreground">
            {p.quoteSpread.min === p.quoteSpread.max
              ? formatMoney(p.quoteSpread.min)
              : `${formatMoney(p.quoteSpread.min)}–${formatMoney(p.quoteSpread.max)}`}
          </span>
        </span>
      );
    } else if ((p.stage === "visit-pending" || p.stage === "visit-confirmed") && p.visitEvent) {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isToday = p.visitEvent.start.toDateString() === today.toDateString();
      const isTomorrow = p.visitEvent.start.toDateString() === tomorrow.toDateString();
      const dateLabel = isToday
        ? "Today"
        : isTomorrow
        ? "Tomorrow"
        : p.visitEvent.start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      const timeLabel = p.visitEvent.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      contextLine = (
        <span>
          <span className="font-semibold text-foreground">{dateLabel}</span>
          <span className="text-muted-foreground"> at {timeLabel}</span>
          {p.vendor && (
            <>
              <span className="text-muted-foreground/60"> · </span>
              <span>{p.vendor.company_name || p.vendor.name}</span>
            </>
          )}
        </span>
      );
    } else if (p.stage === "in-progress" && p.vendor) {
      contextLine = (
        <span>
          <span className="text-muted-foreground">Working with </span>
          <span className="font-semibold text-foreground">
            {p.vendor.company_name || p.vendor.name}
          </span>
        </span>
      );
    } else if (p.stage === "awaiting-approval" && p.vendor) {
      contextLine = (
        <span>
          <span className="font-semibold text-foreground">
            {p.vendor.company_name || p.vendor.name}
          </span>
          <span className="text-muted-foreground"> marked this complete</span>
        </span>
      );
    } else if (p.stage === "awaiting-quotes") {
      const postedAgo = formatRelativeTime(p.issue.created_at);
      contextLine = (
        <span className="text-muted-foreground">
          Vendors are reviewing your job
          {postedAgo && (
            <>
              <span className="text-muted-foreground/50"> · </span>
              <span>Posted {postedAgo}</span>
            </>
          )}
        </span>
      );
    }

    const accent = p.isOverdue ? OVERDUE_ACCENT : STAGE_ACCENT[p.stage];
    const trackerLabelOverride =
      p.stage === "awaiting-approval" ? "Pending approval" : undefined;

    return (
      <div
        key={p.issue.id}
        className={`group relative flex items-start gap-3 p-3 rounded-xl
                    border-l-[3px] ${accent}
                    hover:bg-muted/40 transition-colors cursor-pointer`}
        onClick={() => onOpenIssue(p.issue, cta?.tab || "details")}
      >
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
          <FontAwesomeIcon
            icon={getIssueTypeIcon(p.issue.type)}
            className="text-muted-foreground group-hover:text-primary transition-colors"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {p.isUserBlocked && (
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      p.isOverdue
                        ? "bg-primary/10 text-primary"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        p.isOverdue ? "bg-primary" : "bg-amber-500"
                      } animate-pulse`}
                    />
                    Needs you
                  </span>
                )}
                <div className="font-semibold text-foreground text-sm truncate">{title}</div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{addressShort}</span>
                {p.daysWaiting !== null && p.daysWaiting > 0 && (
                  <>
                    <span className="text-muted-foreground/50">·</span>
                    <span className={p.isOverdue ? "font-semibold text-primary" : ""}>
                      {p.daysWaiting} day{p.daysWaiting !== 1 ? "s" : ""} waiting
                    </span>
                  </>
                )}
              </div>
            </div>
            <span
              className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wide ${pill.cls}`}
            >
              <PillIcon className="w-2.5 h-2.5" />
              {pill.label}
            </span>
          </div>

          {contextLine && <div className="text-xs mt-1.5">{contextLine}</div>}

          {!opts?.hideTracker && (
            <StepTracker
              currentStep={p.step}
              overdue={p.isOverdue}
              labelOverride={trackerLabelOverride}
              className="mt-2.5"
            />
          )}
        </div>

        {/* QUOTES — inline Accept + Decline.
            Accept opens the offers tab so the user can pick a vendor + pay.
            Decline rejects every pending quote on the project in one tap. */}
        {p.stage === "quotes-received" ? (
          <div className="self-center flex-shrink-0 flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenIssue(p.issue, "offers");
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gold text-white transition-colors hover:bg-foreground hover:text-background"
            >
              <Check className="w-3 h-3" />
              Accept
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeclineAllQuotes(p);
              }}
              disabled={decliningIssueId === p.issue.id}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-card border border-border text-foreground transition-colors hover:bg-muted/60 disabled:opacity-50"
            >
              <X className="w-3 h-3" />
              {decliningIssueId === p.issue.id ? "Declining…" : "Decline"}
            </button>
          </div>
        ) : p.stage === "visit-pending" && p.pendingVisitEvent ? (
          // VISITS — inline Accept + Decline.
          // Accept sets the assessment to ACCEPTED (it now appears on the schedule).
          // Decline deletes the proposed slot.
          <div className="self-center flex-shrink-0 flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (p.pendingVisitEvent) handleAcceptVisitClick(p.pendingVisitEvent);
              }}
              disabled={pendingVisitActionId === Number(p.pendingVisitEvent.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gold text-white transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
            >
              <Check className="w-3 h-3" />
              {pendingVisitActionId === Number(p.pendingVisitEvent.id) ? "…" : "Accept"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (p.pendingVisitEvent) handleDeclineVisitClick(p.pendingVisitEvent);
              }}
              disabled={pendingVisitActionId === Number(p.pendingVisitEvent.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-card border border-border text-foreground transition-colors hover:bg-muted/60 disabled:opacity-50"
            >
              <X className="w-3 h-3" />
              Decline
            </button>
          </div>
        ) : cta ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenIssue(p.issue, cta.tab);
            }}
            className="self-center flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gold text-white transition-colors hover:bg-foreground hover:text-background"
          >
            {cta.label}
            <ChevronRight className="w-3 h-3" />
          </button>
        ) : null}
      </div>
    );
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "approvals", label: "Approvals", count: approvalsCount },
    { id: "quotes", label: "Quotes", count: quotesCount },
    { id: "visits", label: "Visits", count: visitsCount },
  ];

  const renderTabStrip = () => (
    <div className="px-6 pt-3 border-b border-border/60 xl:flex-shrink-0">
      <div className="flex items-center gap-6">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`relative -mb-px py-2.5 inline-flex items-center gap-1.5 text-sm transition-colors
                ${isActive
                  ? "font-bold text-foreground"
                  : "font-semibold text-muted-foreground hover:text-foreground"
                }`}
            >
              <span>{t.label}</span>
              {t.count > 0 && (
                <span className={`tabular-nums text-xs ${isActive ? "text-foreground" : "text-muted-foreground/70"}`}>
                  {t.count}
                </span>
              )}
              {isActive && (
                <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    // At xl, the parent wrapper absolute-fills this card so it must stretch and
    // its body must scroll within the locked height (see ClientDashboard wiring).
    <div className="bg-card rounded-2xl border border-border/60 shadow-card overflow-hidden xl:h-full xl:flex xl:flex-col">
      <div className="px-6 py-4 flex items-center justify-between gap-3 xl:flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground tracking-tight">Active Projects</h2>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              {projects.length > 0
                ? `${projects.length} in flight`
                : "Nothing in flight"}
            </p>
          </div>
        </div>
        {projects.length > 0 && (
          <button
            onClick={() => setShowAllModal(true)}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            View all
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {projects.length > 0 && renderTabStrip()}

      <div className="p-3 xl:flex-1 xl:overflow-y-auto xl:min-h-0">
        {projects.length === 0 ? (
          <div className="text-center py-10 px-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">All caught up</h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
              You don't have any projects in flight. Want to get ahead on something around the house?
            </p>
            <button
              onClick={onPostJob}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                         bg-gold text-white font-semibold text-sm
                         hover:bg-foreground hover:text-background transition-colors"
            >
              Post a job
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-8 px-6">
            <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-3">
              <Check className="w-5 h-5 text-muted-foreground/70" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {activeTab === "approvals"
                ? "No approvals waiting"
                : activeTab === "visits"
                ? "No visit requests"
                : "No quotes to compare"}
            </h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
              {activeTab === "approvals"
                ? "Nothing waiting on your sign-off right now."
                : activeTab === "visits"
                ? "Vendors haven't proposed any visit times to confirm."
                : "No new quotes to review. Check back later."}
            </p>
            <button
              onClick={() => setShowAllModal(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80"
            >
              See all {projects.length} project{projects.length !== 1 ? "s" : ""}
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              {visibleProjects.map((p) => renderProjectRow(p))}
            </div>
            {filteredProjects.length > 5 && (
              <button
                onClick={() => setShowAllModal(true)}
                className="w-full mt-2 px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors inline-flex items-center justify-center gap-1"
              >
                View {filteredProjects.length - 5} more
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </>
        )}
      </div>

      {/* VIEW ALL MODAL — every in-flight project, no cap */}
      {showAllModal && (
        <div
          className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowAllModal(false)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[85vh] bg-card rounded-2xl shadow-2xl border border-border/60 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground tracking-tight">All Active Projects</h2>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    {projects.length} in flight
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAllModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-1">
                {projects.map((p) => renderProjectRow(p))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveProjectsCard;
