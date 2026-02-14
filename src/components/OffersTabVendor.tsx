import React, { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faStar, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import {
  useDeleteOfferMutation,
  useUpdateOfferMutation,
} from "../features/api/issueOffersApi";
import {
  ISSUE_OFFER_STATUS_LABELS,
  IssueOffer,
  IssueOfferStatus,
  Vendor,
} from "../types";
import { useGetVendorsQuery, useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { BUTTON_HOVER } from "../styles/shared";

interface OffersTabVendorProps {
  offers: IssueOffer[];
  vendorId?: number | string;
  onOpenOfferModal: (editingOffer?: IssueOffer) => void;
  onOfferAccepted?: (offer: IssueOffer) => void;
}

const OffersTabVendor: React.FC<OffersTabVendorProps> = ({
  offers,
  vendorId,
  onOpenOfferModal,
  onOfferAccepted,
}) => {
  const [deleteOffer] = useDeleteOfferMutation();
  const [updateOffer] = useUpdateOfferMutation();
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    type: "withdraw" | "accept" | null;
    offer: IssueOffer | null;
    isLoading: boolean;
  }>({ type: null, offer: null, isLoading: false });

  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const { data: currentVendor } = useGetVendorByVendorUserIdQuery(userId, {
    skip: !userId,
  });

  const { data: allVendors = [] } = useGetVendorsQuery();

  const vendorMap = useMemo(() => {
    const map = new Map<string, Vendor>();
    allVendors.forEach((v) => map.set(String(v.vendor_user_id), v));
    return map;
  }, [allVendors]);

  const formattedOffers = offers
    .filter((b) => {
      const vendorForBid = vendorMap.get(String(b.vendor_id));
      return String(vendorForBid?.id) === String(vendorId);
    })
    .sort(
      (a, b) =>
        new Date(b.created_at + "Z").getTime() -
        new Date(a.created_at + "Z").getTime()
    );

  const confirmWithdraw = async () => {
    if (!confirmModal.offer) return;
    
    setConfirmModal(prev => ({ ...prev, isLoading: true }));
    try {
      await deleteOffer({
        id: confirmModal.offer.id,
        issue_id: confirmModal.offer.issue_id,
      });
      setConfirmModal({ type: null, offer: null, isLoading: false });
    } catch (err) {
      console.error("Failed to withdraw offer", err);
      setConfirmModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const confirmAcceptCounter = async () => {
    if (!confirmModal.offer) return;
    
    setConfirmModal(prev => ({ ...prev, isLoading: true }));
    try {
      await updateOffer({
        id: confirmModal.offer.id,
        issue_id: confirmModal.offer.issue_id,
        vendor_id: confirmModal.offer.vendor_id,
        price: confirmModal.offer.price,
        status: "accepted",
        user_last_viewed: new Date().toISOString(),
        comment_vendor: confirmModal.offer.comment_vendor || "",
        comment_client: confirmModal.offer.comment_client || "",
      }).unwrap();

      if (onOfferAccepted) onOfferAccepted(confirmModal.offer);
      setConfirmModal({ type: null, offer: null, isLoading: false });
    } catch (err) {
      console.error("Failed to accept counter offer", err);
      setConfirmModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const hasAcceptedOffer = useMemo(() => {
    return offers.some((offer) => offer.status === IssueOfferStatus.ACCEPTED);
  }, [offers]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + "Z").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  if (!vendorId)
    return <p className="text-gray-500">Unable to load your offer.</p>;

  return (
    <div className="space-y-6">
      {/* Confirmation Modal */}
      {confirmModal.type && confirmModal.offer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => !confirmModal.isLoading && setConfirmModal({ type: null, offer: null, isLoading: false })}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className={`px-6 py-4 ${confirmModal.type === "withdraw" ? "bg-red-50" : "bg-emerald-50"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  confirmModal.type === "withdraw" ? "bg-red-100" : "bg-emerald-100"
                }`}>
                  <FontAwesomeIcon 
                    icon={faExclamationTriangle} 
                    className={`w-5 h-5 ${confirmModal.type === "withdraw" ? "text-red-600" : "text-emerald-600"}`}
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {confirmModal.type === "withdraw" ? "Withdraw Offer?" : "Accept Counter Offer?"}
                </h3>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4">
              {confirmModal.type === "withdraw" ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Are you sure you want to withdraw your offer of{" "}
                    <span className="font-semibold text-gray-900">
                      ${formatPrice(Number(confirmModal.offer.price))}
                    </span>?
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500">
                      This action cannot be undone. You'll need to submit a new offer if you change your mind.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Accept the counter offer of{" "}
                    <span className="font-semibold text-gray-900">
                      ${formatPrice(Number(confirmModal.offer.price))}
                    </span>?
                  </p>
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                    <p className="text-xs text-emerald-700">
                      By accepting, you agree to complete this job at the counter offer price.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setConfirmModal({ type: null, offer: null, isLoading: false })}
                disabled={confirmModal.isLoading}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.type === "withdraw" ? confirmWithdraw : confirmAcceptCounter}
                disabled={confirmModal.isLoading}
                className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                  confirmModal.type === "withdraw" 
                    ? "bg-red-500 hover:bg-red-600" 
                    : "bg-emerald-500 hover:bg-emerald-600"
                }`}
              >
                {confirmModal.isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : confirmModal.type === "withdraw" ? (
                  "Yes, Withdraw"
                ) : (
                  "Yes, Accept"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Header Card */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
              {currentVendor?.profile_image_url && currentVendor.profile_image_url !== "None" ? (
                <img
                  src={currentVendor.profile_image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gold text-white font-semibold">
                  {currentVendor?.company_name?.charAt(0) || "V"}
                </div>
              )}
            </div>
            <div>
              <div className="font-semibold text-gray-900">
                {currentVendor?.company_name || "Your Company"}
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <FontAwesomeIcon icon={faStar} className="text-gold w-3 h-3" />
                <span>{currentVendor?.rating?.toFixed(1) || "5.0"}</span>
              </div>
            </div>
          </div>
          {/* Only show Place Offer if no offers exist and no offer accepted */}
          {formattedOffers.length === 0 && !hasAcceptedOffer && (
            <button
              onClick={() => onOpenOfferModal()}
              className={`px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg ${BUTTON_HOVER} flex items-center gap-2`}
            >
              <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
              Place Offer
            </button>
          )}
        </div>

        {/* Offers Table */}
        {formattedOffers.length > 0 ? (
          <>
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
                  {formattedOffers.map((offer) => {
                    const isCounter = offer.comment_client?.toLowerCase().includes("counter");
                    const canEdit = offer.status === IssueOfferStatus.RECEIVED && !hasAcceptedOffer;

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
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm text-gray-500">
                              {formatDate(offer.created_at)}
                            </span>
                            {canEdit && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => onOpenOfferModal(offer)}
                                  className={`px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg ${BUTTON_HOVER}`}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setConfirmModal({ type: "withdraw", offer, isLoading: false })}
                                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-foreground hover:text-background hover:border-foreground transition-colors"
                                >
                                  Withdraw
                                </button>
                              </div>
                            )}
                            {isCounter && offer.status === IssueOfferStatus.RECEIVED && (
                              <button
                                onClick={() => setConfirmModal({ type: "accept", offer, isLoading: false })}
                                className={`px-3 py-1.5 text-xs font-medium bg-gold text-white rounded-lg ${BUTTON_HOVER}`}
                              >
                                Accept
                              </button>
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
            {hasAcceptedOffer && (
              <div className="px-4 py-3 bg-emerald-50 border-t border-emerald-100">
                <p className="text-sm text-emerald-700">
                  Offer has been accepted. Customer will now confirm an assessment time.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">
              You haven't submitted an offer yet. Click{" "}
              <strong>"Place Offer"</strong> above to submit your offer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OffersTabVendor;
