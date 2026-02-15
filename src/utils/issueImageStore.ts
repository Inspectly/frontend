/**
 * IndexedDB-backed store for issue images.
 *
 * Images (base64 data-URLs) are too large for localStorage (~5 MB limit).
 * IndexedDB can hold hundreds of MB and persists across full-page navigations
 * (e.g. Stripe checkout redirect → return).
 *
 * Usage:
 *   await saveIssueImages(issueId, ["data:image/png;base64,..."]);
 *   const urls = await getIssueImages(issueId);   // string[] | null
 *   await deleteIssueImages(issueId);
 */

const DB_NAME = "inspectly_images";
const STORE_NAME = "pending_images";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "issueId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Store image URLs for an issue. Overwrites any previous entry for the same ID.
 */
export async function saveIssueImages(
  issueId: number,
  imageUrls: string[]
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ issueId, imageUrls });
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    console.warn("Failed to save issue images to IndexedDB", err);
  }
}

/**
 * Retrieve stored image URLs for an issue, or null if none exist.
 */
export async function getIssueImages(
  issueId: number
): Promise<string[] | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(issueId);
    const result = await new Promise<{ issueId: number; imageUrls: string[] } | undefined>(
      (resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }
    );
    db.close();
    return result?.imageUrls ?? null;
  } catch (err) {
    console.warn("Failed to read issue images from IndexedDB", err);
    return null;
  }
}

/**
 * Delete stored images for an issue (cleanup after use).
 */
export async function deleteIssueImages(issueId: number): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(issueId);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    console.warn("Failed to delete issue images from IndexedDB", err);
  }
}
