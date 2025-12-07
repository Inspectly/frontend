import toast from "react-hot-toast";
import { uploadSingleImage, uploadDocument } from "./cloudinaryUtils";

interface CreateAttachmentParams {
    issueId: number;
    userId: number;
    file: File;
    createAttachment: Function;
    refetch?: () => void;
}

/**
 * Handles the upload of an attachment (image or document) to Cloudinary
 * and then creates the attachment record in the backend.
 */
export const handleCreateAttachmentWithUpload = async ({
    issueId,
    userId,
    file,
    createAttachment,
    refetch,
}: CreateAttachmentParams) => {
    try {
        let attachmentUrl: string = "";
        const isImage = file.type.startsWith("image/");
        const uploadToastId = toast.loading(
            isImage ? "Uploading image..." : "Uploading document..."
        );

        try {
            // Structure: user/{userId}/issues/{issueId}/attachments/{timestamp}
            const folder = `user/${userId}/issues/${issueId}/attachments/${Date.now()}`;

            if (isImage) {
                attachmentUrl = await uploadSingleImage(file, folder);
            } else {
                attachmentUrl = await uploadDocument(file, folder);
            }

            toast.success("Upload successful!", {
                id: uploadToastId,
            });
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? `Upload failed: ${err.message}`
                    : "Upload failed",
                { id: uploadToastId }
            );
            throw err; // Stop execution
        }

        // Create attachment record
        const creatingToastId = toast.loading("Saving attachment...");
        try {
            await createAttachment({
                issueId,
                userId,
                file,        // Original file object for name
                url: attachmentUrl, // Cloudinary URL
            }).unwrap();

            toast.success("Attachment added!", {
                id: creatingToastId,
            });

            refetch?.();
        } catch (err) {
            console.error("Failed to save attachment:", err);
            toast.error("Failed to save attachment record", { id: creatingToastId });
            throw err;
        }

    } catch (err) {
        console.error("Failed to add attachment:", err);
        throw err; // Re-throw to let caller handle it
    }
};
