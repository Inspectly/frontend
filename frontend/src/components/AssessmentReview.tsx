import React, { useState } from "react";
import {
  ISSUE_ASSESSMENT_STATUS_LABELS,
  IssueAssessment,
  IssueAssessmentStatus,
} from "../types";
import CalendarSelector from "./CalendarSelector";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAdd, faDownload } from "@fortawesome/free-solid-svg-icons";
import { generateCalendarLinks, parseAsUTC } from "../utils/calendarUtils";
import VendorName from "./VendorName";
import { BUTTON_HOVER } from "../styles/shared";

interface AssessmentReviewProps {
  assessments: IssueAssessment[];
  onAccept: (
    accepted: IssueAssessment,
    rejected: IssueAssessment[]
  ) => Promise<void>;
  onRejectAll: (vendorId: number) => void;
  onRejectSingle?: (assessment: IssueAssessment) => Promise<void>;
  issueId: number;
  userId: number;
  vendorIdToName: Record<number, string>;
  usersInteractionId: string;
  getUsersInteractionId: (vendorId: number) => string;
  onlyShowVendorId?: number;
  isSubmittingProposal?: boolean;
  userType?: string;
  postProposal: () => Promise<void>;
  assessmentsLoading?: boolean;
}

const AssessmentReview: React.FC<AssessmentReviewProps> = ({
  assessments,
  onAccept,
  onRejectAll,
  onRejectSingle,
  issueId,
  userId,
  vendorIdToName,
  getUsersInteractionId,
  onlyShowVendorId,
  isSubmittingProposal,
  userType,
  postProposal,
  assessmentsLoading,
}) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentVendor, setCurrentVendor] = useState<{
    vendorId: number;
    vendorName: string;
    minDuration: number;
  } | null>(null);

  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] =
    useState<IssueAssessment | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldRejectAll, setShouldRejectAll] = useState(true);
  const [modalMinDuration, setModalMinDuration] = useState<number | null>(null);
  const [locallyRemovedIds, setLocallyRemovedIds] = useState<number[]>([]);

  const assessmentsGroupedByVendor: Record<
    string,
    {
      vendorId: number;
      vendorName: string;
      assessments: IssueAssessment[];
      minDuration: number;
    }
  > = {};

  for (const a of assessments) {
    const vendorId = Number(a.users_interaction_id.split("_")[1]);

    if (onlyShowVendorId !== undefined && vendorId !== onlyShowVendorId) {
      continue; // skip other vendors if scoping
    }
    const vendorName = vendorIdToName[vendorId] || `Vendor ${vendorId}`;
    if (!assessmentsGroupedByVendor[vendorId]) {
      assessmentsGroupedByVendor[vendorId] = {
        vendorId,
        vendorName,
        assessments: [],
        minDuration: 0,
      };
    }
    assessmentsGroupedByVendor[vendorId].assessments.push(a);
    assessmentsGroupedByVendor[vendorId].minDuration = Math.max(
      assessmentsGroupedByVendor[vendorId].minDuration || 0,
      a.min_assessment_time || 0
    );
  }

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
      const confirm = window.confirm(
        "There's already an accepted time for this vendor. Accepting this one will reject the other. Continue?"
      );
      if (!confirm) return;
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

  const handleAccept = (
    assessment: IssueAssessment,
    minDuration: number,
    vendorId: number
  ) => {
    const duration =
      (parseAsUTC(assessment.end_time).getTime() -
        parseAsUTC(assessment.start_time).getTime()) /
      60000;

    if (duration > minDuration) {
      // Needs modal
      const slots: string[] = [];
      const slotCount = Math.floor(duration / minDuration);
      const base = parseAsUTC(assessment.start_time);

      for (let i = 0; i < slotCount; i++) {
        const slotStart = new Date(base.getTime() + i * minDuration * 60000);
        slots.push(slotStart.toISOString());
      }

      setAvailableSlots(slots);
      setSelectedAssessment(assessment);
      setModalMinDuration(minDuration);
      setShowTimeModal(true);
    } else {
      // Directly finalize
      finalizeAccept(assessment, vendorId);
    }
  };

  const filteredAssessments = assessments.filter(
    (a) => !locallyRemovedIds.includes(Number(a.id))
  );

  return (
    <div className="p-4 bg-white rounded shadow space-y-6">
      {(isSubmitting || isSubmittingProposal || assessmentsLoading) && (
        <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold border-t-transparent"></div>
        </div>
      )}

      <h3 className="text-xl font-semibold">Assessment Proposals</h3>

      {Object.entries(assessmentsGroupedByVendor).length === 0 &&
      !assessmentsLoading ? (
        <p className="text-gray-500">
          No assessments proposed yet. Once submitted, vendor or client can view
          responses here.
        </p>
      ) : (
        Object.entries(assessmentsGroupedByVendor).map(
          ([vendorKey, { vendorId, vendorName, assessments, minDuration }]) => {
            const acceptedAssessment = assessments.find(
              (a) =>
                a.status === IssueAssessmentStatus.ACCEPTED &&
                Number(a.users_interaction_id.split("_")[1]) === vendorId
            );

            const { googleCalendarUrl, icsUrl } = acceptedAssessment
              ? generateCalendarLinks({
                  ...acceptedAssessment,
                  min_assessment_time:
                    acceptedAssessment.min_assessment_time ?? undefined,
                })
              : { googleCalendarUrl: "", icsUrl: "" };

            const formatScheduledTime = (startTime: string, endTime: string) => {
              const start = parseAsUTC(startTime);
              const end = parseAsUTC(endTime);
              return {
                date: start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                timeRange: `${start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} - ${end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
                full: `${start.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}, ${start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} - ${end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
              };
            };

            return (
              <div
                key={vendorKey}
                className="border border-gray-200 rounded-xl overflow-hidden mb-6"
              >
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <h4 className="text-base font-semibold text-gray-900">
                    {onlyShowVendorId ? "Assessment Proposals" : (
                      <><VendorName vendorId={vendorId} showRating />'s Proposals</>
                    )}
                  </h4>
                </div>

                <div className="p-5 space-y-4">
                  {/* Scheduled Time Banner */}
                  {acceptedAssessment && (
                    <div className="bg-gold-50 border border-gold-200 rounded-lg p-4">
                      <p className="text-gray-900 font-medium mb-2">
                        Scheduled on {formatScheduledTime(acceptedAssessment.start_time, acceptedAssessment.end_time).date} from {formatScheduledTime(acceptedAssessment.start_time, acceptedAssessment.end_time).timeRange}
                      </p>
                      {googleCalendarUrl && icsUrl && (
                        <div className="flex items-center gap-4">
                          <a
                            href={googleCalendarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-gold-700 hover:text-gray-900 transition-colors"
                          >
                            <FontAwesomeIcon icon={faAdd} className="w-3 h-3" />
                            Add to Google Calendar
                          </a>
                          <a
                            href={icsUrl}
                            download="assessment-invite.ics"
                            className="inline-flex items-center gap-1.5 text-sm text-gold-700 hover:text-gray-900 transition-colors"
                          >
                            <FontAwesomeIcon icon={faDownload} className="w-3 h-3" />
                            Download ICS
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Assessment Cards */}
                  <div className="space-y-3">
                    {[...assessments]
                      .filter((a) => !locallyRemovedIds.includes(Number(a.id)))
                      .sort(
                        (a, b) =>
                          parseAsUTC(a.start_time).getTime() -
                          parseAsUTC(b.start_time).getTime()
                      )
                      .map((assessment) => {
                        const proposedTime = formatScheduledTime(assessment.start_time, assessment.end_time);
                        const isAccepted = assessment.status === IssueAssessmentStatus.ACCEPTED;
                        const isRejected = assessment.status === IssueAssessmentStatus.REJECTED;
                        const isPending = assessment.status === IssueAssessmentStatus.RECEIVED;
                        
                        return (
                          <div
                            key={assessment.id}
                            className={`border rounded-lg p-4 transition-all ${
                              isAccepted 
                                ? "border-gold-300 bg-gold-50" 
                                : isRejected 
                                ? "border-gray-200 bg-gray-50 opacity-60" 
                                : "border-gray-200 hover:border-gold hover:shadow-md"
                            }`}
                          >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                              <div>
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                  {proposedTime.full}
                                </p>
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                    isAccepted
                                      ? "bg-gold text-white"
                                      : isRejected
                                      ? "bg-gray-200 text-gray-600"
                                      : "bg-gold-100 text-gold-700"
                                  }`}
                                >
                                  {ISSUE_ASSESSMENT_STATUS_LABELS[assessment.status]}
                                </span>
                              </div>

                              {isPending && userId !== assessment.user_id ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={async () => {
                                      await handleAccept(
                                        assessment,
                                        minDuration,
                                        vendorId
                                      );
                                    }}
                                    className={`px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg ${BUTTON_HOVER}`}
                                  >
                                    Accept
                                  </button>
                                  {onRejectSingle && (
                                    <button
                                      onClick={async () => {
                                        setIsSubmitting(true);
                                        try {
                                          await onRejectSingle(assessment);
                                          setLocallyRemovedIds(prev => [...prev, Number(assessment.id)]);
                                        } catch (err) {
                                          console.error("Error rejecting assessment:", err);
                                        } finally {
                                          setIsSubmitting(false);
                                        }
                                      }}
                                      className={`px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 ${BUTTON_HOVER}`}
                                    >
                                      Reject
                                    </button>
                                  )}
                                </div>
                              ) : isPending ? (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  Waiting for {userType === "vendor" ? "client" : "vendor"}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Status Message */}
                  {acceptedAssessment && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        Assessment time has been confirmed. {userType === "vendor" ? "Visit the property at the scheduled time." : "The vendor will visit at the scheduled time."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons - Only show if no accepted assessment */}
                {!acceptedAssessment && (
                  <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setShouldRejectAll(false);
                        setCurrentVendor({ vendorId, vendorName, minDuration });
                        setShowRejectModal(true);
                      }}
                      className={`flex-1 px-4 py-2.5 bg-gold text-white text-sm font-medium rounded-lg ${BUTTON_HOVER} flex items-center justify-center gap-2`}
                    >
                      <FontAwesomeIcon icon={faAdd} className="w-3 h-3" />
                      {userType === "vendor" ? "Modify Schedule" : "Propose New Times"}
                    </button>
                    {assessments.filter(a => a.status !== "Assessment_Status.REJECTED").length > 0 && (
                      <button
                        onClick={() => {
                          setShouldRejectAll(true);
                          setCurrentVendor({ vendorId, vendorName, minDuration });
                          setShowRejectModal(true);
                        }}
                        className={`flex-1 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 ${BUTTON_HOVER}`}
                      >
                        Reject All & Propose New
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          }
        )
      )}

      {showRejectModal && currentVendor && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl relative h-[80vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white px-6 pt-4 pb-2 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                Propose Availability for{" "}
                <VendorName vendorId={currentVendor.vendorId} showRating />
              </h2>
              <button
                className="text-3xl font-light text-gray-600 hover:text-gray-800"
                onClick={() => setShowRejectModal(false)}
              >
                ×
              </button>
            </div>

            <div className="p-6 pt-0">
              {userType === "client" && (
                <p className="text-sm text-gray-600 mb-4">
                  This vendor requires a minimum assessment time of{" "}
                  <strong>{currentVendor.minDuration} minutes</strong>.
                </p>
              )}
              <CalendarSelector
                issueId={issueId}
                mode={
                  userType === "vendor" || userType === "client"
                    ? userType
                    : undefined
                }
                userId={userId}
                vendorId={currentVendor.vendorId}
                minDuration={currentVendor.minDuration}
                usersInteractionId={getUsersInteractionId(
                  currentVendor.vendorId
                )}
                onClose={() => setShowRejectModal(false)}
                onLocalDelete={(deletedId: number) =>
                  setLocallyRemovedIds((prev) => [...prev, deletedId])
                }
                onSubmitted={async () => {
                  if (shouldRejectAll) {
                    await onRejectAll(currentVendor.vendorId);
                  } else {
                    await postProposal();
                  }
                  setShowRejectModal(false);
                }}
                existingAssessments={filteredAssessments
                  .filter(
                    (a) =>
                      Number(a.users_interaction_id.split("_")[1]) ===
                      currentVendor.vendorId
                  )
                  .map((a) => ({
                    ...a,
                    title: a.status,
                    start: parseAsUTC(a.start_time),
                    end: parseAsUTC(a.end_time),
                    isNew: false,
                  }))}
              />
            </div>
          </div>
        </div>
      )}

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
                className={`px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 ${BUTTON_HOVER}`}
                onClick={() => {
                  setShowTimeModal(false);
                  setSelectedAssessment(null);
                  setSelectedSlot(null);
                }}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 bg-gray-900 text-white rounded-lg ${BUTTON_HOVER} disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={!selectedSlot}
                onClick={async () => {
                  if (!selectedAssessment || !selectedSlot) return;

                  // Format helper to avoid .toISOString() (which forces UTC)
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
                    start.getTime() + modalMinDuration! * 60000
                  );

                  const accepted = {
                    ...selectedAssessment,
                    start_time: formatToLocalISOString(start),
                    end_time: formatToLocalISOString(end),
                  };

                  const vendorId = Number(
                    accepted.users_interaction_id.split("_")[1]
                  );

                  finalizeAccept(accepted, vendorId);

                  // Clean up modal
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

export default AssessmentReview;
