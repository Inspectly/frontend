import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronUp,
  faMagnifyingGlass,
  faPlus,
  faTimes,
  faChalkboard,
  faEllipsisVertical,
  faBolt,
  faHouse,
  faPaintRoller,
  faTint,
  faWind,
  faWrench,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";
import { IssueStatus } from "../types";
import { auth } from "../../firebase";
import Dropdown from "../components/Dropdown";
import VendorModal from "../components/VendorModal";
import MapComponent from "../components/MapComponent";

import VendorName from "../components/VendorName";
import Attachments from "../components/Attachments";
import Comments from "../components/Comments";
import {
  useGetIssueByIdQuery,
  useGetIssuesQuery,
  useUpdateIssueMutation,
} from "../features/api/issuesApi";
import { useGetListingByIdQuery } from "../features/api/listingsApi";

const Issue: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { listingId, reportId, issueId } = useParams<{
    listingId: string;
    reportId: string;
    issueId: string;
  }>();

  const validIssueId = issueId ? String(issueId) : "";
  const validListingId = listingId ? String(listingId) : "";

  const {
    data: issue,
    isLoading,
    error,
  } = useGetIssueByIdQuery(validIssueId, {
    skip: !validIssueId, // Skip fetching if issueId is missing
  });

  const { data: issues } = useGetIssuesQuery();
  const [updateIssue] = useUpdateIssueMutation();

  const { data: listing } = useGetListingByIdQuery(validListingId, {
    skip: !listingId, // Skip fetching if listingId is missing
  });

  const statusMapping: Record<IssueStatus, string> = {
    "Status.OPEN": "open",
    "Status.IN_PROGRESS": "in_progress",
    "Status.REVIEW": "review",
    "Status.COMPLETED": "completed",
  };

  const statusOptions = [
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In-progress" },
    { value: "review", label: "Review" },
    { value: "completed", label: "Completed" },
  ];

  // Extract tab from URL (default to "details")
  const getTabFromURL = () => {
    const params = new URLSearchParams(location.search);
    return params.get("tab") || "details"; // Default tab
  };

  const [activeTab, setActiveTab] = useState(getTabFromURL());
  const [imageOpen, setImageOpen] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [descriptionOpen, setDescriptionOpen] = useState(true);
  const [locationOpen, setLocationOpen] = useState(true);
  const [peopleOpen, setPeopleOpen] = useState(true);
  const [datesOpen, setDatesOpen] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");

  const [progressDropdownOpen, setProgressDropdownOpen] = useState<
    number | null
  >(null);
  const [tableDropdownOpen, setTableDropdownOpen] = useState<string | null>(
    null
  );

  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

  const [coords, setCoords] = useState({ latitude: 0, longitude: 0 });

  const cardRef = useRef<HTMLDivElement | null>(null);
  const progressDropdownButtonRef = useRef<HTMLButtonElement | null>(null);

  const issueIcons: Record<string, any> = {
    plumbing: faTint,
    hvac: faWind,
    electrical: faBolt,
    roofing: faHouse,
    painting: faPaintRoller,
    general: faWrench, // Default
  };

  const toggleSection = (
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setter((prev) => !prev);
  };

  // Filtered Issues based on search query
  const filteredIssues = issues?.filter(
    (issue) =>
      issue.report_id === Number(reportId) &&
      issue.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleProgressChange = (id: number, newProgress: string) => {
    updateIssue({ id, progress: newProgress });

    setTimeout(() => {
      setProgressDropdownOpen(null); // Delay closing to let the event register
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

  // const uniqueVendors = new Set(issue?.bids.map((bid) => bid.vendor)).size;

  // Sync tab state when URL changes
  useEffect(() => {
    setActiveTab(getTabFromURL());
  }, [location.search]);

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`?tab=${tab}`); // Update URL
  };

  useEffect(() => {
    if (!listing) return;

    const address = `${listing?.address}, ${listing?.city}, ${listing?.state}, ${listing?.country}`;
    getCoordinatesFromAddress(address || "")
      .then((coords) => setCoords(coords))
      .catch((error) => console.error("Error:", error));
  }, [listing]);

  if (isLoading) return <p>Loading...</p>;
  if (!issue) return <div>Issue not found.</div>;
  if (error) return <p>Error loading issues</p>;

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2 mb-6 justify-between">
        <h1 className="text-2xl font-semibold mb-0">Issue</h1>
        <ul className="text-lg flex items-center gap-[6px]">
          <li className="font-medium">
            <a
              href="/dashboard"
              className="flex items-center gap-2 hover:text-blue-400"
            >
              <FontAwesomeIcon icon={faChalkboard} className="size-5" />
              Dashboard
            </a>
          </li>
          <li>-</li>
          <li className="font-medium">
            <a
              href={`/dashboard/${listingId}`}
              className="flex items-center gap-2 hover:text-blue-400"
            >
              Report
            </a>
          </li>
          <li>-</li>
          <li className="font-medium">Issue</li>
        </ul>
      </div>

      <div className="chat-wrapper grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="rounded-lg bg-white overflow-hidden col-span-12 md:col-span-4">
          <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-4">
            <div className="flex items-center gap-4">
              <div className="">
                <h2 className="text-lg font-bold mb-0">
                  {listing?.address || "No Listing Found"}
                </h2>
              </div>
            </div>
          </div>

          <div className="chat-search w-full relative">
            <span className="icon absolute start-5 top-1/2 -translate-y-1/2 text-xl flex">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="size-4" />
            </span>
            <input
              type="text"
              className="appearance-none bg-white border-y border-gray-200 rounded-none px-3 py-2 text-base leading-6 shadow-none border-t border-b w-full focus:outline-none focus:ring-0 ps-12 pe-6"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search..."
            />
          </div>
          <div className="chat-all-list flex flex-col gap-1.5 mt-3 max-h-[580px] overflow-y-auto">
            {filteredIssues?.map((filteredIssue) => (
              <div
                key={filteredIssue.id}
                className={`mx-4 2xl:mx-10 my-1.5 p-6 rounded-sm border transition cursor-pointer relative ${
                  filteredIssue.id === issue.id
                    ? "bg-blue-500 hover:bg-blue-600 text-gray-100"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-600"
                }`}
                onClick={() =>
                  navigate(
                    `/listings/${listingId}/reports/${reportId}/issues/${filteredIssue.id}`
                  )
                }
              >
                {/* Notification Badge */}
                {/* {filteredIssue.bids.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {filteredIssue.bids.length > 9
                      ? "9+"
                      : filteredIssue.bids.length}
                  </span>
                )} */}

                {/* Header (Title & Icons) */}
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex w-10 h-10 flex-shrink-0 items-center justify-center">
                      {/* <img
                        src={`/images/${filteredIssue.type.toLowerCase()}.png`}
                        alt=""
                      /> */}

                      <FontAwesomeIcon
                        icon={
                          issueIcons[filteredIssue.type.toLocaleLowerCase()] ||
                          faWrench
                        } // Default to faWrench if no match
                        className={`text-2xl ${
                          filteredIssue.id === issue.id
                            ? "text-white"
                            : "text-gray-600"
                        }`}
                      />
                    </span>
                    <h3 lang="en" className="font-semibold">
                      {filteredIssue.summary}
                    </h3>
                  </div>
                </div>

                {/* Progress */}
                <p className="mt-4 text-sm flex flex-wrap justify-between items-center gap-2">
                  Progress:{" "}
                  <span
                    className={`px-2.5 py-1.5 rounded font-medium text-md ${
                      statusMapping[filteredIssue.status] === "open"
                        ? "bg-neutral-100 text-neutral-600 border border-neutral-600"
                        : statusMapping[filteredIssue.status] === "in_progress"
                        ? "bg-blue-100 text-blue-600 border border-blue-600"
                        : statusMapping[filteredIssue.status] === "review"
                        ? "bg-yellow-100 text-yellow-600 border border-yellow-600"
                        : "bg-green-100 text-green-600 border border-green-600"
                    }`}
                  >
                    {statusOptions.find(
                      (option) =>
                        option.value === statusMapping[filteredIssue.status]
                    )?.label || "Unknown"}
                  </span>
                </p>

                {/* Severity & Vendor */}
                <p className="mt-12 text-sm flex flex-wrap justify-between gap-2">
                  Severity:{" "}
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        filteredIssue.severity === "high"
                          ? filteredIssue.id === issue.id
                            ? "bg-red-700"
                            : "bg-red-500"
                          : filteredIssue.severity === "medium"
                          ? "bg-yellow-500"
                          : filteredIssue.id === issue.id
                          ? "bg-green-400"
                          : "bg-green-500"
                      }`}
                    ></span>
                    <span
                      className={`font-semibold ${
                        filteredIssue.id === issue.id
                          ? "text-white"
                          : filteredIssue.severity === "high"
                          ? "text-red-500"
                          : filteredIssue.severity === "medium"
                          ? "text-yellow-500"
                          : "text-green-500"
                      }`}
                    >
                      {filteredIssue.severity}
                    </span>
                  </div>
                </p>
                <p className="mt-1 text-sm flex flex-wrap justify-between gap-2">
                  Vendor:{" "}
                  <span
                    className={`text-md font-semibold ${
                      filteredIssue.id === issue.id
                        ? "text-white"
                        : "text-gray-800"
                    }`}
                  >
                    {issue.vendor_id ? (
                      <VendorName vendorId={filteredIssue.vendor_id} />
                    ) : (
                      "N/A"
                    )}
                  </span>
                </p>

                {/* Category Badge */}
                <span
                  className={`mt-4 inline-block text-xs font-semibold rounded-full px-3 py-1.5 ${
                    filteredIssue.id === issue.id
                      ? "bg-blue-400 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {filteredIssue.type}
                </span>

                {/* Dropdown Action Button */}
                <button
                  className={`absolute bottom-4 text-xl right-6 p-2 ${
                    filteredIssue.id === issue.id
                      ? "text-white"
                      : "text-gray-600"
                  }`}
                >
                  <FontAwesomeIcon icon={faEllipsisVertical} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className=" col-span-12 md:col-span-8">
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
                    {/* <div>
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
                            src={issue.image}
                            alt="Issue"
                            className="rounded-lg w-full h-[300px] object-cover cursor-pointer"
                            onClick={() => handleImageClick(issue.image)}
                          />
                        </div>
                      )}
                    </div> */}

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
                                    : statusMapping[issue.status] ===
                                      "in_progress"
                                    ? "bg-blue-100 text-blue-600 border border-blue-600"
                                    : statusMapping[issue.status] === "review"
                                    ? "bg-yellow-100 text-yellow-600 border border-yellow-600"
                                    : "bg-green-100 text-green-600 border border-green-600"
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
                          A major pipe leakage is causing water overflow in the
                          kitchen.
                        </p>
                      )}
                    </div>

                    {/* Location Section */}
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
                        <h2 className="text-lg font-semibold">
                          Listing Location
                        </h2>
                      </div>

                      {locationOpen && (
                        <div className="mt-2">
                          {/* Map Preview */}
                          <MapComponent
                            key={locationOpen ? "map-visible" : "map-hidden"}
                            latitude={coords.latitude}
                            longitude={coords.longitude}
                            listingName={listing?.address || ""}
                          />

                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-500">
                              Location
                            </h4>
                            <p className="text-base font-semibold text-gray-700">
                              {listing?.address}, {listing?.city},{" "}
                              {listing?.state}, {listing?.postal_code},{" "}
                              {listing?.country}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Attachment Section */}
                    <div>
                      <Attachments issueId={issue.id} />
                    </div>

                    {/* Comments Section */}
                    <div>
                      <Comments issueId={issue.id} />
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
                              <button
                                onClick={() => setIsVendorModalOpen(true)}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <FontAwesomeIcon
                                  icon={faPlus}
                                  className="size-3"
                                />
                              </button>
                            </div>
                            <p className="text-base font-semibold text-gray-700">
                              {issue.vendor_id ? (
                                <VendorName vendorId={issue.vendor_id} />
                              ) : (
                                "No vendor assigned"
                              )}
                            </p>

                            {/* Vendor Modal */}
                            <VendorModal
                              isOpen={isVendorModalOpen}
                              onClose={() => setIsVendorModalOpen(false)}
                            />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">
                              Realtor
                            </h4>
                            {/* <p className="text-base font-semibold text-gray-700">
                              {listing?.realtor_id}
                            </p> */}
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
                  <div className="card-header bg-white pb-4 flex items-center flex-wrap gap-3 justify-between">
                    <div className="flex items-center flex-wrap gap-3">
                      <span className="text-base font-medium text-gray-600 mb-0">
                        Bidders:{" "}
                        {/* <span className="text-gray-800">{uniqueVendors}</span> */}
                      </span>
                      <span className="text-base font-medium text-gray-600 mb-0">
                        Bids:{" "}
                        <span className="text-gray-800">
                          {/* {issue.bids.length} */}
                        </span>
                      </span>
                      <span className="text-base font-medium text-gray-600 mb-0">
                        Duration: <span className="text-gray-800">7 days</span>
                      </span>
                    </div>
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
                          {/* {issue.bids.map((bid) => (
                            <tr key={bid.id}>
                              <td className="text-left border-b border-gray-200 px-4 py-3">
                                {bid.vendor}
                              </td>
                              <td className="text-left border-b border-gray-200 px-4 py-3">
                                {bid.amount}
                              </td>
                              <td className="text-left border-b border-gray-200 px-4 py-3">
                                {bid.dateAdded}
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
                                    setTableDropdownOpen((prev) => (prev === bid.id ? null : bid.id))
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
                          ))} */}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Issue;
