import React, { useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";
import Dropdown from "./Dropdown";
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
import { useGetVendorsQuery } from "../features/api/vendorsApi";

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
  const [openDropdown, setOpenDropdown] = useState<string | number | null>(
    null
  );
  const buttonRefs = useRef<Map<string | number, HTMLButtonElement | null>>(
    new Map()
  );
  const [deleteOffer] = useDeleteOfferMutation();
  const [updateOffer] = useUpdateOfferMutation();

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

  const handleStatusChange = async (offer: IssueOffer, action: string) => {
    if (action === "Withdraw") {
      const confirmWithdraw = window.confirm(
        "Are you sure you want to withdraw this offer?"
      );
      if (!confirmWithdraw) return;

      try {
        await deleteOffer({
          id: offer.id,
          issue_id: offer.issue_id,
        });
      } catch (err) {
        console.error("Failed to withdraw offer", err);
      }
    } else if (action === "Accept") {
      const confirmAccept = window.confirm(
        "Are you sure you want to accept this offer?"
      );
      if (!confirmAccept) return;

      await updateOffer({
        id: offer.id,
        issue_id: offer.issue_id,
        vendor_id: offer.vendor_id,
        price: offer.price,
        status: "accepted",
        user_last_viewed: new Date().toISOString(),
        comment_vendor: offer.comment_vendor || "",
        comment_client: offer.comment_client || "",
      }).unwrap();

      if (onOfferAccepted) onOfferAccepted(offer);
    } else {
      try {
        onOpenOfferModal(offer);
      } catch (err) {
        console.error("Failed to update offer", err);
      }
    }
  };

  const hasAcceptedOffer = useMemo(() => {
    return offers.some((offer) => offer.status === IssueOfferStatus.ACCEPTED);
  }, [offers]);

  if (!vendorId)
    return <p className="text-gray-500">Unable to load your offer.</p>;

  return (
    <div className="bg-white">
      <div className="card-header bg-white pb-4 flex items-center justify-end">
        <button
          disabled={hasAcceptedOffer}
          onClick={() => onOpenOfferModal()}
          className={`bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium ${
            hasAcceptedOffer ? "cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          Place Offer
        </button>
      </div>

      <div className="overflow-x-auto">
        {formattedOffers.length > 0 ? (
          <table className="table w-full min-w-max border-separate border-spacing-0 rounded-lg border border-gray-200 mb-0">
            <thead>
              <tr>
                <th className="bg-gray-100 text-left font-medium px-4 py-3">
                  Amount
                </th>
                <th className="bg-gray-100 text-left font-medium px-4 py-3">
                  Status
                </th>
                <th className="bg-gray-100 text-left font-medium px-4 py-3">
                  Comment
                </th>
                <th className="bg-gray-100 text-left font-medium px-4 py-3">
                  Offer Time
                </th>
                <th className="bg-gray-100 text-center font-medium px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {formattedOffers.map((offer) => {
                const offerId = String(offer.id);
                const isCounter = offer.comment_client
                  ?.toLowerCase()
                  .includes("counter");
                const actions = ["Edit", "Withdraw"];
                if (isCounter && offer.status === IssueOfferStatus.RECEIVED) {
                  actions.unshift("Accept");
                }

                return (
                  <tr
                    key={offerId}
                    className={
                      offer.status === IssueOfferStatus.ACCEPTED
                        ? "bg-green-50"
                        : offer.status === IssueOfferStatus.REJECTED
                        ? "bg-red-50"
                        : ""
                    }
                  >
                    <td className="text-left border-b border-gray-200 px-4 py-3">
                      $
                      {new Intl.NumberFormat("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(Number(offer.price) || 0)}
                    </td>
                    <td className="text-left border-b border-gray-200 px-4 py-3 capitalize">
                      <span
                        className={
                          offer.status === IssueOfferStatus.ACCEPTED
                            ? "text-green-600"
                            : offer.status === IssueOfferStatus.REJECTED
                            ? "text-red-600"
                            : "text-yellow-600"
                        }
                      >
                        {ISSUE_OFFER_STATUS_LABELS[offer.status]}
                      </span>
                    </td>
                    <td className="text-left border-b border-gray-200 px-4 py-3 capitalize max-w-72">
                      {offer.comment_client || "No comment"}
                    </td>
                    <td className="text-left border-b border-gray-200 px-4 py-3">
                      {new Date(offer.created_at + "Z").toLocaleString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        }
                      )}
                    </td>
                    <td className="text-center border-b border-gray-200 px-4 py-3">
                      <button
                        // disabled={hasAcceptedOffer}
                        className={`focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg px-3.5 py-1 text-neutral-700 text-lg ${
                          hasAcceptedOffer
                            ? "cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                        type="button"
                        ref={(el) => buttonRefs.current.set(offerId, el)}
                        onClick={() =>
                          setOpenDropdown((prev) =>
                            prev === offerId ? null : offerId
                          )
                        }
                      >
                        <FontAwesomeIcon icon={faEllipsisVertical} />
                      </button>
                      {openDropdown === offerId && (
                        <Dropdown
                          buttonRef={{
                            current: buttonRefs.current.get(offerId) ?? null,
                          }}
                          onClose={() => setOpenDropdown(null)}
                        >
                          {actions.map((action) => (
                            <button
                              key={action}
                              className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                              onClick={() => {
                                setOpenDropdown(null);
                                handleStatusChange(offer, action);
                              }}
                            >
                              {action}
                            </button>
                          ))}
                        </Dropdown>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-gray-500 py-4">
            You haven’t submitted a quote yet. Click{" "}
            <strong>"Place Offer"</strong> above to submit your offer.
          </p>
        )}
      </div>
    </div>
  );
};

export default OffersTabVendor;
