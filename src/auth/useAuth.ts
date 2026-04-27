import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { loginRequest } from "./msalConfig";

// ── Module-level token deduplication ──────────────────────────────────────────
// MSAL can only run one silent-iframe at a time. When multiple hooks call
// getToken() concurrently (Explorer + OneDrive + Departments all mounting
// together) the queued iframe requests time out with "monitor_window_timeout".
//
// Fix: keep ONE in-flight promise. Every concurrent caller awaits the same
// underlying acquireTokenSilent() call instead of each launching its own iframe.
// We also cache the returned token until 5 minutes before it expires so
// subsequent calls skip MSAL entirely.

interface TokenEntry {
  token: string;
  expiresAt: number; // ms since epoch
}

let _cache: TokenEntry | null = null;
let _inflight: Promise<string> | null = null;

const REFRESH_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry

export function useAuth() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  // Prefer the active account, fall back to first account in cache
  const account = instance.getActiveAccount() ?? accounts[0] ?? null;

  const login = () => {
    instance.loginRedirect({
      ...loginRequest,
      redirectStartPage: window.location.origin,
    }).catch(console.error);
  };

  const logout = () => {
    // Clear our cache on logout so a new account starts fresh
    _cache = null;
    _inflight = null;
    instance.logoutRedirect({ account }).catch(console.error);
  };

  const getToken = async (): Promise<string> => {
    if (!account) throw new Error("No account signed in");

    // 1. Return cached token if still fresh
    if (_cache && Date.now() < _cache.expiresAt - REFRESH_BUFFER_MS) {
      return _cache.token;
    }

    // 2. If a silent request is already in flight, piggyback on it
    if (_inflight) return _inflight;

    // 3. Start a new silent request — all concurrent callers will await this
    _inflight = (async () => {
      try {
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account,
        });
        _cache = {
          token: response.accessToken,
          expiresAt: response.expiresOn?.getTime() ?? Date.now() + 60 * 60 * 1000,
        };
        return response.accessToken;
      } catch (error) {
        // Clear stale cache on any error so next call retries cleanly
        _cache = null;
        if (error instanceof InteractionRequiredAuthError) {
          await instance.acquireTokenRedirect({ ...loginRequest, account });
          return "";
        }
        throw error;
      } finally {
        _inflight = null;
      }
    })();

    return _inflight;
  };

  return {
    isAuthenticated,
    account,
    login,
    logout,
    getToken,
    displayName: account?.name ?? account?.username ?? "User",
    email: account?.username ?? "",
  };
}
