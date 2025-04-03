import React, { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";
import Dropdown from "./Dropdown";
import VendorName from "./VendorName";

/** Example of what your Bid might look like, based on your usage. */
interface Bid {
  id: number | string;
  vendor_id: number | string;
  price: number | string;
  created_at: string;
}

interface BidsTabClientProps {
  bids: Bid[];
  uniqueVendors: number;
  onOpenBidModal: () => void;  // If you want a "Place Bid" button for a client
}

const BidsTabClient: React.FC<BidsTabClientProps> = ({
  bids,
  uniqueVendors,
  onOpenBidModal,
}) => {
  // Track which row's dropdown is open (store the bid's ID or null)
  const [tableDropdownOpen, setTableDropdownOpen] = useState<string | number | null>(null);

  /**
   * 1) Type your map to allow string | number keys.
   *    The value is HTMLButtonElement | null since the ref might be null.
   */
  const tableDropdownButtonRefs = useRef<Map<string | number, HTMLButtonElement | null>>(
    new Map()
  );

  return (
    <div className="bg-white">
      <div className="card-header bg-white pb-4 flex items-center flex-wrap gap-3 justify-between">
        <div className="flex items-center flex-wrap gap-3">
          <span className="text-base font-medium text-gray-600 mb-0">
            Bidders: <span className="text-gray-800">{uniqueVendors}</span>
          </span>
          <span className="text-base font-medium text-gray-600 mb-0">
            Bids: <span className="text-gray-800">{bids.length}</span>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table w-full min-w-max border-separate border-spacing-0 rounded-lg border border-gray-200 bordered-table sm-table mb-0">
          <thead>
            <tr>
              <th className="bg-gray-100 text-left font-medium px-4 py-3 rounded-tl-lg">
                Vendor
              </th>
              <th className="bg-gray-100 text-left font-medium px-4 py-3">
                Amount
              </th>
              <th className="bg-gray-100 text-left font-medium px-4 py-3">
                Bid Time
              </th>
              <th className="bg-gray-100 text-center font-medium px-4 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {bids.length > 0 ? (
              bids.map((bid) => {
                // Convert bid.id to string or number. We'll use string here.
                const bidId = String(bid.id);

                return (
                  <tr key={bidId}>
                    <td className="text-left border-b border-gray-200 px-4 py-3">
                        <VendorName vendorId={Number(bid.vendor_id)} />
                    </td>
                    <td className="text-left border-b border-gray-200 px-4 py-3">
                      $
                      {new Intl.NumberFormat("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(
                        isNaN(Number(bid.price)) ? 0 : Number(bid.price)
                      )}
                    </td>
                    <td className="text-left border-b border-gray-200 px-4 py-3">
                      {new Date(bid.created_at).toLocaleString("en-US", {
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
                        /**
                         * 2) Store "el" in the map; it can be HTMLButtonElement or null.
                         */
                        ref={(el) => {
                          tableDropdownButtonRefs.current.set(bidId, el);
                        }}
                        onClick={() =>
                          setTableDropdownOpen((prev) =>
                            prev === bidId ? null : bidId
                          )
                        }
                      >
                        <FontAwesomeIcon icon={faEllipsisVertical} />
                      </button>

                      {tableDropdownOpen === bidId && (
                        <Dropdown
                          /**
                           * 3) Retrieve from the map and fallback to null (?? null)
                           *    so we never pass undefined.
                           */
                          buttonRef={{
                            current:
                              tableDropdownButtonRefs.current.get(bidId) ??
                              null,
                          }}
                          onClose={() => setTableDropdownOpen(null)}
                        >
                          {["Accept", "Counter", "Reject"].map((action) => (
                            <button
                              key={action}
                              className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                              onClick={() => {
                                setTableDropdownOpen(null);
                                // Your "Accept/Counter/Reject" logic
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
              })
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-3 text-gray-500">
                  No bids yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BidsTabClient;
