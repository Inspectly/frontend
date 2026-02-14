import React, { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import VendorName from "./VendorName";
import { useUpdateOfferMutation } from "../features/api/issueOffersApi";
import { useGetVendorsQuery } from "../features/api/vendorsApi";
import {
  ISSUE_OFFER_STATUS_LABELS,
  IssueOffer,
  IssueOfferStatus,
  Vendor,
} from "../types";
import { BUTTON_HOVER } from "../styles/shared";

interface OffersTabClientProps {
  offers: IssueOffer[];
  uniqueVendors: number;
  handleOpenOfferModal: (offer: IssueOffer) => void;
  onOpenOfferModal: () => void;
  onOfferAccepted?: (offer: IssueOffer) => void;
  issueVendorId?: number | null;
  isProcessingPayment?: boolean;
}

const OffersTabClient: React.FC<OffersTabClientProps> = ({
  offers,
  onOfferAccepted,
  issueVendorId,
  isProcessingPayment = false,
}) => {
  const [updateOffer] = useUpdateOfferMutation();
  const { data: allVendors = [] } = useGetVendorsQuery();

  const vendorMap = new Map<string, Vendor>();
  allVendors.forEach((v) => vendorMap.set(String(v.vendor_user_id), v));

  const groupedOffers = new Map<string, IssueOffer[]>();
  offers.forEach((offer) => {
    const key = String(offer.vendor_id);
    if (!groupedOffers.has(key)) groupedOffers.set(key, []);
    groupedOffers.get(key)!.push(offer);
  });

  const handleAccept = async (offer: IssueOffer) => {
    if (onOfferAccepted) onOfferAccepted(offer);
  };

  const handleReject = async (offer: IssueOffer) => {
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
    } catch (err) {
      console.error("Failed to reject offer", err);
    }
  };

  const hasAcceptedOffer = useMemo(() => {
    // Check both: if any offer is accepted OR if the issue already has a vendor assigned
    return offers.some((offer) => offer.status === IssueOfferStatus.ACCEPTED) || !!issueVendorId;
  }, [offers, issueVendorId]);

  const acceptedOffer = useMemo(() => {
    return offers.find((offer) => offer.status === IssueOfferStatus.ACCEPTED);
  }, [offers]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + "Z").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr + "Z").toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {[...groupedOffers.entries()].map(([vendorUserId, vendorOffers]) => {
        const vendor = vendorMap.get(vendorUserId);
        const sortedOffers = [...vendorOffers].sort(
          (a, b) =>
            new Date(b.created_at + "Z").getTime() -
            new Date(a.created_at + "Z").getTime()
        );

        return (
          <div key={vendorUserId} className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Vendor Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                  {vendor?.profile_image_url && vendor.profile_image_url !== "None" ? (
                    <img
                      src={vendor.profile_image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gold text-white font-semibold">
                      {vendor?.company_name?.charAt(0) || "V"}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    <VendorName vendorId={Number(vendorUserId)} isVendorId={false} showRating />
                  </div>
                </div>
              </div>
            </div>

            {/* Offers Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Amount</th>
                    <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Status</th>
                    <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Comment</th>
                    <th className="text-right text-sm font-medium text-gray-500 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOffers.map((offer) => {
                    const isPending = offer.status === IssueOfferStatus.RECEIVED;
                    const canTakeAction = isPending && !hasAcceptedOffer && !isProcessingPayment;

                    return (
                      <tr key={offer.id} className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-900">
                            ${formatPrice(Number(offer.price))}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            offer.status === IssueOfferStatus.ACCEPTED
                              ? "bg-emerald-100 text-emerald-700"
                              : offer.status === IssueOfferStatus.REJECTED
                              ? "bg-red-100 text-red-700"
                              : "bg-gold-100 text-gold-700"
                          }`}>
                            {ISSUE_OFFER_STATUS_LABELS[offer.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                          {offer.comment_vendor || "No comment"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm text-gray-500 mr-2">
                              {formatDate(offer.created_at)}
                            </span>
                            {canTakeAction && (
                              <>
                                <button
                                  onClick={() => handleAccept(offer)}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg ${BUTTON_HOVER}`}
                                >
                                  <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleReject(offer)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-gray-600 bg-white text-xs font-medium rounded-lg border border-gray-300 hover:bg-foreground hover:text-background hover:border-foreground transition-colors"
                                >
                                  <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Status Message */}
            {hasAcceptedOffer && acceptedOffer?.vendor_id === Number(vendorUserId) && (
              <div className="px-4 py-3 bg-emerald-50 border-t border-emerald-100">
                <p className="text-sm text-emerald-700">
                  Offer has been accepted. Customer will now confirm an assessment time.
                </p>
              </div>
            )}
          </div>
        );
      })}

      {offers.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500">No offers received yet</p>
        </div>
      )}
    </div>
  );
};

export default OffersTabClient;
