import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useAuth } from "../auth/useAuth";
import { useNavigationStore } from "../store/navigationStore";
import {
  fetchAllSettings,
  settingsToMap,
  upsertSetting,
  setAllowedSites,
  setAdminEmails,
  DEFAULT_SETTINGS,
  type SettingKey,
  type SettingItem,
  type SettingsMap,
} from "../api/settingsApi";

// ── Persist last-known settings across site switches ─────────────────────────
// The admin configures settings on one site. When the user browses a different
// site (which may not have the AppSettings list at all), we fall back to the
// last cached settings instead of the all-enabled defaults. This prevents tabs
// that the admin disabled from reappearing whenever the user changes sites.

const SETTINGS_CACHE_KEY = "appSettingsCache";

function readCachedSettings(): SettingsMap | null {
  try {
    const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SettingsMap>;
    if (
      typeof parsed.explorerEnabled === "boolean" &&
      typeof parsed.oneDriveEnabled === "boolean"
    ) {
      return {
        explorerEnabled: parsed.explorerEnabled,
        oneDriveEnabled: parsed.oneDriveEnabled,
        allowedSites: Array.isArray(parsed.allowedSites) ? parsed.allowedSites : [],
        adminEmails: Array.isArray(parsed.adminEmails) ? parsed.adminEmails : [],
      };
    }
  } catch {
    // ignore
  }
  return null;
}

function writeCachedSettings(s: SettingsMap) {
  try {
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

interface UseAppSettingsResult {
  settings: SettingsMap;
  rawItems: SettingItem[];
  isLoading: boolean;
  /** True when the AppSettings list does not exist on the current site. */
  isMissingList: boolean;
  /** Other (non-missing-list) load errors. */
  error: Error | null;
  /** Update a scalar setting (explorerEnabled / oneDriveEnabled). */
  update: (key: SettingKey, value: string) => Promise<void>;
  /**
   * Replace the full allowed-sites list.
   * Pass [] to remove all restrictions (every site becomes visible).
   */
  updateAllowedSites: (siteIds: string[]) => Promise<void>;
  updateAdminEmails: (emails: string[]) => Promise<void>;
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
      const items = await fetchAllSettings(token, siteId!);
      // Persist whenever we load successfully so other sites use these values
      writeCachedSettings(settingsToMap(items));
      return items;
    },
    enabled: !!siteId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    // While switching sites keep showing the previous site's settings instead
    // of flashing back to all-enabled defaults during the loading transition.
    placeholderData: keepPreviousData,
  });

  const errMsg = (query.error as Error | undefined)?.message ?? "";
  const isMissingList =
    !!query.error && (errMsg.includes("introuvable") || errMsg.includes("AppSettings"));

  const rawItems = query.data ?? [];
  // Priority: loaded data → last-cached settings → hard defaults
  const settings: SettingsMap = query.data
    ? settingsToMap(rawItems)
    : (readCachedSettings() ?? { ...DEFAULT_SETTINGS });

  const mutation = useMutation({
    mutationFn: async ({ key, value }: { key: SettingKey; value: string }) => {
      const token = await getToken();
      await upsertSetting(token, siteId!, key, value, rawItems);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appSettings", siteId] });
    },
  });

  const sitesMutation = useMutation({
    mutationFn: async (newSiteIds: string[]) => {
      const token = await getToken();
      await setAllowedSites(token, siteId!, newSiteIds, rawItems);
      return newSiteIds; // pass to onSuccess
    },
    onSuccess: (savedIds) => {
      // Optimistically patch the cached SettingItem[] so the UI shows the
      // correct checkboxes immediately, before the background refetch lands.
      queryClient.setQueryData<SettingItem[]>(["appSettings", siteId], (old) => {
        if (!old) return old;
        const withoutAllowed = old.filter((it) => it.key !== "allowedSite");
        const newAllowed: SettingItem[] = savedIds.map((id, i) => ({
          listItemId: `opt-${i}`,
          key: "allowedSite",
          value: id,
        }));
        return [...withoutAllowed, ...newAllowed];
      });
      queryClient.invalidateQueries({ queryKey: ["appSettings", siteId] });
    },
  });

  const adminEmailsMutation = useMutation({
    mutationFn: async (newEmails: string[]) => {
      const token = await getToken();
      await setAdminEmails(token, siteId!, newEmails, rawItems);
      return newEmails;
    },
    onSuccess: (savedEmails) => {
      queryClient.setQueryData<SettingItem[]>(["appSettings", siteId], (old) => {
        if (!old) return old;
        const without = old.filter(it => it.key !== "adminEmail");
        const newItems: SettingItem[] = savedEmails.map((e, i) => ({
          listItemId: `opt-admin-${i}`,
          key: "adminEmail",
          value: e,
        }));
        return [...without, ...newItems];
      });
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
    updateAllowedSites: async (ids) => {
      await sitesMutation.mutateAsync(ids);
    },
    updateAdminEmails: async (emails: string[]) => {
      await adminEmailsMutation.mutateAsync(emails);
    },
    isUpdating: mutation.isPending || sitesMutation.isPending || adminEmailsMutation.isPending,
  };
}
