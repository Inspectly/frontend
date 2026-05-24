import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faEdit, faTrash, faCalendarAlt } from "@fortawesome/free-solid-svg-icons";
import {
  CalendarReadyAssessment,
  IssueAssessmentStatus,
  IssueType,
  Listing,
  Vendor,
} from "../../types";
import { getIssueTypeIcon } from "../../utils/typeNormalizer";
import { BUTTON_HOVER } from "../../styles/shared";

export type ScheduleEvent = CalendarReadyAssessment & {
  issue?: IssueType;
  listing?: Listing;
  vendor?: Vendor;
};

type ViewMode = "list" | "calendar";

interface ScheduleCardProps {
  events: ScheduleEvent[];
  currentUserId: number;
  isUpdatingAssessment: boolean;
  isDeletingAssessment: boolean;
  onAccept: (event: ScheduleEvent) => void;
  onProposeTime: (event: ScheduleEvent) => void;
  onCancelProposal: (event: ScheduleEvent) => void;
  /** Header "View all" — opens the full schedule modal in the parent. */
  onViewAll: () => void;
}

// ── date helpers ───────────────────────────────────────────────────────────
const startOfDay = (d: Date): Date => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const startOfMonth = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, n: number): Date =>
  new Date(d.getFullYear(), d.getMonth() + n, 1);
const dayKey = (d: Date): string =>
  `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const isSameMonth = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
const isSameDay = (a: Date, b: Date): boolean => dayKey(a) === dayKey(b);

const WEEK_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Color for the small day-cell event dot (status-aware).
const dotColorClass = (e: ScheduleEvent, currentUserId: number): string => {
  if (e.status === IssueAssessmentStatus.ACCEPTED) return "bg-emerald-500";
  if (e.user_id === currentUserId) return "bg-primary";
  return "bg-amber-500";
};

const ScheduleCard: React.FC<ScheduleCardProps> = ({
  events,
  currentUserId,
  isUpdatingAssessment,
  isDeletingAssessment,
  onAccept,
  onProposeTime,
  onCancelProposal,
  onViewAll,
}) => {
  // Default view: calendar (richer + taller; balances the right column with
  // the left). If there are no events at all, default to list (the empty state
  // for the list view is more inviting than an empty calendar).
  const [view, setView] = useState<ViewMode>(events.length === 0 ? "list" : "calendar");
  const today = useMemo(() => startOfDay(new Date()), []);

  // Calendar state: anchor month + selected day. Default anchor = today's month;
  // default selected = today, or the nearest upcoming event day.
  const [monthAnchor, setMonthAnchor] = useState<Date>(() => startOfMonth(today));
  const [selectedDay, setSelectedDay] = useState<Date>(() => {
    const next = events.find((e) => startOfDay(e.start) >= today);
    return next ? startOfDay(next.start) : today;
  });

  // If events arrive after mount, nudge the initial selection toward the first
  // upcoming event (only when the user hasn't actively picked a different day yet).
  const [userPickedDay, setUserPickedDay] = useState(false);
  useEffect(() => {
    if (userPickedDay) return;
    const next = events.find((e) => startOfDay(e.start) >= today);
    if (next) {
      const d = startOfDay(next.start);
      setSelectedDay(d);
      setMonthAnchor(startOfMonth(d));
    }
  }, [events, today, userPickedDay]);

  // Bucket events by day for O(1) lookup during render.
  const eventsByDay = useMemo<Map<string, ScheduleEvent[]>>(() => {
    const m = new Map<string, ScheduleEvent[]>();
    events.forEach((e) => {
      const k = dayKey(e.start);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    });
    // Sort each day's events by start time so the day list is chronological.
    m.forEach((list) => list.sort((a, b) => a.start.getTime() - b.start.getTime()));
    return m;
  }, [events]);

  // Build the 6×7 month grid (always 42 cells, includes trailing/leading days).
  const monthGrid = useMemo<Date[]>(() => {
    const first = startOfMonth(monthAnchor);
    const startWeekday = first.getDay();
    const gridStart = new Date(first);
    gridStart.setDate(gridStart.getDate() - startWeekday);
    return Array.from({ length: 42 }, (_, i) =>
      new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
    );
  }, [monthAnchor]);

  const selectedDayEvents = eventsByDay.get(dayKey(selectedDay)) || [];

  // ── render ────────────────────────────────────────────────────────────────
  return (
    // The card is structured as a flex column so it can stretch when its
    // parent uses `flex-1` (right column shock absorber). The body region
    // becomes the stretch target so toggling list/calendar never changes the
    // card's outer height — only its inner content.
    <div
      id="your-schedule"
      className="bg-card rounded-2xl shadow-card border border-border/60 overflow-hidden scroll-mt-6 h-full flex flex-col"
    >
      {/* Header — title + view toggle + (conditional) View all */}
      <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <CalendarIcon className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground tracking-tight">Your Schedule</h2>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              {events.length === 0
                ? "All clear"
                : `${events.length} upcoming visit${events.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {events.length > 5 && (
            <button
              onClick={onViewAll}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </button>
          )}
          <div className="inline-flex items-center bg-muted/60 rounded-lg p-0.5" role="tablist">
            <button
              role="tab"
              aria-selected={view === "list"}
              onClick={() => setView("list")}
              title="List view"
              className={`p-1.5 rounded-md transition-colors ${
                view === "list"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              role="tab"
              aria-selected={view === "calendar"}
              onClick={() => setView("calendar")}
              title="Calendar view"
              className={`p-1.5 rounded-md transition-colors ${
                view === "calendar"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Body — flex-1 so list / calendar both occupy whatever space the
          card has been stretched to. Internals decide how to use it. */}
      <div className="flex-1 min-h-0 flex flex-col">
      {view === "list" ? (
        <ListBody
          events={events}
          currentUserId={currentUserId}
          isUpdatingAssessment={isUpdatingAssessment}
          isDeletingAssessment={isDeletingAssessment}
          onAccept={onAccept}
          onProposeTime={onProposeTime}
          onCancelProposal={onCancelProposal}
        />
      ) : (
        <CalendarBody
          monthAnchor={monthAnchor}
          setMonthAnchor={setMonthAnchor}
          selectedDay={selectedDay}
          setSelectedDay={(d) => {
            setSelectedDay(d);
            setUserPickedDay(true);
          }}
          today={today}
          monthGrid={monthGrid}
          eventsByDay={eventsByDay}
          selectedDayEvents={selectedDayEvents}
          currentUserId={currentUserId}
          isUpdatingAssessment={isUpdatingAssessment}
          isDeletingAssessment={isDeletingAssessment}
          onAccept={onAccept}
          onProposeTime={onProposeTime}
          onCancelProposal={onCancelProposal}
        />
      )}
      </div>
    </div>
  );
};

