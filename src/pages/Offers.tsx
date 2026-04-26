import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import HomeownerIssueCard from "../components/HomeownerIssueCard";
import OfferDetailModal from "../components/OfferDetailModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { saveIssueImages, getIssueImages, deleteIssueImages } from "../utils/issueImageStore";
import { getIssueImageUrls, getIssueImageUrlsFromIssue } from "../utils/issueImageUtils";

// Use a unique key to avoid any conflicts
const SUBS_KEY = '__INSPECTLY_OFFER_SUBS__';

// Helper to get/create the global subscriptions map (survives HMR)
const getGlobalSubscriptions = (): Map<number, any> => {
  const w = window as any;
  if (!w[SUBS_KEY]) {
    w[SUBS_KEY] = new Map<number, any>();
  }
  return w[SUBS_KEY];
};
import {
  faSearch,
  faChevronLeft,
  faChevronRight,
  faStar,
  faClock,
  faCheckCircle,
  faDollarSign,
  faClipboardList,
  faRocket,
  faArrowRight,
  faHome,
  faBolt,
  faShieldAlt,
  faCalendarAlt,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useGetIssuesQuery, useUpdateIssueMutation } from "../features/api/issuesApi";
import { useGetReportsByUserIdQuery } from "../features/api/reportsApi";
import { useGetListingByUserIdQuery } from "../features/api/listingsApi";
import { useGetClientByUserIdQuery } from "../features/api/clientsApi";
import { useGetVendorsQuery } from "../features/api/vendorsApi";
import { issueOffersApi, useUpdateOfferMutation } from "../features/api/issueOffersApi";
import { useCreateCheckoutSessionMutation } from "../features/api/stripePaymentsApi";
import { useGetAssessmentsByClientIdUsersInteractionIdQuery } from "../features/api/issueAssessmentsApi";
import {
  IssueAssessment,
  IssueAssessmentStatus,
  IssueOffer,
  IssueOfferStatus,
  IssueType,
  Listing,
  ReportType,
  Vendor,
} from "../types";
import { buildIssueUpdateBody } from "../utils/issueUpdateHelper";
import { shallowEqual } from "react-redux";
import { toast } from "react-hot-toast";
import confetti from "canvas-confetti";

type StatusFilter = "all" | "pending" | "accepted" | "declined";
type GroupingMode = "none" | "issue" | "property";

const FALLBACK_HOUSE_IMAGE = "/images/property_card_holder.jpg";

const IssueImageThumb: React.FC<{ images: string[] }> = ({ images }) => {
  const [index, setIndex] = useState(0);
  const hasImages = images.length > 0;
  const hasMultiple = images.length > 1;
  const currentSrc = hasImages ? images[index] : FALLBACK_HOUSE_IMAGE;

  const stop = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const goPrev = (e: React.MouseEvent) => {
    stop(e);
    setIndex((i) => (i - 1 + images.length) % images.length);
  };

  const goNext = (e: React.MouseEvent) => {
    stop(e);
    setIndex((i) => (i + 1) % images.length);
  };

  return (
    <div
      className="relative w-20 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 group"
      onClick={stop}
    >
      <img
        src={currentSrc}
        alt={hasImages ? `Issue image ${index + 1}` : "Property"}
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = FALLBACK_HOUSE_IMAGE;
        }}
      />
      {hasMultiple && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={goPrev}
            className="absolute left-0.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/50 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="w-2.5 h-2.5" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={goNext}
            className="absolute right-0.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/50 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          >
            <FontAwesomeIcon icon={faChevronRight} className="w-2.5 h-2.5" />
          </button>
          <div className="absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded bg-black/60 text-white text-[9px] font-medium leading-none">
            {index + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  );
};

interface OfferRow {
  offer: IssueOffer;
  issue: IssueType;
  report?: ReportType;
  listing?: Listing;
  vendor?: Vendor;
}

