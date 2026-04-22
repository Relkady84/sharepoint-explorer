import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/useAuth";
import { listSites } from "../api/sitesApi";

export function useSites() {
  const { getToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const token = await getToken();
      return listSites(token);
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