// ── LIST view (chronological visit cards — current behavior) ───────────────
interface ListBodyProps {
  events: ScheduleEvent[];
  currentUserId: number;
  isUpdatingAssessment: boolean;
  isDeletingAssessment: boolean;
  onAccept: (event: ScheduleEvent) => void;
  onProposeTime: (event: ScheduleEvent) => void;
  onCancelProposal: (event: ScheduleEvent) => void;
}

const ListBody: React.FC<ListBodyProps> = ({
  events,
  currentUserId,
  isUpdatingAssessment,
  isDeletingAssessment,
  onAccept,
  onProposeTime,
  onCancelProposal,
}) => {
  if (events.length === 0) {
    return (
      <div className="p-3 flex-1 flex items-center">
        <div className="flex items-center gap-3 px-2 py-2 w-full">
          <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
            <CalendarIcon className="w-4 h-4 text-muted-foreground/70" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">Your schedule is clear</div>
            <div className="text-xs text-muted-foreground">
              Visit times will appear here as vendors respond.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show up to 6 rows in the visible area; if the card is stretched taller
  // than this fits, the extra space sits naturally at the bottom of a
  // scrollable list (so the column height stays locked).
  return (
    <div className="p-3 flex-1 overflow-y-auto min-h-0">
      <div className="space-y-2">
        {events.slice(0, 6).map((event) => (
          <EventRow
            key={event.id}
            event={event}
            currentUserId={currentUserId}
            isUpdatingAssessment={isUpdatingAssessment}
            isDeletingAssessment={isDeletingAssessment}
            onAccept={onAccept}
            onProposeTime={onProposeTime}
            onCancelProposal={onCancelProposal}
          />
        ))}
      </div>
    </div>
  );
};

// ── CALENDAR view (month grid + selected-day events) ──────────────────────
interface CalendarBodyProps {
  monthAnchor: Date;
  setMonthAnchor: (d: Date) => void;
  selectedDay: Date;
  setSelectedDay: (d: Date) => void;
  today: Date;
  monthGrid: Date[];
  eventsByDay: Map<string, ScheduleEvent[]>;
  selectedDayEvents: ScheduleEvent[];
  currentUserId: number;
  isUpdatingAssessment: boolean;
  isDeletingAssessment: boolean;
  onAccept: (event: ScheduleEvent) => void;
  onProposeTime: (event: ScheduleEvent) => void;
  onCancelProposal: (event: ScheduleEvent) => void;
}

const CalendarBody: React.FC<CalendarBodyProps> = ({
  monthAnchor,
  setMonthAnchor,
  selectedDay,
  setSelectedDay,
  today,
  monthGrid,
  eventsByDay,
  selectedDayEvents,
  currentUserId,
  isUpdatingAssessment,
  isDeletingAssessment,
  onAccept,
  onProposeTime,
  onCancelProposal,
}) => {
  const monthLabel = `${MONTH_NAMES[monthAnchor.getMonth()]} ${monthAnchor.getFullYear()}`;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Month nav */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-border/60 flex-shrink-0">
        <button
          onClick={() => setMonthAnchor(addMonths(monthAnchor, -1))}
          aria-label="Previous month"
          className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground tabular-nums">{monthLabel}</h3>
          {!isSameMonth(monthAnchor, today) && (
            <button
              onClick={() => {
                setMonthAnchor(startOfMonth(today));
                setSelectedDay(today);
              }}
              className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
            >
              Today
            </button>
          )}
        </div>
        <button
          onClick={() => setMonthAnchor(addMonths(monthAnchor, 1))}
          aria-label="Next month"
          className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 px-3 pt-2 pb-1 flex-shrink-0">
        {WEEK_LABELS.map((w, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1 px-3 pb-3 flex-shrink-0">
        {monthGrid.map((d) => {
          const inMonth = isSameMonth(d, monthAnchor);
          const isToday = isSameDay(d, today);
          const isSelected = isSameDay(d, selectedDay);
          const dayEvents = eventsByDay.get(dayKey(d)) || [];
          const hasEvents = dayEvents.length > 0;
          const isPast = d < today && !isToday;

          // Up to 3 dots; show "+N" overflow if more
          const visibleDots = dayEvents.slice(0, 3);
          const overflow = Math.max(0, dayEvents.length - 3);

          return (
            <button
              key={dayKey(d)}
              onClick={() => setSelectedDay(d)}
              className={`relative h-11 rounded-lg flex flex-col items-center justify-start py-1 transition-colors
                ${isSelected
                  ? "bg-primary text-primary-foreground"
                  : isToday
                  ? "bg-primary/10 text-foreground hover:bg-primary/15"
                  : inMonth
                  ? "text-foreground hover:bg-muted/60"
                  : "text-muted-foreground/40 hover:bg-muted/40"
                }
                ${isPast && !isSelected && inMonth ? "text-muted-foreground/60" : ""}`}
              aria-label={`${d.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}${hasEvents ? `, ${dayEvents.length} visit${dayEvents.length !== 1 ? "s" : ""}` : ""}`}
            >
              <span
                className={`text-xs tabular-nums leading-tight ${
                  isToday && !isSelected ? "font-bold" : "font-semibold"
                }`}
              >
                {d.getDate()}
              </span>
              {/* Event indicator: dots row */}
              {hasEvents && (
                <div className="absolute bottom-1 inline-flex items-center gap-[2px]">
                  {visibleDots.map((e, idx) => (
                    <span
                      key={idx}
                      className={`w-[5px] h-[5px] rounded-full ${
                        isSelected ? "bg-primary-foreground/90" : dotColorClass(e, currentUserId)
                      }`}
                    />
                  ))}
                  {overflow > 0 && (
                    <span
                      className={`text-[8px] font-bold leading-none ${
                        isSelected ? "text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >
                      +{overflow}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected-day events — flex-1 so any leftover card height is absorbed
          here. Scrolls when a day has lots of visits. */}
      <div className="border-t border-border/60 bg-muted/20 flex-1 flex flex-col min-h-0">
        <div className="px-5 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {selectedDay.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
            {isSameDay(selectedDay, today) && (
              <span className="ml-1.5 text-primary">· Today</span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {selectedDayEvents.length === 0
              ? "Nothing scheduled"
              : `${selectedDayEvents.length} visit${selectedDayEvents.length !== 1 ? "s" : ""}`}
          </div>
        </div>
        <div className="px-3 pb-3 flex-1 overflow-y-auto min-h-0">
          {selectedDayEvents.length === 0 ? (
            <div className="flex items-center gap-3 px-2 py-3 text-xs text-muted-foreground">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-muted-foreground/50" />
              <span>No visits on this day.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  currentUserId={currentUserId}
                  isUpdatingAssessment={isUpdatingAssessment}
                  isDeletingAssessment={isDeletingAssessment}
                  onAccept={onAccept}
                  onProposeTime={onProposeTime}
                  onCancelProposal={onCancelProposal}
                  compact
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Shared event row used by both views ───────────────────────────────────
interface EventRowProps {
  event: ScheduleEvent;
  currentUserId: number;
  isUpdatingAssessment: boolean;
  isDeletingAssessment: boolean;
  onAccept: (event: ScheduleEvent) => void;
  onProposeTime: (event: ScheduleEvent) => void;
  onCancelProposal: (event: ScheduleEvent) => void;
  /** Slightly tighter spacing for use inside the calendar view's day list. */
  compact?: boolean;
}

const EventRow: React.FC<EventRowProps> = ({
  event,
  currentUserId,
  isUpdatingAssessment,
  isDeletingAssessment,
  onAccept,
  onProposeTime,
  onCancelProposal,
  compact = false,
}) => {
  const isPending = event.status === IssueAssessmentStatus.RECEIVED;
  const isOwnProposal = isPending && event.user_id === currentUserId;
  const isVendorProposal = isPending && event.user_id !== currentUserId;

  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isToday = isSameDay(event.start, today);
  const isTomorrow = isSameDay(event.start, tomorrow);
  const dateLabel = isToday
    ? "Today"
    : isTomorrow
    ? "Tomorrow"
    : event.start.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
  const timeLabel = event.start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      className={`rounded-xl hover:bg-muted/40 transition-colors ${
        compact ? "p-2.5" : "p-3"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`bg-muted rounded-lg flex items-center justify-center flex-shrink-0 ${
            compact ? "w-8 h-8" : "w-9 h-9"
          }`}
        >
          <FontAwesomeIcon
            icon={getIssueTypeIcon(event.issue?.type)}
            className="text-muted-foreground text-sm"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <div className="text-sm font-semibold text-foreground truncate">{event.title}</div>
            {isOwnProposal ? (
              <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded bg-primary/10 text-primary">
                Your proposal
              </span>
            ) : isVendorProposal ? (
              <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded bg-amber-100 text-amber-700">
                Pending
              </span>
            ) : (
              <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded bg-emerald-100 text-emerald-700">
                Confirmed
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate mb-2">
            {event.listing?.address?.split(",")[0] || "Property"}
            {" · "}
            {dateLabel} at {timeLabel}
            {event.vendor?.name ? ` · ${event.vendor.name}` : ""}
          </div>

          {isVendorProposal && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAccept(event)}
                disabled={isUpdatingAssessment}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-foreground text-background text-xs font-semibold rounded-md ${BUTTON_HOVER} disabled:opacity-50`}
              >
                <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                {isUpdatingAssessment ? "Accepting…" : "Accept"}
              </button>
              <button
                onClick={() => onProposeTime(event)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted text-foreground text-xs font-semibold rounded-md hover:bg-muted/70 transition-colors"
              >
                <FontAwesomeIcon icon={faEdit} className="text-[10px]" />
                Propose new
              </button>
            </div>
          )}
          {isOwnProposal && (
            <button
              onClick={() => onCancelProposal(event)}
              disabled={isDeletingAssessment}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
              {isDeletingAssessment ? "Cancelling…" : "Cancel proposal"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleCard;
