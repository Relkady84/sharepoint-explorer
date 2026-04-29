import { createGraphClient } from "./graphClient";

export interface GroupResult {
  id: string;
  name: string;
}

/**
 * Search tenant Microsoft 365 / Azure AD groups by display name prefix.
 * Requires Group.Read.All (or GroupMember.Read.All) delegated scope.
 */
export async function searchGroups(token: string, query: string): Promise<GroupResult[]> {
  const client = createGraphClient(token);

  // Escape backslash and double-quote to prevent $search injection
  const safe = query.replace(/[\\"]/g, "\\$&");
  const search = encodeURIComponent(`"displayName:${safe}"`);

  const res = await client.get<{
    value: { id: string; displayName: string }[];
  }>(
    `/groups?$search=${search}&$select=id,displayName&$top=10`,
    { headers: { ConsistencyLevel: "eventual" } }
  );

  return res.data.value
    .map((g) => ({ id: g.id, name: g.displayName ?? "" }))
    .filter((g) => g.name.length > 0);
}
