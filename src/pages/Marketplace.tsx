import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import {
  useGetAddressesByIssueIdsMutation,
  useGetPaginatedIssuesQuery,
} from "../features/api/issuesApi";
import IssueItem from "../components/IssueItem";
import { IssueAddress } from "../types";
import { useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

const Marketplace: React.FC = () => {
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const userType = useSelector(
    (state: RootState) => state.auth.user?.user_type
  );

  const { data: vendor } = useGetVendorByVendorUserIdQuery(userId || "", {
    skip: !userId || userType !== "vendor",
  });

  const [getAddressesByIssueIds] = useGetAddressesByIssueIdsMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedType, setSelectedType] = useState("");

  const offset = (currentPage - 1) * itemsPerPage;

  const { data, error, isLoading } = useGetPaginatedIssuesQuery({
    offset,
    limit: itemsPerPage,
    search: searchQuery,
    city: selectedCity,
    state: selectedState,
    type: selectedType,
    vendor_assigned: false, // Only fetch issues assigned to vendors
  });

  const issues = data?.issues || [];
  const totalItems = data?.total_filtered?.count || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const [addresses, setAddresses] = useState<Record<number, IssueAddress>>({});
  const [addressesLoaded, setAddressesLoaded] = useState(false);

  useEffect(() => {
    if (!issues || issues.length === 0) return;

    const fetchAddresses = async () => {
      try {
        const issueIds = issues.map((issue) => issue.id);
        const addressList = await getAddressesByIssueIds(issueIds).unwrap();
        const addressMap = Object.fromEntries(
          addressList.map((a) => [a.issue_id, a])
        );
        setAddresses(addressMap);
        setAddressesLoaded(true);
      } catch (err) {
        console.error("Failed to fetch batch addresses", err);
      }
    };

    fetchAddresses();
  }, [issues]);

  const isDataReady = !isLoading && issues && addressesLoaded;

  // Extract unique city, province, and types
  const uniqueCity = [...new Set(Object.values(addresses).map((a) => a.city))];
  const uniqueState = [
    ...new Set(Object.values(addresses).map((a) => a.state)),
  ];
  const uniqueTypes = [...new Set(issues?.map((issue) => issue?.type))];

  // Adjust `itemsPerPage` dynamically based on the number of columns
  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      let columns = 1; // Default to 1 column

      if (width >= 640) columns = 2; // `sm:grid-cols-2`
      if (width >= 768) columns = 3; // `md:grid-cols-3`
      if (width >= 1536) columns = 4; // `2xl:grid-cols-4`

      const rows = 4; // Always display at least 4 rows
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

  if (error) return <p>Error loading issues</p>;

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <h1 className="text-2xl font-semibold mb-0">Marketplace</h1>
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

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap gap-3">
              {/* Address Filter */}
              <select
                className="h-10 bg-gray-100 border-r-8 border-transparent outline outline-gray-200 rounded-lg px-3 cursor-pointer"
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Cities</option>
                {uniqueCity.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>

              {/* Postal Code Filter */}
              <select
                className="h-10 bg-gray-100 border-r-8 border-transparent outline outline-gray-200 rounded-lg px-3 cursor-pointer"
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All States</option>
                {uniqueState.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>

              {/* Type Filter */}
              <select
                className="h-10 bg-gray-100 border-r-8 border-transparent outline outline-gray-200 rounded-lg px-3 cursor-pointer"
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Types</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="bg-white p-6">
          {!isDataReady ? (
            <div className="text-center text-gray-500 animate-pulse py-10">
              Loading issues...
            </div>
          ) : issues.length === 0 ? (
            <div className="text-center text-gray-500">
              You have no current issues.
            </div>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-6"
              style={{
                gridAutoRows: "minmax(150px, auto)",
              }}
            >
              {issues.map((issue) => (
                <IssueItem
                  key={issue.id}
                  issue={issue}
                  vendor={vendor}
                  userType={userType}
                  address={
                    addresses[issue.id]
                      ? addresses[issue.id]
                      : ({} as IssueAddress)
                  }
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-2 mt-6">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
              entries
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

export default Marketplace;
