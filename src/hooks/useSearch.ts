import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/useAuth";
import { searchDrive } from "../api/searchApi";

export function useSearch(driveId: string | null, query: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["search", driveId, query],
    queryFn: async () => {
      const token = await getToken();
      return searchDrive(token, driveId!, query);
    },
    enabled: !!driveId && query.trim().length >= 2,
    staleTime: 1000 * 30, // 30 seconds
  });
}
