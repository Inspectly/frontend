import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  ChevronRight,
  Check,
  Sparkles,
  Clock,
  FileText,
  Calendar,
  X,
  ArrowRight,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast } from "react-toastify";
import { MapPin } from "lucide-react";
import {
  IssueType,
  Listing,
  IssueOffer,
  IssueOfferStatus,
  IssueAssessment,
} from "../../types";
import { getIssueTypeIcon, normalizeAndCapitalize } from "../../utils/typeNormalizer";
import StepTracker, { TrackerStep } from "./StepTracker";
import { useUpdateOfferMutation } from "../../features/api/issueOffersApi";
import {
  useUpdateAssessmentMutation,
  useDeleteAssessmentMutation,
} from "../../features/api/issueAssessmentsApi";

// ──────────────────────────────────────────────────────────────────────────
// Vendor job state machine
// Mirrors the homeowner's ActiveProjectsCard but flipped to the vendor's
// perspective. The same backend records produce different stages depending
// on whose action is gating the next step.
// ──────────────────────────────────────────────────────────────────────────
type JobStage =
  | "awaiting-client"        // offer status=RECEIVED, client hasn't responded
  | "visit-needed"           // offer accepted, no assessment proposed yet
  | "visit-action-required"  // client counter-proposed, vendor must respond
  | "visit-proposed"         // vendor proposed, awaiting client accept
  | "visit-confirmed"        // accepted assessment, visit upcoming
  | "in-progress"            // issue.status=IN_PROGRESS
  | "submitted";             // issue.status=REVIEW

// Active Jobs is intentionally scoped to "what needs the vendor's time today":
//   - in-progress: vendor is actively working on the issue
//   - visit-action-required: client counter-proposed a visit time and the
//     vendor must accept / decline
// Everything else (awaiting-client quotes, vendor-proposed visits, confirmed
// visits, submitted work) lives elsewhere (KPI tiles, the schedule calendar,
// the dedicated bids/jobs pages) so the dashboard stays a focused do-list.
const VISIBLE_STAGES: ReadonlySet<JobStage> = new Set<JobStage>([
  "in-progress",
  "visit-action-required",
]);

// Two-tab partition for the visible jobs.
//   - "active":  vendor is hands-on right now → in-progress rows
//   - "visits":  homeowner is waiting on a visit-time confirmation → visit-action-required rows
type Tab = "active" | "visits";

// Stage → step in the 5-step tracker (Quote → Accepted → Scheduled → Working → Done)
const STAGE_TO_STEP: Record<JobStage, TrackerStep> = {
  "awaiting-client": 1,
  "visit-needed": 2,
  "visit-action-required": 2,
  "visit-proposed": 2,
  "visit-confirmed": 3,
  "in-progress": 4,
  submitted: 5,
};

// Per-stage tracker label override (vendor-perspective wording).
const STAGE_TRACKER_LABEL: Record<JobStage, string> = {
  "awaiting-client": "Quote sent",
  "visit-needed": "Schedule visit",
  "visit-action-required": "Visit reply needed",
  "visit-proposed": "Awaiting reply",
  "visit-confirmed": "Visit scheduled",
  "in-progress": "In progress",
  submitted: "Awaiting approval",
};

// "Waiting too long" — vendor follow-up cues. Only on stages where the vendor
// COULD nudge things forward.
const OVERDUE_THRESHOLDS: Partial<Record<JobStage, number>> = {
  "awaiting-client": 5,        // No client reply in 5d → consider follow-up
  "visit-needed": 2,           // Vendor should propose times by day 2
  "visit-action-required": 1,  // Counter-proposal sitting more than a day
};

// Stages where the VENDOR is the blocker — needs to act.
const VENDOR_BLOCKED_STAGES = new Set<JobStage>([
  "visit-needed",
  "visit-action-required",
  "in-progress",
]);

