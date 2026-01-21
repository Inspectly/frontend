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
      min_assessment_time = 30,
      title = "Assessment Appointment",
      description = "Your scheduled assessment slot.",
      location = "Online",
    } = assessment;
  
    const start = new Date(start_time);
    const end = new Date(end_time);
  
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
  