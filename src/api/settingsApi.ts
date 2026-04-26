/**
 * settingsApi.ts
 * CRUD for the "AppSettings" SharePoint list.
 *
 * List shape (create manually in SharePoint, on the same site as AppPins):
 *   Title  – Single line of text (built-in)        → the setting KEY
 *   Value  – Single line of text (add this column) → the setting VALUE
 *
 * SECURITY: writes are gated by SharePoint ACL on the list, not by this code.
 * Restrict the AppSettings list to the admin group at the SharePoint level.
 * The `isAdmin` UI gate is a hint only.
 */

import { createGraphClient } from "./graphClient";

const LIST_NAME = "AppSettings";

// ── Setting keys & defaults ──────────────────────────────────────────────────

export type SettingKey = "explorerEnabled" | "oneDriveEnabled";

export const SETTING_DEFAULTS: Record<SettingKey, string> = {
  explorerEnabled: "true",
  oneDriveEnabled: "true",
};

export interface SettingItem {
  listItemId: string;
  key: SettingKey;
  value: string;
}

export interface SettingsMap {
  explorerEnabled: boolean;
  oneDriveEnabled: boolean;
}

export const DEFAULT_SETTINGS: SettingsMap = {
  explorerEnabled: true,
  oneDriveEnabled: true,
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
      key: (item.fields?.Title ?? "") as SettingKey,
      value: item.fields?.[valueField] ?? "",
    }))
    .filter((s) => !!s.key);
}

export function settingsToMap(items: SettingItem[]): SettingsMap {
  const byKey: Record<string, string> = {};
  for (const it of items) byKey[it.key] = it.value;
  return {
    explorerEnabled: toBool(byKey.explorerEnabled ?? SETTING_DEFAULTS.explorerEnabled),
    oneDriveEnabled: toBool(byKey.oneDriveEnabled ?? SETTING_DEFAULTS.oneDriveEnabled),
  };
}

// ── Write (create-or-update) ─────────────────────────────────────────────────

/**
 * Upsert: if an item with this Title (key) exists, patch its Value;
 * otherwise create a new item.
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
