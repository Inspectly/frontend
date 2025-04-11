import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faChalkboard,
  faEllipsisVertical,
  faBolt,
  faHouse,
  faPaintRoller,
  faTint,
  faWind,
  faWrench,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router-dom";
import { statusMapping, statusOptions } from "../types";

import VendorName from "../components/VendorName";
import {
  useGetIssueByIdQuery,
  useGetIssuesQuery,
} from "../features/api/issuesApi";
import { useGetListingByIdQuery } from "../features/api/listingsApi";
import IssueDetials from "../components/IssueDetails";

const Issue: React.FC = () => {
  const navigate = useNavigate();

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

  const { data: listing } = useGetListingByIdQuery(validListingId, {
    skip: !listingId, // Skip fetching if listingId is missing
  });

  const [searchQuery, setSearchQuery] = useState("");

  const issueIcons: Record<string, IconDefinition> = {
    plumbing: faTint,
    hvac: faWind,
    electrical: faBolt,
    roofing: faHouse,
    painting: faPaintRoller,
    general: faWrench, // Default
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

  if (isLoading) return <p>Loading...</p>;
  if (!issue) return <div>Issue not found.</div>;
  if (error) return <p>Error loading issues</p>;

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2 mb-6 justify-between">
        <h1 className="text-2xl font-semibold mb-0">Issue</h1>
        <ul className="text-lg text-gray-600 flex items-center gap-[6px]">
          <li className="font-medium">
            <a
              href="/dashboard"
              className="flex items-center gap-2 hover:text-blue-400"
            >
              <FontAwesomeIcon icon={faChalkboard} className="size-4" />
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
                      <VendorName vendorId={Number(filteredIssue.vendor_id)} />
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
        <div className="col-span-12 md:col-span-8">
          <IssueDetials issue={issue} listing={listing} />
        </div>
      </div>
    </div>
  );
};

export default Issue;
