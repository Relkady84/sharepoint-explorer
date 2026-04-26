/**
 * settingsApi.ts
 * CRUD for the "AppSettings" SharePoint list.
 *
 * List shape (create manually in SharePoint, on the same site as AppPins):
 *   Title  – Single line of text (built-in)        → the setting KEY
 *   Value  – Single line of text (add this column) → the setting VALUE
 *
 * Allowed-sites storage: each allowed site is stored as a SEPARATE list item
 * with Title = "allowedSite" and Value = the full site ID.  This avoids the
 * 255-character limit of a single-line-text field that would be hit when
 * storing many site IDs concatenated.  An empty set of allowedSite items means
 * every accessible site is visible (the default).
 *
 * SECURITY: writes are gated by SharePoint ACL on the list, not by this code.
 */

import { createGraphClient } from "./graphClient";

const LIST_NAME = "AppSettings";

// ── Setting keys & defaults ──────────────────────────────────────────────────

/** Keys stored as unique single-value items (Title is unique for these). */
export type SettingKey = "explorerEnabled" | "oneDriveEnabled";

/** Repeatable key — one list item per allowed site. */
const ALLOWED_SITE_KEY = "allowedSite";

export const SETTING_DEFAULTS: Record<SettingKey, string> = {
  explorerEnabled: "true",
  oneDriveEnabled: "true",
};

export interface SettingItem {
  listItemId: string;
  key: string; // SettingKey | "allowedSite"
  value: string;
}

export interface SettingsMap {
  explorerEnabled: boolean;
  oneDriveEnabled: boolean;
  /**
   * Site IDs non-admins can see in the site picker.
   * Empty array = all accessible sites are visible (default).
   */
  allowedSites: string[];
}

export const DEFAULT_SETTINGS: SettingsMap = {
  explorerEnabled: true,
  oneDriveEnabled: true,
  allowedSites: [],
};

function toBool(s: string | undefined): boolean {
  if (!s) return false;
  return s.trim().toLowerCase() === "true";
}

// ── Caches (per session) ─────────────────────────────────────────────────────

const listIdCache: Record<string, string> = {};
const valueFieldCache: Record<string, string> = {};

// ── List resolution ──────────────────────────────────────────────────────────

async function getListId(token: string, siteId: string): Promise<string> {
  if (listIdCache[siteId]) return listIdCache[siteId];
  const client = createGraphClient(token);
  const res = await client.get<{ value: { id: string; displayName: string }[] }>(
    `/sites/${siteId}/lists?$select=id,displayName&$top=200`
  );
  const found = res.data.value.find(
    (l) => l.displayName.toLowerCase() === LIST_NAME.toLowerCase()
  );
  if (!found) {
    throw new Error(
      `La liste SharePoint "${LIST_NAME}" est introuvable sur ce site.`
    );
  }
  listIdCache[siteId] = found.id;
  return found.id;
}

async function getValueFieldName(
  token: string,
  siteId: string,
  listId: string
): Promise<string> {
  if (valueFieldCache[listId]) return valueFieldCache[listId];
  const client = createGraphClient(token);
  const res = await client.get<{ value: { name: string; displayName: string }[] }>(
    `/sites/${siteId}/lists/${listId}/columns?$select=name,displayName&$top=200`
  );
  const match = res.data.value.find(
    (f) => f.displayName.toLowerCase() === "value"
  );
  if (!match) {
    throw new Error(
      `Colonne "Value" introuvable dans la liste ${LIST_NAME}.`
    );
  }
  valueFieldCache[listId] = match.name;
  return match.name;
}

// ── Read ─────────────────────────────────────────────────────────────────────

export async function fetchAllSettings(
  token: string,
  siteId: string
): Promise<SettingItem[]> {
  const listId = await getListId(token, siteId);
  const valueField = await getValueFieldName(token, siteId, listId);
  const client = createGraphClient(token);

  const res = await client.get<{
    value: { id: string; fields: Record<string, string> }[];
  }>(`/sites/${siteId}/lists/${listId}/items?expand=fields&$top=200`);

  return res.data.value
    .map((item) => ({
      listItemId: item.id,
      key: item.fields?.Title ?? "",
      value: item.fields?.[valueField] ?? "",
    }))
    .filter((s) => !!s.key);
}

export function settingsToMap(items: SettingItem[]): SettingsMap {
  const byKey: Record<string, string> = {};
  for (const it of items) {
    if (it.key !== ALLOWED_SITE_KEY) byKey[it.key] = it.value;
  }
  const allowedSites = items
    .filter((it) => it.key === ALLOWED_SITE_KEY)
    .map((it) => it.value)
    .filter(Boolean);
  return {
    explorerEnabled: toBool(byKey.explorerEnabled ?? SETTING_DEFAULTS.explorerEnabled),
    oneDriveEnabled: toBool(byKey.oneDriveEnabled ?? SETTING_DEFAULTS.oneDriveEnabled),
    allowedSites,
  };
}

// ── Write (create-or-update for scalar settings) ─────────────────────────────

/**
 * Upsert a scalar setting (explorerEnabled / oneDriveEnabled).
 * Creates a new list item when the key doesn't exist yet; patches otherwise.
 */
export async function upsertSetting(
  token: string,
  siteId: string,
  key: SettingKey,
  value: string,
  existing: SettingItem[]
): Promise<void> {
  const listId = await getListId(token, siteId);
  const valueField = await getValueFieldName(token, siteId, listId);
  const client = createGraphClient(token);

  const found = existing.find((s) => s.key === key);
  if (found) {
    await client.patch(
      `/sites/${siteId}/lists/${listId}/items/${found.listItemId}/fields`,
      { [valueField]: value }
    );
  } else {
    await client.post(`/sites/${siteId}/lists/${listId}/items`, {
      fields: { Title: key, [valueField]: value },
    });
  }
}

// ── Write (allowed sites — multi-item) ───────────────────────────────────────

/**
 * Replace the full set of allowed-site entries atomically.
 *
 * Each allowed site is stored as a separate list item with
 *   Title = "allowedSite"
 *   Value = <full Graph site ID>
 *
 * This avoids the 255-character field limit that would be hit when
 * storing many site IDs in a single comma-separated value.
 *
 * @param newSiteIds  IDs to allow.  Pass [] to allow every site (remove all
 *                    restrictions — no allowedSite items in the list).
 */
export async function setAllowedSites(
  token: string,
  siteId: string,
  newSiteIds: string[],
  existing: SettingItem[]
): Promise<void> {
  const listId = await getListId(token, siteId);
  const valueField = await getValueFieldName(token, siteId, listId);
  const client = createGraphClient(token);

  // 1. Delete all existing allowedSite items
  const oldItems = existing.filter((it) => it.key === ALLOWED_SITE_KEY);
  for (const item of oldItems) {
    await client.delete(
      `/sites/${siteId}/lists/${listId}/items/${item.listItemId}`
    );
  }

  // 2. Create one item per allowed site (skip when "all visible")
  for (const allowedId of newSiteIds) {
    await client.post(`/sites/${siteId}/lists/${listId}/items`, {
      fields: { Title: ALLOWED_SITE_KEY, [valueField]: allowedId },
    });
  }
}
