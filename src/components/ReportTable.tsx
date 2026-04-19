// src/components/ReportTable.tsx
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faMagnifyingGlass,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useParams } from "react-router-dom";

import VendorName from "./VendorName";
import { IssueOfferStatus, IssueStatus } from "../types";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";
import { buildIssueUpdateBody } from "../utils/issueUpdateHelper";
import {
  useGetIssuesQuery,
  useUpdateIssueMutation,
} from "../features/api/issuesApi";
import { useGetListingByIdQuery } from "../features/api/listingsApi";
import { useGetOffersByIssueIdQuery } from "../features/api/issueOffersApi";
import PostJobWizard from "./PostJobWizard";

/* ---------------- types & small helpers ---------------- */

type ReportTableProps = {
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

const ReportTable: React.FC<ReportTableProps> = ({ openAddIssueOnMount }) => {
  const { listingId, reportId } = useParams<{
    listingId: string;
    reportId: string;
  }>();

  const { data: issues, error, isLoading, refetch } = useGetIssuesQuery();

  const [updateIssue] = useUpdateIssueMutation();
  const { data: currentListing } = useGetListingByIdQuery(Number(listingId), { skip: !listingId });

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    severity: "",
    status: "",
    isVisible: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Open the modal on mount if parent requested it
  useEffect(() => {
    if (openAddIssueOnMount) {
      setIsModalOpen(true);
    }
  }, [openAddIssueOnMount]);

  const statusMapping: Record<IssueStatus, string> = {
    "Status.OPEN": "open",
    "Status.IN_PROGRESS": "in_progress",
    "Status.REVIEW": "review",
    "Status.COMPLETED": "completed",
  };

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

    return matchesSearch && matchesSeverity && matchesStatus && matchesVisibility;
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
    return format === "DMY" ? `${day}/${month}/${year}` : `${month}/${day}/${year}`;
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
          <div className="text-center text-gray-500">You have no current issues.</div>
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
                  <tr key={issue.id} className={issue.active ? "" : "bg-red-100"}>
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

                    <td className="text-left border-b border-gray-200 px-4 py-3">
                      <Link
                        to={`/listings/${listingId}/reports/${reportId}/issues/${issue.id}`}
                        className="text-blue-400 hover:underline"
                      >
                        {issue.summary}
                      </Link>
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

                    {/* Read-only badge version (dropdown variant is kept commented) */}
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
                        {(
                          [
                            ...[{ value: "open", label: "Open" }],
                            { value: "in_progress", label: "In-progress" },
                            { value: "review", label: "Review" },
                            { value: "completed", label: "Completed" },
                          ] as const
                        ).find(
                          (o) => o.value === statusMapping[issue.status as IssueStatus]
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
                          onChange={() => handleActiveChange(issue.id, !issue.active)}
                        />
                        <span
                          className="relative w-11 h-6 bg-gray-400 peer-focus:outline-none rounded-full peer dark:bg-gray-500 
                          peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                          peer-checked:after:border-white 
                          after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 
                          after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                          dark:border-gray-600 peer-checked:bg-green-600"
                        />
                        <span className="line-height-1 font-medium ms-3 peer-checked:text-green-600 text-md text-gray-600 dark:text-gray-300" />
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
            {Math.min(endIndex, filteredIssues.length)} of {filteredIssues.length} entries
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
                    currentPage === page ? "bg-blue-400 text-white" : "bg-neutral-200"
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
                  currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleNext}
                disabled={currentPage === totalPages}
              >
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </li>
          </ul>
        </div>

        <PostJobWizard
          open={isModalOpen}
          onClose={() => { setIsModalOpen(false); refetch(); }}
          listings={[]}
          currentListing={currentListing}
        />
      </div>
    </div>
  );
};

export default ReportTable;
