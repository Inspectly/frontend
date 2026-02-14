/**
 * Parse assessment time strings. Times are stored in local time (from toLocalISOString)
 * without timezone - e.g. "2025-02-15T18:00:00" means 6pm in the user's local timezone.
 * Only append "Z" (interpret as UTC) when the string already has explicit UTC marker.
 */
export const parseAsUTC = (timeStr: string): Date => {
  if (!timeStr) return new Date();
  // Has timezone (Z or ±offset)? Parse as-is. Otherwise parse as local (no Z appendix).
  if (timeStr.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(timeStr)) {
    return new Date(timeStr);
  }
  return new Date(timeStr); // No TZ = local time
};

export function generateCalendarLinks(assessment: {
    start_time: string;
    end_time: string;
    min_assessment_time?: number;
    title?: string;
    location?: string;
    description?: string;
  }) {
    const {
      start_time,
      end_time,
      title = "Assessment Appointment",
      description = "Your scheduled assessment slot.",
      location = "Online",
    } = assessment;
  
    const start = parseAsUTC(start_time);
    const end = parseAsUTC(end_time);
  
    const formatDateForCalendar = (date: Date) =>
      date.toISOString().replace(/[-:]|\.\d{3}/g, "");
  
    const formattedStart = formatDateForCalendar(start);
    const formattedEnd = formatDateForCalendar(end);
  
    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(
      location
    )}&dates=${formattedStart}/${formattedEnd}`;
  
    const ics = `BEGIN:VCALENDAR
        VERSION:2.0
        PRODID:-//Your App//Assessment Scheduler//EN
        BEGIN:VEVENT
        UID:${formattedStart}@yourapp.com
        DTSTAMP:${formattedStart}
        DTSTART:${formattedStart}
        DTEND:${formattedEnd}
        SUMMARY:${title}
        DESCRIPTION:${description}
        LOCATION:${location}
        END:VEVENT
        END:VCALENDAR`;
  
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const icsUrl = URL.createObjectURL(blob);
  
    return { googleCalendarUrl, icsUrl };
  }
  