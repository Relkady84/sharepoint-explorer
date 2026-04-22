import { Configuration, LogLevel } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    // Auto-detects: localhost:5173 in dev, production URL in prod
    redirectUri: window.location.origin,
    postLogoutRedirectUri: "/",
  },
  cache: {
    cacheLocation: "localStorage",   // persists across redirect — prevents login loops
    storeAuthStateInCookie: true,     // fallback for Safari / browsers that block storage
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (level === LogLevel.Error) console.error("[MSAL]", message);
        if (level === LogLevel.Warning) console.warn("[MSAL]", message);
      },
    },
  },
};

/** Scopes requested at login — covers reading files and user profile */
export const loginRequest = {
  scopes: [
    "User.Read",
    "Sites.Read.All",
    "Files.ReadWrite.All",
    "offline_access",
  ],
};
