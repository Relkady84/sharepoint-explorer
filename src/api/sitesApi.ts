import { createGraphClient } from "./graphClient";
import type { Drive, Site } from "../types/graph";

/** Search all SharePoint sites the user can access */
export async function listSites(token: string): Promise<Site[]> {
  const client = createGraphClient(token);
  const res = await client.get<{ value: Site[] }>(
    "/sites?search=*&$select=id,displayName,webUrl"
  );
  return res.data.value;
}

/**
 * Get the document library drive for a site.
 * First tries the default /drive endpoint, then falls back to
 * listing all drives and picking the documentLibrary type.
 */
export async function getSiteDrive(token: string, siteId: string): Promise<Drive> {
  const client = createGraphClient(token);

  // Try the default drive first
  try {
    const res = await client.get<Drive>(`/sites/${siteId}/drive`);
    return res.data;
  } catch {
    // Fallback: list all drives and find the document library
    const drivesRes = await client.get<{ value: Drive[] }>(
      `/sites/${siteId}/drives?$select=id,driveType,name`
    );
    const drives = drivesRes.data.value;

    // Prefer "documentLibrary", otherwise take the first available
    const docLib = drives.find((d) => d.driveType === "documentLibrary") ?? drives[0];
    if (!docLib) throw new Error(`No drives found for site: ${siteId}`);
    return docLib;
  }
}
