import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as faStarOutline } from "@fortawesome/free-regular-svg-icons";
import { faPen, faStar, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useGetVendorReviewsByVendorUserIdQuery } from "../features/api/vendorReviewsApi";
import { Vendor, Vendor_Review } from "../types";
import UserName from "./UserName";
import { getCoordinatesFromAddress, Coordinates } from "../utils/mapUtils";
import MapComponent from "./MapComponent";

interface VendorModalProps {
  vendor: Vendor;
  onClose: () => void;
}

const VendorModal: React.FC<VendorModalProps> = ({ vendor, onClose }) => {
  const [activeTab, setActiveTab] = useState("info");
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [filteredStar, setFilteredStar] = useState<number | null>(null);

  const { data: reviews = [], isLoading: loadingReviews } =
    useGetVendorReviewsByVendorUserIdQuery(vendor?.vendor_user_id, {
      skip: !vendor?.vendor_user_id,
    });

  const filteredReviews = filteredStar
    ? reviews.filter((r) => r.rating === filteredStar)
    : reviews;

  const handleStarFilter = (star: number) => {
    setFilteredStar((prev) => (prev === star ? null : star));
  };

  const renderStars = (rating: number) => {
    return (
      <ul className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <li
            key={i}
            className={`text-warning-600 text-lg ${
              i <= rating ? "" : "text-gray-300"
            }`}
          >
            <FontAwesomeIcon
              icon={i <= rating ? faStar : faStarOutline}
              className="text-yellow-500"
            />
          </li>
        ))}
      </ul>
    );
  };

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
                    className={`inline-block px-4 py-2.5 font-semibold border-b-2 rounded-t-lg ${
                      activeTab === "info"
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
                    className={`inline-block px-4 py-2.5 font-semibold border-b-2 rounded-t-lg ${
                      activeTab === "reviews"
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

                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-1">
                    Review Summary
                  </h4>
                  <div className="flex items-center gap-2 mb-1">
                    {renderStars(parseFloat(vendor.rating))}
                    <span className="text-sm text-gray-500">
                      ({vendor.rating})
                    </span>
                  </div>
                  <p className="text-gray-600">{vendor.review}</p>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="mb-6">
                {/* Top review breakdown UI */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-4 border rounded-lg bg-gray-50 mb-6">
                  <div className="text-center md:text-left">
                    <h3 className="text-xl font-semibold text-gray-800 mb-1">
                      Reviews
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-4xl font-bold text-gray-800">
                        {vendor.rating}
                      </span>
                      {renderStars(Math.round(parseFloat(vendor.rating)))}
                    </div>
                    <p className="text-sm text-gray-600">
                      {reviews.length} reviews
                    </p>
                    {/* <button
                      disabled
                      className="mt-3 px-4 py-2 bg-blue-800 text-white text-sm rounded-lg opacity-50 cursor-not-allowed"
                    >
                      <FontAwesomeIcon icon={faPen} className="mr-1" /> Write a
                      Review
                    </button> */}
                  </div>

                  <div className="w-full md:w-2/3 space-y-1">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviews.filter(
                        (r) => r.rating === star
                      ).length;
                      const percent = reviews.length
                        ? (count / reviews.length) * 100
                        : 0;
                      const isActive = filteredStar === star;

                      return (
                        <div
                          key={star}
                          onClick={() => handleStarFilter(star)}
                          className={`flex items-center gap-2 px-2 group transform transition-all duration-150 ${
                            isActive
                              ? "bg-gray-200 scale-[1.02] rounded-md"
                              : "hover:scale-[1.01]"
                          }
                          ${
                            count === 0
                              ? "opacity-50 pointer-events-none"
                              : "cursor-pointer"
                          }`}
                        >
                          <span className="text-sm font-medium w-6 text-yellow-500">
                            {star}★
                          </span>
                          <div className="w-full h-3 bg-gray-200 rounded">
                            <div
                              className="h-3 bg-yellow-500 rounded transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-600 w-12 text-right">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                    <div className="h-6">
                      <p
                        onClick={() => setFilteredStar(null)}
                        className="text-xs text-blue-500 hover:underline cursor-pointer"
                      >
                        {filteredStar ? "Clear Filter" : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {loadingReviews ? (
                  <p>Loading reviews...</p>
                ) : filteredReviews.length > 0 ? (
                  <div className="space-y-4">
                    {filteredReviews.map((review: Vendor_Review) => (
                      <div
                        key={review.id}
                        className="border rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold">
                            Reviewer: <UserName userId={review.user_id} />
                          </h4>
                          {renderStars(review.rating)}
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          {review.review}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No reviews found.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorModal;
