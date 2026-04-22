import { createGraphClient } from "./graphClient";
import type { DriveItem } from "../types/graph";

/** Search within a specific drive */
export async function searchDrive(
  token: string,
  driveId: string,
  query: string
): Promise<DriveItem[]> {
  const client = createGraphClient(token);
  const encoded = encodeURIComponent(query);
  const res = await client.get<{ value: DriveItem[] }>(
    `/drives/${driveId}/root/search(q='${encoded}')?$top=100&$select=id,name,size,lastModifiedDateTime,webUrl,folder,file,parentReference,@microsoft.graph.downloadUrl`
  );
  return res.data.value;
}
