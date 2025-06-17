import React, { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faChevronDown,
  faMagnifyingGlass,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useParams } from "react-router-dom";
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";

import VendorName from "./VendorName";
import { IssueStatus } from "../types";
import Dropdown from "./Dropdown";
import {
  useGetIssuesQuery,
  useUpdateIssueMutation,
} from "../features/api/issuesApi";
import { useCreateIssueMutation } from "../features/api/issuesApi";
import { useGetVendorTypesQuery } from "../features/api/vendorTypesApi";

const ReportTable: React.FC = () => {
  const { listingId, reportId } = useParams<{
    listingId: string;
    reportId: string;
  }>();

  const { data: issues, error, isLoading, refetch } = useGetIssuesQuery();
  const { data: fetchedVendorTypes } = useGetVendorTypesQuery();

  const [updateIssue] = useUpdateIssueMutation();
  const [createIssue] = useCreateIssueMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    severity: "",
    status: "",
    isVisible: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    type: string;
    description: string;
    summary: string;
    severity: string;
    status: IssueStatus | string;
    active: boolean;
    image_url: string;
  }>({
    type: "",
    description: "",
    summary: "",
    severity: "",
    status: "",
    active: true,
    image_url: "",
  });
  const [selectedFileName, setSelectedFileName] = useState("");

  const tableDropdownButtonRefs = useRef(new Map());

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

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value === "all" ? "" : value, // Convert "all" back to empty string
    }));
  };

  const handleProgressChange = async (id: number, newProgress: string) => {
    try {
      // Get the existing issue data before updating
      const issueToUpdate = issues?.find((issue) => issue.id === id);

      if (!issueToUpdate) {
        console.error("Issue not found:", id);
        return;
      }

      console.log("Issue before update:", issueToUpdate);

      // Send the full object with updated status
      await updateIssue({
        ...issueToUpdate,
        status: newProgress, // Only this field changes
      }).unwrap();

      refetch();

      setDropdownOpen(null);
    } catch (error) {
      console.error("Error updating issue:", error);
    }
  };

  const handleActiveChange = async (id: number, newActive: boolean) => {
    try {
      // Get the existing issue data before updating
      const issueToUpdate = issues?.find((issue) => issue.id === id);

      if (!issueToUpdate) {
        console.error("Issue not found:", id);
        return;
      }

      console.log("Issue before update:", issueToUpdate);

      // Send the full object with updated status
      await updateIssue({
        ...issueToUpdate,
        status: statusMapping[issueToUpdate.status as IssueStatus],
        active: newActive, // Only this field changes
      }).unwrap();

      refetch();
    } catch (error) {
      console.error("Error updating issue:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createIssue({
        report_id: Number(reportId),
        ...formData,
        status: formData.status as IssueStatus,
      }).unwrap();
      refetch();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to create listing:", err);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setFormData({
      type: "",
      description: "",
      summary: "",
      severity: "",
      status: "",
      active: true,
      image_url: "",
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate uploading and getting a URL (replace with real upload later)
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        setFormData((prev) => ({
          ...prev,
          image_url: reader.result as string, // base64 string or actual URL if uploaded
        }));
      }
    };
    reader.readAsDataURL(file); // base64 preview, not for production
  };

  const reportIssues =
    issues?.filter((issue) => issue.report_id.toString() === reportId) || [];

  // Filter logic
  const filteredIssues = reportIssues.filter((issue) => {
    const matchesSearchQuery =
      issue.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.id.toString().toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity =
      filters.severity === "" || issue.severity === filters.severity;
    const matchesProgress =
      filters.status === "" || issue.status === filters.status;
    const matchesVisibility =
      filters.isVisible === "" || String(issue.active) === filters.isVisible;

    return (
      matchesSearchQuery &&
      matchesSeverity &&
      matchesProgress &&
      matchesVisibility
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentIssues = filteredIssues.slice(startIndex, endIndex);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleItemsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1); // Reset to first page on items per page change
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const formatDate = (isoString: string, format: "DMY" | "MDY" = "DMY") => {
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, "0"); // Ensure 2 digits
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-based
    const year = date.getFullYear();

    return format === "DMY"
      ? `${day}/${month}/${year}`
      : `${month}/${day}/${year}`;
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading issues</p>;

  return (
    <div className="card h-full p-0 rounded-xl border-0 overflow-hidden">
      <div className="card-header border-b border-neutral-200 bg-white py-4 px-6 flex items-center flex-wrap gap-3 justify-between">
        <div className="flex items-center flex-wrap gap-3">
          <span className="text-base font-medium mb-0">Show</span>
          <select
            className="border px-1 py-1.5 w-auto border-neutral-300 rounded-lg cursor-pointer"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={40}>40</option>
            <option value={50}>50</option>
          </select>
          <form className="relative">
            <input
              type="text"
              placeholder="Search issues"
              value={searchQuery}
              onChange={handleSearchChange}
              className="h-10 sm:w-[20rem] w-[14rem] rounded-lg border border-gray-200 bg-gray-100 px-[2.625rem] pr-5 py-[0.3125rem] text-gray-900"
            />
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-[0.9rem] text-gray-600"
            />
          </form>
          <select
            className="border px-1 py-1.5 cursor-pointer w-auto border-neutral-200 rounded-lg"
            value={filters.severity}
            onChange={(e) => handleFilterChange("severity", e.target.value)}
          >
            <option value="all">Filter by Severity</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            className="border px-1 py-1.5 cursor-pointer w-auto border-neutral-200 rounded-lg"
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
          >
            <option value="all">Filter by Status</option>
            <option value="Status.OPEN">Open</option>
            <option value="Status.IN_PROGRESS">In-progress</option>
            <option value="Status.REVIEW">Review</option>
            <option value="Status.COMPLETED">Completed</option>
          </select>

          <select
            className="border px-1 py-1.5 cursor-pointer w-auto border-neutral-200 rounded-lg"
            value={filters.isVisible}
            onChange={(e) => handleFilterChange("isVisible", e.target.value)}
          >
            <option value="all">Filter by visibility</option>
            <option value="true">Visible</option>
            <option value="false">Not visible</option>
          </select>
        </div>
        <button
          className="btn text-white flex items-center w-fit normal-case bg-blue-400 h-auto rounded-2xl gap-x-[10.5px] hover:bg-blue-500 p-[17.5px]"
          onClick={() => setIsModalOpen(true)}
        >
          <span className="font-semibold text-[14px] leading-[21px]">
            Add New Issue
          </span>
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>
      <div className="bg-white p-6">
        {currentIssues.length === 0 ? (
          <div className="text-center text-gray-500">
            You have no current issues.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full min-w-max border-separate border-spacing-0 rounded-lg border border-gray-200 bordered-table sm-table mb-0">
              <thead>
                <tr>
                  <th className="bg-gray-100 text-center font-medium px-4 py-3 first:rounded-tl-lg">
                    Severity
                  </th>
                  {/* Below code add's issue id. Uncomment if needed */}
                  {/* <th className="bg-gray-100 text-left font-medium px-4 py-3">
                    ID
                  </th> */}
                  <th className="bg-gray-100 text-left font-medium px-4 py-3">
                    Summary
                  </th>
                  <th className="bg-gray-100 text-left font-medium px-4 py-3">
                    Type
                  </th>
                  <th className="bg-gray-100 text-left font-medium px-4 py-3">
                    Vendor
                  </th>
                  <th className="bg-gray-100 text-left font-medium px-4 py-3">
                    Status
                  </th>
                  <th className="bg-gray-100 text-left font-medium px-4 py-3">
                    Date Created
                  </th>
                  <th className="bg-gray-100 text-left font-medium px-4 py-3">
                    Cost
                  </th>
                  <th className="bg-gray-100 text-center font-medium px-4 py-3">
                    Marketplace
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    className={issue.active ? "" : "bg-red-100"}
                  >
                    <td className="text-center border-b border-gray-200 px-4 py-3">
                      <span
                        className={`block w-4 h-4 rounded-full mx-auto ${
                          issue.severity === "high"
                            ? "bg-red-500"
                            : issue.severity === "medium"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                      ></span>
                    </td>
                    {/* Below code add's issue id. Uncomment if needed */}
                    {/* <td className="text-left border-b border-gray-200 px-4 py-3">
                      {issue.id}
                    </td> */}
                    <td className="text-left border-b border-gray-200 px-4 py-3">
                      <Link
                        to={`/listings/${listingId}/reports/${reportId}/issues/${issue.id}`}
                        className="text-blue-400 hover:underline"
                      >
                        {issue.summary}
                      </Link>
                    </td>
                    <td className="text-left border-b border-gray-200 px-4 py-3">
                      {issue.type}
                    </td>
                    <td className="text-left border-b border-gray-200 px-4 py-3">
                      {issue.vendor_id ? (
                        <VendorName
                          vendorId={issue.vendor_id}
                          isVendorId={false}
                        />
                      ) : (
                        "No vendor assigned"
                      )}
                    </td>

                    {/* Below code changes read only status to setting status by dropdown */}
                    {/* <td className="text-left border-b border-gray-200 px-4 py-3">
                      <div className="relative">
                        <button
                          className={`px-2.5 py-1.5 rounded font-medium text-sm ${
                            statusMapping[issue.status as IssueStatus] ===
                            "open"
                              ? "bg-neutral-100 text-neutral-600 border border-neutral-600"
                              : statusMapping[issue.status as IssueStatus] ===
                                "in_progress"
                              ? "bg-blue-100 text-blue-600 border border-blue-600"
                              : statusMapping[issue.status as IssueStatus] ===
                                "review"
                              ? "bg-yellow-100 text-yellow-600 border border-yellow-600"
                              : "bg-green-100 text-green-600 border border-green-600"
                          }`}
                          ref={(el) => {
                            if (el)
                              tableDropdownButtonRefs.current.set(issue.id, el);
                          }}
                          onClick={() =>
                            setDropdownOpen((prev) =>
                              prev === issue.id ? null : issue.id
                            )
                          }
                        >
                          {statusOptions.find(
                            (option) =>
                              option.value ===
                              statusMapping[issue.status as IssueStatus]
                          )?.label || "Unknown"}

                          <FontAwesomeIcon
                            icon={faChevronDown}
                            className="ml-1"
                          />
                        </button>
                        {dropdownOpen === issue.id && (
                          <Dropdown
                            buttonRef={{
                              current: tableDropdownButtonRefs.current.get(
                                issue.id
                              ),
                            }}
                            onClose={() => setDropdownOpen(null)}
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
                    </td> */}

                    <td className="text-left border-b border-gray-200 px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-1.5 rounded font-medium text-sm ${
                          statusMapping[issue.status as IssueStatus] === "open"
                            ? "bg-neutral-100 text-neutral-600 border border-neutral-600"
                            : statusMapping[issue.status as IssueStatus] === "in_progress"
                            ? "bg-blue-100 text-blue-600 border border-blue-600"
                            : statusMapping[issue.status as IssueStatus] === "review"
                            ? "bg-yellow-100 text-yellow-600 border border-yellow-600"
                            : "bg-green-100 text-green-600 border border-green-600"
                        }`}
                      >
                        {statusOptions.find(
                          (option) =>
                            option.value === statusMapping[issue.status as IssueStatus]
                        )?.label || "Unknown"}
                      </span>
                    </td>

                    <td className="text-left border-b border-gray-200 px-4 py-3">
                      {formatDate(issue.created_at)}
                    </td>

                    <td className="text-left border-b border-gray-200 px-4 py-3">
                      {issue.cost || "N/A"}
                    </td>
                    <td className="text-center border-b border-gray-200 px-4 py-3">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={issue.active}
                          onChange={() => handleActiveChange(issue.id, !issue.active)}
                        />
                        <span className="relative w-11 h-6 bg-gray-400 peer-focus:outline-none rounded-full peer dark:bg-gray-500 
                          peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                          peer-checked:after:border-white 
                          after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 
                          after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                          dark:border-gray-600 peer-checked:bg-green-600"
                        ></span>
                        <span className="line-height-1 font-medium ms-3 peer-checked:text-green-600 text-md text-gray-600 dark:text-gray-300">
                          {/* {issue.active ? "Active" : "Inactive"} */}
                        </span>
                      </label>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-2 mt-6">
          <span>
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, filteredIssues.length)} of{" "}
            {filteredIssues.length} entries
          </span>
          <ul className="pagination flex flex-wrap items-center gap-2 justify-center">
            <li className="page-item">
              <button
                className={`page-link bg-neutral-200 font-semibold rounded-lg border-0 flex items-center justify-center h-8 w-8 text-base ${
                  currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handlePrevious}
                disabled={currentPage === 1}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <li key={page} className="page-item">
                <button
                  className={`page-link font-semibold rounded-lg border-0 flex items-center justify-center h-8 w-8 ${
                    currentPage === page
                      ? "bg-blue-400 text-white"
                      : "bg-neutral-200"
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              </li>
            ))}
            <li className="page-item">
              <button
                className={`page-link bg-neutral-200 font-semibold rounded-lg border-0 flex items-center justify-center h-8 w-8 text-base ${
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={handleNext}
                disabled={currentPage === totalPages}
              >
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </li>
          </ul>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-xl rounded-xl shadow-lg p-6 relative">
              <button
                onClick={handleModalClose}
                className="absolute top-2 right-4 text-3xl font-light text-gray-600 hover:text-gray-800"
              >
                &times;
              </button>
              <h6 className="text-lg font-semibold mb-4">Create New Issue</h6>
              <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-4">
                <div className="relative col-span-12">
                  <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
                    Type
                  </label>
                  <select
                    name="type"
                    className="w-full rounded-lg cursor-pointer border border-gray-300 bg-white px-5 py-2.5 appearance-none"
                    value={formData.type}
                    required
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                  >
                    <option value="" disabled hidden>
                      Select an issue type
                    </option>
                    {fetchedVendorTypes?.map((option) => (
                      <option key={option.id} value={option.vendor_type}>
                        {option.vendor_type}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 top-8 right-4 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                <div className="col-span-12">
                  <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
                    Summary
                  </label>
                  <input
                    type="text"
                    name="summary"
                    className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5"
                    placeholder="Short summary"
                    value={formData.summary}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="col-span-12">
                  <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
                    Description
                  </label>
                  <textarea
                    name="description"
                    className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5"
                    placeholder="Detailed description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="relative col-span-6">
                  <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
                    Severity
                  </label>
                  <select
                    name="severity"
                    className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 cursor-pointer appearance-none"
                    value={formData.severity}
                    required
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        severity: e.target.value,
                      }))
                    }
                  >
                    <option value="" disabled hidden>
                      Select a severity
                    </option>
                    {["low", "medium", "high"].map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 top-8 right-4 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                <div className="relative col-span-6">
                  <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
                    Status
                  </label>
                  <select
                    name="status"
                    className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 cursor-pointer appearance-none"
                    value={formData.status}
                    required
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                  >
                    <option value="" disabled hidden>
                      Select a status
                    </option>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 top-8 right-4 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                <div className="col-span-12">
                  <label className="inline-flex items-center space-x-2 text-sm leading-5 font-semibold text-gray-600">
                    <input
                      type="checkbox"
                      name="active"
                      checked={formData.active}
                      onChange={(e) =>
                        setFormData({ ...formData, active: e.target.checked })
                      }
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <span>Active</span>
                  </label>
                </div>

                <div className="col-span-12">
                  <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
                    Upload Image
                  </label>
                  <div className="flex w-full">
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer bg-gray-800 text-white text-sm px-4 py-2 rounded-l-lg flex items-center whitespace-nowrap"
                    >
                      Choose File
                    </label>
                    <span className="border border-l-0 border-gray-300 bg-white text-base px-5 py-2.5 rounded-r-lg w-full flex items-center">
                      {selectedFileName || "No file chosen"}
                    </span>
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFileName(file.name);
                          handleImageUpload(e); // handle storing image_url
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="col-span-12">
                  <button
                    type="submit"
                    className="btn bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportTable;
