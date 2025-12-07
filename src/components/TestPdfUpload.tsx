import React, { useState } from "react";
import { uploadPdf } from "../utils/cloudinaryUtils";

const TestPdfUpload: React.FC = () => {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const folder = "test/manual-pdf";
      const secureUrl = await uploadPdf(file, folder);
      setUrl(secureUrl);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
      setUrl(null);
    }
  };

  return (
    <div>
      <h2>Test PDF Upload</h2>
      <input type="file" accept="application/pdf" onChange={handlePdfChange} />
      {url && (
        <p>
          Uploaded:{" "}
          <a href={url} target="_blank" rel="noreferrer">
            {url}
          </a>
        </p>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default TestPdfUpload;
