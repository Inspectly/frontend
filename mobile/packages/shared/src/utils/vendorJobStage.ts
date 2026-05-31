import {
  IssueAssessment,
  IssueOffer,
  IssueOfferStatus,
  IssueType,
  Listing,
} from "../types";

export type JobStage =
  | "awaiting-client"
  | "visit-needed"
  | "visit-action-required"
  | "visit-proposed"
  | "visit-confirmed"
  | "in-progress"
  | "submitted";

export type TrackerStep = 1 | 2 | 3 | 4 | 5;

export const TRACKER_LABELS = ["Posted", "Quoted", "Scheduled", "Working", "Done"] as const;

export const VISIBLE_STAGES: ReadonlySet<JobStage> = new Set<JobStage>([
  "in-progress",
  "visit-action-required",
]);

export const STAGE_TO_STEP: Record<JobStage, TrackerStep> = {
  "awaiting-client": 1,
  "visit-needed": 2,
  "visit-action-required": 2,
  "visit-proposed": 2,
  "visit-confirmed": 3,
  "in-progress": 4,
  submitted: 5,
};

export const STAGE_TRACKER_LABEL: Record<JobStage, string> = {
  "awaiting-client": "Quote sent",
  "visit-needed": "Schedule visit",
  "visit-action-required": "Visit reply needed",
  "visit-proposed": "Awaiting reply",
  "visit-confirmed": "Visit scheduled",
  "in-progress": "In progress",
  submitted: "Awaiting approval",
};

export const OVERDUE_THRESHOLDS: Partial<Record<JobStage, number>> = {
  "awaiting-client": 5,
  "visit-needed": 2,
  "visit-action-required": 1,
};

export const VENDOR_BLOCKED_STAGES = new Set<JobStage>([
  "visit-needed",
  "visit-action-required",
  "in-progress",
]);

export const STAGE_ORDER: Record<JobStage, number> = {
  "visit-action-required": 0,
  "visit-needed": 1,
  "awaiting-client": 2,
  "visit-proposed": 3,
  "visit-confirmed": 4,
  "in-progress": 5,
  submitted: 6,
};

export const STAGE_PILL: Record<
  JobStage,
  { label: string; bg: string; fg: string; border: string }
> = {
  "awaiting-client": { label: "Awaiting client", bg: "#f3f4f6", fg: "#6b7280", border: "#e5e7eb" },
  "visit-needed": { label: "Propose visit", bg: "#fffbeb", fg: "#b45309", border: "#fde68a" },
  "visit-action-required": { label: "Client counter-proposed", bg: "#fffbeb", fg: "#b45309", border: "#fde68a" },
  "visit-proposed": { label: "Visit proposed", bg: "#fefce8", fg: "#a16207", border: "#fde047" },
  "visit-confirmed": { label: "Visit confirmed", bg: "#ecfdf5", fg: "#047857", border: "#a7f3d0" },
  "in-progress": { label: "In progress", bg: "#eff6ff", fg: "#1d4ed8", border: "#bfdbfe" },
  submitted: { label: "Submitted", bg: "#f5f3ff", fg: "#6d28d9", border: "#ddd6fe" },
};

export const STAGE_ACCENT: Record<JobStage, string> = {
  "awaiting-client": "#9ca3af",
  "visit-needed": "#fbbf24",
  "visit-action-required": "#fbbf24",
  "visit-proposed": "#D4A853",
  "visit-confirmed": "#34d399",
  "in-progress": "#60a5fa",
  submitted: "#a78bfa",
};

export const OVERDUE_ACCENT = "#f43f5e";

export interface ProcessedVisit {
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
}

export interface VendorJob {
  offer: IssueOffer;
  issue: IssueType;
  listing: Listing | undefined;
  stage: JobStage;
  step: TrackerStep;
  isVendorBlocked: boolean;
  daysWaiting: number | null;
  isOverdue: boolean;
  visit?: ProcessedVisit;
  sortKey: number;
}

const isReceivedStatus = (status?: string) => {
  const s = (status ?? "").toLowerCase();
  return s === "received" || s.includes("received");
};

const isAcceptedStatus = (status?: string) => {
  const s = (status ?? "").toLowerCase();
  return s === "accepted" || s.includes("accepted");
};

export function getJobActivityTime(job: Pick<VendorJob, "offer" | "issue">): number {
  const offerTs = new Date(job.offer.updated_at || job.offer.created_at || 0).getTime();
  const issueTs = new Date(job.issue.updated_at || job.issue.created_at || 0).getTime();
  return Math.max(offerTs, issueTs);
}

/** Resolve pipeline stage for a single offer — shared by dashboard jobs and My Jobs. */
export function resolveVendorJobStage(
  offer: IssueOffer,
  issue: IssueType,
  visit?: ProcessedVisit
): JobStage | null {
  if (offer.status === IssueOfferStatus.REJECTED) return null;
  if ((issue.status as string) === "Status.COMPLETED") return "submitted";

  if (visit?.category === "action_required") return "visit-action-required";
  if (offer.status === IssueOfferStatus.RECEIVED) return "awaiting-client";
  if ((issue.status as string) === "Status.REVIEW") return "submitted";
  if ((issue.status as string) === "Status.IN_PROGRESS") {
    if (visit?.category === "confirmed") {
      return visit.startTime > new Date() ? "visit-confirmed" : "in-progress";
    }
    return "in-progress";
  }
  if (visit?.category === "pending") return "visit-proposed";
  if (visit?.category === "confirmed") return "visit-confirmed";
  return "visit-needed";
}

