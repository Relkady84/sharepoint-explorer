import { createGraphClient } from "./graphClient";

export interface UserResult {
  name: string;
  email: string;
}

/**
 * Search tenant users by display name or email prefix.
 * Requires User.ReadBasic.All scope + ConsistencyLevel: eventual header.
 */
export async function searchUsers(token: string, query: string): Promise<UserResult[]> {
  const client = createGraphClient(token);

  const res = await client.get<{
    value: { displayName: string; mail: string; userPrincipalName: string }[];
  }>(
    `/users?$search="displayName:${query}"&$select=displayName,mail,userPrincipalName&$top=10&$orderby=displayName`,
    { headers: { ConsistencyLevel: "eventual" } }
  );

  return res.data.value
    .map((u) => ({
      name: u.displayName ?? "",
      email: (u.mail ?? u.userPrincipalName ?? "").toLowerCase(),
    }))
    .filter((u) => u.email.length > 0);
}
