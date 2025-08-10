import { ListingFormData } from "../components/AddNewListingModal";
import toast from "react-hot-toast";

export const handleAddListingWithReport = async ({
  formData,
  user_id,
  createListing,
  uploadReportFile,
  refetch,
  onClose,
}: {
  formData: ListingFormData;
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
