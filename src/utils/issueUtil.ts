
import toast from "react-hot-toast";
import { uploadSingleImage } from "./cloudinaryUtils";
import { IssueStatus } from "../types";

interface CreateIssueFormData {
  type: string;
  description: string;
  summary: string;
  severity: string;
  status: IssueStatus | string;
  active: boolean;
  image_file?: File | null;
}

/**
 * Uploads issue image to Cloudinary first, then creates issue with the URL
 */
export const handleCreateIssueWithImage = async ({
  formData,
  reportId,
  userId,
  createIssue,
  refetch,
  onClose,
}: {
  formData: CreateIssueFormData;
  reportId: number;
  userId: number;
  createIssue: Function;
  refetch?: () => void;
  onClose?: () => void;
}) => {
  try {
    let imageUrl: string = "";

    // Step 1: Upload image to Cloudinary first (if file exists)
    if (formData.image_file) {
      const uploadingToastId = toast.loading("Uploading image...");

      try {
        const folder = `user/${userId}/reports/${reportId}/issues/images`;
        imageUrl = await uploadSingleImage(formData.image_file, folder);

        toast.success("Image uploaded successfully!", {
          id: uploadingToastId,
        });
      } catch (err) {
        toast.error(
          err instanceof Error
            ? `Failed to upload image: ${err.message}`
            : "Failed to upload image",
          { id: uploadingToastId }
        );
        throw err; // Stop execution if Cloudinary upload fails
      }
    }

    // Step 2: Create issue with Cloudinary URL
    const creatingToastId = toast.loading("Creating issue...");

    try {
      await createIssue({
        report_id: reportId,
        type: formData.type,
        summary: formData.summary,
        description: formData.description,
        severity: formData.severity,
        status: formData.status as IssueStatus,
        active: formData.active,
        image_url: imageUrl, // Cloudinary URL instead of base64
      }).unwrap();

      toast.success("Issue created successfully!", {
        id: creatingToastId,
      });

      refetch?.();
      onClose?.();
    } catch (err) {
      console.error("Failed to create issue:", err);
      toast.error("Failed to create issue", { id: creatingToastId });
      throw err;
    }
  } catch (err) {
    console.error("Failed to create issue with image:", err);
    // Error already shown in toast above
  }
}; 