import React, { useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";
import VendorName from "./VendorName";
import Dropdown from "./Dropdown";
import { useUpdateOfferMutation } from "../features/api/issueOffersApi";
import { useGetVendorsQuery } from "../features/api/vendorsApi";
import {
  ISSUE_OFFER_STATUS_LABELS,
  IssueOffer,
  IssueOfferStatus,
  Vendor,
} from "../types";

interface OffersTabClientProps {
  offers: IssueOffer[];
  uniqueVendors: number;
  handleOpenOfferModal: (offer: IssueOffer) => void;
  onOpenOfferModal: () => void;
  onOfferAccepted?: (offer: IssueOffer) => void;
}

const OffersTabClient: React.FC<OffersTabClientProps> = ({
  offers,
  uniqueVendors,
  handleOpenOfferModal,
  onOfferAccepted,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | number | null>(
    null
  );
  const buttonRefs = useRef<Map<string | number, HTMLButtonElement | null>>(
    new Map()
  );
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

  const handleStatusChange = async (offer: IssueOffer, action: string) => {
    const status =
      action === "Accept"
        ? "accepted"
        : action === "Reject"
        ? "rejected"
        : "received";

    try {
      await updateOffer({
        id: offer.id,
        issue_id: offer.issue_id,
        vendor_id: offer.vendor_id,
        price: offer.price,
        status,
        user_last_viewed: new Date().toISOString(),
        comment_vendor: offer.comment_vendor || "",
        comment_client: offer.comment_client || "",
      }).unwrap();
    } catch (err) {
      console.error("Failed to update offer", err);
    }

    if (action === "Accept") {
      if (onOfferAccepted) onOfferAccepted(offer);
    }
  };

  const hasAcceptedOffer = useMemo(() => {
    return offers.some((offer) => offer.status === IssueOfferStatus.ACCEPTED);
  }, [offers]);

  return (
    <div className="bg-white">
      <div className="card-header bg-white pb-4 flex items-center gap-3 justify-start">
        <span className="text-base font-medium text-gray-600 mb-0">
          Vendors: <span className="text-gray-800">{uniqueVendors}</span>
        </span>
        <span className="text-base font-medium text-gray-600 mb-0">
          Offers: <span className="text-gray-800">{offers.length}</span>
        </span>
      </div>

      <div className="overflow-x-auto">
        {[...groupedOffers.entries()].map(([vendorUserId, vendorOffers]) => (
          <div key={vendorUserId} className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              <VendorName vendorId={Number(vendorUserId)} isVendorId={false} />
            </h3>
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
                {[...vendorOffers]
                  .sort(
                    (a, b) =>
                      new Date(b.created_at + "Z").getTime() -
                      new Date(a.created_at + "Z").getTime()
                  )
                  .map((offer) => {
                    const offerId = String(offer.id);
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
                          {offer.comment_vendor || "No comment"}
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
                            disabled={hasAcceptedOffer}
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
                                current:
                                  buttonRefs.current.get(offerId) ?? null,
                              }}
                              onClose={() => setOpenDropdown(null)}
                            >
                              {["Accept", "Counter", "Reject"].map((action) => (
                                <button
                                  key={action}
                                  className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                                  onClick={() => {
                                    setOpenDropdown(null);
                                    if (action === "Counter") {
                                      handleOpenOfferModal(offer);
                                    } else {
                                      handleStatusChange(offer, action);
                                    }
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default OffersTabClient;
