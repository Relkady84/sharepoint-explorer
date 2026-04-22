import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { Spinner, makeStyles, tokens, Text } from "@fluentui/react-components";
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

const useStyles = makeStyles({
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    height: "100vh",
    backgroundColor: tokens.colorNeutralBackground2,
  },
});

interface AuthGuardProps {
  children: ReactNode;
}

// MSAL states where we must NOT make auth decisions yet
const LOADING_STATES = new Set<string>([
  InteractionStatus.Startup,
  InteractionStatus.HandleRedirect,
  InteractionStatus.Login,
  InteractionStatus.AcquireToken,
  InteractionStatus.SsoSilent,
]);

export function AuthGuard({ children }: AuthGuardProps) {
  const styles = useStyles();
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();

  // Wait for MSAL to finish processing before making any auth decision
  if (LOADING_STATES.has(inProgress)) {
    return (
      <div className={styles.loading}>
        <Spinner size="large" />
        <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
          {inProgress === InteractionStatus.HandleRedirect
            ? "Completing sign-in..."
            : "Loading..."}
        </Text>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
