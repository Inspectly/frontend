import React, { useRef, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faMagnifyingGlass,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { useParams } from "react-router-dom";

import { IssueOfferStatus, IssueStatus, IssueType } from "../types";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";
import { buildIssueUpdateBody } from "../utils/issueUpdateHelper";
import {
  useGetIssuesQuery,
  useUpdateIssueMutation,
  useCreateIssueMutation,
} from "../features/api/issuesApi";
import { useGetVendorTypesQuery } from "../features/api/vendorTypesApi";
import { useGetOffersByIssueIdQuery } from "../features/api/issueOffersApi";
import VendorName from "../components/VendorName";
import HomeownerIssueCard from "../components/HomeownerIssueCard";

/* ---------------- types & small helpers ---------------- */

type ReportProps = {
  /** If true, opens the Add Issue modal on mount (or when this flips true). */
  openAddIssueOnMount?: boolean;
};

// Display the cost based on accepted offers
const CostCell: React.FC<{ issueId: number }> = ({ issueId }) => {
  const { data: offers = [] } = useGetOffersByIssueIdQuery(issueId);
  const acceptedOffer = offers.find((offer) => offer.status === IssueOfferStatus.ACCEPTED);
  if (acceptedOffer) {
    return (
      <span>
        ${new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(Number(acceptedOffer.price))}
      </span>
    );
  }
  return <span>N/A</span>;
};

const Report: React.FC<ReportProps> = ({ openAddIssueOnMount }) => {
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

  const [isModalOpen, setIsModalOpen] = useState(false);

  // ⬇️ NEW: which issue is currently opened in the card
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);

  // Open the modal on mount if parent requested it
  useEffect(() => {
    if (openAddIssueOnMount) {
      setIsModalOpen(true);
    }
  }, [openAddIssueOnMount]);

  // ✅ Default status to "open"
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
    status: "open",
    active: true,
    image_url: "",
  });

  useEffect(() => {
    if (isModalOpen) {
      setFormData((prev) => ({
        ...prev,
        status: prev.status || "open",
      }));
    }
  }, [isModalOpen]);

  const [selectedFileName, setSelectedFileName] = useState("");

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
      [field]: value === "all" ? "" : value,
    }));
  };

  const handleActiveChange = async (id: number, newActive: boolean) => {
    try {
      const issueToUpdate = issues?.find((issue) => issue.id === id);
      if (!issueToUpdate) {
        console.error("Issue not found:", id);
        return;
      }
      await updateIssue(buildIssueUpdateBody(issueToUpdate, { active: newActive }, listingId ? Number(listingId) : undefined)).unwrap();
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
      const severityMap: Record<string, string> = {
        low: "Low",
        medium: "Medium", 
        high: "High",
      };
      await createIssue({
        report_id: Number(reportId),
        listing_id: Number(listingId),
        ...formData,
        severity: severityMap[formData.severity.toLowerCase()] || "None",
        status: formData.status as IssueStatus,
      }).unwrap();
      refetch();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to create issue:", err);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setFormData({
      type: "",
      description: "",
      summary: "",
      severity: "",
      status: "open",
      active: true,
      image_url: "",
    });
    setSelectedFileName("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        setFormData((prev) => ({
          ...prev,
          image_url: reader.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const reportIssues =
    issues?.filter((issue) => issue.report_id.toString() === reportId) || [];

  const filteredIssues = reportIssues.filter((issue) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      issue.summary.toLowerCase().includes(q) ||
      issue.id.toString().toLowerCase().includes(q);

    const matchesSeverity =
      filters.severity === "" || issue.severity === filters.severity;

    const matchesStatus =
      filters.status === "" || issue.status === filters.status;

    const matchesVisibility =
      filters.isVisible === "" || String(issue.active) === filters.isVisible;

    return (
      matchesSearch &&
      matchesSeverity &&
      matchesStatus &&
      matchesVisibility
    );
  });

  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentIssues = filteredIssues.slice(startIndex, endIndex);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1);
  };

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const formatDate = (isoString: string, format: "DMY" | "MDY" = "DMY") => {
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return format === "DMY"
      ? `${day}/${month}/${year}`
      : `${month}/${day}/${year}`;
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading issues</p>;

  return (
    // ⬇️ wrap in flex so we can show table + card
    <div className="flex gap-6">
      {/* LEFT: TABLE */}
      <div className="flex-1 card h-full p-0 rounded-xl border-0 overflow-hidden">
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

            <form className="relative" onSubmit={(e) => e.preventDefault()}>
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
                        />
                      </td>

                      <td
                        className="text-left border-b border-gray-200 px-4 py-3 cursor-pointer text-blue-400 hover:underline"
                        onClick={() => setSelectedIssue(issue)}
                      >
                        {issue.summary}
                      </td>

                      <td className="text-left border-b border-gray-200 px-4 py-3">
                        {normalizeAndCapitalize(issue.type)}
                      </td>

                      <td className="text-left border-b border-gray-200 px-4 py-3">
                        {issue.vendor_id ? (
                          <VendorName vendorId={issue.vendor_id} isVendorId={false} />
                        ) : (
                          "No vendor assigned"
                        )}
                      </td>

                      {/* Read-only badge version */}
                      <td className="text-left border-b border-gray-200 px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-1.5 rounded font-medium text-sm ${
                            statusMapping[issue.status as IssueStatus] === "open"
                              ? "bg-neutral-100 text-neutral-600 border border-neutral-600"
                              : statusMapping[issue.status as IssueStatus] ===
                                "in_progress"
                              ? "bg-blue-100 text-blue-600 border border-blue-600"
                              : statusMapping[issue.status as IssueStatus] ===
                                "review"
                              ? "bg-yellow-100 text-yellow-600 border border-yellow-600"
                              : "bg-green-100 text-green-600 border border-green-600"
                          }`}
                        >
                          {(
                            [
                              ...[{ value: "open", label: "Open" }],
                              { value: "in_progress", label: "In-progress" },
                              { value: "review", label: "Review" },
                              { value: "completed", label: "Completed" },
                            ] as const
                          ).find(
                            (o) =>
                              o.value ===
                              statusMapping[issue.status as IssueStatus]
                          )?.label || "Unknown"}
                        </span>
                      </td>

                      <td className="text-left border-b border-gray-200 px-4 py-3">
                        {formatDate(issue.created_at)}
                      </td>

                      <td className="text-left border-b border-gray-200 px-4 py-3">
                        <CostCell issueId={issue.id} />
                      </td>

                      <td className="text-center border-b border-gray-200 px-4 py-3">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={issue.active}
                            onChange={() =>
                              handleActiveChange(issue.id, !issue.active)
                            }
                          />
                          <span
                            className="relative w-11 h-6 bg-gray-400 peer-focus:outline-none rounded-full peer dark:bg-gray-500 
                          peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                          peer-checked:after:border-white 
                          after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 
                          after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                          dark:border-gray-600 peer-checked:bg-green-600"
                          />
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
              Showing {filteredIssues.length === 0 ? 0 : startIndex + 1} to{" "}
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
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
                )
              )}
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
                  {/* Type */}
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
                        setFormData((prev) => ({ ...prev, type: e.target.value }))
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

                  {/* Summary */}
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

                  {/* Description */}
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

                  {/* Severity */}
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
                      {["low", "medium", "high"].map((option) => (
                        <option key={option} value={option}>
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

                  {/* Status (default = open) */}
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
                        setFormData((prev) => ({ ...prev, status: e.target.value }))
                      }
                    >
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

                  {/* Active */}
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

                  {/* Image Upload */}
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
                            handleImageUpload(e);
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

      {selectedIssue && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center">
          <div className="relative w-[1100px] h-[80vh] mx-auto overflow-hidden rounded-2xl shadow-xl bg-white">
            {/* close button */}
            <button
              onClick={() => setSelectedIssue(null)}
              className="absolute -top-10 right-0 text-white text-3xl leading-none px-2"
            >
              &times;
            </button>

            <HomeownerIssueCard
              issue={selectedIssue}
              listing={undefined}
              onClose={() => setSelectedIssue(null)}
            />

          </div>
        </div>
      )}

    </div>
  );
};

export default Report;
