import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faMagnifyingGlass,
  faPlus,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { useListings } from "./ListingsContext";

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VendorModal: React.FC<VendorModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12); // Default to 12 items
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);

  const vendors = [
    {
      id: "1",
      image: "/images/fake_listing.png",
      title: "test",
    },
    {
      id: "2",
      image: "/images/fake_listing.png",
      title: "test",
    },
    {
      id: "3",
      image: "/images/fake_listing.png",
      title: "test",
    },
    {
      id: "4",
      image: "/images/fake_listing.png",
      title: "test",
    },
    {
      id: "5",
      image: "/images/fake_listing.png",
      title: "test",
    },
  ];

  // Filtered vendors based on search query
  const filteredVendors = vendors.filter((vendor) =>
    vendor.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVendors = filteredVendors.slice(startIndex, endIndex);

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

    setSelectedVendor(null);
    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);

    return () => {
      window.removeEventListener("resize", updateItemsPerPage);
    };
  }, []);

  // Disable scrolling on the main page when the modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"; // Disable page scrolling
    } else {
      document.body.style.overflow = ""; // Enable page scrolling
    }

    return () => {
      document.body.style.overflow = ""; // Ensure cleanup on unmount
    };
  }, [isOpen]);

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

  const handleVendorSelect = (vendorId: string) => {
    setSelectedVendor(vendorId);
  };

  if (!isOpen) return null; // Don't render if modal is closed

  return (
    <>
      <div className="bg-gray-800 bg-opacity-80 fixed inset-0 z-40"></div>
      <div
        className="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full flex"
        aria-modal="true"
        role="dialog"
      >
        <div className="relative p-4 w-full max-w-4xl max-h-full">
          <div className="relative bg-white rounded-lg shadow">
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
              <h3 className="text-xl font-semibold text-gray-900">
                Add New Vendor
              </h3>
              <button
                type="button"
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
                data-modal-hide="default-modal"
                onClick={onClose}
              >
                <FontAwesomeIcon icon={faTimes} />
                <span className="sr-only">Close modal</span>
              </button>
            </div>

            <div className="p-4 md:p-6">
              <div className="card h-full p-0 rounded-xl border-0 overflow-hidden">
                <div className="card-header bg-white flex items-center flex-wrap gap-3 justify-between">
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
                </div>
                <div className="bg-white pt-6">
                  {currentVendors.length === 0 ? (
                    <div className="text-center text-gray-500">
                      You have no current vendors.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4 gap-6">
                      {currentVendors.map((vendor) => (
                        <div
                          key={vendor.id}
                          className={` rounded-2xl cursor-pointer ${
                            selectedVendor === vendor.id
                              ? "border-2 border-blue-500"
                              : "border-0"
                          }`}
                          onClick={() => handleVendorSelect(vendor.id)}
                        >
                          <div className="relative border border-neutral-200 rounded-[0.9rem] overflow-hidden">
                            <img
                              src="/images/user-grid-bg1.png"
                              alt=""
                              className="w-full object-fit-cover"
                            />

                            <div className="absolute top-0 end-0 me-4 mt-4">
                              <input
                                type="radio"
                                name="vendor"
                                className="cursor-pointer w-5 h-5"
                                checked={selectedVendor === vendor.id}
                                onChange={() => handleVendorSelect(vendor.id)}
                              />
                            </div>

                            <div className="pe-6 pb-4 ps-6 text-center mt--50">
                              <img
                                src="/images/placeholder.jpg"
                                alt=""
                                className="bg-gray-600 border br-white border-width-2-px w-[100px] h-[100px] ms-auto me-auto -mt-[50px] rounded-full object-fit-cover"
                              />
                              <h6 className="text-lg font-semibold mb-0 mt-1.5">
                                Jacob Jones
                              </h6>
                              <span>ifrandom@gmail.com</span>

                              <div className="center-border mt-4 relative bg-gradient-to-r from-red-500/10 to-red-50/25 rounded-lg p-3 flex items-center gap-4 before:absolute before:w-px before:h-full before:z-[1] before:bg-neutral-200 before:start-1/2">
                                <div className="text-center w-1/2">
                                  <h6 className="text-base mb-0">Design</h6>
                                  <span className="text-sm mb-0">
                                    Department
                                  </span>
                                </div>
                                <div className="text-center w-1/2">
                                  <h6 className="text-base mb-0">
                                    UI UX Designer
                                  </h6>
                                  <span className="text-sm mb-0">
                                    Designation
                                  </span>
                                </div>
                              </div>
                              <a
                                href="view-profile.html"
                                className="bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white text-primary-600 bg-hover-primary-600 hover-text-white p-2.5 text-sm btn-sm px-3 py-3 rounded-lg flex items-center justify-center mt-4 font-medium gap-2 w-full"
                              >
                                View Profile
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between flex-wrap gap-2 mt-6">
                    <span>
                      Showing {startIndex + 1} to{" "}
                      {Math.min(endIndex, filteredVendors.length)} of{" "}
                      {filteredVendors.length} entries
                    </span>
                    <ul className="pagination flex flex-wrap items-center gap-2 justify-center">
                      <li className="page-item">
                        <button
                          className={`page-link bg-neutral-200 font-semibold rounded-lg border-0 flex items-center justify-center h-8 w-8 text-base ${
                            currentPage === 1
                              ? "opacity-50 cursor-not-allowed"
                              : ""
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

            <div className="flex items-center gap-4 p-4 md:p-5 border-t border-gray-200 rounded-b">
              <button
                type="button"
                data-modal-hide="default-modal"
                className="border border-red-500 hover:border-red-600 text-red-400 hover:text-red-500 text-base px-[50px] py-[11px] rounded-lg"
                data-bs-dismiss="modal"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className={`btn  text-white border border-primary-600 text-base px-7 py-3 rounded-lg
                                ${
                                  selectedVendor
                                    ? "bg-blue-400 hover:bg-blue-500"
                                    : "bg-gray-300 cursor-not-allowed"
                                }`}
                disabled={!selectedVendor}
              >
                Add Vendor
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VendorModal;
