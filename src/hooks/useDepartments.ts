import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/useAuth";
import { getItemByPath, listFolderChildren, searchInFolder } from "../api/driveApi";

/** Default path — overridden by whatever the user saves in localStorage */
export const DEPT_ROOT_PATH_DEFAULT = "organization/dossiers des dpts";
export const DEPT_PATH_STORAGE_KEY = "dept_root_path";

export function getDeptRootPath(): string {
  return localStorage.getItem(DEPT_PATH_STORAGE_KEY) ?? DEPT_ROOT_PATH_DEFAULT;
}

export function saveDeptRootPath(path: string) {
  localStorage.setItem(DEPT_PATH_STORAGE_KEY, path);
}

/** Resolve the departments folder to get its item ID */
export function useDeptRoot(driveId: string | null, path: string) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["deptRoot", driveId, path],
    queryFn: async () => {
      const token = await getToken();
      return getItemByPath(token, driveId!, path);
    },
    enabled: !!driveId && !!path,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
}

/** List all department sub-folders (sorted alphabetically) */
export function useDeptFolders(driveId: string | null, rootId: string | null) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["deptFolders", driveId, rootId],
    queryFn: async () => {
      const token = await getToken();
      const items = await listFolderChildren(token, driveId!, rootId!);
      return items
        .filter((item) => !!item.folder)
        .sort((a, b) => a.name.localeCompare(b.name, "fr"));
    },
    enabled: !!driveId && !!rootId,
    staleTime: 1000 * 60 * 5,
  });
}

/** List all items (files + sub-folders) inside one department folder */
export function useDeptFiles(driveId: string | null, folderId: string | null) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["deptFiles", driveId, folderId],
    queryFn: async () => {
      const token = await getToken();
      const items = await listFolderChildren(token, driveId!, folderId!);
      return items.sort((a, b) => {
        // Folders first, then alphabetical
        if (!!a.folder !== !!b.folder) return a.folder ? -1 : 1;
        return a.name.localeCompare(b.name, "fr");
      });
    },
    enabled: !!driveId && !!folderId,
    staleTime: 1000 * 60 * 5,
  });
}

/** Full-text search within the dossiers des dpts folder tree via Graph API */
export function useDeptSearch(
  driveId: string | null,
  rootId: string | null,
  query: string
) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["deptSearch", driveId, rootId, query],
    queryFn: async () => {
      const token = await getToken();
      return searchInFolder(token, driveId!, rootId!, query);
    },
    enabled: !!driveId && !!rootId && query.trim().length >= 2,
    staleTime: 30_000,
  });
}
