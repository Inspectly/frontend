import React, { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faMagnifyingGlass,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { useParams, useLocation, useNavigate } from "react-router-dom";

import { IssueOfferStatus, IssueStatus } from "../types";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";
import { buildIssueUpdateBody } from "../utils/issueUpdateHelper";
import {
  useGetIssuesQuery,
  useUpdateIssueMutation,
  issuesApi,
} from "../features/api/issuesApi";
import { useGetListingByIdQuery } from "../features/api/listingsApi";
import PostJobWizard from "../components/PostJobWizard";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store/store";
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
  const dispatch = useDispatch<AppDispatch>();
  const { listingId, reportId } = useParams<{
    listingId: string;
    reportId: string;
  }>();

  const { data: issues, error, isLoading } = useGetIssuesQuery();

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

  // ⬇️ NEW: which issue is currently opened in the card
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Track whether the modal was opened from a freshly created issue
  const [wasCreatedIssue, setWasCreatedIssue] = useState(false);

  // Auto-open issue detail modal when navigated with the created issue
  useEffect(() => {
    const openIssue = (location.state as any)?.openIssue;
    if (openIssue) {
      setSelectedIssue(openIssue);
      setWasCreatedIssue(true);
      setLocalCreatedIssue(openIssue); // Show in table immediately via local state

      // Also try adding to RTK cache (works if cache exists)
      dispatch(
        issuesApi.util.updateQueryData("getIssues", undefined, (draft) => {
          if (!draft.find((i) => i.id === openIssue.id)) {
            draft.push(openIssue);
          }
        })
      );

      // Clear navigation state so it doesn't re-open on back/refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname, dispatch]);

  const handleCloseIssueModal = () => {
    setSelectedIssue(null);
    if (wasCreatedIssue) {
      setWasCreatedIssue(false);
    }
    // No refetch needed — updateIssue mutation already optimistically updates the cache
  };

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
    } catch (error) {
      console.error("Error updating issue:", error);
    }
  };

  // Merge API issues with any locally created issue that hasn't appeared in cache yet
  const [localCreatedIssue, setLocalCreatedIssue] = useState<any | null>(null);

  const reportIssues = useMemo(() => {
    const apiIssues = issues?.filter((issue) => issue.report_id.toString() === reportId) || [];
    // If we have a locally created issue that isn't in the API list yet, include it
    if (localCreatedIssue && !apiIssues.find(i => i.id === localCreatedIssue.id)) {
      return [...apiIssues, localCreatedIssue];
    }
    return apiIssues;
  }, [issues, reportId, localCreatedIssue]);

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

  if (isLoading && !issues) return <p>Loading...</p>;
  if (error && !issues) return <p>Error loading issues</p>;

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
                          <span className="text-gray-400">—</span>
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
                        <label className={`inline-flex items-center ${issue.vendor_id ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={issue.vendor_id ? false : issue.active}
                            disabled={!!issue.vendor_id}
                            onChange={() => {
                              if (!issue.vendor_id) {
                                handleActiveChange(issue.id, !issue.active);
                              }
                            }}
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

          <PostJobWizard
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            listings={[]}
            currentListing={currentListing}
          />
        </div>
      </div>

      {selectedIssue && (
        <div className="fixed inset-0 z-[70] overflow-y-auto">
          <div className="fixed inset-0 bg-black/40" onClick={handleCloseIssueModal} />
          <div
            className="relative min-h-screen flex items-start justify-center p-4 pt-16"
            onClick={handleCloseIssueModal}
          >
            <div
              className="relative w-[1100px] h-[80vh] mx-auto overflow-hidden rounded-2xl shadow-xl bg-white"
              onClick={(e) => e.stopPropagation()}
            >
            {/* close button */}
            <button
              onClick={handleCloseIssueModal}
              className="absolute -top-10 right-0 text-white text-3xl leading-none px-2"
            >
              &times;
            </button>

            <HomeownerIssueCard
              issue={selectedIssue}
              listing={undefined}
              onClose={handleCloseIssueModal}
              autoOpenDispute={false}
            />

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Report;
