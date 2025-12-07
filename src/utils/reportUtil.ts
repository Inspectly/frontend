import { ListingByReportFormData } from "../components/AddListingByReportModal";
import toast from "react-hot-toast";
import { uploadPdf } from "./cloudinaryUtils";

export const handleAddListingWithReport = async ({
  formData,
  user_id,
  createListing,
  uploadReportFile,
  refetch,
  onClose,
}: {
  formData: ListingByReportFormData;
  user_id: number;
  createListing: Function;
  uploadReportFile: Function;
  refetch: () => void;
  onClose: () => void;
}) => {
  try {
    const creatingToastId = toast.loading("Creating listing...");

    const newListing = await createListing({
      address: formData.address,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      postal_code: formData.postal_code,
      user_id,
    }).unwrap();

    toast.success("Listing created successfully!", { id: creatingToastId });

    if (formData.report_file) {
      const uploadingToastId = toast.loading("Sending report for extraction...");

      const reportForm = new FormData();
      reportForm.append("user_id", String(user_id));
      reportForm.append("listing_id", String(newListing.id));
      reportForm.append("name", formData.report_file.name);
      reportForm.append("property_report", formData.report_file);

      await uploadReportFile(reportForm).unwrap();

      toast.success("Report received. Our AI model has started extracting issues.", {
        id: uploadingToastId,
      });
    }

    refetch();
    onClose();
  } catch (err) {
    console.error("Failed to create listing or upload report:", err);
    toast.error("Something went wrong while creating listing or uploading report.");
  }
};

/**
 * New function: Uploads PDF to Cloudinary first, then creates listing and report
 * This uses Cloudinary for file storage and sends the URL to the backend
 */
export const handleAddListingWithReportCloudinary = async ({
  formData,
  user_id,
  createListing,
  createReport,
  refetch,
  onClose,
}: {
  formData: ListingByReportFormData;
  user_id: number;
  createListing: Function;
  createReport: Function; // Use createReport mutation instead of uploadReportFile
  refetch: () => void;
  onClose: () => void;
}) => {
  try {
    let cloudinaryUrl: string | null = null;

    // Step 1: Upload PDF to Cloudinary first (if file exists)
    if (formData.report_file) {
      const uploadingToastId = toast.loading("Uploading report..");
      
      try {
        // Use a folder structure: pending-reports/{user_id}/{timestamp}
        // This will be organized by reportId later once the report is created
        const folder = `${user_id}/reports/${Date.now()}`;
        cloudinaryUrl = await uploadPdf(formData.report_file, folder);
        
        toast.success("Report uploaded successfully!", {
          id: uploadingToastId,
        });
      } catch (err) {
        toast.error(
          err instanceof Error 
            ? `Failed to upload: ${err.message}`
            : "Failed to upload report file",
          { id: uploadingToastId }
        );
        throw err; // Stop execution if Cloudinary upload fails
      }
    }

    // Step 2: Create listing
    const creatingToastId = toast.loading("Creating listing...");
    
    const newListing = await createListing({
      address: formData.address,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      postal_code: formData.postal_code,
      user_id,
    }).unwrap();

    toast.success("Listing created successfully!", { id: creatingToastId });

    // Step 3: Create report with Cloudinary URL (if PDF was uploaded)
    if (cloudinaryUrl) {
      const reportCreatingToastId = toast.loading("Creating report with uploaded file...");

      try {
        // Create report with Cloudinary URL
        // The backend should handle the URL and trigger AI extraction if needed
        await createReport({
          user_id,
          listing_id: newListing.id,
          name: formData.report_file?.name || "Inspection Report",
          aws_link: cloudinaryUrl, // Cloudinary URL stored in aws_link field
        }).unwrap();

        toast.success("Report created successfully.", {
          id: reportCreatingToastId,
        });
      } catch (err) {
        console.error("Failed to create report:", err);
        toast.error(".", {
          id: reportCreatingToastId,
        });
        // Don't throw - listing was created successfully
      }
    }

    refetch();
    onClose();
  } catch (err) {
    console.error("Failed to create listing or upload report:", err);
    toast.error("Something went wrong while creating listing or uploading report.");
  }
};
