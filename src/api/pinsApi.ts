/**
 * pinsApi.ts
 * CRUD operations for the "AppPins" SharePoint list.
 *
 * List columns (create these manually in SharePoint):
 *   Title      – Single line of text  (built-in, display label)
 *   DriveId    – Single line of text  (drive ID)
 *   ItemId     – Single line of text  (item ID)
 *   AssignedTo – Multiple lines of text (one email per line or comma-separated,
 *                or empty / "everyone" / "*" to show to all users)
 *
 * Note: SharePoint may assign internal names different from display names
 * (e.g. "AssignedTo" display → "AssignedTo0" internal if there's a collision).
 * This file resolves actual internal names at runtime so column renames are
 * handled automatically.
 */

import { createGraphClient } from "./graphClient";

const LIST_NAME = "AppPins";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AppPin {
  listItemId: string;
  label: string;
  driveId: string;
  itemId: string;
  assignedTo: string;
}

// ── Session-scoped caches ─────────────────────────────────────────────────────

const listIdCache: Record<string, string> = {};

interface FieldMap {
  driveId: string;
  itemId: string;
  assignedTo: string;
}
const fieldMapCache: Record<string, FieldMap> = {};

// ── List ID ───────────────────────────────────────────────────────────────────

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
      `La liste SharePoint "${LIST_NAME}" est introuvable sur ce site. ` +
      `Créez-la d'abord (voir les instructions dans l'application).`
    );
  }
  listIdCache[siteId] = found.id;
  return found.id;
}

// ── Field name resolution ─────────────────────────────────────────────────────
// SharePoint may give custom columns internal names different from their
// display names (e.g. "AssignedTo" → "AssignedTo0" if a built-in field
// already uses that internal name). We query the field schema once per session
// and map display names → internal names.

async function getFieldMap(token: string, siteId: string, listId: string): Promise<FieldMap> {
  if (fieldMapCache[listId]) return fieldMapCache[listId];

  const client = createGraphClient(token);
  const res = await client.get<{ value: { name: string; displayName: string }[] }>(
    `/sites/${siteId}/lists/${listId}/columns?$select=name,displayName&$top=200`
  );

  const fields = res.data.value;
  const find = (displayName: string): string => {
    const match = fields.find(
      (f) => f.displayName.toLowerCase() === displayName.toLowerCase()
    );
    if (!match) {
      throw new Error(
        `Colonne "${displayName}" introuvable dans la liste AppPins. ` +
        `Vérifiez qu'elle existe bien dans SharePoint.`
      );
    }
    return match.name; // internal name used by the API
  };

  const map: FieldMap = {
    driveId:    find("DriveId"),
    itemId:     find("ItemId"),
    assignedTo: find("AssignedTo"),
  };

  fieldMapCache[listId] = map;
  return map;
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function fetchAllPins(token: string, siteId: string): Promise<AppPin[]> {
  const listId = await getListId(token, siteId);
  const fm = await getFieldMap(token, siteId, listId);
  const client = createGraphClient(token);

  const res = await client.get<{
    value: { id: string; fields: Record<string, string> }[];
  }>(`/sites/${siteId}/lists/${listId}/items?expand=fields&$top=500`);

  return res.data.value
    .map((item) => ({
      listItemId: item.id,
      label:      item.fields?.Title        ?? "",
      driveId:    item.fields?.[fm.driveId]    ?? "",
      itemId:     item.fields?.[fm.itemId]     ?? "",
      assignedTo: item.fields?.[fm.assignedTo] ?? "",
    }))
    .filter((p) => p.driveId && p.itemId);
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createAppPin(
  token: string,
  siteId: string,
  pin: Omit<AppPin, "listItemId">
): Promise<AppPin> {
  const listId = await getListId(token, siteId);
  const fm = await getFieldMap(token, siteId, listId);
  const client = createGraphClient(token);

  const res = await client.post<{ id: string }>(
    `/sites/${siteId}/lists/${listId}/items`,
    {
      fields: {
        Title:       pin.label,
        [fm.driveId]:    pin.driveId,
        [fm.itemId]:     pin.itemId,
        [fm.assignedTo]: pin.assignedTo,
      },
    }
  );
  return { ...pin, listItemId: res.data.id };
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateAppPin(
  token: string,
  siteId: string,
  pin: AppPin
): Promise<void> {
  const listId = await getListId(token, siteId);
  const fm = await getFieldMap(token, siteId, listId);
  const client = createGraphClient(token);

  await client.patch(
    `/sites/${siteId}/lists/${listId}/items/${pin.listItemId}/fields`,
    {
      Title:           pin.label,
      [fm.driveId]:    pin.driveId,
      [fm.itemId]:     pin.itemId,
      [fm.assignedTo]: pin.assignedTo,
    }
  );
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteAppPin(
  token: string,
  siteId: string,
  listItemId: string
): Promise<void> {
  const listId = await getListId(token, siteId);
  const client = createGraphClient(token);
  await client.delete(`/sites/${siteId}/lists/${listId}/items/${listItemId}`);
}
