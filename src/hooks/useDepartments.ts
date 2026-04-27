import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/useAuth";
import { listFolderChildren, searchInFolder, deleteItem, renameItem } from "../api/driveApi";
import { uploadFile } from "../api/uploadApi";

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

/**
 * CRUD mutations for items inside a department folder.
 * Upload, delete and rename all invalidate the deptFiles cache automatically.
 * SharePoint permissions are enforced server-side; a 403 is surfaced as an
 * error from the mutation so the UI can show a friendly message.
 */
export function useDeptMutations(driveId: string | null, folderId: string | null) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const invalidate = () => {
    // Invalidate all deptFiles and deptFolders caches — covers renamed/deleted
    // items at any depth, including expanded sub-folders.
    queryClient.invalidateQueries({ queryKey: ["deptFiles"] });
    queryClient.invalidateQueries({ queryKey: ["deptFolders"] });
  };

  const deleteMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      if (!driveId) throw new Error("driveId manquant");
      const token = await getToken();
      // Run deletes in parallel — each is independent
      await Promise.all(itemIds.map((id) => deleteItem(token, driveId, id)));
    },
    onSuccess: invalidate,
  });

  const renameMutation = useMutation({
    mutationFn: async ({ itemId, newName }: { itemId: string; newName: string }) => {
      if (!driveId) throw new Error("driveId manquant");
      const token = await getToken();
      return renameItem(token, driveId, itemId, newName);
    },
    onSuccess: invalidate,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (percent: number) => void;
    }) => {
      if (!driveId || !folderId) throw new Error("driveId / folderId manquant");
      const token = await getToken();
      return uploadFile(token, driveId, folderId, file, onProgress);
    },
    onSuccess: invalidate,
  });

  return {
    deleteItems: deleteMutation,
    rename: renameMutation,
    upload: uploadMutation,
    isBusy: deleteMutation.isPending || renameMutation.isPending || uploadMutation.isPending,
  };
}

/** Full-text search within a folder tree (Graph /search API — recursive) */
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
