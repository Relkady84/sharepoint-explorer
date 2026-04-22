import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { loginRequest } from "./msalConfig";

export function useAuth() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  // Prefer the active account, fall back to first account in cache
  const account = instance.getActiveAccount() ?? accounts[0] ?? null;

  const login = () => {
    instance.loginRedirect({
      ...loginRequest,
      redirectStartPage: window.location.origin, // Always return to home, not /login
    }).catch(console.error);
  };

  const logout = () => {
    instance.logoutRedirect({ account }).catch(console.error);
  };

  const getToken = async (): Promise<string> => {
    if (!account) throw new Error("No account signed in");
    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account,
      });
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        await instance.acquireTokenRedirect({ ...loginRequest, account });
        return "";
      }
      throw error;
    }
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
