import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  ScheduleEvent,
  startOfDay,
  startOfMonth,
  addMonths,
  dayKey,
  isSameMonth,
  isSameDay,
  WEEK_LABELS,
  MONTH_NAMES,
  scheduleDotColor,
  isReceivedStatus,
  getIssueTypeIonicon,
} from "@inspectly/shared";
import { DashboardSectionCard } from "./DashboardSectionCard";

type ViewMode = "list" | "calendar";

interface ScheduleCardProps {
  events: ScheduleEvent[];
  currentUserId: number;
  isUpdatingAssessment?: boolean;
  isDeletingAssessment?: boolean;
  onAccept: (event: ScheduleEvent) => void;
  onProposeTime: (event: ScheduleEvent) => void;
  onCancelProposal: (event: ScheduleEvent) => void;
  onViewAll?: () => void;
  /** When true, show all events in list view (full schedule screen). */
  expanded?: boolean;
}

export function ScheduleCard({
  events,
  currentUserId,
  isUpdatingAssessment = false,
  isDeletingAssessment = false,
  onAccept,
  onProposeTime,
  onCancelProposal,
  onViewAll,
  expanded = false,
}: ScheduleCardProps) {
  const [view, setView] = useState<ViewMode>(events.length === 0 ? "list" : "calendar");
  const today = useMemo(() => startOfDay(new Date()), []);
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(today));
  const [selectedDay, setSelectedDay] = useState(() => {
    const next = events.find((e) => startOfDay(e.start) >= today);
    return next ? startOfDay(next.start) : today;
  });
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

  const eventsByDay = useMemo(() => {
    const m = new Map<string, ScheduleEvent[]>();
    events.forEach((e) => {
      const k = dayKey(e.start);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    });
    m.forEach((list) => list.sort((a, b) => a.start.getTime() - b.start.getTime()));
    return m;
  }, [events]);

  const monthGrid = useMemo(() => {
    const first = startOfMonth(monthAnchor);
    const startWeekday = first.getDay();
    const gridStart = new Date(first);
    gridStart.setDate(gridStart.getDate() - startWeekday);
    return Array.from({ length: 42 }, (_, i) =>
      new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
    );
  }, [monthAnchor]);

  const selectedDayEvents = eventsByDay.get(dayKey(selectedDay)) || [];
  const listEvents = expanded ? events : events.slice(0, 6);

  return (
    <DashboardSectionCard>
      {/* Header */}
      <View className="px-4 py-4 border-b border-border/60 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 flex-1 min-w-0">
          <View className="w-9 h-9 rounded-lg bg-primary/10 items-center justify-center">
            <Ionicons name="calendar" size={18} color="#D4A853" />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-base font-semibold text-foreground">Your Schedule</Text>
            <Text className="text-[11px] text-muted-foreground uppercase tracking-wider">
              {events.length === 0
                ? "All clear"
                : `${events.length} upcoming visit${events.length !== 1 ? "s" : ""}`}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          {!expanded && events.length > 5 && onViewAll && (
            <TouchableOpacity onPress={onViewAll}>
              <Text className="text-xs font-semibold text-muted-foreground">View all</Text>
            </TouchableOpacity>
          )}
          <View className="flex-row bg-muted/60 rounded-lg p-0.5">
              <TouchableOpacity
                onPress={() => setView("list")}
                className={`p-1.5 rounded-md ${view === "list" ? "bg-white" : ""}`}
              >
                <Ionicons
                  name="list"
                  size={14}
                  color={view === "list" ? "#111827" : "#6B7280"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setView("calendar")}
                className={`p-1.5 rounded-md ${view === "calendar" ? "bg-white" : ""}`}
              >
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={view === "calendar" ? "#111827" : "#6B7280"}
                />
              </TouchableOpacity>
            </View>
        </View>
      </View>

      {view === "list" ? (
        <ListBody
          events={listEvents}
          currentUserId={currentUserId}
          isUpdatingAssessment={isUpdatingAssessment}
          isDeletingAssessment={isDeletingAssessment}
          onAccept={onAccept}
          onProposeTime={onProposeTime}
          onCancelProposal={onCancelProposal}
          emptyMessage="Visit times will appear here once visits are confirmed."
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
    </DashboardSectionCard>
  );
}

interface ListBodyProps {
  events: ScheduleEvent[];
  currentUserId: number;
  isUpdatingAssessment: boolean;
  isDeletingAssessment: boolean;
  onAccept: (event: ScheduleEvent) => void;
  onProposeTime: (event: ScheduleEvent) => void;
  onCancelProposal: (event: ScheduleEvent) => void;
  emptyMessage?: string;
}

function ListBody({
  events,
  currentUserId,
  isUpdatingAssessment,
  isDeletingAssessment,
  onAccept,
  onProposeTime,
  onCancelProposal,
  emptyMessage = "Your schedule is clear",
}: ListBodyProps) {
  if (events.length === 0) {
    return (
      <View className="p-4 flex-row items-center gap-3">
        <View className="w-9 h-9 rounded-lg bg-muted/60 items-center justify-center">
          <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">Your schedule is clear</Text>
          <Text className="text-xs text-muted-foreground">{emptyMessage}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="max-h-80 p-3" nestedScrollEnabled>
      {events.map((event) => (
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
    </ScrollView>
  );
}

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

function CalendarBody({
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
}: CalendarBodyProps) {
  const monthLabel = `${MONTH_NAMES[monthAnchor.getMonth()]} ${monthAnchor.getFullYear()}`;

  return (
    <View>
      <View className="px-4 py-3 flex-row items-center justify-between border-b border-border">
        <TouchableOpacity
          onPress={() => setMonthAnchor(addMonths(monthAnchor, -1))}
          className="w-7 h-7 rounded-md items-center justify-center"
        >
          <Ionicons name="chevron-back" size={18} color="#6B7280" />
        </TouchableOpacity>
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-semibold text-foreground">{monthLabel}</Text>
          {!isSameMonth(monthAnchor, today) && (
            <TouchableOpacity
              onPress={() => {
                setMonthAnchor(startOfMonth(today));
                setSelectedDay(today);
              }}
            >
              <Text className="text-[10px] font-bold uppercase text-primary">Today</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => setMonthAnchor(addMonths(monthAnchor, 1))}
          className="w-7 h-7 rounded-md items-center justify-center"
        >
          <Ionicons name="chevron-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View className="flex-row px-2 pt-2 pb-1">
        {WEEK_LABELS.map((w, i) => (
          <Text
            key={i}
            className="flex-1 text-center text-[10px] font-bold uppercase text-muted-foreground/70"
          >
            {w}
          </Text>
        ))}
      </View>

      <View className="flex-row flex-wrap px-2 pb-3">
        {monthGrid.map((d) => {
          const inMonth = isSameMonth(d, monthAnchor);
          const isToday = isSameDay(d, today);
          const isSelected = isSameDay(d, selectedDay);
          const dayEvents = eventsByDay.get(dayKey(d)) || [];
          const hasEvents = dayEvents.length > 0;
          const isPast = d < today && !isToday;
          const visibleDots = dayEvents.slice(0, 3);
          const overflow = Math.max(0, dayEvents.length - 3);

          return (
            <TouchableOpacity
              key={dayKey(d)}
              onPress={() => setSelectedDay(d)}
              style={{ width: `${100 / 7}%` }}
              className={`h-11 items-center justify-start py-1 rounded-lg ${
                isSelected ? "bg-primary" : isToday ? "bg-primary/10" : ""
              }`}
            >
              <Text
                className={`text-xs ${
                  isSelected
                    ? "text-white font-semibold"
                    : isPast && inMonth
                    ? "text-muted-foreground/60"
                    : inMonth
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground/40"
                }`}
              >
                {d.getDate()}
              </Text>
              {hasEvents && (
                <View className="flex-row items-center mt-0.5 gap-[2px]">
                  {visibleDots.map((e, idx) => (
                    <View
                      key={idx}
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 999,
                        backgroundColor: isSelected
                          ? "rgba(255,255,255,0.9)"
                          : scheduleDotColor(e, currentUserId),
                      }}
                    />
                  ))}
                  {overflow > 0 && (
                    <Text
                      className={`text-[8px] font-bold ${
                        isSelected ? "text-white" : "text-muted-foreground"
                      }`}
                    >
                      +{overflow}
                    </Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="border-t border-border bg-muted/20">
        <View className="px-4 py-2.5 flex-row items-center justify-between">
          <Text className="text-[11px] font-bold uppercase text-muted-foreground">
            {selectedDay.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
            {isSameDay(selectedDay, today) && (
              <Text className="text-primary"> · Today</Text>
            )}
          </Text>
          <Text className="text-[11px] text-muted-foreground">
            {selectedDayEvents.length === 0
              ? "Nothing scheduled"
              : `${selectedDayEvents.length} visit${selectedDayEvents.length !== 1 ? "s" : ""}`}
          </Text>
        </View>
        <ScrollView className="max-h-48 px-3 pb-3" nestedScrollEnabled>
          {selectedDayEvents.length === 0 ? (
            <View className="flex-row items-center gap-2 px-2 py-3">
              <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
              <Text className="text-xs text-muted-foreground">No visits on this day.</Text>
            </View>
          ) : (
            selectedDayEvents.map((event) => (
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
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

interface EventRowProps {
  event: ScheduleEvent;
  currentUserId: number;
  isUpdatingAssessment: boolean;
  isDeletingAssessment: boolean;
  onAccept: (event: ScheduleEvent) => void;
  onProposeTime: (event: ScheduleEvent) => void;
  onCancelProposal: (event: ScheduleEvent) => void;
  compact?: boolean;
}

function EventRow({
  event,
  currentUserId,
  isUpdatingAssessment,
  isDeletingAssessment,
  onAccept,
  onProposeTime,
  onCancelProposal,
  compact = false,
}: EventRowProps) {
  const isPending = isReceivedStatus(event.status as string);
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

  const statusPill = isOwnProposal ? (
    <View className="bg-primary/10 px-2 py-0.5 rounded">
      <Text className="text-[10px] font-bold uppercase text-primary">Your proposal</Text>
    </View>
  ) : isVendorProposal ? (
    <View className="bg-amber-100 px-2 py-0.5 rounded">
      <Text className="text-[10px] font-bold uppercase text-amber-700">Pending</Text>
    </View>
  ) : (
    <View className="bg-emerald-100 px-2 py-0.5 rounded">
      <Text className="text-[10px] font-bold uppercase text-emerald-700">Confirmed</Text>
    </View>
  );

  return (
    <View className={`rounded-xl ${compact ? "p-2.5" : "p-3"} mb-1`}>
      <View className="flex-row items-start gap-3">
        <View
          className={`bg-muted rounded-lg items-center justify-center ${
            compact ? "w-8 h-8" : "w-9 h-9"
          }`}
        >
          <Ionicons
            name={getIssueTypeIonicon(event.issue?.type) as any}
            size={compact ? 14 : 16}
            color="#6B7280"
          />
        </View>
        <View className="flex-1 min-w-0">
          <View className="flex-row items-start justify-between gap-2 mb-0.5">
            <Text className="text-sm font-semibold text-foreground flex-1" numberOfLines={1}>
              {event.title}
            </Text>
            {statusPill}
          </View>
          <Text className="text-xs text-muted-foreground mb-2" numberOfLines={2}>
            {event.listing?.address?.split(",")[0] || "Property"}
            {" · "}
            {dateLabel} at {timeLabel}
          </Text>

          {isVendorProposal && (
            <View className="flex-row items-center gap-2 flex-wrap">
              <TouchableOpacity
                onPress={() => onAccept(event)}
                disabled={isUpdatingAssessment}
                className="flex-row items-center gap-1 px-2.5 py-1 bg-foreground rounded-md"
              >
                {isUpdatingAssessment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                    <Text className="text-xs font-semibold text-white">Accept</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onProposeTime(event)}
                className="flex-row items-center gap-1 px-2.5 py-1 bg-muted rounded-md"
              >
                <Ionicons name="create-outline" size={12} color="#111827" />
                <Text className="text-xs font-semibold text-foreground">Propose new</Text>
              </TouchableOpacity>
            </View>
          )}
          {isOwnProposal && (
            <TouchableOpacity
              onPress={() => onCancelProposal(event)}
              disabled={isDeletingAssessment}
              className="flex-row items-center gap-1 self-start px-2.5 py-1"
            >
              <Ionicons name="trash-outline" size={12} color="#dc2626" />
              <Text className="text-xs font-semibold text-red-600">
                {isDeletingAssessment ? "Cancelling…" : "Cancel proposal"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