const Offers: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: issues = [], isLoading: isLoadingIssues, refetch: refetchIssues } = useGetIssuesQuery();
  const { data: reports = [], isLoading: isLoadingReports } = useGetReportsByUserIdQuery(userId, { skip: !userId });
  const { data: listings = [] } = useGetListingByUserIdQuery(userId, { skip: !userId });
  const { data: client } = useGetClientByUserIdQuery(String(userId ?? ""), { skip: !userId });
  const { data: vendors = [] } = useGetVendorsQuery();
  const { data: clientAssessments = [] } = useGetAssessmentsByClientIdUsersInteractionIdQuery(
    client?.id ?? 0,
    { skip: !client?.id }
  );

  const [updateOffer] = useUpdateOfferMutation();
  const [updateIssue] = useUpdateIssueMutation();
  const [createCheckoutSession] = useCreateCheckoutSessionMutation();

  const [paymentVerified, setPaymentVerified] = useState(false);
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const paymentParam = searchParams.get("payment");
    const filterParam = searchParams.get("filter");
    const pendingPaymentStr = localStorage.getItem("pending_offer_payment");
    const pendingPayment = pendingPaymentStr ? JSON.parse(pendingPaymentStr) : null;

    const shouldVerify = (sessionId || (paymentParam === "success" && filterParam === "accepted")) && pendingPayment;

    if (shouldVerify && !paymentVerified) {
      setPaymentVerified(true);

      const savedIssue = pendingPayment.issue;
      const savedListing = pendingPayment.listing;
      if (savedIssue) {
        setSelectedIssue({ issue: savedIssue, listing: savedListing || undefined, defaultTab: "offers" });
        setStatusFilter("accepted");
      }

      (async () => {
        try {
          await updateOffer({
            id: pendingPayment.offer_id,
            issue_id: pendingPayment.issue_id,
            vendor_id: pendingPayment.vendor_id,
            price: pendingPayment.price,
            status: "accepted",
            user_last_viewed: new Date().toISOString(),
            comment_vendor: pendingPayment.comment_vendor || "",
            comment_client: pendingPayment.comment_client || "",
          }).unwrap();

          const issueId = Number(pendingPayment.issue_id);
          const issue = savedIssue || issues.find(i => i.id === issueId);

          let restoredImages: string[] | null = null;
          try {
            restoredImages = await getIssueImages(issueId);
          } catch { /* ignore */ }

          if (issue) {
            const report = reports.find(r => r.id === issue.report_id);
            const listing = savedListing || listings.find(l => l.id === report?.listing_id);

            let imageUrlsForUpdate = issue.image_urls || "";
            if (restoredImages && restoredImages.length > 0) {
              const realUrls = restoredImages.filter((url: string) => !url.startsWith("data:"));
              if (realUrls.length > 0) {
                imageUrlsForUpdate = realUrls.length === 1 ? realUrls[0] : JSON.stringify(realUrls);
              }
            }

            const issueWithImages = { ...issue, image_urls: imageUrlsForUpdate };
            try {
              await updateIssue(buildIssueUpdateBody(issueWithImages, {
                vendor_id: pendingPayment.vendor_id,
                status: "in_progress",
                active: false,
              }, listing?.id)).unwrap();
            } catch {
              // Offer accepted, issue update failed silently
            }

            if (restoredImages && restoredImages.length > 0) {
              const displayIssue = { ...issue, image_urls: restoredImages };
              setSelectedIssue(prev => prev && prev.issue?.id === issueId ? { ...prev, issue: displayIssue } : prev);
            }
          }

          try { await deleteIssueImages(issueId); } catch { /* ignore */ }

          toast.success(`Offer accepted for ${issue?.summary || "issue"}!`);
          localStorage.removeItem("pending_offer_payment");
          refetchIssues();
        } catch {
          toast.error("Payment completed but status update failed. Please refresh.");
        }

        searchParams.delete("session_id");
        searchParams.delete("payment");
        setSearchParams(searchParams, { replace: true });
      })();
    }
  }, [searchParams, paymentVerified, refetchIssues, setSearchParams, updateOffer, updateIssue, issues, reports, listings]);

  const initialFilter = (): StatusFilter => {
    const param = searchParams.get("filter");
    if (param === "pending") return "pending";
    if (param === "accepted") return "accepted";
    if (param === "rejected" || param === "declined") return "declined";
    return "all";
  };

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialFilter);
  const [grouping, setGrouping] = useState<GroupingMode>("none");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);

  const [selectedIssue, setSelectedIssue] = useState<{
    issue: IssueType;
    listing?: Listing;
    defaultTab?: "details" | "offers" | "assessments" | "dispute";
  } | null>(null);

  const [selectedOffer, setSelectedOffer] = useState<OfferRow | null>(null);
  const [isProcessingOffer, setIsProcessingOffer] = useState(false);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRequestChangesModal, setShowRequestChangesModal] = useState(false);
  const [selectedIssueForAction, setSelectedIssueForAction] = useState<{ issue: IssueType; listing?: Listing } | null>(null);
  const [changeRequestMessage, setChangeRequestMessage] = useState("");

  const userIssues = useMemo(() => {
    const userReportIds = reports.filter((r) => r.user_id === userId).map((r) => r.id);
    return issues.filter((issue) => userReportIds.includes(issue.report_id));
  }, [issues, reports, userId]);

  const issueIdsKey = userIssues.map(i => i.id).sort().join(',');

  useEffect(() => {
    if (isLoadingIssues || isLoadingReports || userIssues.length === 0) return;

    const subs = getGlobalSubscriptions();

    const issuesNeedingSubscription = userIssues.filter(
      issue => !subs.has(issue.id)
    );

    if (issuesNeedingSubscription.length === 0) return;

    issuesNeedingSubscription.forEach((issue) => {
      const subscription = dispatch(
        issueOffersApi.endpoints.getOffersByIssueId.initiate(issue.id, {
          subscribe: true,
          forceRefetch: false,
        })
      );
      subs.set(issue.id, subscription);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueIdsKey, dispatch, isLoadingIssues, isLoadingReports]);

  const offersByIssueId = useSelector((state: RootState) => {
    if (userIssues.length === 0) return {};

    const offersMap: Record<number, IssueOffer[]> = {};

    userIssues.forEach((issue) => {
      const select = issueOffersApi.endpoints.getOffersByIssueId.select(issue.id);
      const result = select(state);

      if (result.data) {
        offersMap[issue.id] = result.data;
      }
    });

    return offersMap;
  }, shallowEqual);

  const isLoading = (isLoadingIssues && issues.length === 0) || (isLoadingReports && reports.length === 0);

  // Map vendor by vendor_user_id (offer.vendor_id refers to the vendor's user id)
  const vendorByUserId = useMemo(() => {
    const map = new Map<number, Vendor>();
    vendors.forEach((v) => map.set(v.vendor_user_id, v));
    return map;
  }, [vendors]);

  // Flatten into one row per offer
  const offerRows: OfferRow[] = useMemo(() => {
    const rows: OfferRow[] = [];
    userIssues.forEach((issue) => {
      const offers = offersByIssueId[issue.id] || [];
      const report = reports.find((r) => r.id === issue.report_id);
      const listing = listings.find((l) => l.id === report?.listing_id);
      offers.forEach((offer) => {
        rows.push({
          offer,
          issue,
          report,
          listing,
          vendor: vendorByUserId.get(offer.vendor_id),
        });
      });
    });
    return rows;
  }, [userIssues, offersByIssueId, reports, listings, vendorByUserId]);

  // Apply filters
  const filteredRows = useMemo(() => {
    return offerRows.filter(({ offer, issue, listing, vendor }) => {
      if (statusFilter !== "all") {
        if (statusFilter === "pending" && offer.status !== IssueOfferStatus.RECEIVED) return false;
        if (statusFilter === "accepted" && offer.status !== IssueOfferStatus.ACCEPTED) return false;
        if (statusFilter === "declined" && offer.status !== IssueOfferStatus.REJECTED) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const haystack = [
          vendor?.name,
          vendor?.company_name,
          issue.summary,
          issue.type,
          listing?.address,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [offerRows, statusFilter, searchQuery]);

  // Sort - newest offers first, accepted bumped up slightly
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const aTime = new Date(a.offer.updated_at || a.offer.created_at).getTime();
      const bTime = new Date(b.offer.updated_at || b.offer.created_at).getTime();
      return bTime - aTime;
    });
  }, [filteredRows]);

  // Group rows when grouping is active
  type Group = { key: string; label: string; rows: OfferRow[] };
  const groupedRows: Group[] = useMemo(() => {
    if (grouping === "none") {
      return [{ key: "all", label: "", rows: sortedRows }];
    }
    const groups = new Map<string, Group>();
    sortedRows.forEach((row) => {
      let key = "";
      let label = "";
      if (grouping === "issue") {
        key = `issue-${row.issue.id}`;
        label = row.issue.summary || `Issue #${row.issue.id}`;
      } else if (grouping === "property") {
        key = `listing-${row.listing?.id ?? "none"}`;
        label = row.listing?.address || "Unknown property";
      }
      if (!groups.has(key)) {
        groups.set(key, { key, label, rows: [] });
      }
      groups.get(key)!.rows.push(row);
    });
    return Array.from(groups.values());
  }, [sortedRows, grouping]);

  // Assessment requests — vendor proposed a date but hasn't put an offer yet
  type AssessmentRequest = {
    issue: IssueType;
    listing?: Listing;
    vendor?: Vendor;
    vendorUserId: number;
    proposals: IssueAssessment[];
    earliest?: IssueAssessment;
  };
  const assessmentRequests: AssessmentRequest[] = useMemo(() => {
    if (!clientAssessments.length || !userIssues.length) return [];
    const userIssueIds = new Set(userIssues.map((i) => i.id));

    // Group by (issue, vendor) where status is RECEIVED and vendor has no offer for that issue
    const grouped = new Map<string, AssessmentRequest>();

    clientAssessments.forEach((a) => {
      if (a.status !== IssueAssessmentStatus.RECEIVED) return;
      const parts = (a.users_interaction_id || "").split("_");
      if (parts.length < 3) return;
      const vendorUserId = Number(parts[1]);
      const issueId = Number(parts[2]);
      if (!vendorUserId || !issueId) return;
      if (!userIssueIds.has(issueId)) return;

      // Skip if this vendor already has an offer for this issue
      const issueOffers = offersByIssueId[issueId] || [];
      if (issueOffers.some((o) => o.vendor_id === vendorUserId)) return;

      const issue = userIssues.find((i) => i.id === issueId);
      if (!issue) return;
      const report = reports.find((r) => r.id === issue.report_id);
      const listing = listings.find((l) => l.id === report?.listing_id);
      const vendor = vendorByUserId.get(vendorUserId);

      const key = `${issueId}-${vendorUserId}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          issue,
          listing,
          vendor,
          vendorUserId,
          proposals: [],
        });
      }
      grouped.get(key)!.proposals.push(a);
    });

    // Set earliest proposal per group
    const result = Array.from(grouped.values()).map((g) => ({
      ...g,
      earliest: [...g.proposals].sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )[0],
    }));

    // Sort groups by earliest proposal time (soonest first)
    return result.sort((a, b) => {
      const aTime = a.earliest ? new Date(a.earliest.start_time).getTime() : 0;
      const bTime = b.earliest ? new Date(b.earliest.start_time).getTime() : 0;
      return aTime - bTime;
    });
  }, [clientAssessments, userIssues, offersByIssueId, reports, listings, vendorByUserId]);

  const formatProposedDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Stats — based on full offer set (not filtered) so totals stay stable
  const stats = useMemo(() => {
    let pending = 0;
    let accepted = 0;
    let committed = 0;

    offerRows.forEach(({ offer, issue }) => {
      const isCompleted = (issue.status || "").toUpperCase().includes("COMPLETED");
      if (offer.status === IssueOfferStatus.RECEIVED && !isCompleted) {
        pending += 1;
      }
      if (offer.status === IssueOfferStatus.ACCEPTED) {
        accepted += 1;
        committed += offer.price || 0;
      }
    });

    return { pending, accepted, committed };
  }, [offerRows]);

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${value.toLocaleString()}`;
    }
    return `$${value}`;
  };

  const handleAcceptOffer = async (offer: IssueOffer) => {
    try {
      const issue = issues.find(i => i.id === offer.issue_id);
      const report = issue ? reports.find(r => r.id === issue.report_id) : null;
      const listing = report ? listings.find(l => l.id === report.listing_id) : undefined;
      const slimIssue = issue ? { ...issue, image_urls: [] } : null;
      const slimListing = listing ? { ...listing } : null;
      const pendingData = {
        offer_id: offer.id,
        issue_id: offer.issue_id,
        vendor_id: offer.vendor_id,
        price: offer.price,
        comment_vendor: offer.comment_vendor || "",
        comment_client: offer.comment_client || "",
        issue: slimIssue,
        listing: slimListing,
      };
      localStorage.setItem("pending_offer_payment", JSON.stringify(pendingData));

      if (issue) {
        const imageUrls = getIssueImageUrls(issue.image_urls);
        if (imageUrls.length > 0) {
          saveIssueImages(offer.issue_id, imageUrls).catch(() => {});
        }
      }

      const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const successUrl = `${baseUrl}/offers?filter=accepted&session_id={CHECKOUT_SESSION_ID}`;
      const response = await createCheckoutSession({
        client_id: (client?.id ?? userId)!,
        vendor_id: offer.vendor_id,
        offer_id: offer.id,
        success_url: successUrl,
      }).unwrap();
      window.location.href = response.session_url;
    } catch (err: any) {
      console.error("Stripe error", err);
      localStorage.removeItem("pending_offer_payment");
      const errorDetail = err?.data?.detail || "";
      if (errorDetail.includes("Stripe Information not found")) {
        toast.error("Payment setup required. Add a payment method in Settings (gear icon → Payment Settings), or the vendor may need to complete Stripe setup.");
      } else {
        toast.error("Could not start payment session. Please try again.");
      }
    }
  };

  const handleDeclineOffer = async (offer: IssueOffer) => {
    setIsProcessingOffer(true);
    try {
      await updateOffer({
        id: offer.id,
        issue_id: offer.issue_id,
        vendor_id: offer.vendor_id,
        price: offer.price,
        status: "rejected",
        user_last_viewed: new Date().toISOString(),
        comment_vendor: offer.comment_vendor || "",
        comment_client: offer.comment_client || "",
      }).unwrap();
      toast.success("Offer declined");
      setSelectedOffer(null);
    } catch (err) {
      console.error("Failed to decline offer", err);
      toast.error("Could not decline offer. Please try again.");
    } finally {
      setIsProcessingOffer(false);
    }
  };

  const handleApproveWork = async () => {
    if (!selectedIssueForAction) return;
    try {
      await updateIssue(buildIssueUpdateBody(selectedIssueForAction.issue, {
        status: "completed",
        review_status: "completed",
      }, selectedIssueForAction.listing?.id)).unwrap();
      setShowApproveModal(false);
      setSelectedIssueForAction(null);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success(`Work approved for ${selectedIssueForAction.issue.summary || "issue"}!`);
    } catch (err) {
      console.error("Failed to approve work", err);
      toast.error("Failed to approve work. Please try again.");
    }
  };

  const handleRequestChanges = async () => {
    if (!selectedIssueForAction || !changeRequestMessage.trim()) return;
    try {
      await updateIssue(buildIssueUpdateBody(selectedIssueForAction.issue, { status: "in_progress" }, selectedIssueForAction.listing?.id)).unwrap();
      setShowRequestChangesModal(false);
      setSelectedIssueForAction(null);
      setChangeRequestMessage("");
      toast.success("Changes requested! The vendor will be notified.");
    } catch (err) {
      console.error("Failed to request changes", err);
      toast.error("Failed to request changes. Please try again.");
    }
  };

  if (!userId) {
    return <div className="p-6">Please log in to view offers.</div>;
  }

  const totalVisible = sortedRows.length;
  const hasAnyOffers = offerRows.length > 0;

  // Vendor avatar helpers
  const getVendorInitials = (vendor?: Vendor): string => {
    const name = vendor?.name || vendor?.company_name || "";
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "?";
  };

  const getStatusBadge = (status: IssueOfferStatus) => {
    if (status === IssueOfferStatus.ACCEPTED) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
          Accepted
        </span>
      );
    }
    if (status === IssueOfferStatus.REJECTED) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
          Declined
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
        Pending
      </span>
    );
  };

  const renderRow = (row: OfferRow) => {
    const { offer, issue, listing, vendor } = row;
    const vendorName = vendor?.name || vendor?.company_name || "Unknown vendor";
    const rating = vendor?.rating ? Number(vendor.rating) : null;
    const issueImages = getIssueImageUrlsFromIssue(issue);

    return (
      <div
        key={offer.id}
        onClick={() => setSelectedOffer(row)}
        className="flex items-center gap-4 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
      >
        {/* Vendor avatar */}
        <div className="flex-shrink-0">
          {vendor?.profile_image_url && vendor.profile_image_url !== "None" ? (
            <img
              src={vendor.profile_image_url}
              alt={vendorName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
              {getVendorInitials(vendor)}
            </div>
          )}
        </div>

        {/* Vendor + issue info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 truncate">{vendorName}</span>
            {rating !== null && !Number.isNaN(rating) && (
              <span className="inline-flex items-center gap-0.5 text-xs text-gray-700 flex-shrink-0">
                <FontAwesomeIcon icon={faStar} className="w-3 h-3 text-amber-400" />
                {rating.toFixed(1)}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {issue.summary || "Issue"}
            {listing?.address && (
              <>
                <span className="mx-1.5">·</span>
                <span>{listing.address}</span>
              </>
            )}
          </div>
        </div>

        {/* Issue images with arrow navigation */}
        <div className="hidden sm:block flex-shrink-0">
          <IssueImageThumb images={issueImages} />
        </div>

        {/* Price */}
        <div className="flex-shrink-0 text-right min-w-[72px]">
          <div className="text-base font-bold text-gray-900">
            ${(offer.price || 0).toLocaleString()}
          </div>
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0">{getStatusBadge(offer.status)}</div>

        {/* Chevron */}
        <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 w-3 h-3 flex-shrink-0" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-[1600px] mx-auto px-4 py-5 lg:px-8 lg:py-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Offers</h1>
          <p className="text-sm text-gray-500 mt-1">
            {stats.pending} pending · {stats.accepted} accepted
          </p>
        </div>

        {/* Stat Cards */}
        {listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              className={`flex items-center gap-3 bg-white rounded-xl p-4 border transition-all text-left hover:shadow-sm ${
                statusFilter === "pending" ? "border-gray-900" : "border-gray-200"
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faClock} className="text-amber-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900 leading-tight">{stats.pending}</div>
                <div className="text-xs text-gray-500 mt-0.5">Pending</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("accepted")}
              className={`flex items-center gap-3 bg-white rounded-xl p-4 border transition-all text-left hover:shadow-sm ${
                statusFilter === "accepted" ? "border-gray-900" : "border-gray-200"
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900 leading-tight">{stats.accepted}</div>
                <div className="text-xs text-gray-500 mt-0.5">Accepted</div>
              </div>
            </button>

            <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-gray-200">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faDollarSign} className="text-amber-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900 leading-tight">
                  {formatCurrency(stats.committed)}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">Committed</div>
              </div>
            </div>
          </div>
        )}

        {/* Assessment Requests — vendor proposed an inspection time but hasn't quoted yet */}
        {assessmentRequests.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 text-blue-600" />
                Assessment Requests
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {assessmentRequests.length}
                </span>
              </h2>
            </div>
            <div className="space-y-2">
              {assessmentRequests.map((req) => {
                const vendorName = req.vendor?.name || req.vendor?.company_name || "Unknown vendor";
                const rating = req.vendor?.rating ? Number(req.vendor.rating) : null;
                return (
                  <div
                    key={`${req.issue.id}-${req.vendorUserId}`}
                    onClick={() => setSelectedIssue({ issue: req.issue, listing: req.listing, defaultTab: "assessments" })}
                    className="flex items-center gap-4 px-4 py-3 bg-white border border-blue-200 rounded-xl hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                  >
                    <div className="flex-shrink-0">
                      {req.vendor?.profile_image_url && req.vendor.profile_image_url !== "None" ? (
                        <img
                          src={req.vendor.profile_image_url}
                          alt={vendorName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700">
                          {(vendorName[0] || "?").toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 truncate">{vendorName}</span>
                        {rating !== null && !Number.isNaN(rating) && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-gray-700 flex-shrink-0">
                            <FontAwesomeIcon icon={faStar} className="w-3 h-3 text-amber-400" />
                            {rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {req.issue.summary || "Issue"}
                        {req.listing?.address && (
                          <>
                            <span className="mx-1.5">·</span>
                            <span className="inline-flex items-center gap-1">
                              <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3" />
                              {req.listing.address}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="hidden sm:flex flex-col items-end text-xs text-gray-600 flex-shrink-0">
                      {req.earliest && (
                        <div className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3 text-blue-600" />
                          <span>{formatProposedDate(req.earliest.start_time)}</span>
                        </div>
                      )}
                      {req.proposals.length > 1 && (
                        <span className="text-[11px] text-gray-400">
                          +{req.proposals.length - 1} more time{req.proposals.length - 1 > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 flex-shrink-0">
                      <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3" />
                      Assessment Requested
                    </span>

                    <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 w-3 h-3 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search + filters bar */}
        {listings.length > 0 && hasAnyOffers && (
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex-1 relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendor or issue..."
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent min-w-[140px]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
            </select>
            <select
              value={grouping}
              onChange={(e) => setGrouping(e.target.value as GroupingMode)}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent min-w-[140px]"
            >
              <option value="none">No Grouping</option>
              <option value="issue">Group by Issue</option>
              <option value="property">Group by Property</option>
            </select>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading offers...</h3>
            <p className="text-gray-500">Please wait while we fetch your offers</p>
          </div>
        ) : sortedRows.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            {(statusFilter !== "all" || searchQuery.trim()) ? (
              <div className="text-center py-8">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="w-12 h-12 text-gray-300 mb-4 mx-auto"
                />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No matching offers</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
                <button
                  onClick={() => {
                    setStatusFilter("all");
                    setSearchQuery("");
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition"
                >
                  Clear filters
                </button>
              </div>
            ) : listings.length === 0 ? (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 lg:p-10">
                <div className="absolute top-0 right-0 w-72 h-72 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
                  <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/20 text-gold rounded-full text-sm font-medium mb-4">
                      <FontAwesomeIcon icon={faRocket} />
                      Get Started
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                      Ready to receive quotes?
                    </h2>
                    <p className="text-gray-400 text-base mb-6 max-w-lg">
                      Upload your inspection report and post issues to the marketplace. Verified contractors will send you competitive quotes.
                    </p>

                    <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-6">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <FontAwesomeIcon icon={faShieldAlt} className="text-gold" />
                        Verified pros only
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <FontAwesomeIcon icon={faBolt} className="text-gold" />
                        Fast responses
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-gold" />
                        Compare & save
                      </div>
                    </div>

                    <button
                      onClick={() => navigate("/dashboard")}
                      className="inline-flex items-center gap-3 px-6 py-3 bg-gold text-white rounded-xl font-bold text-base hover:bg-foreground hover:text-background transition-all shadow-lg hover:shadow-gold/25 hover:-translate-y-0.5"
                    >
                      <FontAwesomeIcon icon={faHome} />
                      Add Your First Property
                      <FontAwesomeIcon icon={faArrowRight} />
                    </button>
                  </div>

                  <div className="hidden lg:flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute -top-2 -left-2 w-36 h-44 bg-gray-700/50 rounded-2xl rotate-6 border border-gray-600/30"></div>
                      <div className="absolute -top-1 -left-1 w-36 h-44 bg-gray-600/50 rounded-2xl rotate-3 border border-gray-500/30"></div>
                      <div className="relative w-36 h-44 bg-white rounded-2xl shadow-2xl flex flex-col items-center justify-center p-4">
                        <div className="w-14 h-14 bg-gold-200 rounded-xl flex items-center justify-center mb-3">
                          <FontAwesomeIcon icon={faClipboardList} className="text-xl text-gold" />
                        </div>
                        <div className="h-2 w-20 bg-gray-200 rounded mb-2"></div>
                        <div className="h-2 w-16 bg-gray-100 rounded mb-2"></div>
                        <div className="h-2 w-12 bg-gray-100 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FontAwesomeIcon icon={faClipboardList} className="text-3xl text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No offers yet</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Once you post issues to the marketplace, contractors will send you quotes. Make sure your issues are visible to vendors.
                </p>
                <button
                  onClick={() => navigate("/listings")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-gray-800 transition"
                >
                  View Your Properties
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {grouping === "none"
                ? sortedRows.slice(0, visibleCount).map(renderRow)
                : groupedRows.map((group) => (
                    <div key={group.key} className="space-y-2">
                      <div className="px-1 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {group.label}
                      </div>
                      {group.rows.map(renderRow)}
                    </div>
                  ))}
            </div>

            {grouping === "none" && visibleCount < totalVisible && (
              <div className="mt-4">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 20)}
                  className="w-full py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl border border-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  Load more ({totalVisible - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}

      {/* Approve Modal */}
      {showApproveModal && selectedIssueForAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowApproveModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Approve Work?</h3>
                <p className="text-sm text-gray-600 mb-3">
                  This will mark the work as complete and finalize the project. Make sure you're satisfied with the work quality before approving.
                </p>
                <div className="bg-gold-50 border border-gold-200 rounded-lg p-3">
                  <p className="text-xs text-gold-700 font-medium flex items-start gap-2">
                    <svg className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Once approved, this action cannot be undone.</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 transition-colors"
                onClick={() => setShowApproveModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold bg-green-600 hover:bg-green-700 transition-colors"
                onClick={handleApproveWork}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revise Modal */}
      {showRequestChangesModal && selectedIssueForAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowRequestChangesModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-gold-200 rounded-full flex-shrink-0">
                <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Revise</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Describe what needs to be corrected or improved. The vendor will be notified and the work will return to "In Progress".
                </p>
              </div>
            </div>

            <textarea
              value={changeRequestMessage}
              onChange={(e) => setChangeRequestMessage(e.target.value)}
              placeholder="Describe what changes are needed..."
              className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setShowRequestChangesModal(false);
                  setChangeRequestMessage("");
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold bg-gold hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!changeRequestMessage.trim()}
                onClick={handleRequestChanges}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Detail Modal */}
      {selectedOffer && (
        <OfferDetailModal
          offer={selectedOffer.offer}
          issue={selectedOffer.issue}
          listing={selectedOffer.listing}
          vendor={selectedOffer.vendor}
          currentUserId={userId}
          isProcessing={isProcessingOffer}
          onClose={() => setSelectedOffer(null)}
          onAccept={() => handleAcceptOffer(selectedOffer.offer)}
          onDecline={() => handleDeclineOffer(selectedOffer.offer)}
        />
      )}

      {/* Issue Details Modal */}
      {selectedIssue && (
        <div
          className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center"
          onClick={() => setSelectedIssue(null)}
        >
          <div
            className="relative w-[1100px] h-[80vh] mx-auto overflow-hidden rounded-2xl shadow-xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedIssue(null)}
              className="absolute -top-10 right-0 text-white text-3xl leading-none px-2"
            >
              &times;
            </button>
            <HomeownerIssueCard
              key={`${selectedIssue.issue.id}-${selectedIssue.defaultTab}`}
              issue={(() => {
                const fromCache = (issues || []).find(i => i.id === selectedIssue.issue.id) ?? selectedIssue.issue;
                const cacheHasImages = getIssueImageUrls(fromCache.image_urls).length > 0;
                const selectedHasImages = getIssueImageUrls(selectedIssue.issue.image_urls).length > 0;
                if (!cacheHasImages && selectedHasImages) return { ...fromCache, image_urls: selectedIssue.issue.image_urls };
                return fromCache;
              })()}
              listing={selectedIssue.listing}
              onClose={() => setSelectedIssue(null)}
              defaultTab={selectedIssue.defaultTab || "offers"}
              autoOpenDispute={false}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Offers;
