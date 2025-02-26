import React, { useRef, useState } from "react";
import moment from "moment";
import { CalendarEvent } from "../types";
import Dropdown from "./Dropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";

interface AgendaProps {
  events: CalendarEvent[];
}

const Agenda: React.FC<AgendaProps> = ({ events }) => {
  const [tableDropdownOpen, setTableDropdownOpen] = useState<string | null>(
    null
  );

  const tableDropdownButtonRefs = useRef(new Map());

  const handleOpenTableDropdown = (id: string) => {
    setTableDropdownOpen((prev) => (prev === id ? null : id)); // Toggle specific issue dropdown
  };

  const formatBookingDate = (start: Date, end: Date) => {
    const isToday = moment(start).isSame(moment(), "day");
    const dayLabel = isToday ? "Today" : moment(start).format("dddd, MMM D");

    return `${dayLabel}, ${moment(start).format("h:mm A")} - ${moment(
      end
    ).format("h:mm A")}`;
  };

  return (
    <>
      {events.map((event) => (
        <div className="event-item flex items-center justify-between gap-4 pb-4 mb-4 border-b border-neutral-200">
          <div className="">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 bg-yellow-500 rounded-full font-medium"></span>
              <span className="text-secondary-light">
                {formatBookingDate(event.start, event.end)}
              </span>
            </div>
            <span className="text-neutral-600 font-semibold text-base mt-1.5">
              {event.title}
            </span>
          </div>
          <div className="dropdown">
            <button
              className="focus:ring-4 focus:outline-none focus:ring-gray-100 hover:bg-gray-100 font-medium rounded-lg px-3.5 py-1 text-neutral-700 text-lg"
              type="button"
              ref={(el) => {
                if (el) tableDropdownButtonRefs.current.set(event.id, el);
              }}
              onClick={() => handleOpenTableDropdown(event.id)}
            >
              <FontAwesomeIcon icon={faEllipsisVertical} />
            </button>

            {tableDropdownOpen === event.id && (
              <Dropdown
                buttonRef={{
                  current: tableDropdownButtonRefs.current.get(event.id),
                }}
                onClose={() => setTableDropdownOpen(null)}
              >
                {["Accept", "Counter", "Reject"].map((action) => (
                  <button
                    key={action}
                    className={`block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left`}
                    onClick={() => {
                      setTableDropdownOpen(null);
                    }}
                  >
                    {action}
                  </button>
                ))}
              </Dropdown>
            )}
          </div>
        </div>
      ))}
    </>
  );
};

export default Agenda;
