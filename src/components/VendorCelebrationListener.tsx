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
        {} as Record<number, { id: number; summary?: string; status?: string }>
      ),
    [issues]
  );

  const prevAcceptedOfferIdsRef = useRef<Set<number>>(new Set());
  const prevCompletedIssueIdsRef = useRef<Set<number>>(new Set());
  const isInitialLoadRef = useRef(true);

  const STORAGE_KEY_OFFERS = "vendor_celebrated_offer_ids";
  const STORAGE_KEY_ISSUES = "vendor_celebrated_completed_issue_ids";

  const getCelebratedOfferIds = (): Set<number> => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_OFFERS);
      return raw ? new Set(JSON.parse(raw).map(Number)) : new Set();
    } catch {
      return new Set();
    }
  };
  const getCelebratedIssueIds = (): Set<number> => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_ISSUES);
      return raw ? new Set(JSON.parse(raw).map(Number)) : new Set();
    } catch {
      return new Set();
    }
  };
  const markOfferCelebrated = (id: number) => {
    const set = getCelebratedOfferIds();
    set.add(id);
    sessionStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify([...set]));
  };
  const markIssueCelebrated = (id: number) => {
    const set = getCelebratedIssueIds();
    set.add(id);
    sessionStorage.setItem(STORAGE_KEY_ISSUES, JSON.stringify([...set]));
  };

  useEffect(() => {
    const acceptedOffers = vendorOffers.filter(
      (o) => o.status === IssueOfferStatus.ACCEPTED
    );
    const vendorIssueIds = new Set(acceptedOffers.map((o) => o.issue_id));

    if (isInitialLoadRef.current) {
      if (vendorOffers.length === 0) return;
      isInitialLoadRef.current = false;
      prevAcceptedOfferIdsRef.current = new Set(acceptedOffers.map((o) => o.id));
      prevCompletedIssueIdsRef.current = new Set(
        [...vendorIssueIds].filter((id) => {
          const issue = issuesMap[id];
          return issue && isIssueCompleted(issue.status);
        })
      );
      // Seed sessionStorage so we don't celebrate these on refresh
      acceptedOffers.forEach((o) => markOfferCelebrated(o.id));
      [...vendorIssueIds].forEach((id) => {
        const issue = issuesMap[id];
        if (issue && isIssueCompleted(issue.status)) markIssueCelebrated(id);
      });
      return;
    }

    const celebratedOffers = getCelebratedOfferIds();
    const celebratedIssues = getCelebratedIssueIds();

    // Offer accepted: only celebrate if newly accepted AND not yet celebrated
    acceptedOffers.forEach((offer) => {
      if (prevAcceptedOfferIdsRef.current.has(offer.id)) return;
      if (celebratedOffers.has(offer.id)) return;
      const issue = issuesMap[offer.issue_id];
      const summary = issue?.summary || "issue";
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success(`Offer accepted for: ${summary}`);
      markOfferCelebrated(offer.id);
    });
    prevAcceptedOfferIdsRef.current = new Set(acceptedOffers.map((o) => o.id));

    // Work approved: only celebrate if newly completed AND not yet celebrated
    vendorIssueIds.forEach((issueId) => {
      const issue = issuesMap[issueId];
      if (!issue || !isIssueCompleted(issue.status)) return;
      if (prevCompletedIssueIdsRef.current.has(issueId)) return;
      if (celebratedIssues.has(issueId)) return;
      const summary = issue.summary || "issue";
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success(`Work approved for ${summary}!`);
      markIssueCelebrated(issueId);
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
