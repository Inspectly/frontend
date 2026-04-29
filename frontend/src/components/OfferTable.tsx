import React, { useRef, useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";
import Dropdown from "./Dropdown";
import VendorName from "./VendorName";
import { useGetVendorsQuery } from "../features/api/vendorsApi";
import {
  ISSUE_OFFER_STATUS_LABELS,
  IssueOffer,
  IssueOfferStatus,
  Vendor,
} from "../types";
import { useUpdateOfferMutation } from "../features/api/issueOffersApi";

interface OfferTableProps {
  offers: IssueOffer[];
  userRole: "client" | "vendor";
  currentVendorId?: number | string;
  uniqueVendors?: number;
  handleOpenOfferModal?: (counterOffer?: IssueOffer) => void;
  onOpenOfferModal?: () => void;
  actions?: string[];
}

const OfferTable: React.FC<OfferTableProps> = ({
  offers,
  userRole,
  currentVendorId,
  uniqueVendors = 0,
  handleOpenOfferModal,
  onOpenOfferModal,
  actions = [],
}) => {
  const { data: allVendors = [] } = useGetVendorsQuery();
  const [updateOffer] = useUpdateOfferMutation();

  const [openDropdown, setOpenDropdown] = useState<string | number | null>(
    null
  );

  const buttonRefs = useRef<Map<string | number, HTMLButtonElement | null>>(
    new Map()
  );

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
        comment_vendor: offer.comment_vendor || "",
        comment_client: offer.comment_client || "",
      }).unwrap();
    } catch (err) {
      console.error("Failed to update offer:", err);
      // todo: show error toast or message
    }
  };

  const vendorMap = useMemo(() => {
    const map = new Map<string, Vendor>();
    allVendors.forEach((v) => map.set(String(v.vendor_user_id), v));
    return map;
  }, [allVendors]);

  // Group offers by vendor for client
  const groupedOffers = useMemo(() => {
    if (userRole !== "client") return [];

    const grouped = new Map<string, IssueOffer[]>();
    offers.forEach((offer) => {
      const key = String(offer.vendor_id);
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(offer);
    });
    return Array.from(grouped.entries());
  }, [offers, userRole]);

  const formattedOffers = useMemo(() => {
    if (userRole === "vendor" && currentVendorId != null) {
      return offers
        .filter((b) => {
          const vendorForBid = vendorMap.get(String(b.vendor_id));
          return String(vendorForBid?.id) === String(currentVendorId);
        })
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
    return [];
  }, [offers, userRole, currentVendorId]);

  return (
    <div className="bg-white">
      <div
        className={`card-header bg-white pb-4 flex items-center flex-wrap gap-3 ${
          userRole === "client" ? "justify-start" : "justify-end"
        }`}
      >
        {userRole === "client" && (
          <div className="flex items-center flex-wrap gap-3">
            <span className="text-base font-medium text-gray-600 mb-0">
              Vendors: <span className="text-gray-800">{uniqueVendors}</span>
            </span>
            <span className="text-base font-medium text-gray-600 mb-0">
              Offers: <span className="text-gray-800">{offers.length}</span>
            </span>
          </div>
        )}
        {userRole === "vendor" && onOpenOfferModal && (
          <button
            onClick={onOpenOfferModal}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium "
          >
            Place Offer
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        {userRole === "client" ? (
          groupedOffers.length > 0 ? (
            groupedOffers.map(([vendorUserId, vendorOffers]) => {
              return (
                <div key={vendorUserId} className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    <VendorName
                      vendorId={Number(vendorUserId)}
                      isVendorId={false}
                    />
                  </h3>
                  <table className="table w-full min-w-max border-separate border-spacing-0 rounded-lg border border-gray-200 bordered-table sm-table mb-0">
                    <thead>
                      <tr>
                        <th className="bg-gray-100 text-left font-medium px-4 py-3">
                          Amount
                        </th>
                        <th className="bg-gray-100 text-left font-medium px-4 py-3">
                          Status
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
                                      : offer.status ===
                                        IssueOfferStatus.REJECTED
                                      ? "text-red-600"
                                      : "text-yellow-600"
                                  }
                                >
                                  {ISSUE_OFFER_STATUS_LABELS[offer.status]}
                                </span>
                              </td>
                              <td className="text-left border-b border-gray-200 px-4 py-3">
                                {new Date(
                                  offer.created_at + "Z"
                                ).toLocaleString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </td>
                              <td className="text-center border-b border-gray-200 px-4 py-3">
                                <button
                                  className="focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg px-3.5 py-1 text-neutral-700 text-lg"
                                  type="button"
                                  ref={(el) =>
                                    buttonRefs.current.set(offerId, el)
                                  }
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
                                    {actions.map((action) => (
                                      <button
                                        key={action}
                                        className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                                        onClick={() => {
                                          setOpenDropdown(null);
                                          if (
                                            action === "Counter" &&
                                            handleOpenOfferModal
                                          ) {
                                            handleOpenOfferModal(offer); // passing the current offer to counter
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
              );
            })
          ) : (
            <p className="text-center text-gray-500 py-4">No offers yet.</p>
          )
        ) : formattedOffers.length > 0 ? (
          <table className="table w-full min-w-max border-separate border-spacing-0 rounded-lg border border-gray-200 bordered-table sm-table mb-0">
            <thead>
              <tr>
                <th className="bg-gray-100 text-left font-medium px-4 py-3">
                  Amount
                </th>
                <th className="bg-gray-100 text-left font-medium px-4 py-3">
                  Status
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
                return (
                  <tr key={offerId}>
                    <td className="text-left border-b border-gray-200 px-4 py-3">
                      $
                      {new Intl.NumberFormat("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(Number(offer.price) || 0)}
                    </td>
                    <td className="text-left border-b border-gray-200 px-4 py-3 capitalize">
                      {offer.status}
                    </td>
                    <td className="text-left border-b border-gray-200 px-4 py-3">
                      {new Date(offer.created_at).toLocaleString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </td>
                    <td className="text-center border-b border-gray-200 px-4 py-3">
                      <button
                        className="focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg px-3.5 py-1 text-neutral-700 text-lg"
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
                                // handle action
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

export default OfferTable;
