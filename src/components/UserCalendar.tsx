import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../styles/Calendar.css"; // Tailwind styles

const localizer = momentLocalizer(moment);

// Define event type
interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
}

const UserCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentView, setCurrentView] = useState<View>(Views.MONTH); // Track the active view

  // Custom event component for Month View
  const EventComponent = ({ event }: { event: any }) => {
    const timeFormat = moment(event.start).format("hA"); // e.g., "10AM", "2PM"
    const eventTime = timeFormat.replace("AM", "A").replace("PM", "P"); // Convert "AM" to "A" and "PM" to "P"

    return (
      <span>
        <strong>{eventTime} </strong>
        {event.title}
      </span>
    );
  };

  useEffect(() => {
    // Dummy data to simulate user bookings
    const dummyBookings: CalendarEvent[] = [
      {
        title: "Plumbing Repair Appointment",
        start: new Date("2025-02-15T10:00:00"),
        end: new Date("2025-02-15T11:00:00"),
      },
      {
        title: "Electrical Wiring Fix",
        start: new Date("2025-02-20T14:00:00"),
        end: new Date("2025-02-20T15:00:00"),
      },
      {
        title: "AC Maintenance",
        start: new Date("2025-02-25T09:30:00"),
        end: new Date("2025-02-25T10:30:00"),
      },
    ];

    setEvents(dummyBookings);
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="font-bold text-lg mb-4">Your Upcoming Bookings</h2>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        view={currentView} // Track the current view
        onView={(view) => setCurrentView(view)} // Update state when view changes
        formats={{
          timeGutterFormat: (date) =>
            currentView === Views.WEEK
              ? moment(date).format("h:mm") // Removes AM/PM only in week view
              : moment(date).format("h:mm A"), // Keeps AM/PM in other views

          eventTimeRangeFormat: ({ start, end }) =>
            currentView === Views.WEEK
              ? `${moment(start).format("h:mm")} – ${moment(end).format(
                  "h:mm"
                )}` // No AM/PM in week view
              : `${moment(start).format("h:mm A")} – ${moment(end).format(
                  "h:mm A"
                )}`, // AM/PM in other views
        }}
        components={{
          event: currentView === Views.MONTH ? EventComponent : undefined, // Apply only in Month View
        }}
      />
    </div>
  );
};

export default UserCalendar;
