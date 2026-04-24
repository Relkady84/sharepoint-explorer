/**
 * pinsApi.ts
 * CRUD operations for the "AppPins" SharePoint list.
 *
 * List columns (create these manually in SharePoint):
 *   Title      – Single line of text  (display label)
 *   DriveId    – Single line of text  (drive ID)
 *   ItemId     – Single line of text  (item ID)
 *   AssignedTo – Multiple lines of text (one email per line or comma-separated,
 *                or empty / "everyone" / "*" to show to all users)
 */

import { createGraphClient } from "./graphClient";

const LIST_NAME = "AppPins";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AppPin {
  listItemId: string; // SharePoint list item ID (used for update / delete)
  label: string;
  driveId: string;
  itemId: string;
  assignedTo: string; // raw value from the list column
}

// ── List-ID cache (per siteId, reset on page refresh) ────────────────────────

const listIdCache: Record<string, string> = {};

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

// ── Read ─────────────────────────────────────────────────────────────────────

export async function fetchAllPins(token: string, siteId: string): Promise<AppPin[]> {
  const listId = await getListId(token, siteId);
  const client = createGraphClient(token);

  const res = await client.get<{
    value: { id: string; fields: Record<string, string> }[];
  }>(`/sites/${siteId}/lists/${listId}/items?expand=fields&$top=500`);

  return res.data.value
    .map((item) => ({
      listItemId: item.id,
      label: item.fields?.Title ?? "",
      driveId: item.fields?.DriveId ?? "",
      itemId: item.fields?.ItemId ?? "",
      assignedTo: item.fields?.AssignedTo ?? "",
    }))
    .filter((p) => p.driveId && p.itemId); // skip malformed / config rows
}

// ── Create ───────────────────────────────────────────────────────────────────

export async function createAppPin(
  token: string,
  siteId: string,
  pin: Omit<AppPin, "listItemId">
): Promise<AppPin> {
  const listId = await getListId(token, siteId);
  const client = createGraphClient(token);

  const res = await client.post<{ id: string }>(
    `/sites/${siteId}/lists/${listId}/items`,
    {
      fields: {
        Title: pin.label,
        DriveId: pin.driveId,
        ItemId: pin.itemId,
        AssignedTo: pin.assignedTo,
      },
    }
  );
  return { ...pin, listItemId: res.data.id };
}

// ── Update ───────────────────────────────────────────────────────────────────

export async function updateAppPin(
  token: string,
  siteId: string,
  pin: AppPin
): Promise<void> {
  const listId = await getListId(token, siteId);
  const client = createGraphClient(token);

  await client.patch(`/sites/${siteId}/lists/${listId}/items/${pin.listItemId}/fields`, {
    Title: pin.label,
    DriveId: pin.driveId,
    ItemId: pin.itemId,
    AssignedTo: pin.assignedTo,
  });
}

// ── Delete ───────────────────────────────────────────────────────────────────

export async function deleteAppPin(
  token: string,
  siteId: string,
  listItemId: string
): Promise<void> {
  const listId = await getListId(token, siteId);
  const client = createGraphClient(token);
  await client.delete(`/sites/${siteId}/lists/${listId}/items/${listItemId}`);
}
