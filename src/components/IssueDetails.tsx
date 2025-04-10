import React, { useEffect, useRef, useState } from "react";
import { IssueType, Listing, statusMapping, statusOptions } from "../types"; // Update paths as needed
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";
import {
  faChevronUp,
  faChevronDown,
  faTimes,
  faEllipsisVertical,
} from "@fortawesome/free-solid-svg-icons";
import Attachments from "./Attachments";
import Comments from "./Comments";
import Dropdown from "./Dropdown";
import MapComponent from "./MapComponent";
import VendorName from "./VendorName";
import { useNavigate } from "react-router-dom";
import { useUpdateIssueMutation } from "../features/api/issuesApi";
import {
  useCreateBidMutation,
  useGetBidsByIssueIdQuery,
} from "../features/api/issueBidsApi";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

export interface IssueDetailsProps {
  issue: IssueType;
  listing?: Listing;
}

// Extract tab from URL (default to "details")
const getTabFromURL = () => {
  const params = new URLSearchParams(location.search);
  return params.get("tab") || "details"; // Default tab
};

const IssueDetails: React.FC<IssueDetailsProps> = ({ issue, listing }) => {
  const navigate = useNavigate();
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const userType = useSelector(
    (state: RootState) => state.auth.user?.user_type
  );

  const {
    data: bids = [],
    isLoading: bidsLoading,
    error: bidsError,
    refetch,
  } = useGetBidsByIssueIdQuery(issue?.id, {
    skip: !issue?.id,
  });
  const [updateIssue] = useUpdateIssueMutation();
  const [createBid] = useCreateBidMutation();

  const [coords, setCoords] = useState({ latitude: 0, longitude: 0 });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [imageOpen, setImageOpen] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [descriptionOpen, setDescriptionOpen] = useState(true);
  const [locationOpen, setLocationOpen] = useState(true);
  const [peopleOpen, setPeopleOpen] = useState(true);
  const [datesOpen, setDatesOpen] = useState(true);

  const [activeTab, setActiveTab] = useState(getTabFromURL());
  const [locationError, setLocationError] = useState(false);

  const [progressDropdownOpen, setProgressDropdownOpen] = useState<
    number | null
  >(null);
  const [tableDropdownOpen, setTableDropdownOpen] = useState<number | null>(
    null
  );

  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidError, setBidError] = useState("");
  const [commentVendor, setCommentVendor] = useState("");
  // const [commentClient, setCommentClient] = useState("");

  const cardRef = useRef<HTMLDivElement | null>(null);
  const progressDropdownButtonRef = useRef<HTMLButtonElement | null>(null);
  const tableDropdownButtonRefs = useRef(new Map());

  const highestBid =
    bids.length > 0 ? Math.max(...bids.map((b) => b.price)) : 0;

  const uniqueVendors = new Set(bids.map((bid) => bid.vendor_id)).size;

  const toggleSection = (
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setter((prev) => !prev);
  };

  const handleProgressChange = (id: number, newProgress: string) => {
    updateIssue({ id, progress: newProgress });

    setTimeout(() => {
      setProgressDropdownOpen(null); // Delay closing to let the event register
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString + "Z");

    return date.toLocaleString("en-US", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Auto-detects user’s time zone
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getCoordinatesFromAddress = async (address: string) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}`
    );
    const data = await response.json();

    if (data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    } else {
      throw new Error("Location not found");
    }
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`?tab=${tab}`); // Update URL
  };

  const handleBidSubmit = async () => {
    const bidValue = parseFloat(bidAmount);

    if (isNaN(bidValue) || bidValue <= highestBid) {
      setBidError(`Your bid must be more than $${highestBid}`);
      return;
    }

    if (!userId) {
      setBidError("User ID is missing. Please log in.");
      return;
    }

    try {
      await createBid({
        issue_id: issue.id,
        vendor_id: userId,
        price: bidValue,
        status: "received",
        comment_vendor: commentVendor,
        comment_client: "",
      }).unwrap();

      refetch();

      // Reset state
      setBidAmount("");
      setCommentVendor("");
      // setCommentClient("");
      setBidError("");
      setIsBidModalOpen(false);
    } catch (err) {
      console.error("Failed to submit bid:", err);
      setBidError("Failed to submit bid. Please try again.");
    }
  };

  useEffect(() => {
    if (!listing) return;

    const address = `${listing?.address}, ${listing?.city}, ${listing?.state}, ${listing?.country}`;

    getCoordinatesFromAddress(address)
      .then((coords) => {
        setCoords(coords);
        setLocationError(false);
      })
      .catch((error) => {
        console.error("Location fetch failed:", error);
        setLocationError(true);
      });
  }, [listing]);

  // Sync tab state when URL changes
  useEffect(() => {
    setActiveTab(getTabFromURL());
  }, [location.search]);

  return (
    <div
      ref={cardRef}
      className="relative rounded-lg bg-white border-0 overflow-hidden flex flex-col"
    >
      <div
        className={`items-center px-6 py-4 active border-b border-neutral-200 ${
          issue.active ? "" : "bg-red-100"
        }`}
      >
        <div className="flex flex-row items-center justify-between">
          <h2 className="text-2xl font-medium mb-0">
            {issue.id + " " + issue.summary || "No Title Found"}
          </h2>
          <button
            onClick={() =>
              updateIssue({ id: issue.id, isVisible: !issue.active })
            }
            className="w-8 h-8 bg-blue-100 text-primary-600 rounded-full inline-flex items-center justify-center"
          >
            <FontAwesomeIcon
              icon={issue.active ? faEye : faEyeSlash}
              className={`text-blue-600 size-3.5`}
            />
          </button>
        </div>
      </div>

      <div className="mb-4 border-b border-gray-200 pt-4 mx-6">
        <ul
          className="flex flex-wrap -mb-px text-sm font-medium text-center"
          id="default-tab"
          data-tabs-toggle="#default-tab-content"
          role="tablist"
        >
          <li role="presentation">
            <button
              className={`inline-block px-4 py-2.5 font-semibold border-b-2 rounded-t-lg ${
                activeTab === "details"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 hover:text-gray-600 border-gray-100 hover:border-gray-300"
              }`}
              type="button"
              role="tab"
              aria-controls="default-details"
              aria-selected={activeTab === "details"}
              onClick={() => handleTabChange("details")}
            >
              Details
            </button>
          </li>
          <li role="presentation">
            <button
              className={`inline-block px-4 py-2.5 font-semibold border-b-2 rounded-t-lg ${
                activeTab === "bids"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 hover:text-gray-600 border-gray-100 hover:border-gray-300"
              }`}
              type="button"
              role="tab"
              aria-controls="default-bids"
              aria-selected={activeTab === "bids"}
              onClick={() => handleTabChange("bids")}
            >
              Bids
            </button>
          </li>
        </ul>
      </div>

      <div className="chat-message-list max-h-[568px] overflow-y-auto  px-6 pb-6 pt-2">
        {activeTab === "details" && (
          <div
            id="default-bids"
            role="tabpanel"
            className="flex flex-col lg:flex-row gap-6"
          >
            {/* Left Section */}
            <div className="w-full lg:w-2/3 space-y-8">
              {/* Issue Image */}
              <div>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleSection(setImageOpen)}
                >
                  <button className="rounded bg-neutral-200 px-2 mr-2">
                    {imageOpen ? (
                      <FontAwesomeIcon
                        icon={faChevronUp}
                        className="size-2.5 align-middle"
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className="size-2.5 align-middle"
                      />
                    )}
                  </button>
                  <h2 className="text-lg font-semibold">Image</h2>
                </div>
                {imageOpen && (
                  <div className="mt-4 w-full">
                    <img
                      src={issue.image_url}
                      alt="Issue"
                      className="rounded-lg w-full h-[300px] object-cover cursor-pointer"
                      onClick={() => setSelectedImage(issue.image_url)}
                    />
                  </div>
                )}
              </div>

              {selectedImage && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
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

              {/* Details Section */}
              <div>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleSection(setDetailsOpen)}
                >
                  <button className="rounded bg-neutral-200 px-2 mr-2">
                    {detailsOpen ? (
                      <FontAwesomeIcon
                        icon={faChevronUp}
                        className="size-2.5 align-middle"
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className="size-2.5 align-middle"
                      />
                    )}
                  </button>
                  <h2 className="text-lg font-semibold">Details</h2>
                </div>
                {detailsOpen && (
                  <div className="mt-4">
                    <div className="grid grid-cols-2 gap-y-4 gap-x-24">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Type
                        </h4>
                        <p className="text-base font-semibold text-gray-700">
                          {issue.type}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Progress
                        </h4>
                        <button
                          className={`px-2.5 py-1.5 rounded font-medium text-sm ${
                            statusMapping[issue.status] === "open"
                              ? "bg-neutral-100 text-neutral-600 border border-neutral-600"
                              : statusMapping[issue.status] === "in_progress"
                              ? "bg-blue-100 text-blue-600 border border-blue-600"
                              : statusMapping[issue.status] === "review"
                              ? "bg-yellow-100 text-yellow-600 border border-yellow-600"
                              : "bg-green-100 text-green-600 border border-green-600"
                          }  ${
                            userType === "vendor" ? "pointer-events-none" : ""
                          }`}
                          ref={progressDropdownButtonRef}
                          onClick={() =>
                            setProgressDropdownOpen((prev) =>
                              prev === issue.id ? null : issue.id
                            )
                          }
                        >
                          {statusOptions.find(
                            (option) =>
                              option.value === statusMapping[issue.status]
                          )?.label || "Unknown"}

                          <FontAwesomeIcon
                            icon={faChevronDown}
                            className="ml-1"
                          />
                        </button>
                        {Number(progressDropdownOpen) === issue.id && (
                          <Dropdown
                            buttonRef={progressDropdownButtonRef}
                            onClose={() => setProgressDropdownOpen(null)}
                          >
                            <div className="dropdown-content">
                              {statusOptions.map(({ value, label }) => (
                                <button
                                  key={value}
                                  className={`block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left ${
                                    `Status.${value.toUpperCase()}` ===
                                    issue.status
                                      ? "font-bold"
                                      : ""
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleProgressChange(issue.id, value);
                                  }}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </Dropdown>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Severity
                        </h4>
                        <p
                          className={`text-base font-semibold ${
                            issue.severity === "High"
                              ? "text-red-600"
                              : issue.severity === "Medium"
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          {issue.severity}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Cost
                        </h4>
                        <p className="text-base font-semibold text-gray-700">
                          {issue.cost || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description Section */}
              <div>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleSection(setDescriptionOpen)}
                >
                  <button className="rounded bg-neutral-200 px-2 mr-2">
                    {descriptionOpen ? (
                      <FontAwesomeIcon
                        icon={faChevronUp}
                        className="size-2.5 align-middle"
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className="size-2.5 align-middle"
                      />
                    )}
                  </button>
                  <h2 className="text-lg font-semibold">Description</h2>
                </div>
                {descriptionOpen && (
                  <p className="mt-2 text-gray-700">
                    {issue.description || "No description available."}
                  </p>
                )}
              </div>

              {/* Location Section */}
              {userType !== "vendor" && (
                <div>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => toggleSection(setLocationOpen)}
                  >
                    <button className="rounded bg-neutral-200 px-2 mr-2">
                      {locationOpen ? (
                        <FontAwesomeIcon
                          icon={faChevronUp}
                          className="size-2.5 align-middle"
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faChevronDown}
                          className="size-2.5 align-middle"
                        />
                      )}
                    </button>
                    <h2 className="text-lg font-semibold">Listing Location</h2>
                  </div>

                  {locationOpen && (
                    <div className="mt-2">
                      {/* Map Preview */}
                      {locationError ? (
                        <div className="flex items-center justify-center h-64 w-full bg-gray-200 text-red-600 font-medium text-center p-4 rounded">
                          <p>
                            Unable to load map. Location not found for this
                            listing.
                          </p>
                        </div>
                      ) : coords ? (
                        <MapComponent
                          key="map-visible"
                          latitude={coords.latitude}
                          longitude={coords.longitude}
                          listingName={listing?.address || ""}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-64 w-full bg-gray-200 animate-pulse">
                          <p className="text-gray-500">Loading map...</p>
                        </div>
                      )}

                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-500">
                          Location
                        </h4>
                        <p className="text-base font-semibold text-gray-700">
                          {listing?.address}, {listing?.city}, {listing?.state},{" "}
                          {listing?.postal_code}, {listing?.country}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Attachment Section */}
              <div>
                <Attachments issueId={issue.id} userType={userType} />
              </div>

              {/* Comments Section */}
              <div>
                {userType !== "vendor" && <Comments issueId={issue.id} />}
              </div>
            </div>

            {/* Right Section */}
            <div className="w-full lg:w-1/3 space-y-6">
              {/* People Section */}
              <div className="p-4 bg-white rounded-lg shadow">
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleSection(setPeopleOpen)}
                >
                  <button className="rounded bg-neutral-200 px-2 mr-2">
                    {peopleOpen ? (
                      <FontAwesomeIcon
                        icon={faChevronUp}
                        className="size-2.5 align-middle"
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className="size-2.5 align-middle"
                      />
                    )}
                  </button>
                  <h2 className="text-lg font-semibold">People</h2>
                </div>
                {peopleOpen && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-500">
                          Vendor
                        </h4>
                      </div>
                      <p className="text-base font-semibold text-gray-700">
                        {issue.vendor_id ? (
                          <VendorName vendorId={issue.vendor_id} />
                        ) : (
                          "No vendor assigned"
                        )}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Realtor
                      </h4>
                      <p className="text-base font-semibold text-gray-700">
                        No Realtor assigned
                        {/* {issue.realtor_id ? (
                           {listing?.realtor_id}
                        ) : (
                          "No Realtor assigned"
                        )} */}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Dates Section */}
              <div className="p-4 bg-white rounded-lg shadow">
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleSection(setDatesOpen)}
                >
                  <button className="rounded bg-neutral-200 px-2 mr-2">
                    {datesOpen ? (
                      <FontAwesomeIcon
                        icon={faChevronUp}
                        className="size-2.5 align-middle"
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className="size-2.5 align-middle"
                      />
                    )}
                  </button>
                  <h2 className="text-lg font-semibold">Dates</h2>
                </div>
                {datesOpen && (
                  <div className="mt-4 space-y-3">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-gray-500">
                        Date Created
                      </h4>
                      <p className="text-base font-semibold text-gray-700">
                        {formatDate(issue.created_at)}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-gray-500">
                        Date Updated
                      </h4>
                      <p className="text-base font-semibold text-gray-700">
                        {formatDate(issue.updated_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === "bids" && (
          <div id="default-bids" role="tabpanel" className="w-full">
            {bidsLoading ? (
              <p>Loading bids...</p>
            ) : bidsError ? (
              <p>Error loading bids</p>
            ) : (
              <>
                <div className="card-header bg-white pb-4 flex items-center flex-wrap gap-3 justify-between">
                  <div className="flex items-center flex-wrap gap-3">
                    <span className="text-base font-medium text-gray-600 mb-0">
                      Bidders:{" "}
                      <span className="text-gray-800">{uniqueVendors}</span>
                    </span>
                    <span className="text-base font-medium text-gray-600 mb-0">
                      Bids: <span className="text-gray-800">{bids.length}</span>
                    </span>
                    <span className="text-base font-medium text-gray-600 mb-0">
                      Duration:{" "}
                      <span className="text-gray-800">
                        *days issue is open for?*
                      </span>
                    </span>
                  </div>
                  {userType === "vendor" && (
                    <button
                      onClick={() => setIsBidModalOpen(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium"
                    >
                      Place Bid
                    </button>
                  )}
                </div>

                <div className="bg-white">
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
                        {bids.map((bid) => (
                          <tr key={bid.id}>
                            <td className="text-left border-b border-gray-200 px-4 py-3">
                              <VendorName
                                vendorId={bid.vendor_id}
                                isVendorId={false}
                              />
                            </td>
                            <td className="text-left border-b border-gray-200 px-4 py-3">
                              ${bid.price}
                            </td>
                            <td className="text-left border-b border-gray-200 px-4 py-3">
                              {new Date(bid.created_at).toLocaleString(
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
                                className="focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg px-3.5 py-1 text-neutral-700 text-lg"
                                type="button"
                                ref={(el) => {
                                  if (el)
                                    tableDropdownButtonRefs.current.set(
                                      bid.id,
                                      el
                                    );
                                }}
                                onClick={() =>
                                  setTableDropdownOpen((prev) =>
                                    prev === bid.id ? null : bid.id
                                  )
                                }
                              >
                                <FontAwesomeIcon icon={faEllipsisVertical} />
                              </button>

                              {tableDropdownOpen === bid.id && (
                                <Dropdown
                                  buttonRef={{
                                    current:
                                      tableDropdownButtonRefs.current.get(
                                        bid.id
                                      ),
                                  }}
                                  onClose={() => setTableDropdownOpen(null)}
                                >
                                  {["Accept", "Counter", "Reject"].map(
                                    (action) => (
                                      <button
                                        key={action}
                                        className={`block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left`}
                                        onClick={() => {
                                          setTableDropdownOpen(null);
                                        }}
                                      >
                                        {action}
                                      </button>
                                    )
                                  )}
                                </Dropdown>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {isBidModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Place Your Bid</h2>

            <input
              type="number"
              value={bidAmount}
              onChange={(e) => {
                setBidAmount(e.target.value);
                setBidError("");
              }}
              placeholder={`Enter $${highestBid + 1} or more`}
              className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
            />

            <textarea
              value={commentVendor}
              onChange={(e) => setCommentVendor(e.target.value)}
              placeholder="Comment for client (optional)"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-1 text-sm"
              rows={2}
            />

            {/* <textarea
              value={commentClient}
              onChange={(e) => setCommentClient(e.target.value)}
              placeholder="Private comment (optional)"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-2 text-sm"
              rows={2}
            /> */}

            {bidError && (
              <p className="text-red-600 text-sm mb-2">{bidError}</p>
            )}

            <p className="text-sm text-gray-600 mb-2">
              Enter <strong>${highestBid + 1}</strong> or more.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              By selecting <strong>Confirm bid</strong>, you are committing to
              this issue if you are the winning bidder.
            </p>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setIsBidModalOpen(false)}
                className="text-sm px-4 py-2 rounded border border-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleBidSubmit}
                className="text-sm px-4 py-2 rounded bg-blue-600 text-white"
              >
                Confirm Bid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueDetails;
