import React, { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import confetti from "canvas-confetti";
import { IssueOfferStatus } from "../types";
import { useGetOffersByVendorIdQuery } from "../features/api/issueOffersApi";
import { useGetIssuesQuery } from "../features/api/issuesApi";

const isIssueCompleted = (status?: string): boolean => {
  if (!status) return false;
  const n = String(status).toUpperCase();
  return n === "COMPLETED" || n === "STATUS.COMPLETED";
};

interface VendorCelebrationListenerProps {
  userId: number;
}

/**
 * Listens for offer-accepted and work-approved events for vendors.
 * Renders nothing; triggers confetti + toast when the vendor's offer is accepted
 * or their work is approved, regardless of which page they're on.
 */
const VendorCelebrationListener: React.FC<VendorCelebrationListenerProps> = ({
  userId,
}) => {
  const { data: vendorOffers = [] } = useGetOffersByVendorIdQuery(
    Number(userId),
    { skip: !userId, pollingInterval: 20000 }
  );
  const { data: issues = [] } = useGetIssuesQuery(undefined, {
    skip: !userId,
    pollingInterval: 20000,
  });

  const issuesMap = React.useMemo(
    () =>
      issues.reduce(
        (acc, i) => {
          acc[i.id] = i;
          return acc;
        },
        {} as Record<number, { id: number; summary?: string; status?: string; updated_at?: string }>
      ),
    [issues]
  );

  const prevAcceptedOfferIdsRef = useRef<Set<number>>(new Set());
  const prevCompletedIssueIdsRef = useRef<Set<number>>(new Set());
  const hasSeededRef = useRef(false);
  const sessionStartMsRef = useRef<number>(Date.now());

  useEffect(() => {
    const acceptedOffers = vendorOffers.filter(
      (o) => o.status === IssueOfferStatus.ACCEPTED
    );
    const vendorIssueIds = new Set(acceptedOffers.map((o) => o.issue_id));

    // Wait for data to arrive, then seed refs without firing. Never fire on page load/refresh.
    if (!hasSeededRef.current) {
      const hasData = vendorOffers.length > 0 || Object.keys(issuesMap).length > 0;
      if (!hasData) return;
      hasSeededRef.current = true;
      prevAcceptedOfferIdsRef.current = new Set(acceptedOffers.map((o) => o.id));
      prevCompletedIssueIdsRef.current = new Set(
        [...vendorIssueIds].filter((id) => {
          const issue = issuesMap[id];
          return issue && isIssueCompleted(issue.status);
        })
      );
      return;
    }

    const sessionStart = sessionStartMsRef.current;

    // Offer accepted: newly accepted offers - only if accepted AFTER user's session start
    acceptedOffers.forEach((offer) => {
      if (prevAcceptedOfferIdsRef.current.has(offer.id)) return;
      const updatedAtMs = offer.updated_at ? new Date(offer.updated_at).getTime() : 0;
      if (updatedAtMs < sessionStart) return;
      const issue = issuesMap[offer.issue_id];
      const summary = issue?.summary || "issue";
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success(`Offer accepted for ${summary}!`);
    });
    prevAcceptedOfferIdsRef.current = new Set(acceptedOffers.map((o) => o.id));

    // Work approved: vendor's issue newly completed - only if completed AFTER session start
    vendorIssueIds.forEach((issueId) => {
      const issue = issuesMap[issueId];
      if (!issue || !isIssueCompleted(issue.status)) return;
      if (prevCompletedIssueIdsRef.current.has(issueId)) return;
      const updatedAtMs = issue.updated_at ? new Date(issue.updated_at).getTime() : 0;
      if (updatedAtMs < sessionStart) return;
      const summary = issue.summary || "issue";
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success(`Work approved for ${summary}!`);
    });
    prevCompletedIssueIdsRef.current = new Set(
      [...vendorIssueIds].filter((id) => {
        const issue = issuesMap[id];
        return issue && isIssueCompleted(issue.status);
      })
    );
  }, [vendorOffers, issuesMap]);

  return null;
};

export default VendorCelebrationListener;
