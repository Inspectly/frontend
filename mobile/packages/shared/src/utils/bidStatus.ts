import {
  IssueAssessment,
  IssueAssessmentStatus,
  IssueOffer,
  IssueOfferStatus,
} from "../types";

export type BidStage =
  | "none"
  | "assessment_pending"
  | "assessment_confirmed"
  | "offer_pending"
  | "offer_accepted";

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

export const isWaitingStage = (stage: BidStage): boolean =>
  stage === "assessment_pending" || stage === "offer_pending";

export const isCtaStage = (stage: BidStage): boolean =>
  stage === "none" || stage === "assessment_confirmed";

export const BID_STAGE_LABELS: Record<BidStage, string> = {
  none: "Write Offer",
  assessment_pending: "Awaiting confirmation",
  assessment_confirmed: "Enter Amount",
  offer_pending: "Awaiting confirmation",
  offer_accepted: "Accepted",
};
