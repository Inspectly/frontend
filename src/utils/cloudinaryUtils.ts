/**
 * Cloudinary Upload Utilities
 *
 * Provides reusable functions for uploading PDFs and images to Cloudinary,
 * where the caller controls the folder structure.
 */

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  [key: string]: unknown;
}

interface CloudinaryErrorResponse {
  error: {
    message: string;
    [key: string]: unknown;
  };
}

interface UploadOptions {
  resourceType: "raw" | "image";
  uploadPreset: string;
  folder: string;
  publicId?: string;
}

interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

// ---- FILE SIZE LIMIT ----
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 10 MB

/**
 * Validates and returns Cloudinary configuration from environment variables
 */
function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset =
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;


  if (!cloudName) throw new Error("Missing VITE_CLOUDINARY_CLOUD_NAME");
  if (!uploadPreset)
    throw new Error("Missing VITE_CLOUDINARY_UPLOAD_PRESET");

  return {
    cloudName,
    uploadPreset
  };
}

/**
 * Sanitizes filename for Cloudinary public_id
 */
function sanitizeFilename(filename: string): string {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  return nameWithoutExt
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

/**
 * Internal helper for uploading to Cloudinary
 */
async function uploadToCloudinary(
  file: File,
  options: UploadOptions
): Promise<string> {
  const config = getCloudinaryConfig();
  const { resourceType, uploadPreset, folder, publicId } = options;

  const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder);

  if (publicId) {
    formData.append("public_id", publicId);
  }

  // ---- SIZE CHECK ----
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File "${file.name}" is too large. Must be under 10 MB.`
    );
  }

  try {
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Upload failed with status ${response.status}`;

      try {
        const errorData = (await response.json()) as CloudinaryErrorResponse;
        if (errorData.error?.message) {
          errorMessage = `Cloudinary error: ${errorData.error.message}`;
        }
      } catch {
        // ignore parse errors
      }

      throw new Error(errorMessage);
    }

    const data = (await response.json()) as CloudinaryResponse;

    if (!data.secure_url) {
      throw new Error(
        "Upload succeeded but no secure_url was returned in Cloudinary response"
      );
    }

    return data.secure_url;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error(`Network error during upload: ${String(error)}`);
  }
}

/**
 * Upload a single PDF to a given folder
 */
/**
 * Upload a single document (PDF, DOC, DOCX) to a given folder
 */
export async function uploadDocument(
  file: File,
  folder: string
): Promise<string> {
  if (!file) throw new Error("Document file is required.");

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only PDF, DOC, and DOCX files are allowed.");
  }

  // ---- SIZE VALIDATION ----
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `Document is too large. Max allowed size is 10 MB.`
    );
  }

  const config = getCloudinaryConfig();
  const publicId = sanitizeFilename(file.name);

  return uploadToCloudinary(file, {
    resourceType: "raw",
    uploadPreset: config.uploadPreset,
    folder,
    publicId,
  });
}

// Deprecated: Alias for backward compatibility if needed, or just replace usage
export const uploadPdf = uploadDocument;

/**
 * Upload many images into a given folder
 */
export async function uploadImages(
  files: File[],
  folder: string
): Promise<string[]> {
  if (!files || files.length === 0) {
    throw new Error("At least one image file is required.");
  }

  const config = getCloudinaryConfig();
  const timestamp = Date.now();

  const validImages = files.filter((f) => f.type.startsWith("image/"));

  if (validImages.length === 0) {
    throw new Error("No valid image files provided.");
  }

  // ---- SIZE VALIDATION for all images ----
  for (const file of validImages) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `Image "${file.name}" exceeds the 10 MB limit.`
      );
    }
  }

  const uploadPromises = validImages.map((file, index) => {
    const baseName = sanitizeFilename(file.name) || "img";
    const publicId = `${baseName}-${timestamp}-${index}`;

    return uploadToCloudinary(file, {
      resourceType: "image",
      uploadPreset: config.uploadPreset,
      folder,
      publicId,
    });
  });

  try {
    return await Promise.all(uploadPromises);
  } catch (error) {
    if (error instanceof Error)
      throw new Error(`Failed to upload images: ${error.message}`);
    throw new Error(`Failed to upload images: ${String(error)}`);
  }
}

/**
 * Upload a single image into a given folder
 */
export async function uploadSingleImage(
  file: File,
  folder: string
): Promise<string> {
  if (!file) {
    throw new Error("Image file is required.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error(`Invalid image type: ${file.type}`);
  }

  // reuse size limit + core logic by delegating to uploadImages
  const [url] = await uploadImages([file], folder);
  return url;
}

