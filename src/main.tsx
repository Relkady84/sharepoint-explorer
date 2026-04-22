import React from "react";
import ReactDOM from "react-dom/client";
import { PublicClientApplication, EventType } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { msalConfig } from "./auth/msalConfig";
import App from "./App";
import "./index.css";

const msalInstance = new PublicClientApplication(msalConfig);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

async function bootstrap() {
  // Step 1: Initialize MSAL (required in v3)
  await msalInstance.initialize();

  // Step 2: Handle the redirect response BEFORE React renders.
  // This is the key fix — by the time React mounts, the account is already set.
  try {
    const redirectResult = await msalInstance.handleRedirectPromise();
    if (redirectResult?.account) {
      msalInstance.setActiveAccount(redirectResult.account);
    }
  } catch (error) {
    console.error("Redirect handling error:", error);
  }

  // Step 3: If no active account, pick the first cached account
  if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
    msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
  }

  // Step 4: Keep active account in sync on future logins
  msalInstance.addEventCallback((event) => {
    if (
      event.eventType === EventType.LOGIN_SUCCESS &&
      event.payload &&
      "account" in event.payload &&
      event.payload.account
    ) {
      msalInstance.setActiveAccount(event.payload.account);
    }
  });

  // Step 5: Now render React — MSAL is fully ready, account is set
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <QueryClientProvider client={queryClient}>
          <FluentProvider theme={webLightTheme}>
            <App />
          </FluentProvider>
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </MsalProvider>
    </React.StrictMode>
  );
}

bootstrap().catch(console.error);
