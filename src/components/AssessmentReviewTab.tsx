import React, { useEffect, useMemo, useState } from "react";
import {
  ISSUE_ASSESSMENT_STATUS_LABELS,
  IssueAssessment,
  IssueAssessmentStatus,
} from "../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAdd, faDownload } from "@fortawesome/free-solid-svg-icons";
import { generateCalendarLinks } from "../utils/calendarUtils";
import VendorName from "./VendorName";

type AssessmentReviewTabProps = {
  assessments: IssueAssessment[];
  onAccept: (
    accepted: IssueAssessment,
    rejected: IssueAssessment[]
  ) => Promise<void> | void;
  userId?: number | null;
  userType?: string;
  vendorIdToName: Record<number, string>;
  onlyShowVendorId?: number;
  assessmentsLoading?: boolean;
};

const AssessmentReviewTab: React.FC<AssessmentReviewTabProps> = ({
  assessments,
  onAccept,
  userId,
  userType,
  vendorIdToName,
  onlyShowVendorId,
  assessmentsLoading = false,
}) => {
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] =
    useState<IssueAssessment | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMinDuration, setModalMinDuration] = useState<number | null>(null);

  // Group by vendor
  const vendorGroups = useMemo(() => {
    const groups: Record<
      number,
      {
        vendorId: number;
        vendorName: string;
        assessments: IssueAssessment[];
        minDuration: number;
      }
    > = {};

    for (const a of assessments) {
      const parts = a.users_interaction_id?.split("_") || [];
      const vendorId = Number(parts[1]);
      if (!vendorId) continue;

      if (
        typeof onlyShowVendorId === "number" &&
        vendorId !== onlyShowVendorId
      ) {
        continue;
      }

      const vendorName = vendorIdToName[vendorId] || `Vendor ${vendorId}`;

      if (!groups[vendorId]) {
        groups[vendorId] = {
          vendorId,
          vendorName,
          assessments: [],
          minDuration: 0,
        };
      }

      groups[vendorId].assessments.push(a);
      groups[vendorId].minDuration = Math.max(
        groups[vendorId].minDuration || 0,
        a.min_assessment_time || 0
      );
    }

    // Sort each vendor's assessments by start time
    Object.values(groups).forEach((g) => {
      g.assessments.sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    });

    return groups;
  }, [assessments, onlyShowVendorId, vendorIdToName]);

  const vendorIds = useMemo(
    () =>
      Object.keys(vendorGroups)
        .map((id) => Number(id))
        .sort((a, b) => {
          const nameA = vendorGroups[a]?.vendorName?.toLowerCase() || "";
          const nameB = vendorGroups[b]?.vendorName?.toLowerCase() || "";
          return nameA.localeCompare(nameB);
        }),
    [vendorGroups]
  );

  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);

  useEffect(() => {
    if (vendorIds.length === 0) {
      setSelectedVendorId(null);
    } else if (!selectedVendorId || !vendorIds.includes(selectedVendorId)) {
      setSelectedVendorId(vendorIds[0]);
    }
  }, [vendorIds, selectedVendorId]);

  const getVendorLabel = (vendorId: number) =>
    vendorGroups[vendorId]?.vendorName ||
    vendorIdToName[vendorId] ||
    `Vendor #${vendorId}`;

  const formatRange = (startIso: string, endIso: string) => {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const sameDay =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();

    const datePart = start.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    const startTime = start.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    const endTime = end.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    if (sameDay) return `${datePart} ${startTime} – ${endTime}`;

    const endDatePart = end.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    return `${datePart}, ${startTime} → ${endDatePart}, ${endTime}`;
  };

  const statusColor = (status?: string | null) => {
    if (!status) return "text-yellow-600";
    const s = status.toLowerCase();
    if (s === IssueAssessmentStatus.ACCEPTED.toLowerCase())
      return "text-green-600";
    if (s === IssueAssessmentStatus.REJECTED.toLowerCase())
      return "text-red-600";
    if (s === IssueAssessmentStatus.RECEIVED.toLowerCase())
      return "text-yellow-600";
    return "text-gray-700";
  };

  const getAcceptedForVendor = (vendorId: number) =>
    (vendorGroups[vendorId]?.assessments || []).find(
      (a) => a.status === IssueAssessmentStatus.ACCEPTED
    );

  const finalizeAccept = async (
    assessment: IssueAssessment,
    vendorId: number
  ) => {
    const alreadyAccepted = assessments.find(
      (a) =>
        a.status === IssueAssessmentStatus.ACCEPTED &&
        a.id !== assessment.id &&
        Number(a.users_interaction_id.split("_")[1]) === vendorId
    );

    if (alreadyAccepted) {
      const confirmReplace = window.confirm(
        "There's already an accepted time for this vendor. Accepting this one will reject the other. Continue?"
      );
      if (!confirmReplace) return;
    }

    const rejected = assessments.filter(
      (a) =>
        a.id !== assessment.id &&
        Number(a.users_interaction_id.split("_")[1]) === vendorId &&
        a.status !== IssueAssessmentStatus.REJECTED
    );

    setIsSubmitting(true);
    try {
      await onAccept(assessment, rejected);
    } catch (err) {
      console.error("Error accepting assessment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccept = async (
    assessment: IssueAssessment,
    minDuration: number,
    vendorId: number
  ) => {
    const durationMinutes =
      (new Date(assessment.end_time).getTime() -
        new Date(assessment.start_time).getTime()) /
      60000;

    if (minDuration && durationMinutes > minDuration) {
      const slots: string[] = [];
      const slotCount = Math.floor(durationMinutes / minDuration);
      const base = new Date(assessment.start_time);

      for (let i = 0; i < slotCount; i++) {
        const slotStart = new Date(base.getTime() + i * minDuration * 60000);
        slots.push(slotStart.toISOString());
      }

      setAvailableSlots(slots);
      setSelectedAssessment(assessment);
      setModalMinDuration(minDuration);
      setShowTimeModal(true);
    } else {
      await finalizeAccept(assessment, vendorId);
    }
  };

  if (assessmentsLoading) {
    return (
      <div className="p-4 bg-white rounded shadow text-sm text-gray-500">
        Loading assessments...
      </div>
    );
  }

  if (!vendorIds.length) {
    return (
      <div className="p-4 bg-white rounded shadow text-sm text-gray-600">
        No assessment requested yet.
      </div>
    );
  }

  const activeVendorId = selectedVendorId ?? vendorIds[0];
  const activeGroup = vendorGroups[activeVendorId];
  const activeProposals = activeGroup?.assessments || [];
  const activeMinDuration = activeGroup?.minDuration || 0;
  const activeAccepted = getAcceptedForVendor(activeVendorId);

  return (
    <div className="space-y-3 relative">
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      <div className="p-4 bg-white rounded shadow space-y-4">
        <h3 className="text-xl font-semibold">Assessment Proposals</h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* LEFT: vendor selector */}
          <div className="md:col-span-5 lg:col-span-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Vendors
            </h4>
            <div className="flex flex-col gap-2.5">
              {vendorIds.map((vendorId) => {
                const group = vendorGroups[vendorId];
                const proposals = group?.assessments || [];
                const accepted = getAcceptedForVendor(vendorId);
                const isActive = vendorId === activeVendorId;

                return (
                  <button
                    key={vendorId}
                    onClick={() => setSelectedVendorId(vendorId)}
                    className={`w-full px-4 py-3 rounded-2xl border flex items-center justify-between gap-3 text-left transition
                      ${
                        isActive
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
                      }`}
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="text-[0.95rem] font-semibold whitespace-nowrap truncate max-w-[16rem]">
                        {getVendorLabel(vendorId)}
                      </span>

                      {accepted ? (
                        <span className="text-[0.72rem] text-gray-600 whitespace-nowrap">
                          Scheduled:{" "}
                          {new Date(
                            accepted.start_time
                          ).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      ) : (
                        <span className="text-[0.72rem] text-gray-500 whitespace-nowrap">
                          Approve a proposed time
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={`min-w-[1.75rem] h-6 px-1.5 rounded-full flex items-center justify-center text-[0.72rem] font-semibold
                          ${
                            proposals.length
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-700"
                          }`}
                      >
                        {proposals.length > 9 ? "9+" : proposals.length}
                      </span>

                      {accepted && (
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[0.62rem] font-semibold whitespace-nowrap">
                          Accepted
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: proposals list */}
          <div className="md:col-span-7 lg:col-span-8">
            {!activeProposals.length ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-6 h-[420px] flex items-center justify-center text-sm text-gray-500">
                Select a vendor on the left to view their proposed assessment
                times.
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 h-[420px] flex flex-col">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  <span className="cursor-pointer text-blue-600 hover:underline">
                    <VendorName vendorId={activeVendorId} />
                  </span>
                  &apos;s Proposals
                </h4>

                {activeAccepted && (() => {
                  const { googleCalendarUrl, icsUrl } = generateCalendarLinks({
                    ...activeAccepted,
                    min_assessment_time:
                      activeAccepted.min_assessment_time ?? undefined,
                  });

                  return (
                    <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm mb-3">
                      <strong>Scheduled:</strong>{" "}
                      {new Date(
                        activeAccepted.start_time
                      ).toLocaleString("en-US", {
                        month: "numeric",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {googleCalendarUrl && icsUrl && (
                        <div className="mt-2 space-x-4">
                          <a
                            href={googleCalendarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline text-sm"
                          >
                            <FontAwesomeIcon icon={faAdd} /> Add to Google
                            Calendar
                          </a>
                          <a
                            href={icsUrl}
                            download="assessment-invite.ics"
                            className="text-blue-600 underline text-sm"
                          >
                            <FontAwesomeIcon icon={faDownload} /> Download ICS
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                  {activeProposals.map((assessment) => {
                    const isAccepted =
                      assessment.status === IssueAssessmentStatus.ACCEPTED;
                    const isRejected =
                      assessment.status === IssueAssessmentStatus.REJECTED;
                    const isPending =
                      assessment.status === IssueAssessmentStatus.RECEIVED ||
                      (!isAccepted && !isRejected);

                    return (
                      <div
                        key={assessment.id}
                        className="border border-gray-100 rounded-md bg-gray-50 px-4 py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-2"
                      >
                        <div className="text-sm text-gray-800">
                          <p>
                            <strong>Proposed:</strong>{" "}
                            {formatRange(
                              assessment.start_time,
                              assessment.end_time
                            )}
                          </p>
                          <p className="text-gray-600 mt-1">
                            <strong>Status:</strong>{" "}
                            <span className={statusColor(assessment.status)}>
                              {
                                ISSUE_ASSESSMENT_STATUS_LABELS[
                                  assessment.status as IssueAssessmentStatus
                                ] || assessment.status
                              }
                            </span>
                          </p>
                        </div>

                        {isPending ? (
                          userId !== assessment.user_id ? (
                            <button
                              onClick={async () =>
                                handleAccept(
                                  assessment,
                                  activeMinDuration,
                                  activeVendorId
                                )
                              }
                              className="mt-2 md:mt-0 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md text-xs transition"
                              disabled={isSubmitting}
                            >
                              Accept
                            </button>
                          ) : (
                            <p className="text-xs text-gray-500 mt-2 md:mt-0">
                              Waiting for{" "}
                              {userType === "vendor" ? "client" : "vendor"} to
                              respond.
                            </p>
                          )
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Time-splitting modal (when slot > minDuration) */}
      {showTimeModal && selectedAssessment && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
            <h2 className="text-lg font-semibold mb-4">
              Select Assessment Start Time
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              This vendor requires a minimum assessment time of{" "}
              <strong>{modalMinDuration} minutes</strong>.
            </p>
            <select
              className="w-full border rounded px-3 py-2 mb-4"
              value={selectedSlot || ""}
              onChange={(e) => setSelectedSlot(e.target.value)}
            >
              <option value="" disabled>
                Select a time
              </option>
              {availableSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {new Date(slot).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => {
                  setShowTimeModal(false);
                  setSelectedAssessment(null);
                  setSelectedSlot(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded"
                disabled={!selectedSlot}
                onClick={async () => {
                  if (!selectedAssessment || !selectedSlot) return;

                  const pad = (n: number) => n.toString().padStart(2, "0");
                  const formatToLocalISOString = (date: Date) => {
                    return (
                      date.getFullYear() +
                      "-" +
                      pad(date.getMonth() + 1) +
                      "-" +
                      pad(date.getDate()) +
                      "T" +
                      pad(date.getHours()) +
                      ":" +
                      pad(date.getMinutes()) +
                      ":" +
                      pad(date.getSeconds())
                    );
                  };

                  const start = new Date(selectedSlot);
                  const end = new Date(
                    start.getTime() + (modalMinDuration ?? 0) * 60000
                  );

                  const accepted: IssueAssessment = {
                    ...selectedAssessment,
                    start_time: formatToLocalISOString(start),
                    end_time: formatToLocalISOString(end),
                  };

                  const vendorId = Number(
                    accepted.users_interaction_id.split("_")[1]
                  );

                  await finalizeAccept(accepted, vendorId);

                  setShowTimeModal(false);
                  setSelectedAssessment(null);
                  setSelectedSlot(null);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentReviewTab;
