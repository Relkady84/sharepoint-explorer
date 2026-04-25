import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/useAuth";
import { fetchSharedWithMe, fetchMyDriveChildren } from "../api/onedriveApi";

export function useSharedWithMe() {
  const { getToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["sharedWithMe"],
    queryFn: async () => {
      const token = await getToken();
      return fetchSharedWithMe(token);
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
}

export function useMyDriveChildren(itemId: string | null) {
  const { getToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["myDrive", itemId ?? "root"],
    queryFn: async () => {
      const token = await getToken();
      return fetchMyDriveChildren(token, itemId);
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
  });
}
