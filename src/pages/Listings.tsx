import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faMagnifyingGlass,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import ImageComponent from "../components/ImageComponent";
import { useGetListingsQuery } from "../features/api/listingsApi";

const Listings: React.FC = () => {
  const { data: listings, error, isLoading } = useGetListingsQuery();

  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12); // Default to 12 items

  // Filtered listings based on search query
  const filteredListings =
    listings?.filter((listing) =>
      searchQuery.trim() === ""
        ? true // Return all listings if searchQuery is empty
        : listing?.address?.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? [];

  // Pagination calculations
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentListings = filteredListings.slice(startIndex, endIndex);

  // Adjust `itemsPerPage` dynamically based on the number of columns
  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      let columns = 1; // Default to 1 column

      if (width >= 640) columns = 2; // `sm:grid-cols-2`
      if (width >= 768) columns = 3; // `md:grid-cols-3`
      if (width >= 1536) columns = 4; // `2xl:grid-cols-4`

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
  if (error) return <p>Error loading listings</p>;

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <h1 className="text-3xl font-semibold mb-0">Listings</h1>
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
              Add New Listing
            </span>
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>
        <div className="bg-white p-6">
          {currentListings.length === 0 ? (
            <div className="text-center text-gray-500">
              You have no current listings.
            </div>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-6"
              style={{
                gridAutoRows: "minmax(150px, auto)",
              }}
            >
              {currentListings.map((listing) => (
                <div
                  onClick={() => navigate(`/listings/${listing.id}`)}
                  key={listing.id}
                  className="relative hover:shadow-lg cursor-pointer border border-neutral-200 rounded-2xl overflow-hidden"
                >
                  <div className="h-[266px] overflow-hidden relative">
                    <ImageComponent
                      src={listing.image_url}
                      fallback="/images/property_card_holder.jpg"
                      className="hover-scale-img__img w-full h-full object-cover"
                    />
                    <h6 className="absolute bottom-0 left-0 w-full text-white text-center py-2 bg-gradient-to-t from-black/40 via-black/30 to-transparent">
                      {listing.address}
                    </h6>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-2 mt-6">
            <span>
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, filteredListings.length)} of{" "}
              {filteredListings.length} entries
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

export default Listings;
