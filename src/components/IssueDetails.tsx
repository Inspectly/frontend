import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  IssueAssessment,
  IssueOffer,
  IssueStatus,
  IssueType,
  Listing,
  statusMapping,
  statusOptions,
} from "../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";
import {
  faChevronUp,
  faChevronDown,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import Attachments from "./Attachments";
import Comments from "./Comments";
import Dropdown from "./Dropdown";
import MapComponent from "./MapComponent";
import VendorName from "./VendorName";
import { useNavigate } from "react-router-dom";
import { useUpdateIssueMutation } from "../features/api/issuesApi";
import {
  useCreateOfferMutation,
  useGetOffersByIssueIdQuery,
  useUpdateOfferMutation,
} from "../features/api/issueOffersApi";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { getCoordinatesFromAddress, Coordinates } from "../utils/mapUtils";
import {
  useGetAssessmentsByIssueIdQuery,
  useGetAssessmentsByUsersInteractionIdQuery,
  useUpdateAssessmentMutation,
} from "../features/api/issueAssessmentsApi";
import CalendarSelector from "./CalendarSelector";
import AssessmentReview from "./AssessmentReview";
import {
  useGetVendorByVendorUserIdQuery,
  useGetVendorsQuery,
} from "../features/api/vendorsApi";
import { useGetReportByIdQuery } from "../features/api/reportsApi";
import OffersTabClient from "./OffersTabClient";
import OffersTabVendor from "./OffersTabVendor";

export interface IssueDetailsProps {
  issue: IssueType;
  listing?: Listing;
}

// Extract tab from URL (default to "details")
const getTabFromURL = () => {
  const params = new URLSearchParams(location.search);
  return params.get("tab") || "details"; // Default tab
};

const IssueDetails: React.FC<IssueDetailsProps> = ({ issue, listing }) => {
  const navigate = useNavigate();
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const userType = useSelector(
    (state: RootState) => state.auth.user?.user_type
  );

  const {
    data: offers = [],
    isLoading: offersLoading,
    error: offersError,
    refetch: refetchOffers,
  } = useGetOffersByIssueIdQuery(issue?.id, {
    skip: !issue?.id,
  });
  const { data: allVendors = [] } = useGetVendorsQuery();

  const { data: report } = useGetReportByIdQuery(issue.report_id, {
    skip: !issue.report_id,
  });

  const [updateIssue] = useUpdateIssueMutation();
  const [createOffer] = useCreateOfferMutation();
  const [updateOffer] = useUpdateOfferMutation();

  const [updateAssessmentStatus] = useUpdateAssessmentMutation();

  const isVendor = userType === "vendor";

  const { data: currentVendor } = useGetVendorByVendorUserIdQuery(userId, {
    skip: !isVendor || !userId,
  });

  const getUsersInteractionId = (vendorId: number) => {
    if (!report?.user_id || !vendorId || !issue?.id) return "";
    return `${report.user_id}_${vendorId}_${issue.id}`;
  };

  const usersInteractionId = currentVendor
    ? getUsersInteractionId(currentVendor.id)
    : "";

  const assessmentsByInteraction = useGetAssessmentsByUsersInteractionIdQuery(
    usersInteractionId,
    { skip: !usersInteractionId }
  );
  const assessmentsByIssue = useGetAssessmentsByIssueIdQuery(issue.id, {
    skip: !issue.id,
  });

  const assessmentsData = isVendor
    ? assessmentsByInteraction
    : assessmentsByIssue;

  const {
    data: assessments = [],
    isLoading: assessmentsLoading,
    refetch: refetchAssessments,
    isFetching: assessmentsFetching,
  } = assessmentsData;

  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [imageOpen, setImageOpen] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [descriptionOpen, setDescriptionOpen] = useState(true);
  const [locationOpen, setLocationOpen] = useState(true);
  const [peopleOpen, setPeopleOpen] = useState(true);
  const [datesOpen, setDatesOpen] = useState(true);

  const [activeTab, setActiveTab] = useState(getTabFromURL());
  const [locationError, setLocationError] = useState(false);

  const [progressDropdownOpen, setProgressDropdownOpen] = useState<
    number | null
  >(null);

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [counterTarget, setCounterTarget] = useState<IssueOffer | null>(null);
  const [offerAmount, setOfferAmount] = useState("");
  const [editingOffer, setEditingOffer] = useState<IssueOffer | null>(null);
  const [offerError, setOfferError] = useState("");
  const [isOfferSubmitting, setIsOfferSubmitting] = useState(false);

  const [commentVendor, setCommentVendor] = useState("");
  const [commentClient, setCommentClient] = useState("");
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const progressDropdownButtonRef = useRef<HTMLButtonElement | null>(null);

  const uniqueVendors = new Set(offers.map((offer) => offer.vendor_id)).size;

  const handleOpenOfferModal = (counterOffer?: IssueOffer) => {
    setCounterTarget(counterOffer || null);
    setIsOfferModalOpen(true);
  };

  const handleEditOfferModal = (offer?: IssueOffer) => {
    console.log(offer);
    setEditingOffer(offer || null);
    setIsOfferModalOpen(true);
  };

  const toggleSection = (
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setter((prev) => !prev);
  };

  const handleProgressChange = (id: number, newProgress: string) => {
    updateIssue({
      ...issue,
      status: statusMapping[issue.status as IssueStatus],
      progress: newProgress,
    });

    setTimeout(() => {
      setProgressDropdownOpen(null); // Delay closing to let the event register
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString + "Z");

    return date.toLocaleString("en-US", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Auto-detects user’s time zone
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`?tab=${tab}`); // Update URL
  };

  const handleOfferSubmit = async () => {
    const offerValue = parseFloat(offerAmount);

    if (isNaN(offerValue)) {
      setOfferError("Please enter a valid offer amount.");
      return;
    }

    if (offerValue <= 0) {
      setOfferError("Offer amount must be greater than zero.");
      return;
    }

    if (!userId) {
      setOfferError("User ID is missing. Please log in.");
      return;
    }

    setIsOfferSubmitting(true);

    if (counterTarget) {
      await updateOffer({
        id: counterTarget.id,
        issue_id: counterTarget.issue_id,
        vendor_id: counterTarget.vendor_id,
        price: counterTarget.price,
        status: "rejected",
        comment_vendor: counterTarget.comment_vendor || "",
        comment_client: counterTarget.comment_client || "",
      }).unwrap();
    }

    try {
      if (editingOffer) {
        // EDIT mode — update existing offer
        await updateOffer({
          id: editingOffer.id,
          issue_id: editingOffer.issue_id,
          vendor_id: editingOffer.vendor_id,
          price: offerAmount,
          status: "received",
          comment_vendor: commentVendor || "",
          comment_client: editingOffer.comment_client || "",
        }).unwrap();
      } else {
        await createOffer({
          issue_id: issue.id,
          vendor_id: counterTarget?.vendor_id || userId,
          price: offerValue,
          status: "received",
          comment_vendor: commentVendor,
          comment_client: counterTarget
            ? "Client countered the offer"
            : commentClient,
        }).unwrap();
      }

      refetchOffers();

      // Reset state
      setCounterTarget(null);
      setOfferAmount("");
      setCommentVendor("");
      // setCommentClient("");
      setOfferError("");
      setEditingOffer(null);
      setIsOfferModalOpen(false);
    } catch (err) {
      console.error("Failed to submit offer:", err);
      setOfferError("Failed to submit offer. Please try again.");
    } finally {
      setIsOfferSubmitting(false);
    }
  };

  const handleAccept = async (
    accepted: IssueAssessment,
    rejected: IssueAssessment[]
  ) => {
    try {
      await Promise.all([
        updateAssessmentStatus({
          ...accepted,
          interaction_id: accepted.users_interaction_id,
          status: "accepted",
        }),
        ...rejected
          .map((a) => ({
            ...a,
            interaction_id: accepted.users_interaction_id,
            status: "rejected",
          }))
          .map(updateAssessmentStatus),
      ]);

      refetchAssessments();
    } catch (err) {
      console.error("Failed to update assessment statuses", err);
    }
  };

  const handlePostProposal = async () => {
    setIsSubmittingProposal(true);
    try {
      await refetchAssessments().unwrap();
    } catch (err) {
      console.error("Failed to refresh proposals after submission", err);
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  const handleRejectAll = async (vendorId: number) => {
    const toReject = assessments.filter(
      (a) => Number(a.users_interaction_id.split("_")[1]) === vendorId
    );
    setIsSubmittingProposal(true);

    try {
      await Promise.all(
        toReject.map((a) =>
          updateAssessmentStatus({
            ...a,
            interaction_id: a.users_interaction_id,
            status: "rejected",
          })
        )
      );
      await refetchAssessments();
    } catch (err) {
      console.error("Failed to reject all", err);
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  const vendorIdToName = useMemo(() => {
    const map: Record<number, string> = {};
    allVendors.forEach((vendor) => {
      map[vendor.id] = vendor.name;
    });
    return map;
  }, [allVendors]);

  useEffect(() => {
    if (!listing) return;

    const address = `${listing?.address}, ${listing?.city}, ${listing?.state}, ${listing?.country}`;

    getCoordinatesFromAddress(address)
      .then((coords) => {
        setCoords(coords);
        setLocationError(false);
      })
      .catch((error) => {
        console.error("Location fetch failed:", error);
        setLocationError(true);
      });
  }, [listing]);

  // Sync tab state when URL changes
  useEffect(() => {
    setActiveTab(getTabFromURL());
  }, [location.search]);

  useEffect(() => {
    if (editingOffer) {
      setOfferAmount(editingOffer.price.toString());
      setCommentVendor(editingOffer.comment_vendor || "");
    } else {
      setOfferAmount("");
      setCommentVendor("");
    }
  }, [editingOffer]);

  return (
    <div
      ref={cardRef}
      className="relative rounded-lg bg-white border-0 overflow-hidden flex flex-col"
    >
      <div
        className={`items-center px-6 py-4 active border-b border-neutral-200 ${
          issue.active ? "" : "bg-red-100"
        }`}
      >
        <div className="flex flex-row items-center justify-between">
          <h2 className="text-2xl font-medium mb-0">
            {issue.id + " " + issue.summary || "No Title Found"}
          </h2>
          <button
            onClick={() =>
              updateIssue({
                ...issue,
                status: statusMapping[issue.status as IssueStatus],
                isVisible: !issue.active,
              })
            }
            className="w-8 h-8 bg-blue-100 text-primary-600 rounded-full inline-flex items-center justify-center"
          >
            <FontAwesomeIcon
              icon={issue.active ? faEye : faEyeSlash}
              className={`text-blue-600 size-3.5`}
            />
          </button>
        </div>
      </div>

      <div className="mb-4 border-b border-gray-200 pt-4 mx-6">
        <ul
          className="flex flex-wrap -mb-px text-sm font-medium text-center"
          id="default-tab"
          data-tabs-toggle="#default-tab-content"
          role="tablist"
        >
          <li role="presentation">
            <button
              className={`inline-block px-4 py-2.5 font-semibold border-b-2 rounded-t-lg ${
                activeTab === "details"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 hover:text-gray-600 border-gray-100 hover:border-gray-300"
              }`}
              type="button"
              role="tab"
              aria-controls="default-details"
              aria-selected={activeTab === "details"}
              onClick={() => handleTabChange("details")}
            >
              Details
            </button>
          </li>
          <li role="presentation">
            <button
              className={`inline-block px-4 py-2.5 relative font-semibold border-b-2 rounded-t-lg ${
                activeTab === "offers"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 hover:text-gray-600 border-gray-100 hover:border-gray-300"
              }`}
              type="button"
              role="tab"
              aria-controls="default-offers"
              aria-selected={activeTab === "offers"}
              onClick={() => handleTabChange("offers")}
            >
              Offers
              <span className="absolute -top-1 right-1 text-xl text-red-500 font-semibold">
                •
              </span>
            </button>
          </li>
          <li role="presentation">
            <button
              className={`inline-block px-4 py-2.5 font-semibold border-b-2 rounded-t-lg ${
                activeTab === "assessments"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 hover:text-gray-600 border-gray-100 hover:border-gray-300"
              }`}
              type="button"
              role="tab"
              aria-controls="default-assessments"
              aria-selected={activeTab === "assessments"}
              onClick={() => handleTabChange("assessments")}
            >
              Assessments
            </button>
          </li>
        </ul>
      </div>

      <div className="h-[calc(100vh-320px)] overflow-y-auto px-6 pb-6 pt-2">
        {activeTab === "details" && (
          <div
            id="default-offers"
            role="tabpanel"
            className="flex flex-col lg:flex-row gap-6"
          >
            {/* Left Section */}
            <div className="w-full lg:w-2/3 space-y-8">
              {/* Issue Image */}
              <div>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleSection(setImageOpen)}
                >
                  <button className="rounded bg-neutral-200 px-2 mr-2">
                    {imageOpen ? (
                      <FontAwesomeIcon
                        icon={faChevronUp}
                        className="size-2.5 align-middle"
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className="size-2.5 align-middle"
                      />
                    )}
                  </button>
                  <h2 className="text-lg font-semibold">Image</h2>
                </div>
                {imageOpen && (
                  <div className="mt-4 w-full">
                    <img
                      src={issue.image_url || "/images/no-image.webp"}
                      alt="Issue"
                      className="rounded-lg w-full h-[300px] object-cover cursor-pointer"
                      onClick={() => setSelectedImage(issue.image_url)}
                    />
                  </div>
                )}
              </div>

              {selectedImage && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
                  <div className="relative bg-white rounded-lg shadow-lg max-w-3xl">
                    <button
                      className="absolute top-2 right-2 text-gray-800 py-1 px-2 rounded-full"
                      onClick={() => setSelectedImage(null)}
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-xl" />
                    </button>
                    <img
                      src={selectedImage}
                      alt="Full View"
                      className="max-w-full max-h-[90vh] rounded"
                    />
                  </div>
                </div>
              )}

              {/* Details Section */}
              <div>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleSection(setDetailsOpen)}
                >
                  <button className="rounded bg-neutral-200 px-2 mr-2">
                    {detailsOpen ? (
                      <FontAwesomeIcon
                        icon={faChevronUp}
                        className="size-2.5 align-middle"
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className="size-2.5 align-middle"
                      />
                    )}
                  </button>
                  <h2 className="text-lg font-semibold">Details</h2>
                </div>
                {detailsOpen && (
                  <div className="mt-4">
                    <div className="grid grid-cols-2 gap-y-4 gap-x-24">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Type
                        </h4>
                        <p className="text-base font-semibold text-gray-700">
                          {issue.type}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Progress
                        </h4>
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
                          }  ${
                            userType === "vendor" ? "pointer-events-none" : ""
                          }`}
                          ref={progressDropdownButtonRef}
                          onClick={() =>
                            setProgressDropdownOpen((prev) =>
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
                        {Number(progressDropdownOpen) === issue.id && (
                          <Dropdown
                            buttonRef={progressDropdownButtonRef}
                            onClose={() => setProgressDropdownOpen(null)}
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
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Severity
                        </h4>
                        <p
                          className={`text-base font-semibold ${
                            issue.severity === "High"
                              ? "text-red-600"
                              : issue.severity === "Medium"
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          {issue.severity}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Cost
                        </h4>
                        <p className="text-base font-semibold text-gray-700">
                          {issue.cost || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description Section */}
              <div>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleSection(setDescriptionOpen)}
                >
                  <button className="rounded bg-neutral-200 px-2 mr-2">
                    {descriptionOpen ? (
                      <FontAwesomeIcon
                        icon={faChevronUp}
                        className="size-2.5 align-middle"
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className="size-2.5 align-middle"
                      />
                    )}
                  </button>
                  <h2 className="text-lg font-semibold">Description</h2>
                </div>
                {descriptionOpen && (
                  <p className="mt-2 text-gray-700">
                    {issue.description || "No description available."}
                  </p>
                )}
              </div>

              {/* Location Section */}
              {userType !== "vendor" && (
                <div>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => toggleSection(setLocationOpen)}
                  >
                    <button className="rounded bg-neutral-200 px-2 mr-2">
                      {locationOpen ? (
                        <FontAwesomeIcon
                          icon={faChevronUp}
                          className="size-2.5 align-middle"
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faChevronDown}
                          className="size-2.5 align-middle"
                        />
                      )}
                    </button>
                    <h2 className="text-lg font-semibold">Listing Location</h2>
                  </div>

                  {locationOpen && (
                    <div className="mt-2">
                      {/* Map Preview */}
                      {locationError ? (
                        <div className="flex items-center justify-center h-64 w-full bg-gray-200 text-red-600 font-medium text-center p-4 rounded">
                          <p>
                            Unable to load map. Location not found for this
                            listing.
                          </p>
                        </div>
                      ) : coords ? (
                        <MapComponent
                          key="map-visible"
                          latitude={coords.latitude}
                          longitude={coords.longitude}
                          listingName={listing?.address || ""}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-64 w-full bg-gray-200 animate-pulse">
                          <p className="text-gray-500">Loading map...</p>
                        </div>
                      )}

                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-500">
                          Location
                        </h4>
                        <p className="text-base font-semibold text-gray-700">
                          {listing?.address}, {listing?.city}, {listing?.state},{" "}
                          {listing?.postal_code}, {listing?.country}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Attachment Section */}
              <div>
                <Attachments issueId={issue.id} userType={userType} />
              </div>

              {/* Comments Section */}
              <div>
                {userType !== "vendor" && <Comments issueId={issue.id} />}
              </div>
            </div>

            {/* Right Section */}
            <div className="w-full lg:w-1/3 space-y-6">
              {/* People Section */}
              <div className="p-4 bg-white rounded-lg shadow">
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleSection(setPeopleOpen)}
                >
                  <button className="rounded bg-neutral-200 px-2 mr-2">
                    {peopleOpen ? (
                      <FontAwesomeIcon
                        icon={faChevronUp}
                        className="size-2.5 align-middle"
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className="size-2.5 align-middle"
                      />
                    )}
                  </button>
                  <h2 className="text-lg font-semibold">People</h2>
                </div>
                {peopleOpen && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-500">
                          Vendor
                        </h4>
                      </div>
                      <p className="text-base font-semibold text-gray-700">
                        {issue.vendor_id ? (
                          <VendorName
                            vendorId={issue.vendor_id}
                            isVendorId={false}
                            showRating
                          />
                        ) : (
                          "No vendor assigned"
                        )}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Realtor
                      </h4>
                      <p className="text-base font-semibold text-gray-700">
                        No Realtor assigned
                        {/* {issue.realtor_id ? (
                           {listing?.realtor_id}
                        ) : (
                          "No Realtor assigned"
                        )} */}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Dates Section */}
              <div className="p-4 bg-white rounded-lg shadow">
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleSection(setDatesOpen)}
                >
                  <button className="rounded bg-neutral-200 px-2 mr-2">
                    {datesOpen ? (
                      <FontAwesomeIcon
                        icon={faChevronUp}
                        className="size-2.5 align-middle"
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className="size-2.5 align-middle"
                      />
                    )}
                  </button>
                  <h2 className="text-lg font-semibold">Dates</h2>
                </div>
                {datesOpen && (
                  <div className="mt-4 space-y-3">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-gray-500">
                        Date Created
                      </h4>
                      <p className="text-base font-semibold text-gray-700">
                        {formatDate(issue.created_at)}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-gray-500">
                        Date Updated
                      </h4>
                      <p className="text-base font-semibold text-gray-700">
                        {formatDate(issue.updated_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === "offers" && (
          <div id="default-offers" role="tabpanel" className="w-full">
            {offersLoading ? (
              <p>Loading offers...</p>
            ) : offersError ? (
              <p>Error loading offers</p>
            ) : (
              <>
                {userType === "client" && (
                  <OffersTabClient
                    offers={offers}
                    uniqueVendors={uniqueVendors}
                    handleOpenOfferModal={handleOpenOfferModal}
                    onOpenOfferModal={() => setIsOfferModalOpen(true)}
                    onOfferAccepted={(acceptedOffer) => {
                      updateIssue({
                        ...issue,
                        status: statusMapping[issue.status as IssueStatus],
                        vendor_id: acceptedOffer.vendor_id,
                      });
                    }}
                  />
                )}

                {userType === "vendor" && (
                  <OffersTabVendor
                    offers={offers}
                    vendorId={currentVendor?.id}
                    onOpenOfferModal={handleEditOfferModal}
                    onOfferAccepted={(acceptedOffer) => {
                      updateIssue({
                        ...issue,
                        status: statusMapping[issue.status as IssueStatus],
                        vendor_id: acceptedOffer.vendor_id,
                      });
                    }}
                  />
                )}
              </>
            )}
          </div>
        )}
        {activeTab === "assessments" && (
          <div>
            {userType === "vendor" && assessments.length === 0 ? (
              <CalendarSelector
                issueId={issue.id}
                onSubmitted={() => refetchAssessments()}
                usersInteractionId={usersInteractionId}
                assessmentsLoading={assessmentsLoading || assessmentsFetching}
                existingAssessments={assessments.map((a) => ({
                  ...a,
                  title: "Available",
                  start: new Date(a.start_time),
                  end: new Date(a.end_time),
                  isNew: false,
                }))}
              />
            ) : assessments.length === 0 &&
              !assessmentsLoading &&
              !assessmentsFetching ? (
              <p className="text-gray-600">No assessment requested yet.</p>
            ) : (
              <AssessmentReview
                assessments={assessments}
                onAccept={handleAccept}
                onRejectAll={handleRejectAll}
                issueId={issue.id}
                userId={userId}
                userType={userType}
                vendorIdToName={vendorIdToName}
                usersInteractionId={usersInteractionId}
                getUsersInteractionId={getUsersInteractionId}
                onlyShowVendorId={currentVendor?.id}
                isSubmittingProposal={isSubmittingProposal}
                postProposal={handlePostProposal}
                assessmentsLoading={assessmentsLoading || assessmentsFetching}
              />
            )}
          </div>
        )}
      </div>

      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Place Your Offer</h2>

            <input
              type="number"
              value={offerAmount}
              disabled={isOfferSubmitting}
              onChange={(e) => {
                setOfferAmount(e.target.value);
                setOfferError("");
              }}
              min="1"
              placeholder={`Enter your offer amount`}
              className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
            />

            {userType === "vendor" && (
              <textarea
                value={commentVendor}
                disabled={isOfferSubmitting}
                onChange={(e) => setCommentVendor(e.target.value)}
                placeholder="Comment for client (optional)"
                className="w-full border border-gray-300 rounded px-3 py-2 mb-1 text-sm"
                rows={2}
              />
            )}

            {userType === "client" && (
              <textarea
                value={commentClient}
                onChange={(e) => setCommentClient(e.target.value)}
                placeholder="Private comment (optional)"
                className="w-full border border-gray-300 rounded px-3 py-2 mb-2 text-sm"
                rows={2}
              />
            )}

            {offerError && (
              <p className="text-red-600 text-sm mb-2">{offerError}</p>
            )}

            {counterTarget ? (
              <p className="text-sm text-gray-600 mb-3">
                You are placing a <strong>counter</strong> to the original offer
                of <strong>${counterTarget.price}</strong>
              </p>
            ) : (
              <p className="text-sm text-gray-600 mb-2">
                You are about to place an offer for:{" "}
                <strong>
                  $
                  {new Intl.NumberFormat("en-US").format(
                    Number(offerAmount) || 0
                  )}
                </strong>
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              By selecting <strong>Confirm offer</strong>, you are committing to
              this issue.
            </p>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setIsOfferModalOpen(false)}
                className="text-sm px-4 py-2 rounded border border-gray-400"
                disabled={isOfferSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleOfferSubmit}
                className="text-sm px-4 py-2 rounded bg-blue-600 text-white"
                disabled={isOfferSubmitting}
              >
                {isOfferSubmitting ? <>Sending...</> : "Confirm Offer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueDetails;
