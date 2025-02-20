import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faListCheck,
  faMagnifyingGlass,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router-dom";
import { useGetReportsQuery } from "../features/apiSlice";

const Reports: React.FC = () => {
  const { data: reports, error, isLoading } = useGetReportsQuery();

  const navigate = useNavigate();

  const { listingId } = useParams<{
    listingId: string;
  }>();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12); // Default to 12 items

  const listingReports =
    reports?.filter((report) => report.listing_id.toString() === listingId) ||
    [];

  // Filtered reports based on search query
  const filteredReports =
    listingReports?.filter((report) =>
      searchQuery.trim() === ""
        ? true // Return all reports if searchQuery is empty
        : report?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? [];

  // Pagination calculations
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReports = filteredReports.slice(startIndex, endIndex);

  // Adjust `itemsPerPage` dynamically based on the number of columns
  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      let columns = 2; // Default to 1 column

      if (width >= 640) columns = 3; // `sm:grid-cols-3`
      if (width >= 768) columns = 4; // `md:grid-cols-4`
      if (width >= 1280) columns = 5; // `xl:grid-cols-5`
      if (width >= 1536) columns = 6; // `2xl:grid-cols-6`

      const rows = 3; // Always display at least 3 rows
      setItemsPerPage(columns * rows);
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);

    return () => {
      window.removeEventListener("resize", updateItemsPerPage);
    };
  }, []);

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

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading reports</p>;

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2 mb-6 justify-between">
        <h1 className="text-3xl font-semibold mb-0">Reports</h1>
        <ul className="text-lg flex items-center gap-[6px]">
          <li className="font-medium">
            <a
              href="/listings"
              className="flex items-center gap-2 hover:text-blue-400"
            >
              <FontAwesomeIcon icon={faListCheck} className="size-5" />
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
            <form className="relative">
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
          <button className="btn text-white flex items-center w-fit normal-case bg-blue-400 h-auto rounded-2xl gap-x-[10.5px] hover:bg-blue-500 p-[17.5px]">
            <span className="font-semibold text-[14px] leading-[21px]">
              Add New Report
            </span>
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>
        <div className="bg-white p-6">
          {currentReports.length === 0 ? (
            <div className="text-center text-gray-500">
              You have no current reports.
            </div>
          ) : (
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6"
              style={{
                gridAutoRows: "minmax(150px, auto)",
              }}
            >
              {currentReports.map((report) => (
                <div
                  onClick={() =>
                    navigate(`/listings/${listingId}/reports/${report.id}`, {
                      state: { report }, // Pass the report object in `state`
                    })
                  }
                  key={report.id}
                  className="relative hover:shadow-lg cursor-pointer border border-neutral-200 rounded-2xl"
                >
                  <div className="relative">
                    <div className="flex items-center h-[110px] justify-center bg-gray-100 w-full">
                      <img
                        src="/images/inspection.png"
                        className="h-24 w-24 p-4"
                      />
                    </div>
                    <h6 className="w-full text-center text-sm py-2 px-3">
                      {report.name}
                    </h6>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-2 mt-6">
            <span>
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, filteredReports.length)} of{" "}
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
                      onClick={() => handlePageClick(page)}
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
        </div>
      </div>
    </div>
  );
};

export default Reports;
