import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/useAuth";
import { uploadFile } from "../api/uploadApi";

interface UploadParams {
  driveId: string;
  parentItemId: string;
  siteId: string;
  file: File;
  onProgress?: (percent: number) => void;
}

export function useUpload() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ driveId, parentItemId, file, onProgress }: UploadParams) => {
      const token = await getToken();
      return uploadFile(token, driveId, parentItemId, file, onProgress);
    },
    onSuccess: (_data, variables) => {
      // Invalidate the current folder's items to show the new file
      queryClient.invalidateQueries({
        queryKey: ["driveItems", variables.siteId, variables.driveId],
      });
    },
  });
}
