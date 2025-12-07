import React, { useState } from "react";
import { uploadSingleImage } from '../utils/cloudinaryUtils'

const TestImageUpload: React.FC = () => {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">(
    "idle"
  );
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setError(null);
    setUrl(null);

    try {
      // 👇 pick any test folder you want
      const folder = "test/manual-uploads";

      const secureUrl = await uploadSingleImage(file, folder);
      setUrl(secureUrl);
      setStatus("done");
      console.log("Uploaded image URL:", secureUrl);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  };

  return (
    <div className="p-4 border rounded max-w-md">
      <h2 className="font-semibold mb-2">Test Cloudinary Image Upload</h2>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-3"
      />

      {status === "uploading" && <p>Uploading...</p>}
      {status === "done" && url && (
        <div className="mt-2">
          <p className="text-green-600 text-sm">Upload successful!</p>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline break-all"
          >
            {url}
          </a>
        </div>
      )}
      {status === "error" && error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}
    </div>
  );
};

export default TestImageUpload;


