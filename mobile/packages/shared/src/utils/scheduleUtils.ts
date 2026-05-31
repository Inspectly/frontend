import {
  CalendarReadyAssessment,
  IssueAssessment,
  IssueAssessmentStatus,
  IssueType,
  Listing,
} from "../types";
import { normalizeAndCapitalize } from "./typeUtils";

export type ScheduleEvent = CalendarReadyAssessment & {
  issue?: IssueType;
  listing?: Listing;
};

/** Backend may strip the Z suffix — append it if missing. */
export const parseAsUTC = (timeStr: string): Date => {
  if (!timeStr) return new Date();
  return new Date(timeStr.endsWith("Z") ? timeStr : `${timeStr}Z`);
};

export const startOfDay = (d: Date): Date => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const startOfMonth = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), 1);

export const addMonths = (d: Date, n: number): Date =>
  new Date(d.getFullYear(), d.getMonth() + n, 1);

export const dayKey = (d: Date): string =>
  `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export const isSameMonth = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export const isSameDay = (a: Date, b: Date): boolean => dayKey(a) === dayKey(b);

export const WEEK_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const isAcceptedStatus = (status: unknown): boolean => {
  const s = (status as string)?.toLowerCase() || "";
  return s === "accepted" || s.includes("accepted");
};

/** Upcoming confirmed visits for the schedule card (mirrors web VendorDashboard). */
export function buildScheduleEvents(
  assessments: IssueAssessment[],
  issuesMap: Record<number, IssueType>,
  listingsMap: Record<number, Listing>
): ScheduleEvent[] {
  const cutoff = startOfDay(new Date());

  return assessments
    .filter((a) => isAcceptedStatus(a.status))
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
}

export const scheduleDotColor = (event: ScheduleEvent, currentUserId: number): string => {
  if (event.status === IssueAssessmentStatus.ACCEPTED) return "#10b981";
  if (event.user_id === currentUserId) return "#D4A853";
  return "#f59e0b";
};

export const isReceivedStatus = (status?: string): boolean => {
  const s = (status ?? "").toLowerCase();
  return s === "received" || s.includes("received");
};
