import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { Vendor } from "../types";
import { getCoordinatesFromAddress, Coordinates } from "../utils/mapUtils";
import MapComponent from "./MapComponent";
import VendorReviewsSection from "./VendorReviewsSection";

interface VendorModalProps {
  vendor: Vendor;
  onClose: () => void;
}

const VendorModal: React.FC<VendorModalProps> = ({ vendor, onClose }) => {
  const [activeTab, setActiveTab] = useState("info");
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    if (!vendor) return;

    const fullAddress = `${vendor.address}, ${vendor.city}, ${vendor.state}, ${vendor.country}`;

    getCoordinatesFromAddress(fullAddress)
      .then((result) => {
        setCoords(result);
        setLocationError(false);
      })
      .catch((err) => {
        console.error("Map error:", err);
        setLocationError(true);
      });
  }, [vendor]);

  if (!vendor) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl p-4">
        <div className="relative bg-white rounded-lg shadow max-h-[85vh] h-[85vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b rounded-t">
            <h3 className="text-xl font-semibold text-gray-900">
              Vendor Details
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-900 rounded-lg text-sm w-8 h-8 flex items-center justify-center hover:bg-gray-200"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          {/* Scroll container for content only */}
          <div className="p-6 flex-1 overflow-y-auto">
            {/* Tabs */}
            <div className="mb-4 border-b border-gray-200">
              <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
                <li>
                  <button
                    onClick={() => setActiveTab("info")}
                    className={`inline-block px-4 py-2.5 font-semibold border-b-2 rounded-t-lg ${activeTab === "info"
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300"
                      }`}
                  >
                    Info
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className={`inline-block px-4 py-2.5 font-semibold border-b-2 rounded-t-lg ${activeTab === "reviews"
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300"
                      }`}
                  >
                    User Reviews
                  </button>
                </li>
                <li>
                  <button
                    disabled
                    className="inline-block px-4 py-2.5 font-semibold border-b-2 rounded-t-lg text-gray-400 border-transparent cursor-not-allowed"
                  >
                    Google Reviews (TODO)
                  </button>
                </li>
              </ul>
            </div>

            {/* Tab Content */}
            {activeTab === "info" && (
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-1">
                    Business Name
                  </h4>
                  <p>{vendor.name}</p>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-1">
                    Contact
                  </h4>
                  <p className="mb-1">
                    <strong>Email:</strong> {vendor.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {vendor.phone}
                  </p>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-1">
                    Address
                  </h4>
                  <p className="mb-2">
                    {vendor.address}, {vendor.city}, {vendor.state},{" "}
                    {vendor.country}, {vendor.postal_code}
                  </p>
                  {locationError ? (
                    <div className="flex items-center justify-center h-64 w-full bg-gray-200 text-red-600 font-medium text-center p-4 rounded">
                      <p>
                        Unable to load map. Location not found for this listing.
                      </p>
                    </div>
                  ) : (
                    coords?.latitude &&
                    coords?.longitude && (
                      <div className="rounded overflow-hidden border border-gray-200">
                        <MapComponent
                          key="map-visible"
                          latitude={coords.latitude}
                          longitude={coords.longitude}
                          listingName={vendor.address}
                        />
                      </div>
                    )
                  )}
                </div>

                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-1">
                    Vendor Types
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {vendor.vendor_types.split(",").map((type: string) => (
                      <span
                        key={type.trim()}
                        className="text-sm font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded"
                      >
                        {type.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <VendorReviewsSection vendorUserId={vendor.vendor_user_id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorModal;