export function buildVendorJobMeta(
  offer: IssueOffer,
  issue: IssueType,
  listing: Listing | undefined,
  visit?: ProcessedVisit
): Pick<VendorJob, "stage" | "step" | "isVendorBlocked" | "daysWaiting" | "isOverdue" | "visit"> | null {
  const stage = resolveVendorJobStage(offer, issue, visit);
  if (!stage) return null;

  const isVendorBlocked = VENDOR_BLOCKED_STAGES.has(stage);
  let daysWaiting: number | null = null;
  if (isVendorBlocked || stage === "awaiting-client") {
    const referenceTs =
      stage === "visit-action-required" && visit
        ? visit.allAssessments.find(
            (a) => isReceivedStatus(a.status as string) && a.user_type !== "vendor"
          )?.created_at
        : offer.updated_at || offer.created_at;
    if (referenceTs) {
      const ms = Date.now() - new Date(referenceTs).getTime();
      if (!Number.isNaN(ms) && ms > 0) daysWaiting = Math.floor(ms / (1000 * 60 * 60 * 24));
    }
  }

  const threshold = OVERDUE_THRESHOLDS[stage];
  const isOverdue = !!(threshold && daysWaiting !== null && daysWaiting >= threshold);

  return {
    stage,
    step: STAGE_TO_STEP[stage],
    isVendorBlocked,
    daysWaiting,
    isOverdue,
    visit,
  };
}

export function buildProcessedVisits(
  assessments: IssueAssessment[],
  issuesMap: Record<number, IssueType>,
  listingsMap: Record<number, Listing>,
  currentUserId: number
): ProcessedVisit[] {
  const groupedByIssue: Record<number, IssueAssessment[]> = {};
  assessments.forEach((a) => {
    if (!groupedByIssue[a.issue_id]) groupedByIssue[a.issue_id] = [];
    groupedByIssue[a.issue_id].push(a);
  });

  const visits = Object.entries(groupedByIssue)
    .map(([issueIdStr, group]) => {
      const issueId = Number(issueIdStr);
      const issue = issuesMap[issueId];
      const listing = issue ? listingsMap[issue.listing_id] : undefined;

      const acceptedAssessment = group.find((a) => isAcceptedStatus(a.status as string));
      const actionRequired = group.filter(
        (a) => isReceivedStatus(a.status as string) && a.user_id !== currentUserId
      );
      const pending = group.filter(
        (a) => isReceivedStatus(a.status as string) && a.user_id === currentUserId
      );

      let category: ProcessedVisit["category"] = "pending";
      let primary: IssueAssessment | undefined;
      let proposalCount = 0;

      if (acceptedAssessment) {
        category = "confirmed";
        primary = acceptedAssessment;
      } else if (actionRequired.length > 0) {
        category = "action_required";
        primary = [...actionRequired].sort(
          (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )[0];
        proposalCount = actionRequired.length;
      } else if (pending.length > 0) {
        category = "pending";
        primary = [...pending].sort(
          (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )[0];
        proposalCount = pending.length;
      }

      if (!primary) return null;

      return {
        id: issueId,
        issueId,
        issue,
        listing,
        category,
        startTime: new Date(primary.start_time),
        endTime: new Date(primary.end_time),
        proposalCount,
        acceptedAssessment,
        allAssessments: group,
      } satisfies ProcessedVisit;
    })
    .filter(Boolean) as ProcessedVisit[];

  const now = new Date();
  return visits
    .filter((v) => (v.category === "confirmed" ? v.startTime >= now : true))
    .sort((a, b) => {
      if (a.category === "action_required" && b.category !== "action_required") return -1;
      if (b.category === "action_required" && a.category !== "action_required") return 1;
      return a.startTime.getTime() - b.startTime.getTime();
    });
}

export function buildVendorJobs(
  vendorOffers: IssueOffer[],
  issuesMap: Record<number, IssueType>,
  listingsMap: Record<number, Listing>,
  processedVisits: ProcessedVisit[]
): VendorJob[] {
  const visitsByIssue = new Map<number, ProcessedVisit>();
  processedVisits.forEach((v) => visitsByIssue.set(v.issueId, v));

  const jobs: VendorJob[] = [];

  vendorOffers.forEach((offer) => {
    const issue = issuesMap[offer.issue_id];
    if (!issue) return;
    if ((issue.status as string) === "Status.COMPLETED") return;
    if (offer.status === IssueOfferStatus.REJECTED) return;

    const listing = listingsMap[issue.listing_id];
    const visit = visitsByIssue.get(offer.issue_id);
    const meta = buildVendorJobMeta(offer, issue, listing, visit);
    if (!meta) return;

    const activityTime = getJobActivityTime({ offer, issue });

    jobs.push({
      offer,
      issue,
      listing,
      ...meta,
      sortKey: STAGE_ORDER[meta.stage] * 1e12 - activityTime,
    });
  });

  return jobs
    .filter((j) => VISIBLE_STAGES.has(j.stage))
    .sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      return a.sortKey - b.sortKey;
    });
}
