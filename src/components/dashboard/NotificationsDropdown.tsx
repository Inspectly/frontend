import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check } from "lucide-react";
import {
  ACTIVITY_META,
  ActivityItem,
  formatActivityRelativeTime,
} from "../../utils/dashboardActivity";

interface NotificationsDropdownProps {
  /** Pre-built activity items (use `buildDashboardActivity`). */
  items: ActivityItem[];
}

const LAST_SEEN_KEY = "inspectly:notifications:last_seen_ts";

/**
 * Bell + dropdown panel. Uses a localStorage timestamp to compute the "unread"
 * count — anything newer than the last time the user opened this dropdown
 * counts as unread. Marking-as-read is implicit on open. Cheap, persistent,
 * survives page reloads.
 */
const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ items }) => {
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const raw = window.localStorage.getItem(LAST_SEEN_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Unread = items newer than the last seen timestamp.
  const unreadCount = useMemo(
    () => items.filter((i) => i.ts > lastSeen).length,
    [items, lastSeen]
  );

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markAllRead = () => {
    const now = Date.now();
    setLastSeen(now);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LAST_SEEN_KEY, String(now));
    }
  };

  // Opening the dropdown is an implicit "mark as read" — keeps the badge from
  // feeling stuck after you've clearly looked at the feed.
  const handleToggle = () => {
    if (!open && unreadCount > 0) markAllRead();
    setOpen(!open);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleToggle}
        className="group relative inline-flex items-center justify-center w-10 h-10 bg-card border border-border rounded-lg text-foreground hover:bg-muted transition-colors shadow-sm"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1
                       inline-flex items-center justify-center
                       text-[10px] font-bold tabular-nums
                       bg-rose-500 text-white rounded-full
                       ring-2 ring-card"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)]
                     bg-card rounded-xl shadow-card-hover border border-border
                     overflow-hidden z-50 flex flex-col"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                Notifications
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {items.length === 0
                  ? "Nothing yet"
                  : `${items.length} recent update${items.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            {items.length > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Body — scrollable activity feed */}
          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-5 h-5 text-muted-foreground/70" />
                </div>
                <div className="text-sm font-semibold text-foreground">All caught up</div>
                <p className="text-xs text-muted-foreground mt-1 max-w-[260px] mx-auto">
                  We'll let you know when quotes arrive, visits get scheduled, or reports
                  are uploaded.
                </p>
              </div>
            ) : (
              <ul className="relative py-2">
                {items.map((item, idx) => {
                  const meta = ACTIVITY_META[item.kind];
                  const Icon = meta.icon;
                  const isClickable = !!item.onClick;
                  const isUnread = item.ts > lastSeen;
                  const Wrapper: React.ElementType = isClickable ? "button" : "div";
                  return (
                    <li key={item.id} className="relative">
                      {/* timeline connector */}
                      {idx < items.length - 1 && (
                        <span
                          aria-hidden
                          className="absolute left-[26px] top-9 bottom-0 w-px bg-border/60"
                        />
                      )}
                      <Wrapper
                        onClick={() => {
                          item.onClick?.();
                          setOpen(false);
                        }}
                        className={`relative w-full flex items-start gap-3 px-4 py-2.5 text-left ${
                          isClickable ? "hover:bg-muted/50 transition-colors cursor-pointer" : ""
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0 ring-2 ring-card`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="text-xs leading-snug">{item.title}</div>
                          {item.subtitle && (
                            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0 pt-1">
                          <span className="text-[10px] font-semibold text-muted-foreground/70 tabular-nums">
                            {formatActivityRelativeTime(item.ts)}
                          </span>
                          {isUnread && (
                            <span
                              className="w-2 h-2 rounded-full bg-primary"
                              aria-label="Unread"
                            />
                          )}
                        </div>
                      </Wrapper>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
