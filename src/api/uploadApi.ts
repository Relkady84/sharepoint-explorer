import axios from "axios";
import { createGraphClient } from "./graphClient";
import type { DriveItem } from "../types/graph";

const SMALL_FILE_LIMIT = 4 * 1024 * 1024; // 4 MB

/** Upload a small file (< 4 MB) via simple PUT */
async function uploadSmallFile(
  token: string,
  driveId: string,
  parentItemId: string,
  file: File
): Promise<DriveItem> {
  const client = createGraphClient(token);
  const res = await client.put<DriveItem>(
    `/drives/${driveId}/items/${parentItemId}:/${encodeURIComponent(file.name)}:/content`,
    file,
    {
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
    }
  );
  return res.data;
}

/** Upload a large file (>= 4 MB) via chunked upload session */
async function uploadLargeFile(
  token: string,
  driveId: string,
  parentItemId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<DriveItem> {
  const client = createGraphClient(token);

  // 1. Create upload session
  const sessionRes = await client.post<{ uploadUrl: string }>(
    `/drives/${driveId}/items/${parentItemId}:/${encodeURIComponent(file.name)}:/createUploadSession`,
    {
      item: {
        "@microsoft.graph.conflictBehavior": "rename",
        name: file.name,
      },
    }
  );
  const { uploadUrl } = sessionRes.data;

  // 2. Upload in 5 MB chunks
  const CHUNK_SIZE = 5 * 1024 * 1024;
  let start = 0;
  let lastResponse: DriveItem | null = null;

  while (start < file.size) {
    const end = Math.min(start + CHUNK_SIZE - 1, file.size - 1);
    const chunk = file.slice(start, end + 1);

    const response = await axios.put(uploadUrl, chunk, {
      headers: {
        "Content-Range": `bytes ${start}-${end}/${file.size}`,
        "Content-Length": `${end - start + 1}`,
        "Content-Type": "application/octet-stream",
      },
    });

    if (response.data && response.data.id) {
      lastResponse = response.data as DriveItem;
    }

    onProgress?.(Math.round(((end + 1) / file.size) * 100));
    start = end + 1;
  }

  return lastResponse!;
}

/** Upload dispatcher: routes to simple or chunked upload based on file size */
export async function uploadFile(
  token: string,
  driveId: string,
  parentItemId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<DriveItem> {
  if (file.size <= SMALL_FILE_LIMIT) {
    return uploadSmallFile(token, driveId, parentItemId, file);
  }
  return uploadLargeFile(token, driveId, parentItemId, file, onProgress);
}
