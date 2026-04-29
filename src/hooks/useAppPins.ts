import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMsal } from "@azure/msal-react";
import { useAuth } from "../auth/useAuth";
import { useNavigationStore } from "../store/navigationStore";
import {
  fetchAllPins,
  createAppPin,
  updateAppPin,
  deleteAppPin,
  type AppPin,
} from "../api/pinsApi";
import { createGraphClient } from "../api/graphClient";
import { useAppSettings } from "./useAppSettings";

export type { AppPin };

// ── Admin list (set VITE_ADMIN_EMAILS=a@b.com,c@d.com in .env) ───────────────
//
// SECURITY: this is a UX hint only — it hides admin UI from non-admins. It is
// NOT an authorization boundary. The SPA holds a Sites.ReadWrite.All token, so
// any authenticated tenant user could call createAppPin / updateAppPin /
// deleteAppPin directly via Graph. Real enforcement must live on the AppPins
// SharePoint list itself (break inheritance, grant Edit only to the admin
// group). Do not add sensitive checks behind `isAdmin`.

const ADMIN_EMAILS: string[] = (import.meta.env.VITE_ADMIN_EMAILS ?? "")
  .split(/[,;]/)
  .map((s: string) => s.trim().toLowerCase())
  .filter(Boolean);

// ── Current user helpers ──────────────────────────────────────────────────────

export function useCurrentUserEmail(): string {
  const { accounts } = useMsal();
  return (accounts[0]?.username ?? "").toLowerCase();
}

export function useIsAdmin(): boolean {
  const email = useCurrentUserEmail();
  const { settings } = useAppSettings();

  // Env-var admins (compile-time, always available)
  const envAdmin = ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(email);

  // SharePoint-stored admins (dynamic, loaded async)
  const spAdmin = (settings.adminEmails ?? []).includes(email);

  return envAdmin || spAdmin;
}

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useAppPins() {
  const { getToken } = useAuth();
  const { siteId } = useNavigationStore();
  const userEmail = useCurrentUserEmail();
  const isAdmin = useIsAdmin();
  const queryClient = useQueryClient();

  // ── Fetch all pins from the SharePoint list ──
  const query = useQuery({
    queryKey: ["appPins", siteId],
    queryFn: async () => {
      const token = await getToken();
      return fetchAllPins(token, siteId!);
    },
    enabled: !!siteId,
    staleTime: 1000 * 60 * 5, // 5 min
    retry: 1,
  });

  const allPins = query.data ?? [];

  // ── Fetch the current user's group memberships (for group-based pin visibility) ──
  const memberOfQuery = useQuery({
    queryKey: ["memberOf"],
    queryFn: async () => {
      const token = await getToken();
      const client = createGraphClient(token);
      const res = await client.get<{ value: { id: string }[] }>(
        "/me/memberOf?$select=id&$top=999"
      );
      return new Set(res.data.value.map((g) => g.id));
    },
    staleTime: 1000 * 60 * 10, // 10 min
  });
  const userGroupIds = memberOfQuery.data ?? new Set<string>();

  // ── Pins the current user should see ──
  const myPins = useMemo(() => {
    return allPins.filter((pin) => {
      // Strip HTML tags — SharePoint "Multiple lines of text" columns can return
      // values wrapped in <div>/<p> tags if rich text is enabled on the column.
      const stripped = pin.assignedTo.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ");
      const raw = stripped.trim().toLowerCase();
      // empty / wildcard → visible to everyone
      if (!raw || raw === "everyone" || raw === "*" || raw === "all") return true;
      // Split on comma / semicolon / newline / whitespace
      const entries = raw.split(/[,;\n\r\s]+/).map((s) => s.trim()).filter(Boolean);
      return entries.some((entry) => {
        // Group entry format: grp:{objectId}:{displayName} (case-insensitive stored)
        if (entry.startsWith("grp:")) {
          const groupId = entry.split(":")[1] ?? "";
          return userGroupIds.has(groupId);
        }
        return entry === userEmail;
      });
    });
  }, [allPins, userEmail, userGroupIds]);

  // ── Mutations ──

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["appPins", siteId] });

  const create = useMutation({
    mutationFn: async (pin: Omit<AppPin, "listItemId">) => {
      const token = await getToken();
      return createAppPin(token, siteId!, pin);
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async (pin: AppPin) => {
      const token = await getToken();
      return updateAppPin(token, siteId!, pin);
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (listItemId: string) => {
      const token = await getToken();
      return deleteAppPin(token, siteId!, listItemId);
    },
    onSuccess: invalidate,
  });

  return {
    /** Pins visible to the current user (filtered by AssignedTo) */
    myPins,
    /** All pins in the list — for admin use only */
    allPins,
    isLoading: query.isLoading,
    error: query.error,
    userEmail,
    isAdmin,
    create,
    update,
    remove,
  };
}
