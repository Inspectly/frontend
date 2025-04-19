import React, { useState } from "react";
import {
  ISSUE_ASSESSMENT_STATUS_LABELS,
  IssueAssessment,
  IssueAssessmentStatus,
} from "../types";
import CalendarSelector from "./CalendarSelector";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAdd, faDownload } from "@fortawesome/free-solid-svg-icons";
import { generateCalendarLinks } from "../utils/calendarUtils";
import VendorName from "./VendorName";

interface AssessmentReviewProps {
  assessments: IssueAssessment[];
  onAccept: (
    accepted: IssueAssessment,
    rejected: IssueAssessment[]
  ) => Promise<void>;
  onRejectAll: (vendorId: number) => void;
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
      (new Date(assessment.end_time).getTime() -
        new Date(assessment.start_time).getTime()) /
      60000;

    if (duration > minDuration) {
      // Needs modal
      const slots: string[] = [];
      const slotCount = Math.floor(duration / minDuration);
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
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
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

            const acceptedTimeDisplay = acceptedAssessment
              ? new Date(acceptedAssessment.start_time).toLocaleString()
              : null;

            const { googleCalendarUrl, icsUrl } = acceptedAssessment
              ? generateCalendarLinks({
                  ...acceptedAssessment,
                  min_assessment_time:
                    acceptedAssessment.min_assessment_time ?? undefined,
                })
              : { googleCalendarUrl: "", icsUrl: "" };

            return (
              <div
                key={vendorKey}
                className="border border-gray-300 rounded p-4"
              >
                {!onlyShowVendorId && (
                  <h4 className="font-semibold text-lg mb-2">
                    <VendorName vendorId={vendorId} />
                    's Proposals
                  </h4>
                )}

                {acceptedTimeDisplay && (
                  <div className="text-sm text-green-700 mb-2">
                    <p>
                      Scheduled time for assessment:{" "}
                      <strong>{acceptedTimeDisplay}</strong>
                    </p>
                    {googleCalendarUrl && icsUrl && (
                      <div className="mt-2 space-x-4">
                        <a
                          href={googleCalendarUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          <FontAwesomeIcon icon={faAdd} /> Add to Google
                          Calendar
                        </a>
                        <a
                          href={icsUrl}
                          download="assessment-invite.ics"
                          className="text-blue-600 underline"
                        >
                          <FontAwesomeIcon icon={faDownload} /> Download ICS for
                          Outlook/Apple
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {[...assessments]
                  .filter((a) => !locallyRemovedIds.includes(Number(a.id)))
                  .sort(
                    (a, b) =>
                      new Date(a.start_time).getTime() -
                      new Date(b.start_time).getTime()
                  )
                  .map((assessment) => (
                    <div
                      key={assessment.id}
                      className="border p-3 rounded-md bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center mb-2"
                    >
                      <div>
                        <p>
                          <strong>Proposed:</strong>{" "}
                          {new Date(assessment.start_time).toLocaleString(
                            "en-US",
                            {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            }
                          )}{" "}
                          –{" "}
                          {new Date(assessment.end_time).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                        <p>
                          <strong>Status:</strong>{" "}
                          <span
                            className={
                              assessment.status ===
                              IssueAssessmentStatus.ACCEPTED
                                ? "text-green-600"
                                : assessment.status ===
                                  IssueAssessmentStatus.REJECTED
                                ? "text-red-600"
                                : "text-yellow-600"
                            }
                          >
                            {ISSUE_ASSESSMENT_STATUS_LABELS[assessment.status]}
                          </span>
                        </p>
                      </div>

                      {assessment.status === IssueAssessmentStatus.RECEIVED &&
                      userId !== assessment.user_id ? (
                        <div className="mt-2 md:mt-0">
                          <button
                            onClick={async () => {
                              await handleAccept(
                                assessment,
                                minDuration,
                                vendorId
                              );
                            }}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Accept
                          </button>
                        </div>
                      ) : assessment.status ===
                        IssueAssessmentStatus.RECEIVED ? (
                        <p className="text-sm text-gray-500 mt-2">
                          Waiting for{" "}
                          {userType === "vendor" ? "client" : "vendor"} to
                          respond to your proposed times.
                        </p>
                      ) : null}
                    </div>
                  ))}

                <div className="text-center mt-4">
                  <button
                    onClick={() => {
                      setShouldRejectAll(true);
                      setCurrentVendor({ vendorId, vendorName, minDuration });
                      setShowRejectModal(true);
                    }}
                    className="bg-red-500 text-white px-4 py-2 mx-2 rounded text-sm"
                  >
                    Reject All & Propose Times
                  </button>
                  <button
                    onClick={() => {
                      setShouldRejectAll(false);
                      setCurrentVendor({ vendorId, vendorName, minDuration });
                      setShowRejectModal(true);
                    }}
                    className="bg-blue-500 text-white px-4 py-2 mx-2 rounded text-sm mt-2"
                  >
                    Propose Additional Times
                  </button>
                </div>
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
                    start: new Date(a.start_time),
                    end: new Date(a.end_time),
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
