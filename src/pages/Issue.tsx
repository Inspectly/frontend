import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faChevronDown,
  faChevronUp,
  faMagnifyingGlass,
  faPlus,
  faTimes,
  faChalkboard,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router-dom";
import { faTrashCan } from "@fortawesome/free-regular-svg-icons";
import { Attachment } from "../types";
import { useIssues } from "../components/IssuesContext";
import { useListings } from "../components/ListingsContext";
import { auth } from "../../firebase";
import Dropdown from "../components/Dropdown";
import AddToCart from "../components/AddToCart";

const Issue: React.FC = () => {
  const navigate = useNavigate();
  const { listingId, issueId } = useParams<{
    listingId: string;
    issueId: string;
  }>();
  const { issues, updateIssue } = useIssues();
  const listings = useListings();

  // Find the specific listing by ID
  const listing = listings.find((listing) => listing.id === listingId);

  // Find the specific issue by ID
  const issue = issues.find(
    (issue) => issue.id === issueId && issue.listingId === listingId
  );

  const [imageOpen, setImageOpen] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [descriptionOpen, setDescriptionOpen] = useState(true);
  const [attachmentsOpen, setAttachmentsOpen] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(true);
  const [peopleOpen, setPeopleOpen] = useState(true);
  const [datesOpen, setDatesOpen] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");

  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const [visibleImages, setVisibleImages] = useState<Attachment[]>(
    issue?.attachments || []
  );
  const [imageSize, setImageSize] = useState(150);
  const [maxVisible, setMaxVisible] = useState(issue?.attachments.length || 0);
  const [startIndex, setStartIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [newComment, setNewComment] = useState("");

  const cardRef = useRef<HTMLDivElement | null>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentContainerRef = useRef<HTMLDivElement | null>(null);

  const toggleSection = (
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setter((prev) => !prev);
  };

  // Filtered Issues based on search query
  const filteredIssues = issues.filter((issue) =>
    issue.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleProgressChange = (id: string, newProgress: string) => {
    updateIssue(id, { progress: newProgress });

    setTimeout(() => {
      setDropdownOpen(null); // Delay closing to let the event register
    });
  };

  const handleOpenDropdown = (id: string) => {
    setDropdownOpen((prev) => (prev === id ? null : id)); // Toggle specific issue dropdown
  };

  // Open File Selector
  const handleAddAttachment = () => {
    fileInputRef.current?.click();
  };

  // Handle File Upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!issue) {
      return;
    }

    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const newAttachmentObject = {
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type.includes("image") ? "image" : "doc",
        addedBy: auth.currentUser?.uid || "unknown", // Track user who added
        dateAdded: new Date().toLocaleDateString(), // Save Date
      };
      updateIssue(issue.id, {
        attachments: [...issue.attachments, newAttachmentObject],
      });
    }
  };

  // Delete Attachment (Only if user added it)
  const handleDeleteAttachment = (attachmentIndex: number) => {
    if (!issue) {
      return;
    }

    const updatedAttachments = issue.attachments.filter(
      (_, index) => index !== attachmentIndex
    );
    updateIssue(issue.id, { attachments: updatedAttachments });
  };

  const updateImageDisplay = () => {
    if (
      !attachmentContainerRef.current ||
      !issue ||
      issue.attachments.length === 0
    )
      return;

    const containerWidth = attachmentContainerRef.current.clientWidth;
    const minImageSize = 150;
    const maxImageSize = 250;
    const gapSize = 12; // Tailwind's gap-3 = 12px

    // Step 1: Determine max number of images that can fit
    let numImages = Math.floor(containerWidth / (minImageSize + gapSize));

    // Ensure at least 1 image is displayed
    numImages = Math.max(1, Math.min(numImages, issue.attachments.length));

    // Step 2: Adjust image size so they fit exactly
    let newImageSize = (containerWidth - (numImages - 1) * gapSize) / numImages;
    newImageSize = Math.max(minImageSize, Math.min(newImageSize, maxImageSize));

    // Step 3: Update state (Force update if needed)
    setImageSize(newImageSize);
    setMaxVisible(numImages);
    setStartIndex(0); // Reset index when resizing
    setVisibleImages(issue.attachments.slice(0, numImages)); // Update visible images immediately
  };

  const handleNext = () => {
    if (issue && startIndex + maxVisible < issue.attachments.length) {
      setStartIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (startIndex > 0) {
      setStartIndex((prev) => prev - 1);
    }
  };

  // Handle image click to open modal
  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  // Handle document download
  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addComment = () => {
    if (newComment.trim() && issue) {
      const newCommentObject = {
        author: auth.currentUser?.displayName || "",
        text: newComment,
        date: new Date().toLocaleString(),
      };
      const updatedComments = [...(issue.comments || []), newCommentObject];
      updateIssue(issue.id, { comments: updatedComments });
      setNewComment("");
    }
  };

  // Run update logic on resize
  useEffect(() => {
    updateImageDisplay();
    window.addEventListener("resize", updateImageDisplay);
    return () => window.removeEventListener("resize", updateImageDisplay);
  }, [issue?.attachments]);

  // Ensure visible images update dynamically when `maxVisible` changes
  useEffect(() => {
    setVisibleImages(
      issue?.attachments.slice(startIndex, startIndex + maxVisible) || []
    );
  }, [maxVisible, startIndex, issue?.attachments]);

  if (!issue) {
    return <div>Issue not found.</div>;
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2 mb-6 justify-between">
        <h1 className="text-3xl font-semibold mb-0 dark:text-white">Issue</h1>
        <ul className="text-lg flex items-center gap-[6px]">
          <li className="font-medium">
            <a
              href="/dashboard"
              className="flex items-center gap-2 hover:text-blue-400"
            >
              <FontAwesomeIcon icon={faChalkboard} className="size-5" />
              Dashboard
            </a>
          </li>
          <li>-</li>
          <li className="font-medium">
            <a
              href={`/dashboard/${listingId}`}
              className="flex items-center gap-2 hover:text-blue-400"
            >
              Report
            </a>
          </li>
          <li>-</li>
          <li className="font-medium">Issue</li>
        </ul>
      </div>

      <div className="chat-wrapper grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="rounded-lg bg-white overflow-hidden col-span-12 md:col-span-4 xl:col-span-3">
          <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-4">
            <div className="flex items-center gap-4">
              <div className="">
                <h2 className="text-lg font-bold mb-0">
                  {listing?.title || "No Title Found"}
                </h2>
              </div>
            </div>
          </div>

          <div className="chat-search w-full relative">
            <span className="icon absolute start-5 top-1/2 -translate-y-1/2 text-xl flex">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="size-4" />
            </span>
            <input
              type="text"
              className="appearance-none bg-white border-y border-gray-200 rounded-none px-3 py-2 text-base leading-6 shadow-none border-t border-b dark:border-neutral-600 dark:bg-neutral-700 w-full focus:outline-none focus:ring-0 ps-12 pe-6"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search..."
            />
          </div>
          <div className="chat-all-list flex flex-col gap-1.5 mt-3 max-h-[580px] overflow-y-auto">
            {filteredIssues.map((issue) => (
              <a
                key={issue.id}
                href="#"
                onClick={() =>
                  navigate(`/dashboard/${listingId}/issue/${issue.id}`)
                }
                className="flex items-center justify-between gap-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-600 px-6 py-2.5 active"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`block w-3 h-3 shrink-0 rounded-full ${
                      issue.severity === "High"
                        ? "bg-red-500"
                        : issue.severity === "Medium"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                  ></div>
                  <div className="info">
                    <h6 className="text-sm line-clamp-1">
                      {issue.id + " " + issue.summary}
                    </h6>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
        <div className=" col-span-12 md:col-span-8 xl:col-span-9">
          <div
            ref={cardRef}
            className="relative rounded-lg bg-white border-0 overflow-hidden flex flex-col"
          >
            <div className="items-center px-6 py-4 active border-b border-neutral-200 dark:border-neutral-600">
              <div className="flex flex-row items-center justify-between">
                <h2 className="text-2xl font-medium mb-0">
                  {issue.id + " " + issue.summary || "No Title Found"}
                </h2>
                <AddToCart
                  itemId={issue.id}
                  getItemRef={() => cardRef.current}
                />
              </div>
            </div>
            <div className="chat-message-list max-h-[568px] overflow-y-auto flex flex-col lg:flex-row p-6 gap-6">
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
                        src={issue.image}
                        alt="Issue"
                        className="rounded-lg w-full h-[300px] object-cover cursor-pointer"
                        onClick={() => handleImageClick(issue.image)}
                      />
                    </div>
                  )}
                </div>

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
                              issue.progress === "To-do"
                                ? "bg-neutral-100 text-neutral-600 border border-neutral-600"
                                : issue.progress === "In-progress"
                                ? "bg-blue-100 text-blue-600 border border-blue-600"
                                : "bg-green-100 text-green-600 border border-green-600"
                            }`}
                            ref={dropdownButtonRef}
                            onClick={() => handleOpenDropdown(issue.id)}
                          >
                            {issue.progress}
                            <FontAwesomeIcon
                              icon={faChevronDown}
                              className="ml-1"
                            />
                          </button>
                          {dropdownOpen === issue.id && (
                            <Dropdown
                              buttonRef={dropdownButtonRef}
                              onClose={() => {}}
                            >
                              {["To-do", "In-progress", "Done"].map(
                                (progress) => (
                                  <button
                                    key={progress}
                                    className={`block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left ${
                                      progress === issue.progress
                                        ? "font-bold"
                                        : ""
                                    }`}
                                    onClick={() =>
                                      handleProgressChange(issue.id, progress)
                                    }
                                  >
                                    {progress}
                                  </button>
                                )
                              )}
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
                      A major pipe leakage is causing water overflow in the
                      kitchen.
                    </p>
                  )}
                </div>

                {/* Attachment Section */}
                <div>
                  {/* Header with Title and Add Button */}
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => setAttachmentsOpen((prev) => !prev)}
                    >
                      <button className="rounded bg-neutral-200 px-2 mr-2">
                        {attachmentsOpen ? (
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
                      <h2 className="text-lg font-semibold">Attachments</h2>
                    </div>
                    <button
                      onClick={handleAddAttachment}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <FontAwesomeIcon icon={faPlus} className="size-4" />
                    </button>
                  </div>

                  {attachmentsOpen && (
                    <div
                      ref={attachmentContainerRef}
                      className="relative w-full flex justify-start items-center mt-4"
                    >
                      {/* Left Arrow */}
                      {startIndex > 0 && (
                        <button
                          onClick={handlePrev}
                          className="absolute left-0 z-10 bg-white text-gray-800 p-2 rounded-full hover:bg-gray-50 transition shadow-md flex items-center justify-center"
                          style={{
                            left: `calc(50% - ${
                              (maxVisible * imageSize) / 2
                            }px)`,
                            transform: "translateX(-50%)",
                          }}
                        >
                          <FontAwesomeIcon icon={faArrowLeft} />
                        </button>
                      )}

                      {/* Attachments Row */}
                      <div className="relative overflow-hidden w-full">
                        <div className="flex gap-3 transition-transform duration-300 ease-in-out">
                          {issue.attachments?.length ? (
                            <>
                              {visibleImages.map((attachment, index) => (
                                <div
                                  key={index}
                                  style={{
                                    width: `${imageSize}px`,
                                    height: `${imageSize - 20}px`,
                                  }}
                                  className="relative border rounded-md bg-gray-100 flex flex-col justify-end"
                                >
                                  {attachment.type === "image" ? (
                                    <img
                                      src={attachment.url}
                                      alt={attachment.name}
                                      className="absolute top-0 left-0 w-full h-full object-cover rounded cursor-pointer"
                                      onClick={() =>
                                        handleImageClick(attachment.url)
                                      }
                                    />
                                  ) : (
                                    <div
                                      className="absolute top-0 left-0 w-full h-full flex items-center justify-center cursor-pointer"
                                      onClick={() =>
                                        handleDownload(
                                          attachment.url,
                                          attachment.name
                                        )
                                      }
                                    >
                                      <img
                                        src="/images/google-docs.png"
                                        alt="Document"
                                        className="size-16 mb-8"
                                      />
                                    </div>
                                  )}
                                  {/* Attachment Name */}
                                  <div className="absolute bottom-5 left-0 w-full bg-white bg-opacity-70 text-gray-800 text-xs font-semibold px-2.5 pt-2 pb-1 truncate">
                                    {attachment.name}
                                  </div>

                                  {/* Date Added */}
                                  <div className="absolute bottom-0 left-0 w-full bg-white bg-opacity-70 text-gray-800 text-xs px-2.5 pb-1">
                                    {attachment.dateAdded}
                                  </div>

                                  {/* Delete Button (Only if User Added) */}
                                  {attachment.addedBy ===
                                    auth.currentUser?.uid && (
                                    <button
                                      className="absolute top-2 right-2 text-red-400 bg-gray-50 rounded-full py-1 px-2 text-sm"
                                      onClick={() =>
                                        handleDeleteAttachment(index)
                                      }
                                    >
                                      <FontAwesomeIcon icon={faTrashCan} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </>
                          ) : (
                            <p className="text-gray-500">No Attachments yet.</p>
                          )}
                        </div>
                      </div>

                      {/* Right Arrow */}
                      {maxVisible &&
                        startIndex + maxVisible < issue.attachments.length && (
                          <button
                            onClick={handleNext}
                            className="absolute right-0 z-10 bg-white text-gray-800 p-2 rounded-full hover:bg-gray-50 transition shadow-md flex items-center justify-center"
                            style={{
                              right: `calc(50% - ${
                                (maxVisible * imageSize) / 2
                              }px)`,
                              transform: "translateX(50%)",
                            }}
                          >
                            <FontAwesomeIcon icon={faArrowRight} />
                          </button>
                        )}

                      {/* Image Modal */}
                      {selectedImage && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
                          <div className="relative bg-white rounded-lg shadow-lg max-w-3xl">
                            <button
                              className="absolute top-2 right-2 text-gray-800 py-1 px-2 rounded-full"
                              onClick={() => setSelectedImage(null)}
                            >
                              <FontAwesomeIcon
                                icon={faTimes}
                                className="text-xl"
                              />
                            </button>
                            <img
                              src={selectedImage}
                              alt="Full View"
                              className="max-w-full max-h-[90vh] rounded"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    accept="image/*, .pdf, .doc, .docx"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Comments Section */}
                <div className="pb-6">
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => toggleSection(setCommentsOpen)}
                  >
                    <button className="rounded bg-neutral-200 px-2 mr-2">
                      {commentsOpen ? (
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
                    <h2 className="text-lg font-semibold">Comments</h2>
                  </div>
                  {commentsOpen && (
                    <div className="mt-4">
                      {issue.comments?.length ? (
                        <ul className="space-y-4">
                          {issue.comments.map((comment, index) => (
                            <li
                              key={index}
                              className="border border-gray-300 rounded p-4 bg-gray-50"
                            >
                              <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                  {comment.author}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {comment.date}
                                </span>
                              </div>
                              <p className="text-gray-600">{comment.text}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No comments yet.</p>
                      )}
                      <div className="flex gap-2 mt-4">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment"
                          className="flex-grow border border-gray-300 px-3 py-2 rounded-lg"
                        />
                        <button
                          onClick={addComment}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
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
                        <h4 className="text-sm font-medium text-gray-500">
                          Vendor
                        </h4>
                        <p className="text-base font-semibold text-gray-700">
                          {issue.vendor}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Worked By
                        </h4>
                        <p className="text-base font-semibold text-gray-700">
                          {issue.workedBy}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Realtor
                        </h4>
                        <p className="text-base font-semibold text-gray-700">
                          {issue.realtor}
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
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500">
                        Date Created
                      </h4>
                      <p className="text-base font-semibold text-gray-700">
                        {issue.dateCreated}
                      </p>{" "}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Issue;
