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

/** Get ALL document libraries (drives) for a site */
export async function getSiteAllDrives(token: string, siteId: string): Promise<Drive[]> {
  const client = createGraphClient(token);
  const res = await client.get<{ value: Drive[] }>(
    `/sites/${siteId}/drives?$select=id,driveType,name`
  );
  // Only return document libraries (excludes system drives)
  return res.data.value.filter((d) => d.driveType === "documentLibrary");
}

/** Get the default drive (fallback for single-drive use) */
export async function getSiteDrive(token: string, siteId: string): Promise<Drive> {
  const drives = await getSiteAllDrives(token, siteId);
  if (drives.length === 0) throw new Error(`No drives found for site: ${siteId}`);
  // Prefer "Documents" library, otherwise take the first
  return drives.find((d) => d.name === "Documents") ?? drives[0];
}
