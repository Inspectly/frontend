import React from "react";
import {
  Activity,
  Briefcase,
  Calendar,
  Check,
  FileText,
  Upload,
} from "lucide-react";
import {
  CalendarReadyAssessment,
  IssueAssessmentStatus,
  IssueOffer,
  IssueOfferStatus,
  IssueType,
  Listing,
  ReportType,
  Vendor,
} from "../types";
import { normalizeAndCapitalize } from "./typeNormalizer";

export type ActivityKind =
  | "quote-received"
  | "quote-accepted"
  | "visit-proposed"
  | "visit-confirmed"
  | "report-uploaded"
  | "job-posted";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  /** Unix millis — used for ordering + relative time rendering. */
  ts: number;
  /** Rich title (mix of bold/muted spans). */
  title: React.ReactNode;
  /** Optional one-line subtitle (e.g. issue summary). */
  subtitle?: React.ReactNode;
  /** Optional click target (wired up by the consumer). */
  onClick?: () => void;
}

export const ACTIVITY_META: Record<
  ActivityKind,
  { icon: React.ComponentType<{ className?: string }>; bg: string; color: string }
> = {
  "quote-received": { icon: FileText, bg: "bg-primary/10", color: "text-primary" },
  "quote-accepted": { icon: Check, bg: "bg-emerald-100", color: "text-emerald-700" },
  "visit-proposed": { icon: Calendar, bg: "bg-amber-100", color: "text-amber-700" },
  "visit-confirmed": { icon: Calendar, bg: "bg-emerald-100", color: "text-emerald-700" },
  "report-uploaded": { icon: Upload, bg: "bg-blue-100", color: "text-blue-700" },
  "job-posted": { icon: Briefcase, bg: "bg-muted", color: "text-foreground" },
};

/** Sentinel icon for headers / empty states. */
export const ACTIVITY_SECTION_ICON = Activity;

export const formatActivityRelativeTime = (ts: number): string => {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(d / 365)}y`;
};

export interface BuildDashboardActivityInput {
  issues: IssueType[];
  offersByIssueId: Record<number, IssueOffer[]>;
  calendarEvents: (CalendarReadyAssessment & {
    issue?: IssueType;
    listing?: Listing;
    vendor?: Vendor;
  })[];
  reports: ReportType[];
  listings: Listing[];
  vendorMap: Record<number, Vendor>;
  currentUserId: number;
  /** Optional click handler; we wire it onto items that point at an issue. */
  onOpenIssue?: (issue: IssueType) => void;
  /** Cap on returned items (default = no cap; consumer slices). */
  limit?: number;
}

/**
 * Build a chronologically-ordered activity feed from the data the dashboard
 * already has — quotes, visits, reports, and posted jobs. Pure (no React
 * hooks, no side effects), so it can be called inside `useMemo` or unit-tested.
 */
export const buildDashboardActivity = ({
  issues,
  offersByIssueId,
  calendarEvents,
  reports,
  listings,
  vendorMap,
  currentUserId,
  onOpenIssue,
  limit,
}: BuildDashboardActivityInput): ActivityItem[] => {
  const list: ActivityItem[] = [];
  const issueById = new Map(issues.map((i) => [i.id, i]));
  const listingById = new Map(listings.map((l) => [l.id, l]));

  // Offers — quote received + quote accepted
  Object.entries(offersByIssueId).forEach(([idStr, offers]) => {
    const issueId = Number(idStr);
    const issue = issueById.get(issueId);
    if (!issue) return;
    const issueLabel = issue.summary || `${normalizeAndCapitalize(issue.type)} issue`;
    offers.forEach((o) => {
      const ts = new Date(o.updated_at || o.created_at).getTime();
      if (!ts) return;
      const vendor = vendorMap[o.vendor_id];
      const vendorName = vendor?.company_name || vendor?.name || "A vendor";

      if (o.status === IssueOfferStatus.RECEIVED) {
        list.push({
          id: `offer-rcv-${o.id}`,
          kind: "quote-received",
          ts,
          title: (
            <span>
              <span className="font-semibold text-foreground">{vendorName}</span>
              <span className="text-muted-foreground"> sent a quote</span>
            </span>
          ),
          subtitle: issueLabel,
          onClick: onOpenIssue ? () => onOpenIssue(issue) : undefined,
        });
      } else if (o.status === IssueOfferStatus.ACCEPTED) {
        list.push({
          id: `offer-acc-${o.id}`,
          kind: "quote-accepted",
          ts,
          title: (
            <span>
              <span className="text-muted-foreground">You accepted </span>
              <span className="font-semibold text-foreground">{vendorName}</span>
              <span className="text-muted-foreground">'s quote</span>
            </span>
          ),
          subtitle: issueLabel,
          onClick: onOpenIssue ? () => onOpenIssue(issue) : undefined,
        });
      }
    });
  });

  // Assessments — visit proposed (by vendor) + visit confirmed
  calendarEvents.forEach((ev) => {
    const ts = new Date(ev.updated_at || ev.created_at).getTime();
    if (!ts) return;
    const vendorName = ev.vendor?.company_name || ev.vendor?.name || "Vendor";
    const issueLabel = ev.issue?.summary || ev.title;

    if (ev.status === IssueAssessmentStatus.RECEIVED && ev.user_id !== currentUserId) {
      list.push({
        id: `assess-rcv-${ev.id}`,
        kind: "visit-proposed",
        ts,
        title: (
          <span>
            <span className="font-semibold text-foreground">{vendorName}</span>
            <span className="text-muted-foreground"> proposed a visit</span>
          </span>
        ),
        subtitle: issueLabel,
        onClick: ev.issue && onOpenIssue ? () => onOpenIssue(ev.issue!) : undefined,
      });
    } else if (ev.status === IssueAssessmentStatus.ACCEPTED) {
      list.push({
        id: `assess-acc-${ev.id}`,
        kind: "visit-confirmed",
        ts,
        title: (
          <span>
            <span className="text-muted-foreground">Visit confirmed with </span>
            <span className="font-semibold text-foreground">{vendorName}</span>
          </span>
        ),
        subtitle: issueLabel,
        onClick: ev.issue && onOpenIssue ? () => onOpenIssue(ev.issue!) : undefined,
      });
    }
  });

  // Reports uploaded
  reports.forEach((r) => {
    const ts = new Date(r.created_at).getTime();
    if (!ts) return;
    const listing = listingById.get(r.listing_id);
    const addressShort = listing?.address?.split(",")[0] || r.name || "Report";
    list.push({
      id: `report-${r.id}`,
      kind: "report-uploaded",
      ts,
      title: (
        <span>
          <span className="text-muted-foreground">Report uploaded for </span>
          <span className="font-semibold text-foreground">{addressShort}</span>
        </span>
      ),
    });
  });

  // Issues posted
  issues.forEach((i) => {
    const ts = new Date(i.created_at).getTime();
    if (!ts) return;
    list.push({
      id: `issue-${i.id}`,
      kind: "job-posted",
      ts,
      title: (
        <span>
          <span className="text-muted-foreground">You posted </span>
          <span className="font-semibold text-foreground">
            {i.summary || `${normalizeAndCapitalize(i.type)} job`}
          </span>
        </span>
      ),
      onClick: onOpenIssue ? () => onOpenIssue(i) : undefined,
    });
  });

  list.sort((a, b) => b.ts - a.ts);
  return typeof limit === "number" ? list.slice(0, limit) : list;
};
