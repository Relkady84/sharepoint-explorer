import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/useAuth";
import { listFolderChildren, searchInFolder } from "../api/driveApi";

// ── Pinned folder (stored by item ID, not path) ──────────────────────────────

const DEPT_PIN_KEY = "dept_pinned_folder";

export interface PinnedFolder {
  driveId: string;
  itemId: string;
  label: string; // display name shown in header
}

export function getPinnedFolder(): PinnedFolder | null {
  try {
    const raw = localStorage.getItem(DEPT_PIN_KEY);
    return raw ? (JSON.parse(raw) as PinnedFolder) : null;
  } catch {
    return null;
  }
}

export function savePinnedFolder(driveId: string, itemId: string, label: string) {
  localStorage.setItem(DEPT_PIN_KEY, JSON.stringify({ driveId, itemId, label }));
}

export function clearPinnedFolder() {
  localStorage.removeItem(DEPT_PIN_KEY);
}

// ── Hooks ────────────────────────────────────────────────────────────────────

/** List all department sub-folders (sorted alphabetically) */
export function useDeptFolders(driveId: string | null, folderId: string | null) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["deptFolders", driveId, folderId],
    queryFn: async () => {
      const token = await getToken();
      const items = await listFolderChildren(token, driveId!, folderId!);
      return items
        .filter((item) => !!item.folder)
        .sort((a, b) => a.name.localeCompare(b.name, "fr"));
    },
    enabled: !!driveId && !!folderId,
    staleTime: 1000 * 60 * 5,
  });
}

/** List all items inside one department folder */
export function useDeptFiles(driveId: string | null, folderId: string | null) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["deptFiles", driveId, folderId],
    queryFn: async () => {
      const token = await getToken();
      const items = await listFolderChildren(token, driveId!, folderId!);
      return items.sort((a, b) => {
        if (!!a.folder !== !!b.folder) return a.folder ? -1 : 1;
        return a.name.localeCompare(b.name, "fr");
      });
    },
    enabled: !!driveId && !!folderId,
    staleTime: 1000 * 60 * 5,
  });
}

/** Full-text search within the pinned folder tree */
export function useDeptSearch(
  driveId: string | null,
  folderId: string | null,
  query: string
) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["deptSearch", driveId, folderId, query],
    queryFn: async () => {
      const token = await getToken();
      return searchInFolder(token, driveId!, folderId!, query);
    },
    enabled: !!driveId && !!folderId && query.trim().length >= 2,
    staleTime: 30_000,
  });
}
