import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/useAuth";
import { listFolderChildren, searchInFolder } from "../api/driveApi";

// ── Pinned folders (array — each shows as its own section) ───────────────────

const DEPT_PIN_KEY = "dept_pinned_folders";

export interface PinnedFolder {
  driveId: string;
  itemId: string;
  label: string;
}

export function getPinnedFolders(): PinnedFolder[] {
  try {
    const raw = localStorage.getItem(DEPT_PIN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Support old single-pin format
    if (!Array.isArray(parsed)) return [parsed as PinnedFolder];
    return parsed as PinnedFolder[];
  } catch {
    return [];
  }
}

export function addPinnedFolder(driveId: string, itemId: string, label: string): PinnedFolder[] {
  const existing = getPinnedFolders();
  // Don't add duplicates
  if (existing.some((p) => p.itemId === itemId)) return existing;
  const updated = [...existing, { driveId, itemId, label }];
  localStorage.setItem(DEPT_PIN_KEY, JSON.stringify(updated));
  return updated;
}

export function removePinnedFolder(itemId: string): PinnedFolder[] {
  const updated = getPinnedFolders().filter((p) => p.itemId !== itemId);
  localStorage.setItem(DEPT_PIN_KEY, JSON.stringify(updated));
  return updated;
}

export function clearAllPinnedFolders() {
  localStorage.removeItem(DEPT_PIN_KEY);
}

// ── Hooks ────────────────────────────────────────────────────────────────────

/** List sub-folders of a pinned folder (one call per pinned root) */
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

/** Full-text search within a folder tree */
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
