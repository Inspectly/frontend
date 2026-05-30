import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faChevronLeft,
  faChevronRight,
  faStar,
  faTriangleExclamation,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { MapPin, Clock, Pencil } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import {
  Client,
  IssueAddress,
  IssueAssessment,
  IssueAssessmentStatus,
  IssueOffer,
  IssueOfferStatus,
  IssueType,
  Listing,
} from "../types";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";
import { getRelativeTime } from "../utils/dateUtils";
import BidStatusButton from "./BidStatusButton";
import { getBidStage } from "../utils/bidStatus";
import { getIssueImageUrls } from "../utils/issueImageUtils";
import { getIssueImages, saveIssueImages } from "../utils/issueImageStore";
import { BUTTON_HOVER } from "../styles/shared";
import { useGetIssueByIdQuery } from "../features/api/issuesApi";
import { useGetReportByIdQuery } from "../features/api/reportsApi";
import { useGetClientByUserIdQuery } from "../features/api/clientsApi";
import { useGetClientReviewsByClientUserIdQuery } from "../features/api/clientReviewsApi";
import { useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";
import {
  useCreateOfferMutation,
  useUpdateOfferMutation,
  useDeleteOfferMutation,
  useGetOffersByIssueIdQuery,
} from "../features/api/issueOffersApi";
import {
  useCreateAssessmentMutation,
  useUpdateAssessmentMutation,
  useDeleteAssessmentMutation,
  useGetAssessmentsByIssueIdQuery,
} from "../features/api/issueAssessmentsApi";

export interface MarketplaceIssueCardProps {
  issue: IssueType;
  listing?: Listing;
  /** Per-issue address (city/state/postal) when no full listing is available. */
  address?: IssueAddress;
  /** The vendor's offer already known by the marketplace, shown instantly while
   *  the per-issue offers query loads. */
  initialMyOffer?: IssueOffer;
  /** The vendor's assessment request already known by the marketplace, shown
   *  instantly while the per-issue assessments query loads. */
  initialMyAssessment?: IssueAssessment;
  /** The homeowner already known by the marketplace, shown instantly so the
   *  name doesn't wait on a per-issue client round-trip. */
  initialClient?: Client;
  onClose?: () => void;
  onNotInterested?: () => void;
  /** Open the bid/assessment panel immediately (e.g. from a "Quote" button). */
  autoOpenBid?: boolean;
}

const PLACEHOLDER = "/images/property_card_holder.jpg";

/** Local ISO string (no timezone suffix), matching CalendarSelector's format. */
const toLocalISOString = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
};

/** Build the 30-minute time-of-day options between 7:00 AM and 7:00 PM. */
const TIME_OPTIONS: { value: string; label: string }[] = (() => {
  const opts: { value: string; label: string }[] = [];
  for (let mins = 7 * 60; mins <= 19 * 60; mins += 30) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const display = new Date(2000, 0, 1, h, m).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    opts.push({ value, label: display });
  }
  return opts;
})();

