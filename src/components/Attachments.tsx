import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faTrashCan,
  faTimes,
  faChevronDown,
  faChevronUp,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import {
  useCreateAttachmentMutation,
  useDeleteAttachmentMutation,
  useGetAttachmentsQuery,
} from "../features/apiSlice";
import { Attachment } from "../types";
import { useMemo } from "react";

interface AttachmentsProps {
  issueId: number;
}

const Attachments: React.FC<AttachmentsProps> = ({ issueId }) => {
  const {
    data: attachments,
    error,
    isLoading,
    refetch,
  } = useGetAttachmentsQuery();
  const [createAttachment] = useCreateAttachmentMutation();
  const [deleteAttachment, { isLoading: isDeleteLoading }] =
    useDeleteAttachmentMutation();

  const issueAttachments = useMemo(() => {
    return (
      attachments?.filter((attachment) => attachment.issue_id === issueId) || []
    );
  }, [attachments, issueId]);

  const [visibleImages, setVisibleImages] = useState<Attachment[]>([]);
  const [imageSize, setImageSize] = useState(150);
  const [maxVisible, setMaxVisible] = useState(issueAttachments.length || 0);
  const [startIndex, setStartIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [attachmentsOpen, setAttachmentsOpen] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentContainerRef = useRef<HTMLDivElement | null>(null);

  // Open File Selector
  const handleAddAttachment = () => {
    fileInputRef.current?.click();
  };

  // Handle File Upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!issueId) return;

    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = "";
    setUploadStatus("loading");

    try {
      await createAttachment({ issueId, file, userId: 48 }).unwrap();
      setUploadStatus("success");
    } catch (error) {
      console.log(error);
      setUploadStatus("error");
    }
  };

  // Delete Attachment (Only if user added it)
  const handleDeleteAttachment = async (attachmentIndex: number) => {
    if (!issueId) {
      return;
    }

    // Find the correct index in the full attachments array
    const actualIndex = startIndex + attachmentIndex;
    const attachmentToDelete = issueAttachments[actualIndex];

    if (!attachmentToDelete) return;

    if (!window.confirm("Are you sure you want to delete this attachment?")) {
      return;
    }

    try {
      await deleteAttachment(attachmentToDelete.id).unwrap();

      setUploadStatus("loading");

      await refetch(); // Refetch after successful deletion

      setUploadStatus("idle");
    } catch (error) {
      console.error("Error deleting attachment:", error);
      setUploadStatus("error");
    }
  };

  const updateImageDisplay = () => {
    if (
      !attachmentContainerRef.current ||
      !issueId ||
      issueAttachments.length === 0
    )
      return;

    const containerWidth = attachmentContainerRef.current.clientWidth;
    const minImageSize = 150;
    const maxImageSize = 250;
    const gapSize = 12; // Tailwind's gap-3 = 12px

    // Step 1: Determine max number of images that can fit
    let numImages = Math.floor(containerWidth / (minImageSize + gapSize));

    // Ensure at least 1 image is displayed
    numImages = Math.max(1, Math.min(numImages, issueAttachments.length));

    // Step 2: Adjust image size so they fit exactly
    let newImageSize = (containerWidth - (numImages - 1) * gapSize) / numImages;
    newImageSize = Math.max(minImageSize, Math.min(newImageSize, maxImageSize));

    // Step 3: Update state (Force update if needed)
    setImageSize(newImageSize);
    setMaxVisible(numImages);
    setStartIndex(0); // Reset index when resizing
    setVisibleImages(issueAttachments.slice(0, numImages)); // Update visible images immediately
  };

  const handleNext = () => {
    if (issueId && startIndex + maxVisible < issueAttachments.length) {
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

  // Run update logic on resize
  useEffect(() => {
    updateImageDisplay();
    window.addEventListener("resize", updateImageDisplay);
    return () => window.removeEventListener("resize", updateImageDisplay);
  }, [issueAttachments]);

  // Ensure visible images update dynamically when `maxVisible` changes
  useEffect(() => {
    setVisibleImages(
      issueAttachments.slice(startIndex, startIndex + maxVisible) || []
    );
  }, [issueAttachments, startIndex, maxVisible]);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading attachments</p>;

  return (
    <>
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
          disabled={uploadStatus === "loading"}
        >
          {uploadStatus === "loading" ? (
            "Loading..."
          ) : (
            <FontAwesomeIcon icon={faPlus} className="size-4" />
          )}
        </button>
      </div>

      {attachmentsOpen && (
        <>
          {uploadStatus === "success" && (
            <p className="text-green-500">Upload Successful!</p>
          )}
          {uploadStatus === "error" && (
            <p className="text-red-500">Upload Failed. Try again.</p>
          )}
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
                  left: `calc(50% - ${(maxVisible * imageSize) / 2}px)`,
                  transform: "translateX(-50%)",
                }}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
            )}

            {/* Attachments Row */}
            <div className="relative overflow-hidden w-full">
              <div className="flex gap-3 transition-transform duration-300 ease-in-out">
                {issueAttachments.length > 0 ? (
                  visibleImages.map((attachment, index) => (
                    <div
                      key={index}
                      style={{
                        width: `${imageSize}px`,
                        height: `${imageSize - 20}px`,
                      }}
                      className="relative border rounded-md bg-gray-100 flex flex-col justify-end"
                    >
                      {/* Image Attachment */}
                      {attachment.type === "image" ? (
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          className="absolute top-0 left-0 w-full h-full object-cover rounded cursor-pointer"
                          onClick={() => handleImageClick(attachment.url)}
                        />
                      ) : (
                        /* Document Attachment */
                        <div
                          className="absolute top-0 left-0 w-full h-full flex items-center justify-center cursor-pointer"
                          onClick={() =>
                            handleDownload(attachment.url, attachment.name)
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
                      <div className="absolute bottom-0 left-0 w-full bg-white bg-opacity-70 text-gray-800 text-xs px-2.5 pb-1 truncate">
                        {formatDate(attachment.created_at)}
                      </div>

                      {/* Delete Button (Only if User Added) */}
                      {/* {authUserId === attachment.addedBy && onDelete && ( */}
                      <button
                        className="absolute top-2 right-2 text-red-400 bg-gray-50 rounded-full py-1 px-2 text-sm"
                        disabled={isLoading || isDeleteLoading}
                        onClick={() => handleDeleteAttachment(index)}
                      >
                        <FontAwesomeIcon icon={faTrashCan} />
                      </button>
                      {/* )} */}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No attachments yet.</p>
                )}
              </div>
            </div>

            {/* Right Arrow */}
            {maxVisible &&
              startIndex + maxVisible < issueAttachments.length && (
                <button
                  onClick={handleNext}
                  className="absolute right-0 z-10 bg-white text-gray-800 p-2 rounded-full hover:bg-gray-50 transition shadow-md flex items-center justify-center"
                  style={{
                    right: `calc(50% - ${(maxVisible * imageSize) / 2}px)`,
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
          </div>
        </>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/*, .pdf, .doc, .docx"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />
    </>
  );
};

export default Attachments;
