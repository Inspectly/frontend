import React, { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";
import Dropdown from "./Dropdown";
import VendorName from "./VendorName";

interface Bid {
  id: number;
  price: number;
  vendor_id: number | string;
  created_at: string;
}

interface BidsTabVendorProps {
  bids: Bid[];
  vendorId?: number | string;
  uniqueVendors: number;
  onOpenBidModal: () => void;
}

const BidsTabVendor: React.FC<BidsTabVendorProps> = ({
  bids,
  vendorId,
  uniqueVendors,
  onOpenBidModal,
}) => {
  // Which dropdown is open?
  const [tableDropdownOpen, setTableDropdownOpen] = useState<number | null>(null);

  // 1) Type your map to store "HTMLButtonElement | null"
  const tableDropdownButtonRefs = useRef<Map<number, HTMLButtonElement | null>>(
    new Map()
  );

  // 2) Filter, sort, take latest
  const currentVendorBids = bids.filter(
    (bid) => String(bid.vendor_id) === String(vendorId)
  );
  currentVendorBids.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const myLatestBid = currentVendorBids[0] || null;

  return (
    <div className="bg-white">
      <div className="card-header bg-white pb-4 flex items-center flex-wrap gap-3 justify-between">
        <button
          onClick={onOpenBidModal}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium"
        >
          Place Bid
        </button>
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
            {myLatestBid ? (
              <tr key={myLatestBid.id}>
                <td className="text-left border-b border-gray-200 px-4 py-3">
                    <VendorName vendorId={Number(myLatestBid.vendor_id)} />
                </td>
                <td className="text-left border-b border-gray-200 px-4 py-3">
                  $
                  {new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(
                    isNaN(Number(myLatestBid.price))
                      ? 0
                      : Number(myLatestBid.price)
                  )}
                </td>
                <td className="text-left border-b border-gray-200 px-4 py-3">
                  {new Date(myLatestBid.created_at).toLocaleString("en-US", {
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
                    // 3) Store "el" in the map
                    ref={(el) => {
                      tableDropdownButtonRefs.current.set(myLatestBid.id, el);
                    }}
                    onClick={() =>
                      setTableDropdownOpen((prev) =>
                        prev === myLatestBid.id ? null : myLatestBid.id
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faEllipsisVertical} />
                  </button>

                  {tableDropdownOpen === myLatestBid.id && (
                    <Dropdown
                      // 4) Provide fallback with ?? null
                      buttonRef={{
                        current: tableDropdownButtonRefs.current.get(
                          myLatestBid.id
                        ) ?? null,
                      }}
                      onClose={() => setTableDropdownOpen(null)}
                    >
                      {["Accept", "Counter", "Reject"].map((action) => (
                        <button
                          key={action}
                          className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                          onClick={() => {
                            setTableDropdownOpen(null);
                            // Implement action logic
                          }}
                        >
                          {action}
                        </button>
                      ))}
                    </Dropdown>
                  )}
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-3 text-gray-500">
                  No bids from you yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BidsTabVendor;