const DURATION_OPTIONS = [
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

const MarketplaceIssueCard: React.FC<MarketplaceIssueCardProps> = ({
  issue,
  listing,
  address,
  initialMyOffer,
  initialMyAssessment,
  initialClient,
  onClose,
  onNotInterested,
  autoOpenBid = false,
}) => {
  const userId = useSelector((state: RootState) => state.auth.user?.id);

  // Full issue (for image_urls that may be absent on cached marketplace rows)
  const { data: fetchedIssue } = useGetIssueByIdQuery(String(issue?.id), {
    skip: !issue?.id,
  });

  // Only needed to resolve the homeowner when the listing isn't available;
  // skip it entirely when the listing already gives us the owner id.
  const { data: report } = useGetReportByIdQuery(issue.report_id, {
    skip: !issue.report_id || !!listing?.user_id,
  });

  // Prefer the listing's owner id (available synchronously from the marketplace)
  // so the client/name query can fire immediately, instead of waiting on the
  // report round-trip first (which created a visible name-loading delay).
  const clientUserId = listing?.user_id ?? report?.user_id;
  // Skip the per-issue client fetch when the marketplace already handed us the
  // homeowner; otherwise resolve it on demand.
  const { data: fetchedClient } = useGetClientByUserIdQuery(
    String(clientUserId ?? ""),
    { skip: !clientUserId || !!initialClient }
  );
  const client = fetchedClient ?? initialClient;
  const { data: clientReviews = [] } = useGetClientReviewsByClientUserIdQuery(
    Number(clientUserId),
    { skip: !clientUserId }
  );

  const { data: currentVendor } = useGetVendorByVendorUserIdQuery(userId, {
    skip: !userId,
  });

  const [createOffer] = useCreateOfferMutation();
  const [updateOffer] = useUpdateOfferMutation();
  const [deleteOffer] = useDeleteOfferMutation();
  const [createAssessment] = useCreateAssessmentMutation();
  const [updateAssessment] = useUpdateAssessmentMutation();
  const [deleteAssessment] = useDeleteAssessmentMutation();

  // Address is only revealed once the homeowner commits — i.e. an assessment
  // time has been accepted, or an offer has been accepted (vendor assigned).
  const { data: issueAssessments = [], isLoading: assessmentsLoading } =
    useGetAssessmentsByIssueIdQuery(issue.id, { skip: !issue?.id });
  const { data: issueOffers = [], isLoading: offersLoading } =
    useGetOffersByIssueIdQuery(issue.id, { skip: !issue?.id });

  // ── Images ─────────────────────────────────────────────────────────────────
  const [storedImages, setStoredImages] = useState<string[] | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!issue?.id) return;
    const urls = getIssueImageUrls(issue.image_urls);
    if (urls.length > 0) saveIssueImages(issue.id, urls).catch(() => {});
  }, [issue?.id, issue?.image_urls]);

  useEffect(() => {
    if (!issue?.id) return;
    getIssueImages(issue.id).then(setStoredImages);
  }, [issue?.id]);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [issue?.id]);

  const imageList = useMemo(() => {
    const fromFetched = getIssueImageUrls(fetchedIssue?.image_urls);
    if (fromFetched.length > 0) return fromFetched;
    const fromIssue = getIssueImageUrls(issue?.image_urls);
    if (fromIssue.length > 0) return fromIssue;
    if (storedImages && storedImages.length > 0) return storedImages;
    if (listing?.image_url) return [listing.image_url];
    return [PLACEHOLDER];
  }, [fetchedIssue?.image_urls, issue?.image_urls, storedImages, listing?.image_url]);

  useEffect(() => {
    if (currentImageIndex >= imageList.length) setCurrentImageIndex(0);
  }, [currentImageIndex, imageList.length]);

  // ── Derived display values ───────────────────────────────────────────────────
  const homeownerName = client
    ? `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim()
    : "";
  const homeownerInitials = client
    ? `${client.first_name?.[0] ?? ""}${client.last_name?.[0] ?? ""}`.toUpperCase()
    : "?";
  const avgRating = useMemo(() => {
    if (!clientReviews.length) return null;
    const sum = clientReviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    return sum / clientReviews.length;
  }, [clientReviews]);

  const severityLower = (issue.severity || "").toLowerCase();
  const isUrgent = severityLower === "high";
  const severityColors: Record<string, string> = {
    high: "bg-red-100 text-red-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-green-100 text-green-600",
  };
  const severityClass = severityColors[severityLower] ?? "bg-gray-100 text-gray-600";

  // ── Location / address reveal ────────────────────────────────────────────────
  const hasAcceptedAssessment = useMemo(
    () =>
      issueAssessments.some(
        (a) => a.status === IssueAssessmentStatus.ACCEPTED
      ),
    [issueAssessments]
  );
  const hasAcceptedOffer = useMemo(
    () =>
      issue.vendor_id != null ||
      issueOffers.some((o) => o.status === IssueOfferStatus.ACCEPTED),
    [issue.vendor_id, issueOffers]
  );
  const showFullAddress = hasAcceptedAssessment || hasAcceptedOffer;

  // The current vendor's own bid on this issue (offers store the vendor's user id).
  // While the per-issue query is still loading, fall back to the offer the
  // marketplace already passed in so the footer renders instantly. Once the
  // query has resolved we trust it fully (so a deleted offer disappears).
  const myOffer = useMemo(() => {
    const fromIssue = issueOffers.find(
      (o) => Number(o.vendor_id) === Number(userId)
    );
    if (fromIssue) return fromIssue;
    return offersLoading ? initialMyOffer : undefined;
  }, [issueOffers, userId, offersLoading, initialMyOffer]);
  const isMyOfferAccepted = myOffer?.status === IssueOfferStatus.ACCEPTED;

  // The current vendor's own assessment request on this issue (if any).
  // Offers and assessments are mutually exclusive paths for the vendor.
  const myAssessment = useMemo(() => {
    const mine = issueAssessments.filter(
      (a) =>
        Number(a.user_id) === Number(userId) &&
        a.status !== IssueAssessmentStatus.REJECTED
    );
    if (mine.length === 0) {
      // While the per-issue query loads, fall back to the assessment the
      // marketplace already passed in so the footer renders instantly.
      return assessmentsLoading ? initialMyAssessment : undefined;
    }
    // Prefer an accepted one, otherwise the most recently created.
    const accepted = mine.find(
      (a) => a.status === IssueAssessmentStatus.ACCEPTED
    );
    if (accepted) return accepted;
    return [...mine].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  }, [issueAssessments, userId, assessmentsLoading, initialMyAssessment]);
  const isMyAssessmentAccepted =
    myAssessment?.status === IssueAssessmentStatus.ACCEPTED;
  const stage = getBidStage(myOffer, myAssessment);

  const city = listing?.city ?? address?.city ?? "";
  const state = listing?.state ?? address?.state ?? "";
  const postalCode = listing?.postal_code ?? address?.postal_code ?? "";
  const street = listing?.address ?? address?.address ?? "";

  const cityState = [city, state].filter(Boolean).join(", ");
  const locationLabel = useMemo(() => {
    if (showFullAddress && street) {
      return [street, cityState, postalCode].filter(Boolean).join(", ");
    }
    return [cityState, postalCode].filter(Boolean).join(" ").trim();
  }, [showFullAddress, street, cityState, postalCode]);

  // ── Bid / assessment panel ───────────────────────────────────────────────────
  const [isBidOpen, setIsBidOpen] = useState(false);
  const [wantsAssessment, setWantsAssessment] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [comment, setComment] = useState("");
  const [bidError, setBidError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAssessmentDeleteConfirm, setShowAssessmentDeleteConfirm] =
    useState(false);
  const [isDeletingAssessment, setIsDeletingAssessment] = useState(false);

  // Assessment scheduling
  const [assessDate, setAssessDate] = useState("");
  const [assessTime, setAssessTime] = useState(TIME_OPTIONS[0]?.value ?? "09:00");
  const [assessDuration, setAssessDuration] = useState(60);

  const usersInteractionId = useMemo(() => {
    if (!clientUserId || !currentVendor?.id || !issue?.id) return "";
    return `${clientUserId}_${currentVendor.id}_${issue.id}`;
  }, [clientUserId, currentVendor?.id, issue?.id]);

  const resetBidState = () => {
    setWantsAssessment(false);
    setOfferAmount("");
    setComment("");
    setBidError("");
    setAssessDate("");
    setAssessTime(TIME_OPTIONS[0]?.value ?? "09:00");
    setAssessDuration(60);
  };

  const prefillGuard = useRef(false);
  // Prevents a double-submit in the brief window before the modal unmounts.
  const submitGuard = useRef(false);

  const openBid = () => {
    prefillGuard.current = false;
    resetBidState();
    setIsBidOpen(true);
  };
  const closeBid = () => {
    if (isSubmitting) return;
    setIsBidOpen(false);
  };

  // Open the panel pre-set to the assessment flow, prefilled from the
  // vendor's existing assessment so they can edit the proposed time.
  const openAssessmentEdit = () => {
    if (!myAssessment) return;
    prefillGuard.current = true;
    resetBidState();
    setWantsAssessment(true);
    const start = new Date(myAssessment.start_time);
    if (!isNaN(start.getTime())) {
      const pad = (n: number) => String(n).padStart(2, "0");
      setAssessDate(
        `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(
          start.getDate()
        )}`
      );
      setAssessTime(`${pad(start.getHours())}:${pad(start.getMinutes())}`);
    }
    if (myAssessment.min_assessment_time) {
      setAssessDuration(myAssessment.min_assessment_time);
    }
    setIsBidOpen(true);
  };

  const formatAssessmentTime = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Open the bid panel immediately when launched from a "Quote" action
  // (but never for an already-accepted offer).
  useEffect(() => {
    // Don't auto-open the amount panel while an assessment is still pending —
    // the price path is blocked until the homeowner confirms (or it's deleted).
    if (
      autoOpenBid &&
      !isMyOfferAccepted &&
      (!myAssessment || isMyAssessmentAccepted)
    ) {
      prefillGuard.current = false;
      resetBidState();
      setIsBidOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenBid, issue?.id, isMyOfferAccepted, myAssessment, isMyAssessmentAccepted]);

  // Prefill the price from the vendor's existing (editable) bid, once the
  // offers have loaded after the panel opens.
  useEffect(() => {
    if (
      isBidOpen &&
      !prefillGuard.current &&
      myOffer &&
      !isMyOfferAccepted
    ) {
      setOfferAmount(String(myOffer.price ?? ""));
      setComment(myOffer.comment_vendor ?? "");
      prefillGuard.current = true;
    }
  }, [isBidOpen, myOffer, isMyOfferAccepted]);

  const handleSubmitOffer = async () => {
    const value = parseFloat(offerAmount);
    if (isNaN(value) || value <= 0) {
      setBidError("Please enter a valid bid amount greater than zero.");
      return;
    }
    if (!userId) {
      setBidError("You must be logged in to place a bid.");
      return;
    }
    if (submitGuard.current) return;
    submitGuard.current = true;

    const isUpdate = !!(myOffer && !isMyOfferAccepted);
    const request = isUpdate
      ? updateOffer({
          id: myOffer!.id,
          issue_id: issue.id,
          vendor_id: myOffer!.vendor_id,
          price: value,
          status: "received",
          comment_vendor: comment,
          comment_client: myOffer!.comment_client || "",
        })
      : createOffer({
          issue_id: issue.id,
          vendor_id: userId,
          price: value,
          status: "received",
          comment_vendor: comment,
          comment_client: "",
        });

    // Close immediately for a snappy experience (matches the delete flow). The
    // mutation invalidates the Offers cache so the card reflects the change on
    // its own; any failure surfaces as a toast.
    setIsSubmitting(true);
    setIsBidOpen(false);
    onClose?.();

    request
      .unwrap()
      .then(() => toast.success(isUpdate ? "Bid updated." : "Bid submitted."))
      .catch((err) => {
        console.error("Failed to submit bid:", err);
        toast.error("Failed to submit your bid. Please try again.");
      })
      .finally(() => {
        submitGuard.current = false;
        setIsSubmitting(false);
      });
  };

  const handleDeleteOffer = () => {
    if (!myOffer || isMyOfferAccepted) return;
    if (submitGuard.current) return;
    submitGuard.current = true;

    const request = deleteOffer({
      id: myOffer.id,
      issue_id: issue.id,
      vendor_id: myOffer.vendor_id,
    });

    // Close the confirm/panel immediately for a snappy experience. The mutation
    // invalidates the Offers cache and force-refetches the per-issue and
    // per-vendor offer queries, so the card/modal revert on their own. Awaiting
    // here only kept the dialog stuck on "Deleting…" for the whole round-trip.
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    setIsBidOpen(false);

    request
      .unwrap()
      .then(() => toast.success("Offer removed."))
      .catch((err) => {
        console.error("Failed to delete offer:", err);
        toast.error("Failed to remove your offer. Please try again.");
      })
      .finally(() => {
        submitGuard.current = false;
        setIsDeleting(false);
      });
  };

  const handleSubmitAssessment = async () => {
    if (!assessDate) {
      setBidError("Please choose a date for the assessment.");
      return;
    }
    if (!userId) {
      setBidError("You must be logged in to request an assessment.");
      return;
    }
    if (!usersInteractionId) {
      setBidError("Unable to schedule — homeowner details are still loading.");
      return;
    }
    const [hh, mm] = assessTime.split(":").map(Number);
    const start = new Date(`${assessDate}T00:00:00`);
    start.setHours(hh, mm, 0, 0);
    if (start.getTime() < Date.now()) {
      setBidError("Please choose a future date and time.");
      return;
    }
    const end = new Date(start.getTime() + assessDuration * 60000);

    if (submitGuard.current) return;
    submitGuard.current = true;

    const isUpdate = !!(myAssessment && !isMyAssessmentAccepted);
    const request = isUpdate
      ? updateAssessment({
          id: myAssessment!.id,
          issue_id: issue.id,
          user_id: myAssessment!.user_id,
          user_type: "vendor",
          // The backend re-hashes interaction_id via get_uuid(), so it must be
          // the RAW "client_vendor_issue" string (stored in users_interaction_id),
          // not the already-hashed interaction_id returned by the GET.
          interaction_id:
            myAssessment!.users_interaction_id || usersInteractionId,
          users_interaction_id:
            myAssessment!.users_interaction_id || usersInteractionId,
          start_time: toLocalISOString(start),
          end_time: toLocalISOString(end),
          status: "received",
          min_assessment_time: assessDuration,
          user_last_viewed: new Date().toISOString(),
        })
      : createAssessment({
          issue_id: issue.id,
          user_id: userId,
          user_type: "vendor",
          interaction_id: usersInteractionId,
          users_interaction_id: usersInteractionId,
          start_time: toLocalISOString(start),
          end_time: toLocalISOString(end),
          status: "received",
          min_assessment_time: assessDuration,
        });

    // Close immediately for a snappy experience; the cache invalidation
    // refreshes the card, and failures surface as a toast.
    setIsSubmitting(true);
    setIsBidOpen(false);
    onClose?.();

    request
      .unwrap()
      .then(() =>
        toast.success(
          isUpdate ? "Assessment time updated." : "Assessment time proposed."
        )
      )
      .catch((err) => {
        console.error("Failed to propose assessment:", err);
        const detail =
          (err as { data?: { detail?: string } })?.data?.detail ??
          (typeof (err as { data?: unknown })?.data === "string"
            ? (err as { data?: string }).data
            : undefined);
        toast.error(
          detail
            ? `Failed to submit the assessment request: ${detail}`
            : "Failed to submit the assessment request. Please try again."
        );
      })
      .finally(() => {
        submitGuard.current = false;
        setIsSubmitting(false);
      });
  };

  const handleDeleteAssessment = async () => {
    if (!myAssessment || isMyAssessmentAccepted) return;
    setIsDeletingAssessment(true);
    try {
      await deleteAssessment({
        id: Number(myAssessment.id),
        issue_id: issue.id,
        // Delete also re-hashes via get_uuid(), so send the RAW interaction id.
        interaction_id:
          myAssessment.users_interaction_id || usersInteractionId,
        // Lets the API refetch the per-user list so marketplace cards revert.
        user_id: myAssessment.user_id,
      }).unwrap();
      toast.success("Assessment request removed.");
      setShowAssessmentDeleteConfirm(false);
      setIsBidOpen(false);
    } catch (err) {
      console.error("Failed to delete assessment:", err);
      toast.error("Failed to remove the assessment request. Please try again.");
      setShowAssessmentDeleteConfirm(false);
    } finally {
      setIsDeletingAssessment(false);
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-card rounded-2xl overflow-hidden">
      {/* ── Image carousel ── */}
      <div className="relative group/img flex-shrink-0">
        <img
          src={imageList[currentImageIndex] || PLACEHOLDER}
          alt="Issue"
          className="w-full h-72 object-cover cursor-pointer"
          onClick={() => setSelectedImage(imageList[currentImageIndex] || null)}
          onError={(e) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER;
          }}
        />
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors z-10 backdrop-blur-sm"
          >
            <FontAwesomeIcon icon={faTimes} className="text-sm" />
          </button>
        )}
        {isUrgent && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wide">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-[0.7rem]" />
            Urgent
          </span>
        )}
        {issue.type && (
          <span className="absolute bottom-3 left-3 inline-flex items-center bg-black/70 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm capitalize">
            {normalizeAndCapitalize(issue.type)}
          </span>
        )}
        {imageList.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((p) => (p > 0 ? p - 1 : imageList.length - 1));
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-9 h-9 flex items-center justify-center transition-all backdrop-blur-sm shadow-lg opacity-0 group-hover/img:opacity-100"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((p) => (p < imageList.length - 1 ? p + 1 : 0));
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-9 h-9 flex items-center justify-center transition-all backdrop-blur-sm shadow-lg opacity-0 group-hover/img:opacity-100"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm font-medium">
              {currentImageIndex + 1} / {imageList.length}
            </div>
          </>
        )}
      </div>

      {/* ── Thumbnail strip ── */}
      {imageList.length > 1 && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border overflow-x-auto flex-shrink-0">
          {imageList
            .filter((u) => u !== PLACEHOLDER)
            .map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`Image ${idx + 1}`}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-14 h-14 rounded-lg object-cover cursor-pointer border-2 flex-shrink-0 transition-colors ${
                  idx === currentImageIndex
                    ? "border-gold"
                    : "border-transparent hover:border-gold/40"
                }`}
              />
            ))}
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Title */}
        <div className="px-6 pt-5">
          <h2 className="text-xl font-bold text-foreground leading-snug">
            {issue.summary || "No Title Found"}
          </h2>
        </div>

        {/* Meta row: location · posted time · homeowner name + rating */}
        <div className="px-6 pt-2 pb-4 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-muted-foreground">
          {locationLabel && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} className="flex-shrink-0" />
              {locationLabel}
            </span>
          )}
          {issue.created_at && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock size={14} className="flex-shrink-0" />
                Posted {getRelativeTime(issue.created_at)}
              </span>
            </>
          )}
          <span className="text-muted-foreground/50">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-gold/15 text-gold flex items-center justify-center text-[0.65rem] font-bold flex-shrink-0">
              {homeownerInitials}
            </span>
            <span className="font-medium text-foreground">
              {homeownerName || "Homeowner"}
            </span>
            {avgRating != null && (
              <span className="inline-flex items-center gap-1 text-foreground">
                <FontAwesomeIcon icon={faStar} className="text-gold text-[0.7rem]" />
                <span className="font-medium">{avgRating.toFixed(1)}</span>
              </span>
            )}
          </span>
        </div>

        <div className="border-t border-border" />

        {/* Description */}
        <div className="px-6 py-5">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Description
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {issue.description || "No description available."}
          </p>
        </div>

        {/* Tags row */}
        <div className="px-6 pb-5 flex flex-wrap gap-2">
          {issue.severity && (
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                isUrgent ? "bg-red-100 text-red-700" : severityClass
              }`}
            >
              {isUrgent
                ? "Urgent"
                : `${issue.severity.charAt(0).toUpperCase()}${issue.severity
                    .slice(1)
                    .toLowerCase()} Priority`}
            </span>
          )}
          {issue.type && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground capitalize">
              {normalizeAndCapitalize(issue.type)}
            </span>
          )}
        </div>
      </div>

      {/* ── Footer actions ── */}
      <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3 bg-card sticky bottom-0">
        <div>
          {(stage === "offer_accepted" || stage === "offer_pending") &&
          myOffer ? (
            <>
              <p className="text-xs text-muted-foreground leading-none mb-1">
                Your offer
              </p>
              <p className="text-lg font-bold text-foreground leading-none">
                ${Number(myOffer.price).toLocaleString()}
              </p>
            </>
          ) : myAssessment &&
            (stage === "assessment_pending" ||
              stage === "assessment_confirmed") ? (
            <>
              <p className="text-xs text-muted-foreground leading-none mb-1">
                {isMyAssessmentAccepted
                  ? "Assessment confirmed"
                  : "Assessment requested"}
              </p>
              <p className="text-base font-semibold text-foreground leading-none">
                {formatAssessmentTime(myAssessment.start_time)}
                {isMyAssessmentAccepted && (
                  <span className="ml-2 align-middle text-xs font-semibold text-emerald-600">
                    Accepted
                  </span>
                )}
              </p>
            </>
          ) : null}
        </div>
        <div className="flex items-stretch gap-3">
          {onNotInterested && stage === "none" && (
            <button
              onClick={onNotInterested}
              className={`px-5 py-2.5 rounded-lg border border-border bg-muted text-foreground font-medium ${BUTTON_HOVER}`}
            >
              Not Interested
            </button>
          )}

          {/* Pending offer: edit / delete, with a greyed "awaiting" status. */}
          {stage === "offer_pending" && (
            <>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                title="Delete offer"
                className="px-4 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faTrashCan} />
              </button>
              <button
                onClick={openBid}
                title="Edit offer"
                className="px-4 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Pending assessment: edit / delete, with a greyed "awaiting" status. */}
          {stage === "assessment_pending" && (
            <>
              <button
                onClick={() => setShowAssessmentDeleteConfirm(true)}
                disabled={isDeletingAssessment}
                title="Delete assessment request"
                className="px-4 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faTrashCan} />
              </button>
              <button
                onClick={openAssessmentEdit}
                title="Edit assessment time"
                className="px-4 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </>
          )}

          {/* The unified status button. CTA stages open the bid panel; waiting
              and accepted stages are inert status indicators. */}
          <BidStatusButton
            stage={stage}
            disabled={stage !== "none" && stage !== "assessment_confirmed"}
            onClick={openBid}
            className="min-w-[11rem] px-5 py-2.5"
          />
        </div>
      </div>

      {/* ── Fullscreen image ── */}
      {selectedImage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[60]">
          <div className="relative bg-white rounded-lg shadow-lg max-w-3xl">
            <button
              className="absolute top-2 right-2 text-gray-800 py-1 px-2 rounded-full"
              onClick={() => setSelectedImage(null)}
            >
              <FontAwesomeIcon icon={faTimes} className="text-xl" />
            </button>
            <img
              src={selectedImage}
              alt="Full View"
              className="max-w-full max-h-[90vh] rounded"
            />
          </div>
        </div>
      )}

      {/* ── Bid / assessment modal ── */}
      {isBidOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {myAssessment && !isMyAssessmentAccepted
                  ? "Edit assessment request"
                  : myOffer && !isMyOfferAccepted
                  ? "Edit your offer"
                  : "Place your bid"}
              </h2>
              <button
                onClick={closeBid}
                disabled={isSubmitting}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Assessment toggle — only offered on a fresh bid. Once an
                  assessment is pending the vendor edits/deletes it (no price);
                  once it's confirmed (or an offer exists) only the price path
                  is available. */}
              {!myOffer && !myAssessment && (
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={wantsAssessment}
                    disabled={isSubmitting}
                    onChange={(e) => {
                      setWantsAssessment(e.target.checked);
                      setBidError("");
                    }}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-gold focus:ring-gold"
                  />
                  <span className="text-sm text-gray-700">
                    <span className="font-medium text-gray-900">
                      Request an on-site assessment first
                    </span>
                    <br />
                    Schedule a visit before committing to a price.
                  </span>
                </label>
              )}

              {/* After a confirmed assessment, remind the vendor they're now
                  entering the agreed price. */}
              {isMyAssessmentAccepted && !wantsAssessment && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <p className="text-xs text-emerald-800">
                    Your assessment was confirmed. Enter your price below.
                  </p>
                </div>
              )}

              {wantsAssessment ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={assessDate}
                      disabled={isSubmitting}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        setAssessDate(e.target.value);
                        setBidError("");
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-gold focus:border-gold transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start time
                      </label>
                      <select
                        value={assessTime}
                        disabled={isSubmitting}
                        onChange={(e) => setAssessTime(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-gold focus:border-gold transition-colors"
                      >
                        {TIME_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration
                      </label>
                      <select
                        value={assessDuration}
                        disabled={isSubmitting}
                        onChange={(e) => setAssessDuration(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-gold focus:border-gold transition-colors"
                      >
                        {DURATION_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    The homeowner will be asked to confirm this time. You can
                    submit your price after the assessment.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bid amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        value={offerAmount}
                        disabled={isSubmitting}
                        min="1"
                        placeholder="Enter amount"
                        onChange={(e) => {
                          setOfferAmount(e.target.value);
                          setBidError("");
                        }}
                        className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-gold focus:border-gold transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comment (optional)
                    </label>
                    <textarea
                      value={comment}
                      disabled={isSubmitting}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a message for the homeowner..."
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-gold focus:border-gold transition-colors"
                    />
                  </div>

                  {/* Read-only warranty note: terms come from the vendor's
                      profile (Settings) and are attached to every offer. */}
                  {currentVendor?.warranty && currentVendor.warranty.trim() ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs text-green-800">
                        <span className="font-semibold">Warranty included:</span>{" "}
                        {currentVendor.warranty}
                      </p>
                      <p className="text-[11px] text-green-700/80 mt-0.5">
                        Edit your warranty in Profile settings.
                      </p>
                    </div>
                  ) : null}

                  {/* Yellow honor-price disclaimer */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-800 font-medium flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <span>
                        Without an assessment, this bid is binding — if the
                        homeowner accepts, you must honor this price.
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {bidError && <p className="text-red-600 text-sm">{bidError}</p>}
            </div>

            <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
              <button
                onClick={closeBid}
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg ${BUTTON_HOVER}`}
              >
                Cancel
              </button>
              <button
                onClick={wantsAssessment ? handleSubmitAssessment : handleSubmitOffer}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gold rounded-lg hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
              >
                {isSubmitting
                  ? "Sending..."
                  : wantsAssessment
                  ? myAssessment && !isMyAssessmentAccepted
                    ? "Update Assessment"
                    : "Request Assessment"
                  : myOffer && !isMyOfferAccepted
                  ? "Update Offer"
                  : "Place Bid"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete-offer confirmation ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full flex-shrink-0">
                <FontAwesomeIcon icon={faTrashCan} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Delete this offer?
                </h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete this offer? This can't be
                  undone, but you can submit a new one later.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className={`px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg ${BUTTON_HOVER} disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOffer}
                disabled={isDeleting}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Offer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete-assessment confirmation ── */}
      {showAssessmentDeleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full flex-shrink-0">
                <FontAwesomeIcon icon={faTrashCan} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Cancel this assessment request?
                </h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to remove the proposed assessment time?
                  You can request a new one later.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAssessmentDeleteConfirm(false)}
                disabled={isDeletingAssessment}
                className={`px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg ${BUTTON_HOVER} disabled:opacity-50`}
              >
                Keep
              </button>
              <button
                onClick={handleDeleteAssessment}
                disabled={isDeletingAssessment}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeletingAssessment ? "Removing..." : "Remove Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceIssueCard;
