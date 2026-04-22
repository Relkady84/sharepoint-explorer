import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/useAuth";
import { getSiteAllDrives } from "../api/sitesApi";

export function useDrives(siteId: string | null) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["drives", siteId],
    queryFn: async () => {
      const token = await getToken();
      return getSiteAllDrives(token, siteId!);
    },
    enabled: !!siteId,
    staleTime: 1000 * 60 * 10,
  });
}
