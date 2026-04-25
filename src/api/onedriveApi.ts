import { createGraphClient } from "./graphClient";
import type { DriveItem, SharedDriveItem } from "../types/graph";

const SHARED_SELECT = "id,name,remoteItem";

const ITEM_SELECT =
  "id,name,size,lastModifiedDateTime,createdDateTime,webUrl,folder,file,parentReference,@microsoft.graph.downloadUrl";

/** Items other people have shared with the signed-in user via OneDrive. */
export async function fetchSharedWithMe(token: string): Promise<SharedDriveItem[]> {
  const client = createGraphClient(token);
  const res = await client.get<{ value: SharedDriveItem[] }>(
    `/me/drive/sharedWithMe?$select=${SHARED_SELECT}&$top=200`
  );
  return res.data.value.filter((it) => !!it.remoteItem);
}

/**
 * List children of the signed-in user's own OneDrive.
 * Pass null/undefined for the root, or an item ID to list a sub-folder.
 */
export async function fetchMyDriveChildren(
  token: string,
  itemId: string | null
): Promise<DriveItem[]> {
  const client = createGraphClient(token);
  const url = itemId
    ? `/me/drive/items/${itemId}/children?$select=${ITEM_SELECT}&$top=500`
    : `/me/drive/root/children?$select=${ITEM_SELECT}&$top=500`;
  const res = await client.get<{ value: DriveItem[] }>(url);
  return res.data.value;
}
