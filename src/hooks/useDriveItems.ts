import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/useAuth";
import { listDriveRoot, listFolderChildren, listSubfolders, listRootFolders } from "../api/driveApi";

/** List all items (files + folders) in the current folder or root */
export function useDriveItems(
  siteId: string | null,
  driveId: string | null,
  itemId: string | null // null = root
) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["driveItems", siteId, driveId, itemId],
    queryFn: async () => {
      const token = await getToken();
      if (!itemId) {
        // Root level: use site-based endpoint
        return listDriveRoot(token, siteId!);
      }
      return listFolderChildren(token, driveId!, itemId);
    },
    enabled: !!siteId && !!driveId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/** List only folders (for sidebar tree), lazy-loaded on expand */
export function useSubfolders(
  driveId: string | null,
  itemId: string | null,
  siteId?: string | null,
  enabled?: boolean
) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["subfolders", driveId, itemId, siteId],
    queryFn: async () => {
      const token = await getToken();
      if (!itemId && siteId) {
        return listRootFolders(token, siteId);
      }
      return listSubfolders(token, driveId!, itemId!);
    },
    enabled: enabled !== false && (!!driveId || !!siteId),
    staleTime: 1000 * 60 * 5,
  });
}
