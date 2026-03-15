const BASE_URL = import.meta.env.VITE_BE_BASE_URL || "/api/";

const normalizeBaseUrl = (url: string) => (url.endsWith("/") ? url : `${url}/`);

const buildImagesEndpoint = (baseUrl: string) => {
  const normalized = normalizeBaseUrl(baseUrl);
  const lower = normalized.toLowerCase();

  if (lower.endsWith("/api/v0/") || lower.endsWith("/api/v0")) {
    return `${normalized}images/`;
  }
  if (lower.endsWith("/api/") || lower.endsWith("/api")) {
    return `${normalized}v0/images/`;
  }
  if (lower.includes("/api/v0/") || lower.includes("/api/v0")) {
    return `${normalized}images/`;
  }
  if (lower.includes("/api/")) {
    return `${normalized}v0/images/`;
  }
  return `${normalized}api/v0/images/`;
};

const IMAGES_ENDPOINT = buildImagesEndpoint(BASE_URL);

type ImageUploadResponse = {
  url?: string;
  display_url?: string;
};

export const uploadFileToImageUrl = async (file: File): Promise<string> => {
  console.log("uploadFileToImageUrl called with file:", file.name, "uploading to:", IMAGES_ENDPOINT);
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(IMAGES_ENDPOINT, {
    method: "POST",
    body: formData,
  });

  let json: ImageUploadResponse | null = null;
  try {
    json = (await response.json()) as ImageUploadResponse;
  } catch {
    json = null;
  }

  if (!response.ok) {
    const message =
      (json as any)?.detail ||
      (json as any)?.message ||
      `Image upload failed (${response.status})`;
    throw new Error(message);
  }

  const url = json?.url || json?.display_url;
  if (!url) {
    throw new Error("Image upload succeeded but no url was returned.");
  }

  return url;
};

export const uploadFilesToImageUrls = async (files: File[]): Promise<string[]> => {
  return Promise.all(files.map(uploadFileToImageUrl));
};
