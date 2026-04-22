import { createGraphClient } from "./graphClient";
import type { DriveItem } from "../types/graph";

const SELECT_FIELDS =
  "id,name,size,lastModifiedDateTime,createdDateTime,webUrl,folder,file,parentReference,@microsoft.graph.downloadUrl";

/** List children of a drive's root folder */
export async function listDriveRoot(
  token: string,
  siteId: string
): Promise<DriveItem[]> {
  const client = createGraphClient(token);
  const res = await client.get<{ value: DriveItem[] }>(
    `/sites/${siteId}/drive/root/children?$select=${SELECT_FIELDS}&$top=500`
  );
  return res.data.value;
}

/** List children of any folder by drive ID + item ID */
export async function listFolderChildren(
  token: string,
  driveId: string,
  itemId: string
): Promise<DriveItem[]> {
  const client = createGraphClient(token);
  const res = await client.get<{ value: DriveItem[] }>(
    `/drives/${driveId}/items/${itemId}/children?$select=${SELECT_FIELDS}&$top=500`
  );
  return res.data.value;
}

/** Get a single item with download URL */
export async function getItemWithDownloadUrl(
  token: string,
  driveId: string,
  itemId: string
): Promise<DriveItem> {
  const client = createGraphClient(token);
  const res = await client.get<DriveItem>(
    `/drives/${driveId}/items/${itemId}?$select=id,name,@microsoft.graph.downloadUrl`
  );
  return res.data;
}

/** Get only subfolders (for folder tree) */
export async function listSubfolders(
  token: string,
  driveId: string,
  itemId: string
): Promise<DriveItem[]> {
  const items = await listFolderChildren(token, driveId, itemId);
  return items.filter((item) => !!item.folder);
}

/** Get a drive item by its path relative to root (e.g. "organisation/dossiers des dpts") */
export async function getItemByPath(
  token: string,
  driveId: string,
  path: string
): Promise<DriveItem> {
  const client = createGraphClient(token);
  const res = await client.get<DriveItem>(
    `/drives/${driveId}/root:/${path}?$select=${SELECT_FIELDS}`
  );
  return res.data;
}

/** Search for items within a specific folder subtree */
export async function searchInFolder(
  token: string,
  driveId: string,
  folderId: string,
  query: string
): Promise<DriveItem[]> {
  const client = createGraphClient(token);
  const encoded = encodeURIComponent(query);
  const res = await client.get<{ value: DriveItem[] }>(
    `/drives/${driveId}/items/${folderId}/search(q='${encoded}')?$select=${SELECT_FIELDS}&$top=100`
  );
  return res.data.value;
}

/** Get root-level folders for a specific drive (for the folder tree) */
export async function listRootFolders(
  token: string,
  driveId: string
): Promise<DriveItem[]> {
  const client = createGraphClient(token);
  const res = await client.get<{ value: DriveItem[] }>(
    `/drives/${driveId}/root/children?$select=${SELECT_FIELDS}&$top=500`
  );
  return res.data.value.filter((item) => !!item.folder);
}
