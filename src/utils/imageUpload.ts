const BASE_URL = import.meta.env.VITE_BE_BASE_URL || "/api/";

const normalizeBaseUrl = (url: string) => (url.endsWith("/") ? url : `${url}/`);

// Follow the same URL pattern as apiSlice: base + path.
// The Vite dev proxy rewrites /api → /api/v0 automatically, so we must NOT
// include v0 here — doing so produces a double-prefix (/api/v0/v0/images/).
const IMAGES_ENDPOINT = `${normalizeBaseUrl(BASE_URL)}images/`;

type ImageUploadResponse = {
  url?: string;
  display_url?: string;
};

export const uploadFileToImageUrl = async (file: File): Promise<string> => {
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
    const err = json as Record<string, unknown> | null;
    const message =
      (typeof err?.detail === "string" ? err.detail : null) ||
      (typeof err?.message === "string" ? err.message : null) ||
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
