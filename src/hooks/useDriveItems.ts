import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/useAuth";
import {
  listFolderChildren, listSubfolders, listRootFolders,
  deleteItem, renameItem, createFolder, copyItem, moveItem,
} from "../api/driveApi";

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
      // Always use drive-specific endpoints so each library shows its own content
      return listFolderChildren(token, driveId!, itemId ?? "root");
    },
    enabled: !!siteId && !!driveId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * File-management mutations for the Explorer view.
 * All operations invalidate the current folder listing + the sidebar tree.
 */
export function useExplorerMutations(
  siteId: string | null,
  driveId: string | null,
  currentItemId: string | null
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["driveItems", siteId, driveId, currentItemId] });
    queryClient.invalidateQueries({ queryKey: ["subfolders", driveId] });
  };

  const deleteMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      if (!driveId) throw new Error("driveId manquant");
      const token = await getToken();
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

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!driveId) throw new Error("driveId manquant");
      const token = await getToken();
      return createFolder(token, driveId, currentItemId ?? "root", name);
    },
    onSuccess: invalidate,
  });

  const copyMutation = useMutation({
    mutationFn: async ({
      itemIds, destDriveId, destFolderId,
    }: { itemIds: string[]; destDriveId: string; destFolderId: string }) => {
      if (!driveId) throw new Error("driveId manquant");
      const token = await getToken();
      await Promise.all(itemIds.map((id) => copyItem(token, driveId, id, destDriveId, destFolderId)));
    },
    onSuccess: () => setTimeout(invalidate, 2000),
  });

  const moveMutation = useMutation({
    mutationFn: async ({
      itemIds, destDriveId, destFolderId,
    }: { itemIds: string[]; destDriveId: string; destFolderId: string }) => {
      if (!driveId) throw new Error("driveId manquant");
      if (destDriveId !== driveId)
        throw new Error("Le déplacement entre deux bibliothèques différentes n'est pas supporté. Utilisez Copier à la place.");
      const token = await getToken();
      await Promise.all(itemIds.map((id) => moveItem(token, driveId, id, destFolderId)));
    },
    onSuccess: invalidate,
  });

  return {
    deleteItems: deleteMutation,
    rename: renameMutation,
    createNewFolder: createFolderMutation,
    copyItems: copyMutation,
    moveItems: moveMutation,
    isBusy:
      deleteMutation.isPending ||
      renameMutation.isPending ||
      createFolderMutation.isPending ||
      copyMutation.isPending ||
      moveMutation.isPending,
  };
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
      if (!itemId && driveId) {
        return listRootFolders(token, driveId);
      }
      return listSubfolders(token, driveId!, itemId!);
    },
    enabled: enabled !== false && (!!driveId || !!siteId),
    staleTime: 1000 * 60 * 5,
  });
}
