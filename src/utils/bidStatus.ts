import {
  IssueAssessment,
  IssueAssessmentStatus,
  IssueOffer,
  IssueOfferStatus,
} from "../types";

/**
 * The vendor's progress on a marketplace issue, modelled as a single
 * lifecycle so every surface (cards, list rows, the detail modal) can render a
 * consistent status-driven button.
 *
 * Offers take priority over assessments — once a price is on the table the
 * assessment step is behind us.
 */
export type BidStage =
  | "none" // nothing submitted yet
  | "assessment_pending" // visit proposed, waiting on the homeowner
  | "assessment_confirmed" // visit accepted — vendor can now enter a price
  | "offer_pending" // price submitted, waiting on the homeowner
  | "offer_accepted"; // homeowner accepted the price

export const getBidStage = (
  offer?: IssueOffer,
  assessment?: IssueAssessment
): BidStage => {
  if (offer) {
    return offer.status === IssueOfferStatus.ACCEPTED
      ? "offer_accepted"
      : "offer_pending";
  }
  if (assessment) {
    return assessment.status === IssueAssessmentStatus.ACCEPTED
      ? "assessment_confirmed"
      : "assessment_pending";
  }
  return "none";
};

/** A waiting stage is one where we're blocked on the homeowner's response. */
export const isWaitingStage = (stage: BidStage): boolean =>
  stage === "assessment_pending" || stage === "offer_pending";

/** A CTA stage invites the vendor to act (write an offer / enter a price). */
export const isCtaStage = (stage: BidStage): boolean =>
  stage === "none" || stage === "assessment_confirmed";

export const BID_STAGE_LABELS: Record<BidStage, string> = {
  none: "Write Offer",
  assessment_pending: "Awaiting confirmation",
  assessment_confirmed: "Enter Amount",
  offer_pending: "Awaiting confirmation",
  offer_accepted: "Accepted",
};
