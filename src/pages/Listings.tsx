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
import { useCreateListingMutation } from "../features/api/listingsApi";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

const Listings: React.FC = () => {
  const { data: listings, error, isLoading, refetch } = useGetListingsQuery();
  const [createListing] = useCreateListingMutation();
  const user = useSelector((state: RootState) => state.auth.user); // Get user object

  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12); // Default to 12 items

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    image_url: "",
  });
  const [selectedFileName, setSelectedFileName] = useState("");

  // Filtered listings based on search query
  const filteredListings =
    listings?.filter((listing) =>
      searchQuery.trim() === ""
        ? listing?.user_id === user.id // Return all client listings if searchQuery is empty
        : listing?.address?.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? [];

  // Pagination calculations
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentListings = filteredListings.slice(startIndex, endIndex);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createListing({ user_id: user.id, ...formData }).unwrap();
      refetch();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to create listing:", err);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setFormData({
      address: "",
      city: "",
      state: "",
      country: "",
      postal_code: "",
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
        <h1 className="text-2xl font-semibold mb-0">Listings</h1>
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
          <button
            className="btn text-white flex items-center w-fit normal-case bg-blue-400 h-auto rounded-2xl gap-x-[10.5px] hover:bg-blue-500 p-[17.5px]"
            onClick={() => setIsModalOpen(true)}
          >
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

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-xl rounded-xl shadow-lg p-6 relative">
              <button
                onClick={() => handleModalClose()}
                className="absolute top-2 right-4 text-3xl font-light text-gray-600 hover:text-gray-800"
              >
                &times;
              </button>
              <h6 className="text-lg font-semibold mb-4">Add New Listing</h6>
              <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-4">
                <div className="col-span-12">
                  <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5"
                    placeholder="123 Main St"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-span-6">
                  <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-span-6">
                  <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5"
                    placeholder="State"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-span-6">
                  <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5"
                    placeholder="Country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-span-6">
                  <label className="mb-2 inline-block text-sm leading-5 font-semibold text-gray-600">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5"
                    placeholder="Postal Code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    required
                  />
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
  );
};

export default Listings;