const STAGE_ORDER: Record<JobStage, number> = {
  "visit-action-required": 0,
  "visit-needed": 1,
  "awaiting-client": 2,
  "visit-proposed": 3,
  "visit-confirmed": 4,
  "in-progress": 5,
  submitted: 6,
};

const STAGE_ACCENT: Record<JobStage, string> = {
  "awaiting-client": "border-l-muted-foreground/30",
  "visit-needed": "border-l-amber-400",
  "visit-action-required": "border-l-amber-400",
  "visit-proposed": "border-l-primary",
  "visit-confirmed": "border-l-emerald-400",
  "in-progress": "border-l-blue-400",
  submitted: "border-l-purple-400",
};

const OVERDUE_ACCENT = "border-l-primary";

const STAGE_PILL: Record<
  JobStage,
  { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }
> = {
  "awaiting-client": {
    label: "Awaiting client",
    cls: "bg-muted text-muted-foreground border-border",
    icon: Clock,
  },
  "visit-needed": {
    label: "Propose visit",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Calendar,
  },
  "visit-action-required": {
    label: "Client counter-proposed",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Calendar,
  },
  "visit-proposed": {
    label: "Visit proposed",
    cls: "bg-primary/10 text-primary border-primary/20",
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
  submitted: {
    label: "Submitted",
    cls: "bg-purple-50 text-purple-700 border-purple-200",
    icon: FileText,
  },
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

interface ProcessedVisit {
  id: number;
  issueId: number;
  issue: IssueType | undefined;
  listing: Listing | undefined;
  category: "action_required" | "pending" | "confirmed";
  startTime: Date;
  endTime: Date;
  proposalCount: number;
  acceptedAssessment?: IssueAssessment;
  /** All assessments under this issue (so accept/decline can target the right id). */
  allAssessments?: IssueAssessment[];
}

interface Job {
  offer: IssueOffer;
  issue: IssueType | undefined;
  listing: Listing | undefined;
  stage: JobStage;
  step: TrackerStep;
  isVendorBlocked: boolean;
  daysWaiting: number | null;
  isOverdue: boolean;
  visit?: ProcessedVisit;
  sortKey: number;
}

interface VendorActiveJobsCardProps {
  vendorOffers: IssueOffer[];
  issuesMap: Record<number, IssueType>;
  listingsMap: Record<number, Listing>;
  processedVisits: ProcessedVisit[];
  /** Open the IssueDetails modal on a specific tab. */
  onOpenIssue: (issueId: number, defaultTab?: "details" | "offers" | "assessments") => void;
  /** Browse-jobs CTA used in the empty state. */
  onBrowseJobs: () => void;
  /** After successful accept/decline, parent should refetch assessments. */
  refetchAssessments?: () => void;
}

const VendorActiveJobsCard: React.FC<VendorActiveJobsCardProps> = ({
  vendorOffers,
  issuesMap,
  listingsMap,
  processedVisits,
  onOpenIssue,
  onBrowseJobs,
  refetchAssessments,
}) => {
  const [updateOffer] = useUpdateOfferMutation();
  const [updateAssessment] = useUpdateAssessmentMutation();
  const [deleteAssessment] = useDeleteAssessmentMutation();

  // Per-offer/assessment in-flight markers so spinners + disable are scoped.
  const [withdrawingOfferId, setWithdrawingOfferId] = useState<number | null>(null);
  const [pendingVisitActionId, setPendingVisitActionId] = useState<number | null>(null);

  // Build the unified Job list from offers (with cross-reference to processedVisits).
  const jobs = useMemo<Job[]>(() => {
    const visitsByIssue = new Map<number, ProcessedVisit>();
    processedVisits.forEach((v) => {
      visitsByIssue.set(v.issueId, v);
    });

    const out: Job[] = [];

    vendorOffers.forEach((offer) => {
      const issue = issuesMap[offer.issue_id];
      if (!issue) return;
      // Skip completed jobs — they belong on the Earnings/History view.
      if (issue.status === "Status.COMPLETED") return;

      const listing = listingsMap[issue.listing_id];
      const visit = visitsByIssue.get(offer.issue_id);

      // Vendor's quote was declined — drop the whole job before any further
      // stage detection.  A rejected vendor shouldn't be confirming visits.
      if (offer.status === IssueOfferStatus.REJECTED) return;

      let stage: JobStage;
      // PRIORITY: a homeowner-proposed visit awaiting the vendor's reply
      // outranks every other state.  Even if the quote hasn't been accepted
      // yet, the vendor needs to see "you have a visit time to confirm" so
      // they can act on it — otherwise it'd be invisible during the
      // pre-acceptance race window and the homeowner would be left waiting.
      if (visit?.category === "action_required") {
        stage = "visit-action-required";
      } else if (offer.status === IssueOfferStatus.RECEIVED) {
        stage = "awaiting-client";
      } else if (issue.status === "Status.REVIEW") {
        stage = "submitted";
      } else if (issue.status === "Status.IN_PROGRESS") {
        // Offer accepted + work underway. Visit status decides sub-stage.
        if (visit?.category === "confirmed") {
          // Future confirmed visit → "scheduled"; past → assume work has begun.
          stage = visit.startTime > new Date() ? "visit-confirmed" : "in-progress";
        } else stage = "in-progress";
      } else {
        // Offer accepted, but issue status is still OPEN (rare race window) or unknown.
        if (visit?.category === "pending") stage = "visit-proposed";
        else if (visit?.category === "confirmed") stage = "visit-confirmed";
        else stage = "visit-needed";
      }

      const isVendorBlocked = VENDOR_BLOCKED_STAGES.has(stage);

      // Days the vendor has been blocking — only for vendor-blocked stages.
      let daysWaiting: number | null = null;
      if (isVendorBlocked || stage === "awaiting-client") {
        // For awaiting-client, "days waiting" tracks how long since vendor sent the quote.
        const referenceTs =
          stage === "visit-action-required" && visit
            ? // Use the counter-proposed assessment's createdAt
              (visit.allAssessments?.find(
                (a) => (a.status as string)?.toLowerCase().includes("received") && a.user_type !== "vendor"
              ) as IssueAssessment | undefined)?.created_at || undefined
            : offer.updated_at || offer.created_at;
        if (referenceTs) {
          const ms = Date.now() - new Date(referenceTs).getTime();
          if (!Number.isNaN(ms) && ms > 0) {
            daysWaiting = Math.floor(ms / (1000 * 60 * 60 * 24));
          }
        }
      }

      const threshold = OVERDUE_THRESHOLDS[stage];
      const isOverdue = !!(threshold && daysWaiting !== null && daysWaiting >= threshold);

      const sortKey =
        STAGE_ORDER[stage] * 1e12 -
        new Date(offer.updated_at || offer.created_at || 0).getTime();

      out.push({
        offer,
        issue,
        listing,
        stage,
        step: STAGE_TO_STEP[stage],
        isVendorBlocked,
        daysWaiting,
        isOverdue,
        visit,
        sortKey,
      });
    });

    // Final filter: only surface jobs that need the vendor's hands or head
    // right now (active work + counter-proposals awaiting their reply).
    // Outstanding quotes and confirmed-but-future visits show up on the KPI
    // tiles and the schedule respectively — keeping them out of here keeps the
    // card a true "do this next" list.
    return out
      .filter((j) => VISIBLE_STAGES.has(j.stage))
      .sort((a, b) => {
        if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
        return a.sortKey - b.sortKey;
      });
  }, [vendorOffers, issuesMap, listingsMap, processedVisits]);

  // Per-tab counts drive the tab strip badges and default selection.
  const counts = useMemo(() => {
    const c = { active: 0, visits: 0 };
    jobs.forEach((j) => {
      if (j.stage === "in-progress") c.active += 1;
      else if (j.stage === "visit-action-required") c.visits += 1;
    });
    return c;
  }, [jobs]);

  // Default tab — prefer "active" if there's in-progress work; fall back to
  // "visits" only when there's nothing active but there ARE visit requests
  // waiting on the vendor (so a brand new vendor with their first visit
  // confirmation lands on the right tab without a click).  Otherwise stay on
  // "active" so the (empty) primary surface owns the empty state.
  const initialTab: Tab =
    counts.active > 0 ? "active" : counts.visits > 0 ? "visits" : "active";
  const [activeTab, setActiveTabState] = useState<Tab>(initialTab);

  // Once the user has tapped a tab, that choice "sticks" and the auto-switch
  // below leaves them alone — otherwise clicking the empty Active tab would
  // bounce them right back to Visits and feel broken.  Auto-switch only
  // applies BEFORE the first manual interaction, so a vendor whose data
  // shape changes between mount and first click still lands somewhere useful.
  const hasUserPickedTab = useRef(false);
  const setActiveTab = (t: Tab) => {
    hasUserPickedTab.current = true;
    setActiveTabState(t);
  };

  // Pre-interaction auto-switch: if the user is sitting on an empty tab and
  // the other tab has rows, flip them over so they aren't staring at a
  // dead surface they can't act on.  Gated on hasUserPickedTab so manual
  // selections win immediately and forever after.
  useEffect(() => {
    if (hasUserPickedTab.current) return;
    if (activeTab === "active" && counts.active === 0 && counts.visits > 0) {
      setActiveTabState("visits");
    } else if (activeTab === "visits" && counts.visits === 0 && counts.active > 0) {
      setActiveTabState("active");
    }
  }, [activeTab, counts.active, counts.visits]);

  const filteredJobs = useMemo(() => {
    if (activeTab === "active") return jobs.filter((j) => j.stage === "in-progress");
    return jobs.filter((j) => j.stage === "visit-action-required");
  }, [jobs, activeTab]);

  const visibleJobs = filteredJobs.slice(0, 5);

  // "View all" routes to the My Projects page filtered to the Active tab so
  // the vendor can see every in-flight job in one place — no in-card modal
  // anymore (the page version is richer and lets them filter further).
  const navigate = useNavigate();
  const handleViewAll = () => navigate("/vendor/jobs?tab=active");

  // ── Action handlers ──────────────────────────────────────────────────────
  const handleWithdrawQuote = async (job: Job) => {
    setWithdrawingOfferId(job.offer.id);
    try {
      await updateOffer({
        id: job.offer.id,
        issue_id: job.offer.issue_id,
        vendor_id: job.offer.vendor_id,
        price: job.offer.price,
        status: "rejected",
        user_last_viewed: new Date().toISOString(),
        comment_vendor: (job.offer as any).comment_vendor || "",
        comment_client: (job.offer as any).comment_client || "",
      }).unwrap();
      toast.success("Quote withdrawn");
    } catch (err) {
      console.error("Failed to withdraw quote:", err);
      toast.error("Couldn't withdraw quote. Please try again.");
    } finally {
      setWithdrawingOfferId(null);
    }
  };

  const handleAcceptVisit = async (job: Job) => {
    if (!job.visit?.allAssessments) {
      // Fallback — open the modal so user can accept manually.
      onOpenIssue(job.offer.issue_id, "assessments");
      return;
    }
    // Find the client-proposed assessment (user_type !== "vendor") to accept.
    const clientProposal = job.visit.allAssessments.find(
      (a) =>
        (a.status as string)?.toLowerCase().includes("received") &&
        a.user_type !== "vendor"
    );
    if (!clientProposal) {
      onOpenIssue(job.offer.issue_id, "assessments");
      return;
    }
    setPendingVisitActionId(Number(clientProposal.id));
    try {
      await updateAssessment({
        id: clientProposal.id,
        issue_id: clientProposal.issue_id,
        user_id: clientProposal.user_id,
        user_type: clientProposal.user_type,
        interaction_id: clientProposal.users_interaction_id,
        users_interaction_id: clientProposal.users_interaction_id,
        start_time: clientProposal.start_time,
        end_time: clientProposal.end_time,
        status: "accepted",
        min_assessment_time: clientProposal.min_assessment_time,
        user_last_viewed: new Date().toISOString(),
      }).unwrap();
      toast.success("Visit confirmed");
      refetchAssessments?.();
    } catch (err) {
      console.error("Failed to accept visit:", err);
      toast.error("Couldn't accept the visit. Please try again.");
    } finally {
      setPendingVisitActionId(null);
    }
  };

  const handleDeclineVisit = async (job: Job) => {
    // For a client counter-proposal, "decline" means remove the client's pending
    // assessment so the vendor can propose a new time.
    if (!job.visit?.allAssessments) return;
    const clientProposal = job.visit.allAssessments.find(
      (a) =>
        (a.status as string)?.toLowerCase().includes("received") &&
        a.user_type !== "vendor"
    );
    if (!clientProposal) return;
    setPendingVisitActionId(Number(clientProposal.id));
    try {
      await deleteAssessment({
        id: Number(clientProposal.id),
        issue_id: clientProposal.issue_id,
        interaction_id: clientProposal.users_interaction_id,
      }).unwrap();
      toast.success("Counter-proposal declined");
      refetchAssessments?.();
    } catch (err) {
      console.error("Failed to decline visit:", err);
      toast.error("Couldn't decline. Please try again.");
    } finally {
      setPendingVisitActionId(null);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  const renderJobRow = (j: Job, opts?: { hideTracker?: boolean }) => {
    const pill = STAGE_PILL[j.stage];
    const PillIcon = pill.icon;
    const title = j.issue?.summary || `${normalizeAndCapitalize(j.issue?.type || "Job")}`;
    const addressShort = j.listing?.address?.split(",")[0] || "Property";
    const accent = j.isOverdue ? OVERDUE_ACCENT : STAGE_ACCENT[j.stage];

    let contextLine: React.ReactNode = null;
    if (j.stage === "awaiting-client") {
      const sent = formatRelativeTime(j.offer.created_at);
      contextLine = (
        <span className="text-muted-foreground">
          Quote sent {sent ?? "recently"}
          <span className="text-muted-foreground/60"> · </span>
          <span className="font-semibold text-foreground tabular-nums">
            {formatMoney(j.offer.price || 0)}
          </span>
        </span>
      );
    } else if (
      (j.stage === "visit-action-required" ||
        j.stage === "visit-proposed" ||
        j.stage === "visit-confirmed") &&
      j.visit
    ) {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isToday = j.visit.startTime.toDateString() === today.toDateString();
      const isTomorrow = j.visit.startTime.toDateString() === tomorrow.toDateString();
      const dateLabel = isToday
        ? "Today"
        : isTomorrow
        ? "Tomorrow"
        : j.visit.startTime.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
      const timeLabel = j.visit.startTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      contextLine = (
        <span>
          <span className="font-semibold text-foreground">{dateLabel}</span>
          <span className="text-muted-foreground"> at {timeLabel}</span>
          {j.visit.proposalCount > 1 && (
            <>
              <span className="text-muted-foreground/60"> · </span>
              <span>{j.visit.proposalCount} times offered</span>
            </>
          )}
        </span>
      );
    } else if (j.stage === "visit-needed") {
      contextLine = (
        <span className="text-muted-foreground">
          Offer accepted — propose a visit time
        </span>
      );
    } else if (j.stage === "in-progress") {
      contextLine = (
        <span>
          <span className="text-muted-foreground">Working on </span>
          <span className="font-semibold text-foreground">{addressShort}</span>
        </span>
      );
    } else if (j.stage === "submitted") {
      contextLine = (
        <span className="text-muted-foreground">
          Awaiting client approval
        </span>
      );
    }

    return (
      <div
        key={j.offer.id}
        className={`group relative flex items-start gap-3 p-3 rounded-xl
                    border-l-[3px] ${accent}
                    hover:bg-muted/40 transition-colors cursor-pointer`}
        onClick={() =>
          j.issue?.id &&
          onOpenIssue(
            j.issue.id,
            j.stage.startsWith("visit") ? "assessments" : "details"
          )
        }
      >
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
          <FontAwesomeIcon
            icon={getIssueTypeIcon(j.issue?.type || "")}
            className="text-muted-foreground group-hover:text-primary transition-colors"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {j.isVendorBlocked && (
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      j.isOverdue
                        ? "bg-primary/10 text-primary"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        j.isOverdue ? "bg-primary" : "bg-amber-500"
                      } animate-pulse`}
                    />
                    Needs you
                  </span>
                )}
                <div className="font-semibold text-foreground text-sm truncate">
                  {title}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{addressShort}</span>
                {j.daysWaiting !== null && j.daysWaiting > 0 && (
                  <>
                    <span className="text-muted-foreground/50">·</span>
                    <span className={j.isOverdue ? "font-semibold text-primary" : ""}>
                      {j.daysWaiting} day{j.daysWaiting !== 1 ? "s" : ""} waiting
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
              currentStep={j.step}
              overdue={j.isOverdue}
              labelOverride={STAGE_TRACKER_LABEL[j.stage]}
              className="mt-2.5"
            />
          )}
        </div>

        {/* ── Action region — stage-specific. */}
        {j.stage === "awaiting-client" ? (
          <div className="self-center flex-shrink-0 flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                j.issue?.id && onOpenIssue(j.issue.id, "details");
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gold text-white transition-colors hover:bg-foreground hover:text-background"
            >
              View
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleWithdrawQuote(j);
              }}
              disabled={withdrawingOfferId === j.offer.id}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-card border border-border text-foreground transition-colors hover:bg-muted/60 disabled:opacity-50"
            >
              <X className="w-3 h-3" />
              {withdrawingOfferId === j.offer.id ? "Withdrawing…" : "Withdraw"}
            </button>
          </div>
        ) : j.stage === "visit-action-required" && j.visit ? (
          <div className="self-center flex-shrink-0 flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAcceptVisit(j);
              }}
              disabled={pendingVisitActionId !== null}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gold text-white transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
            >
              <Check className="w-3 h-3" />
              {pendingVisitActionId !== null ? "…" : "Accept"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeclineVisit(j);
              }}
              disabled={pendingVisitActionId !== null}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-card border border-border text-foreground transition-colors hover:bg-muted/60 disabled:opacity-50"
            >
              <X className="w-3 h-3" />
              Decline
            </button>
          </div>
        ) : j.stage === "visit-needed" ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              j.issue?.id && onOpenIssue(j.issue.id, "assessments");
            }}
            className="self-center flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gold text-white transition-colors hover:bg-foreground hover:text-background"
          >
            <Calendar className="w-3 h-3" />
            Propose time
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              j.issue?.id &&
                onOpenIssue(
                  j.issue.id,
                  j.stage.startsWith("visit") ? "assessments" : "details"
                );
            }}
            className="self-center flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gold text-white transition-colors hover:bg-foreground hover:text-background"
          >
            View
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  // Header subtitle — speaks to the count visible on the CURRENT tab so the
  // number always matches what the user sees below.  Overdue gets first
  // billing when present because that's the highest-stakes signal.
  const headerSubtitle = (() => {
    if (jobs.length === 0) return "All caught up";
    const overdue = filteredJobs.filter((j) => j.isOverdue).length;
    if (overdue > 0) return `${overdue} overdue · ${filteredJobs.length} ${activeTab === "active" ? "active" : "visits"}`;
    if (filteredJobs.length === 0)
      return activeTab === "active" ? "No active work" : "No visits pending";
    return activeTab === "active"
      ? `${filteredJobs.length} active`
      : `${filteredJobs.length} ${filteredJobs.length === 1 ? "visit" : "visits"} to confirm`;
  })();

  // Tab strip — 2 tabs only.  Badge dot on Visits when there's something to act
  // on, to draw the eye even when "Active" is the current selection.
  const renderTabStrip = () => (
    <div className="px-6 pt-3 border-b border-border/60 flex-shrink-0">
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
        {([
          { id: "active", label: "Active work", count: counts.active },
          { id: "visits", label: "Visits", count: counts.visits },
        ] as { id: Tab; label: string; count: number }[]).map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`relative -mb-px py-2.5 inline-flex items-center gap-1.5 text-sm transition-colors whitespace-nowrap
                ${
                  isActive
                    ? "font-bold text-foreground"
                    : "font-semibold text-muted-foreground hover:text-foreground"
                }`}
            >
              <span>{t.label}</span>
              {t.count > 0 && (
                <span
                  className={`tabular-nums text-xs ${
                    isActive ? "text-foreground" : "text-muted-foreground/70"
                  }`}
                >
                  {t.count}
                </span>
              )}
              {/* Pulsing dot when there's something to act on but the user
                  is on the other tab — surfaces the alert without forcing them. */}
              {!isActive && t.id === "visits" && t.count > 0 && (
                <span className="ml-0.5 inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
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
    <div className="bg-card rounded-2xl border border-border/60 shadow-card overflow-hidden xl:h-full xl:flex xl:flex-col">
      <div className="px-6 py-4 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Active Jobs
            </h2>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              {headerSubtitle}
            </p>
          </div>
        </div>
        <button
          onClick={handleViewAll}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors flex-shrink-0"
        >
          View all
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {jobs.length > 0 && renderTabStrip()}

      <div className="p-3 xl:flex-1 xl:overflow-y-auto xl:min-h-0">
        {jobs.length === 0 ? (
          <div className="text-center py-10 px-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              All caught up
            </h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
              No work in progress and no visit requests waiting on you. Browse
              the marketplace to find your next job.
            </p>
            <button
              onClick={onBrowseJobs}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                         bg-gold text-white font-semibold text-sm
                         hover:bg-foreground hover:text-background transition-colors"
            >
              Browse jobs
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          // Tab is empty but the other tab has rows — invite a hop instead of
          // showing a dead surface.  Buttons land on the other tab if it has
          // something, else mirror the all-empty CTA.
          <div className="text-center py-8 px-6">
            <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-3">
              <Check className="w-5 h-5 text-muted-foreground/70" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {activeTab === "active" ? "Nothing in progress" : "No visits to confirm"}
            </h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
              {activeTab === "active"
                ? "Once a visit completes and the client approves the work, it'll show up here."
                : "When a homeowner proposes a visit time, it'll land here for you to accept or decline."}
            </p>
            {activeTab === "active" && counts.visits > 0 ? (
              <button
                onClick={() => setActiveTab("visits")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80"
              >
                Review {counts.visits} visit request{counts.visits !== 1 ? "s" : ""}
                <ChevronRight className="w-3 h-3" />
              </button>
            ) : activeTab === "visits" && counts.active > 0 ? (
              <button
                onClick={() => setActiveTab("active")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80"
              >
                See {counts.active} active job{counts.active !== 1 ? "s" : ""}
                <ChevronRight className="w-3 h-3" />
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="space-y-1">{visibleJobs.map((j) => renderJobRow(j))}</div>
            {filteredJobs.length > 5 && (
              <button
                onClick={handleViewAll}
                className="w-full mt-2 px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors inline-flex items-center justify-center gap-1"
              >
                View {filteredJobs.length - 5} more
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </>
        )}
      </div>

    </div>
  );
};

export default VendorActiveJobsCard;
