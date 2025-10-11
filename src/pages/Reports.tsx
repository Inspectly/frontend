import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight, faListCheck, faMagnifyingGlass, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { useGetListingByIdQuery } from "../features/api/listingsApi";
import {
  useGetReportsQuery,
  useCreateReportMutation,
  useUpdateReportMutation,
} from "../features/api/reportsApi";
import ReportCardWithStatus from "../components/ReportCardWithStatus";
import type { ReportType, ReviewStatus } from "../types";


/** Normalize backend string to our strict union; default to "not_reviewed". */
const normalizeReviewStatus = (raw?: string | null): ReviewStatus => {
  const v = (raw ?? "").toLowerCase();
  return v === "in_review" || v === "completed" || v === "not_reviewed" ? (v as ReviewStatus) : "not_reviewed";
};

type ReportRow = {
  id: number;
  user_id: number;
  listing_id: number;
  aws_link: string | null;
  name: string | null;
  created_at: string;
  updated_at: string;
  review_status: ReviewStatus; // strict union here
};

const toReportRow = (r: ReportType): ReportRow => ({
  id: r.id,
  user_id: r.user_id,
  listing_id: r.listing_id,
  aws_link: r.aws_link ?? null,
  name: r.name ?? null,
  created_at: r.created_at,
  updated_at: r.updated_at,
  review_status: normalizeReviewStatus(r.review_status),
});

/* ---------------- component ---------------- */

const Reports: React.FC = () => {
  const { data: reports, error, isLoading, refetch } = useGetReportsQuery();
  const [createReport] = useCreateReportMutation();
  const [updateReport] = useUpdateReportMutation();

  const user = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();
  const { listingId } = useParams<{ listingId: string }>();
  const { data: listing } = useGetListingByIdQuery(Number(listingId), { skip: !listingId });

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "" });

  // Adapt and filter reports for this listing
  const listingReports: ReportRow[] = useMemo(() => {
    const list = (reports ?? [])
      .filter((r) => String(r.listing_id) === listingId) // predicate matches ReportType
      .map(toReportRow); // adapt to strict local shape
    return list;
  }, [reports, listingId]);

  // Search filter
  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return listingReports;
    return listingReports.filter((r) => (r.name ?? "").toLowerCase().includes(q));
  }, [listingReports, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReports = filteredReports.slice(startIndex, endIndex);

  // Responsive items per page
  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      let columns = 2;
      if (width >= 640) columns = 3;   // sm
      if (width >= 768) columns = 4;   // md
      if (width >= 1280) columns = 5;  // xl
      if (width >= 1536) columns = 6;  // 2xl
      const rows = 3;
      setItemsPerPage(columns * rows);
    };
    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  const handlePrevious = () => currentPage > 1 && setCurrentPage((p) => p - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage((p) => p + 1);
  const handlePageClick = (page: number) => setCurrentPage(page);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createReport({
        user_id: user.id,
        listing_id: Number(listingId),
        aws_link: "https://s3.amazonaws.com/example-bucket/dummy-report.pdf", // TODO replace with real S3 link
        review_status: 'completed',
        ...formData,
      }).unwrap();
      await refetch();
      setFormData({ name: "" });
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to create report:", err);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setFormData({ name: "" });
  };


  const buildUpdatePayload = (r: ReportRow, review_status: "not_reviewed" | "in_review" | "completed") => ({
    id: r.id,                
    user_id: r.user_id,       
    listing_id: r.listing_id, 
    aws_link: r.aws_link ?? "", 
    name: r.name ?? "",        
    review_status,         
  });

  const handleStartOrContinueReview = async (report: ReportRow) => {
    try {
      if ((report.review_status ?? "not_reviewed") === "not_reviewed") {
        await updateReport(buildUpdatePayload(report, "in_review")).unwrap();
        refetch();
      }
      navigate(`/listings/${listingId}/reports/${report.id}/review`, { state: { report } });
    } catch (e: any) {
      console.error("Failed to set review_status to in_review:", e?.data ?? e);
    }
  };


  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading reports</p>;

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2 mb-6 justify-between">
        <h1 className="text-2xl font-semibold mb-0">Reports for {listing?.address}</h1>
        <ul className="text-lg text-gray-600 flex items-center gap-[6px]">
          <li className="font-medium">
            <a href="/listings" className="flex items-center gap-2 hover:text-blue-400">
              <FontAwesomeIcon icon={faListCheck} className="size-4" />
              Listings
            </a>
          </li>
          <li>-</li>
          <li className="font-medium">Reports</li>
        </ul>
      </div>

      <div className="card h-full p-0 rounded-xl border-0 overflow-hidden">
        <div className="card-header border-b border-neutral-200 bg-white py-4 px-6 flex items-center flex-wrap gap-3 justify-between">
          <div className="flex items-center flex-wrap gap-3">
            <form className="relative" onSubmit={(e) => e.preventDefault()}>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={handleSearchChange}
                className="h-10 w-[20rem] rounded-lg border border-gray-200 bg-gray-100 px-[2.625rem] pr-5 py-[0.3125rem] text-gray-900"
              />
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-[0.9rem] text-gray-600"
              />
            </form>
          </div>
          <button
            className="btn text-white flex items-center w-fit normal-case bg-blue-400 h-auto rounded-2xl gap-x-[10.5px] hover:bg-blue-500 p-[17.5px]"
            onClick={() => setIsModalOpen(true)}
          >
            <span className="font-semibold text-[14px] leading-[21px]">Add New Report</span>
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>

        <div className="bg-white p-6">
          {currentReports.length === 0 ? (
            <div className="text-center text-gray-500">
              You have no current reports.{" "}
              <button className="underline text-blue-600 hover:text-blue-700" onClick={() => setIsModalOpen(true)}>
                Create one
              </button>
              .
            </div>
          ) : (
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6"
              style={{ gridAutoRows: "minmax(150px, auto)" }}
            >
              {currentReports.map((report) => (
                <ReportCardWithStatus
                  key={report.id}
                  report={{ id: report.id, name: report.name, review_status: report.review_status }}
                  onOpen={() =>
                    navigate(`/listings/${listingId}/reports/${report.id}`, { state: { report } })
                  }
                  onReview={() => handleStartOrContinueReview(report)}
                  onRetry={() => {
                    // Optional: trigger a retry task if we have a setup for that
                    // createTask({ report_id: report.id, task_type: "Task_Type.EXTRACT_ISSUES" });
                  }}
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-2 mt-6">
            <span>
              Showing {filteredReports.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredReports.length)} of{" "}
              {filteredReports.length} entries
            </span>
            <ul className="pagination flex flex-wrap items-center gap-2 justify-center">
              <li className="page-item">
                <button
                  className={`page-link bg-neutral-200 font-semibold rounded-lg border-0 flex items-center justify-center h-8 w-8 text-base ${
                    currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
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
                    onClick={() => handlePageClick(page)}
                    aria-current={currentPage === page ? "page" : undefined}
                    aria-label={`Go to page ${page}`}
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
                  aria-label="Next page"
                >
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
              </li>
            </ul>
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-xl rounded-xl shadow-lg p-6 relative">
              <button
                onClick={handleModalClose}
                className="absolute top-2 right-4 text-3xl font-light text-gray-600 hover:text-gray-800"
                aria-label="Close modal"
              >
                &times;
              </button>
              <h6 className="text-lg font-semibold mb-4">Add New Report</h6>
              <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-4">
                <div className="col-span-12">
                  <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
                    Report Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5"
                    placeholder="Name of the report"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
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

export default Reports;
