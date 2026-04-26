import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/useAuth";
import { useNavigationStore } from "../store/navigationStore";
import {
  fetchAllSettings,
  settingsToMap,
  upsertSetting,
  DEFAULT_SETTINGS,
  type SettingKey,
  type SettingItem,
  type SettingsMap,
} from "../api/settingsApi";

interface UseAppSettingsResult {
  settings: SettingsMap;
  rawItems: SettingItem[];
  isLoading: boolean;
  /** True when the AppSettings list does not exist on the current site. */
  isMissingList: boolean;
  /** Other (non-missing-list) load errors. */
  error: Error | null;
  /** Update one setting. Optimistic via react-query invalidation. */
  update: (key: SettingKey, value: string) => Promise<void>;
  isUpdating: boolean;
}

/**
 * Hook for the tenant-wide AppSettings stored in a SharePoint list.
 * Falls back to DEFAULT_SETTINGS when the list is missing or empty so the
 * rest of the app keeps working before the admin sets anything up.
 */
export function useAppSettings(): UseAppSettingsResult {
  const { getToken } = useAuth();
  const { siteId } = useNavigationStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["appSettings", siteId],
    queryFn: async () => {
      const token = await getToken();
      return fetchAllSettings(token, siteId!);
    },
    enabled: !!siteId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const errMsg = (query.error as Error | undefined)?.message ?? "";
  const isMissingList =
    !!query.error && (errMsg.includes("introuvable") || errMsg.includes("AppSettings"));

  const rawItems = query.data ?? [];
  const settings: SettingsMap = query.data
    ? settingsToMap(rawItems)
    : { ...DEFAULT_SETTINGS };

  const mutation = useMutation({
    mutationFn: async ({ key, value }: { key: SettingKey; value: string }) => {
      const token = await getToken();
      await upsertSetting(token, siteId!, key, value, rawItems);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appSettings", siteId] });
    },
  });

  return {
    settings,
    rawItems,
    isLoading: query.isLoading,
    isMissingList,
    error: !isMissingList && query.error ? (query.error as Error) : null,
    update: async (key, value) => {
      await mutation.mutateAsync({ key, value });
    },
    isUpdating: mutation.isPending,
  };
}
