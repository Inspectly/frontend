import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  useCreateAssessmentMutation,
  useDeleteAssessmentMutation,
  useLazyGetAssessmentsByUsersInteractionIdQuery,
  useUpdateAssessmentMutation,
} from "../features/api/issueAssessmentsApi";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import {
  CalendarReadyAssessment,
  ISSUE_ASSESSMENT_STATUS_LABELS,
  IssueAssessment,
  IssueAssessmentStatus,
  UserType,
} from "../types";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { nanoid } from "nanoid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckDouble, faXmark } from "@fortawesome/free-solid-svg-icons";

const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop<CalendarReadyAssessment>(Calendar);

interface CalendarSelectorProps {
  issueId: number;
  onSubmitted?: () => void;
  existingAssessments?: CalendarReadyAssessment[];
  assessmentsLoading?: boolean;
  mode?: "vendor" | "client";
  userId?: number;
  vendorId?: number;
  usersInteractionId?: string;
  minDuration?: number;
  onClose?: () => void;
  onLocalDelete?: (deletedId: number) => void;
}

const CalendarSelector: React.FC<CalendarSelectorProps> = ({
  issueId,
  onSubmitted,
  existingAssessments = [],
  assessmentsLoading,
  mode = "vendor",
  userId: passedUserId,
  usersInteractionId,
  minDuration,
  onClose,
  onLocalDelete,
}) => {
  const defaultUserId = useSelector((state: RootState) => state.auth.user?.id);
  const userId = passedUserId || defaultUserId;

  const [createAssessment] = useCreateAssessmentMutation();
  const [deleteAssessment] = useDeleteAssessmentMutation();
  const [updateAssessment] = useUpdateAssessmentMutation();
  const [fetchAssessmentsByUsersInteraction] =
    useLazyGetAssessmentsByUsersInteractionIdQuery();

  const [events, setEvents] = useState<CalendarReadyAssessment[]>([]);
  const [minTime, setMinTime] = useState<string>("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function toLocalISOString(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}T${String(
      date.getHours()
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:00`;
  }

  const handleSubmit = async () => {
    const minDur = mode === "vendor" ? parseInt(minTime) : minDuration || 0;
    const newEvents = events.filter((e) => e.isNew);
    const editedEvents = events.filter((e) => e.isEdited);
    const invalidAssessments = [...newEvents, ...editedEvents].filter(
      (event) =>
        (new Date(event.end).getTime() - new Date(event.start).getTime()) /
          60000 <
        minDur
    );

    if (!newEvents.length && !editedEvents.length) {
      setError("No new time slots to submit.");
      return;
    }
    if (!minDur || minDur <= 0) {
      setError("Please enter a valid minimum duration.");
      return;
    }
    if (invalidAssessments.length > 0) {
      setError(`All time assessments must be at least ${minDur} minutes long.`);
      return;
    }

    try {
      await Promise.all([
        ...newEvents.map((event) =>
          createAssessment({
            issue_id: issueId,
            user_id: userId!,
            user_type: mode,
            interaction_id: usersInteractionId!,
            users_interaction_id: usersInteractionId!,
            start_time: event.start_time,
            end_time: event.end_time,
            status: "received",
            min_assessment_time: minDur,
          })
        ),
        ...editedEvents.map((event) =>
          updateAssessment({
            id: event.id,
            issue_id: issueId,
            user_id: userId!,
            user_type: mode,
            interaction_id: usersInteractionId!,
            users_interaction_id: usersInteractionId!,
            start_time: event.start_time,
            end_time: event.end_time,
            status: "received",
            min_assessment_time: minDur,
          })
        ),
      ]);

      setError("");
      setSuccessMessage("Time slots submitted successfully!");
      setTimeout(() => setSuccessMessage(null), 2500);
      if (onSubmitted) onSubmitted();
      if (onClose) onClose();
    } catch (err) {
      console.error("Failed to submit assessment:", err);
      setError("Submission failed. Try again.");
    }
  };

  const handleDelete = async (event: CalendarReadyAssessment) => {
    if (window.confirm("Delete this time slot?")) {
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      if (!event.isNew && event.user_id === userId) {
        try {
          await deleteAssessment({
            id: Number(event.id),
            issue_id: issueId,
            interaction_id: usersInteractionId!,
          });

          setError("");
          setSuccessMessage("Time slot deleted.");
          setTimeout(() => setSuccessMessage(null), 2500);
          // if (onSubmitted) onSubmitted();
          if (onLocalDelete) {
            onLocalDelete(Number(event.id));
          }
        } catch (err) {
          console.error("Failed to delete assessment:", err);
          setError("Deletion failed. Try again.");
        }
      }
    }
  };

  useEffect(() => {
    if (usersInteractionId) {
      fetchAssessmentsByUsersInteraction(usersInteractionId).then((res) => {
        if (res?.data && res.data.length > 0) {
          const mapped = res.data.map((a: IssueAssessment) => ({
            ...a,
            title: ISSUE_ASSESSMENT_STATUS_LABELS[a.status],
            start: new Date(a.start_time),
            end: new Date(a.end_time),
            isNew: false,
          }));
          setEvents(mapped);
        }
      });
    } else if (existingAssessments && existingAssessments.length > 0) {
      setEvents(
        existingAssessments.map((a) => ({
          ...a,
          title: ISSUE_ASSESSMENT_STATUS_LABELS[a.status],
          start: new Date(a.start_time),
          end: new Date(a.end_time),
          isNew: false,
        }))
      );
    }
  }, [usersInteractionId, JSON.stringify(existingAssessments)]);

  return (
    <div className="p-6 bg-white rounded-lg relative">
      <h2 className="text-lg font-semibold mb-4">Select Availability</h2>

      {assessmentsLoading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )}

      {mode === "vendor" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Time Required (minutes):
          </label>
          <input
            type="number"
            value={minTime}
            onChange={(e) => setMinTime(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="e.g. 120"
            min={1}
          />
        </div>
      )}

      {successMessage && (
        <div
          className="fixed top-4 inset-x-0 mx-auto z-50 w-[400px] md:w-auto
                 alert alert-success bg-green-100 text-green-700
                 border-l-4 border-green-500 px-6 py-3 mb-4 font-semibold
                 text-base rounded shadow flex items-center justify-between animate-fade"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faCheckDouble} className="text-green-600" />
            {successMessage}
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="remove-button text-green-600 text-2xl line-height-1"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      )}

      <DragAndDropCalendar
        localizer={localizer}
        events={events}
        defaultView="week"
        views={["week", "day"]}
        step={30}
        timeslots={2}
        selectable
        onEventDrop={({ event, start, end }) => {
          if (event.user_id !== userId) return;
          setEvents((prev) =>
            prev.map((e) =>
              e.id === event.id
                ? {
                    ...e,
                    start: new Date(start),
                    end: new Date(end),
                    start_time: toLocalISOString(new Date(start)),
                    end_time: toLocalISOString(new Date(end)),
                    isEdited: !e.isNew,
                  }
                : e
            )
          );
        }}
        onEventResize={({ event, start, end }) => {
          if (event.user_id !== userId) return;
          setEvents((prev) =>
            prev.map((e) =>
              e.id === event.id
                ? {
                    ...e,
                    start: new Date(start),
                    end: new Date(end),
                    start_time: toLocalISOString(new Date(start)),
                    end_time: toLocalISOString(new Date(end)),
                    isEdited: !e.isNew,
                  }
                : e
            )
          );
        }}
        onSelectSlot={({ start, end }) => {
          const now = new Date();
          if (start < now) return;
          const newEvent: CalendarReadyAssessment = {
            id: nanoid(),
            title: "Available",
            start,
            end,
            issue_id: issueId,
            user_id: userId!,
            user_type: UserType[mode.toUpperCase() as keyof typeof UserType],
            interaction_id: usersInteractionId!,
            users_interaction_id: usersInteractionId!,
            start_time: toLocalISOString(new Date(start)),
            end_time: toLocalISOString(new Date(end)),
            status: IssueAssessmentStatus.RECEIVED,
            min_assessment_time: minDuration || parseInt(minTime) || 0,
            created_at: toLocalISOString(new Date()),
            updated_at: toLocalISOString(new Date()),
            isNew: true,
          };
          setEvents((prev) => [...prev, newEvent]);
        }}
        onSelectEvent={(event) => {
          if (event.user_id === userId) {
            handleDelete(event);
          }
        }}
        resizable
        tooltipAccessor={null}
        eventPropGetter={(event) => {
          let backgroundColor = "#e4f1ff"; // default blue
          let color = "#487fff";

          if (event.title === "Rejected") {
            backgroundColor = "#fee2e2"; // red
            color = "#dc2626";
          } else if (event.title === "Received") {
            backgroundColor = "#fef9c3"; // yellow
            color = "#ff9f29";
          } else if (event.title === "Accepted") {
            backgroundColor = "#dcfce7"; // green
            color = "#16a34a";
          }

          return {
            style: {
              backgroundColor,
              color,
              padding: "4px",
            },
          };
        }}
      />

      <p className="text-sm text-gray-500 mt-2">
        Tip: Click on the calendar to add time slots. Click again on any slot to
        remove it.
      </p>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Selected Availability</h3>
        {events.length === 0 ? (
          <p className="text-gray-500">No time slots selected yet.</p>
        ) : (
          <ul className="space-y-2">
            {[...events]
              .sort(
                (a, b) =>
                  new Date(a.start).getTime() - new Date(b.start).getTime()
              )
              .map((event) => (
                <li
                  key={event.id}
                  className="flex items-center justify-between p-2 bg-gray-50 border rounded"
                >
                  <span>
                    {event.title} —{" "}
                    <strong>
                      {new Date(event.start).toLocaleDateString(undefined, {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      {new Date(event.start).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}{" "}
                      to{" "}
                      {new Date(event.end).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </strong>
                  </span>
                  {event.user_id === userId && (
                    <button
                      onClick={() => handleDelete(event)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
          </ul>
        )}
      </div>
      <button
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleSubmit}
      >
        Send to {mode === "client" ? "Vendor" : "Client"}
      </button>
      {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
    </div>
  );
};

export default CalendarSelector;
